# Travel Buddy 🗺️

> **Stop comparing 47 tabs.** Tell me what to book.

A full-stack travel decision engine for busy people. Input your preferences once across a 4-step wizard and get back exactly **3 ranked resort recommendations** with direct booking links — no tab-switching required.

## 🚀 Quick Deploy

**Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions on deploying to Vercel + Railway.

**Tech Stack**: Next.js 15 · Fastify · Drizzle ORM · Neon Postgres · OpenRouter (LLM) · Turborepo

---

## Features

### Core Decision Engine
- **Multi-platform aggregation** — searches Google Places, Booking.com, Expedia, TripAdvisor, and Agoda in parallel
- **Deduplication & merging** — properties appearing across multiple platforms are merged into one canonical result with combined pricing, ratings, and reviews
- **Weighted scoring algorithm** — every property is scored using a normalized composite formula factoring in price, location, rating, trust, amenities, and complaint penalties
- **Hard filters** — properties failing minimum rating, minimum review count, budget ceiling, or flagged complaint thresholds are eliminated before scoring
- **Exactly 3 results** — always returns the top-ranked 3 resorts, no more, no less
- **Transparent reasoning** — each result includes a "Why we picked this" explanation, 3 pros, and 2 cons

### Search Wizard (4 Screens)
| Screen | What you enter |
|--------|----------------|
| **Screen 1 – Where** | Country, City/Island, area (optional), max distance from beach |
| **Screen 2 – When & Budget** | Check-in/check-out dates, guest count, budget per night (min/max), flexible toggle |
| **Screen 3 – Resort Type** | Resort category (Luxury, Boutique, Eco, Adults-only, Family, Party, Quiet, Business, All-inclusive), must-have amenities, min rating, min reviews, complaint avoidance |
| **Screen 4 – Priorities** | Drag sliders 1–5 for: Price, Location, Cleanliness, Luxury, Privacy, Views, Amenities, Review Quality |

### Resort Result Cards
Each of the 3 results shows:
- Resort name + location
- Price per night (USD)
- Rating (0–10 normalised) + number of reviews
- **Why it was selected** (AI-generated reasoning based on your weights)
- **3 Pros** and **2 Cons**
- Score breakdown (price, location, rating, trust, amenities sub-scores)
- **Direct booking links** — primary + secondary platform deep links
- Booking platform badges (Booking.com, Expedia, Agoda, TripAdvisor)

### Platforms Searched
| Platform | Type | Data provided |
|----------|------|---------------|
| **Google Places API** | Primary | Rating, review count, coordinates, photos, type detection |
| **Booking.com Affiliate** | Booking | Price/night, availability, facility IDs, deep link |
| **Expedia EAN** | Booking | Price/night, availability, amenity IDs, deep link |
| **TripAdvisor Content API** | Reviews | Ratings, complaint theme analysis via NLP keyword extraction |
| **Agoda Affiliate** | Deep link | Fallback booking deep link (full API requires partnership approval) |

### Scoring Formula

```
Score = (w_price × PriceScore)
      + (w_location × LocationScore)
      + (w_cleanliness × RatingScore)
      + (w_luxury × RatingScore)
      + (w_privacy × AmenitiesScore)
      + (w_views × LocationScore)
      + (w_amenities × AmenitiesScore)
      + (w_reviewQuality × TrustScore)
      − ComplaintPenalty
```

All sub-scores normalised **0–10**. All weights normalised so they sum to 1.

| Sub-score | Method |
|-----------|--------|
| **PriceScore** | Inverted min-max within budget range |
| **RatingScore** | Linear (already 0–10 after platform normalisation) |
| **TrustScore** | Log₁₀-normalized review count (10k reviews = 10) |
| **LocationScore** | Linear inverse distance from beach/centre |
| **AmenitiesScore** | % of requested amenities confirmed |
| **ComplaintPenalty** | −1.5 per flagged complaint category with >5% mention rate |

### Must-Have Amenity Filters
- Beachfront
- Private pool
- Breakfast included
- Free cancellation
- Airport transfer
- Gym
- Spa
- Kid-friendly
- Pet-friendly
- Good WiFi (critical for digital nomads)

### Review Quality Filters
- Minimum rating threshold (e.g. 8.5/10)
- Minimum number of reviews (e.g. 200+)
- Complaint avoidance: Noise · Cleanliness · Staff · Location

### Resort Types
Luxury · Boutique · Eco-resort · Adults-only · Family · Party · Quiet/Romantic · Business · All-inclusive

### Caching
- Search results cached in Neon Postgres for **6 hours** (shareable via `/results?id=xxx`)
- Platform API responses cached for **1 hour** to avoid repeated rate-limit hits

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Web** | Next.js 15 (App Router) + React 19 + TailwindCSS + shadcn/ui |
| **Mobile** | Expo (managed) + Expo Router + NativeWind |
| **API** | Fastify 5 + TypeScript (ESM) |
| **Database** | Neon (serverless Postgres) + Drizzle ORM |
| **State** | React Context + useReducer (wizard), TanStack Query (API calls) |
| **Validation** | Zod |
| **Shared Types** | `@travel-buddy/types` (TypeScript interfaces) |
| **Scoring Engine** | `@travel-buddy/scoring` (pure functions, fully testable) |
| **Testing** | Vitest |

