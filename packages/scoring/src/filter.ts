// ─────────────────────────────────────────────────────────────────────────────
// Hard filters  –  eliminate disqualified properties before scoring
// ─────────────────────────────────────────────────────────────────────────────
import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';

export interface FilterResult {
  passed: RawPropertyData[];
  eliminated: Array<{ property: RawPropertyData; reason: string }>;
}

export function applyHardFilters(
  properties: RawPropertyData[],
  prefs: SearchPreferences,
): FilterResult {
  const passed: RawPropertyData[] = [];
  const eliminated: FilterResult['eliminated'] = [];

  for (const prop of properties) {
    const reasons: string[] = [];

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
    // Soft amenities handled via amenitiesScore; only "beachfront" is a hard filter
    if (
      prefs.mustHaveAmenities.includes('beachfront') &&
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
