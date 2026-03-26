/**
 * Domain types for automation workflows
 */

export interface AutomationCheckpoint {
  id: string;
  timestamp: number;
  currentDay: number;
  totalDays: number;
  completedEntries: number[];
  csvData: string;
  status: 'in-progress' | 'paused' | 'error';
  errorMessage?: string;
  lastSuccessfulDay?: number;
}

export interface DryRunResult {
  success: boolean;
  totalDays: number;
  workDays: number;
  vacationDays: number;
  holidayDays: number;
  weekendDays: number;
  totalEntries: number;
  entriesPerDay: { day: number; count: number; entries: string[] }[];
  warnings: string[];
  errors: string[];
  estimatedDuration: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
