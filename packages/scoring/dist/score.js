import { convertFromUsd, currencyForCountry, formatMoney, } from '@travel-buddy/types';
import { calcPriceScore, calcRatingScore, calcTrustScore, calcLocationScore, calcAmenitiesScore, calcComplaintPenalty, } from './normalize.js';
import { normalizeWeights } from './weights.js';
// ── Internal helpers ─────────────────────────────────────────────────────────
function buildWhySelected(prop, breakdown, prefs) {
    const parts = [];
    const w = normalizeWeights(prefs.weights);
    const currency = prefs.preferredCurrency ?? currencyForCountry(prefs.country);
    if (w.price > 0.15 && breakdown.priceScore >= 7) {
        const amount = prop.aggregatedPricePerNight !== null
            ? formatMoney(convertFromUsd(prop.aggregatedPricePerNight, currency), currency)
            : '?';
        parts.push(`excellent value at ${amount}/night`);
    }
    if (prop.aggregatedRating !== null && prop.aggregatedRating >= 9) {
        parts.push(`outstanding guest rating of ${prop.aggregatedRating.toFixed(1)}/10`);
    }
    else if (prop.aggregatedRating !== null && prop.aggregatedRating >= 8) {
        parts.push(`strong guest rating of ${prop.aggregatedRating.toFixed(1)}/10`);
    }
    if (w.amenities > 0.1 && breakdown.amenitiesScore >= 8) {
        parts.push('matches most of your required amenities');
    }
    if (w.location > 0.1 && breakdown.locationScore >= 8) {
        parts.push('ideally located near the beach or city centre');
    }
    if (prop.aggregatedReviewCount !== null && prop.aggregatedReviewCount >= 500) {
        parts.push(`backed by ${prop.aggregatedReviewCount.toLocaleString()} verified reviews`);
    }
    if (parts.length === 0) {
        parts.push(`composite score of ${breakdown.totalScore.toFixed(1)}/10`);
    }
    return `Selected for its ${parts.join(', ')}.`;
}
function extractPros(prop, breakdown) {
    const pros = [];
    if (prop.aggregatedRating !== null && prop.aggregatedRating >= 8.5) {
        pros.push(`High guest rating: ${prop.aggregatedRating.toFixed(1)}/10`);
    }
    if (prop.confirmedAmenities.includes('beachfront')) {
        pros.push('Beachfront location');
    }
    if (prop.confirmedAmenities.includes('private-pool')) {
        pros.push('Private pool available');
    }
    if (prop.confirmedAmenities.includes('spa')) {
        pros.push('Full spa & wellness centre');
    }
    if (prop.confirmedAmenities.includes('breakfast-included')) {
        pros.push('Breakfast included');
    }
    if (prop.confirmedAmenities.includes('free-cancellation')) {
        pros.push('Free cancellation policy');
    }
    if (prop.aggregatedReviewCount !== null && prop.aggregatedReviewCount >= 1000) {
        pros.push(`Well-reviewed: ${prop.aggregatedReviewCount.toLocaleString()}+ ratings`);
    }
    if (breakdown.priceScore >= 7) {
        pros.push('Competitively priced for the category');
    }
    // Pad with generic if needed
    while (pros.length < 3) {
        pros.push('Good overall composite score');
    }
    return [pros[0], pros[1], pros[2]];
}
function extractCons(prop, prefs) {
    const cons = [];
    const missedAmenities = prefs.mustHaveAmenities.filter((a) => !prop.confirmedAmenities.includes(a));
    if (missedAmenities.length > 0) {
        cons.push(`Missing requested amenities: ${missedAmenities.slice(0, 2).join(', ')}`);
    }
    for (const summary of prop.complaintSummaries) {
        if (summary.mentionRate > 0.05) {
            cons.push(`${summary.category.charAt(0).toUpperCase() + summary.category.slice(1)} complaints in ~${Math.round(summary.mentionRate * 100)}% of reviews`);
        }
        if (cons.length >= 2)
            break;
    }
    if (prop.aggregatedPricePerNight !== null && prop.aggregatedPricePerNight > prefs.budgetPerNightMax * 0.9) {
        cons.push('Near the top of your budget range');
    }
    if (prop.distanceFromBeach !== undefined && prop.distanceFromBeach > 1) {
        cons.push(`${prop.distanceFromBeach.toFixed(1)} km from the beach`);
    }
    while (cons.length < 2) {
        cons.push('Limited data from some platforms');
    }
    return [cons[0], cons[1]];
}
function pickPrimaryBookingRef(platforms) {
    // Prefer booking.com > expedia > agoda > tripadvisor > google-places
    const priority = [
        'booking.com',
        'expedia',
        'agoda',
        'tripadvisor',
        'google-places',
    ];
    for (const p of priority) {
        const ref = platforms.find((pl) => pl.platform === p && pl.bookingUrl);
        if (ref)
            return ref;
    }
    return platforms[0];
}
// ── Public API ───────────────────────────────────────────────────────────────
/**
 * Score a single RawPropertyData against user preferences.
 * Returns a ScoreBreakdown without ranking (rank is assigned later).
 */
