import { app, BrowserWindow, nativeImage, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { PlaywrightAutomation } from './services';
import { setupIPCHandlers } from './controllers';
import { closeBrowser } from './services/automation-enhanced.service';
import { updaterService } from './services/updater.service';
import { DEFAULT_MAPPINGS, DEFAULT_HORARIOS, DEFAULT_CONFIG } from '../common/constants';
import { setupDevLogger, setMainWindowForLogs } from './utils/dev-logger';
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
    show: false,
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
    mainWindow.loadURL(`http://localhost:${devPort}`);
  } else {
    const htmlPath = path.join(__dirname, '../../renderer/index.html');
    mainWindow.loadFile(htmlPath);
  }
  mainWindow.webContents.on('did-finish-load', () => {
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'bottom' });
    }
  });
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
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
    isDev,
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
