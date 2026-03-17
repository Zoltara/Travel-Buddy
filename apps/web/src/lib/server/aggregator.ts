import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';
import { searchWithGooglePlaces } from './googleplaces';

export interface AggregatorResult {
  properties: RawPropertyData[];
  platformsQueried: string[];
  platformsFailed: string[];
  totalRaw: number;
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
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

function isSameProperty(a: RawPropertyData, b: RawPropertyData): boolean {
  if (haversineKm(a.coordinates, b.coordinates) > 0.1) return false;
  const nameA = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameB = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const longer = nameA.length > nameB.length ? nameA : nameB;
  const shorter = nameA.length > nameB.length ? nameB : nameA;
  if (longer.length === 0) return true;
  return longer.includes(shorter) || levenshteinSimilarity(nameA, nameB) >= 0.8;
}

function mergeGroup(group: RawPropertyData[]): RawPropertyData {
  if (group.length === 1) return group[0]!;
  const canonical =
    group.find((p) => p.platforms.some((pl) => pl.platform === 'google-places')) ?? group[0]!;
  const allPlatforms = group.flatMap((p) => p.platforms);
  const uniquePlatforms = allPlatforms.filter(
    (pl, idx, arr) => arr.findIndex((x) => x.platform === pl.platform) === idx,
  );
  const ratingPairs = group
    .filter((p) => p.aggregatedRating !== null && p.aggregatedReviewCount !== null)
    .map((p) => ({ rating: p.aggregatedRating!, count: p.aggregatedReviewCount! }));
  let aggregatedRating: number | null = null;
  let aggregatedReviewCount: number | null = null;
  if (ratingPairs.length > 0) {
    const totalWeight = ratingPairs.reduce((s, p) => s + p.count, 0);
    aggregatedRating = ratingPairs.reduce((s, p) => s + p.rating * p.count, 0) / totalWeight;
    aggregatedReviewCount = totalWeight;
  }
  const prices = group.map((p) => p.aggregatedPricePerNight).filter((p): p is number => p !== null);
  const aggregatedPricePerNight = prices.length > 0 ? Math.min(...prices) : null;
  const allAmenities = [...new Set(group.flatMap((p) => p.confirmedAmenities))] as RawPropertyData['confirmedAmenities'];
  const complaintSummaries =
    group.find((p) => p.platforms.some((pl) => pl.platform === 'tripadvisor'))?.complaintSummaries ??
    canonical.complaintSummaries;
  return { ...canonical, platforms: uniquePlatforms, aggregatedRating, aggregatedReviewCount, aggregatedPricePerNight, confirmedAmenities: allAmenities, complaintSummaries };
}

function deduplicateAndMerge(all: RawPropertyData[]): RawPropertyData[] {
  const groups: RawPropertyData[][] = [];
  for (const prop of all) {
    const existingGroup = groups.find((g) => g.some((p) => isSameProperty(p, prop)));
    if (existingGroup) existingGroup.push(prop);
    else groups.push([prop]);
  }
  return groups.map(mergeGroup);
}

// ── Main aggregator ───────────────────────────────────────────────────────────

export async function aggregateProperties(preferences: SearchPreferences): Promise<AggregatorResult> {
  const platformsQueried: string[] = [];
  const platformsFailed: string[] = [];

  let results: RawPropertyData[];
  try {
    results = await searchWithGooglePlaces(preferences);
    platformsQueried.push('google-places');
  } catch (err) {
    platformsFailed.push('google-places');
    const errorMsg = (err as Error)?.message ?? String(err);
    if (errorMsg.includes('REQUEST_DENIED') || errorMsg.includes('INVALID_REQUEST')) {
      throw new Error('Google Maps API key is invalid or missing. Please check your GOOGLE_MAPS_API_KEY environment variable.');
    } else if (errorMsg.includes('OVER_QUERY_LIMIT') || errorMsg.includes('quota')) {
      throw new Error('Google Maps API quota exceeded. Please try again later.');
    } else {
      throw new Error(`Failed to search resorts: ${errorMsg}`);
    }
  }

  const totalRaw = results.length;
  const properties = deduplicateAndMerge(results);
  return { properties, platformsQueried, platformsFailed, totalRaw };
}
