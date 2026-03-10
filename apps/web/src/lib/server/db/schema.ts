import { pgTable, text, jsonb, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const searches = pgTable(
  'searches',
  {
    id: text('id').primaryKey(),
    preferences: jsonb('preferences').notNull(),
    results: jsonb('results').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('searches_expires_at_idx').on(table.expiresAt)],
);

export const platformCache = pgTable(
  'platform_cache',
  {
    cacheKey: text('cache_key').primaryKey(),
    platform: text('platform').notNull(),
    data: jsonb('data').notNull(),
    hitCount: integer('hit_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('platform_cache_expires_at_idx').on(table.expiresAt),
    index('platform_cache_platform_idx').on(table.platform),
  ],
);

export type SearchRecord = typeof searches.$inferSelect;
export type NewSearchRecord = typeof searches.$inferInsert;
