import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
export interface FileLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  context: string;
  message: string;
  data?: unknown;
}
class FileLogger {
  private logDir: string;
  private currentLogFile: string;
  private maxFileSizeMB = 5;
  private maxFiles = 10;
  private writeQueue: FileLogEntry[] = [];
  private isWriting = false;
  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs');
    this.ensureLogDir();
    this.currentLogFile = this.getLogFileName();
    this.cleanOldLogs();
  }
  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `replicon-${date}.log`);
  }
  private async cleanOldLogs(): Promise<void> {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          time: fs.statSync(path.join(this.logDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);
      const toDelete = files.slice(this.maxFiles);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
  private formatEntry(entry: FileLogEntry): string {
    const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}] ${entry.message}${dataStr}\n`;
  }
  private async processQueue(): Promise<void> {
    if (this.isWriting || this.writeQueue.length === 0) return;
    this.isWriting = true;
    const entries = [...this.writeQueue];
    this.writeQueue = [];
    try {
      await this.checkRotation();
      const content = entries.map(e => this.formatEntry(e)).join('');
      fs.appendFileSync(this.currentLogFile, content);
    } catch (error) {
      console.error('Error writing to log file:', error);
    } finally {
      this.isWriting = false;
      if (this.writeQueue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }
  private async checkRotation(): Promise<void> {
    try {
      const stats = fs.statSync(this.currentLogFile);
      const sizeMB = stats.size / (1024 * 1024);
      if (sizeMB >= this.maxFileSizeMB) {
        const timestamp = Date.now();
        const rotatedName = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotatedName);
        await this.cleanOldLogs();
      }
    } catch {
      // Ignore rotation errors
    }
  }
  log(level: FileLogEntry['level'], context: string, message: string, data?: unknown): void {
    const entry: FileLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    };
    this.writeQueue.push(entry);
    setImmediate(() => this.processQueue());
  }
  debug(context: string, message: string, data?: unknown): void {
    this.log('debug', context, message, data);
  }
  info(context: string, message: string, data?: unknown): void {
    this.log('info', context, message, data);
  }
  warn(context: string, message: string, data?: unknown): void {
    this.log('warn', context, message, data);
  }
  error(context: string, message: string, data?: unknown): void {
    this.log('error', context, message, data);
  }
  getLogDirectory(): string {
    return this.logDir;
  }
  getLogFiles(): { name: string; path: string; size: number; modified: Date }[] {
    try {
      return fs.readdirSync(this.logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => {
          const fullPath = path.join(this.logDir, f);
          const stats = fs.statSync(fullPath);
          return {
            name: f,
            path: fullPath,
            size: stats.size,
            modified: stats.mtime,
          };
        })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    } catch {
      return [];
    }
  }
  readLogFile(fileName: string): string {
    const filePath = path.join(this.logDir, fileName);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  }
  exportLogs(destPath: string): { success: boolean; error?: string } {
    try {
      const files = this.getLogFiles();
      const content = files
        .map(f => {
          const logContent = this.readLogFile(f.name);
          return `\n${'='.repeat(80)}\n${f.name}\n${'='.repeat(80)}\n${logContent}`;
        })
        .join('\n');
      fs.writeFileSync(destPath, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
export const fileLogger = new FileLogger();
