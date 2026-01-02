/**
 * Simple i18n system for main process
 * Traducciones para notificaciones y mensajes del sistema
 */

import Store from 'electron-store';

const store = new Store();

export type Language = 'en' | 'es';

const translations = {
  en: {
    updates: {
      available: '🔄 Update Available',
      availableDesc: 'New version {{version}} available. Click to download.',
      ready: '✅ Update Ready',
      readyDesc: 'Version {{version}} downloaded. Click to install.',
      downloading: '⬇️ Downloading',
      downloadingDesc: 'Downloading update in background...',
      downloadError: '❌ Download Error',
      downloadErrorDesc: 'Could not download the update.',
      installTitle: 'Update Ready',
      installMessage: 'Version {{version}} downloaded',
      installDetail: 'The update will be installed when the application restarts.\n\nDo you want to restart now?',
      restartNow: 'Restart Now',
      later: 'Later',
      availableTitle: 'Update Available',
      availableMessage: 'New version {{version}} available',
      availableDetail: 'Current version: {{currentVersion}}\n\nDo you want to download the update now?',
      download: 'Download',
      checkError: '❌ Error',
      checkErrorDesc: 'Could not check for updates. Verify your connection.',
    },
    automation: {
      started: '🚀 Automation Started',
      startedDesc: 'Processing {{count}} rows',
      completed: '✅ Automation Completed',
      completedDesc: 'Successfully processed {{count}} rows',
      error: '❌ Automation Error',
      errorDesc: 'An error occurred during automation',
      paused: '⏸️ Automation Paused',
      pausedDesc: 'Automation has been paused',
      resumed: '▶️ Automation Resumed',
      resumedDesc: 'Automation has been resumed',
    },
    errors: {
      generic: 'An error occurred',
      network: 'Network error',
      timeout: 'Operation timed out',
    },
  },
  es: {
    updates: {
      available: '🔄 Actualización Disponible',
      availableDesc: 'Nueva versión {{version}} disponible. Click para descargar.',
      ready: '✅ Actualización Lista',
      readyDesc: 'Versión {{version}} descargada. Click para instalar.',
      downloading: '⬇️ Descargando',
      downloadingDesc: 'Descargando actualización en segundo plano...',
      downloadError: '❌ Error de Descarga',
      downloadErrorDesc: 'No se pudo descargar la actualización.',
      installTitle: 'Actualización Lista',
      installMessage: 'Versión {{version}} descargada',
      installDetail: 'La actualización se instalará al reiniciar la aplicación.\n\n¿Deseas reiniciar ahora?',
      restartNow: 'Reiniciar Ahora',
      later: 'Más tarde',
      availableTitle: 'Actualización Disponible',
      availableMessage: 'Nueva versión {{version}} disponible',
      availableDetail: 'Versión actual: {{currentVersion}}\n\n¿Deseas descargar la actualización ahora?',
      download: 'Descargar',
      checkError: '❌ Error',
      checkErrorDesc: 'No se pudo verificar actualizaciones. Verifica tu conexión.',
    },
    automation: {
      started: '🚀 Automatización Iniciada',
      startedDesc: 'Procesando {{count}} filas',
      completed: '✅ Automatización Completada',
      completedDesc: 'Se procesaron {{count}} filas exitosamente',
      error: '❌ Error de Automatización',
      errorDesc: 'Ocurrió un error durante la automatización',
      paused: '⏸️ Automatización Pausada',
      pausedDesc: 'La automatización ha sido pausada',
      resumed: '▶️ Automatización Reanudada',
      resumedDesc: 'La automatización ha sido reanudada',
    },
    errors: {
      generic: 'Ocurrió un error',
      network: 'Error de red',
      timeout: 'La operación expiró',
    },
  },
} as const;

type TranslationKeys = typeof translations.en;

/**
 * Get current language from store
 */
function getCurrentLanguage(): Language {
  const config = store.get('config') as { language?: string } | undefined;
  return (config?.language as Language) || 'es';
}

/**
 * Interpolate variables in a string
 * Example: "Hello {{name}}" with { name: "World" } => "Hello World"
 */
function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  
  return Object.entries(vars).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }, text);
}

/**
 * Get a translation by key path
 * Example: t('updates.available') or t('updates.availableDesc', { version: '1.0.0' })
 */
export function t(keyPath: string, vars?: Record<string, string | number>): string {
  const lang = getCurrentLanguage();
  const keys = keyPath.split('.');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[lang];
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Fallback to English
      value = translations.en;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return keyPath; // Return key if not found
        }
      }
      break;
    }
  }
  
  if (typeof value === 'string') {
    return interpolate(value, vars);
  }
  
  return keyPath;
}

/**
 * Get all translations for a specific section
 */
export function getSection(section: string): Record<string, string> {
  const lang = getCurrentLanguage();
  const sectionData = translations[lang][section as keyof typeof translations.en];
  return sectionData as unknown as Record<string, string>;
}

export { getCurrentLanguage };
