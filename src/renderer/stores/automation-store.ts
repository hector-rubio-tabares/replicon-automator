import { create } from 'zustand';
import type { AutomationProgress, LogEntry } from '@shared/types';

/**
 * Real-time automation state store
 * Updated by IPC events from the worker thread
 */
interface AutomationState {
  // Current automation progress
  progress: AutomationProgress | null;
  // Real-time logs from worker
  logs: LogEntry[];
  // Actions
  setProgress: (progress: AutomationProgress) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  reset: () => void;
}

export const useAutomationStore = create<AutomationState>((set) => ({
  progress: null,
  logs: [],
  
  setProgress: (progress) => set({ progress }),
  
  addLog: (log) => set((state) => ({
    logs: [...state.logs, log]
  })),
  
  clearLogs: () => set({ logs: [] }),
  
  reset: () => set({ 
    progress: null, 
    logs: [] 
  }),
}));
