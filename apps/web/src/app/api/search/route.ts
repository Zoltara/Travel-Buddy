import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runSearch } from '@/lib/server/scorer';
import { db } from '@/lib/server/db/client';
import { searches } from '@/lib/server/db/schema';
import type { SearchPreferences, SearchResponse } from '@travel-buddy/types';

// ── Validation schema ────────────────────────────────────────────────────────

const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const SearchPreferencesSchema = z.object({
  country: z.string().min(1),
  city: z.string().min(1),
  area: z.string().optional(),
  maxDistanceFromBeach: z.number().min(0).optional(),
  maxDistanceFromCenter: z.number().min(0).optional(),
  placeId: z.string().optional(),
  coordinates: CoordinatesSchema.optional(),

  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(20),
  budgetPerNightMin: z.number().min(0),
  budgetPerNightMax: z.number().min(0),
  preferredCurrency: z.enum(['USD', 'EUR', 'GBP', 'THB', 'IDR', 'MXN', 'AED', 'TZS', 'FJD', 'MVR']).optional(),
  totalBudget: z.number().min(0).optional(),
  flexibleBudget: z.boolean(),

  resortTypes: z.array(
    z.enum(['luxury', 'boutique', 'eco', 'adults-only', 'family', 'party', 'quiet', 'business', 'all-inclusive']),
  ),
  mustHaveAmenities: z.array(
    z.enum(['beachfront', 'private-pool', 'breakfast-included', 'free-cancellation', 'airport-transfer', 'gym', 'spa', 'kid-friendly', 'pet-friendly', 'good-wifi']),
  ),
  minRating: z.number().min(0).max(10),
  minReviewCount: z.number().int().min(0),
  avoidComplaintCategories: z.array(
    z.enum(['noise', 'cleanliness', 'staff', 'location']),
  ),

  weights: z.object({
    price: z.number().min(1).max(5),
    location: z.number().min(1).max(5),
    cleanliness: z.number().min(1).max(5),
    luxury: z.number().min(1).max(5),
    privacy: z.number().min(1).max(5),
    views: z.number().min(1).max(5),
    amenities: z.number().min(1).max(5),
    reviewQuality: z.number().min(1).max(5),
  }),
});

// ── POST /api/search ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON', message: 'Request body must be valid JSON', statusCode: 400 }, { status: 400 });
  }

  const parsed = SearchPreferencesSchema.safeParse((body as Record<string, unknown>)['preferences']);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_PREFERENCES', message: 'Search preferences validation failed', details: parsed.error.flatten(), statusCode: 400 },
      { status: 400 },
    );
  }

  const preferences = parsed.data as SearchPreferences;

  if (preferences.checkIn >= preferences.checkOut) {
    return NextResponse.json(
      { error: 'INVALID_DATES', message: 'checkOut must be after checkIn', statusCode: 400 },
      { status: 400 },
    );
  }

  try {
    const response: SearchResponse = await runSearch(preferences);

    const expiresAt = new Date(Date.now() + response.ttl * 1000);
    await db.insert(searches).values({
      id: response.searchId,
      preferences,
      results: response as unknown as Record<string, unknown>,
      expiresAt,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to complete search. Please try again.';
    console.error('Search failed:', err);
    return NextResponse.json({ error: 'SEARCH_FAILED', message, statusCode: 500 }, { status: 500 });
  }
}
