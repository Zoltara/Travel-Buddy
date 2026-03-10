import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function buildPlatformSearchUrl(
  platform: RawPropertyData['platforms'][number]['platform'],
  propertyName: string,
  prefs: SearchPreferences,
): string {
  const query = encodeURIComponent(`${propertyName} ${prefs.city} ${prefs.country}`);
  switch (platform) {
    case 'booking.com':
      return `https://www.booking.com/searchresults.html?ss=${query}&checkin=${prefs.checkIn}&checkout=${prefs.checkOut}&group_adults=${prefs.guests}`;
    case 'expedia':
      return `https://www.expedia.com/Hotel-Search?destination=${query}&startDate=${prefs.checkIn}&endDate=${prefs.checkOut}&adults=${prefs.guests}`;
    case 'agoda':
      return `https://www.agoda.com/search?textToSearch=${query}&checkIn=${prefs.checkIn}&checkOut=${prefs.checkOut}&adults=${prefs.guests}`;
    case 'tripadvisor':
      return `https://www.tripadvisor.com/Search?q=${query}`;
    default:
      return `https://www.google.com/search?q=${query}`;
  }
}

function normalizeBookingUrl(
  platform: RawPropertyData['platforms'][number]['platform'],
  _bookingUrl: unknown,
  propertyName: string,
  prefs: SearchPreferences,
): string {
  // Always use a verified search URL rather than the LLM-generated direct link,
  // which is almost always hallucinated and leads to a 404.
  return buildPlatformSearchUrl(platform, propertyName, prefs);
}

function buildSystemPrompt(): string {
  return `You are a travel data expert with deep knowledge of resorts worldwide.
Return a JSON object with a single key "resorts" whose value is an array of resort objects.

CRITICAL: Generate resorts that MATCH the user's search criteria:
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
- Ratings on a 0–10 scale. Most good resorts are 7.5–9.2.
- reviewCount should be realistic (budget: 200–2000, mid-range: 500–3000, luxury: 1000–8000).
- bookingUrl must be a real deep-link to that property on that platform.
- distanceFromBeach in km (0 = on the beach, 0.3 = 300m away).
- complaintSummaries: keep mentionRate below 0.10 (10%).
- resolvedTypes: match the user's requested resort types when possible.
- confirmedAmenities: MUST include any amenities listed in "Must-have amenities".
- platforms: include 2–3 platforms per resort.
  platform values: "booking.com" | "expedia" | "tripadvisor" | "agoda"`.trim();
}

function buildUserPrompt(prefs: SearchPreferences): string {
  const nights = prefs.checkIn && prefs.checkOut ? diffNights(prefs.checkIn, prefs.checkOut) : 7;
  return `Search query:
- Destination: ${prefs.city}, ${prefs.country}${prefs.area ? ` (${prefs.area})` : ''}
- Check-in: ${prefs.checkIn ?? 'flexible'} | Check-out: ${prefs.checkOut ?? 'flexible'} (${nights} nights)
- Guests: ${prefs.guests ?? 2}
- Budget per night: $${prefs.budgetPerNightMin ?? 0}–$${prefs.budgetPerNightMax ?? 9999} USD${prefs.flexibleBudget ? ' (flexible - can show slightly over)' : ' (strict - do not exceed)'}
- Resort types wanted: ${prefs.resortTypes.join(', ')}
- Must-have amenities: ${prefs.mustHaveAmenities.length > 0 ? prefs.mustHaveAmenities.join(', ') : 'none specified'}
- Minimum rating: ${prefs.minRating ?? 7}/10 — ALL resorts must have ratings >= this
- Minimum reviews: ${prefs.minReviewCount ?? 50} — ALL resorts must have review counts >= this
- Avoid high complaints about: ${prefs.avoidComplaintCategories.length > 0 ? prefs.avoidComplaintCategories.join(', ') + ' (keep mentionRate < 0.10)' : 'none'}

IMPORTANT: Generate 6 resorts that ALL meet these requirements. Do not return resorts below the minimum rating or review count. Keep all prices within budget range.

Return exactly 6 resort properties as a JSON array matching this TypeScript type:

interface Resort {
  name: string;
  coordinates: { lat: number; lng: number };
  address: string;
  country: string;
  city: string;
  resolvedTypes: string[];
  confirmedAmenities: string[];
  photoUrl?: string;
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

Return a JSON object: { "resorts": [ ...exactly 6 resort objects... ] }. No other text.`;
}

// ── Main search function ──────────────────────────────────────────────────────

export async function searchWithOpenRouter(preferences: SearchPreferences): Promise<RawPropertyData[]> {
  const apiKey = process.env['OPENROUTER_API_KEY'];
  if (!apiKey) throw new Error('Missing required environment variable: OPENROUTER_API_KEY');

  const model = process.env['OPENROUTER_MODEL'] ?? 'openai/gpt-4o-mini';

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserPrompt(preferences) },
  ];

  console.log('[OpenRouter] Searching:', `${preferences.city}, ${preferences.country}`);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://travelbuddy.app',
      'X-Title': 'Travel Buddy',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  let raw = data.choices[0]?.message.content ?? '{}';

  const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
  if (fenceMatch?.[1]) raw = fenceMatch[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
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
    throw new Error('OpenRouter returned zero resorts');
  }

  console.log('[OpenRouter] Parsed', resorts.length, 'resorts');
  const now = new Date().toISOString();

  return resorts
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
}
