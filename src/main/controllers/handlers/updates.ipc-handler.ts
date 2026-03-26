import { ipcMain } from 'electron';

export interface UpdatesHandlerDeps {
  appVersion: string;
}

/**
 * Configura los handlers IPC para actualizaciones de la aplicación
 * @param deps - Dependencias inyectadas
 */
export function setupUpdatesHandlers(deps: UpdatesHandlerDeps): void {
  const { appVersion } = deps;

  /**
   * Handler: app:version
   * Retorna la versión actual de la aplicación
   */
  ipcMain.handle('app:version', () => appVersion);

  /**
   * Handler: app:check-updates
   * Verifica si hay actualizaciones disponibles
   */
  ipcMain.handle('app:check-updates', async () => {
    try {
      const { updaterService } = await import('../../services/updater.service');
      const result = await updaterService.checkForUpdates();
      return result;
    } catch {
      return { updateAvailable: false, version: appVersion };
    }
  });

  /**
   * Handler: app:download-update
   * Descarga una actualización disponible
   */
  ipcMain.handle('app:download-update', async () => {
    try {
      const { updaterService } = await import('../../services/updater.service');
      await updaterService.downloadUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  /**
   * Handler: app:install-update
   * Instala una actualización descargada
   */
  ipcMain.handle('app:install-update', async () => {
    try {
      const { updaterService } = await import('../../services/updater.service');
      updaterService.installUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  /**
   * Handler: app:is-update-downloaded
   * Verifica si hay una actualización ya descargada
   */
  ipcMain.handle('app:is-update-downloaded', async () => {
    try {
      const { updaterService } = await import('../../services/updater.service');
      return updaterService.isUpdateDownloaded();
    } catch {
      return false;
    }
  });
}
