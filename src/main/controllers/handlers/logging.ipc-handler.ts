import { ipcMain } from 'electron';
import { logToFile } from '../../utils/dev-logger.js';

/**
 * Configura los handlers IPC para logging desde renderer
 */
export function setupLoggingHandlers(): void {
  /**
   * Handler: renderer:log
   * Recibe logs del renderer y los escribe en el archivo de log del main process
   */
  ipcMain.on('renderer:log', (_, data: { level: string; source: string; message: string }) => {
    logToFile(data.level, `RENDERER:${data.source}`, data.message);
  });
}