export function scoreProperty(prop, prefs) {
    const w = normalizeWeights(prefs.weights);
    const priceScore = prop.aggregatedPricePerNight !== null
        ? calcPriceScore(prop.aggregatedPricePerNight, prefs.budgetPerNightMin, prefs.budgetPerNightMax)
        : 5; // neutral if unknown
    const ratingScore = prop.aggregatedRating !== null ? calcRatingScore(prop.aggregatedRating) : 5;
    const trustScore = prop.aggregatedReviewCount !== null
        ? calcTrustScore(prop.aggregatedReviewCount)
        : 5;
    const locationScore = calcLocationScore(prop.distanceFromBeach ?? prop.distanceFromCenter, prefs.maxDistanceFromBeach ?? prefs.maxDistanceFromCenter ?? 10);
    const amenitiesScore = calcAmenitiesScore(prop.confirmedAmenities, prefs.mustHaveAmenities);
    const complaintPenalty = calcComplaintPenalty(prop.complaintSummaries, prefs.avoidComplaintCategories);
    // Map our PriorityKey groupings to the computed scores
    const rawTotal = w.price * priceScore +
        w.location * locationScore +
        w.cleanliness * ratingScore + // cleanliness proxied via rating
        w.luxury * ratingScore + // luxury proxied via rating
        w.privacy * amenitiesScore +
        w.views * locationScore + // views proxied via location
        w.amenities * amenitiesScore +
        w.reviewQuality * trustScore;
    // Renormalize: weights sum to 1, so rawTotal is already 0–10,
    // subtract penalty (min 0).
    const totalScore = Math.max(0, rawTotal - complaintPenalty);
    return {
        priceScore,
        locationScore,
        ratingScore,
        trustScore,
        amenitiesScore,
        complaintPenalty,
        totalScore,
    };
}
/**
 * Score all passed properties and return the top 3 as ScoredResort[].
 * Caller is responsible for already applying hard filters.
 */
export function rankTopThree(properties, prefs) {
    if (properties.length === 0)
        return [];
    const scored = properties.map((prop) => {
        const breakdown = scoreProperty(prop, prefs);
        return { prop, breakdown };
    });
    // Sort descending by totalScore
    scored.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);
    const top = scored.slice(0, 3);
    return top.map(({ prop, breakdown }, index) => {
        const rank = (index + 1);
        const primaryBookingRef = pickPrimaryBookingRef(prop.platforms);
        return {
            ...prop,
            rank,
            score: breakdown,
            primaryBookingRef,
            whySelected: buildWhySelected(prop, breakdown, prefs),
            pros: extractPros(prop, breakdown),
            cons: extractCons(prop, prefs),
        };
    });
}
//# sourceMappingURL=score.js.map