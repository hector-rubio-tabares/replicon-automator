import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfig } from '../useConfig';
import { DEFAULT_HORARIOS, DEFAULT_MAPPINGS, DEFAULT_CONFIG } from '../../../common/constants';

// Mock i18n
vi.mock('../../../renderer/i18n', () => ({
  getTranslation: (key: string) => key,
}));

describe('useConfig Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI.getConfig = vi.fn(async () => null);
    window.electronAPI.setConfig = vi.fn(async () => true);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useConfig());

      expect(result.current.horarios).toEqual(DEFAULT_HORARIOS);
      expect(result.current.mappings).toEqual(DEFAULT_MAPPINGS);
      expect(result.current.appConfig).toEqual(DEFAULT_CONFIG);
    });

    it('should provide setHorarios function', () => {
      const { result } = renderHook(() => useConfig());

      expect(typeof result.current.setHorarios).toBe('function');
    });

    it('should provide setMappings function', () => {
      const { result } = renderHook(() => useConfig());

      expect(typeof result.current.setMappings).toBe('function');
    });

    it('should provide setAppConfig function', () => {
      const { result } = renderHook(() => useConfig());

      expect(typeof result.current.setAppConfig).toBe('function');
    });
  });

  describe('loading config on mount', () => {
    it('should load horarios from electronAPI', async () => {
      const savedHorarios = [
        { id: '1', start_time: '8:00am', end_time: '5:00pm' },
      ];

      window.electronAPI.getConfig = vi.fn(async (key) => {
        if (key === 'horarios') return savedHorarios;
        return null;
      });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.horarios).toEqual(savedHorarios);
      });
    });

    it('should load mappings from electronAPI', async () => {
      const savedMappings = {
        TEST: { name: 'Test Account', projects: {} },
      };

      window.electronAPI.getConfig = vi.fn(async (key) => {
        if (key === 'mappings') return savedMappings;
        return null;
      });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.mappings).toEqual(savedMappings);
      });
    });

    it('should load appConfig from electronAPI', async () => {
      const savedConfig = {
        loginUrl: 'https://test.com',
        timeout: 60000,
        headless: false,
        autoSave: true,
      };

      window.electronAPI.getConfig = vi.fn(async (key) => {
        if (key === 'config') return savedConfig;
        return null;
      });

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.appConfig).toEqual(savedConfig);
      });
    });

    it('should handle load error gracefully', async () => {
      window.electronAPI.getConfig = vi.fn(async () => {
        throw new Error('Database error');
      });

      const { result } = renderHook(() => useConfig());

      // Should keep default values
      expect(result.current.horarios).toEqual(DEFAULT_HORARIOS);
      expect(result.current.mappings).toEqual(DEFAULT_MAPPINGS);
      expect(result.current.appConfig).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('setHorarios', () => {
    it('should update horarios and save to electronAPI', () => {
      const { result } = renderHook(() => useConfig());

      const newHorarios = [
        { id: '1', start_time: '9:00am', end_time: '6:00pm' },
      ];

      act(() => {
        result.current.setHorarios(newHorarios);
      });

      expect(result.current.horarios).toEqual(newHorarios);
      expect(window.electronAPI.setConfig).toHaveBeenCalledWith('horarios', newHorarios);
    });

    it('should handle save error gracefully', () => {
      window.electronAPI.setConfig = vi.fn(() => {
        throw new Error('Save failed');
      });

      const { result } = renderHook(() => useConfig());

      const newHorarios = [
        { id: '1', start_time: '9:00am', end_time: '6:00pm' },
      ];

      act(() => {
        result.current.setHorarios(newHorarios);
      });

      // Should still update state
      expect(result.current.horarios).toEqual(newHorarios);
    });
  });

  describe('setMappings', () => {
    it('should update mappings and save to electronAPI', () => {
      const { result } = renderHook(() => useConfig());

      const newMappings = {
        NEW: 'New Account',
      };

      act(() => {
        result.current.setMappings(newMappings);
      });

      expect(result.current.mappings).toEqual(newMappings);
      expect(window.electronAPI.setConfig).toHaveBeenCalledWith('mappings', newMappings);
    });

    it('should handle save error gracefully', () => {
      window.electronAPI.setConfig = vi.fn(() => {
        throw new Error('Save failed');
      });

      const { result } = renderHook(() => useConfig());

      const newMappings = {
        NEW: 'New Account',
      };

      act(() => {
        result.current.setMappings(newMappings);
      });

      expect(result.current.mappings).toEqual(newMappings);
    });
  });

  describe('setAppConfig', () => {
    it('should update appConfig and save to electronAPI', () => {
      const { result } = renderHook(() => useConfig());

      const newConfig = {
        loginUrl: 'https://new-url.com',
        timeout: 90000,
        headless: false,
        autoSave: false,
      };

      act(() => {
        result.current.setAppConfig(newConfig);
      });

      expect(result.current.appConfig).toEqual(newConfig);
      expect(window.electronAPI.setConfig).toHaveBeenCalledWith('config', newConfig);
    });

    it('should handle save error gracefully', () => {
      window.electronAPI.setConfig = vi.fn(() => {
        throw new Error('Save failed');
      });

      const { result } = renderHook(() => useConfig());

      const newConfig = {
        loginUrl: 'https://error-url.com',
        timeout: 30000,
        headless: true,
        autoSave: true,
      };

      act(() => {
        result.current.setAppConfig(newConfig);
      });

      expect(result.current.appConfig).toEqual(newConfig);
    });
  });
});
