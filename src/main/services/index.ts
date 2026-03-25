export { AutomationWorkerService, createAutomationService } from './automation-worker.service.js';
export { CSVService } from './csv.service.js';
export * from './credentials.service.js';
export { TrayService, trayService } from './tray.service.js';
export { notificationService } from './notification.service.js';
export { updaterService } from './updater.service.js';
export { playwrightRuntimeCheckService } from './playwright-runtime-check.service.js';

// Re-export domain types for convenience
export type {
  AuditAction,
  AuditEntry,
  AutomationCheckpoint,
  DryRunResult,
  ValidationResult,
  NotificationOptions,
  UpdaterCallbacks,
} from '../domain/index.js';
