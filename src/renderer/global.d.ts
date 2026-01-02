import type {
  AutomationProgress,
  ConfigKey,
  Credentials,
  CSVRow,
  LogEntry,
  StartAutomationRequest,
} from '@shared/types';

declare global {
  interface Window {
    electronAPI: {
      // CSV
      loadCSV: () => Promise<{ success: boolean; data?: CSVRow[]; error?: string; filePath?: string }>;
      saveCSV: (data: CSVRow[]) => Promise<{ success: boolean; error?: string }>;

      // Credenciales
      saveCredentials: (credentials: Credentials) => Promise<boolean>;
      loadCredentials: () => Promise<Credentials | null>;
      clearCredentials: () => Promise<boolean>;

      // Config
      getConfig: (key: ConfigKey) => Promise<unknown>;
      setConfig: (key: ConfigKey, value: unknown) => Promise<boolean>;

      // Automatización
      startAutomation: (request: StartAutomationRequest) => Promise<{ success: boolean; error?: string }>;
      stopAutomation: () => Promise<{ success: boolean }>;
      pauseAutomation: () => Promise<{ success: boolean }>;

      // Eventos
      onAutomationProgress: (callback: (progress: AutomationProgress) => void) => () => void;
      onAutomationLog: (callback: (log: LogEntry) => void) => () => void;
      onAutomationComplete: (callback: (result: { success: boolean }) => void) => () => void;
      onAutomationError: (callback: (error: { error: string }) => void) => () => void;

      // Updates
      checkForUpdates: () => Promise<{ updateAvailable: boolean; version?: string }>;
      getAppVersion: () => Promise<string>;
      downloadUpdate?: () => Promise<{ success: boolean; error?: string }>;
      installUpdate?: () => Promise<{ success: boolean; error?: string }>;
      isUpdateDownloaded?: () => Promise<boolean>;
      onUpdateProgress?: (callback: (progress: UpdateProgress) => void) => () => void;
      onUpdateDownloaded?: (callback: (info?: { version: string }) => void) => () => void;
      onUpdateError?: (callback: () => void) => () => void;

      // Scheduler
      getScheduledTasks?: () => Promise<ScheduledTask[]>;
      createScheduledTask?: (task: Partial<ScheduledTask>) => Promise<void>;
      updateScheduledTask?: (id: string, task: Partial<ScheduledTask>) => Promise<void>;
      deleteScheduledTask?: (id: string) => Promise<void>;
      toggleScheduledTask?: (id: string) => Promise<void>;
      runScheduledTaskNow?: (id: string) => Promise<void>;

      // Atajos de teclado globales
      onShortcutLoadCSV: (callback: () => void) => () => void;
      onShortcutSaveCSV: (callback: () => void) => () => void;
      onShortcutRunAutomation: (callback: () => void) => () => void;
      onShortcutToggleTheme: (callback: () => void) => () => void;
      onShortcutToggleLanguage: (callback: () => void) => () => void;
      onShortcutGoToTab: (callback: (tab: number) => void) => () => void;
      onShortcutShowShortcuts: (callback: () => void) => () => void;

      // Dev logs (solo en desarrollo)
      onMainLog?: (callback: (log: { level: string; message: string }) => void) => () => void;
    };
  }
}

interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

interface ScheduledTask {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    type: 'daily' | 'weekly' | 'monthly' | 'once';
    time: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    date?: string;
  };
  accountIds: string[];
  lastRun?: string;
  nextRun?: string;
}

// Vite env
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
