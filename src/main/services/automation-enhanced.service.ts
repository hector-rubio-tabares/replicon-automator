import { chromium, Browser } from 'playwright';
import { createLogger } from '../utils';
const logger = createLogger('AutomationEnhanced');
let preloadedBrowser: Browser | null = null;
let preloadPromise: Promise<void> | null = null;
export interface AutomationCheckpoint {
  id: string;
  timestamp: number;
  currentDay: number;
  totalDays: number;
  completedEntries: number[];
  csvData: string; 
  status: 'in-progress' | 'paused' | 'error';
  errorMessage?: string;
  lastSuccessfulDay?: number;
}
export interface DryRunResult {
  success: boolean;
  totalDays: number;
  workDays: number;
  vacationDays: number;
  holidayDays: number;
  weekendDays: number;
  totalEntries: number;
  entriesPerDay: { day: number; count: number; entries: string[] }[];
  warnings: string[];
  errors: string[];
  estimatedDuration: number; 
}
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
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
      preloadedBrowser = await chromium.launch({
        headless,
        slowMo: 50,
      });
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
  return chromium.launch({
    headless,
    slowMo: 50,
  });
}
export async function closeBrowser(): Promise<void> {
  if (preloadedBrowser) {
    await preloadedBrowser.close().catch(() => {});
    preloadedBrowser = null;
  }
}
export function validateAutomationData(
  csvData: { cuenta: string; proyecto: string; extras?: string }[],
  mappings: Record<string, { name: string; projects: Record<string, string> }>,
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
  const unmappedProjects = new Set<string>();
  let emptyRows = 0;
  let workDays = 0;
  csvData.forEach((row, index) => {
    const cuenta = row.cuenta?.trim().toUpperCase();
    const proyecto = row.proyecto?.trim().toUpperCase();
    if (!cuenta && !proyecto) {
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
    } else {
      const accountMapping = mappings[cuenta];
      if (proyecto && !accountMapping.projects[proyecto]) {
        unmappedProjects.add(`${cuenta}:${proyecto}`);
        warnings.push(`Fila ${index + 1}: Proyecto "${proyecto}" no está mapeado para cuenta "${cuenta}"`);
      }
    }
    if (row.extras && row.extras.startsWith('EXT/')) {
      const extParts = row.extras.slice(4).split(';');
      extParts.forEach((part, partIndex) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const components = trimmed.split(':');
        if (components.length < 4) {
          errors.push(`Fila ${index + 1}, Extra ${partIndex + 1}: Formato inválido "${trimmed}" (esperado: CUENTA:PROYECTO:INICIO:FIN)`);
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
  csvData: { cuenta: string; proyecto: string; extras?: string }[],
  mappings: Record<string, { name: string; projects: Record<string, string> }>,
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
    const proyecto = row.proyecto?.trim().toUpperCase() || '';
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
    if (specialAccounts.noWork.includes(cuenta) && specialAccounts.noWork.includes(proyecto)) {
      holidayDays++;
      entriesPerDay.push({ day: dayNum, count: 0, entries: ['🎉 Día festivo / Sin trabajo'] });
      return;
    }
    workDays++;
    if (mappings[cuenta]) {
      const mapping = mappings[cuenta];
      const projectName = mapping.projects[proyecto] || proyecto;
      horarios.forEach((h) => {
        totalEntries++;
        dayEntries.push(`${mapping.name} - ${projectName}: ${h.start_time} - ${h.end_time}`);
      });
    } else if (cuenta && proyecto) {
      warnings.push(`Día ${dayNum}: Cuenta "${cuenta}" no mapeada`);
    }
    if (row.extras && row.extras.startsWith('EXT/')) {
      const extParts = row.extras.slice(4).split(';');
      extParts.forEach((part) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const components = trimmed.split(':');
        if (components.length >= 4) {
          const [extCuenta, extProyecto, inicio, fin] = components;
          const extMapping = mappings[extCuenta.trim()];
          if (extMapping) {
            totalEntries++;
            const projectName = extMapping.projects[extProyecto.trim()] || extProyecto.trim();
            dayEntries.push(`[EXT] ${extMapping.name} - ${projectName}: ${inicio} - ${fin}`);
          } else {
            warnings.push(`Día ${dayNum}: Cuenta extra "${extCuenta}" no mapeada`);
          }
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
