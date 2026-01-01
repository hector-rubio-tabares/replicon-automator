import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { PlaywrightAutomation } from './services/playwright-automation';
import { CSVService } from './services/csv-service';
import { CredentialsService } from './services/credentials-service';
import { DEFAULT_CONFIG, DEFAULT_MAPPINGS, DEFAULT_HORARIOS } from '../shared/constants';

// Store para persistencia
const store = new Store({
  defaults: {
    config: DEFAULT_CONFIG,
    mappings: DEFAULT_MAPPINGS,
    horarios: DEFAULT_HORARIOS,
  }
});

let mainWindow: BrowserWindow | null = null;
let automation: PlaywrightAutomation | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../assets/icon.ico'),
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#0f172a',
  });

  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
function setupIPCHandlers() {
  const csvService = new CSVService();
  const credentialsService = new CredentialsService();

  // Cargar CSV
  ipcMain.handle('csv:load', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Operación cancelada' };
    }

    return csvService.loadCSV(result.filePaths[0]);
  });

  // Guardar CSV
  ipcMain.handle('csv:save', async (_, data) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      defaultPath: 'replicon_data.csv',
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Operación cancelada' };
    }

    return csvService.saveCSV(result.filePath, data);
  });

  // Credenciales
  ipcMain.handle('credentials:save', async (_, credentials) => {
    return credentialsService.saveCredentials(credentials);
  });

  ipcMain.handle('credentials:load', async () => {
    return credentialsService.loadCredentials();
  });

  ipcMain.handle('credentials:clear', async () => {
    return credentialsService.clearCredentials();
  });

  // Config
  ipcMain.handle('config:get', async (_, key) => {
    return store.get(key);
  });

  ipcMain.handle('config:set', async (_, key, value) => {
    store.set(key, value);
    return true;
  });

  // Automatización
  ipcMain.handle('automation:start', async (_, request) => {
    if (automation) {
      return { success: false, error: 'Ya hay una automatización en ejecución' };
    }

    automation = new PlaywrightAutomation(
      request.config,
      (progress) => {
        mainWindow?.webContents.send('automation:progress', progress);
      },
      (log) => {
        mainWindow?.webContents.send('automation:log', log);
      }
    );

    try {
      await automation.start(request.credentials, request.csvData, request.horarios, request.mappings);
      mainWindow?.webContents.send('automation:complete', { success: true });
      return { success: true };
    } catch (error) {
      mainWindow?.webContents.send('automation:error', { error: String(error) });
      return { success: false, error: String(error) };
    } finally {
      automation = null;
    }
  });

  ipcMain.handle('automation:stop', async () => {
    if (automation) {
      await automation.stop();
      automation = null;
    }
    return { success: true };
  });

  ipcMain.handle('automation:pause', async () => {
    if (automation) {
      automation.togglePause();
    }
    return { success: true };
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  setupIPCHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (automation) {
    await automation.stop();
  }
});
