// ─────────────────────────────────────────────────────────────────────────────
// Scorer Service
// Thin orchestration layer: filter → score → return top 3
// ─────────────────────────────────────────────────────────────────────────────
import type { ScoredResort, SearchPreferences, SearchResponse } from '@travel-buddy/types';
import { applyHardFilters, rankTopThree } from '@travel-buddy/scoring';
import { aggregateProperties } from './aggregator.js';
import { v4 as uuidv4 } from 'uuid';

const SEARCH_TTL_SECONDS = 6 * 60 * 60; // 6 hours

export async function runSearch(
  preferences: SearchPreferences,
): Promise<SearchResponse> {
  // ── 1. Fetch from all platforms ────────────────────────────────────────────
  const { properties, platformsQueried, platformsFailed, totalRaw } =
    await aggregateProperties(preferences);

  // ── 2. Apply hard filters ─────────────────────────────────────────────────
  const { passed, eliminated } = applyHardFilters(properties, preferences);

  console.info(
    `[Scorer] ${properties.length} unique properties found. ` +
      `${passed.length} passed filters, ${eliminated.length} eliminated.`,
  );

  // ── 3. Score and rank top 3 ───────────────────────────────────────────────
  const results: ScoredResort[] = rankTopThree(passed, preferences);

  // ── 4. Build response ─────────────────────────────────────────────────────
  return {
    searchId: uuidv4(),
    results,
    searchedAt: new Date().toISOString(),
    totalPropertiesFound: totalRaw,
    filteredOut: eliminated.length,
    platformsQueried,
    platformsFailed,
    ttl: SEARCH_TTL_SECONDS,
  };
}
