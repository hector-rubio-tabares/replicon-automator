import { describe, it, expect } from 'vitest';
import { IPC } from '../common/ipc';

describe('IPC Constants', () => {
  it('should have CREDENTIALS channels', () => {
    expect(IPC.CREDENTIALS_SAVE).toBe('credentials:save');
    expect(IPC.CREDENTIALS_LOAD).toBe('credentials:load');
    expect(IPC.CREDENTIALS_CLEAR).toBe('credentials:clear');
  });

  it('should have CONFIG channels', () => {
    expect(IPC.CONFIG_GET).toBe('config:get');
    expect(IPC.CONFIG_SET).toBe('config:set');
  });

  it('should have AUTOMATION channels', () => {
    expect(IPC.AUTOMATION_START).toBe('automation:start');
    expect(IPC.AUTOMATION_STOP).toBe('automation:stop');
    expect(IPC.AUTOMATION_PAUSE).toBe('automation:pause');
    expect(IPC.AUTOMATION_PROGRESS).toBe('automation:progress');
    expect(IPC.AUTOMATION_LOG).toBe('automation:log');
    expect(IPC.AUTOMATION_COMPLETE).toBe('automation:complete');
    expect(IPC.AUTOMATION_ERROR).toBe('automation:error');
  });

  it('should have all unique values', () => {
    const values = Object.values(IPC);
    const uniqueValues = new Set(values);
    
    expect(values.length).toBe(uniqueValues.size);
  });

  it('should follow naming convention', () => {
    const values = Object.values(IPC);
    
    values.forEach(value => {
      expect(value).toMatch(/^[a-z]+:[a-z]+$/);
    });
  });

  it('should have all expected channels defined', () => {
    expect(IPC.CSV_LOAD).toBeDefined();
    expect(IPC.AUTOMATION_START).toBeDefined();
    expect(IPC.CONFIG_GET).toBeDefined();
  });
});
