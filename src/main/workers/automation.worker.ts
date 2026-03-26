/**
 * Automation Worker - Ejecuta Playwright en un hilo separado
 * para no bloquear el Event Loop del proceso Main de Electron.
 */
import { parentPort, workerData } from 'worker_threads';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import type {
  Credentials,
  CSVRow,
  TimeSlot,
  AccountMappings,
  TimeEntry,
  AutomationProgress,
  LogEntry,
  AppConfig
} from '../../common/types.js';
import { militaryToStandard, delay, normalizeAccountCode } from '../../common/utils.js';
import { SPECIAL_ACCOUNTS, PLAYWRIGHT_TIMEOUTS } from '../../common/constants.js';
import { withNetworkRetry } from '../../common/retry.js';
import { getChromiumLaunchOptions } from '../utils/index.js';

// === SELECTORES REUTILIZABLES ===
const SELECTORS = {
  // Replicon
  REPLICON_LINK: [
    'a[aria-label*="Replicon"]',
    'a[aria-label="launch app Replicon"]',
    'a[href*="replicon"]',
  ],
  TIMESHEET: [
    'timesheet-card li',
    'current-timesheet-card-item li',
    '.timesheet-card li',
  ],
  // Navegación de mes
  TIMESHEET_PERIOD_INPUT: ".timesheetPeriod input[type='hidden']",
  PREVIOUS_PERIOD: [
    ".timesheetPeriod a[title='Previous Timesheet']",
    ".timesheetPeriod .iconPrevious",
  ],
  NEXT_PERIOD: [
    ".timesheetPeriod a[title='Next Timesheet']",
    ".timesheetPeriod .iconNext",
  ],
  // Popup de entrada de tiempo
  TIME_INPUT: [
    "xpath=//table[@class='fieldTable fieldTableNarrow']//input[@class='time']",
    "input.time",
  ],
  PROJECT_DROPDOWN: [
    "a.divDropdown.multiLevelSelector",
    "a.divDropdown",
  ],
  OK_BUTTON: "xpath=//*[@class='contextPopupNode editPunchDialog']//*[@class='buttonRow']//input[1]",
  CHECKOUT: [
    "xpath=//*[@class='componentPunchSegment combinedInput']//a[2][count(span)=1]",
    "xpath=//div[contains(@class,'combinedInput')]//a[2]",
    ".componentPunchSegment.combinedInput a:nth-child(2)",
  ],
};

// Tipos de mensajes entre Worker y Main
export type WorkerMessage =
  | { type: 'progress'; data: AutomationProgress }
  | { type: 'log'; data: LogEntry }
  | { type: 'complete'; data: { success: boolean } }
  | { type: 'error'; data: { error: string } }
  | { type: 'ready' };

export interface WorkerData {
  credentials: Credentials;
  csvData: CSVRow[];
  horarios: TimeSlot[];
  mappings: AccountMappings;
  config: AppConfig;
  selectedMonth: { year: number; month: number };
}

class PlaywrightWorkerAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: AppConfig;
  private isPaused: boolean = false;
  private isStopped: boolean = false;
  private currentProgress: AutomationProgress | null = null;
  private selectedMonth: { year: number; month: number } | null = null;

  constructor(config: AppConfig) {
    this.config = config;
  }

  private sendMessage(message: WorkerMessage) {
    parentPort?.postMessage(message);
  }

  private log(level: LogEntry['level'], message: string) {
    this.sendMessage({
      type: 'log',
      data: {
        timestamp: new Date(),
        level,
        message,
      },
    });
  }

  private updateProgress(progress: Partial<AutomationProgress>) {
    const base: AutomationProgress =
      this.currentProgress ??
      ({
        status: 'running',
        currentDay: 0,
        totalDays: 0,
        currentEntry: 0,
        totalEntries: 0,
        message: '',
        logs: [],
      } satisfies AutomationProgress);

    const next: AutomationProgress = {
      ...base,
      ...progress,
      status: this.isPaused ? 'paused' : (progress.status ?? base.status),
    };

    this.currentProgress = next;
    this.sendMessage({ type: 'progress', data: next });
  }

  async start(
    credentials: Credentials,
    csvData: CSVRow[],
    horarios: TimeSlot[],
    mappings: AccountMappings,
    selectedMonth: { year: number; month: number }
  ): Promise<void> {
    this.selectedMonth = selectedMonth;
    
    try {
      this.log('info', '🚀 Iniciando automatización con Playwright (Worker Thread)...');

      const timeEntries = this.processCSVData(csvData, horarios, mappings);
      this.log('info', `📊 Procesados ${timeEntries.length} días de trabajo`);

      await this.setupBrowser();
      this.log('success', '✅ Navegador iniciado correctamente');

      await this.login(credentials);
      this.log('success', '✅ Sesión iniciada correctamente');

      await this.selectMonth();
      this.log('success', '✅ Mes seleccionado');

      await this.processEntries(timeEntries);

      this.log('success', '🎉 ¡Automatización completada exitosamente!');
      this.sendMessage({ type: 'complete', data: { success: true } });
    } catch (error) {
      this.log('error', `❌ Error: ${error}`);
      this.sendMessage({ type: 'error', data: { error: String(error) } });
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async stop(): Promise<void> {
    this.isStopped = true;
    await this.cleanup();
    this.log('warning', '⚠️ Automatización detenida');
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.log('info', this.isPaused ? '⏸️ Automatización pausada' : '▶️ Automatización reanudada');
    if (this.currentProgress) {
      this.updateProgress({
        message: this.isPaused ? 'Automatización pausada' : 'Automatización reanudada',
      });
    }
  }

  private async setupBrowser(): Promise<void> {
    this.browser = await chromium.launch(
      getChromiumLaunchOptions({
        headless: this.config.headless,
        slowMo: 50,
      })
    );

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'es-CO',
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout);
  }

  private async login(credentials: Credentials): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    this.log('info', '🔐 Iniciando proceso de login en Okta...');
    await this.page.goto(this.config.loginUrl);

    // Esperar y llenar email - XPath exacto del código Python
    await this.page.waitForSelector('input[name="identifier"]', { timeout: PLAYWRIGHT_TIMEOUTS.ELEMENT });
    await this.page.fill('input[name="identifier"]', credentials.email);

    // Click en siguiente
    await this.page.click('input[type="submit"]');

    // Esperar campo de password
    await this.page.waitForSelector('input[type="password"]', { state: 'visible', timeout: PLAYWRIGHT_TIMEOUTS.ELEMENT });
    await this.page.fill('input[type="password"]', credentials.password);

    // Click en login
    await this.page.click('input[type="submit"]');

    // Esperar y manejar MFA (Okta Verify push)
    try {
      // Buscar botón de Okta Verify push - basado en el XPath del Python
      const mfaSelector = '[data-se="okta_verify-push"], .authenticator-verify-list button, div[data-se="authenticator-button"]';
      const mfaButton = await this.page.waitForSelector(mfaSelector, { timeout: PLAYWRIGHT_TIMEOUTS.MFA_CHECK });

      if (mfaButton) {
        this.log('info', '📱 Verificación MFA detectada, enviando push...');
        await mfaButton.click();

        // Esperar a que se complete la verificación MFA (hasta 60 segundos)
        this.log('info', '⏳ Esperando aprobación de MFA...');
        await this.page.waitForURL(/.*\/app\/UserHome.*|.*replicon.*/i, { timeout: PLAYWRIGHT_TIMEOUTS.AUTH });
      }
    } catch {
      // MFA no apareció o ya pasó, continuar
      this.log('info', '✓ Sin MFA adicional requerido');
    }

    // Esperar a que cargue el UserHome de Okta
    await this.page.waitForSelector('#main-content', { timeout: PLAYWRIGHT_TIMEOUTS.AUTH });

    // Buscar y hacer clic en el enlace de Replicon con retry
    this.log('info', '🔗 Buscando aplicación Replicon...');
    await withNetworkRetry(
      () => this.clickWithSelectors(SELECTORS.REPLICON_LINK),
      3,
      (attempt, error) => this.log('warning', `Retry ${attempt} clicking Replicon link: ${error}`)
    );

    await this.switchToReplicon();
  }

  /**
   * Cambiar a la ventana de Replicon - basado en el código Python
   * Espera hasta que alguna ventana navegue a Replicon (maneja SSO intermedios como 1Password)
   */

  /**
   * Cambiar a la ventana de Replicon - basado en el código Python
   * Espera hasta que alguna ventana navegue a Replicon (maneja SSO intermedios como 1Password)
   */
  private async switchToReplicon(): Promise<void> {
    if (!this.context || !this.page) throw new Error('Navegador no inicializado');

    this.log('info', '🔄 Esperando que se abran todas las ventanas y buscando Replicon...');

    // Escuchar nuevas páginas que se abran
    const waitForRepliconPage = (): Promise<Page> => {
      return new Promise((resolve, _reject) => {
        const context = this.context;
        if (!context) return;

        const checkPages = async () => {
          const pages = context.pages();

          for (const page of pages) {
            try {
              // Esperar a que la página cargue
              await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => { });

              const url = page.url();
              this.log('info', `📄 Página cargada: ${url}`);

              if (/replicon/i.test(url)) {
                resolve(page);
                return;
              }
            } catch {
              // Ignorar errores de páginas que se cierran
            }
          }
        };

        // Revisar páginas existentes
        checkPages();

        // Escuchar nuevas páginas
        const onNewPage = async (newPage: Page) => {
          try {
            this.log('info', '🆕 Nueva ventana detectada, esperando a que cargue...');
            await newPage.waitForLoadState('domcontentloaded', { timeout: 60000 });

            const url = newPage.url();
            this.log('info', `📄 Nueva página cargada: ${url}`);

            if (/replicon/i.test(url)) {
              context.off('page', onNewPage);
              resolve(newPage);
            } else if (/1password/i.test(url)) {
              this.log('info', '🔐 Ventana de 1Password SSO detectada. Completa el login...');
            }
          } catch {
            // Ignorar errores
          }
        };

        context.on('page', onNewPage);
      });
    };

    const repliconPage = await waitForRepliconPage();

    // Esperar a que Replicon cargue completamente
    this.log('info', '⏳ Esperando que Replicon cargue completamente...');
    await repliconPage.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => { });

    // Cerrar todas las otras ventanas
    const allPages = this.context.pages();
    for (const page of allPages) {
      if (page !== repliconPage) {
        this.log('info', `🗑️ Cerrando ventana: ${page.url()}`);
        await page.close().catch(() => { });
      }
    }

    this.page = repliconPage;
    this.log('info', '✅ Conectado a Replicon');
  }

  /**
   * Seleccionar mes actual en Replicon
   * Navega automáticamente al mes correcto si no coincide
   */
  private async selectMonth(): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    this.log('info', '📅 Seleccionando timesheet del mes...');

    // Esperar a que cargue la página de Replicon (userWelcomeText)
    await this.page.waitForSelector('.userWelcomeText', { timeout: PLAYWRIGHT_TIMEOUTS.ELEMENT });

    // Click en el timesheet card
    await this.clickWithSelectors(SELECTORS.TIMESHEET);

    // Esperar a que cargue el selector de período
    await this.page.waitForSelector('.timesheetPeriod', { timeout: PLAYWRIGHT_TIMEOUTS.ELEMENT });

    // Obtener mes objetivo del editor CSV
    if (!this.selectedMonth) {
      throw new Error('No se especificó el mes objetivo. Debe venir del selector del editor CSV.');
    }
    
    const targetYear = this.selectedMonth.year;
    const targetMonth = this.selectedMonth.month; // 1-12

    this.log('info', `🎯 Mes objetivo: ${targetYear}-${String(targetMonth).padStart(2, '0')}`);

    // Verificar y navegar al mes correcto (solo 1 intento)
    const currentPeriod = await this.getCurrentPeriod();
    
    if (!currentPeriod) {
      this.log('warning', '⚠️ No se pudo leer el período actual, continuando...');
    } else {
      // Parsear la fecha del período (formato: "YYYY-MM-DD")
      // No usar new Date() porque causa problemas con zona horaria
      const [yearStr, monthStr] = currentPeriod.split('-');
      const periodYear = parseInt(yearStr, 10);
      const periodMonth = parseInt(monthStr, 10); // 1-12

      this.log('info', `📆 Período actual: ${periodYear}-${String(periodMonth).padStart(2, '0')}`);

      // Verificar si es el mes correcto
      if (periodYear === targetYear && periodMonth === targetMonth) {
        this.log('success', '✅ Mes correcto seleccionado');
      } else {
        // Determinar si navegar hacia adelante o atrás (solo 1 vez)
        const targetTimestamp = new Date(targetYear, targetMonth - 1, 1).getTime();
        const currentTimestamp = new Date(periodYear, periodMonth - 1, 1).getTime();

        if (currentTimestamp < targetTimestamp) {
          // Período actual es anterior → Navegar adelante
          this.log('info', '➡️ Navegando al mes siguiente...');
          await this.clickWithSelectors(SELECTORS.NEXT_PERIOD);
        } else {
          // Período actual es posterior → Navegar atrás
          this.log('info', '⬅️ Navegando al mes anterior...');
          await this.clickWithSelectors(SELECTORS.PREVIOUS_PERIOD);
        }

        // Esperar a que se actualice el período
        await delay(1500);
      }
    }

    this.log('info', '✅ Timesheet cargado');
  }

  /**
   * Obtener el período actual del timesheet desde el input
   * @returns Fecha en formato "YYYY-MM-DD" o null si falla
   */
  private async getCurrentPeriod(): Promise<string | null> {
    if (!this.page) return null;

    try {
      const element = await this.page.waitForSelector(
        SELECTORS.TIMESHEET_PERIOD_INPUT, 
        { timeout: 5000, state: 'attached' }  // 'attached' permite elementos hidden
      );
      if (element) {
        const value = await element.getAttribute('value');
        return value;
      }
    } catch (error) {
      this.log('warning', `No se pudo leer período: ${error}`);
    }

    return null;
  }

  /**
   * Hacer clic usando múltiples selectores de fallback
   */
  private async clickWithSelectors(selectors: string[]): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        await this.page.click(selector);
        return;
      } catch {
        continue;
      }
    }

    throw new Error(`No se pudo hacer clic con ningún selector: ${selectors.join(', ')}`);
  }

  private async processEntries(timeEntries: TimeEntry[][]): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    const totalDays = timeEntries.length;

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      if (this.isStopped) break;

      // Esperar si está pausado
      while (this.isPaused && !this.isStopped) {
        await delay(PLAYWRIGHT_TIMEOUTS.PAUSE_POLL);
      }

      const dayNumber = dayIndex + 2; // Los días empiezan desde li[2] (li[1] es el header)
      const dailyEntries = timeEntries[dayIndex];

      this.updateProgress({
        status: 'running',
        currentDay: dayIndex + 1,
        totalDays,
        message: `Procesando día ${dayIndex + 1} de ${totalDays}`,
      });

      // Filtrar entradas válidas
      // processCSVData ya hizo todo el filtrado necesario
      // Solo verificamos que haya un account válido
      const validEntries = dailyEntries.filter(
        entry => entry.account && entry.account.trim() !== ''
      );

      if (validEntries.length === 0) {
        this.log('info', `📅 Día ${dayIndex + 1}: Sin entradas de trabajo`);
        continue;
      }

      this.log('info', `📅 Día ${dayIndex + 1}: Procesando ${validEntries.length} entradas`);

      // Procesar cada entrada
      for (let entryIndex = 0; entryIndex < validEntries.length; entryIndex++) {
        if (this.isStopped) break;

        const entry = validEntries[entryIndex];

        this.updateProgress({
          status: 'running',
          currentDay: dayIndex + 1,
          totalDays,
          currentEntry: entryIndex + 1,
          totalEntries: validEntries.length,
          message: `Día ${dayIndex + 1}: Entrada ${entryIndex + 1}/${validEntries.length}`,
        });

        // Click en el día para abrir el popup de entrada con retry
        await withNetworkRetry(
          () => this.clickOnDay(dayNumber),
          3,
          (attempt, error) => this.log('warning', `Retry ${attempt} clicking day ${dayNumber}: ${error}`)
        );

        try {
          await this.addTimeEntry(entry);
          this.log('success', `  ✓ ${entry.account}: ${entry.start_time} - ${entry.end_time}`);
        } catch (error) {
          this.log('error', `  ✗ Error en entrada: ${error}`);
          throw error;
        }
      }

    }
  }

  /**
   * Hacer clic en un día específico - basado en el código Python
   */
  private async clickOnDay(dayNumber: number): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    // Selectores basados en el código Python: //li[{i}]/ul/li/a
    const daySelectors = [
      `xpath=//li[${dayNumber}]/ul/li/a`,
      `li:nth-child(${dayNumber}) ul li a`,
      `xpath=//li[${dayNumber}]//a[contains(@class,'timeEntryCell')]`,
      `li:nth-child(${dayNumber}) a`,
    ];

    for (const selector of daySelectors) {
      try {
        // Scroll al elemento
        const element = await this.page.waitForSelector(selector, { timeout: 5000 });
        if (element) {
          await element.scrollIntoViewIfNeeded();
          await element.click();
          return;
        }
      } catch {
        continue;
      }
    }

    throw new Error(`No se pudo hacer clic en el día ${dayNumber}`);
  }

  /**
   * Agregar una entrada de tiempo - basado en el código Python add_time_entry
   */
  private async addTimeEntry(entry: TimeEntry): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    // === HORA DE INICIO con retry ===
    await withNetworkRetry(
      () => this.fillWithSelectors(SELECTORS.TIME_INPUT, entry.start_time),
      2,
      (attempt, error) => this.log('warning', `Retry ${attempt} filling start time: ${error}`)
    );


    // === GUARDAR ENTRADA ===
    await this.page.click(SELECTORS.OK_BUTTON);
    await this.page.waitForSelector('.contextPopupNode', { state: 'hidden', timeout: 10000 }).catch(() => { });

    // === HORA DE FIN (CHECKOUT) con retry ===
    await withNetworkRetry(
      async () => {
        await this.clickWithSelectors(SELECTORS.CHECKOUT);
        await this.fillWithSelectors(SELECTORS.TIME_INPUT, entry.end_time);
      },
      2,
      (attempt, error) => this.log('warning', `Retry ${attempt} filling end time: ${error}`)
    );

    // === GUARDAR SALIDA ===
    await this.page.click(SELECTORS.OK_BUTTON);
    await this.page.waitForSelector('.contextPopupNode', { state: 'hidden', timeout: 10000 }).catch(() => { });
  }

  /**
   * Intentar llenar un campo con múltiples selectores
   */
  private async fillWithSelectors(selectors: string[], value: string): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');

    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        await this.page.fill(selector, '');
        await this.page.fill(selector, value);
        return;
      } catch {
        continue;
      }
    }

    throw new Error(`No se pudo llenar el campo con valor: ${value}`);
  }

  /**
   * Verificar si un día es vacación o feriado
   */
  private async isVacationOrHoliday(dayNumber: number): Promise<boolean> {
    if (!this.page) return false;

    const selectors = [
      `xpath=//li[${dayNumber}]/ul/li/div/span[contains(text(), 'Col-Vacations')]`,
      `xpath=//li[${dayNumber}]/div/div[@class='holidayIndicator']`,
      `xpath=//li[${dayNumber}]//*[contains(@class,'vacation')]`,
      `xpath=//li[${dayNumber}]//*[contains(@class,'holiday')]`,
      `li:nth-child(${dayNumber}) .holidayIndicator`,
    ];

    for (const selector of selectors) {
      if (await this.page.$(selector)) return true;
    }
    return false;
  }

  private processCSVData(
    csvData: CSVRow[],
    horarios: TimeSlot[],
    mappings: AccountMappings
  ): TimeEntry[][] {
    const allEntries: TimeEntry[][] = [];

    for (const row of csvData) {
      const cuenta = normalizeAccountCode(row.cuenta);
      const extras = row.extras?.trim() || '';
      const dailyEntries: TimeEntry[] = [];

      if (SPECIAL_ACCOUNTS.VACATION.includes(cuenta) ||
        SPECIAL_ACCOUNTS.NO_WORK.includes(cuenta) ||
        SPECIAL_ACCOUNTS.WEEKEND.includes(cuenta)) {
        // Skip special accounts
      } else if (cuenta === 'ND') {
        // Skip ND days
      } else {
        const accountName = mappings[cuenta];
        if (accountName && accountName !== 'No work' && accountName !== 'Vacation') {
          for (const horario of horarios) {
            dailyEntries.push({
              start_time: horario.start_time,
              end_time: horario.end_time,
              account: accountName,
            });
          }
        }
      }

      if (extras) {
        const extEntries = this.parseExtEntries(extras, mappings);
        dailyEntries.push(...extEntries);
      }

      allEntries.push(dailyEntries);
    }

    return allEntries;
  }

  private parseExtEntries(extString: string, _mappings: AccountMappings): TimeEntry[] {
    const entries: TimeEntry[] = [];
    const parts = extString.split(';');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed.includes('-')) continue;

      const components = trimmed.split('-');
      if (components.length !== 2) continue;

      const [startMilitary, endMilitary] = components;

      entries.push({
        start_time: militaryToStandard(startMilitary.trim()),
        end_time: militaryToStandard(endMilitary.trim()),
        account: 'EXTRA',
      });
    }

    return entries;
  }

  private async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => { });
    }
    if (this.context) {
      await this.context.close().catch(() => { });
    }
    if (this.browser) {
      await this.browser.close().catch(() => { });
    }

    this.page = null;
    this.context = null;
    this.browser = null;
  }
}

