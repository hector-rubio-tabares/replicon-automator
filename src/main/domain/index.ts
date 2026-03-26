/**
 * Domain Types Barrel Export
 * 
 * Clean Architecture: All domain interfaces/types centralized here,
 * separated from service implementations.
 */

// Audit domain
export type { AuditAction, AuditEntry } from './audit/types.js';

// Automation domain
export type {
  AutomationCheckpoint,
  DryRunResult,
  ValidationResult,
} from './automation/types.js';

// Notification domain
export type { NotificationOptions } from './notification/types.js';

// Updater domain
export type { UpdaterCallbacks } from './updater/types.js';
