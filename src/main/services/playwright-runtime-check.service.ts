import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { createLogger } from '../utils/index.js';

const logger = createLogger('PlaywrightRuntimeCheck');

/**
 * Servicio para verificar y asegurar que Playwright está disponible en tiempo de ejecución
 * Útil después de actualizaciones donde los binarios pueden no estar presentes
 * 
 * @singleton - Mantiene estado de verificación y paths en memoria
 */
class PlaywrightRuntimeCheckService {
    constructor() { }

    /**
     * Verifica si Playwright está disponible en el sistema
     * Devuelve rutas donde buscar los binarios según el contexto (dev/prod)
     */
    private getPlaywrightPaths(): string[] {
        const isDev = !app.isPackaged;
        const paths: string[] = [];

        if (isDev) {
            // En desarrollo, buscar en node_modules
            paths.push(path.join(process.cwd(), 'node_modules', 'playwright'));
        } else {
            // En producción, buscar en recursos de la app
            const resourcesPath = process.resourcesPath;
            paths.push(path.join(resourcesPath, 'playwright'));
            paths.push(path.join(resourcesPath, 'app', 'node_modules', 'playwright'));

            // También buscar en el directorio de la aplicación (para después de actualizar)
            const appPath = path.dirname(app.getAppPath());
            paths.push(path.join(appPath, 'node_modules', 'playwright'));
        }

        return paths;
    }

    /**
     * Verifica si existe un ejecutable de Chromium en las rutas conocidas
     */
    async checkPlaywrightAvailable(): Promise<boolean> {
        const paths = this.getPlaywrightPaths();

        for (const playwrightPath of paths) {
            if (!fs.existsSync(playwrightPath)) {
                continue;
            }

            // Buscar cualquier carpeta chromium-*
            try {
                const contents = fs.readdirSync(playwrightPath);
                const hasChromium = contents.some((dir) => dir.startsWith('chromium-'));

                if (hasChromium) {
                    logger.info(`✅ Playwright found at: ${playwrightPath}`);
                    return true;
                }
            } catch (error) {
                logger.error(`Error reading playwright directory: ${error}`);
            }
        }

        return false;
    }

    /**
     * Verifica que Playwright esté disponible y registra advertencias si falta
     */
    async initialize(): Promise<void> {
        logger.info('Initializing Playwright runtime check...');

        try {
            const isAvailable = await this.checkPlaywrightAvailable();
            const isDev = !app.isPackaged;

            if (!isAvailable) {
                // En desarrollo, solo log info ya que playwright puede estar en cache local
                if (isDev) {
                    logger.info(
                        'Playwright binaries not found in node_modules. ' +
                        'This is normal if using local cache. ' +
                        'If automation fails, run: npx playwright install chromium'
                    );
                } else {
                    // En producción, es un error crítico
                    logger.error(
                        '⚠️  WARNING: Playwright binaries not found. ' +
                        'The application may fail to automate Replicon. ' +
                        'Please reinstall the application.'
                    );
                }
            } else {
                logger.info('✅ Playwright runtime check passed');
            }
        } catch (error) {
            logger.error('Error during Playwright runtime check:', error);
        }
    }

    /**
     * Obtiene la ruta al ejecutable de Chromium si está disponible
     */
    getChromiumPath(): string | null {
        const paths = this.getPlaywrightPaths();

        for (const playwrightPath of paths) {
            if (!fs.existsSync(playwrightPath)) {
                continue;
            }

            try {
                const contents = fs.readdirSync(playwrightPath);
                const chromiumFolder = contents.find((dir) => dir.startsWith('chromium-'));

                if (chromiumFolder) {
                    return path.join(playwrightPath, chromiumFolder);
                }
            } catch (error) {
                logger.error(`Error finding chromium path: ${error}`);
            }
        }

        return null;
    }
}

// Export singleton instance - Patrón B estándar
export const playwrightRuntimeCheckService = new PlaywrightRuntimeCheckService();
