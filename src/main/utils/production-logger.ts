import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: unknown;
}

class ProductionLogger {
    private logPath: string;
    private maxLogSize = 5 * 1024 * 1024; // 5MB
    private isDev: boolean;

    constructor() {
        this.isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
        this.logPath = path.join(app.getPath('userData'), 'logs', 'app.log');
        this.ensureLogDir();
    }

    private ensureLogDir(): void {
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    private rotateIfNeeded(): void {
        try {
            if (fs.existsSync(this.logPath)) {
                const stats = fs.statSync(this.logPath);
                if (stats.size >= this.maxLogSize) {
                    const timestamp = Date.now();
                    const rotatedPath = this.logPath.replace('.log', `-${timestamp}.log`);
                    fs.renameSync(this.logPath, rotatedPath);

                    // Mantener solo los últimos 5 archivos
                    this.cleanOldLogs();
                }
            }
        } catch {
            // Error silencioso en rotación
        }
    }

    private cleanOldLogs(): void {
        try {
            const logDir = path.dirname(this.logPath);
            const files = fs.readdirSync(logDir)
                .filter(f => f.startsWith('app-') && f.endsWith('.log'))
                .map(f => ({
                    name: f,
                    path: path.join(logDir, f),
                    time: fs.statSync(path.join(logDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time);

            files.slice(5).forEach(f => {
                fs.unlinkSync(f.path);
            });
        } catch {
            // Error silencioso en limpieza
        }
    }

    private write(level: LogLevel, message: string, data?: unknown): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: data || undefined,
        };

        // En desarrollo, también mostrar en consola
        if (this.isDev) {
            const formatted = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
            switch (level) {
                case 'error':
                    console.error(formatted, data || '');
                    break;
                case 'warn':
                    console.warn(formatted, data || '');
                    break;
                default:
                    console.log(formatted, data || '');
            }
        }

        // En producción, solo escribir a archivo
        try {
            this.rotateIfNeeded();
            const logLine = JSON.stringify(entry) + '\n';
            fs.appendFileSync(this.logPath, logLine, 'utf-8');
        } catch {
            // Error silencioso en escritura
        }
    }

    info(message: string, data?: unknown): void {
        this.write('info', message, data);
    }

    warn(message: string, data?: unknown): void {
        this.write('warn', message, data);
    }

    error(message: string, data?: unknown): void {
        this.write('error', message, data);
    }

    debug(message: string, data?: unknown): void {
        this.write('debug', message, data);
    }

    /**
     * Obtiene las últimas N líneas del log
     */
    getRecentLogs(lines: number = 100): LogEntry[] {
        try {
            if (!fs.existsSync(this.logPath)) {
                return [];
            }

            const content = fs.readFileSync(this.logPath, 'utf-8');
            const logLines = content.trim().split('\n').slice(-lines);

            return logLines
                .map(line => {
                    try {
                        return JSON.parse(line) as LogEntry;
                    } catch {
                        return null;
                    }
                })
                .filter((entry): entry is LogEntry => entry !== null);
        } catch {
            return [];
        }
    }
}

export const productionLogger = new ProductionLogger();
