/**
 * IPC Controller - Centraliza todos los handlers de IPC
 * Siguiendo el principio de Single Responsibility
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import Store from 'electron-store';
import { PlaywrightAutomation, CSVService } from '../services';
import { CredentialsService } from '../services/unified-credentials.service';
import * as automationEnhanced from '../services/automation-enhanced.service';
import type { CSVRow } from '../../shared/types';

interface IPCControllerDeps {
  store: Store<Record<string, unknown>>;
  getMainWindow: () => BrowserWindow | null;
  getAutomation: () => PlaywrightAutomation | null;
  setAutomation: (automation: PlaywrightAutomation | null) => void;
  isDev: boolean;
  appVersion: string;
}

export function setupIPCHandlers(deps: IPCControllerDeps): void {
  const { store, getMainWindow, getAutomation, setAutomation, isDev, appVersion } = deps;
  
  const csvService = new CSVService();
  const credentialsService = new CredentialsService();

  // Preload browser on startup for faster automation start
  automationEnhanced.preloadBrowser().catch(() => {
    // Silently fail - browser will be created on demand
  });

  // ═══════════════════════════════════════════════════════════
  // CSV HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  ipcMain.handle('csv:load', async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return { success: false, error: 'No window available' };

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Operación cancelada' };
    }

    return csvService.loadCSV(result.filePaths[0]);
  });

  ipcMain.handle('csv:save', async (_, data: CSVRow[]) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return { success: false, error: 'No window available' };

    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      defaultPath: 'replicon_data.csv',
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Operación cancelada' };
    }

    return csvService.saveCSV(result.filePath, data);
  });

  // ═══════════════════════════════════════════════════════════
  // CREDENTIALS HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  ipcMain.handle('credentials:save', async (_, credentials) => {
    return credentialsService.saveCredentials(credentials);
  });

  ipcMain.handle('credentials:load', async () => {
    return credentialsService.loadCredentials();
  });

  ipcMain.handle('credentials:clear', async () => {
    return credentialsService.clearCredentials();
  });

  // ═══════════════════════════════════════════════════════════
  // CONFIG HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  ipcMain.handle('config:get', async (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('config:set', async (_, key: string, value: unknown) => {
    store.set(key, value);
    return true;
  });

  // ═══════════════════════════════════════════════════════════
  // AUTOMATION HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  ipcMain.handle('automation:start', async (_, request) => {
    const mainWindow = getMainWindow();
    if (getAutomation()) {
      return { success: false, error: 'Ya hay una automatización en ejecución' };
    }

    const automation = new PlaywrightAutomation(
      request.config,
      (progress) => mainWindow?.webContents.send('automation:progress', progress),
      (log) => mainWindow?.webContents.send('automation:log', log)
    );

    setAutomation(automation);

    try {
      await automation.start(request.credentials, request.csvData, request.horarios, request.mappings);
      mainWindow?.webContents.send('automation:complete', { success: true });
      return { success: true };
    } catch (error) {
      mainWindow?.webContents.send('automation:error', { error: String(error) });
      return { success: false, error: String(error) };
    } finally {
      setAutomation(null);
    }
  });

  ipcMain.handle('automation:stop', async () => {
    const automation = getAutomation();
    if (automation) {
      await automation.stop();
      setAutomation(null);
    }
    return { success: true };
  });

  ipcMain.handle('automation:pause', async () => {
    const automation = getAutomation();
    if (automation) {
      automation.togglePause();
    }
    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════
  // AUTOMATION ENHANCED HANDLERS (Dry Run, Validation, Recovery)
  // ═══════════════════════════════════════════════════════════

  ipcMain.handle('automation:validate', async (_, data: { csvData: CSVRow[]; mappings: Record<string, unknown>; horarios: unknown[] }) => {
    try {
      const result = automationEnhanced.validateAutomationData(
        data.csvData,
        data.mappings as Record<string, { name: string; projects: Record<string, string> }>,
        data.horarios as { start_time: string; end_time: string }[]
      );
      return { success: true, result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('automation:dryRun', async (_, data: { csvData: CSVRow[]; mappings: Record<string, unknown>; horarios: unknown[] }) => {
    try {
      const result = automationEnhanced.dryRun(
        data.csvData,
        data.mappings as Record<string, { name: string; projects: Record<string, string> }>,
        data.horarios as { start_time: string; end_time: string }[]
      );
      return { success: true, result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('automation:saveCheckpoint', async (_, checkpoint) => {
    try {
      automationEnhanced.saveCheckpoint(checkpoint);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('automation:loadCheckpoint', async (_, automationId) => {
    try {
      const checkpoint = await automationEnhanced.loadCheckpoint(automationId);
      return { success: true, checkpoint };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('automation:hasPendingRecovery', async () => {
    try {
      const hasPending = await automationEnhanced.hasPendingRecovery();
      return { success: true, hasPending };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('automation:getPendingCheckpoints', async () => {
    try {
      const checkpoints = await automationEnhanced.getPendingCheckpoints();
      return { success: true, checkpoints };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('automation:clearCheckpoint', async (_, automationId) => {
    try {
      await automationEnhanced.clearCheckpoint(automationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('automation:isEncryptionAvailable', async () => {
    return credentialsService.isEncryptionAvailable();
  });

  // ═══════════════════════════════════════════════════════════
  // APP HANDLERS
  // ═══════════════════════════════════════════════════════════
  
  ipcMain.handle('app:version', () => appVersion);

  ipcMain.handle('app:check-updates', async () => {
    if (isDev) {
      return { updateAvailable: false, version: appVersion };
    }
    
    try {
      const { updaterService } = await import('../services/updater.service');
      const result = await updaterService.checkForUpdates();
      return result;
    } catch {
      return { updateAvailable: false, version: appVersion };
    }
  });

  ipcMain.handle('app:download-update', async () => {
    if (isDev) {
      return { success: false, error: 'Updates not available in development mode' };
    }
    
    try {
      const { updaterService } = await import('../services/updater.service');
      await updaterService.downloadUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('app:install-update', async () => {
    if (isDev) {
      return { success: false, error: 'Updates not available in development mode' };
    }
    
    try {
      const { updaterService } = await import('../services/updater.service');
      updaterService.installUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('app:is-update-downloaded', async () => {
    if (isDev) {
      return false;
    }
    
    try {
      const { updaterService } = await import('../services/updater.service');
      return updaterService.isUpdateDownloaded();
    } catch {
      return false;
    }
  });
}
