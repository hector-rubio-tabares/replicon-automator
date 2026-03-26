import { ipcMain } from 'electron';
import type Store from 'electron-store';

export interface ConfigHandlerDeps {
  store: Store<Record<string, unknown>>;
}

/**
 * Configura los handlers IPC para gestión de configuración
 * @param deps - Dependencias inyectadas
 */
export function setupConfigHandlers(deps: ConfigHandlerDeps): void {
  const { store } = deps;

  /**
   * Handler: config:get
   * Obtiene un valor de configuración por clave
   * Aplica lógica especial para 'config' si loginUrl está vacío (usa variable de entorno)
   */
  ipcMain.handle('config:get', async (_, key: string) => {
    const value = store.get(key);

    // Si es la config de la app y no tiene loginUrl, usar el de env
    if (key === 'config' && value && typeof value === 'object') {
      const appConfig = value as { loginUrl?: string; timeout?: number; headless?: boolean; autoSave?: boolean };
      if (!appConfig.loginUrl || appConfig.loginUrl.trim() === '') {
        return {
          ...appConfig,
          loginUrl: process.env.REPLICON_LOGIN_URL || '',
        };
      }
    }

    return value;
  });

  /**
   * Handler: config:set
   * Establece un valor de configuración por clave
   */
  ipcMain.handle('config:set', async (_, key: string, value: unknown) => {
    store.set(key, value);
    return true;
  });
}
