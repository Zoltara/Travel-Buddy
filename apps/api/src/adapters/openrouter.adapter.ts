// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter Adapter
// Uses an LLM via OpenRouter to generate structured resort data based on
// search preferences. This replaces the need for individual platform API keys.
// ─────────────────────────────────────────────────────────────────────────────
import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';
import type { PlatformAdapter } from './base.js';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

function parseDateOnly(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function diffNights(checkIn: string, checkOut: string): number {
  const inParts = parseDateOnly(checkIn);
  const outParts = parseDateOnly(checkOut);
  if (!inParts || !outParts) return 7;

  const inUtc = Date.UTC(inParts.y, inParts.m - 1, inParts.d);
  const outUtc = Date.UTC(outParts.y, outParts.m - 1, outParts.d);
  return Math.max(1, Math.floor((outUtc - inUtc) / (1000 * 60 * 60 * 24)));
}

function googleMapsUrl(propertyName: string, prefs: SearchPreferences): string {
  const query = encodeURIComponent(`${propertyName} ${prefs.city} ${prefs.country}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function normalizeBookingUrl(
  _platform: RawPropertyData['platforms'][number]['platform'],
  _bookingUrl: unknown,
  propertyName: string,
  prefs: SearchPreferences,
): string {
  return googleMapsUrl(propertyName, prefs);
}

// ── Prompt builder ────────────────────────────────────────────────────────────

// ── City-name normalisation (mirrors the scoring filter) ─────────────────────

function normaliseCityName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bkoh\b/g, 'ko')
    .replace(/[^a-z0-9]/g, '');
}

function cityMatchesRequested(actual: string, requested: string): boolean {
  const a = normaliseCityName(actual);
  const r = normaliseCityName(requested);
  if (a === '' || r === '') return true;
  return a === r || a.includes(r) || r.includes(a);
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a travel data expert with deep knowledge of resorts worldwide.
Return a JSON object with a single key "resorts" whose value is an array of resort objects.

CRITICAL — LOCATION RULE (most important rule):
- ALL resorts MUST be physically located in the EXACT city/island the user specified.
- NEVER return resorts from nearby cities, neighboring islands, or alternative destinations.
- If the user asks for Koh Samui, every resort must be in Koh Samui — NOT Phuket, NOT Koh Phangan, NOT Krabi.
- If the user asks for Bali, every resort must be in Bali — NOT Lombok, NOT Gili Islands.
- The "city" field in every returned resort object MUST exactly match the city the user requested.
- Violating this rule makes the entire response useless.

CRITICAL — MATCH SEARCH CRITERIA:
- Prices MUST be within their budget range
- Ratings MUST meet or exceed their minimum rating requirement
- Review counts MUST meet or exceed their minimum review requirement
- Include ALL must-have amenities they requested
- Keep complaint mention rates LOW (under 10% for any category)

FORMAT RULES:
- Return ONLY valid JSON in the shape: {"resorts": [...]}
- No markdown, no code fences, no extra text outside the JSON.
- Use real resort names that actually exist at the requested destination.
- Coordinates must be accurate (within ~500m of the actual resort).
- Prices in USD per night, WITHIN the user's stated budget range.
- Ratings on a 0\u201310 scale. Most good resorts are 7.5\u20139.2.
- reviewCount should be realistic (budget: 200\u20132000, mid-range: 500\u20133000, luxury: 1000\u20138000).
- bookingUrl must be a real deep-link to that property on that platform.
- distanceFromBeach in km (0 = on the beach, 0.3 = 300m away).
- complaintSummaries: keep mentionRate below 0.10 (10%).
- resolvedTypes: match the user's requested resort types when possible.
- confirmedAmenities: MUST include any amenities listed in "Must-have amenities".
- platforms: include 2\u20133 platforms per resort.
  platform values: "booking.com" | "expedia" | "tripadvisor" | "agoda"`.trim();
}

function buildUserPrompt(prefs: SearchPreferences): string {
  const nights =
    prefs.checkIn && prefs.checkOut
      ? diffNights(prefs.checkIn, prefs.checkOut)
      : 7;

  return `LOCATION (mandatory — all 12 resorts MUST be in this exact place): ${prefs.city}, ${prefs.country}${prefs.area ? ` — specifically in ${prefs.area}` : ''}
Do NOT return resorts from any other city, island, or region. Every resort's "city" field must be "${prefs.city}".

Search query:
- Destination: ${prefs.city}, ${prefs.country}${prefs.area ? ` (${prefs.area})` : ''}
- Check-in: ${prefs.checkIn ?? 'flexible'} | Check-out: ${prefs.checkOut ?? 'flexible'} (${nights} nights)
- Guests: ${prefs.guests ?? 2}
- Budget per night: $${prefs.budgetPerNightMin ?? 0}–$${prefs.budgetPerNightMax ?? 9999} USD${prefs.flexibleBudget ? ' (flexible - can show slightly over)' : ' (strict - do not exceed)'}
- Resort types wanted: ${prefs.resortTypes.join(', ')}
- Must-have amenities: ${prefs.mustHaveAmenities.length > 0 ? prefs.mustHaveAmenities.join(', ') : 'none specified'}
- Minimum rating: ${prefs.minRating ?? 7}/10 — ALL resorts must have ratings >= this
- Minimum reviews: ${prefs.minReviewCount ?? 50} — ALL resorts must have review counts >= this
- Avoid high complaints about: ${prefs.avoidComplaintCategories.length > 0 ? prefs.avoidComplaintCategories.join(', ') + ' (keep mentionRate < 0.10)' : 'none'}

IMPORTANT: Generate 12 resorts that ALL meet these requirements. Do not return resorts below the minimum rating or review count. Keep all prices within budget range.

Return exactly 12 resort properties as a JSON array matching this TypeScript type:

interface Resort {
  name: string;
  coordinates: { lat: number; lng: number };
  address: string;
  country: string;
  city: string;
  resolvedTypes: string[];
  confirmedAmenities: string[];
  photoUrl?: string;   // leave out if unknown
  platforms: Array<{
    platform: "booking.com" | "expedia" | "tripadvisor" | "agoda";
    propertyId: string;
    bookingUrl: string;
    pricePerNight: number | null;
    rating: number | null;
    reviewCount: number | null;
  }>;
  distanceFromBeach?: number;
  aggregatedRating: number | null;
  aggregatedReviewCount: number | null;
  aggregatedPricePerNight: number | null;
  complaintSummaries: Array<{
    category: "noise" | "cleanliness" | "food" | "service" | "wifi" | "value";
    mentionCount: number;
    mentionRate: number;
  }>;
  fetchedAt: string;
}

Return a JSON object: { "resorts": [ ...exactly 12 resort objects... ] }. No other text.`;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class OpenRouterAdapter implements PlatformAdapter {
  readonly name = 'openrouter';
  readonly isAvailable = true; // always available — just needs the API key in env

  async search(preferences: SearchPreferences): Promise<RawPropertyData[]> {
    console.log('[OpenRouter] Starting search with preferences:', {
      destination: `${preferences.city}, ${preferences.country}`,
      budget: `$${preferences.budgetPerNightMin}-$${preferences.budgetPerNightMax}`,
      guests: preferences.guests,
      types: preferences.resortTypes,
    });

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(preferences) },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env['OPENROUTER_API_KEY'] ?? ''}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://travelbuddy.app',
        'X-Title': 'Travel Buddy',
      },
      body: JSON.stringify({
        model: process.env['OPENROUTER_MODEL'] ?? 'openai/gpt-4o-mini',
        messages,
        temperature: 0.4,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[OpenRouter] API error:', response.status, text);
      throw new Error(`OpenRouter API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    let raw = data.choices[0]?.message.content ?? '{}';

    // Strip markdown code fences if the model ignores response_format
    const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
    if (fenceMatch?.[1]) raw = fenceMatch[1].trim();

    console.log('[OpenRouter] Raw response (first 500 chars):', raw.slice(0, 500));

    // Parse — the model may return {"resorts": [...]} or a bare array
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error('[OpenRouter] JSON parse error:', err);
      console.error('[OpenRouter] Raw content:', raw.slice(0, 1000));
      throw new Error(`OpenRouter returned invalid JSON: ${raw.slice(0, 200)}`);
    }

    const resorts: unknown[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>)['resorts'])
        ? ((parsed as Record<string, unknown>)['resorts'] as unknown[])
        : Array.isArray((parsed as Record<string, unknown>)['properties'])
          ? ((parsed as Record<string, unknown>)['properties'] as unknown[])
          : [];

    if (resorts.length === 0) {
      console.error('[OpenRouter] Zero resorts in parsed response. Full response:', JSON.stringify(parsed, null, 2));
      throw new Error('OpenRouter returned zero resorts');
    }

    console.log('[OpenRouter] Successfully parsed', resorts.length, 'resorts');

    const now = new Date().toISOString();

    const mapped = resorts
      .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
      .map((r): RawPropertyData => {
        const propertyName = String(r['name'] ?? 'Unknown Resort');

        return {
          name: propertyName,
          coordinates: {
            lat: Number((r['coordinates'] as Record<string, unknown>)?.['lat'] ?? 0),
            lng: Number((r['coordinates'] as Record<string, unknown>)?.['lng'] ?? 0),
          },
          address: String(r['address'] ?? ''),
          country: String(r['country'] ?? preferences.country),
          city: String(r['city'] ?? preferences.city),
          resolvedTypes: (Array.isArray(r['resolvedTypes']) ? r['resolvedTypes'] : []) as RawPropertyData['resolvedTypes'],
          confirmedAmenities: (Array.isArray(r['confirmedAmenities']) ? r['confirmedAmenities'] : []) as RawPropertyData['confirmedAmenities'],
          ...(typeof r['photoUrl'] === 'string' ? { photoUrl: r['photoUrl'] } : {}),
          platforms: Array.isArray(r['platforms'])
            ? (r['platforms'] as Record<string, unknown>[]).map((p) => ({
                platform: String(p['platform'] ?? 'booking.com') as RawPropertyData['platforms'][number]['platform'],
                propertyId: String(p['propertyId'] ?? ''),
                bookingUrl: normalizeBookingUrl(
                  String(p['platform'] ?? 'booking.com') as RawPropertyData['platforms'][number]['platform'],
                  p['bookingUrl'],
                  propertyName,
                  preferences,
                ),
                pricePerNight: p['pricePerNight'] != null ? Number(p['pricePerNight']) : null,
                rating: p['rating'] != null ? Number(p['rating']) : null,
                reviewCount: p['reviewCount'] != null ? Number(p['reviewCount']) : null,
              }))
            : [],
          ...(r['distanceFromBeach'] != null ? { distanceFromBeach: Number(r['distanceFromBeach']) } : {}),
          aggregatedRating: r['aggregatedRating'] != null ? Number(r['aggregatedRating']) : null,
          aggregatedReviewCount: r['aggregatedReviewCount'] != null ? Number(r['aggregatedReviewCount']) : null,
          aggregatedPricePerNight: r['aggregatedPricePerNight'] != null ? Number(r['aggregatedPricePerNight']) : null,
          complaintSummaries: Array.isArray(r['complaintSummaries'])
            ? (r['complaintSummaries'] as Record<string, unknown>[]).map((c) => ({
                category: String(c['category'] ?? 'noise') as RawPropertyData['complaintSummaries'][number]['category'],
                mentionCount: Number(c['mentionCount'] ?? 0),
                mentionRate: Number(c['mentionRate'] ?? 0),
              }))
            : [],
          fetchedAt: now,
        };
      });

    // Drop any resorts the LLM placed in the wrong city/island
    const filtered = mapped.filter((p) => {
      if (cityMatchesRequested(p.city, preferences.city)) return true;
      console.warn(
        `[OpenRouter] Dropping off-location result "${p.name}" (city: "${p.city}", expected: "${preferences.city}")`,
      );
      return false;
    });

    if (filtered.length === 0) {
      console.error(
        `[OpenRouter] All ${mapped.length} results failed location check (expected "${preferences.city}"). ` +
          `Cities returned: ${[...new Set(mapped.map((p) => p.city))].join(', ')}`,
      );
      throw new Error(
        `The AI returned resorts for the wrong location. Please try your search again.`,
      );
    }

    return filtered;
  }
}
