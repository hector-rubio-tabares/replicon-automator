import { chromium, Browser } from 'playwright';
import { createLogger, getChromiumLaunchOptions } from '../utils/index.js';
import type {
  AutomationCheckpoint,
  DryRunResult,
  ValidationResult,
} from '../domain/automation/types.js';

const logger = createLogger('AutomationEnhanced');
let preloadedBrowser: Browser | null = null;
let preloadPromise: Promise<void> | null = null;

export async function preloadBrowser(headless: boolean = true): Promise<void> {
  if (preloadedBrowser) {
    logger.info('Browser already preloaded');
    return;
  }
  if (preloadPromise) {
    return preloadPromise;
  }
  preloadPromise = (async () => {
    try {
      logger.info('Preloading browser...');
      preloadedBrowser = await chromium.launch(
        getChromiumLaunchOptions({
          headless,
          slowMo: 50,
        })
      );
      logger.info('Browser preloaded successfully');
    } catch (error) {
      logger.error('Failed to preload browser', error);
      preloadedBrowser = null;
    } finally {
      preloadPromise = null;
    }
  })();
  return preloadPromise;
}
export async function getBrowser(headless: boolean = true): Promise<Browser> {
  if (preloadedBrowser) {
    const browser = preloadedBrowser;
    preloadedBrowser = null;
    setTimeout(() => preloadBrowser(headless), 100);
    return browser;
  }
  return chromium.launch(
    getChromiumLaunchOptions({
      headless,
      slowMo: 50,
    })
  );
}
export async function closeBrowser(): Promise<void> {
  if (preloadedBrowser) {
    await preloadedBrowser.close().catch(() => { });
    preloadedBrowser = null;
  }
}
export function validateAutomationData(
  csvData: { cuenta: string; extras?: string }[],
  mappings: Record<string, string>,
  horarios: { start_time: string; end_time: string }[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  if (!csvData || csvData.length === 0) {
    errors.push('No hay datos CSV para procesar');
    return { isValid: false, errors, warnings, suggestions };
  }
  if (!mappings || Object.keys(mappings).length === 0) {
    errors.push('No hay mapeo de cuentas configurado');
    return { isValid: false, errors, warnings, suggestions };
  }
  if (!horarios || horarios.length === 0) {
    errors.push('No hay horarios configurados');
    return { isValid: false, errors, warnings, suggestions };
  }
  const unmappedAccounts = new Set<string>();
  let emptyRows = 0;
  let workDays = 0;
  csvData.forEach((row, index) => {
    const cuenta = row.cuenta?.trim().toUpperCase();
    if (!cuenta) {
      emptyRows++;
      return;
    }
    const specialAccounts = ['VACATION', 'VAC', 'NO WORK', 'ND', 'WEEKEND', 'WK'];
    if (specialAccounts.includes(cuenta)) {
      return;
    }
    workDays++;
    if (!mappings[cuenta]) {
      unmappedAccounts.add(cuenta);
      warnings.push(`Fila ${index + 1}: Cuenta "${cuenta}" no está en el mapeo`);
    }
    if (row.extras && row.extras.trim()) {
      const extParts = row.extras.split(';');
      extParts.forEach((part, partIndex) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const components = trimmed.split('-');
        if (components.length !== 2) {
          errors.push(`Fila ${index + 1}, Extra ${partIndex + 1}: Formato inválido "${trimmed}" (esperado: INICIO-FIN, ej: 0900-1100)`);
        }
      });
    }
  });
  if (unmappedAccounts.size > 0) {
    suggestions.push(`Considera agregar las siguientes cuentas al mapeo: ${Array.from(unmappedAccounts).join(', ')}`);
  }
  if (emptyRows > 0) {
    suggestions.push(`${emptyRows} filas están vacías y serán ignoradas`);
  }
  if (workDays === 0) {
    warnings.push('No hay días de trabajo efectivos en los datos');
  }
  horarios.forEach((h, i) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(h.start_time)) {
      errors.push(`Horario ${i + 1}: Formato de hora inicio inválido "${h.start_time}"`);
    }
    if (!timeRegex.test(h.end_time)) {
      errors.push(`Horario ${i + 1}: Formato de hora fin inválido "${h.end_time}"`);
    }
  });
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}
export function dryRun(
  csvData: { cuenta: string; extras?: string }[],
  mappings: Record<string, string>,
  horarios: { start_time: string; end_time: string }[]
): DryRunResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const entriesPerDay: { day: number; count: number; entries: string[] }[] = [];
  let workDays = 0;
  let vacationDays = 0;
  let holidayDays = 0;
  let weekendDays = 0;
  let totalEntries = 0;
  const specialAccounts = {
    vacation: ['VACATION', 'VAC'],
    noWork: ['NO WORK', 'ND'],
    weekend: ['WEEKEND', 'WK'],
  };
  csvData.forEach((row, index) => {
    const cuenta = row.cuenta?.trim().toUpperCase() || '';
    const dayNum = index + 1;
    const dayEntries: string[] = [];
    if (specialAccounts.vacation.includes(cuenta)) {
      vacationDays++;
      entriesPerDay.push({ day: dayNum, count: 0, entries: ['🏖️ Vacaciones'] });
      return;
    }
    if (specialAccounts.weekend.includes(cuenta)) {
      weekendDays++;
      entriesPerDay.push({ day: dayNum, count: 0, entries: ['📅 Fin de semana'] });
      return;
    }
    if (specialAccounts.noWork.includes(cuenta)) {
      holidayDays++;
      entriesPerDay.push({ day: dayNum, count: 0, entries: ['🎉 Día festivo / Sin trabajo'] });
      return;
    }
    workDays++;
    if (mappings[cuenta]) {
      const mapping = mappings[cuenta];
      horarios.forEach((h) => {
        totalEntries++;
        dayEntries.push(`${mapping}: ${h.start_time} - ${h.end_time}`);
      });
    } else if (cuenta) {
      warnings.push(`Día ${dayNum}: Cuenta "${cuenta}" no mapeada`);
    }
    if (row.extras && row.extras.trim()) {
      const extParts = row.extras.split(';');
      extParts.forEach((part) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const components = trimmed.split('-');
        if (components.length === 2) {
          const [inicio, fin] = components;
          totalEntries++;
          dayEntries.push(`[EXTRA]: ${inicio} - ${fin}`);
        }
      });
    }
    entriesPerDay.push({ day: dayNum, count: dayEntries.length, entries: dayEntries });
  });
  const estimatedDuration = 30000 + (workDays * 2000) + (totalEntries * 3000);
  return {
    success: errors.length === 0,
    totalDays: csvData.length,
    workDays,
    vacationDays,
    holidayDays,
    weekendDays,
    totalEntries,
    entriesPerDay,
    warnings,
    errors,
    estimatedDuration,
  };
}
const checkpointStore = new Map<string, AutomationCheckpoint>();
export function saveCheckpoint(checkpoint: AutomationCheckpoint): void {
  checkpointStore.set(checkpoint.id, checkpoint);
  logger.info(`Checkpoint saved: day ${checkpoint.currentDay}/${checkpoint.totalDays}`);
}
export function loadCheckpoint(id: string): AutomationCheckpoint | null {
  return checkpointStore.get(id) || null;
}
export function clearCheckpoint(id: string): void {
  checkpointStore.delete(id);
  logger.info(`Checkpoint cleared: ${id}`);
}
export function getPendingCheckpoints(): AutomationCheckpoint[] {
  return Array.from(checkpointStore.values()).filter(
    (cp) => cp.status === 'in-progress' || cp.status === 'paused' || cp.status === 'error'
  );
}
export function hasPendingRecovery(): boolean {
  return getPendingCheckpoints().length > 0;
}
export default {
  preloadBrowser,
  getBrowser,
  closeBrowser,
  validateAutomationData,
  dryRun,
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  getPendingCheckpoints,
  hasPendingRecovery,
};
