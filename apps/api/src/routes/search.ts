import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { searches } from '../db/schema.js';
import { runSearch } from '../services/scorer.js';
import { eq } from 'drizzle-orm';
import type { SearchResponse, SearchPreferences } from '@travel-buddy/types';

// ── Zod validation schemas ────────────────────────────────────────────────────

const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const SearchPreferencesSchema = z.object({
  // Location
  country: z.string().min(1),
  city: z.string().min(1),
  area: z.string().optional(),
  maxDistanceFromBeach: z.number().min(0).optional(),
  maxDistanceFromCenter: z.number().min(0).optional(),
  placeId: z.string().optional(),
  coordinates: CoordinatesSchema.optional(),

  // Dates + Budget
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(20),
  budgetPerNightMin: z.number().min(0),
  budgetPerNightMax: z.number().min(0),
  preferredCurrency: z.enum(['USD', 'EUR', 'GBP', 'THB', 'IDR', 'MXN', 'AED', 'TZS', 'FJD', 'MVR']).optional(),
  totalBudget: z.number().min(0).optional(),
  flexibleBudget: z.boolean(),

  // Type + Filters
  resortTypes: z.array(
    z.enum([
      'luxury', 'boutique', 'eco', 'adults-only', 'family',
      'party', 'quiet', 'business', 'all-inclusive',
    ]),
  ),
  mustHaveAmenities: z.array(
    z.enum([
      'beachfront', 'private-pool', 'breakfast-included', 'free-cancellation',
      'airport-transfer', 'gym', 'spa', 'kid-friendly', 'pet-friendly', 'good-wifi',
    ]),
  ),
  minRating: z.number().min(0).max(10),
  minReviewCount: z.number().int().min(0),
  avoidComplaintCategories: z.array(
    z.enum(['noise', 'cleanliness', 'staff', 'location']),
  ),

  // Priority weights
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

// ── Route registration ────────────────────────────────────────────────────────

export async function searchRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/search – run a new search
  fastify.post<{ Body: { preferences: SearchPreferences } }>(
    '/api/search',
    {
      schema: {
        body: {
          type: 'object',
          required: ['preferences'],
          properties: {
            preferences: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      // Validate body with Zod (richer errors than JSON Schema alone)
      const parsed = SearchPreferencesSchema.safeParse(request.body['preferences']);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'INVALID_PREFERENCES',
          message: 'Search preferences validation failed',
          details: parsed.error.flatten(),
          statusCode: 400,
        });
      }

      const preferences = parsed.data as SearchPreferences;

      // Validate date order
      if (preferences.checkIn >= preferences.checkOut) {
        return reply.status(400).send({
          error: 'INVALID_DATES',
          message: 'checkOut must be after checkIn',
          statusCode: 400,
        });
      }

      try {
        const response: SearchResponse = await runSearch(preferences);

        // Persist to DB for GET /api/search/:id
        const expiresAt = new Date(Date.now() + response.ttl * 1000);
        await db.insert(searches).values({
          id: response.searchId,
          preferences,
          results: response as unknown as Record<string, unknown>,
          expiresAt,
        });

        return reply.status(200).send(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to complete search. Please try again.';
        fastify.log.error({ err, message }, 'Search failed');
        return reply.status(500).send({
          error: 'SEARCH_FAILED',
          message,
          statusCode: 500,
        });
      }
    },
  );

  // GET /api/search/:id – retrieve cached results
  fastify.get<{ Params: { id: string } }>(
    '/api/search/:id',
    async (request, reply) => {
      const { id } = request.params;

      const rows = await db
        .select()
        .from(searches)
        .where(eq(searches.id, id))
        .limit(1);

      const row = rows[0];
      if (!row) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: `Search ${id} not found or has expired`,
          statusCode: 404,
        });
      }

      // Check TTL
      if (new Date() > row.expiresAt) {
        return reply.status(410).send({
          error: 'EXPIRED',
          message: `Search ${id} has expired`,
          statusCode: 410,
        });
      }

      return reply.status(200).send(row.results);
    },
  );
}
