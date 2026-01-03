/**
 * Logger unificado para el Renderer Process
 * - En desarrollo: muestra logs en consola Y envía al main process
 * - En producción: solo envía al main process (sin console.log)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Detectar si estamos en desarrollo
const isDev = import.meta.env.DEV;

/**
 * Envía log al main process via IPC
 */
function sendToMain(level: string, source: string, message: string): void {
  try {
    window.electronAPI?.sendLogToMain?.(level.toUpperCase(), source, message);
  } catch {
    // Si falla el IPC, no hacemos nada (evitamos recursión)
  }
}

/**
 * Formatea el mensaje con contexto
 */
function formatMessage(source: string, message: string, data?: unknown): string {
  const dataStr = data !== undefined 
    ? ` | ${typeof data === 'object' ? JSON.stringify(data) : String(data)}`
    : '';
  return `[${source}] ${message}${dataStr}`;
}

/**
 * Logger principal del renderer
 */
class RendererLogger {
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const formatted = formatMessage(this.source, message, data);
    
    // Siempre enviar al main process
    sendToMain(level, this.source, message + (data ? ` | ${JSON.stringify(data)}` : ''));

    // Solo mostrar en consola en desarrollo
    if (isDev) {
      switch (level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.info(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          break;
      }
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

/**
 * Crea un logger con contexto específico
 * @param source - Nombre del módulo/componente
 */
export function createLogger(source: string): RendererLogger {
  return new RendererLogger(source);
}

/**
 * Logger global para uso rápido
 */
export const logger = createLogger('App');

/**
 * Helper para logging en catch blocks vacíos (solo en dev)
 * Uso: catch (e) { logCatch('MyModule', 'operación falló', e); }
 */
export function logCatch(source: string, context: string, error?: unknown): void {
  if (isDev) {
    const errorMsg = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    console.debug(`[${source}] ${context}: ${errorMsg}`);
  }
  // Siempre enviar errores al main en producción también
  if (error) {
    sendToMain('warn', source, `${context}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
