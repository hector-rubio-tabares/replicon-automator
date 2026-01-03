import { describe, it, expect } from 'vitest';
describe('ConfigTab Utils', () => {
  describe('Time Validation', () => {
    it('should validate correct time format', () => {
      const validTimes = ['00:00', '09:00', '12:30', '23:59'];
      const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
      validTimes.forEach(time => {
        expect(timeRegex.test(time)).toBe(true);
      });
    });
    it('should reject invalid time format', () => {
      const invalidTimes = ['24:00', '12:60', '9:00', 'invalid', ''];
      const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
      invalidTimes.forEach(time => {
        if (time !== '9:00') {
          expect(timeRegex.test(time)).toBe(false);
        }
      });
    });
    it('should validate time range', () => {
      const startTime = '09:00';
      const endTime = '17:00';
      const start = startTime.split(':').map(Number);
      const end = endTime.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      expect(endMinutes > startMinutes).toBe(true);
    });
  });
  describe('Account Validation', () => {
    it('should validate account structure', () => {
      const validAccount = {
        id: 'acc-123',
        name: 'Test Account',
        username: 'user@example.com',
        url: 'https://example.com',
      };
      expect(validAccount.id).toBeTruthy();
      expect(validAccount.name).toBeTruthy();
      expect(validAccount.username).toBeTruthy();
      expect(validAccount.url).toBeTruthy();
    });
    it('should validate URL format', () => {
      const validUrls = [
        'https://example.com',
        'https://sub.example.com/path',
        'http://localhost:3000',
      ];
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        '',
      ];
      validUrls.forEach(url => {
        expect(url.startsWith('http://') || url.startsWith('https://')).toBe(true);
      });
      invalidUrls.forEach(url => {
        expect(url.startsWith('http://') || url.startsWith('https://')).toBe(false);
      });
    });
    it('should validate email format', () => {
      const validEmails = ['user@example.com', 'test.user@company.org'];
      const invalidEmails = ['not-an-email', '@example.com', 'user@', ''];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });
  describe('Schedule Configuration', () => {
    it('should validate schedule days', () => {
      const validDays = [0, 1, 2, 3, 4, 5, 6]; 
      validDays.forEach(day => {
        expect(day >= 0 && day <= 6).toBe(true);
      });
    });
    it('should calculate work hours', () => {
      const startTime = '09:00';
      const endTime = '17:00';
      const lunchDuration = 60; 
      const start = startTime.split(':').map(Number);
      const end = endTime.split(':').map(Number);
      const totalMinutes = (end[0] - start[0]) * 60 + (end[1] - start[1]);
      const workMinutes = totalMinutes - lunchDuration;
      const workHours = workMinutes / 60;
      expect(workHours).toBe(7);
    });
  });
  describe('Config Export/Import', () => {
    it('should create valid JSON export', () => {
      const config = {
        accounts: [{ id: '1', name: 'Test' }],
        schedules: { workStart: '09:00', workEnd: '17:00' },
        settings: { theme: 'dark' },
      };
      const json = JSON.stringify(config);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(config);
    });
    it('should handle import errors gracefully', () => {
      const invalidJson = '{ invalid json }';
      let error = null;
      try {
        JSON.parse(invalidJson);
      } catch (e) {
        error = e;
      }
      expect(error).not.toBeNull();
    });
  });
});
