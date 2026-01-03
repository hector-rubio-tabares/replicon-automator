import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import { useToast } from '@/components/ui';
interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}
type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'ready';
export function UpdateChecker() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [version, setVersion] = useState<string>('');
  const [newVersion, setNewVersion] = useState<string>('');
  const [state, setState] = useState<UpdateState>('idle');
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion);
    window.electronAPI.isUpdateDownloaded?.().then((downloaded) => {
      if (downloaded) {
        setState('ready');
      }
    });
  }, []);
  useEffect(() => {
    const unsubProgress = window.electronAPI.onUpdateProgress?.((prog) => {
      setProgress(prog);
      if (state !== 'downloading') {
        setState('downloading');
      }
    });
    const unsubDownloaded = window.electronAPI.onUpdateDownloaded?.(() => {
      setState('ready');
      setProgress(null);
      showToast('success', t('updates.downloadComplete'));
    });
    const unsubError = window.electronAPI.onUpdateError?.(() => {
      if (state === 'downloading') {
        setState('available');
      } else if (state === 'checking') {
        setState('idle');
      }
      setProgress(null);
    });
    return () => {
      unsubProgress?.();
      unsubDownloaded?.();
      unsubError?.();
    };
  }, [state, showToast, t]);
  const handleCheckUpdates = useCallback(async () => {
    setState('checking');
    
    // Timeout de seguridad para evitar quedar en estado "checking" infinitamente
    const timeoutId = setTimeout(() => {
      setState('idle');
      showToast('warning', t('updates.timeout'));
    }, 35000); // 35s (el backend tiene 30s timeout)
    
    try {
      const result = await window.electronAPI.checkForUpdates();
      clearTimeout(timeoutId);
      
      if (result.updateAvailable && result.version) {
        setState('available');
        setNewVersion(result.version);
        showToast('info', `${t('updates.available')}: v${result.version}`);
      } else {
        setState('idle');
        showToast('success', t('updates.upToDate'));
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setState('idle');
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Update check failed:', errorMsg);
      showToast('error', `${t('updates.error')}: ${errorMsg}`);
    }
  }, [showToast, t]);
  const handleDownload = useCallback(async () => {
    setState('downloading');
    try {
      await window.electronAPI.downloadUpdate?.();
    } catch {
      setState('available');
      showToast('error', t('updates.downloadError'));
    }
  }, [showToast, t]);
  const handleInstall = useCallback(async () => {
    try {
      await window.electronAPI.installUpdate?.();
    } catch {
      showToast('error', t('updates.installError'));
    }
  }, [showToast, t]);
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-slate-400">
        v{version}
      </span>
      {state === 'idle' && (
        <button
          onClick={handleCheckUpdates}
          className="text-xs text-gray-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
          title={t('updates.checkForUpdates')}
        >
          🔄
        </button>
      )}
      {state === 'checking' && (
        <span className="text-xs text-gray-400 dark:text-slate-500 animate-spin">⏳</span>
      )}
      {state === 'available' && (
        <button
          onClick={handleDownload}
          className="text-xs px-2 py-0.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors animate-pulse"
          title={`${t('updates.download')} v${newVersion}`}
        >
          ⬇️ v{newVersion}
        </button>
      )}
      {state === 'downloading' && (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300"
              style={{ width: `${progress?.percent || 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400 min-w-[80px]">
            {progress ? (
              <>
                {progress.percent.toFixed(0)}% 
                <span className="text-[10px] ml-1">
                  ({formatBytes(progress.bytesPerSecond)}/s)
                </span>
              </>
            ) : (
              <span className="animate-pulse">⏳ {t('updates.downloading')}</span>
            )}
          </span>
        </div>
      )}
      {state === 'ready' && (
        <button
          onClick={handleInstall}
          className="text-xs px-2 py-0.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors animate-pulse"
          title={t('updates.installAndRestart')}
        >
          🚀 {t('updates.install')}
        </button>
      )}
    </div>
  );
}
