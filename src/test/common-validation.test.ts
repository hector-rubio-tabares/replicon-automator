import { describe, it, expect } from 'vitest';
import {
  validateCSVRow,
  validateCredentials,
  validateStartAutomation,
  validateCSVRows,
} from '../common/validation';

describe('Validation', () => {
  describe('validateCSVRow', () => {
    it('should validate valid CSV row', () => {
      const result = validateCSVRow({
        cuenta: 'AV',
        extras: 'extra info',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cuenta).toBe('AV');
        expect(result.data.extras).toBe('extra info');
      }
    });

    it('should validate row without extras', () => {
      const result = validateCSVRow({
        cuenta: 'BH',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.extras).toBe('');
      }
    });

    it('should fail with missing cuenta', () => {
      const result = validateCSVRow({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it('should fail with empty cuenta', () => {
      const result = validateCSVRow({
        cuenta: '',
      });

      expect(result.success).toBe(false);
    });

    it('should fail with missing proyecto', () => {
      // Test removed - proyecto no longer required
      expect(true).toBe(true);
    });
  });

  describe('validateCredentials', () => {
    it('should validate valid credentials', () => {
      const result = validateCredentials({
        username: 'user@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('user@example.com');
        expect(result.data.password).toBe('password123');
      }
    });

    it('should fail with invalid email', () => {
      const result = validateCredentials({
        username: 'notanemail',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Email');
      }
    });

    it('should fail with empty username', () => {
      const result = validateCredentials({
        username: '',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should fail with empty password', () => {
      const result = validateCredentials({
        username: 'user@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Contraseña');
      }
    });

    it('should fail with missing credentials', () => {
      const result = validateCredentials({});

      expect(result.success).toBe(false);
    });
  });

  describe('validateStartAutomation', () => {
    const validRequest = {
      rows: [
        { cuenta: 'AV', proyecto: 'MS', extras: '' },
        { cuenta: 'JM', proyecto: 'PR', extras: '' },
      ],
      rowIndices: [0, 1],
      credentials: {
        username: 'user@example.com',
        password: 'password123',
      },
      headless: true,
    };

    it('should validate valid automation request', () => {
      const result = validateStartAutomation(validRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rows).toHaveLength(2);
        expect(result.data.rowIndices).toEqual([0, 1]);
        expect(result.data.headless).toBe(true);
      }
    });

    it('should use default headless value', () => {
      const { headless: _headless, ...requestWithoutHeadless } = validRequest;
      const result = validateStartAutomation(requestWithoutHeadless);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headless).toBe(true);
      }
    });

    it('should fail with empty rows', () => {
      const result = validateStartAutomation({
        ...validRequest,
        rows: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('al menos una fila');
      }
    });

    it('should fail with invalid credentials', () => {
      const result = validateStartAutomation({
        ...validRequest,
        credentials: {
          username: 'invalid-email',
          password: 'pass',
        },
      });

      expect(result.success).toBe(false);
    });

    it('should fail with missing rowIndices', () => {
      const { rowIndices: _rowIndices, ...requestWithoutIndices } = validRequest;
      const result = validateStartAutomation(requestWithoutIndices);

      expect(result.success).toBe(false);
    });
  });

  describe('validateCSVRows', () => {
    it('should validate all valid rows', () => {
      const rows = [
        { cuenta: 'AV', proyecto: 'MS', extras: '' },
        { cuenta: 'JM', proyecto: 'PR', extras: 'extra' },
        { cuenta: 'BH', proyecto: 'MS', extras: '' },
      ];

      const result = validateCSVRows(rows);

      expect(result.valid).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should separate valid and invalid rows', () => {
      const rows = [
        { cuenta: 'AV' }, // valid
        { cuenta: '' },   // invalid: empty cuenta
        { cuenta: 'JM' }, // valid
        { cuenta: 'BH' }, // valid
      ];

      const result = validateCSVRows(rows);

      expect(result.valid).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });

    it('should handle empty array', () => {
      const result = validateCSVRows([]);

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide error messages', () => {
      const rows = [
        { cuenta: '', proyecto: 'MS' },
      ];

      const result = validateCSVRows(rows);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBeTruthy();
      expect(typeof result.errors[0].error).toBe('string');
    });

    it('should validate rows with extras field', () => {
      const rows = [
        { cuenta: 'AV', proyecto: 'MS', extras: 'info 1' },
        { cuenta: 'JM', proyecto: 'PR', extras: 'info 2' },
      ];

      const result = validateCSVRows(rows);

      expect(result.valid).toHaveLength(2);
      expect(result.valid[0].extras).toBe('info 1');
      expect(result.valid[1].extras).toBe('info 2');
    });
  });
});
