import { useState, useEffect, useCallback } from 'react';
import type { AutomationProgress, LogEntry, StartAutomationRequest } from '../../shared/types';

export function useAutomation() {
  const [status, setStatus] = useState<AutomationProgress['status']>('idle');
  const [progress, setProgress] = useState<AutomationProgress | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Suscribirse a eventos de automatización
    const unsubProgress = window.electronAPI.onAutomationProgress((newProgress) => {
      setProgress(newProgress);
      setStatus(newProgress.status);
    });

    const unsubLog = window.electronAPI.onAutomationLog((log) => {
      setLogs(prev => [...prev, log]);
    });

    const unsubComplete = window.electronAPI.onAutomationComplete(() => {
      setStatus('completed');
    });

    const unsubError = window.electronAPI.onAutomationError(() => {
      setStatus('error');
    });

    return () => {
      unsubProgress();
      unsubLog();
      unsubComplete();
      unsubError();
    };
  }, []);

  const start = useCallback(async (request: StartAutomationRequest) => {
    setLogs([]);
    setStatus('running');
    setProgress(null);
    setIsPaused(false);

    try {
      const result = await window.electronAPI.startAutomation(request);
      if (!result.success) {
        setStatus('error');
        setLogs(prev => [...prev, {
          timestamp: new Date(),
          level: 'error',
          message: result.error || 'Error desconocido'
        }]);
      }
    } catch (error) {
      setStatus('error');
      setLogs(prev => [...prev, {
        timestamp: new Date(),
        level: 'error',
        message: String(error)
      }]);
    }
  }, []);

  const stop = useCallback(async () => {
    await window.electronAPI.stopAutomation();
    setStatus('idle');
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(async () => {
    await window.electronAPI.pauseAutomation();
    setIsPaused(prev => !prev);
    setStatus(prev => prev === 'running' ? 'paused' : 'running');
  }, []);

  return {
    status,
    progress,
    logs,
    isPaused,
    start,
    stop,
    togglePause,
  };
}
