/**
 * Example usage of automation hooks with React Query
 * 
 * This demonstrates the proper integration of:
 * - React Query mutations for automation lifecycle
 * - Real-time IPC events flowing into Zustand store
 * - Component reading from both mutation state and store
 */

import { 
  useAutomationMutation, 
  useStopAutomation,
  usePauseAutomation,
  useAutomationStatus, 
  useAutomationLogs 
} from './index';
import type { StartAutomationRequest, Credentials, AppConfig } from '@shared/types';

export function AutomationComponent() {
  // React Query mutation for starting automation
  const automationMutation = useAutomationMutation();
  const stopMutation = useStopAutomation();
  const pauseMutation = usePauseAutomation();
  
  // Real-time status from Zustand (updated by IPC events)
  const { status, currentEntry, totalEntries, message } = useAutomationStatus();
  
  // Real-time logs from Zustand (updated by IPC events)
  const { logs } = useAutomationLogs();
  
  const handleStart = () => {
    // Example request - replace with actual data
    const credentials: Credentials = {
      email: 'user@example.com',
      password: 'password',
      rememberMe: true,
    };
    
    const config: AppConfig = {
      loginUrl: 'https://example.replicon.com',
      timeout: 30000,
      headless: true,
      autoSave: true,
    };
    
    const request: StartAutomationRequest = {
      credentials,
      csvData: [],
      horarios: [],
      mappings: {},
      config,
      selectedMonth: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
    };
    
    automationMutation.mutate(request);
  };
  
  const handleStop = () => {
    stopMutation.mutate();
  };
  
  const handlePause = () => {
    pauseMutation.mutate();
  };
  
  return (
    <div>
      {/* Mutation state: idle | pending | success | error */}
      <div>
        Mutation Status: {automationMutation.status}
      </div>
      
      {/* Real-time automation status from worker */}
      <div>
        Automation Status: {status}
      </div>
      
      {/* Progress indicators */}
      <div>
        Progress: {currentEntry} / {totalEntries}
      </div>
      
      {/* Message from worker */}
      <div>{message}</div>
      
      {/* Control buttons */}
      <button 
        onClick={handleStart} 
        disabled={automationMutation.isPending || status === 'running'}
      >
        {automationMutation.isPending ? 'Starting...' : 'Start'}
      </button>
      
      <button 
        onClick={handleStop} 
        disabled={status !== 'running'}
      >
        Stop
      </button>
      
      <button 
        onClick={handlePause}
        disabled={status !== 'running' && status !== 'paused'}
      >
        {status === 'paused' ? 'Resume' : 'Pause'}
      </button>
      
      {/* Error handling */}
      {automationMutation.isError && (
        <div>Error: {automationMutation.error.message}</div>
      )}
      
      {/* Real-time logs */}
      <div>
        {logs.map((log, index: number) => (
          <div key={index} className={`log-${log.level}`}>
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
