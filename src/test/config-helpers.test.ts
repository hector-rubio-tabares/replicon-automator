import { describe, it, expect } from 'vitest';
import {
  addHorario,
  removeHorario,
  updateHorario,
} from '../common/config-helpers';
import type { TimeSlot } from '../common/types';

describe('Config Helpers', () => {
  describe('addHorario', () => {
    it('should add new horario to empty array', () => {
      const slot: TimeSlot = { id: '1', start_time: '8:00am', end_time: '12:00pm' };
      const result = addHorario([], slot);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(slot);
    });

    it('should add new horario to existing array', () => {
      const existing: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      ];
      const newSlot: TimeSlot = { id: '2', start_time: '1:00pm', end_time: '5:00pm' };
      const result = addHorario(existing, newSlot);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(newSlot);
    });

    it('should not mutate original array', () => {
      const original: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      ];
      const newSlot: TimeSlot = { id: '2', start_time: '1:00pm', end_time: '5:00pm' };
      
      addHorario(original, newSlot);

      expect(original).toHaveLength(1);
    });
  });

  describe('removeHorario', () => {
    it('should remove horario by id', () => {
      const horarios: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
        { id: '2', start_time: '1:00pm', end_time: '5:00pm' },
      ];

      const result = removeHorario(horarios, '1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should return same array if id not found', () => {
      const horarios: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      ];

      const result = removeHorario(horarios, 'nonexistent');

      expect(result).toHaveLength(1);
    });

    it('should not mutate original array', () => {
      const original: TimeSlot[] = [
        { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      ];

      removeHorario(original, '1');

      expect(original).toHaveLength(1);
    });
  });

  describe('updateHorario', () => {
    const horarios: TimeSlot[] = [
      { id: '1', start_time: '8:00am', end_time: '12:00pm' },
      { id: '2', start_time: '1:00pm', end_time: '5:00pm' },
    ];

    it('should update start_time', () => {
      const result = updateHorario(horarios, '1', 'start_time', '9:00am');

      expect(result[0].start_time).toBe('9:00am');
      expect(result[0].end_time).toBe('12:00pm');
    });

    it('should update end_time', () => {
      const result = updateHorario(horarios, '2', 'end_time', '6:00pm');

      expect(result[1].end_time).toBe('6:00pm');
      expect(result[1].start_time).toBe('1:00pm');
    });

    it('should not modify other horarios', () => {
      const result = updateHorario(horarios, '1', 'start_time', '9:00am');

      expect(result[1]).toEqual(horarios[1]);
    });

    it('should not mutate original array', () => {
      const original = [...horarios];
      updateHorario(horarios, '1', 'start_time', '9:00am');

      expect(horarios).toEqual(original);
    });
  });

  describe('addAccount', () => {
    it.skip('REMOVED: Account management functions removed', () => {});
    it.skip('should convert account code to uppercase - REMOVED', () => {});
    it.skip('should trim whitespace from inputs - REMOVED', () => {});
    it.skip('should return unchanged mappings if code is empty - REMOVED', () => {});
    it.skip('should return unchanged mappings if name is empty - REMOVED', () => {});
    it.skip('should not mutate original mappings - REMOVED', () => {});
  });

  describe('removeAccount', () => {
    it.skip('should remove account by code - REMOVED', () => {});
    it.skip('should return same mappings if code not found - REMOVED', () => {});
    it.skip('should not mutate original mappings - REMOVED', () => {});
  });

  describe('addProject', () => {
    it.skip('REMOVED: Project management functions removed', () => {});
    it.skip('should convert project code to uppercase - REMOVED', () => {});
    it.skip('should trim project code - REMOVED', () => {});
    it.skip('should return unchanged if account does not exist - REMOVED', () => {});
    it.skip('should return unchanged if project code is empty - REMOVED', () => {});
    it.skip('should not mutate original mappings - REMOVED', () => {});
    it.skip('should preserve existing projects - REMOVED', () => {});
  });
});
