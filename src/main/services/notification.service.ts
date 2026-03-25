import { Notification, nativeImage, app } from 'electron';
import * as path from 'path';
import type { NotificationOptions } from '../domain/notification/types.js';

const ICON_PATHS: Record<string, string> = {
  success: 'success.png',
  error: 'error.png',
  warning: 'warning.png',
  info: 'info.png',
};

/**
 * Servicio de notificaciones nativas de Electron.
 * 
 * @singleton - Mantiene caché de iconos compartido para optimizar recursos.
 * Exportado como singleton para garantizar una única instancia y caché consistente.
 */
class NotificationService {
  private iconCache: Map<string, Electron.NativeImage> = new Map();
  show(options: NotificationOptions): Notification | null {
    if (!Notification.isSupported()) {
      console.warn('Notifications not supported on this platform');
      return null;
    }
    const notification = new Notification({
      title: options.title,
      body: options.body,
      silent: options.silent ?? false,
      icon: this.getIcon(options.icon),
    });
    if (options.onClick) {
      notification.on('click', options.onClick);
    }
    notification.show();
    return notification;
  }
  success(title: string, body: string, onClick?: () => void): void {
    this.show({ title, body, icon: 'success', onClick });
  }
  error(title: string, body: string, onClick?: () => void): void {
    this.show({ title, body, icon: 'error', onClick });
  }
  warning(title: string, body: string, onClick?: () => void): void {
    this.show({ title, body, icon: 'warning', onClick });
  }
  info(title: string, body: string, onClick?: () => void): void {
    this.show({ title, body, icon: 'info', onClick });
  }
  automationComplete(success: boolean, processed: number, total: number): void {
    if (success) {
      this.success(
        '✅ Automatización Completada',
        `Se procesaron ${processed} de ${total} registros exitosamente.`
      );
    } else {
      this.error(
        '❌ Automatización Fallida',
        `Se procesaron ${processed} de ${total} registros. Revisa los logs.`
      );
    }
  }
  progressUpdate(current: number, total: number): void {
    const percentage = (current / total) * 100;
    const milestones = [25, 50, 75];
    for (const milestone of milestones) {
      if (percentage >= milestone && percentage < milestone + (100 / total)) {
        this.info(
          '📊 Progreso de Automatización',
          `${milestone}% completado (${current}/${total})`
        );
        break;
      }
    }
  }
  private getIcon(iconType?: string): Electron.NativeImage | undefined {
    if (!iconType) return undefined;
    if (this.iconCache.has(iconType)) {
      return this.iconCache.get(iconType);
    }
    try {
      const iconPath = path.join(app.getAppPath(), 'assets', 'icons', ICON_PATHS[iconType]);
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        this.iconCache.set(iconType, icon);
        return icon;
      }
    } catch {
      // Icon loading failed, return undefined
    }
    return undefined;
  }
}

// Export singleton instance - Patrón B estándar
export const notificationService = new NotificationService();
