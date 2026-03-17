import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  // Server
  PORT: parseInt(optionalEnv('API_PORT', '4000'), 10),
  HOST: optionalEnv('API_HOST', '0.0.0.0'),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),

  // Database
  NEON_DATABASE_URL: requireEnv('NEON_DATABASE_URL'),

  // OpenRouter (LLM-powered resort search)
  OPENROUTER_API_KEY: requireEnv('OPENROUTER_API_KEY'),
  OPENROUTER_MODEL: optionalEnv('OPENROUTER_MODEL', 'openai/gpt-4o-mini'),

  get isDev() {
    return this.NODE_ENV === 'development';
  },
  get isProd() {
    return this.NODE_ENV === 'production';
  },
} as const;
