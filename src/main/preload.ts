import { contextBridge, ipcRenderer } from 'electron';
import type { 
  StartAutomationRequest, 
  Credentials, 
  CSVRow, 
  AutomationProgress,
  LogEntry 
} from '../shared/types';

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // CSV
  loadCSV: () => ipcRenderer.invoke('csv:load'),
  saveCSV: (data: CSVRow[]) => ipcRenderer.invoke('csv:save', data),

  // Credenciales
  saveCredentials: (credentials: Credentials) => 
    ipcRenderer.invoke('credentials:save', credentials),
  loadCredentials: () => ipcRenderer.invoke('credentials:load'),
  clearCredentials: () => ipcRenderer.invoke('credentials:clear'),

  // Config
  getConfig: (key: string) => ipcRenderer.invoke('config:get', key),
  setConfig: (key: string, value: unknown) => 
    ipcRenderer.invoke('config:set', key, value),

  // Automatización
  startAutomation: (request: StartAutomationRequest) => 
    ipcRenderer.invoke('automation:start', request),
  stopAutomation: () => ipcRenderer.invoke('automation:stop'),
  pauseAutomation: () => ipcRenderer.invoke('automation:pause'),

  // Automatización Avanzada (Dry Run, Validation, Recovery)
  validateAutomation: (data: { csvData: CSVRow[]; mappings: Record<string, string>; horarios: Record<string, unknown> }) =>
    ipcRenderer.invoke('automation:validate', data),
  dryRunAutomation: (data: { csvData: CSVRow[]; mappings: Record<string, string>; horarios: Record<string, unknown>; config: Record<string, unknown> }) =>
    ipcRenderer.invoke('automation:dryRun', data),
  saveCheckpoint: (checkpoint: { automationId: string; currentRowIndex: number; processedRows: number[]; state: Record<string, unknown> }) =>
    ipcRenderer.invoke('automation:saveCheckpoint', checkpoint),
  loadCheckpoint: (automationId: string) =>
    ipcRenderer.invoke('automation:loadCheckpoint', automationId),
  hasPendingRecovery: () =>
    ipcRenderer.invoke('automation:hasPendingRecovery'),
  getPendingCheckpoints: () =>
    ipcRenderer.invoke('automation:getPendingCheckpoints'),
  clearCheckpoint: (automationId: string) =>
    ipcRenderer.invoke('automation:clearCheckpoint', automationId),
  isEncryptionAvailable: () =>
    ipcRenderer.invoke('automation:isEncryptionAvailable'),

  // App info y updates
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('app:check-updates'),
  downloadUpdate: () => ipcRenderer.invoke('app:download-update'),
  installUpdate: () => ipcRenderer.invoke('app:install-update'),
  isUpdateDownloaded: () => ipcRenderer.invoke('app:is-update-downloaded'),
  onUpdateProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
    ipcRenderer.on('update-download-progress', (_, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('update-download-progress');
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', () => callback());
    return () => ipcRenderer.removeAllListeners('update-downloaded');
  },

  // Eventos de automatización
  onAutomationProgress: (callback: (progress: AutomationProgress) => void) => {
    ipcRenderer.on('automation:progress', (_, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('automation:progress');
  },
  onAutomationLog: (callback: (log: LogEntry) => void) => {
    ipcRenderer.on('automation:log', (_, log) => callback(log));
    return () => ipcRenderer.removeAllListeners('automation:log');
  },
  onAutomationComplete: (callback: (result: { success: boolean }) => void) => {
    ipcRenderer.on('automation:complete', (_, result) => callback(result));
    return () => ipcRenderer.removeAllListeners('automation:complete');
  },
  onAutomationError: (callback: (error: { error: string }) => void) => {
    ipcRenderer.on('automation:error', (_, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('automation:error');
  },

  // Atajos de teclado globales
  onShortcutLoadCSV: (callback: () => void) => {
    ipcRenderer.on('shortcut:load-csv', () => callback());
    return () => ipcRenderer.removeAllListeners('shortcut:load-csv');
  },
  onShortcutSaveCSV: (callback: () => void) => {
    ipcRenderer.on('shortcut:save-csv', () => callback());
    return () => ipcRenderer.removeAllListeners('shortcut:save-csv');
  },
  onShortcutRunAutomation: (callback: () => void) => {
    ipcRenderer.on('shortcut:run-automation', () => callback());
    return () => ipcRenderer.removeAllListeners('shortcut:run-automation');
  },
  onShortcutToggleTheme: (callback: () => void) => {
    ipcRenderer.on('shortcut:toggle-theme', () => callback());
    return () => ipcRenderer.removeAllListeners('shortcut:toggle-theme');
  },
  onShortcutToggleLanguage: (callback: () => void) => {
    ipcRenderer.on('shortcut:toggle-language', () => callback());
    return () => ipcRenderer.removeAllListeners('shortcut:toggle-language');
  },
  onShortcutGoToTab: (callback: (tab: number) => void) => {
    ipcRenderer.on('shortcut:go-to-tab', (_, tab) => callback(tab));
    return () => ipcRenderer.removeAllListeners('shortcut:go-to-tab');
  },
  onShortcutShowShortcuts: (callback: () => void) => {
    ipcRenderer.on('shortcut:show-shortcuts', () => callback());
    return () => ipcRenderer.removeAllListeners('shortcut:show-shortcuts');
  },
});

// Tipos para TypeScript en el renderer
declare global {
  interface Window {
    electronAPI: {
      loadCSV: () => Promise<{ success: boolean; data?: CSVRow[]; error?: string; filePath?: string }>;
      saveCSV: (data: CSVRow[]) => Promise<{ success: boolean; error?: string }>;
      saveCredentials: (credentials: Credentials) => Promise<boolean>;
      loadCredentials: () => Promise<Credentials | null>;
      clearCredentials: () => Promise<boolean>;
      getConfig: (key: string) => Promise<unknown>;
      setConfig: (key: string, value: unknown) => Promise<boolean>;
      startAutomation: (request: StartAutomationRequest) => Promise<{ success: boolean; error?: string }>;
      stopAutomation: () => Promise<{ success: boolean }>;
      pauseAutomation: () => Promise<{ success: boolean }>;
      // Advanced automation
      validateAutomation: (data: { csvData: CSVRow[]; mappings: Record<string, string>; horarios: Record<string, unknown> }) => 
        Promise<{ success: boolean; result?: { isValid: boolean; errors: string[]; warnings: string[]; suggestions: string[] }; error?: string }>;
      dryRunAutomation: (data: { csvData: CSVRow[]; mappings: Record<string, string>; horarios: Record<string, unknown>; config: Record<string, unknown> }) =>
        Promise<{ success: boolean; result?: { steps: unknown[]; estimatedDuration: number; warnings: string[] }; error?: string }>;
      saveCheckpoint: (checkpoint: { automationId: string; currentRowIndex: number; processedRows: number[]; state: Record<string, unknown> }) =>
        Promise<{ success: boolean; error?: string }>;
      loadCheckpoint: (automationId: string) =>
        Promise<{ success: boolean; checkpoint?: unknown; error?: string }>;
      hasPendingRecovery: () => Promise<{ success: boolean; hasPending?: boolean; error?: string }>;
      getPendingCheckpoints: () => Promise<{ success: boolean; checkpoints?: unknown[]; error?: string }>;
      clearCheckpoint: (automationId: string) => Promise<{ success: boolean; error?: string }>;
      isEncryptionAvailable: () => Promise<boolean>;
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<{ updateAvailable: boolean; version?: string }>;
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
      installUpdate: () => Promise<{ success: boolean; error?: string }>;
      isUpdateDownloaded: () => Promise<boolean>;
      onUpdateProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      onAutomationProgress: (callback: (progress: AutomationProgress) => void) => () => void;
      onAutomationLog: (callback: (log: LogEntry) => void) => () => void;
      onAutomationComplete: (callback: (result: { success: boolean }) => void) => () => void;
      onAutomationError: (callback: (error: { error: string }) => void) => () => void;
      onShortcutLoadCSV: (callback: () => void) => () => void;
      onShortcutSaveCSV: (callback: () => void) => () => void;
      onShortcutRunAutomation: (callback: () => void) => () => void;
      onShortcutToggleTheme: (callback: () => void) => () => void;
      onShortcutToggleLanguage: (callback: () => void) => () => void;
      onShortcutGoToTab: (callback: (tab: number) => void) => () => void;
      onShortcutShowShortcuts: (callback: () => void) => () => void;
    };
  }
}
