import type { BrowserWindow } from 'electron';
import type Store from 'electron-store';
import { AutomationWorkerService, CSVService } from '../services/index.js';
import { credentialsService } from '../services/credentials.service.js';
import { setupCSVHandlers } from './handlers/csv.ipc-handler.js';
import { setupCredentialsHandlers } from './handlers/credentials.ipc-handler.js';
import { setupConfigHandlers } from './handlers/config.ipc-handler.js';
import { setupLoggingHandlers } from './handlers/logging.ipc-handler.js';
import { setupAutomationHandlers } from './handlers/automation.ipc-handler.js';
import { setupUpdatesHandlers } from './handlers/updates.ipc-handler.js';

/**
 * Dependencias requeridas por el controlador IPC principal
 */
export interface IPCControllerDeps {
  store: Store<Record<string, unknown>>;
  getMainWindow: () => BrowserWindow | null;
  getAutomation: () => AutomationWorkerService | null;
  setAutomation: (automation: AutomationWorkerService | null) => void;
  appVersion: string;
}

/**
 * Configura todos los handlers IPC de la aplicación
 * 
 * Este es el orquestador principal que:
 * 1. Instancia los servicios necesarios (Dependency Injection inversa)
 * 2. Delega la configuración de handlers a módulos especializados
 * 3. Pasa las dependencias apropiadas a cada handler
 * 
 * Sigue los principios SOLID:
 * - SRP: Cada handler tiene una única responsabilidad
 * - DIP: Los handlers reciben dependencias inyectadas
 * - OCP: Extensible sin modificar código existente (agregar nuevo handler)
 * 
 * @param deps - Dependencias inyectadas desde main/index.ts
 */
export function setupIPCHandlers(deps: IPCControllerDeps): void {
  const { store, getMainWindow, getAutomation, setAutomation, appVersion } = deps;

  // Instanciar servicios stateless (factory pattern)
  const csvService = new CSVService();
  // credentialsService es singleton importado directamente

  // Configurar handlers por dominio, pasando solo las dependencias necesarias
  setupCSVHandlers({
    csvService,
    getMainWindow,
  });

  setupCredentialsHandlers({
    credentialsService,
  });

  setupConfigHandlers({
    store,
  });

  setupLoggingHandlers();

  setupAutomationHandlers({
    getMainWindow,
    getAutomation,
    setAutomation,
    AutomationServiceClass: AutomationWorkerService,
  });

  setupUpdatesHandlers({
    appVersion,
  });
}
