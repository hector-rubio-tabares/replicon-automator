/**
 * Domain types for auto-updater system
 */

import type { UpdateInfo, ProgressInfo } from 'electron-updater';

export interface UpdaterCallbacks {
  onCheckingForUpdate?: () => void;
  onUpdateAvailable?: (info: UpdateInfo) => void;
  onUpdateNotAvailable?: (info: UpdateInfo) => void;
  onDownloadProgress?: (progress: ProgressInfo) => void;
  onUpdateDownloaded?: (info: UpdateInfo) => void;
  onError?: (error: Error) => void;
}
