import {
  pgTable,
  text,
  jsonb,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';

// ── searches ─────────────────────────────────────────────────────────────────
// Stores completed search sessions (preferences + ranked results).
// Results are cached for 6 hours to avoid repeated platform API calls.

export const searches = pgTable(
  'searches',
  {
    id: text('id').primaryKey(),                 // UUID v4
    preferences: jsonb('preferences').notNull(),  // SearchPreferences
    results: jsonb('results').notNull(),           // SearchResponse
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('searches_expires_at_idx').on(table.expiresAt),
  ],
);

// ── platform_cache ────────────────────────────────────────────────────────────
// Short-lived cache of raw platform API responses (1 hour TTL).
// Key is a hash of platform + search area + date range.

export const platformCache = pgTable(
  'platform_cache',
  {
    cacheKey: text('cache_key').primaryKey(),
    platform: text('platform').notNull(),
    data: jsonb('data').notNull(),
    hitCount: integer('hit_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('platform_cache_expires_at_idx').on(table.expiresAt),
    index('platform_cache_platform_idx').on(table.platform),
  ],
);

export type SearchRecord = typeof searches.$inferSelect;
export type NewSearchRecord = typeof searches.$inferInsert;
export type PlatformCacheRecord = typeof platformCache.$inferSelect;
export type NewPlatformCacheRecord = typeof platformCache.$inferInsert;
