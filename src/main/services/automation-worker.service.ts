/**
 * Automation Service usando Worker Threads
 * Este servicio ejecuta Playwright en un thread separado para no bloquear el Main Process.
 */
import { Worker } from 'worker_threads';
import * as path from 'path';
import type { BrowserWindow } from 'electron';
import type {
  Credentials,
  CSVRow,
  TimeSlot,
  AccountMappings,
  AutomationProgress,
  LogEntry,
  AppConfig,
} from '../../common/types';
import { createLogger } from '../utils';
import type { WorkerMessage, WorkerData } from '../workers/automation.worker';

const logger = createLogger('AutomationWorkerService');

export class AutomationWorkerService {
  private worker: Worker | null = null;
  private config: AppConfig;
  private mainWindow: BrowserWindow | null = null;
  private onProgressCallback: ((progress: AutomationProgress) => void) | null = null;
  private onLogCallback: ((log: LogEntry) => void) | null = null;

  constructor(
    config: AppConfig,
    progressCallback?: (progress: AutomationProgress) => void,
    logCallback?: (log: LogEntry) => void
  ) {
    this.config = config;
    this.onProgressCallback = progressCallback || null;
    this.onLogCallback = logCallback || null;
  }

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
  }

  async start(
    credentials: Credentials,
    csvData: CSVRow[],
    horarios: TimeSlot[],
    mappings: AccountMappings
  ): Promise<{ success: boolean; error?: string }> {
    if (this.worker) {
      return { success: false, error: 'Ya hay una automatización en ejecución' };
    }

    return new Promise((resolve) => {
      try {
        const workerData: WorkerData = {
          credentials,
          csvData,
          horarios,
          mappings,
          config: this.config,
        };

        // En desarrollo, usamos ts-node para ejecutar el worker
        // En producción, usamos el archivo JS compilado
        const isDev = process.env.NODE_ENV === 'development';
        const workerPath = isDev
          ? path.join(__dirname, '../workers/automation.worker.ts')
          : path.join(__dirname, '../workers/automation.worker.js');

        this.worker = new Worker(workerPath, {
          workerData,
          // Para TypeScript en desarrollo
          ...(isDev && {
            execArgv: ['--require', 'ts-node/register', '--require', 'tsconfig-paths/register'],
          }),
        });

        this.worker.on('message', (message: WorkerMessage) => {
          this.handleWorkerMessage(message, resolve);
        });

        this.worker.on('error', (error) => {
          logger.error('Worker error:', error);
          this.cleanup();
          resolve({ success: false, error: String(error) });
        });

        this.worker.on('exit', (code) => {
          if (code !== 0) {
            logger.error(`Worker exited with code ${code}`);
          }
          this.cleanup();
        });

        logger.info('Automation worker started');
      } catch (error) {
        logger.error('Failed to start automation worker:', error);
        this.cleanup();
        resolve({ success: false, error: String(error) });
      }
    });
  }

  private handleWorkerMessage(
    message: WorkerMessage,
    resolve: (value: { success: boolean; error?: string }) => void
  ) {
    switch (message.type) {
      case 'ready':
        logger.info('Worker is ready');
        break;

      case 'progress':
        this.onProgressCallback?.(message.data);
        this.mainWindow?.webContents.send('automation:progress', message.data);
        break;

      case 'log':
        this.onLogCallback?.(message.data);
        this.mainWindow?.webContents.send('automation:log', message.data);
        break;

      case 'complete':
        this.mainWindow?.webContents.send('automation:complete', message.data);
        this.cleanup();
        resolve({ success: true });
        break;

      case 'error':
        this.mainWindow?.webContents.send('automation:error', message.data);
        this.cleanup();
        resolve({ success: false, error: message.data.error });
        break;
    }
  }

  async stop(): Promise<void> {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
      // Dar tiempo para limpieza graceful
      await new Promise((resolve) => setTimeout(resolve, 2000));
      this.cleanup();
    }
  }

  togglePause(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'pause' });
    }
  }

  isRunning(): boolean {
    return this.worker !== null;
  }

  private cleanup() {
    if (this.worker) {
      this.worker.terminate().catch(() => {});
      this.worker = null;
    }
  }
}

// Factory function para crear el servicio
export function createAutomationService(
  config: AppConfig,
  progressCallback?: (progress: AutomationProgress) => void,
  logCallback?: (log: LogEntry) => void
): AutomationWorkerService {
  return new AutomationWorkerService(config, progressCallback, logCallback);
}
