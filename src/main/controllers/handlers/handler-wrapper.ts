import { createLogger } from '../../utils/logger.js';

const logger = createLogger('IPCHandler');

/**
 * Serializes error to string preserving error name and message
 * Handles Error objects, ZodError, and unknown types
 */
function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return String(error);
}

/**
 * Options for createSafeHandler
 */
export interface SafeHandlerOptions {
  /** Logger context for errors (e.g., 'AutomationHandler', 'CredentialsHandler') */
  loggerContext?: string;
  /** Custom error transformer */
  transformError?: (error: unknown) => string;
  /** Whether to log errors (default: true) */
  logErrors?: boolean;
}

/**
 * Generic IPC handler wrapper with centralized error handling
 * Eliminates duplicated try-catch boilerplate across 11+ handlers
 * 
 * Benefits:
 * - Consistent error handling across all IPC channels
 * - Centralized logging of handler errors
 * - Proper error serialization (preserves Error.name and message)
 * - DRY principle - single source of truth for error handling
 * 
 * @example
 * ipcMain.handle('automation:validate', 
 *   createSafeHandler(
 *     async (_, data) => automationEnhanced.validateAutomationData(...),
 *     { loggerContext: 'AutomationHandler' }
 *   )
 * );
 * 
 * @param handlerFn - IPC handler function that may throw
 * @param options - Configuration options
 * @returns Wrapped handler that returns { success, result/error }
 */
export function createSafeHandler<TArgs extends unknown[], TResult>(
  handlerFn: (...args: TArgs) => Promise<TResult>,
  options: SafeHandlerOptions = {}
): (...args: TArgs) => Promise<{ success: true; result: TResult } | { success: false; error: string }> {
  const { loggerContext, transformError, logErrors = true } = options;

  return async (...args: TArgs) => {
    try {
      const result = await handlerFn(...args);
      return { success: true, result };
    } catch (error) {
      // Transform error message
      const errorMessage = transformError 
        ? transformError(error)
        : serializeError(error);
      
      // Log error if enabled
      if (logErrors && loggerContext) {
        logger.error(`[${loggerContext}] Handler error`, { error: errorMessage, originalError: error });
      }
      
      return { success: false, error: errorMessage };
    }
  };
}

/**
 * Sync version of createSafeHandler for non-async handlers
 * Use when handler doesn't return a Promise
 * 
 * @example
 * ipcMain.handle('config:getSync', 
 *   createSafeSyncHandler(
 *     () => configService.getConfig(),
 *     { loggerContext: 'ConfigHandler' }
 *   )
 * );
 */
export function createSafeSyncHandler<TArgs extends unknown[], TResult>(
  handlerFn: (...args: TArgs) => TResult,
  options: SafeHandlerOptions = {}
): (...args: TArgs) => Promise<{ success: true; result: TResult } | { success: false; error: string }> {
  return createSafeHandler(
    async (...args: TArgs) => handlerFn(...args),
    options
  );
}
