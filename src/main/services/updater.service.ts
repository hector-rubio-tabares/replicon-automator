import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, dialog, app } from 'electron';
import { notificationService } from './notification.service';
import { createLogger } from '../utils';
import { t } from '../i18n';

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
        t('updates.available'),
        t('updates.availableDesc', { version: info.version }),
        () => this.downloadUpdate()
      );

      if (this.mainWindow && this.mainWindow.isVisible()) {
        const result = await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: t('updates.availableTitle'),
          message: t('updates.availableMessage', { version: info.version }),
          detail: t('updates.availableDetail', { version: info.version, currentVersion: app.getVersion() }),
          buttons: [t('updates.download'), t('updates.later')],
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
      this.lastUpdateInfo = info;
      
      this.mainWindow?.setProgressBar(-1);
      
      // Notificar al renderer que la actualización está lista
      this.mainWindow?.webContents.send('update-downloaded', {
        version: info.version,
      });
      
      notificationService.success(
        t('updates.ready'),
        t('updates.readyDesc', { version: info.version }),
        () => this.installUpdate()
      );

      if (this.mainWindow && this.mainWindow.isVisible()) {
        const result = await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: t('updates.installTitle'),
          message: t('updates.installMessage', { version: info.version }),
          detail: t('updates.installDetail'),
          buttons: [t('updates.restartNow'), t('updates.later')],
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
          t('updates.checkError'),
          t('updates.checkErrorDesc')
        );
      }
      throw error;
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      notificationService.info(
        t('updates.downloading'),
        t('updates.downloadingDesc')
      );
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('Failed to download update:', error);
      notificationService.error(
        t('updates.downloadError'),
        t('updates.downloadErrorDesc')
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
