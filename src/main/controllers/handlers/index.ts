/**
 * Handlers IPC organizados por dominio
 * 
 * Este módulo exporta todos los handlers IPC especializados.
 * Cada handler maneja un dominio específico de la aplicación,
 * siguiendo el principio de responsabilidad única (SRP).
 */

export { setupCSVHandlers, type CSVHandlerDeps } from './csv.ipc-handler.js';
export { setupCredentialsHandlers, type CredentialsHandlerDeps } from './credentials.ipc-handler.js';
export { setupConfigHandlers, type ConfigHandlerDeps } from './config.ipc-handler.js';
export { setupLoggingHandlers } from './logging.ipc-handler.js';
export { setupAutomationHandlers, type AutomationHandlerDeps } from './automation.ipc-handler.js';
export { setupUpdatesHandlers, type UpdatesHandlerDeps } from './updates.ipc-handler.js';
