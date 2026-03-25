import { ipcMain, BrowserWindow } from 'electron';
import type { AutomationWorkerService } from '../../services/automation-worker.service.js';
import * as automationEnhanced from '../../services/automation-enhanced.service.js';
import { createSafeHandler } from './handler-wrapper.js';
import { t } from '../../i18n/index.js';
import type { CSVRow } from '../../../common/types.js';

export interface AutomationHandlerDeps {
  getMainWindow: () => BrowserWindow | null;
  getAutomation: () => AutomationWorkerService | null;
  setAutomation: (automation: AutomationWorkerService | null) => void;
  AutomationServiceClass: typeof AutomationWorkerService;
}

/**
 * Configura los handlers IPC para automatización de Replicon
 * @param deps - Dependencias inyectadas
 */
export function setupAutomationHandlers(deps: AutomationHandlerDeps): void {
  const { getMainWindow, getAutomation, setAutomation, AutomationServiceClass } = deps;

  // Precarga del navegador (no bloquea setup)
  automationEnhanced.preloadBrowser().catch(() => {
    // Ignore preload errors
  });

  /**
   * Handler: automation:start
   * Inicia el proceso de automatización
   */
  ipcMain.handle('automation:start', async (_, request) => {
    const mainWindow = getMainWindow();
    if (getAutomation()) {
      return { success: false, error: 'Ya hay una automatización en ejecución' };
    }

    // Validar configuración - tomar de .env si está vacío
    const config = {
      ...request.config,
      loginUrl: request.config.loginUrl || process.env.REPLICON_LOGIN_URL || '',
      timeout: request.config.timeout || Number(process.env.REPLICON_TIMEOUT) || 45000,
    };

    // Validar que loginUrl no esté vacío
    if (!config.loginUrl || config.loginUrl.trim() === '') {
      return {
        success: false,
        error: t('errors.loginUrlMissing')
      };
    }

    const automation = new AutomationServiceClass(
      config,
      (progress) => mainWindow?.webContents.send('automation:progress', progress),
      (log) => mainWindow?.webContents.send('automation:log', log)
    );
    automation.setMainWindow(mainWindow);
    setAutomation(automation);

    try {
      await automation.start(
        request.credentials, 
        request.csvData, 
        request.horarios, 
        request.mappings,
        request.selectedMonth
      );
      mainWindow?.webContents.send('automation:complete', { success: true });
      return { success: true };
    } catch (error) {
      mainWindow?.webContents.send('automation:error', { error: String(error) });
      return { success: false, error: String(error) };
    } finally {
      setAutomation(null);
    }
  });

  /**
   * Handler: automation:stop
   * Detiene la automatización en curso
   */
  ipcMain.handle('automation:stop', async () => {
    const automation = getAutomation();
    if (automation) {
      await automation.stop();
      setAutomation(null);
    }
    return { success: true };
  });

  /**
   * Handler: automation:pause
   * Pausa/reanuda la automatización en curso
   */
  ipcMain.handle('automation:pause', async () => {
    const automation = getAutomation();
    if (automation) {
      automation.togglePause();
    }
    return { success: true };
  });

  /**
   * Handler: automation:validate
   * Valida datos de automatización sin ejecutar
   */
  ipcMain.handle('automation:validate', createSafeHandler(
    async (_, data: { csvData: CSVRow[]; mappings: Record<string, unknown>; horarios: unknown[] }) => {
      return automationEnhanced.validateAutomationData(
        data.csvData,
        data.mappings as Record<string, string>,
        data.horarios as { start_time: string; end_time: string }[]
      );
    },
    { loggerContext: 'AutomationHandler.validate' }
  ));

  /**
   * Handler: automation:dryRun
   * Ejecuta una simulación de automatización sin efectos reales
   */
  ipcMain.handle('automation:dryRun', createSafeHandler(
    async (_, data: { csvData: CSVRow[]; mappings: Record<string, unknown>; horarios: unknown[] }) => {
      return automationEnhanced.dryRun(
        data.csvData,
        data.mappings as Record<string, string>,
        data.horarios as { start_time: string; end_time: string }[]
      );
    },
    { loggerContext: 'AutomationHandler.dryRun' }
  ));

  /**
   * Handler: automation:saveCheckpoint
   * Guarda un checkpoint de automatización para recuperación
   */
  ipcMain.handle('automation:saveCheckpoint', createSafeHandler(
    async (_, checkpoint) => {
      automationEnhanced.saveCheckpoint(checkpoint);
      return true;
    },
    { loggerContext: 'AutomationHandler.saveCheckpoint' }
  ));

  /**
   * Handler: automation:loadCheckpoint
   * Carga un checkpoint de automatización para recuperación
   */
  ipcMain.handle('automation:loadCheckpoint', createSafeHandler(
    async (_, automationId) => {
      const checkpoint = await automationEnhanced.loadCheckpoint(automationId);
      return { checkpoint };
    },
    { loggerContext: 'AutomationHandler.loadCheckpoint' }
  ));

  /**
   * Handler: automation:hasPendingRecovery
   * Verifica si hay checkpoints pendientes de recuperación
   */
  ipcMain.handle('automation:hasPendingRecovery', createSafeHandler(
    async () => {
      const hasPending = await automationEnhanced.hasPendingRecovery();
      return { hasPending };
    },
    { loggerContext: 'AutomationHandler.hasPendingRecovery' }
  ));

  /**
   * Handler: automation:getPendingCheckpoints
   * Obtiene lista de checkpoints pendientes
   */
  ipcMain.handle('automation:getPendingCheckpoints', createSafeHandler(
    async () => {
      const checkpoints = await automationEnhanced.getPendingCheckpoints();
      return { checkpoints };
    },
    { loggerContext: 'AutomationHandler.getPendingCheckpoints' }
  ));

  /**
   * Handler: automation:clearCheckpoint
   * Elimina un checkpoint específico
   */
  ipcMain.handle('automation:clearCheckpoint', async (_, automationId) => {
    try {
      await automationEnhanced.clearCheckpoint(automationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
