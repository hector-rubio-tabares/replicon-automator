import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, dialog, app } from 'electron';
import { notificationService } from './notification.service';
import { createLogger } from '../utils';

const logger = createLogger('AutoUpdater');

export interface UpdaterCallbacks {
  onCheckingForUpdate?: () => void;
  onUpdateAvailable?: (info: UpdateInfo) => void;
  onUpdateNotAvailable?: (info: UpdateInfo) => void;
  onDownloadProgress?: (progress: ProgressInfo) => void;
  onUpdateDownloaded?: (info: UpdateInfo) => void;
  onError?: (error: Error) => void;
}

class UpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private isChecking = false;
  private updateDownloaded = false;
  private lastUpdateInfo: UpdateInfo | null = null;
  private updateAvailable = false;

  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    autoUpdater.logger = {
      info: (msg: string) => logger.info(String(msg)),
      warn: (msg: string) => logger.warn(String(msg)),
      error: (msg: string) => logger.error(String(msg)),
      debug: (msg: string) => logger.info(String(msg)),
    };

    this.setupListeners();
    
    setTimeout(() => this.checkForUpdates(true), 5000);
    
    setInterval(() => this.checkForUpdates(true), 4 * 60 * 60 * 1000);
  }

  private setupListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...');
      this.isChecking = true;
    });

    autoUpdater.on('update-available', async (info: UpdateInfo) => {
      logger.info(`Update available: ${info.version}`);
      this.isChecking = false;
      this.updateAvailable = true;
      this.lastUpdateInfo = info;
      
      notificationService.info(
        '🔄 Actualización Disponible',
        `Nueva versión ${info.version} disponible. Click para descargar.`,
        () => this.downloadUpdate()
      );

      if (this.mainWindow && this.mainWindow.isVisible()) {
        const result = await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Actualización Disponible',
          message: `Nueva versión ${info.version} disponible`,
          detail: `Versión actual: ${app.getVersion()}\n\n¿Deseas descargar la actualización ahora?`,
          buttons: ['Descargar', 'Más tarde'],
          defaultId: 0,
          cancelId: 1,
        });

        if (result.response === 0) {
          this.downloadUpdate();
        }
      }
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      logger.info(`No updates available. Current version: ${info.version}`);
      this.isChecking = false;
      this.updateAvailable = false;
      this.lastUpdateInfo = info;
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      const percent = Math.round(progress.percent);
      logger.info(`Download progress: ${percent}%`);
      
      this.mainWindow?.webContents.send('update-download-progress', {
        percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
      
      this.mainWindow?.setProgressBar(progress.percent / 100);
    });

    autoUpdater.on('update-downloaded', async (info: UpdateInfo) => {
      logger.info(`Update downloaded: ${info.version}`);
      this.updateDownloaded = true;
      
      this.mainWindow?.setProgressBar(-1);
      
      notificationService.success(
        '✅ Actualización Lista',
        `Versión ${info.version} descargada. Click para instalar.`,
        () => this.installUpdate()
      );

      if (this.mainWindow && this.mainWindow.isVisible()) {
        const result = await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Actualización Lista',
          message: `Versión ${info.version} descargada`,
          detail: 'La actualización se instalará al reiniciar la aplicación.\n\n¿Deseas reiniciar ahora?',
          buttons: ['Reiniciar Ahora', 'Más tarde'],
          defaultId: 0,
          cancelId: 1,
        });

        if (result.response === 0) {
          this.installUpdate();
        }
      }
    });

    autoUpdater.on('error', (error: Error) => {
      logger.error('Auto-updater error:', error);
      this.isChecking = false;
      this.mainWindow?.setProgressBar(-1);
    });
  }

  async checkForUpdates(silent = false): Promise<{ updateAvailable: boolean; version: string }> {
    if (this.isChecking) {
      logger.info('Already checking for updates');
      return { updateAvailable: this.updateAvailable, version: this.lastUpdateInfo?.version || app.getVersion() };
    }

    try {
      this.updateAvailable = false;
      const result = await autoUpdater.checkForUpdates();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { 
        updateAvailable: this.updateAvailable, 
        version: result?.updateInfo?.version || app.getVersion() 
      };
    } catch (error) {
      logger.error('Failed to check for updates:', error);
      if (!silent) {
        notificationService.error(
          '❌ Error',
          'No se pudo verificar actualizaciones. Verifica tu conexión.'
        );
      }
      throw error;
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      notificationService.info(
        '⬇️ Descargando',
        'Descargando actualización en segundo plano...'
      );
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('Failed to download update:', error);
      notificationService.error(
        '❌ Error de Descarga',
        'No se pudo descargar la actualización.'
      );
    }
  }

  installUpdate(): void {
    if (this.updateDownloaded) {
      autoUpdater.quitAndInstall(false, true);
    }
  }

  isUpdateDownloaded(): boolean {
    return this.updateDownloaded;
  }

  getCurrentVersion(): string {
    return app.getVersion();
  }
}

export const updaterService = new UpdaterService();
