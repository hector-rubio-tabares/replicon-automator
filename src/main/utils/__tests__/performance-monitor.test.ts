import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from '../performance-monitor.js';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Operation Tracking', () => {
    it('should start an operation', () => {
      monitor.startOperation('test-op');
      const timings = monitor.getOperationTimings();
      expect(timings).toHaveLength(0); // No finalizada aún
    });

    it('should end an operation successfully', () => {
      monitor.startOperation('test-op');
      vi.advanceTimersByTime(100);
      monitor.endOperation('test-op', true);

      const timings = monitor.getOperationTimings();
      expect(timings).toHaveLength(1);
      expect(timings[0].operation).toBe('test-op');
      expect(timings[0].duration).toBe(100);
      expect(timings[0].success).toBe(true);
      expect(timings[0].error).toBeUndefined();
    });

    it('should end an operation with error', () => {
      monitor.startOperation('failing-op');
      vi.advanceTimersByTime(50);
      monitor.endOperation('failing-op', false, 'Something went wrong');

      const timings = monitor.getOperationTimings();
      expect(timings).toHaveLength(1);
      expect(timings[0].operation).toBe('failing-op');
      expect(timings[0].duration).toBe(50);
      expect(timings[0].success).toBe(false);
      expect(timings[0].error).toBe('Something went wrong');
    });

    it('should track multiple operations', () => {
      monitor.startOperation('op1');
      vi.advanceTimersByTime(10);
      monitor.endOperation('op1', true);

      monitor.startOperation('op2');
      vi.advanceTimersByTime(20);
      monitor.endOperation('op2', true);

      monitor.startOperation('op3');
      vi.advanceTimersByTime(30);
      monitor.endOperation('op3', false, 'Failed');

      const timings = monitor.getOperationTimings();
      expect(timings).toHaveLength(3);
      expect(timings[0].duration).toBe(10);
      expect(timings[1].duration).toBe(20);
      expect(timings[2].duration).toBe(30);
      expect(timings[2].success).toBe(false);
    });

    it('should warn when ending non-started operation', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      monitor.endOperation('never-started', true);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('never-started'));
      const timings = monitor.getOperationTimings();
      expect(timings).toHaveLength(0);

      consoleWarnSpy.mockRestore();
    });

    it('should have accurate start and end times', () => {
      const baseTime = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(baseTime);

      monitor.startOperation('timed-op');
      vi.advanceTimersByTime(500);
      monitor.endOperation('timed-op', true);

      const timings = monitor.getOperationTimings();
      expect(timings[0].startTime).toEqual(baseTime);
      expect(timings[0].endTime).toEqual(new Date(baseTime.getTime() + 500));
    });
  });

  describe('Metrics Capture', () => {
    it('should capture current metrics', () => {
      const metrics = monitor.captureMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics.memoryUsage).toHaveProperty('rss');
      expect(metrics.memoryUsage).toHaveProperty('heapUsed');
      expect(metrics.memoryUsage).toHaveProperty('heapTotal');
      expect(metrics.memoryUsage).toHaveProperty('external');
      expect(metrics).toHaveProperty('uptime');
      expect(typeof metrics.uptime).toBe('number');
    });

    it('should capture custom metrics', () => {
      const custom = { requestCount: 42, cacheHitRate: 85.5 };
      const metrics = monitor.captureMetrics(custom);

      expect(metrics.custom).toEqual(custom);
    });

    it('should store metrics in history', () => {
      monitor.captureMetrics();
      monitor.captureMetrics();
      monitor.captureMetrics();

      const history = monitor.getMetricsHistory();
      expect(history).toHaveLength(3);
    });

    it('should limit history size to 100 entries', () => {
      for (let i = 0; i < 150; i++) {
        monitor.captureMetrics();
      }

      const history = monitor.getMetricsHistory();
      expect(history).toHaveLength(100);
    });

    it('should remove oldest entries when exceeding max size', () => {
      monitor.captureMetrics({ id: 1 });

      for (let i = 2; i <= 101; i++) {
        monitor.captureMetrics({ id: i });
      }

      const history = monitor.getMetricsHistory();
      expect(history).toHaveLength(100);
      expect(history[0].custom?.id).toBe(2); // First one removed
      expect(history[99].custom?.id).toBe(101);
    });

    it('should convert memory to MB with 2 decimals', () => {
      const metrics = monitor.captureMetrics();

      // Verificar que son números redondeados
      expect(metrics.memoryUsage.rss).toBeGreaterThan(0);
      expect(metrics.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(Number.isFinite(metrics.memoryUsage.rss)).toBe(true);
    });

    it('should round uptime to 2 decimals', () => {
      const metrics = monitor.captureMetrics();

      expect(Number.isFinite(metrics.uptime)).toBe(true);
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics snapshot', () => {
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('uptime');
    });

    it('should add to history when called', () => {
      monitor.getMetrics();
      monitor.getMetrics();

      const history = monitor.getMetricsHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe('getMetricsHistory', () => {
    it('should return copy of history array', () => {
      monitor.captureMetrics();
      const history1 = monitor.getMetricsHistory();
      const history2 = monitor.getMetricsHistory();

      expect(history1).not.toBe(history2); // Different instances
      expect(history1).toEqual(history2); // Same content
    });
  });

  describe('getOperationTimings', () => {
    it('should return copy of operations array', () => {
      monitor.startOperation('op1');
      monitor.endOperation('op1', true);

      const timings1 = monitor.getOperationTimings();
      const timings2 = monitor.getOperationTimings();

      expect(timings1).not.toBe(timings2); // Different instances
      expect(timings1).toEqual(timings2); // Same content
    });
  });

  describe('getOperationStats', () => {
    it('should return null for non-existent operation', () => {
      const stats = monitor.getOperationStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should calculate stats for single operation', () => {
      monitor.startOperation('op1');
      vi.advanceTimersByTime(100);
      monitor.endOperation('op1', true);

      const stats = monitor.getOperationStats('op1');
      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(1);
      expect(stats?.avgDuration).toBe(100);
      expect(stats?.minDuration).toBe(100);
      expect(stats?.maxDuration).toBe(100);
      expect(stats?.successRate).toBe(100);
    });

    it('should calculate stats for multiple operations', () => {
      // 3 successful ops: 100ms, 200ms, 300ms
      monitor.startOperation('csv-load');
      vi.advanceTimersByTime(100);
      monitor.endOperation('csv-load', true);

      monitor.startOperation('csv-load');
      vi.advanceTimersByTime(200);
      monitor.endOperation('csv-load', true);

      monitor.startOperation('csv-load');
      vi.advanceTimersByTime(300);
      monitor.endOperation('csv-load', false);

      const stats = monitor.getOperationStats('csv-load');
      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(3);
      expect(stats?.avgDuration).toBe(200); // (100 + 200 + 300) / 3
      expect(stats?.minDuration).toBe(100);
      expect(stats?.maxDuration).toBe(300);
      expect(stats?.successRate).toBe(67); // 2/3 = 66.67 rounded to 67
    });

    it('should handle all failed operations', () => {
      monitor.startOperation('fail1');
      vi.advanceTimersByTime(50);
      monitor.endOperation('fail1', false);

      monitor.startOperation('fail1');
      vi.advanceTimersByTime(60);
      monitor.endOperation('fail1', false);

      const stats = monitor.getOperationStats('fail1');
      expect(stats?.successRate).toBe(0);
    });

    it('should handle all successful operations', () => {
      monitor.startOperation('success1');
      vi.advanceTimersByTime(10);
      monitor.endOperation('success1', true);

      monitor.startOperation('success1');
      vi.advanceTimersByTime(20);
      monitor.endOperation('success1', true);

      const stats = monitor.getOperationStats('success1');
      expect(stats?.successRate).toBe(100);
    });

    it('should only include specified operation in stats', () => {
      monitor.startOperation('op1');
      vi.advanceTimersByTime(100);
      monitor.endOperation('op1', true);

      monitor.startOperation('op2');
      vi.advanceTimersByTime(200);
      monitor.endOperation('op2', true);

      const stats = monitor.getOperationStats('op1');
      expect(stats?.count).toBe(1);
      expect(stats?.avgDuration).toBe(100);
    });
  });

  describe('clear', () => {
    it('should clear all operations', () => {
      monitor.startOperation('op1');
      monitor.endOperation('op1', true);
      monitor.clear();

      expect(monitor.getOperationTimings()).toHaveLength(0);
    });

    it('should clear all metrics history', () => {
      monitor.captureMetrics();
      monitor.captureMetrics();
      monitor.clear();

      expect(monitor.getMetricsHistory()).toHaveLength(0);
    });

    it('should clear pending timings', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      monitor.startOperation('pending');
      monitor.clear();
      monitor.endOperation('pending', true);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(monitor.getOperationTimings()).toHaveLength(0);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('generateReport', () => {
    it('should generate report with current metrics', () => {
      const report = monitor.generateReport();

      expect(report).toContain('Performance Report');
      expect(report).toContain('Timestamp:');
      expect(report).toContain('Uptime:');
      expect(report).toContain('Memory Usage');
      expect(report).toContain('RSS:');
      expect(report).toContain('Heap Used:');
    });

    it('should include operations summary', () => {
      monitor.startOperation('op1');
      monitor.endOperation('op1', true);
      monitor.startOperation('op2');
      monitor.endOperation('op2', false);

      const report = monitor.generateReport();

      expect(report).toContain('Operations');
      expect(report).toContain('Total: 2');
      expect(report).toContain('Success: 1');
      expect(report).toContain('Failed: 1');
    });

    it('should include operation details', () => {
      monitor.startOperation('csv-load');
      vi.advanceTimersByTime(150);
      monitor.endOperation('csv-load', true);

      monitor.startOperation('csv-load');
      vi.advanceTimersByTime(250);
      monitor.endOperation('csv-load', true);

      const report = monitor.generateReport();

      expect(report).toContain('Operation Details');
      expect(report).toContain('csv-load:');
      expect(report).toContain('2 ops');
      expect(report).toContain('200ms'); // avg of 150 and 250
      expect(report).toContain('100% success');
    });

    it('should handle empty operations', () => {
      const report = monitor.generateReport();

      expect(report).toContain('Total: 0');
      expect(report).toContain('Success: 0');
      expect(report).toContain('Failed: 0');
    });

    it('should format report with line breaks', () => {
      const report = monitor.generateReport();
      const lines = report.split('\n');

      expect(lines.length).toBeGreaterThan(5);
      expect(lines[0]).toBe('=== Performance Report ===');
    });

    it('should handle multiple operation types', () => {
      monitor.startOperation('csv-load');
      monitor.endOperation('csv-load', true);

      monitor.startOperation('automation');
      monitor.endOperation('automation', false);

      monitor.startOperation('export');
      monitor.endOperation('export', true);

      const report = monitor.generateReport();

      expect(report).toContain('csv-load:');
      expect(report).toContain('automation:');
      expect(report).toContain('export:');
    });
  });
});
