// ─────────────────────────────────────────────────────────────────────────────
// Hard filters  –  eliminate disqualified properties before scoring
// ─────────────────────────────────────────────────────────────────────────────
import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';

export interface FilterResult {
  passed: RawPropertyData[];
  eliminated: Array<{ property: RawPropertyData; reason: string }>;
}

// ── Location helpers ──────────────────────────────────────────────────────────

function normalisePlace(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\bkoh\b/g, 'ko')       // "Koh Samui" ↔ "Ko Samui"
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Returns true if the two place names are a reasonable match.
 * Uses substring matching so that "Seminyak" (district) passes
 * when the user asked for "Bali" (island), and vice-versa.
 */
function placeMatches(actual: string, requested: string): boolean {
  const a = normalisePlace(actual);
  const r = normalisePlace(requested);
  if (a === '' || r === '') return true; // no data – do not block
  return a === r || a.includes(r) || r.includes(a);
}

export function applyHardFilters(
  properties: RawPropertyData[],
  prefs: SearchPreferences,
): FilterResult {
  const passed: RawPropertyData[] = [];
  const eliminated: FilterResult['eliminated'] = [];

  for (const prop of properties) {
    const reasons: string[] = [];

    // ── Location filter ────────────────────────────────────────────────────
    // Country must match (strict). City is lenient to allow districts/islands.
    if (!placeMatches(prop.country, prefs.country)) {
      reasons.push(
        `Wrong country: property is in "${prop.country}", requested "${prefs.country}"`,
      );
    } else if (
      !placeMatches(prop.city, prefs.city) &&
      !placeMatches(prop.country, prefs.city) // handles "Maldives" as both city & country
    ) {
      reasons.push(
        `Wrong location: property is in "${prop.city}", requested "${prefs.city}"`,
      );
    }

    // ── Rating filter ──────────────────────────────────────────────────────
    if (
      prop.aggregatedRating !== null &&
      prop.aggregatedRating < prefs.minRating
    ) {
      reasons.push(
        `Rating ${prop.aggregatedRating.toFixed(1)} below minimum ${prefs.minRating}`,
      );
    }

    // ── Review count filter ────────────────────────────────────────────────
    if (
      prop.aggregatedReviewCount !== null &&
      prop.aggregatedReviewCount < prefs.minReviewCount
    ) {
      reasons.push(
        `Only ${prop.aggregatedReviewCount} reviews, minimum is ${prefs.minReviewCount}`,
      );
    }

    // ── Price filter ───────────────────────────────────────────────────────
    if (prop.aggregatedPricePerNight !== null) {
      // Only filter out if over budget (cheaper is always better!)
      if (
        !prefs.flexibleBudget &&
        prop.aggregatedPricePerNight > prefs.budgetPerNightMax
      ) {
        reasons.push(
          `Price $${prop.aggregatedPricePerNight}/night exceeds budget $${prefs.budgetPerNightMax}`,
        );
      }
      // Allow 10% over budget if flexible
      if (
        prefs.flexibleBudget &&
        prop.aggregatedPricePerNight > prefs.budgetPerNightMax * 1.1
      ) {
        reasons.push(
          `Price $${prop.aggregatedPricePerNight}/night exceeds flexible budget $${Math.round(prefs.budgetPerNightMax * 1.1)}`,
        );
      }
    }

    // ── Complaint category filter ──────────────────────────────────────────
    for (const summary of prop.complaintSummaries) {
      if (
        prefs.avoidComplaintCategories.includes(summary.category) &&
        summary.mentionRate > 0.20 // >20% mentions = dealbreaker (was 15%)
      ) {
        reasons.push(
          `High ${summary.category} complaints (${Math.round(summary.mentionRate * 100)}% of reviews)`,
        );
      }
    }

    // ── Must-have amenities (hard block only if user toggled "beachfront") ─
    // Skip if confirmedAmenities is empty (no data from source, e.g. Google Maps).
    // Soft amenities handled via amenitiesScore; only "beachfront" is a hard filter
    if (
      prefs.mustHaveAmenities.includes('beachfront') &&
      prop.confirmedAmenities.length > 0 &&
      !prop.confirmedAmenities.includes('beachfront')
    ) {
      reasons.push('Property is not beachfront');
    }

    if (reasons.length > 0) {
      eliminated.push({ property: prop, reason: reasons.join('; ') });
    } else {
      passed.push(prop);
    }
  }

  return { passed, eliminated };
}
