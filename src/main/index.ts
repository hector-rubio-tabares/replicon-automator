import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { app, BrowserWindow, nativeImage, Menu } from 'electron';
import Store from 'electron-store';
import { AutomationWorkerService } from './services/index.js';
import { setupIPCHandlers } from './controllers/index.js';
import { closeBrowser } from './services/automation-enhanced.service.js';
import { updaterService } from './services/updater.service.js';
import { playwrightRuntimeCheckService } from './services/playwright-runtime-check.service.js';
import { DEFAULT_MAPPINGS, DEFAULT_HORARIOS } from '../common/constants.js';
import { setupDevLogger, setMainWindowForLogs } from './utils/dev-logger.js';
import { productionLogger } from './utils/production-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno según el ambiente
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

if (isDev) {
  const envFile = '.env.development';
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    productionLogger.info('Environment loaded', { envPath });
  }
} else {
  // En producción, el .env.production está en el mismo directorio que el .exe
  const envFile = '.env.production';
  const appDir = path.dirname(process.resourcesPath);
  const envPath = path.join(appDir, envFile);

  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const envVars = envContent.split('\n').reduce((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return acc;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          acc[match[1].trim()] = match[2].trim();
        }
        return acc;
      }, {} as Record<string, string>);
      Object.assign(process.env, envVars);
    } catch {
      // Error silencioso, las variables se tomarán de los defaults si existen
    }
  }
}

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

/**
 * Migración de datos: Convierte mappings del formato antiguo {name, projects}
 * al nuevo formato plano (string directo) y elimina todas las cuentas excepto las 5 esenciales
 */
function migrateMappingsToFlatFormat(): void {
  try {
    // SIEMPRE resetear a las 5 cuentas esenciales desde DEFAULT_MAPPINGS
    const cleanMappings: Record<string, string> = { ...DEFAULT_MAPPINGS };
    
    productionLogger.info('Resetting mappings to 5 essential accounts only', {
      accounts: Object.keys(cleanMappings)
    });

    // Guardar mappings limpios
    store.set('mappings', cleanMappings);
    productionLogger.info('Mappings reset complete - only V, W, M, ND, FDS remain');
  } catch (error) {
    productionLogger.error('Failed to reset mappings, using defaults', { error });
    store.set('mappings', DEFAULT_MAPPINGS);
  }
}

// Ejecutar migración al inicio (FORZADO - siempre resetea)
migrateMappingsToFlatFormat();

// ========================================
// SINGLE INSTANCE LOCK
// Solo permitir una instancia de la aplicación
// ========================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Ya hay otra instancia corriendo, cerrar esta
  productionLogger.info('Another instance is already running. Quitting...');
  app.quit();
} else {
  // Esta es la única instancia, escuchar intentos de abrir otra
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    productionLogger.info('Attempted to open second instance. Focusing existing window...');
    
    // Si alguien intenta abrir otra instancia, devolver foco a la ventana existente
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
      mainWindow.show();
      
      // En Windows, traer la ventana al frente de forma más agresiva
      if (process.platform === 'win32') {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.setAlwaysOnTop(false);
      }
    }
  });
}

let mainWindow: BrowserWindow | null = null;
let automation: AutomationWorkerService | null = null;
const getMainWindow = () => mainWindow;
const getAutomation = () => automation;
const setAutomation = (instance: AutomationWorkerService | null) => { automation = instance; };
function createWindow(): void {
  const iconPath = isDev
    ? path.join(process.cwd(), 'assets', 'icon.ico')
    : path.join(__dirname, '..', '..', '..', 'assets', 'icon.ico');
  let appIcon;
  if (fs.existsSync(iconPath)) {
    appIcon = nativeImage.createFromPath(iconPath);
  }
  
  // Resolve and verify preload path
  const preloadPath = path.join(__dirname, 'preload.js');
  productionLogger.info('[Preload] Attempting to load preload script', { 
    preloadPath, 
    __dirname,
    exists: fs.existsSync(preloadPath) 
  });
  
  if (!fs.existsSync(preloadPath)) {
    productionLogger.error('[Preload] Preload script not found!', { preloadPath });
  }
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      devTools: isDev,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: '',
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
    // En producción, la estructura es: resources/app.asar/dist/main/index.js
    // Necesitamos cargar: resources/app.asar/dist/renderer/index.html
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    productionLogger.info('[Renderer] Loading HTML', { 
      htmlPath, 
      __dirname,
      exists: fs.existsSync(htmlPath) 
    });
    mainWindow.loadFile(htmlPath);
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    productionLogger.error('MainWindow did-fail-load', { errorCode, errorDescription, validatedURL });
    if (isDev) {
      mainWindow?.show();
      mainWindow?.webContents.openDevTools({ mode: 'bottom' });
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    productionLogger.error('MainWindow render-process-gone', details);
  });
  
  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    productionLogger.error('[Preload] Preload script error', { preloadPath, error: error.message, stack: error.stack });
  });

  // Filtrar mensajes de console irrelevantes del DevTools
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    // Filtrar errores conocidos de Autofill del DevTools
    if (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses')) {
      return; // Silenciar estos mensajes
    }
    // Dejar pasar otros mensajes de console importantes
    if (level === 2) { // 2 = error
      productionLogger.error(`[Renderer Console] ${message}`, { line, sourceId });
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    productionLogger.info('[Preload] Window finished loading');
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
  
  // Auto-updater solo en producción
  if (!isDev && mainWindow) {
    updaterService.initialize(mainWindow);
  }
  
  // Verificar que Playwright está disponible (especialmente importante después de actualizar)
  playwrightRuntimeCheckService.initialize();
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
