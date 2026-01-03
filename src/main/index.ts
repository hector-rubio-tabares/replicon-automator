import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { app, BrowserWindow, nativeImage, Menu } from 'electron';
import Store from 'electron-store';
import { PlaywrightAutomation } from './services';
import { setupIPCHandlers } from './controllers';
import { closeBrowser } from './services/automation-enhanced.service';
import { updaterService } from './services/updater.service';
import { DEFAULT_MAPPINGS, DEFAULT_HORARIOS } from '../common/constants';
import { setupDevLogger, setMainWindowForLogs } from './utils/dev-logger';

// Cargar variables de entorno según el ambiente
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const envFile = isDev ? '.env.development' : '.env.production';
dotenv.config({ path: path.join(process.cwd(), envFile) });

// Configuración por defecto con valores de .env
const DEFAULT_CONFIG = {
  loginUrl: process.env.REPLICON_LOGIN_URL || '',
  timeout: Number(process.env.REPLICON_TIMEOUT) || 45000,
  headless: process.env.REPLICON_HEADLESS === 'true',
  autoSave: process.env.REPLICON_AUTOSAVE !== 'false',
};

const store = new Store<Record<string, unknown>>({
  defaults: {
    config: DEFAULT_CONFIG,
    mappings: DEFAULT_MAPPINGS,
    horarios: DEFAULT_HORARIOS,
  }
});
let mainWindow: BrowserWindow | null = null;
let automation: PlaywrightAutomation | null = null;
const getMainWindow = () => mainWindow;
const getAutomation = () => automation;
const setAutomation = (instance: PlaywrightAutomation | null) => { automation = instance; };
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
      devTools: isDev,
      sandbox: true, // Seguridad adicional
    },
    icon: appIcon || iconPath,
    titleBarStyle: 'default',
    // En DEV mostramos la ventana inmediatamente para que no parezca que “no abre”.
    // En PROD seguimos esperando a `ready-to-show`.
    show: isDev,
    backgroundColor: '#0f172a',
    autoHideMenuBar: !isDev,
  });
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }
  if (process.platform === 'win32' && appIcon) {
    app.setAppUserModelId('com.hdrt.replicon-automator');
  }
  if (isDev) {
    const devPort = process.env.VITE_DEV_PORT || '5173';
    const devUrl = `http://localhost:${devPort}`;
    mainWindow.loadURL(devUrl);
  } else {
    const htmlPath = path.join(__dirname, '../../renderer/index.html');
    mainWindow.loadFile(htmlPath);
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    // eslint-disable-next-line no-console
    console.error('[MainWindow] did-fail-load', { errorCode, errorDescription, validatedURL });
    if (isDev) {
      mainWindow?.show();
      mainWindow?.webContents.openDevTools({ mode: 'bottom' });
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    // eslint-disable-next-line no-console
    console.error('[MainWindow] render-process-gone', details);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'bottom' });
    }
  });
  if (!isDev) {
    mainWindow.once('ready-to-show', () => {
      mainWindow?.show();
    });
  }
  mainWindow.on('closed', () => {
    setMainWindowForLogs(null);
    mainWindow = null;
  });
}
app.whenReady().then(() => {
  setupDevLogger();
  createWindow();
  if (isDev && mainWindow) {
    setMainWindowForLogs(mainWindow);
  }
  if (mainWindow) {
    updaterService.initialize(mainWindow);
  }
  setupIPCHandlers({
    store,
    getMainWindow,
    getAutomation,
    setAutomation,
    appVersion: app.getVersion(),
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    const shouldQuit = await updaterService.promptInstallOnQuit();
    if (shouldQuit) {
      app.quit();
    }
  }
});
app.on('before-quit', async () => {
  if (automation) {
    await automation.stop();
  }
  await closeBrowser();
});
