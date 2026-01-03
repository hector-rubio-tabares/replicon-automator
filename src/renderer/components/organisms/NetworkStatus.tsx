import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';
type NetworkStatus = 'online' | 'offline' | 'checking';
interface NetworkStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  checkInterval?: number;
  onStatusChange?: (status: NetworkStatus) => void;
}
export function NetworkStatusIndicator({
  className = '',
  showLabel = false,
  checkInterval = 30000,
  onStatusChange,
}: NetworkStatusIndicatorProps) {
  const [status, setStatus] = useState<NetworkStatus>(() => 
    navigator.onLine ? 'online' : 'offline'
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { t } = useTranslation();
  const checkConnection = useCallback(async () => {
    setStatus('checking');
    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
      });
      setStatus('online');
      setLastChecked(new Date());
      onStatusChange?.('online');
    } catch {
      const isOnline = navigator.onLine;
      setStatus(isOnline ? 'online' : 'offline');
      setLastChecked(new Date());
      onStatusChange?.(isOnline ? 'online' : 'offline');
    }
  }, [onStatusChange]);
  useEffect(() => {
    const handleOnline = () => {
      setStatus('online');
      setLastChecked(new Date());
      onStatusChange?.('online');
    };
    const handleOffline = () => {
      setStatus('offline');
      setLastChecked(new Date());
      onStatusChange?.('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const timeoutId = setTimeout(() => {
      void checkConnection();
    }, 100);
    const intervalId = setInterval(checkConnection, checkInterval);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [checkConnection, checkInterval, onStatusChange]);
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      text: t('network.online'),
      icon: '🌐',
    },
    offline: {
      color: 'bg-red-500',
      text: t('network.offline'),
      icon: '📡',
    },
    checking: {
      color: 'bg-yellow-500 animate-pulse',
      text: t('network.reconnecting'),
      icon: '🔄',
    },
  };
  const config = statusConfig[status];
  return (
    <div 
      className={`flex items-center gap-2 ${className}`}
      title={`${config.text}${lastChecked ? ` - ${lastChecked.toLocaleTimeString()}` : ''}`}
    >
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {config.text}
        </span>
      )}
    </div>
  );
}
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return { isOnline, lastOnline };
}
interface NetworkErrorBannerProps {
  show?: boolean;
  onRetry?: () => void;
}
export function NetworkErrorBanner({ show = true, onRetry }: NetworkErrorBannerProps) {
  const { isOnline } = useNetworkStatus();
  const { t } = useTranslation();
  if (!show || isOnline) return null;
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📡</span>
        <div>
          <p className="font-medium text-red-700 dark:text-red-400">
            {t('network.connectionLost')}
          </p>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            {t('network.checkConnection')}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary text-sm"
        >
          {t('errors.retry')}
        </button>
      )}
    </div>
  );
}
export default NetworkStatusIndicator;
