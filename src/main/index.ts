/**
 * Main Process Entry Point
 * Electron application bootstrap
 */

import { app, BrowserWindow, nativeImage, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { PlaywrightAutomation } from './services';
import { setupIPCHandlers, setupGlobalShortcuts, unregisterAllShortcuts } from './controllers';
import { closeBrowser } from './services/automation-enhanced.service';
import { updaterService } from './services/updater.service';
import { DEFAULT_CONFIG, DEFAULT_MAPPINGS, DEFAULT_HORARIOS } from '../shared/constants';
import { setupDevLogger, setMainWindowForLogs } from './utils/dev-logger';

// ═══════════════════════════════════════════════════════════
// APPLICATION STATE
// ═══════════════════════════════════════════════════════════

const store = new Store<Record<string, unknown>>({
  defaults: {
    config: DEFAULT_CONFIG,
    mappings: DEFAULT_MAPPINGS,
    horarios: DEFAULT_HORARIOS,
  }
});

let mainWindow: BrowserWindow | null = null;
let automation: PlaywrightAutomation | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ═══════════════════════════════════════════════════════════
// STATE ACCESSORS (for dependency injection)
// ═══════════════════════════════════════════════════════════

const getMainWindow = () => mainWindow;
const getAutomation = () => automation;
const setAutomation = (instance: PlaywrightAutomation | null) => { automation = instance; };

// ═══════════════════════════════════════════════════════════
// WINDOW CREATION
// ═══════════════════════════════════════════════════════════

function createWindow(): void {
  const iconPath = isDev 
    ? path.join(process.cwd(), 'assets', 'icon.ico')
    : path.join(__dirname, '..', '..', '..', 'assets', 'icon.ico');

  let appIcon;
  if (fs.existsSync(iconPath)) {
    appIcon = nativeImage.createFromPath(iconPath);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev, // Deshabilitar DevTools en producción
    },
    icon: appIcon || iconPath,
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#0f172a',
    autoHideMenuBar: !isDev, // Ocultar menú en producción
  });

  // En producción solo ocultar menú (autoHideMenuBar), no eliminarlo
  // Menu.setApplicationMenu(null) causa problemas de focus en inputs

  if (process.platform === 'win32' && appIcon) {
    app.setAppUserModelId('com.hdrt.replicon-automator');
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    setMainWindowForLogs(null);
    mainWindow = null;
  });
}

// ═══════════════════════════════════════════════════════════
// APPLICATION LIFECYCLE
// ═══════════════════════════════════════════════════════════

app.whenReady().then(() => {
  // Configurar logger de desarrollo
  setupDevLogger();
  
  createWindow();
  
  // Conectar ventana para logs de desarrollo
  if (isDev && mainWindow) {
    setMainWindowForLogs(mainWindow);
  }
  
  // Inicializar el servicio de actualizaciones
  if (mainWindow) {
    updaterService.initialize(mainWindow);
  }
  
  setupIPCHandlers({
    store,
    getMainWindow,
    getAutomation,
    setAutomation,
    isDev,
    appVersion: app.getVersion(),
  });
  
  setupGlobalShortcuts(getMainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    // Preguntar si quiere instalar la actualización antes de cerrar
    const shouldQuit = await updaterService.promptInstallOnQuit();
    if (shouldQuit) {
      app.quit();
    }
  }
});

app.on('will-quit', () => {
  unregisterAllShortcuts();
});

app.on('before-quit', async () => {
  if (automation) {
    await automation.stop();
  }
  // Close preloaded browser if any
  await closeBrowser();
});
