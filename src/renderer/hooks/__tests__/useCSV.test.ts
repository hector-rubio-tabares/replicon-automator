import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCSV } from '../useCSV';

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

    it('should provide setData function', () => {
      const { result } = renderHook(() => useCSV());

      expect(typeof result.current.setData).toBe('function');
    });

    it('should provide setFileName function', () => {
      const { result } = renderHook(() => useCSV());

      expect(typeof result.current.setFileName).toBe('function');
    });
  });

  describe('data management', () => {
    it('should update data when setData is called', () => {
      const { result } = renderHook(() => useCSV());
      const testData = [
        { cuenta: 'AV', extras: '' },
        { cuenta: 'JM', extras: '' },
      ];

      act(() => {
        result.current.setData(testData);
      });

      expect(result.current.data).toEqual(testData);
    });

    it('should update fileName when setFileName is called', () => {
      const { result } = renderHook(() => useCSV());

      act(() => {
        result.current.setFileName('test.csv');
      });

      expect(result.current.fileName).toBe('test.csv');
    });

    it('should clear data when setData is called with null', () => {
      const { result } = renderHook(() => useCSV());

      act(() => {
        result.current.setData([{ cuenta: 'AV', extras: '' }]);
      });

      expect(result.current.data).not.toBeNull();

      act(() => {
        result.current.setData(null);
      });

      expect(result.current.data).toBeNull();
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