// Worker entry point
if (parentPort) {
  try {
    // Log para debug
    parentPort.postMessage({ 
      type: 'log', 
      data: { 
        timestamp: new Date(), 
        level: 'info' as const, 
        message: '🔧 Worker thread inicializado' 
      } 
    });

    const data = workerData as WorkerData;
    
    if (!data || !data.config) {
      throw new Error('workerData es inválido o no tiene config');
    }

    parentPort.postMessage({ 
      type: 'log', 
      data: { 
        timestamp: new Date(), 
        level: 'info' as const, 
        message: '📦 Creando instancia de PlaywrightWorkerAutomation...' 
      } 
    });

    const automation = new PlaywrightWorkerAutomation(data.config);

    // Listen for control messages from main
    parentPort.on('message', (message: { type: 'stop' | 'pause' }) => {
      if (message.type === 'stop') {
        automation.stop();
      } else if (message.type === 'pause') {
        automation.togglePause();
      }
    });

    // Signal ready
    parentPort.postMessage({ type: 'ready' });

    // Start automation (async)
    automation.start(
      data.credentials, 
      data.csvData, 
      data.horarios, 
      data.mappings,
      data.selectedMonth
    ).catch((error) => {
      // Report error to parent
      parentPort?.postMessage({ 
        type: 'error', 
        data: { error: String(error) } 
      });
      process.exit(1);
    });
  } catch (error) {
    // Report initialization error to parent
    parentPort?.postMessage({ 
      type: 'error', 
      data: { error: `Worker initialization failed: ${String(error)}` } 
    });
    process.exit(1);
  }
}
