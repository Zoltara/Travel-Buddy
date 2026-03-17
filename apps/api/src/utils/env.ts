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

  // Google Maps (Places API for real resort search)
  GOOGLE_MAPS_API_KEY: requireEnv('GOOGLE_MAPS_API_KEY'),

  get isDev() {
    return this.NODE_ENV === 'development';
  },
  get isProd() {
    return this.NODE_ENV === 'production';
  },
} as const;
