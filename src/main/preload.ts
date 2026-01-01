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
      onAutomationProgress: (callback: (progress: AutomationProgress) => void) => () => void;
      onAutomationLog: (callback: (log: LogEntry) => void) => () => void;
      onAutomationComplete: (callback: (result: { success: boolean }) => void) => () => void;
      onAutomationError: (callback: (error: { error: string }) => void) => () => void;
    };
  }
}
