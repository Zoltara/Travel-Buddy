// ─────────────────────────────────────────────────────────────────────────────
// Google Places Adapter (API server)
// Replaces the OpenRouter/LLM adapter with real Google Maps data.
// ─────────────────────────────────────────────────────────────────────────────
import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';
import type { PlatformAdapter } from './base.js';

// ── Google Places API types ───────────────────────────────────────────────────

interface GooglePlaceResult {
  place_id: string;
  name: string;
  geometry: { location: { lat: number; lng: number } };
  formatted_address: string;
  /** 1–5 star scale */
  rating?: number;
  user_ratings_total?: number;
  types: string[];
}

interface GooglePlacesTextSearchResponse {
  results: GooglePlaceResult[];
  status: string;
  error_message?: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

/** Deep-links to the real place on Google Maps using its stable place_id. */
function googleMapsUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class GooglePlacesAdapter implements PlatformAdapter {
  readonly name = 'google-places';
  readonly isAvailable = true;

  async search(preferences: SearchPreferences): Promise<RawPropertyData[]> {
    const apiKey = process.env['GOOGLE_MAPS_API_KEY'];
    if (!apiKey) {
      throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY');
    }

    const locationPart = preferences.area
      ? `${preferences.area}, ${preferences.city}, ${preferences.country}`
      : `${preferences.city}, ${preferences.country}`;
    const query = `resort ${locationPart}`;

    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('type', 'lodging');
    url.searchParams.set('key', apiKey);

    console.log('[GooglePlaces] Searching:', query);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google Places API HTTP error: ${response.status}`);
    }

    const data = (await response.json()) as GooglePlacesTextSearchResponse;

    if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
      throw new Error(
        `Google Places API error: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`,
      );
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Places API quota exceeded. Please try again later.');
    }

    if (data.status === 'ZERO_RESULTS' || data.results.length === 0) {
      throw new Error(
        `No resorts found on Google Maps for "${preferences.city}, ${preferences.country}". Try a different destination.`,
      );
    }

    console.log('[GooglePlaces] Found', data.results.length, 'places');

    const now = new Date().toISOString();

    return data.results.map((place): RawPropertyData => {
      // Convert Google's 1–5 star rating to the app's 0–10 scale
      const rating = place.rating != null ? Math.round(place.rating * 2 * 10) / 10 : null;
      const mapsUrl = googleMapsUrl(place.place_id);

      return {
        name: place.name,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        address: place.formatted_address,
        country: preferences.country,
        city: preferences.city,
        resolvedTypes: [],
        confirmedAmenities: [],
        platforms: [
          {
            platform: 'google-places',
            propertyId: place.place_id,
            bookingUrl: mapsUrl,
            pricePerNight: null,
            rating,
            reviewCount: place.user_ratings_total ?? null,
          },
        ],
        aggregatedRating: rating,
        aggregatedReviewCount: place.user_ratings_total ?? null,
        aggregatedPricePerNight: null,
        complaintSummaries: [],
        fetchedAt: now,
      };
    });
  }
}
