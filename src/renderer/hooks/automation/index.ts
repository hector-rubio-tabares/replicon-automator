/**
 * Automation lifecycle hooks using React Query + Zustand
 * 
 * Architecture:
 * - React Query mutations handle automation start/stop/pause (async operations)
 * - Zustand store holds real-time state updated by IPC events
 * - Hooks subscribe to IPC events and update Zustand store
 * - Components read from Zustand store for reactive UI updates
 */

export { 
  useAutomationMutation, 
  useStopAutomation, 
  usePauseAutomation 
} from './useAutomationMutation';

export { useAutomationStatus } from './useAutomationStatus';
export { useAutomationLogs } from './useAutomationLogs';

export type {
  AutomationResult,
  UseAutomationMutationReturn,
  UseStopAutomationReturn,
  UsePauseAutomationReturn,
  UseAutomationStatusReturn,
  UseAutomationLogsReturn,
} from './types';
