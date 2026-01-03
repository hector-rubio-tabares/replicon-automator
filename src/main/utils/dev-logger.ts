import { BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
let mainWindow: BrowserWindow | null = null;
let isSetup = false;
let logFilePath: string | null = null;
let isDev = false;
const PROD_LOG_LEVELS = ['error', 'warn', 'fatal'];
function shouldLog(level: string): boolean {
  if (isDev) return true; 
  return PROD_LOG_LEVELS.includes(level.toLowerCase());
}
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}
function initLogFile() {
  try {
    const logDir = 'C:\\RepliconLogs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const date = new Date().toISOString().split('T')[0];
    logFilePath = path.join(logDir, `replicon-${date}.log`);
    writeRaw('='.repeat(60));
    writeRaw(`Session started at ${new Date().toISOString()}`);
    writeRaw(`App version: ${app.getVersion()}`);
    writeRaw(`Is packaged: ${app.isPackaged}`);
    writeRaw(`Platform: ${process.platform}`);
    writeRaw(`Arch: ${process.arch}`);
    writeRaw(`Node: ${process.version}`);
    writeRaw(`Electron: ${process.versions.electron}`);
    writeRaw('='.repeat(60));
  } catch {
    // Log file initialization failed, continue without file logging
  }
}
function writeRaw(message: string) {
  if (!logFilePath) return;
  try {
    const cleanMessage = stripAnsi(message);
    fs.appendFileSync(logFilePath, `${cleanMessage}\n`);
  } catch {
    // Ignore write errors
  }
}
function writeLog(level: string, source: string, message: string) {
  if (!logFilePath) return;
  if (!shouldLog(level)) return; 
  try {
    const cleanMessage = stripAnsi(message);
    const hasTimestamp = /^\[20\d{2}-\d{2}-\d{2}T/.test(cleanMessage);
    if (hasTimestamp) {
      fs.appendFileSync(logFilePath, `${cleanMessage}\n`);
    } else {
      const timestamp = new Date().toISOString();
      fs.appendFileSync(logFilePath, `[${timestamp}] [${level.toUpperCase()}] [${source}] ${cleanMessage}\n`);
    }
  } catch {
    // Ignore write errors
  }
}
export function logToFile(level: string, source: string, message: string) {
  if (!shouldLog(level)) return; 
  writeLog(level, source, message);
}
export function setMainWindowForLogs(window: BrowserWindow | null) {
  mainWindow = window;
  writeLog('INFO', 'MAIN', 'Main window reference set');
}
function sendLogToRenderer(level: string, message: string) {
  writeLog(level, 'MAIN', message);
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('main:log', { level, message });
    } catch {
      // Window was destroyed, ignore
    }
  }
}
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};
export function setupDevLogger() {
  isDev = !app.isPackaged;
  initLogFile();
  if (isSetup) return;
  isSetup = true;
  process.on('uncaughtException', (error) => {
    writeLog('FATAL', 'MAIN', `Uncaught Exception: ${error.message}`);
    writeLog('FATAL', 'MAIN', `Stack: ${error.stack}`);
    if (app.isPackaged) {
      import('electron').then(({ dialog }) => {
        dialog.showErrorBox('Application Error', `${error.message}\n\nCheck logs at C:\\RepliconLogs for details.`);
      });
    }
  });
  process.on('unhandledRejection', (reason) => {
    writeLog('FATAL', 'MAIN', `Unhandled Rejection: ${String(reason)}`);
    if (reason instanceof Error) {
      writeLog('FATAL', 'MAIN', `Stack: ${reason.stack}`);
    }
  });
  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    sendLogToRenderer('info', args.map(formatArg).join(' '));
  };
  console.info = (...args: unknown[]) => {
    originalConsole.info(...args);
    sendLogToRenderer('info', args.map(formatArg).join(' '));
  };
  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    sendLogToRenderer('warn', args.map(formatArg).join(' '));
  };
  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    sendLogToRenderer('error', args.map(formatArg).join(' '));
  };
  console.debug = (...args: unknown[]) => {
    originalConsole.debug(...args);
    sendLogToRenderer('debug', args.map(formatArg).join(' '));
  };
  writeLog('INFO', 'MAIN', 'Dev logger setup complete');
}
function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return stripAnsi(arg);
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}
