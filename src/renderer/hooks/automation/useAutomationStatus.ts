import { useEffect } from 'react';
import { useAutomationStore } from '../../stores/automation-store';
import type { AutomationProgress } from '@shared/types';

/**
 * Hook to subscribe to real-time automation status via IPC events
 * Updates the Zustand store which components can then read from
 */
export function useAutomationStatus() {
  const progress = useAutomationStore((state) => state.progress);
  const setProgress = useAutomationStore((state) => state.setProgress);
  const reset = useAutomationStore((state) => state.reset);
  
  useEffect(() => {
    // Subscribe to progress events from worker thread
    const unsubProgress = window.electronAPI.onAutomationProgress(
      (newProgress: AutomationProgress) => {
        setProgress(newProgress);
      }
    );
    
    // Subscribe to completion events
    const unsubComplete = window.electronAPI.onAutomationComplete(() => {
      setProgress({
        status: 'completed',
        currentDay: 0,
        totalDays: 0,
        currentEntry: 0,
        totalEntries: 0,
        message: 'Automation completed successfully',
        logs: [],
      });
    });
    
    // Subscribe to error events
    const unsubError = window.electronAPI.onAutomationError((error) => {
      setProgress({
        status: 'error',
        currentDay: 0,
        totalDays: 0,
        currentEntry: 0,
        totalEntries: 0,
        message: error.error || 'Unknown error occurred',
        logs: [],
      });
    });
    
    // Cleanup listeners on unmount
    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, [setProgress, reset]);
  
  return {
    status: progress?.status || 'idle',
    progress,
    currentDay: progress?.currentDay || 0,
    totalDays: progress?.totalDays || 0,
    currentEntry: progress?.currentEntry || 0,
    totalEntries: progress?.totalEntries || 0,
    message: progress?.message || '',
  };
}
