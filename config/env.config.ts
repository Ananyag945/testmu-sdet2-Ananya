import 'dotenv/config';
import { z } from 'zod';

/**
 * Normalizes input environment variables.
 * If a variable is missing, empty, or whitespace, falls back to the provided default.
 */
const getEnvVal = (key: string, defaultValue: string): string => {
  const val = process.env[key];
  return (val && val.trim() !== '') ? val : defaultValue;
};

// Define the environment schema with Zod to enforce type-safety
const envSchema = z.object({
  BASE_URL: z.string().url({ message: 'BASE_URL must be a valid absolute URL' }),
  API_BASE_URL: z.string().url({ message: 'API_BASE_URL must be a valid absolute URL' }),
  TEST_USER_EMAIL: z.string().email({ message: 'TEST_USER_EMAIL must be a valid email address' }),
  TEST_USER_PASSWORD: z.string().min(1, { message: 'TEST_USER_PASSWORD cannot be empty' }),
  CI: z.coerce.boolean().default(false),
});

// Run verification at load time with fallback normalization
const parseResult = envSchema.safeParse({
  BASE_URL: getEnvVal('BASE_URL', 'https://app.example.com'),
  API_BASE_URL: getEnvVal('API_BASE_URL', 'https://api.example.com'),
  TEST_USER_EMAIL: getEnvVal('TEST_USER_EMAIL', 'admin@example.com'),
  TEST_USER_PASSWORD: getEnvVal('TEST_USER_PASSWORD', 'securepassword'),
  CI: getEnvVal('CI', 'false'),
});

if (!parseResult.success) {
  const formattedErrors = parseResult.error.format();
  const missingVars = Object.entries(formattedErrors)
    .filter(([key]) => key !== '_errors')
    .map(([key, value]) => `  - ${key}: ${(value as { _errors: string[] })._errors.join(', ')}`)
    .join('\n');

  throw new Error(
    `\n❌ [Configuration Error] Missing or invalid environment variables:\n${missingVars}\n` +
    `👉 Please check your local .env file against .env.example.\n`
  );
}

// Extract validated properties
const parsedEnv = parseResult.data;

export const envConfig = {
  baseUrl: parsedEnv.BASE_URL,
  apiBaseUrl: parsedEnv.API_BASE_URL,
  credentials: {
    email: parsedEnv.TEST_USER_EMAIL,
    password: parsedEnv.TEST_USER_PASSWORD,
  },
  isCI: parsedEnv.CI,
} as const;

export type EnvConfig = typeof envConfig;
