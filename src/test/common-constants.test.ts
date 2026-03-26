import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_HORARIOS, 
  PLAYWRIGHT_TIMEOUTS, 
  SPECIAL_ACCOUNTS,
  DEFAULT_CONFIG,
  DEFAULT_MAPPINGS,
  CSV_TEMPLATES
} from '../common/constants';

describe('Constants', () => {
  describe('DEFAULT_HORARIOS', () => {
    it('should have two default schedules', () => {
      expect(DEFAULT_HORARIOS).toHaveLength(2);
    });

    it('should have morning schedule', () => {
      const morning = DEFAULT_HORARIOS[0];
      expect(morning.id).toBe('1');
      expect(morning.start_time).toBe('7:00am');
      expect(morning.end_time).toBe('1:00pm');
    });

    it('should have afternoon schedule', () => {
      const afternoon = DEFAULT_HORARIOS[1];
      expect(afternoon.id).toBe('2');
      expect(afternoon.start_time).toBe('2:00pm');
      expect(afternoon.end_time).toBe('4:00pm');
    });
  });

  describe('PLAYWRIGHT_TIMEOUTS', () => {
    it('should have MFA_CHECK timeout', () => {
      expect(PLAYWRIGHT_TIMEOUTS.MFA_CHECK).toBe(5000);
    });

    it('should have NEW_PAGE timeout', () => {
      expect(PLAYWRIGHT_TIMEOUTS.NEW_PAGE).toBe(30000);
    });

    it('should have ELEMENT timeout', () => {
      expect(PLAYWRIGHT_TIMEOUTS.ELEMENT).toBe(30000);
    });

    it('should have AUTH timeout', () => {
      expect(PLAYWRIGHT_TIMEOUTS.AUTH).toBe(60000);
    });

    it('should have SLOW_MO delay', () => {
      expect(PLAYWRIGHT_TIMEOUTS.SLOW_MO).toBe(50);
    });

    it('should have PAUSE_POLL delay', () => {
      expect(PLAYWRIGHT_TIMEOUTS.PAUSE_POLL).toBe(500);
    });

    it('should have all timeouts defined', () => {
      expect(PLAYWRIGHT_TIMEOUTS.MFA_CHECK).toBeDefined();
      expect(PLAYWRIGHT_TIMEOUTS.NEW_PAGE).toBeDefined();
      expect(PLAYWRIGHT_TIMEOUTS.ELEMENT).toBeDefined();
      expect(PLAYWRIGHT_TIMEOUTS.AUTH).toBeDefined();
    });
  });

  describe('SPECIAL_ACCOUNTS', () => {
    it('should have VACATION accounts', () => {
      expect(SPECIAL_ACCOUNTS.VACATION).toEqual(['V']);
    });

    it('should have NO_WORK accounts', () => {
      expect(SPECIAL_ACCOUNTS.NO_WORK).toEqual(['ND']);
    });

    it('should have WEEKEND accounts', () => {
      expect(SPECIAL_ACCOUNTS.WEEKEND).toEqual(['FDS']);
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have timeout property', () => {
      expect(DEFAULT_CONFIG.timeout).toBeDefined();
      expect(typeof DEFAULT_CONFIG.timeout).toBe('number');
    });

    it('should have headless property', () => {
      expect(DEFAULT_CONFIG.headless).toBeDefined();
      expect(typeof DEFAULT_CONFIG.headless).toBe('boolean');
    });

    it('should have autoSave property', () => {
      expect(DEFAULT_CONFIG.autoSave).toBeDefined();
      expect(typeof DEFAULT_CONFIG.autoSave).toBe('boolean');
    });
  });

  describe('DEFAULT_MAPPINGS', () => {
    it('should have ND mapping', () => {
      expect(DEFAULT_MAPPINGS.ND).toBeDefined();
      expect(DEFAULT_MAPPINGS.ND).toBe('No Data');
    });

    it('should have vacation mappings', () => {
      expect(DEFAULT_MAPPINGS.V).toBe('Vacaciones');
    });

    it.skip('should have Avianca mapping - REMOVED: Business mappings removed', () => {});
    it.skip('should have Jambojet mapping - REMOVED', () => {});
    it.skip('should have Newshore PROD mapping - REMOVED', () => {});
    it.skip('should have Plus Ultra mapping - REMOVED', () => {});
    it.skip('should have TAAG Angola mapping - REMOVED', () => {});
    it.skip('should have Newshore internal mapping - REMOVED', () => {});
  });

  describe('CSV_TEMPLATES', () => {
    it('should have standard week template', () => {
      const template = CSV_TEMPLATES.find(t => t.id === 'standard-week');
      
      expect(template).toBeDefined();
      expect(template?.rows).toHaveLength(7);
      expect(template?.name).toBe('Semana Estándar');
    });

    it('should have vacation week template', () => {
      const template = CSV_TEMPLATES.find(t => t.id === 'vacation-week');
      
      expect(template).toBeDefined();
      expect(template?.rows).toHaveLength(7);
      expect(template?.rows[0].cuenta).toBe('V');
    });

    it.skip('should have mixed projects template - REMOVED: No project support', () => {});

    it('should have exactly 3 templates', () => {
      expect(CSV_TEMPLATES).toHaveLength(3);
    });

    it('should have all templates with unique IDs', () => {
      const ids = CSV_TEMPLATES.map(t => t.id);
      const uniqueIds = new Set(ids);
      
      expect(ids.length).toBe(uniqueIds.size);
    });
  });
});
