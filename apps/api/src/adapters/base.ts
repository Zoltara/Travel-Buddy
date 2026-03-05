import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';

/** Every platform adapter must implement this interface */
export interface PlatformAdapter {
  readonly name: string;
  /** Whether this adapter is configured and available */
  readonly isAvailable: boolean;
  /**
   * Fetch raw property data for the given search preferences.
   * Should throw on error – the aggregator uses Promise.allSettled.
   */
  search(preferences: SearchPreferences): Promise<RawPropertyData[]>;
}

/** Simple hash for cache keys */
export function buildCacheKey(
  platform: string,
  prefs: SearchPreferences,
): string {
  const keyParts = [
    platform,
    prefs.country,
    prefs.city,
    prefs.area ?? '',
    prefs.checkIn,
    prefs.checkOut,
    prefs.guests.toString(),
  ];
  return keyParts.join('|').toLowerCase().replace(/\s+/g, '-');
}
