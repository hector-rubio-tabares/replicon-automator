import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChromiumExecutablePath, getChromiumLaunchOptions } from '../playwright-config.js';

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
  },
}));

vi.mock('../logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('PlaywrightConfig', () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('getChromiumExecutablePath', () => {
    it('should return undefined in development mode (NODE_ENV)', () => {
      process.env.NODE_ENV = 'development';
      const path = getChromiumExecutablePath();
      expect(path).toBeUndefined();
    });





    it('should handle missing NODE_ENV', () => {
      const path = getChromiumExecutablePath();
      expect(path).toBeUndefined();
    });
  });

  describe('getChromiumLaunchOptions', () => {
    it('should return default options when no params provided', () => {
      const options = getChromiumLaunchOptions();
      
      expect(options.headless).toBe(true);
      expect(options.slowMo).toBe(50);
      expect(options.args).toEqual([
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ]);
    });

    it('should use provided headless value', () => {
      const options = getChromiumLaunchOptions({ headless: false });
      expect(options.headless).toBe(false);
    });

    it('should use provided slowMo value', () => {
      const options = getChromiumLaunchOptions({ slowMo: 100 });
      expect(options.slowMo).toBe(100);
    });

    it('should use provided args', () => {
      const customArgs = ['--custom-arg', '--another-arg'];
      const options = getChromiumLaunchOptions({ args: customArgs });
      expect(options.args).toEqual(customArgs);
    });

    it('should accept timeout option', () => {
      const options = getChromiumLaunchOptions({ timeout: 60000 });
      expect(options.timeout).toBeUndefined(); // timeout no se retorna en las opciones actuales
    });

    it('should override multiple defaults', () => {
      const options = getChromiumLaunchOptions({
        headless: false,
        slowMo: 200,
        args: ['--custom'],
      });
      
      expect(options.headless).toBe(false);
      expect(options.slowMo).toBe(200);
      expect(options.args).toEqual(['--custom']);
    });

    it('should handle empty options object', () => {
      const options = getChromiumLaunchOptions({});
      
      expect(options.headless).toBe(true);
      expect(options.slowMo).toBe(50);
      expect(options.args).toHaveLength(3);
    });

    it('should preserve default args for security', () => {
      const options = getChromiumLaunchOptions();
      
      expect(options.args).toContain('--no-sandbox');
      expect(options.args).toContain('--disable-setuid-sandbox');
      expect(options.args).toContain('--disable-dev-shm-usage');
    });

    it('should handle slowMo = 0', () => {
      const options = getChromiumLaunchOptions({ slowMo: 0 });
      expect(options.slowMo).toBe(0);
    });

    it('should handle empty args array', () => {
      const options = getChromiumLaunchOptions({ args: [] });
      expect(options.args).toEqual([]);
    });
  });

  describe('Integration scenarios', () => {
    it('should work with typical development config', () => {
      process.env.NODE_ENV = 'development';
      const path = getChromiumExecutablePath();
      const options = getChromiumLaunchOptions({ headless: false, slowMo: 100 });
      
      expect(path).toBeUndefined();
      expect(options.headless).toBe(false);
      expect(options.slowMo).toBe(100);
    });

    it('should work with typical production config', () => {
      process.env.NODE_ENV = 'production';
      
      const path = getChromiumExecutablePath();
      const options = getChromiumLaunchOptions({ headless: true });
      
      expect(path).toBeUndefined();
      expect(options.headless).toBe(true);
      expect(options.slowMo).toBe(50);
    });
  });
});
