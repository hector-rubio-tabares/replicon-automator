import { BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let isSetup = false;
let logFilePath: string | null = null;

// Crear carpeta de logs en C:\RepliconLogs
function initLogFile() {
  try {
    const logDir = 'C:\\RepliconLogs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const date = new Date().toISOString().split('T')[0];
    logFilePath = path.join(logDir, `replicon-${date}.log`);
    writeToFile('='.repeat(60));
    writeToFile(`Session started at ${new Date().toISOString()}`);
    writeToFile(`App version: ${app.getVersion()}`);
    writeToFile(`Is packaged: ${app.isPackaged}`);
    writeToFile('='.repeat(60));
  } catch (err) {
    console.error('Failed to init log file:', err);
  }
}

function writeToFile(message: string) {
  if (!logFilePath) return;
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
  } catch {
    // Silently fail
  }
}

export function setMainWindowForLogs(window: BrowserWindow | null) {
  mainWindow = window;
}

function sendLogToRenderer(level: string, message: string) {
  // Siempre escribir a archivo
  writeToFile(`[${level.toUpperCase()}] ${message}`);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('main:log', { level, message });
    } catch {
      // Window may be closing
    }
  }
}

// Interceptar console.log, console.error, etc.
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

export function setupDevLogger() {
  // Inicializar archivo de logs siempre (dev y producción)
  initLogFile();
  
  if (isSetup) return;
  isSetup = true;

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
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}
