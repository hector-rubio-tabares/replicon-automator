import { describe, it, expect } from 'vitest';
import * as CommonIndex from '../common/index';

describe('Common Index Exports', () => {
  it('should export all types', () => {
    // Verify exports exist by checking typeof
    expect(CommonIndex).toBeDefined();
  });

  it('should have utils functions', () => {
    expect(typeof CommonIndex.formatDate).toBe('function');
    expect(typeof CommonIndex.formatTimestamp).toBe('function');
    expect(typeof CommonIndex.militaryToStandard).toBe('function');
    expect(typeof CommonIndex.standardToMilitary).toBe('function');
    expect(typeof CommonIndex.generateId).toBe('function');
  });

  it('should have config helpers', () => {
    expect(typeof CommonIndex.addHorario).toBe('function');
    expect(typeof CommonIndex.removeHorario).toBe('function');
    expect(typeof CommonIndex.updateHorario).toBe('function');
    // Note: addAccount, removeAccount, addProject removed from exports
  });

  it('should have retry functions', () => {
    expect(typeof CommonIndex.withRetry).toBe('function');
    expect(typeof CommonIndex.withNetworkRetry).toBe('function');
    expect(typeof CommonIndex.CircuitBreaker).toBe('function');
  });

  it('should have validation functions', () => {
    expect(typeof CommonIndex.validateCSVRow).toBe('function');
    expect(typeof CommonIndex.validateCredentials).toBe('function');
    expect(typeof CommonIndex.validateStartAutomation).toBe('function');
    expect(typeof CommonIndex.validateCSVRows).toBe('function');
  });

  it('should export constants', () => {
    expect(CommonIndex.DEFAULT_HORARIOS).toBeDefined();
    expect(CommonIndex.PLAYWRIGHT_TIMEOUTS).toBeDefined();
    expect(CommonIndex.SPECIAL_ACCOUNTS).toBeDefined();
    expect(CommonIndex.DEFAULT_CONFIG).toBeDefined();
    expect(CommonIndex.DEFAULT_MAPPINGS).toBeDefined();
    expect(CommonIndex.CSV_TEMPLATES).toBeDefined();
  });

  it('should export IPC constants', () => {
    expect(CommonIndex.IPC).toBeDefined();
    expect(CommonIndex.IPC.CSV_LOAD).toBeDefined();
    expect(CommonIndex.IPC.AUTOMATION_START).toBeDefined();
  });
});
