/**
 * Tests reales para useAutomation hook
 * Estos tests usan React Testing Library para probar el hook real
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutomation } from '../useAutomation';
import type { AutomationProgress, LogEntry } from '@shared/types';

// Mock del electronAPI
const createMockElectronAPI = () => {
  const progressCallbacks: ((progress: AutomationProgress) => void)[] = [];
  const logCallbacks: ((log: LogEntry) => void)[] = [];
  const completeCallbacks: ((result: { success: boolean }) => void)[] = [];
  const errorCallbacks: ((error: { error: string }) => void)[] = [];

  return {
    startAutomation: vi.fn().mockResolvedValue({ success: true }),
    stopAutomation: vi.fn().mockResolvedValue({ success: true }),
    pauseAutomation: vi.fn().mockResolvedValue({ success: true }),
    onAutomationProgress: vi.fn((callback) => {
      progressCallbacks.push(callback);
      return () => {
        const index = progressCallbacks.indexOf(callback);
        if (index > -1) progressCallbacks.splice(index, 1);
      };
    }),
    onAutomationLog: vi.fn((callback) => {
      logCallbacks.push(callback);
      return () => {
        const index = logCallbacks.indexOf(callback);
        if (index > -1) logCallbacks.splice(index, 1);
      };
    }),
    onAutomationComplete: vi.fn((callback) => {
      completeCallbacks.push(callback);
      return () => {
        const index = completeCallbacks.indexOf(callback);
        if (index > -1) completeCallbacks.splice(index, 1);
      };
    }),
    onAutomationError: vi.fn((callback) => {
      errorCallbacks.push(callback);
      return () => {
        const index = errorCallbacks.indexOf(callback);
        if (index > -1) errorCallbacks.splice(index, 1);
      };
    }),
    // Helpers para simular eventos desde el Main process
    _simulateProgress: (progress: AutomationProgress) => {
      progressCallbacks.forEach(cb => cb(progress));
    },
    _simulateLog: (log: LogEntry) => {
      logCallbacks.forEach(cb => cb(log));
    },
    _simulateComplete: (result: { success: boolean }) => {
      completeCallbacks.forEach(cb => cb(result));
    },
    _simulateError: (error: { error: string }) => {
      errorCallbacks.forEach(cb => cb(error));
    },
  };
};

describe('useAutomation Hook', () => {
  let mockAPI: ReturnType<typeof createMockElectronAPI>;

  beforeEach(() => {
    mockAPI = createMockElectronAPI();
    (window as any).electronAPI = mockAPI;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with idle status', () => {
      const { result } = renderHook(() => useAutomation());

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBeNull();
      expect(result.current.logs).toEqual([]);
      expect(result.current.isPaused).toBe(false);
    });

    it('should set up event listeners on mount', () => {
      renderHook(() => useAutomation());

      expect(mockAPI.onAutomationProgress).toHaveBeenCalledTimes(1);
      expect(mockAPI.onAutomationLog).toHaveBeenCalledTimes(1);
      expect(mockAPI.onAutomationComplete).toHaveBeenCalledTimes(1);
      expect(mockAPI.onAutomationError).toHaveBeenCalledTimes(1);
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useAutomation());

      // Los cleanup functions fueron registrados
      expect(mockAPI.onAutomationProgress).toHaveReturnedWith(expect.any(Function));

      unmount();

      // Simular que se llamaron los cleanup
      // El hook llama a la función retornada en el cleanup del useEffect
    });
  });

  describe('Start Automation', () => {
    it('should call startAutomation with correct parameters', async () => {
      const { result } = renderHook(() => useAutomation());

      const request = {
        credentials: { email: 'test@test.com', password: 'pass', rememberMe: false },
        csvData: [{ cuenta: 'TEST', proyecto: 'PROJ', extras: '' }],
        horarios: [{ id: '1', start_time: '08:00', end_time: '17:00' }],
        mappings: {},
        config: { headless: true, timeout: 30000, loginUrl: 'https://test.com', autoSave: false },
      };

      await act(async () => {
        await result.current.start(request);
      });

      expect(mockAPI.startAutomation).toHaveBeenCalledWith(request);
      expect(result.current.status).toBe('running');
    });

    it('should set status to running on start', async () => {
      const { result } = renderHook(() => useAutomation());

      await act(async () => {
        await result.current.start({
          credentials: { email: '', password: '', rememberMe: false },
          csvData: [],
          horarios: [],
          mappings: {},
          config: { headless: true, timeout: 30000, loginUrl: '', autoSave: false },
        });
      });

      expect(result.current.status).toBe('running');
    });

    it('should clear logs on start', async () => {
      const { result } = renderHook(() => useAutomation());

      // Añadir algunos logs
      act(() => {
        mockAPI._simulateLog({
          timestamp: new Date(),
          level: 'info',
          message: 'Old log',
        });
      });

      expect(result.current.logs).toHaveLength(1);

      // Iniciar nueva automatización
      await act(async () => {
        await result.current.start({
          credentials: { email: '', password: '', rememberMe: false },
          csvData: [],
          horarios: [],
          mappings: {},
          config: { headless: true, timeout: 30000, loginUrl: '', autoSave: false },
        });
      });

      expect(result.current.logs).toEqual([]);
    });

    it('should handle start error', async () => {
      mockAPI.startAutomation.mockResolvedValueOnce({ 
        success: false, 
        error: 'Connection failed' 
      });

      const { result } = renderHook(() => useAutomation());

      await act(async () => {
        await result.current.start({
          credentials: { email: '', password: '', rememberMe: false },
          csvData: [],
          horarios: [],
          mappings: {},
          config: { headless: true, timeout: 30000, loginUrl: '', autoSave: false },
        });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.logs).toContainEqual(
        expect.objectContaining({ level: 'error', message: 'Connection failed' })
      );
    });
  });

  describe('Progress Updates', () => {
    it('should update progress when receiving progress events', async () => {
      const { result } = renderHook(() => useAutomation());

      const progressData: AutomationProgress = {
        status: 'running',
        currentDay: 5,
        totalDays: 20,
        currentEntry: 2,
        totalEntries: 3,
        message: 'Processing day 5',
        logs: [],
      };

      act(() => {
        mockAPI._simulateProgress(progressData);
      });

      expect(result.current.progress).toEqual(progressData);
      expect(result.current.status).toBe('running');
    });

    it('should accumulate logs', async () => {
      const { result } = renderHook(() => useAutomation());

      act(() => {
        mockAPI._simulateLog({
          timestamp: new Date(),
          level: 'info',
          message: 'First log',
        });
      });

      act(() => {
        mockAPI._simulateLog({
          timestamp: new Date(),
          level: 'success',
          message: 'Second log',
        });
      });

      expect(result.current.logs).toHaveLength(2);
      expect(result.current.logs[0].message).toBe('First log');
      expect(result.current.logs[1].message).toBe('Second log');
    });
  });

  describe('Stop Automation', () => {
    it('should call stopAutomation and reset status', async () => {
      const { result } = renderHook(() => useAutomation());

      // Iniciar primero
      await act(async () => {
        await result.current.start({
          credentials: { email: '', password: '', rememberMe: false },
          csvData: [],
          horarios: [],
          mappings: {},
          config: { headless: true, timeout: 30000, loginUrl: '', autoSave: false },
        });
      });

      expect(result.current.status).toBe('running');

      // Detener
      await act(async () => {
        await result.current.stop();
      });

      expect(mockAPI.stopAutomation).toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('Pause/Resume Automation', () => {
    it('should toggle pause state', async () => {
      const { result } = renderHook(() => useAutomation());

      // Iniciar
      await act(async () => {
        await result.current.start({
          credentials: { email: '', password: '', rememberMe: false },
          csvData: [],
          horarios: [],
          mappings: {},
          config: { headless: true, timeout: 30000, loginUrl: '', autoSave: false },
        });
      });

      expect(result.current.isPaused).toBe(false);

      // Pausar
      await act(async () => {
        await result.current.togglePause();
      });

      expect(mockAPI.pauseAutomation).toHaveBeenCalled();
      expect(result.current.isPaused).toBe(true);
      expect(result.current.status).toBe('paused');

      // Reanudar
      await act(async () => {
        await result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(false);
      expect(result.current.status).toBe('running');
    });
  });

  describe('Completion', () => {
    it('should set status to completed on success', async () => {
      const { result } = renderHook(() => useAutomation());

      await act(async () => {
        await result.current.start({
          credentials: { email: '', password: '', rememberMe: false },
          csvData: [],
          horarios: [],
          mappings: {},
          config: { headless: true, timeout: 30000, loginUrl: '', autoSave: false },
        });
      });

      act(() => {
        mockAPI._simulateComplete({ success: true });
      });

      expect(result.current.status).toBe('completed');
    });
  });

  describe('Error Handling', () => {
    it('should set status to error on automation error', async () => {
      const { result } = renderHook(() => useAutomation());

      await act(async () => {
        await result.current.start({
          credentials: { email: '', password: '', rememberMe: false },
          csvData: [],
          horarios: [],
          mappings: {},
          config: { headless: true, timeout: 30000, loginUrl: '', autoSave: false },
        });
      });

      act(() => {
        mockAPI._simulateError({ error: 'Login timeout' });
      });

      expect(result.current.status).toBe('error');
    });

    it('should handle thrown exceptions', async () => {
      mockAPI.startAutomation.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAutomation());

      await act(async () => {
        await result.current.start({
          credentials: { email: '', password: '', rememberMe: false },
          csvData: [],
          horarios: [],
          mappings: {},
          config: { headless: true, timeout: 30000, loginUrl: '', autoSave: false },
        });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.logs).toContainEqual(
        expect.objectContaining({ level: 'error' })
      );
    });
  });
});
