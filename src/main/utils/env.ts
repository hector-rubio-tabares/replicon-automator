import { createLogger } from './logger.js';
const logger = createLogger('Env');
interface EnvConfig {
  loginUrl: string;
  timeout: number;
  headless: boolean;
  autoSave: boolean;
  isDev: boolean;
}
function parseBooleanEnv(value: string | undefined): boolean {
  if (value === undefined || value === '') return false;
  const normalized = value.toLowerCase().trim();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}
function parseNumberEnv(value: string | undefined): number {
  if (value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
export function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    loginUrl: process.env.REPLICON_LOGIN_URL || '',
    timeout: parseNumberEnv(process.env.REPLICON_TIMEOUT),
    headless: parseBooleanEnv(process.env.REPLICON_HEADLESS),
    autoSave: parseBooleanEnv(process.env.REPLICON_AUTOSAVE),
    isDev: process.env.NODE_ENV === 'development',
  };
  if (config.timeout < 1000) {
    logger.warn('REPLICON_TIMEOUT muy bajo, usando mínimo de 1000ms');
    config.timeout = 1000;
  }
  if (config.timeout > 300000) {
    logger.warn('REPLICON_TIMEOUT muy alto, usando máximo de 300000ms (5 min)');
    config.timeout = 300000;
  }
  if (!config.loginUrl) {
    logger.error('REPLICON_LOGIN_URL no está configurada en .env');
  }
  try {
    new URL(config.loginUrl);
  } catch {
    logger.error('REPLICON_LOGIN_URL inválida');
  }
  logger.info('Configuración de entorno cargada', {
    loginUrl: config.loginUrl,
    timeout: config.timeout,
    headless: config.headless,
    autoSave: config.autoSave,
    isDev: config.isDev,
  });
  return config;
}
export type { EnvConfig };
