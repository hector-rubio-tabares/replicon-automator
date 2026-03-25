import { z } from 'zod';
export const CSVRowSchema = z.object({
  cuenta: z.string().min(1, 'Cuenta es requerida'),
  extras: z.string().optional().default(''),
});
export const CredentialsSchema = z.object({
  username: z.string().min(1, 'Usuario es requerido').email('Email inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
});
export const AutomationConfigSchema = z.object({
  headless: z.boolean().default(true),
  speed: z.enum(['slow', 'normal', 'fast']).default('normal'),
  retries: z.number().int().min(0).max(5).default(3),
  timeout: z.number().int().min(5000).max(120000).default(30000),
});
export const StartAutomationRequestSchema = z.object({
  rows: z.array(CSVRowSchema).min(1, 'Se requiere al menos una fila'),
  rowIndices: z.array(z.number().int().min(0)),
  credentials: CredentialsSchema,
  headless: z.boolean().default(true),
});
export type CSVRowInput = z.input<typeof CSVRowSchema>;
export type CSVRowOutput = z.output<typeof CSVRowSchema>;
export type CredentialsInput = z.input<typeof CredentialsSchema>;
export type AutomationConfigInput = z.input<typeof AutomationConfigSchema>;
export type StartAutomationRequestInput = z.input<typeof StartAutomationRequestSchema>;

/**
 * Generic validator factory - DRY principle
 * Centralizes safeParse → result.success pattern
 * @param schema - Zod schema to validate against
 * @param fallbackError - Default error message if validation fails
 * @returns Validator function with standardized return type
 */
function createValidator<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  fallbackError = 'Validación fallida'
): (data: unknown) => 
  | { success: true; data: z.output<TSchema> }
  | { success: false; error: string } 
{
  return (data: unknown) => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      error: result.error.issues[0]?.message || fallbackError,
    };
  };
}

/**
 * Extract first error message from Zod validation result
 * @internal
 */
function getFirstErrorMessage(error: z.ZodError, fallback = 'Validación fallida'): string {
  return error.issues[0]?.message || fallback;
}

export const validateCSVRow = createValidator(CSVRowSchema, 'Validación de CSV fallida');
export const validateCredentials = createValidator(CredentialsSchema, 'Credenciales inválidas');
export const validateStartAutomation = createValidator(StartAutomationRequestSchema, 'Validación de solicitud fallida');
export function validateCSVRows(rows: unknown[]): { valid: CSVRowOutput[]; errors: { index: number; error: string }[] } {
  const valid: CSVRowOutput[] = [];
  const errors: { index: number; error: string }[] = [];
  rows.forEach((row, index) => {
    const result = CSVRowSchema.safeParse(row);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({ index, error: getFirstErrorMessage(result.error) });
    }
  });
  return { valid, errors };
}

/**
 * Environment configuration schema
 * Validates all env vars with sensible defaults
 */
export const AppEnvConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  REPLICON_LOGIN_URL: z.string().url('Invalid Replicon URL').default('https://na4.replicon.com/company/login.aspx'),
  DEFAULT_TIMEOUT: z.coerce.number().int().min(5000).max(120000).default(30000),
  DEFAULT_HEADLESS: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PLAYWRIGHT_BROWSERS_PATH: z.string().optional(),
});

export type AppEnvConfigOutput = z.output<typeof AppEnvConfigSchema>;

/**
 * Validate environment configuration
 */
export const validateEnvConfig = createValidator(AppEnvConfigSchema, 'Environment validation failed');
