import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { env } from './utils/env.js';
import { searchRoutes } from './routes/search.js';
import { healthRoutes } from './routes/health.js';

export async function buildServer() {
  const server = Fastify({
    logger: env.isDev
      ? {
          level: 'info',
          transport: { target: 'pino-pretty', options: { colorize: true } },
        }
      : { level: 'warn' },
  });

  // ── Security & middleware ────────────────────────────────────────────────
  await server.register(fastifyHelmet, {
    contentSecurityPolicy: false, // handled by Next.js
  });

  await server.register(fastifyCors, {
    origin: env.isDev
      ? '*'
      : true, // Allow all origins in production (public API)
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  await server.register(fastifyRateLimit, {
    max: 30,           // 30 searches per minute per IP
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a minute before searching again.',
      statusCode: 429,
    }),
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  await server.register(healthRoutes);
  await server.register(searchRoutes);

  return server;
}
