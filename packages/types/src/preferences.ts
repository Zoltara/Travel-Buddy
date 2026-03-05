// ─────────────────────────────────────────────────────────────────────────────
// User Search Preferences
// Collected across the 4-screen wizard
// ─────────────────────────────────────────────────────────────────────────────

export type ResortType =
  | 'luxury'
  | 'boutique'
  | 'eco'
  | 'adults-only'
  | 'family'
  | 'party'
  | 'quiet'
  | 'business'
  | 'all-inclusive';

export type MustHaveAmenity =
  | 'beachfront'
  | 'private-pool'
  | 'breakfast-included'
  | 'free-cancellation'
  | 'airport-transfer'
  | 'gym'
  | 'spa'
  | 'kid-friendly'
  | 'pet-friendly'
  | 'good-wifi';

export type ComplaintCategory =
  | 'noise'
  | 'cleanliness'
  | 'staff'
  | 'location';

export type PriorityKey =
  | 'price'
  | 'location'
  | 'cleanliness'
  | 'luxury'
  | 'privacy'
  | 'views'
  | 'amenities'
  | 'reviewQuality';

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'THB'
  | 'IDR'
  | 'MXN'
  | 'AED'
  | 'TZS'
  | 'FJD'
  | 'MVR';

/** Weights are raw 1–5 values from the slider; engine normalizes internally */
export type PriorityWeights = Record<PriorityKey, number>;

// ── Screen 1: Location ───────────────────────────────────────────────────────

export interface LocationPreferences {
  country: string;
  city: string;
  /** Optional neighbourhood / island etc. */
  area?: string;
  /** km from beach (0 = beachfront required) */
  maxDistanceFromBeach?: number;
  /** km from city centre */
  maxDistanceFromCenter?: number;
  /** Google Places result for the chosen destination */
  placeId?: string;
  coordinates?: { lat: number; lng: number };
}

// ── Screen 2: Dates + Budget ─────────────────────────────────────────────────

export interface DateBudgetPreferences {
  checkIn: string;   // ISO date "YYYY-MM-DD"
  checkOut: string;  // ISO date "YYYY-MM-DD"
  guests: number;
  budgetPerNightMin: number;  // USD
  budgetPerNightMax: number;
  /** Display/input currency for budgets and prices in the UI */
  preferredCurrency?: CurrencyCode;
  totalBudget?: number;
  flexibleBudget: boolean;
}

// ── Screen 3: Type + Filters ─────────────────────────────────────────────────

export interface TypeFilterPreferences {
  resortTypes: ResortType[];
  mustHaveAmenities: MustHaveAmenity[];
  minRating: number;            // e.g. 8.5 (on a 10-point scale)
  minReviewCount: number;       // e.g. 200
  avoidComplaintCategories: ComplaintCategory[];
}

// ── Screen 4: Priority Weights ───────────────────────────────────────────────

export interface PriorityPreferences {
  weights: PriorityWeights;
}

// ── Combined preferences (all 4 screens merged) ──────────────────────────────

export interface SearchPreferences
  extends LocationPreferences,
    DateBudgetPreferences,
    TypeFilterPreferences,
    PriorityPreferences {}
