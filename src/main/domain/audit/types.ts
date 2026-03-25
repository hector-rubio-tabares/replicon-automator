/**
 * Domain types for audit logging
 */

export type AuditAction =
  | 'APP_START'
  | 'APP_CLOSE'
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'AUTOMATION_START'
  | 'AUTOMATION_COMPLETE'
  | 'AUTOMATION_FAILED'
  | 'AUTOMATION_STOPPED'
  | 'CONFIG_CHANGED'
  | 'CONFIG_EXPORTED'
  | 'CONFIG_IMPORTED'
  | 'ACCOUNT_ADDED'
  | 'ACCOUNT_MODIFIED'
  | 'ACCOUNT_DELETED'
  | 'CSV_LOADED'
  | 'CSV_SAVED'
  | 'CSV_MODIFIED'
  | 'CREDENTIALS_ACCESSED'
  | 'CREDENTIALS_MODIFIED'
  | 'THEME_CHANGED'
  | 'LANGUAGE_CHANGED'
  | 'ERROR_OCCURRED'
  | 'SCREENSHOT_CAPTURED';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  details: Record<string, unknown>;
  userId?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}
