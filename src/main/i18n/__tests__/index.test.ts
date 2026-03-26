import { describe, it, expect, vi } from 'vitest';
import { t, getSection, getCurrentLanguage } from '../index.js';

vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn().mockReturnValue({ language: 'es' }),
      set: vi.fn(),
    })),
  };
});

describe('i18n', () => {
  describe('getCurrentLanguage', () => {
    it('should return default language (es)', () => {
      const language = getCurrentLanguage();
      expect(language).toBe('es');
    });
  });

  describe('t (translation function)', () => {
    describe('Spanish translations', () => {
      it('should translate common.cancel', () => {
        expect(t('common.cancel')).toBe('Cancelar');
      });

      it('should translate updates.available', () => {
        expect(t('updates.available')).toBe('🔄 Actualización Disponible');
      });

      it('should translate updates.availableDesc', () => {
        expect(t('updates.availableDesc')).toBe('Nueva versión {{version}} disponible. Click para descargar.');
      });

      it('should translate updates.ready', () => {
        expect(t('updates.ready')).toBe('✅ Actualización Lista');
      });

      it('should translate automation.started', () => {
        expect(t('automation.started')).toBe('🚀 Automatización Iniciada');
      });

      it('should translate automation.completed', () => {
        expect(t('automation.completed')).toBe('✅ Automatización Completada');
      });

      it('should translate errors.generic', () => {
        expect(t('errors.generic')).toBe('Ocurrió un error');
      });

      it('should translate errors.network', () => {
        expect(t('errors.network')).toBe('Error de red');
      });

      it('should translate errors.timeout', () => {
        expect(t('errors.timeout')).toBe('La operación expiró');
      });

      it('should translate errors.loginUrlMissing', () => {
        expect(t('errors.loginUrlMissing')).toBe('La URL de login no está configurada. Por favor configúrala en la pestaña de Configuración.');
      });
    });

    describe('Interpolation', () => {
      it('should interpolate single variable', () => {
        const result = t('updates.availableDesc', { version: '1.2.3' });
        expect(result).toBe('Nueva versión 1.2.3 disponible. Click para descargar.');
      });

      it('should interpolate multiple variables', () => {
        const result = t('updates.availableDetail', { version: '1.2.3', currentVersion: '1.0.0' });
        expect(result).toContain('Versión actual: 1.0.0');
      });

      it('should interpolate count variable in automation messages', () => {
        const result = t('automation.startedDesc', { count: 42 });
        expect(result).toBe('Procesando 42 filas');
      });

      it('should interpolate numeric values', () => {
        const result = t('automation.completedDesc', { count: 100 });
        expect(result).toBe('Se procesaron 100 filas exitosamente');
      });

      it('should handle missing interpolation vars gracefully', () => {
        const result = t('updates.availableDesc');
        expect(result).toBe('Nueva versión {{version}} disponible. Click para descargar.');
      });

      it('should handle empty vars object', () => {
        const result = t('common.cancel', {});
        expect(result).toBe('Cancelar');
      });

      it('should replace all occurrences of variable', () => {
        const result = t('updates.installDetail', { version: '2.0.0' });
        expect(result).toContain('La actualización se instalará');
      });
    });

    describe('Fallback behavior', () => {
      it('should return key path for non-existent translation', () => {
        const result = t('non.existent.key');
        expect(result).toBe('non.existent.key');
      });

      it('should return key path for partially invalid path', () => {
        const result = t('updates.nonExistentField');
        expect(result).toBe('updates.nonExistentField');
      });

      it('should return key path for empty string', () => {
        const result = t('');
        expect(result).toBe('');
      });
    });

    describe('All update translations', () => {
      it('should translate updates.downloading', () => {
        expect(t('updates.downloading')).toBe('⬇️ Descargando');
      });

      it('should translate updates.downloadingDesc', () => {
        expect(t('updates.downloadingDesc')).toBe('Descargando actualización en segundo plano...');
      });

      it('should translate updates.downloadError', () => {
        expect(t('updates.downloadError')).toBe('❌ Error de Descarga');
      });

      it('should translate updates.downloadErrorDesc', () => {
        expect(t('updates.downloadErrorDesc')).toBe('No se pudo descargar la actualización.');
      });

      it('should translate updates.installTitle', () => {
        expect(t('updates.installTitle')).toBe('Actualización Lista');
      });

      it('should translate updates.installMessage', () => {
        expect(t('updates.installMessage')).toBe('Versión {{version}} descargada');
      });

      it('should translate updates.installDetail', () => {
        expect(t('updates.installDetail')).toContain('La actualización se instalará al reiniciar');
      });

      it('should translate updates.restartNow', () => {
        expect(t('updates.restartNow')).toBe('Reiniciar Ahora');
      });

      it('should translate updates.later', () => {
        expect(t('updates.later')).toBe('Más tarde');
      });

      it('should translate updates.availableTitle', () => {
        expect(t('updates.availableTitle')).toBe('Actualización Disponible');
      });

      it('should translate updates.availableMessage', () => {
        expect(t('updates.availableMessage')).toBe('Nueva versión {{version}} disponible');
      });

      it('should translate updates.download', () => {
        expect(t('updates.download')).toBe('Descargar');
      });

      it('should translate updates.checkError', () => {
        expect(t('updates.checkError')).toBe('❌ Error');
      });

      it('should translate updates.checkErrorDesc', () => {
        expect(t('updates.checkErrorDesc')).toBe('No se pudo verificar actualizaciones. Verifica tu conexión.');
      });

      it('should translate updates.installBeforeQuit', () => {
        expect(t('updates.installBeforeQuit')).toBe('Actualización Pendiente');
      });

      it('should translate updates.installBeforeQuitMessage', () => {
        expect(t('updates.installBeforeQuitMessage')).toBe('La versión {{version}} está lista para instalar');
      });

      it('should translate updates.installBeforeQuitDetail', () => {
        expect(t('updates.installBeforeQuitDetail')).toBe('¿Deseas instalar la actualización antes de cerrar?');
      });

      it('should translate updates.installAndQuit', () => {
        expect(t('updates.installAndQuit')).toBe('Instalar y Cerrar');
      });

      it('should translate updates.quitWithoutUpdate', () => {
        expect(t('updates.quitWithoutUpdate')).toBe('Cerrar Sin Actualizar');
      });
    });

    describe('All automation translations', () => {
      it('should translate automation.error', () => {
        expect(t('automation.error')).toBe('❌ Error de Automatización');
      });

      it('should translate automation.errorDesc', () => {
        expect(t('automation.errorDesc')).toBe('Ocurrió un error durante la automatización');
      });

      it('should translate automation.paused', () => {
        expect(t('automation.paused')).toBe('⏸️ Automatización Pausada');
      });

      it('should translate automation.pausedDesc', () => {
        expect(t('automation.pausedDesc')).toBe('La automatización ha sido pausada');
      });

      it('should translate automation.resumed', () => {
        expect(t('automation.resumed')).toBe('▶️ Automatización Reanudada');
      });

      it('should translate automation.resumedDesc', () => {
        expect(t('automation.resumedDesc')).toBe('La automatización ha sido reanudada');
      });
    });
  });

  describe('getSection', () => {
    it('should get common section', () => {
      const section = getSection('common');
      expect(section).toHaveProperty('cancel');
      expect(section.cancel).toBe('Cancelar');
    });

    it('should get updates section', () => {
      const section = getSection('updates');
      expect(section).toHaveProperty('available');
      expect(section).toHaveProperty('ready');
      expect(section).toHaveProperty('downloading');
      expect(section.available).toBe('🔄 Actualización Disponible');
    });

    it('should get automation section', () => {
      const section = getSection('automation');
      expect(section).toHaveProperty('started');
      expect(section).toHaveProperty('completed');
      expect(section).toHaveProperty('error');
      expect(section.started).toBe('🚀 Automatización Iniciada');
    });

    it('should get errors section', () => {
      const section = getSection('errors');
      expect(section).toHaveProperty('generic');
      expect(section).toHaveProperty('network');
      expect(section).toHaveProperty('timeout');
      expect(section.generic).toBe('Ocurrió un error');
    });
  });
});
