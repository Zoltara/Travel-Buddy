import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Schema = typeof schema;

let _db: NeonHttpDatabase<Schema> | null = null;

export function getDb(): NeonHttpDatabase<Schema> {
  if (_db) return _db;
  const databaseUrl = process.env['NEON_DATABASE_URL'];
  if (!databaseUrl || databaseUrl.includes('ep-xxx')) {
    throw new Error('NEON_DATABASE_URL is not configured. Search results will not be cached.');
  }
  const sql = neon(databaseUrl);
  _db = drizzle(sql, { schema });
  return _db;
}

// Keep a `db` export for convenience — it lazily initialises on first use.
export const db = new Proxy({} as NeonHttpDatabase<Schema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
