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
} from '../../common/types';
import { militaryToStandard, delay } from '../../common/utils';
import { SPECIAL_ACCOUNTS } from '../../common/constants';

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
}

class PlaywrightWorkerAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: AppConfig;
  private isPaused: boolean = false;
  private isStopped: boolean = false;
  private currentProgress: AutomationProgress | null = null;

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
    mappings: AccountMappings
  ): Promise<void> {
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
    this.browser = await chromium.launch({
      headless: this.config.headless,
      slowMo: 50,
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'es-CO',
    });
    
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout);
  }

  private async login(credentials: Credentials): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');
    
    this.log('info', '🔐 Iniciando proceso de login...');
    
    await this.page.goto(this.config.loginUrl);
    
    // Email input
    await this.page.fill('input[name="identifier"], input[type="email"]', credentials.email);
    await this.page.click('input[type="submit"], button[type="submit"]');
    
    // Password input
    await this.page.waitForSelector('input[type="password"]', { state: 'visible' });
    await this.page.fill('input[type="password"]', credentials.password);
    await this.page.click('input[type="submit"], button[type="submit"]');
    
    // MFA handling
    try {
      const mfaButton = await this.page.waitForSelector(
        '[data-se="okta_verify-push"], .authenticator-verify-list button',
        { timeout: 5000 }
      );
      if (mfaButton) {
        this.log('info', '📱 Verificación MFA detectada, esperando...');
        await mfaButton.click();
      }
    } catch {
      // No MFA required
    }
    
    // Wait for Replicon link
    await this.page.waitForSelector('a[aria-label*="Replicon"], a[href*="replicon"]', { 
      timeout: 60000 
    });
    
    this.log('info', '🔗 Abriendo Replicon...');
    await this.page.click('a[aria-label*="Replicon"], a[href*="replicon"]');
    
    await this.switchToReplicon();
  }

  private async switchToReplicon(): Promise<void> {
    if (!this.context || !this.page) throw new Error('Navegador no inicializado');
    
    const newPage = await this.context.waitForEvent('page', { timeout: 30000 });
    await newPage.waitForLoadState('networkidle');
    
    await this.page.close();
    this.page = newPage;
    
    this.log('info', '✅ Conectado a Replicon');
  }

  private async selectMonth(): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');
    
    this.log('info', '📅 Seleccionando timesheet del mes...');
    
    await this.page.waitForSelector('.userWelcomeText, [class*="welcome"]', { timeout: 30000 });
    await this.page.click('timesheet-card li, [class*="timesheet"] li');
    await this.page.waitForSelector('[class*="timeEntryCell"], [class*="dayCell"]', { 
      timeout: 30000 
    });
  }

  private async processEntries(timeEntries: TimeEntry[][]): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');
    
    const totalDays = timeEntries.length;
    
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      if (this.isStopped) break;
      
      // Handle pause
      while (this.isPaused && !this.isStopped) {
        await delay(500);
      }
      
      const dayNumber = dayIndex + 2;
      const dailyEntries = timeEntries[dayIndex];
      
      this.updateProgress({
        status: 'running',
        currentDay: dayIndex + 1,
        totalDays,
        message: `Procesando día ${dayIndex + 1} de ${totalDays}`,
      });
      
      if (await this.isVacationOrHoliday(dayNumber)) {
        this.log('info', `📅 Día ${dayIndex + 1}: Vacaciones/Feriado - Saltando`);
        continue;
      }
      
      const validEntries = dailyEntries.filter(
        entry => !['Vacation', 'No work', 'Weekend', 'ND'].includes(entry.project)
      );
      
      if (validEntries.length === 0) {
        this.log('info', `📅 Día ${dayIndex + 1}: Sin entradas de trabajo`);
        continue;
      }
      
      this.log('info', `📅 Día ${dayIndex + 1}: Procesando ${validEntries.length} entradas`);
      
      await this.page.click(`li:nth-child(${dayNumber}) a, li:nth-child(${dayNumber}) [class*="clickable"]`);
      await delay(500);
      
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
        
        await this.addTimeEntry(entry);
        this.log('success', `  ✓ ${entry.project} - ${entry.account}: ${entry.start_time} - ${entry.end_time}`);
      }
    }
  }

  private async addTimeEntry(entry: TimeEntry): Promise<void> {
    if (!this.page) throw new Error('Navegador no inicializado');
    
    await this.page.fill('input.time, input[type="time"]', entry.start_time);
    await this.page.click('a.divDropdown, [class*="projectSelector"]');
    await this.page.click(`a:has-text("${entry.project}")`);
    await this.page.click(`a:has-text("${entry.account}")`);
    await this.page.click('input[value="OK"], button:has-text("OK")');
    await this.page.waitForSelector('[class*="contextPopup"]', { state: 'hidden' });
    
    await this.page.click('[class*="punchOut"], [class*="combinedInput"] a:nth-child(2)');
    await this.page.fill('input.time, input[type="time"]', entry.end_time);
    await this.page.click('input[value="OK"], button:has-text("OK")');
    await this.page.waitForSelector('[class*="contextPopup"]', { state: 'hidden' });
  }

  private async isVacationOrHoliday(dayNumber: number): Promise<boolean> {
    if (!this.page) return false;
    
    try {
      const vacation = await this.page.$(`li:nth-child(${dayNumber}) span:has-text("Vacations")`);
      if (vacation) return true;
      
      const holiday = await this.page.$(`li:nth-child(${dayNumber}) [class*="holidayIndicator"]`);
      if (holiday) return true;
      
      return false;
    } catch {
      return false;
    }
  }

  private processCSVData(
    csvData: CSVRow[],
    horarios: TimeSlot[],
    mappings: AccountMappings
  ): TimeEntry[][] {
    const allEntries: TimeEntry[][] = [];
    
    for (const row of csvData) {
      const cuenta = row.cuenta.trim().toUpperCase();
      const proyecto = row.proyecto.trim().toUpperCase();
      const extras = row.extras?.trim() || '';
      const dailyEntries: TimeEntry[] = [];
      
      if (SPECIAL_ACCOUNTS.VACATION.includes(cuenta) || 
          SPECIAL_ACCOUNTS.NO_WORK.includes(cuenta) ||
          SPECIAL_ACCOUNTS.WEEKEND.includes(cuenta)) {
        // Skip special accounts
      } else if (cuenta === 'ND' && proyecto === 'ND') {
        // Skip ND days
      } else {
        const mapping = mappings[cuenta];
        if (mapping && mapping.name !== 'No work' && mapping.name !== 'Vacation') {
          const projectName = mapping.name;
          const accountName = mapping.projects[proyecto] || proyecto;
          
          for (const horario of horarios) {
            dailyEntries.push({
              start_time: horario.start_time,
              end_time: horario.end_time,
              project: projectName,
              account: accountName,
            });
          }
        }
      }
      
      if (extras.startsWith('EXT/')) {
        const extEntries = this.parseExtEntries(extras, mappings);
        dailyEntries.push(...extEntries);
      }
      
      allEntries.push(dailyEntries);
    }
    
    return allEntries;
  }

  private parseExtEntries(extString: string, mappings: AccountMappings): TimeEntry[] {
    const entries: TimeEntry[] = [];
    const extData = extString.slice(4);
    const parts = extData.split(';');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed.includes(':')) continue;
      
      const components = trimmed.split(':');
      if (components.length < 4) continue;
      
      const [cuenta, proyecto, startMilitary, endMilitary] = components;
      const mapping = mappings[cuenta.trim()];
      
      if (!mapping) continue;
      
      entries.push({
        start_time: militaryToStandard(startMilitary.trim()),
        end_time: militaryToStandard(endMilitary.trim()),
        project: mapping.name,
        account: mapping.projects[proyecto.trim()] || proyecto.trim(),
      });
    }
    
    return entries;
  }

  private async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => {});
    }
    if (this.context) {
      await this.context.close().catch(() => {});
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
    }
    
    this.page = null;
    this.context = null;
    this.browser = null;
  }
}

// Worker entry point
if (parentPort) {
  const data = workerData as WorkerData;
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
  
  // Start automation
  automation.start(data.credentials, data.csvData, data.horarios, data.mappings);
}
