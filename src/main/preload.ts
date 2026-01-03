import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { 
  StartAutomationRequest, 
  Credentials, 
  CSVRow, 
  AutomationProgress,
  LogEntry 
} from '../common/types';

// Helper para crear listeners seguros sin memory leaks
function createSafeListener<T>(
  channel: string,
  callback: (data: T) => void
): () => void {
  const handler = (_event: IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('electronAPI', {
  // CSV Operations
  loadCSV: () => ipcRenderer.invoke('csv:load'),
  saveCSV: (data: CSVRow[]) => ipcRenderer.invoke('csv:save', data),
  
  // Credentials
  saveCredentials: (credentials: Credentials) => 
    ipcRenderer.invoke('credentials:save', credentials),
  loadCredentials: () => ipcRenderer.invoke('credentials:load'),
  clearCredentials: () => ipcRenderer.invoke('credentials:clear'),
  
  // Config
  getConfig: (key: string) => ipcRenderer.invoke('config:get', key),
  setConfig: (key: string, value: unknown) => 
    ipcRenderer.invoke('config:set', key, value),
  
  // Automation
  startAutomation: (request: StartAutomationRequest) => 
    ipcRenderer.invoke('automation:start', request),
  stopAutomation: () => ipcRenderer.invoke('automation:stop'),
  pauseAutomation: () => ipcRenderer.invoke('automation:pause'),
  validateAutomation: (data: { csvData: CSVRow[]; mappings: Record<string, string>; horarios: Record<string, unknown> }) =>
    ipcRenderer.invoke('automation:validate', data),
  dryRunAutomation: (data: { csvData: CSVRow[]; mappings: Record<string, string>; horarios: Record<string, unknown>; config: Record<string, unknown> }) =>
    ipcRenderer.invoke('automation:dryRun', data),
  
  // Checkpoints
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
  
  // App & Updates
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('app:check-updates'),
  downloadUpdate: () => ipcRenderer.invoke('app:download-update'),
  installUpdate: () => ipcRenderer.invoke('app:install-update'),
  isUpdateDownloaded: () => ipcRenderer.invoke('app:is-update-downloaded'),
  
  // Event Listeners (usando helper seguro para evitar memory leaks)
  onUpdateProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) =>
    createSafeListener('update-download-progress', callback),
  
  onUpdateDownloaded: (callback: (info: { version: string }) => void) =>
    createSafeListener('update-downloaded', callback),
  
  onUpdateError: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },
  
  onAutomationProgress: (callback: (progress: AutomationProgress) => void) =>
    createSafeListener('automation:progress', callback),
  
  onAutomationLog: (callback: (log: LogEntry) => void) =>
    createSafeListener('automation:log', callback),
  
  onAutomationComplete: (callback: (result: { success: boolean }) => void) =>
    createSafeListener('automation:complete', callback),
  
  onAutomationError: (callback: (error: { error: string }) => void) =>
    createSafeListener('automation:error', callback),
  
  onMainLog: (callback: (log: { level: string; message: string }) => void) =>
    createSafeListener('main:log', callback),
  
  // Send logs to main
  sendLogToMain: (level: string, source: string, message: string) => {
    ipcRenderer.send('renderer:log', { level, source, message });
  },
});
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
      downloadUpdate?: () => Promise<{ success: boolean; error?: string }>;
      installUpdate?: () => Promise<void>;
      isUpdateDownloaded?: () => Promise<boolean>;
      onUpdateProgress?: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void;
      onUpdateDownloaded?: (callback: (info: { version: string }) => void) => () => void;
      onUpdateError?: (callback: () => void) => () => void;
      onAutomationProgress: (callback: (progress: AutomationProgress) => void) => () => void;
      onAutomationLog: (callback: (log: LogEntry) => void) => () => void;
      onAutomationComplete: (callback: (result: { success: boolean }) => void) => () => void;
      onAutomationError: (callback: (error: { error: string }) => void) => () => void;
      onMainLog?: (callback: (log: { level: string; message: string }) => void) => () => void;
      sendLogToMain?: (level: string, source: string, message: string) => void;
    };
  }
}
