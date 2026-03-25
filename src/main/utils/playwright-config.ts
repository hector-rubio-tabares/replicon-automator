/**
 * Configuración de Playwright para producción
 * Con asarUnpack, Playwright encuentra automáticamente sus binarios
 * 
 * NOTA: Este módulo es worker-safe. No intentes importar 'electron' directamente
 * porque los worker threads no tienen acceso a él.
 */
import { isMainThread } from 'worker_threads';
import { createLogger } from './logger.js';

const logger = createLogger('PlaywrightConfig');

/**
 * Obtiene la ruta del ejecutable de Chromium
 * Con asarUnpack de node_modules/playwright, Playwright maneja las rutas automáticamente
 * 
 * En worker threads, siempre retorna undefined (modo desarrollo)
 */
export function getChromiumExecutablePath(): string | undefined {
    // En worker threads, asumir modo desarrollo
    if (!isMainThread) {
        return undefined;
    }

    // NODE_ENV siempre está disponible
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        logger.info('Modo desarrollo: usando Chromium de node_modules');
        return undefined; // Playwright usará la ruta por defecto
    }

    // En producción con asarUnpack, Playwright puede encontrar los binarios automáticamente
    // porque node_modules/playwright está desempaquetado en app.asar.unpacked
    logger.info('Modo producción: usando Chromium de node_modules desempaquetado (asarUnpack)');
    return undefined; // Playwright encontrará los binarios en app.asar.unpacked/node_modules/playwright
}

/**
 * Opciones de configuración para chromium.launch
 */
export interface ChromiumLaunchOptions {
    headless?: boolean;
    slowMo?: number;
    args?: string[];
    timeout?: number;
}

/**
 * Obtiene las opciones completas para chromium.launch
 * Con asarUnpack, no necesitamos especificar executablePath
 */
export function getChromiumLaunchOptions(
    options: ChromiumLaunchOptions = {}
): ChromiumLaunchOptions {
    return {
        headless: options.headless ?? true,
        slowMo: options.slowMo ?? 50,
        args: options.args ?? [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    };
}
