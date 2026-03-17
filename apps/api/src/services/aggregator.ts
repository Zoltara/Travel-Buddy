// ─────────────────────────────────────────────────────────────────────────────
// Aggregator Service
// Runs all platform adapters in parallel, deduplicates results,
// merges cross-platform data, and returns a unified property list.
// ─────────────────────────────────────────────────────────────────────────────
import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';
import { OpenRouterAdapter } from '../adapters/openrouter.adapter.js';

export interface AggregatorResult {
  properties: RawPropertyData[];
  platformsQueried: string[];
  platformsFailed: string[];
  totalRaw: number;
}

// ── Deduplication ─────────────────────────────────────────────────────────────

/** Two properties are "same" if within 100m + name similarity ≥ 80% */
function isSameProperty(a: RawPropertyData, b: RawPropertyData): boolean {
  const distKm = haversineKm(a.coordinates, b.coordinates);
  if (distKm > 0.1) return false; // > 100m apart

  const nameA = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameB = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const longer = nameA.length > nameB.length ? nameA : nameB;
  const shorter = nameA.length > nameB.length ? nameB : nameA;
  if (longer.length === 0) return true;
  return longer.includes(shorter) || levenshteinSimilarity(nameA, nameB) >= 0.8;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function levenshteinSimilarity(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  const maxLen = Math.max(m, n);
  return maxLen === 0 ? 1 : 1 - dp[m]![n]! / maxLen;
}

/** Merge a duplicate group into one canonical property */
function mergeGroup(group: RawPropertyData[]): RawPropertyData {
  if (group.length === 1) return group[0]!;

  // Use Google Places as the canonical base if present, else first entry
  const canonical =
    group.find((p) =>
      p.platforms.some((pl) => pl.platform === 'google-places'),
    ) ?? group[0]!;

  // Merge platforms
  const allPlatforms = group.flatMap((p) => p.platforms);
  const uniquePlatforms = allPlatforms.filter((pl, idx, arr) =>
    arr.findIndex((x) => x.platform === pl.platform) === idx,
  );

  // Aggregate rating (weighted mean, weight = reviewCount)
  const ratingPairs = group
    .filter((p) => p.aggregatedRating !== null && p.aggregatedReviewCount !== null)
    .map((p) => ({
      rating: p.aggregatedRating!,
      count: p.aggregatedReviewCount!,
    }));

  let aggregatedRating: number | null = null;
  let aggregatedReviewCount: number | null = null;

  if (ratingPairs.length > 0) {
    const totalWeight = ratingPairs.reduce((s, p) => s + p.count, 0);
    aggregatedRating =
      ratingPairs.reduce((s, p) => s + p.rating * p.count, 0) / totalWeight;
    aggregatedReviewCount = totalWeight;
  }

  // Price: use lowest available
  const prices = group
    .map((p) => p.aggregatedPricePerNight)
    .filter((p): p is number => p !== null);
  const aggregatedPricePerNight = prices.length > 0 ? Math.min(...prices) : null;

  // Amenities: union
  const allAmenities = [
    ...new Set(group.flatMap((p) => p.confirmedAmenities)),
  ] as RawPropertyData['confirmedAmenities'];

  // Complaints: merge from TripAdvisor (most complete source)
  const complaintSummaries =
    group.find((p) =>
      p.platforms.some((pl) => pl.platform === 'tripadvisor'),
    )?.complaintSummaries ?? canonical.complaintSummaries;

  return {
    ...canonical,
    platforms: uniquePlatforms,
    aggregatedRating,
    aggregatedReviewCount,
    aggregatedPricePerNight,
    confirmedAmenities: allAmenities,
    complaintSummaries,
  };
}

/** Deduplicate and merge results from multiple platforms */
function deduplicateAndMerge(all: RawPropertyData[]): RawPropertyData[] {
  const groups: RawPropertyData[][] = [];

  for (const prop of all) {
    const existingGroup = groups.find((g) =>
      g.some((p) => isSameProperty(p, prop)),
    );
    if (existingGroup) {
      existingGroup.push(prop);
    } else {
      groups.push([prop]);
    }
  }

  return groups.map(mergeGroup);
}

// ── Main aggregator ───────────────────────────────────────────────────────────

export async function aggregateProperties(
  preferences: SearchPreferences,
): Promise<AggregatorResult> {
  console.log('[Aggregator] Starting property aggregation');
  
  const adapter = new OpenRouterAdapter();
  const platformsQueried: string[] = [];
  const platformsFailed: string[] = [];
  const allProperties: RawPropertyData[] = [];

  try {
    const results = await adapter.search(preferences);
    platformsQueried.push(adapter.name);
    allProperties.push(...results);
    console.log('[Aggregator] OpenRouter returned', results.length, 'properties');
  } catch (err) {
    platformsFailed.push(adapter.name);
    const errorMsg = (err as Error)?.message ?? String(err);
    console.error('[Aggregator] OpenRouter failed:', errorMsg);
    
    // Provide specific error messages for common issues
    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      throw new Error('OpenRouter API key is invalid or missing. Please check your OPENROUTER_API_KEY environment variable.');
    } else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
      throw new Error('OpenRouter rate limit exceeded. Please try again in a few minutes.');
    } else if (errorMsg.includes('zero resorts')) {
      throw new Error('No resorts could be generated for this location. Try a different destination or relax your filters.');
    } else {
      throw new Error(`Failed to search resorts: ${errorMsg}`);
    }
  }

  const totalRaw = allProperties.length;
  const properties = deduplicateAndMerge(allProperties);

  console.log('[Aggregator] After deduplication:', properties.length, 'unique properties');

  return { properties, platformsQueried, platformsFailed, totalRaw };
}
