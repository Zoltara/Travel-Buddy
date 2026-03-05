import { buildServer } from './server.js';
import { env } from './utils/env.js';

const server = await buildServer();

try {
  await server.listen({ port: env.PORT, host: env.HOST });
  console.log(`🌍 Travel Buddy API running on http://${env.HOST}:${env.PORT}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
