import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { productionLogger } from '../utils/production-logger.js';
import * as crypto from 'crypto';
import type { AuditAction, AuditEntry } from '../domain/audit/types.js';

/**
 * Servicio de auditoría para logging de acciones críticas.
 * 
 * @singleton - Mantiene sessionId, logDir y currentLogFile compartidos.
 * Exportado como singleton para garantizar logs consistentes en toda la app.
 */
class AuditLoggerService {
  private sessionId: string;
  private logDir: string;
  private currentLogFile: string;
  private maxFileSize: number = 5 * 1024 * 1024;
  private maxFiles: number = 10;
  constructor() {
    this.sessionId = this.generateSessionId();
    this.logDir = path.join(app.getPath('userData'), 'audit-logs');
    this.currentLogFile = this.getLogFileName();
    this.ensureLogDir();
  }
  private generateSessionId(): string {
    const randomSuffix = crypto.randomBytes(6).toString('base64url').slice(0, 9);
    return `session-${Date.now()}-${randomSuffix}`;
  }
  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `audit-${date}.log`);
  }
  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  private generateEntryId(): string {
    const randomSuffix = crypto.randomBytes(6).toString('base64url').slice(0, 9);
    return `audit-${Date.now()}-${randomSuffix}`;
  }
  private shouldRotate(): boolean {
    if (!fs.existsSync(this.currentLogFile)) {
      return false;
    }
    const stats = fs.statSync(this.currentLogFile);
    return stats.size >= this.maxFileSize;
  }
  private rotateIfNeeded(): void {
    if (this.shouldRotate()) {
      const timestamp = Date.now();
      const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
      fs.renameSync(this.currentLogFile, rotatedFile);
      this.cleanOldLogs();
    }
  }
  private cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('audit-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          time: fs.statSync(path.join(this.logDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);
      files.slice(this.maxFiles).forEach(f => {
        fs.unlinkSync(f.path);
      });
    } catch (error) {
      productionLogger.error('AuditLogger: Error cleaning old logs', error);
    }
  }
  log(action: AuditAction, details: Record<string, unknown> = {}, userId?: string): void {
    try {
      this.currentLogFile = this.getLogFileName();
      this.rotateIfNeeded();
      const entry: AuditEntry = {
        id: this.generateEntryId(),
        timestamp: new Date().toISOString(),
        action,
        details: this.sanitizeDetails(details),
        userId,
        sessionId: this.sessionId,
      };
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.currentLogFile, logLine, 'utf-8');
    } catch (error) {
      console.error('[AuditLogger] Failed to write audit log:', error);
    }
  }
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...details };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
  async getEntries(
    options: {
      startDate?: Date;
      endDate?: Date;
      actions?: AuditAction[];
      limit?: number;
    } = {}
  ): Promise<AuditEntry[]> {
    const { startDate, endDate, actions, limit = 1000 } = options;
    const entries: AuditEntry[] = [];
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.startsWith('audit-') && f.endsWith('.log'))
        .map(f => path.join(this.logDir, f))
        .sort()
        .reverse();
      for (const file of files) {
        if (entries.length >= limit) break;
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        for (const line of lines.reverse()) {
          if (entries.length >= limit) break;
          try {
            const entry: AuditEntry = JSON.parse(line);
            const entryDate = new Date(entry.timestamp);
            if (startDate && entryDate < startDate) continue;
            if (endDate && entryDate > endDate) continue;
            if (actions && actions.length > 0 && !actions.includes(entry.action)) continue;
            entries.push(entry);
          } catch {
            // Ignore malformed entries
          }
        }
      }
    } catch (error) {
      console.error('[AuditLogger] Error reading audit logs:', error);
    }
    return entries;
  }
  async exportToCSV(filePath: string): Promise<void> {
    const entries = await this.getEntries({ limit: 10000 });
    const headers = ['ID', 'Timestamp', 'Action', 'Details', 'User ID', 'Session ID'];
    const rows = entries.map(e => [
      e.id,
      e.timestamp,
      e.action,
      JSON.stringify(e.details),
      e.userId || '',
      e.sessionId
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    fs.writeFileSync(filePath, csv, 'utf-8');
  }
  getSessionId(): string {
    return this.sessionId;
  }
  getLogDirectory(): string {
    return this.logDir;
  }
}

// Export singleton instance - Patrón B estándar
export const auditLogger = new AuditLoggerService();
export const logAudit = (action: AuditAction, details?: Record<string, unknown>, userId?: string) => {
  auditLogger.log(action, details, userId);
};
export const getAuditEntries = (options?: Parameters<typeof auditLogger.getEntries>[0]) => {
  return auditLogger.getEntries(options);
};
export const exportAuditToCSV = (filePath: string) => {
  return auditLogger.exportToCSV(filePath);
};
