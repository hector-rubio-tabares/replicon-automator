export type AccountMappings = Record<string, string>;
export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}
export interface TimeEntry {
  start_time: string;
  end_time: string;
  account: string;
}
export interface DailyEntries {
  date: string;
  dayNumber: number;
  entries: TimeEntry[];
  isVacation: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
}
export interface CSVRow {
  cuenta: string;
  extras?: string;
}
export interface Credentials {
  email: string;
  password: string;
  rememberMe: boolean;
}
export interface AutomationProgress {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentDay: number;
  totalDays: number;
  currentEntry: number;
  totalEntries: number;
  message: string;
  logs: LogEntry[];
}
export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}
export interface AppConfig {
  loginUrl: string;
  timeout: number;
  headless: boolean;
  autoSave: boolean;
}
export interface CSVTemplate {
  id: string;
  name: string;
  description: string;
  rows: CSVRow[];
}
export type IPCChannels = 
  | 'automation:start'
  | 'automation:stop'
  | 'automation:pause'
  | 'automation:progress'
  | 'automation:log'
  | 'automation:complete'
  | 'automation:error'
  | 'config:get'
  | 'config:set'
  | 'credentials:save'
  | 'credentials:load'
  | 'credentials:clear';
export interface StartAutomationRequest {
  credentials: Credentials;
  csvData: CSVRow[];
  horarios: TimeSlot[];
  mappings: AccountMappings;
  config: AppConfig;
  selectedMonth: { year: number; month: number }; // Mes seleccionado en el editor CSV (REQUERIDO)
}
export interface LoadCSVResponse {
  success: boolean;
  data?: CSVRow[];
  error?: string;
  filePath?: string;
}
export interface GenerateCSVRequest {
  rows: CSVRow[];
  filePath: string;
}

/**
 * Nested translation structure for i18n system
 * Replaces the `any` type in src/main/i18n/index.ts
 */
export type NestedTranslation = string | { [key: string]: NestedTranslation };

/**
 * Application environment configuration
 * All env vars validated at startup
 */
export interface AppEnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  REPLICON_LOGIN_URL: string;
  DEFAULT_TIMEOUT: number;
  DEFAULT_HEADLESS: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  PLAYWRIGHT_BROWSERS_PATH?: string;
}

/**
 * Forge-compatible Playwright paths structure
 */
export interface PlaywrightPaths {
  isDev: boolean;
  searchPaths: string[];
  chromiumPath?: string;
}
