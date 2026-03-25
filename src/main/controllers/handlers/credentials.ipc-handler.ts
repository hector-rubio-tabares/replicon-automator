import { ipcMain } from 'electron';
import type { CredentialsService } from '../../services/credentials.service.js';
import type { Credentials } from '../../../common/types.js';

export interface CredentialsHandlerDeps {
  credentialsService: CredentialsService;
}

/**
 * Configura los handlers IPC para gestión de credenciales
 * @param deps - Dependencias inyectadas
 */
export function setupCredentialsHandlers(deps: CredentialsHandlerDeps): void {
  const { credentialsService } = deps;

  /**
   * Handler: credentials:save
   * Guarda credenciales de forma segura (keytar o fallback)
   */
  ipcMain.handle('credentials:save', async (_, credentials: Credentials) => {
    return credentialsService.saveCredentials(credentials);
  });

  /**
   * Handler: credentials:load
   * Carga credenciales almacenadas
   */
  ipcMain.handle('credentials:load', async () => {
    return credentialsService.loadCredentials();
  });

  /**
   * Handler: credentials:clear
   * Elimina credenciales almacenadas
   */
  ipcMain.handle('credentials:clear', async () => {
    return credentialsService.clearCredentials();
  });

  /**
   * Handler: automation:isEncryptionAvailable
   * Verifica si el sistema de encriptación (keytar) está disponible
   */
  ipcMain.handle('automation:isEncryptionAvailable', async () => {
    return credentialsService.isEncryptionAvailable();
  });
}
