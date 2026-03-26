import { useMutation } from '@tanstack/react-query';
import type { StartAutomationRequest } from '@shared/types';
import { useAutomationStore } from '../../stores/automation-store';
import { useExecutionHistoryStore } from '../../stores/execution-history-store';

interface AutomationResult {
  success: boolean;
  error?: string;
}

/**
 * React Query mutation for starting automation
 * Handles the automation lifecycle: idle → running → success/error
 */
export function useAutomationMutation() {
  const clearLogs = useAutomationStore((state) => state.clearLogs);
  const addExecution = useExecutionHistoryStore((state) => state.addExecution);
  
  const mutation = useMutation<AutomationResult, Error, StartAutomationRequest>({
    mutationFn: async (request: StartAutomationRequest) => {
      // Clear logs before starting
      clearLogs();
      
      // Call IPC to start automation
      const result = await window.electronAPI.startAutomation(request);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown automation error');
      }
      
      return result;
    },
    
    onSuccess: (_result, variables) => {
      // Record successful execution in history
      addExecution({
        status: 'success',
        duration: 0, // Will be updated by progress events
        rowsProcessed: variables.csvData.length,
        rowsTotal: variables.csvData.length,
        csvFileName: undefined,
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
      });
    },
    
    onError: (error, variables) => {
      // Record failed execution in history
      addExecution({
        status: 'error',
        duration: 0,
        rowsProcessed: 0,
        rowsTotal: variables.csvData.length,
        errorMessage: error.message,
        csvFileName: undefined,
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
      });
    },
  });
  
  return mutation;
}

/**
 * Hook to stop the running automation
 */
export function useStopAutomation() {
  const reset = useAutomationStore((state) => state.reset);
  const addExecution = useExecutionHistoryStore((state) => state.addExecution);
  
  const mutation = useMutation<{ success: boolean }, Error, void>({
    mutationFn: async () => {
      const result = await window.electronAPI.stopAutomation();
      return result;
    },
    
    onSuccess: () => {
      // Record cancelled execution
      addExecution({
        status: 'cancelled',
        duration: 0,
        rowsProcessed: 0,
        rowsTotal: 0,
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
      });
      
      // Reset automation state
      reset();
    },
  });
  
  return mutation;
}

/**
 * Hook to pause/resume automation
 */
export function usePauseAutomation() {
  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: async () => {
      const result = await window.electronAPI.pauseAutomation();
      return result;
    },
  });
}
