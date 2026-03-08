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
    `[Scorer] Filtering: ${properties.length} properties found. ` +
      `Filters: rating≥${preferences.minRating}, reviews≥${preferences.minReviewCount}, ` +
      `budget=$${preferences.budgetPerNightMin}-$${preferences.budgetPerNightMax}${preferences.flexibleBudget ? ' (flexible)' : ''}`,
  );
  console.info(
    `[Scorer] Results: ${passed.length} passed filters, ${eliminated.length} eliminated.`,
  );
  
  // Log top elimination reasons for debugging
  if (eliminated.length > 0) {
    const reasonCounts: Record<string, number> = {};
    eliminated.forEach((e) => {
      const firstReason = e.reason.split(';')[0]?.trim() ?? 'Unknown';
      reasonCounts[firstReason] = (reasonCounts[firstReason] || 0) + 1;
    });
    const topReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([reason, count]) => `${reason} (${count}x)`)
      .join(', ');
    console.info(`[Scorer] Top elimination reasons: ${topReasons}`);
  }

  // ── 3. Score and rank top 3 ───────────────────────────────────────────────
  const results: ScoredResort[] = rankTopThree(passed, preferences);

  // If no results, provide helpful debugging info
  if (results.length === 0) {
    console.warn('[Scorer] No results after filtering:', {
      totalFound: totalRaw,
      passedFilters: passed.length,
      eliminated: eliminated.length,
      topEliminationReasons: eliminated
        .map((e) => e.reason)
        .reduce((acc: Record<string, number>, reason) => {
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {}),
    });
  }

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
