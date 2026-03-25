import { useEffect } from 'react';
import { useAutomationStore } from '../../stores/automation-store';
import type { LogEntry } from '@shared/types';

/**
 * Hook to subscribe to real-time automation logs via IPC events
 * Logs are streamed from the worker thread and stored in Zustand
 */
export function useAutomationLogs() {
  const logs = useAutomationStore((state) => state.logs);
  const addLog = useAutomationStore((state) => state.addLog);
  const clearLogs = useAutomationStore((state) => state.clearLogs);
  
  useEffect(() => {
    // Subscribe to log events from worker thread
    const unsubLog = window.electronAPI.onAutomationLog((log: LogEntry) => {
      addLog(log);
    });
    
    // Cleanup listener on unmount
    return () => {
      unsubLog();
    };
  }, [addLog]);
  
  return {
    logs,
    clearLogs,
  };
}
