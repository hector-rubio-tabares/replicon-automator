/**
 * Tipos compartidos entre Main y Renderer
 */

// Mapeo de cuentas
export interface AccountProject {
  [projectCode: string]: string;
}

export interface AccountMapping {
  name: string;
  projects: AccountProject;
}

export interface AccountMappings {
  [accountCode: string]: AccountMapping;
}

// Horarios
export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

// Entradas de tiempo
export interface TimeEntry {
  start_time: string;
  end_time: string;
  project: string;
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

// CSV Row
export interface CSVRow {
  cuenta: string;
  proyecto: string;
  extras?: string;
}

// Credenciales
export interface Credentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Estado de automatización
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

// Configuración de la app
export interface AppConfig {
  loginUrl: string;
  timeout: number;
  headless: boolean;
  autoSave: boolean;
}

// Templates CSV predefinidos
export interface CSVTemplate {
  id: string;
  name: string;
  description: string;
  rows: CSVRow[];
}

// IPC Events
export type IPCChannels = 
  | 'automation:start'
  | 'automation:stop'
  | 'automation:pause'
  | 'automation:progress'
  | 'automation:log'
  | 'automation:complete'
  | 'automation:error'
  | 'csv:load'
  | 'csv:generate'
  | 'csv:save'
  | 'config:get'
  | 'config:set'
  | 'credentials:save'
  | 'credentials:load'
  | 'credentials:clear';

// Request/Response types para IPC
export interface StartAutomationRequest {
  credentials: Credentials;
  csvData: CSVRow[];
  horarios: TimeSlot[];
  mappings: AccountMappings;
  config: AppConfig;
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