---

## Project Structure

```
travel-buddy/
├── apps/
│   ├── web/                    → Next.js 15 web app
│   │   └── src/
│   │       ├── app/search/     → 4-screen wizard + results page
│   │       ├── components/     → ResortCard, WizardProgress
│   │       └── lib/            → SearchContext, API client, utilities
│   ├── mobile/                 → Expo React Native app
│   │   ├── app/(search)/       → Mobile wizard screens
│   │   └── lib/                → SearchContext, API client
│   └── api/                    → Fastify API server
│       └── src/
│           ├── adapters/       → Platform adapters (Google, Booking, Expedia, TA, Agoda)
│           ├── services/       → Aggregator, Scorer
│           ├── routes/         → POST /api/search, GET /api/search/:id, GET /health
│           ├── db/             → Drizzle schema + Neon client
│           └── utils/          → Environment config
├── packages/
│   ├── types/                  → Shared TypeScript interfaces
│   └── scoring/                → Weighted scoring algorithm (pure functions)
├── .env.example
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- A [Neon](https://neon.tech) project (free tier works)
- A [Google Cloud](https://console.cloud.google.com) project with Places API enabled

### 1. Install dependencies
```bash
pnpm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in `.env`:
```
NEON_DATABASE_URL=postgresql://...
GOOGLE_PLACES_API_KEY=AIza...
```
Optional (leave blank to skip those platforms):
```
EXPEDIA_API_KEY=...
BOOKING_AFFILIATE_ID=...
BOOKING_API_TOKEN=...
TRIPADVISOR_API_KEY=...
AGODA_AFFILIATE_ID=...
```

### 3. Set up the database
```bash
cd apps/api
pnpm db:push     # push schema to Neon (first time)
# or
pnpm db:migrate  # run migrations
```

### 4. Run all apps
```bash
# From repo root — starts API (port 4000) + web (port 3000) in parallel
pnpm dev

# Or individually:
cd apps/api    && pnpm dev   # Fastify API
cd apps/web    && pnpm dev   # Next.js web
cd apps/mobile && pnpm dev   # Expo (requires Expo Go app)
```

### 5. Open
- Web: http://localhost:3000
- API health: http://localhost:4000/health
- Mobile: scan QR code from `expo start` output with Expo Go

---

## API Reference

### POST `/api/search`
Run a new search.

**Request body:**
```json
{
  "preferences": {
    "country": "Thailand",
    "city": "Koh Samui",
    "checkIn": "2026-06-01",
    "checkOut": "2026-06-08",
    "guests": 2,
    "budgetPerNightMin": 150,
    "budgetPerNightMax": 500,
    "flexibleBudget": false,
    "resortTypes": ["luxury", "quiet"],
    "mustHaveAmenities": ["beachfront", "spa"],
    "minRating": 8.5,
    "minReviewCount": 200,
    "avoidComplaintCategories": ["noise", "cleanliness"],
    "weights": {
      "price": 2, "location": 5, "cleanliness": 4,
      "luxury": 3, "privacy": 4, "views": 3,
      "amenities": 4, "reviewQuality": 5
    }
  }
}
```

**Response:** `SearchResponse` — `searchId`, `results[3]`, metadata

### GET `/api/search/:id`
Retrieve cached results by search ID (6h TTL).

### GET `/health`
Service health check.

---

## Affiliate Partnerships

To monetise and access full platform APIs:

| Platform | Apply at | What you get |
|----------|----------|-------------|
| Booking.com Affiliate | https://join.booking.com/affiliateprogram/ | Full API + commission |
| Expedia EAN | https://expediagroup.com/partners | Full EAN API + commission |
| TripAdvisor Content API | https://tripadvisor.mediaroom.com/US-content-api | Review data |
| Agoda Partners | https://partners.agoda.com/ | Full API + commission |

Google Places API requires billing enabled; free tier covers ~1,000 text searches/day.

---

## Phase Roadmap

| Phase | Feature |
|-------|---------|
| **Phase 1 (current)** | Resorts only — top 3 ranked results with booking links |
| **Phase 2** | Add restaurants and attractions to results |
| **Phase 3** | Multi-language support (Thai, Spanish, Hebrew, French, Arabic, etc.) |
| **Future** | User accounts (save searches, travel history), AI-generated itineraries, price alerts |

---

## Contributing

1. Fork & clone
2. `pnpm install`
3. Create a feature branch
4. Write tests in `packages/scoring/src/__tests__/`
5. `pnpm typecheck && pnpm test`
6. Open a PR

---

## License

MIT
