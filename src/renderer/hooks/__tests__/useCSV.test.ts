import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCSV } from '../useCSV';

// Mock the toast store
vi.mock('../../../renderer/stores/toast-store', () => ({
  useToastStore: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock i18n
vi.mock('../../../renderer/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

describe('useCSV Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with null data', () => {
      const { result } = renderHook(() => useCSV());

      expect(result.current.data).toBeNull();
      expect(result.current.fileName).toBeNull();
    });

    it('should provide loadCSV function', () => {
      const { result } = renderHook(() => useCSV());

      expect(typeof result.current.loadCSV).toBe('function');
    });

    it('should provide saveCSV function', () => {
      const { result } = renderHook(() => useCSV());

      expect(typeof result.current.saveCSV).toBe('function');
    });

    it('should provide setData function', () => {
      const { result } = renderHook(() => useCSV());

      expect(typeof result.current.setData).toBe('function');
    });
  });

  describe('loadCSV', () => {
    it('should load CSV data successfully', async () => {
      const mockData = [
        { cuenta: 'AV', extras: '' },
        { cuenta: 'JM', extras: '' },
      ];

      window.electronAPI.loadCSV = vi.fn(async () => ({
        success: true,
        data: mockData,
        filePath: '/path/to/test.csv',
      }));

      const { result } = renderHook(() => useCSV());

      await act(async () => {
        await result.current.loadCSV();
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.fileName).toBe('test.csv');
    });

    it('should handle load error', async () => {
      window.electronAPI.loadCSV = vi.fn(async () => ({
        success: false,
        error: 'File not found',
      }));

      const { result } = renderHook(() => useCSV());

      await act(async () => {
        await result.current.loadCSV();
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle load exception', async () => {
      window.electronAPI.loadCSV = vi.fn(async () => {
        throw new Error('Network error');
      });

      const { result } = renderHook(() => useCSV());

      await act(async () => {
        await result.current.loadCSV();
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('saveCSV', () => {
    it('should save CSV data successfully', async () => {
      window.electronAPI.saveCSV = vi.fn(async () => ({
        success: true,
      }));

      const { result } = renderHook(() => useCSV());

      // Set some data first
      act(() => {
        result.current.setData([
          { cuenta: 'AV', extras: '' },
        ]);
      });

      await act(async () => {
        await result.current.saveCSV();
      });

      expect(window.electronAPI.saveCSV).toHaveBeenCalled();
    });

    it('should not save if no data', async () => {
      window.electronAPI.saveCSV = vi.fn();

      const { result } = renderHook(() => useCSV());

      await act(async () => {
        await result.current.saveCSV();
      });

      expect(window.electronAPI.saveCSV).not.toHaveBeenCalled();
    });

    it('should not save if empty array', async () => {
      window.electronAPI.saveCSV = vi.fn();

      const { result } = renderHook(() => useCSV());

      act(() => {
        result.current.setData([]);
      });

      await act(async () => {
        await result.current.saveCSV();
      });

      expect(window.electronAPI.saveCSV).not.toHaveBeenCalled();
    });

    it('should handle save error', async () => {
      window.electronAPI.saveCSV = vi.fn(async () => ({
        success: false,
        error: 'Permission denied',
      }));

      const { result } = renderHook(() => useCSV());

      act(() => {
        result.current.setData([{ cuenta: 'AV', extras: '' }]);
      });

      await act(async () => {
        await result.current.saveCSV();
      });

      // Error should be handled
      expect(window.electronAPI.saveCSV).toHaveBeenCalled();
    });

    it('should handle save exception', async () => {
      window.electronAPI.saveCSV = vi.fn(async () => {
        throw new Error('Disk full');
      });

      const { result } = renderHook(() => useCSV());

      act(() => {
        result.current.setData([{ cuenta: 'AV', extras: '' }]);
      });

      await act(async () => {
        await result.current.saveCSV();
      });

      expect(window.electronAPI.saveCSV).toHaveBeenCalled();
    });
  });

  describe('setData', () => {
    it('should update data', () => {
      const { result } = renderHook(() => useCSV());

      const newData = [
        { cuenta: 'AV', extras: '' },
        { cuenta: 'JM', extras: '' },
      ];

      act(() => {
        result.current.setData(newData);
      });

      expect(result.current.data).toEqual(newData);
    });

    it('should replace existing data', () => {
      const { result } = renderHook(() => useCSV());

      act(() => {
        result.current.setData([{ cuenta: 'AV', extras: '' }]);
      });

      const newData = [{ cuenta: 'JM', extras: '' }];

      act(() => {
        result.current.setData(newData);
      });

      expect(result.current.data).toEqual(newData);
    });
  });
});
