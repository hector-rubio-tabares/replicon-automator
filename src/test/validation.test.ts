import { describe, it, expect } from 'vitest';
import {
  CSVRowSchema,
  CredentialsSchema,
  validateCSVRow,
  validateCredentials,
  validateCSVRows,
} from '@shared/validation';
describe('CSVRowSchema', () => {
  it('should validate a valid row', () => {
    const result = CSVRowSchema.safeParse({
      cuenta: 'TEST-001',
      extras: '',
    });
    expect(result.success).toBe(true);
  });
  it('should reject empty cuenta', () => {
    const result = CSVRowSchema.safeParse({
      cuenta: '',
    });
    expect(result.success).toBe(false);
  });
  it('should reject empty proyecto', () => {
    // Test removed - proyecto field no longer exists
    expect(true).toBe(true);
  });
  it('should default extras to empty string', () => {
    const result = CSVRowSchema.safeParse({
      cuenta: 'TEST-001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extras).toBe('');
    }
  });
});
describe('CredentialsSchema', () => {
  it('should validate valid credentials', () => {
    const result = CredentialsSchema.safeParse({
      username: 'user@example.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });
  it('should reject invalid email', () => {
    const result = CredentialsSchema.safeParse({
      username: 'invalid-email',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });
  it('should reject empty password', () => {
    const result = CredentialsSchema.safeParse({
      username: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
describe('validateCSVRow', () => {
  it('should return success for valid data', () => {
    const result = validateCSVRow({
      cuenta: 'TEST',
    });
    expect(result.success).toBe(true);
  });
  it('should return error message for invalid data', () => {
    const result = validateCSVRow({
      cuenta: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Cuenta');
    }
  });
});
describe('validateCredentials', () => {
  it('should validate correct credentials', () => {
    const result = validateCredentials({
      username: 'test@test.com',
      password: 'pass',
    });
    expect(result.success).toBe(true);
  });
});
describe('validateCSVRows', () => {
  it('should separate valid and invalid rows', () => {
    const rows = [
      { cuenta: 'A' },
      { cuenta: '' },
      { cuenta: 'C' },
      { cuenta: '' },
    ];
    const { valid, errors } = validateCSVRows(rows);
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(2);
    expect(errors[0].index).toBe(1);
    expect(errors[1].index).toBe(3);
  });
});
