// ─────────────────────────────────────────────────────────────────────────────
// Scoring Types
// ─────────────────────────────────────────────────────────────────────────────

import type { RawPropertyData, PlatformRef } from './property.js';

/** Breakdown of how the score was calculated (for transparency UI) */
export interface ScoreBreakdown {
  /** Weighted price score (0–10) */
  priceScore: number;
  /** Weighted location/distance score (0–10) */
  locationScore: number;
  /** Weighted rating score (0–10) */
  ratingScore: number;
  /** Weighted trust/review-count score (0–10) */
  trustScore: number;
  /** Amenities match score (0–10) */
  amenitiesScore: number;
  /** Total penalty deducted for complaint categories */
  complaintPenalty: number;
  /** Final composite score (0–10) */
  totalScore: number;
}

/** A fully scored resort ready for display */
export interface ScoredResort extends RawPropertyData {
  /** 1–3 ranking position */
  rank: 1 | 2 | 3;
  score: ScoreBreakdown;
  /** Primary booking link (best platform with available price) */
  primaryBookingRef: PlatformRef;
  /** Human-readable explanation of why this resort was selected */
  whySelected: string;
  /** Exactly 3 pros */
  pros: [string, string, string];
  /** Exactly 2 cons */
  cons: [string, string];
}
