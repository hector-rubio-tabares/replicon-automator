import { describe, it, expect, beforeEach } from 'vitest';
import { AccountMapperService } from '../main/services/account-mapper.service';
import type { AccountMappings } from '../common/types';

describe('AccountMapperService', () => {
  let service: AccountMapperService;
  let mappings: AccountMappings;

  beforeEach(() => {
    mappings = {
      AV: 'AvantiCard',
      JM: 'JM Services',
    };

    service = new AccountMapperService(mappings);
  });

  describe('constructor', () => {
    it('should initialize with mappings', () => {
      expect(service).toBeDefined();
    });
  });

  describe('updateMappings', () => {
    it('should update mappings', () => {
      const newMappings: AccountMappings = {
        NEW: 'New Account',
      };

      service.updateMappings(newMappings);

      expect(service.hasAccount('NEW')).toBe(true);
      expect(service.hasAccount('AV')).toBe(false);
    });
  });

  describe('mapAccount', () => {
    it('should map account name', () => {
      const mapped = service.mapAccount('AV');

      expect(mapped).toBe('AvantiCard');
    });

    it('should return original if no mapping', () => {
      const mapped = service.mapAccount('UNKNOWN');

      expect(mapped).toBe('UNKNOWN');
    });

    it('should handle case insensitive', () => {
      const mapped = service.mapAccount('av');

      expect(mapped).toBe('AvantiCard');
    });

    it('should trim whitespace', () => {
      const mapped = service.mapAccount('  AV  ');

      expect(mapped).toBe('AvantiCard');
    });
  });

  describe('mapProject', () => {
    it.skip('should map project name - REMOVED: No project support', () => {});
    it.skip('should return original if no account mapping - REMOVED', () => {});
    it.skip('should return original if no project mapping - REMOVED', () => {});
    it.skip('should handle case insensitive - REMOVED', () => {});
    it.skip('should trim whitespace - REMOVED', () => {});
  });

  describe('isSpecialAccount', () => {
    it('should detect vacation accounts', () => {
      expect(service.isSpecialAccount('H')).toBe(true);
      expect(service.isSpecialAccount('F')).toBe(true);
    });

    it('should detect no-work accounts', () => {
      expect(service.isSpecialAccount('BH')).toBe(true);
    });

    it('should detect weekend accounts', () => {
      expect(service.isSpecialAccount('FDS')).toBe(true);
      expect(service.isSpecialAccount('ND')).toBe(true);
    });

    it('should return false for regular accounts', () => {
      expect(service.isSpecialAccount('AV')).toBe(false);
    });
  });

  describe('isVacation', () => {
    it('should detect vacation', () => {
      expect(service.isVacation('H')).toBe(true);
      expect(service.isVacation('F')).toBe(true);
    });

    it('should not detect non-vacation', () => {
      expect(service.isVacation('BH')).toBe(false);
      expect(service.isVacation('AV')).toBe(false);
    });
  });

  describe('isNoWork', () => {
    it('should detect no-work', () => {
      expect(service.isNoWork('BH')).toBe(true);
    });

    it('should not detect non-no-work', () => {
      expect(service.isNoWork('H')).toBe(false);
      expect(service.isNoWork('AV')).toBe(false);
    });
  });

  describe('isWeekend', () => {
    it('should detect weekend', () => {
      expect(service.isWeekend('FDS')).toBe(true);
      expect(service.isWeekend('ND')).toBe(true);
    });

    it('should not detect non-weekend', () => {
      expect(service.isWeekend('HV')).toBe(false);
    });
  });

  describe('hasAccount', () => {
    it('should find existing account', () => {
      expect(service.hasAccount('AV')).toBe(true);
      expect(service.hasAccount('JM')).toBe(true);
    });

    it('should not find non-existing account', () => {
      expect(service.hasAccount('UNKNOWN')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(service.hasAccount('av')).toBe(true);
    });
  });

  describe('hasProject', () => {
    it.skip('should find existing project - REMOVED: No project support', () => {});
    it.skip('should not find non-existing project - REMOVED', () => {});
    it.skip('should not find project for non-existing account - REMOVED', () => {});
    it.skip('should be case insensitive - REMOVED', () => {});
  });
});
