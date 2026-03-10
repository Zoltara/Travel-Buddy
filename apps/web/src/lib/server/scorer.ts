import type { ScoredResort, SearchPreferences, SearchResponse } from '@travel-buddy/types';
import { applyHardFilters, rankTopThree } from '@travel-buddy/scoring';
import { aggregateProperties } from './aggregator';
import { v4 as uuidv4 } from 'uuid';

const SEARCH_TTL_SECONDS = 6 * 60 * 60;

export async function runSearch(preferences: SearchPreferences): Promise<SearchResponse> {
  const { properties, platformsQueried, platformsFailed, totalRaw } =
    await aggregateProperties(preferences);

  const { passed, eliminated } = applyHardFilters(properties, preferences);

  console.info(
    `[Scorer] ${properties.length} found. Filters: rating≥${preferences.minRating}, reviews≥${preferences.minReviewCount}, budget=$${preferences.budgetPerNightMin}-$${preferences.budgetPerNightMax}`,
  );
  console.info(`[Scorer] ${passed.length} passed, ${eliminated.length} eliminated.`);

  const results: ScoredResort[] = rankTopThree(passed, preferences);

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
