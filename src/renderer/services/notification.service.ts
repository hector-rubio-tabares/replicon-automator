import { getTranslation } from '../i18n';
import { createLogger, logCatch } from '../utils/logger';

const logger = createLogger('NotificationService');
type NotificationType = 'success' | 'error' | 'info' | 'warning';
interface NotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  silent?: boolean;
  onClick?: () => void;
}
class NotificationService {
  private permission: NotificationPermission = 'default';
  private enabled: boolean = true;
  constructor() {
    this.requestPermission();
  }
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      logger.warn(getTranslation('errors.notificationsNotSupported'));
      return false;
    }
    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }
    return false;
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
  isEnabled(): boolean {
    return this.enabled && this.permission === 'granted';
  }
  async show(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isEnabled()) return null;
    const { title, body, type = 'info', silent = false, onClick } = options;
    const iconMap: Record<NotificationType, string> = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    try {
      const notification = new Notification(title, {
        body: `${iconMap[type]} ${body}`,
        icon: '/icon.png',
        badge: '/icon.png',
        silent,
        tag: `replicon-${Date.now()}`,
        requireInteraction: type === 'error',
      });
      if (onClick) {
        notification.onclick = () => {
          onClick();
          notification.close();
          window.focus();
        };
      }
      if (type !== 'error') {
        setTimeout(() => notification.close(), 5000);
      }
      return notification;
    } catch (error) {
      logCatch('NotificationService', getTranslation('errors.showingNotification'), error);
      return null;
    }
  }
  success(title: string, body: string, onClick?: () => void) {
    return this.show({ title, body, type: 'success', onClick });
  }
  error(title: string, body: string, onClick?: () => void) {
    return this.show({ title, body, type: 'error', onClick });
  }
  warning(title: string, body: string, onClick?: () => void) {
    return this.show({ title, body, type: 'warning', onClick });
  }
  info(title: string, body: string, onClick?: () => void) {
    return this.show({ title, body, type: 'info', onClick });
  }
  automationStarted(accountCount: number) {
    return this.info(
      'Automatización Iniciada',
      `Procesando ${accountCount} cuenta(s)...`
    );
  }
  automationCompleted(successCount: number, totalCount: number, duration: string) {
    const allSuccess = successCount === totalCount;
    return this.show({
      title: allSuccess ? '✨ Automatización Completada' : '⚠️ Automatización Finalizada',
      body: `${successCount}/${totalCount} cuentas procesadas exitosamente en ${duration}`,
      type: allSuccess ? 'success' : 'warning',
    });
  }
  automationFailed(error: string) {
    return this.error(
      'Error en Automatización',
      error
    );
  }
  automationPaused() {
    return this.info(
      'Automatización Pausada',
      'La automatización está en pausa. Haz clic para reanudar.'
    );
  }
}
export const notificationService = new NotificationService();
import { useCallback, useEffect, useState } from 'react';
export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  useEffect(() => {
    const checkPermission = async () => {
      const granted = await notificationService.requestPermission();
      setPermissionGranted(granted);
    };
    checkPermission();
  }, []);
  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);
  return {
    permissionGranted,
    requestPermission,
    notify: notificationService,
  };
}
