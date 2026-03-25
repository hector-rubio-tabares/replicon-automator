import { ipcMain, dialog, BrowserWindow } from 'electron';
import type { CSVService } from '../../services/csv.service.js';
import type { CSVRow } from '../../../common/types.js';

export interface CSVHandlerDeps {
  csvService: CSVService;
  getMainWindow: () => BrowserWindow | null;
}

/**
 * Configura los handlers IPC para operaciones CSV
 * @param deps - Dependencias inyectadas
 */
export function setupCSVHandlers(deps: CSVHandlerDeps): void {
  const { csvService, getMainWindow } = deps;

  /**
   * Handler: csv:load
   * Abre un diálogo para seleccionar y cargar un archivo CSV
   */
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

  /**
   * Handler: csv:save
   * Abre un diálogo para guardar datos en un archivo CSV
   */
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
}
