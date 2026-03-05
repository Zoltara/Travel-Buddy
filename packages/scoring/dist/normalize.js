// ─────────────────────────────────────────────────────────────────────────────
// Normalization helpers  (everything to 0–10 scale)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Clamp a value to [min, max] then scale to 0–10.
 * Returns 0 if min === max (degenerate range).
 */
export function minMaxNormalize(value, min, max) {
    if (max === min)
        return 0;
    return Math.max(0, Math.min(10, ((value - min) / (max - min)) * 10));
}
/**
 * Price score: cheaper is better.
 * The cheapest property in-range gets 10, the most expensive gets 0.
 * Properties outside the user's budget range are excluded upstream (filter step).
 */
export function calcPriceScore(pricePerNight, budgetMin, budgetMax) {
    if (budgetMax === budgetMin)
        return 10;
    // Invert: lower price → higher score
    const inverted = budgetMax - pricePerNight;
    const range = budgetMax - budgetMin;
    return Math.max(0, Math.min(10, (inverted / range) * 10));
}
/**
 * Rating score (0–10 → 0–10 linear).
 */
export function calcRatingScore(rating) {
    return Math.max(0, Math.min(10, rating));
}
/**
 * Trust score: log-normalized review count.
 * We use log10 so 10 reviews → ~1, 100 → ~5, 1000 → ~7.5, 10000 → ~10
 * Capped at 10.
 */
export function calcTrustScore(reviewCount) {
    if (reviewCount <= 0)
        return 0;
    const score = (Math.log10(reviewCount) / Math.log10(10_000)) * 10;
    return Math.max(0, Math.min(10, score));
}
/**
 * Location score: closer is better.
 * 0 km → 10, maxAllowed km → 0.  Anything beyond maxAllowed is excluded upstream.
 */
export function calcLocationScore(distanceKm, maxAllowedKm) {
    if (distanceKm === undefined)
        return 5; // neutral if unknown
    if (maxAllowedKm <= 0)
        return distanceKm === 0 ? 10 : 0;
    return Math.max(0, 10 - (distanceKm / maxAllowedKm) * 10);
}
/**
 * Amenities match score: what fraction of requested amenities does this have?
 */
export function calcAmenitiesScore(confirmedAmenities, requestedAmenities) {
    if (requestedAmenities.length === 0)
        return 10;
    const matched = requestedAmenities.filter((a) => confirmedAmenities.includes(a)).length;
    return (matched / requestedAmenities.length) * 10;
}
/**
 * Complaint penalty: deduct 1.5 per flagged category that appears
 * with mentionRate > 5% in reviews.
 */
export function calcComplaintPenalty(complaintSummaries, avoidCategories) {
    let penalty = 0;
    for (const summary of complaintSummaries) {
        if (avoidCategories.includes(summary.category) &&
            summary.mentionRate > 0.05) {
            penalty += 1.5;
        }
    }
    return penalty;
}
//# sourceMappingURL=normalize.js.map