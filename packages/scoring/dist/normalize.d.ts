/**
 * Clamp a value to [min, max] then scale to 0–10.
 * Returns 0 if min === max (degenerate range).
 */
export declare function minMaxNormalize(value: number, min: number, max: number): number;
/**
 * Price score: cheaper is better.
 * The cheapest property in-range gets 10, the most expensive gets 0.
 * Properties outside the user's budget range are excluded upstream (filter step).
 */
export declare function calcPriceScore(pricePerNight: number, budgetMin: number, budgetMax: number): number;
/**
 * Rating score (0–10 → 0–10 linear).
 */
export declare function calcRatingScore(rating: number): number;
/**
 * Trust score: log-normalized review count.
 * We use log10 so 10 reviews → ~1, 100 → ~5, 1000 → ~7.5, 10000 → ~10
 * Capped at 10.
 */
export declare function calcTrustScore(reviewCount: number): number;
/**
 * Location score: closer is better.
 * 0 km → 10, maxAllowed km → 0.  Anything beyond maxAllowed is excluded upstream.
 */
export declare function calcLocationScore(distanceKm: number | undefined, maxAllowedKm: number): number;
/**
 * Amenities match score: what fraction of requested amenities does this have?
 */
export declare function calcAmenitiesScore(confirmedAmenities: readonly string[], requestedAmenities: readonly string[]): number;
/**
 * Complaint penalty: deduct 1.5 per flagged category that appears
 * with mentionRate > 5% in reviews.
 */
export declare function calcComplaintPenalty(complaintSummaries: ReadonlyArray<{
    category: string;
    mentionRate: number;
}>, avoidCategories: readonly string[]): number;
//# sourceMappingURL=normalize.d.ts.map