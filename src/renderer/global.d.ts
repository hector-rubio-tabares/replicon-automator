import type {
  AutomationProgress,
  ConfigKey,
  Credentials,
  LogEntry,
  StartAutomationRequest,
} from '@shared/types';
declare global {
  interface Window {
    electronAPI: {
      saveCredentials: (credentials: Credentials) => Promise<boolean>;
      loadCredentials: () => Promise<Credentials | null>;
      clearCredentials: () => Promise<boolean>;
      getConfig: (key: ConfigKey) => Promise<unknown>;
      setConfig: (key: ConfigKey, value: unknown) => Promise<boolean>;
      startAutomation: (request: StartAutomationRequest) => Promise<{ success: boolean; error?: string }>;
      stopAutomation: () => Promise<{ success: boolean }>;
      pauseAutomation: () => Promise<{ success: boolean }>;
      onAutomationProgress: (callback: (progress: AutomationProgress) => void) => () => void;
      onAutomationLog: (callback: (log: LogEntry) => void) => () => void;
      onAutomationComplete: (callback: (result: { success: boolean }) => void) => () => void;
      onAutomationError: (callback: (error: { error: string }) => void) => () => void;
      checkForUpdates: () => Promise<{ updateAvailable: boolean; version?: string }>;
      getAppVersion: () => Promise<string>;
      downloadUpdate?: () => Promise<{ success: boolean; error?: string }>;
      installUpdate?: () => Promise<{ success: boolean; error?: string }>;
      isUpdateDownloaded?: () => Promise<boolean>;
      onUpdateProgress?: (callback: (progress: UpdateProgress) => void) => () => void;
      onUpdateDownloaded?: (callback: (info?: { version: string }) => void) => () => void;
      onUpdateError?: (callback: () => void) => () => void;
      getScheduledTasks?: () => Promise<ScheduledTask[]>;
      createScheduledTask?: (task: Partial<ScheduledTask>) => Promise<void>;
      updateScheduledTask?: (id: string, task: Partial<ScheduledTask>) => Promise<void>;
      deleteScheduledTask?: (id: string) => Promise<void>;
      toggleScheduledTask?: (id: string) => Promise<void>;
      runScheduledTaskNow?: (id: string) => Promise<void>;
      onMainLog?: (callback: (log: { level: string; message: string }) => void) => () => void;
      sendLogToMain?: (level: string, source: string, message: string) => void;
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
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
export {};
