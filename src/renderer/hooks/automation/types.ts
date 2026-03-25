/**
 * Type definitions for automation hooks
 */

import type { AutomationProgress, LogEntry, StartAutomationRequest } from '@shared/types';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Automation mutation result type
 */
export interface AutomationResult {
  success: boolean;
  error?: string;
}

/**
 * Return type for useAutomationMutation hook
 */
export type UseAutomationMutationReturn = UseMutationResult<
  AutomationResult,
  Error,
  StartAutomationRequest,
  unknown
>;

/**
 * Return type for useStopAutomation hook
 */
export type UseStopAutomationReturn = UseMutationResult<
  { success: boolean },
  Error,
  void,
  unknown
>;

/**
 * Return type for usePauseAutomation hook
 */
export type UsePauseAutomationReturn = UseMutationResult<
  { success: boolean },
  Error,
  void,
  unknown
>;

/**
 * Return type for useAutomationStatus hook
 */
export interface UseAutomationStatusReturn {
  status: AutomationProgress['status'];
  progress: AutomationProgress | null;
  currentDay: number;
  totalDays: number;
  currentEntry: number;
  totalEntries: number;
  message: string;
}

/**
 * Return type for useAutomationLogs hook
 */
export interface UseAutomationLogsReturn {
  logs: LogEntry[];
  clearLogs: () => void;
}
