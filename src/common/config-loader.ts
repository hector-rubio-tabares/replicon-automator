import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AppEnvConfigSchema, type AppEnvConfigOutput } from './validation.js';

// ESM equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Centralized configuration loader with Zod validation
 * Uses top-level await (ESM) to fail fast on invalid config
 */

// Load .env files
const envPath = process.env.NODE_ENV === 'production'
  ? join(__dirname, '..', '..', '.env.production')
  : join(__dirname, '..', '..', '.env');

dotenvConfig({ path: envPath });

// Validate and export
const rawConfig = {
  NODE_ENV: process.env.NODE_ENV,
  REPLICON_LOGIN_URL: process.env.REPLICON_LOGIN_URL,
  DEFAULT_TIMEOUT: process.env.DEFAULT_TIMEOUT,
  DEFAULT_HEADLESS: process.env.DEFAULT_HEADLESS,
  LOG_LEVEL: process.env.LOG_LEVEL,
  PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH,
};

const parseResult = AppEnvConfigSchema.safeParse(rawConfig);

if (!parseResult.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parseResult.error.format());
  process.exit(1);
}

/**
 * Validated application configuration
 * Available as import throughout the application
 */
export const appConfig: AppEnvConfigOutput = parseResult.data;

// Re-export type for consumers
export type { AppEnvConfigOutput };
