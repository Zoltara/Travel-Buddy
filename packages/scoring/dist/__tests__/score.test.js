import { describe, it, expect } from 'vitest';
import { calcPriceScore, calcRatingScore, calcTrustScore, calcLocationScore, calcAmenitiesScore, calcComplaintPenalty, } from '../normalize.js';
import { normalizeWeights } from '../weights.js';
import { applyHardFilters } from '../filter.js';
import { scoreProperty, rankTopThree } from '../score.js';
// ── Fixtures ─────────────────────────────────────────────────────────────────
const basePrefs = {
    country: 'Thailand',
    city: 'Koh Samui',
    checkIn: '2026-04-01',
    checkOut: '2026-04-07',
    guests: 2,
    budgetPerNightMin: 100,
    budgetPerNightMax: 500,
    flexibleBudget: false,
    resortTypes: ['luxury'],
    mustHaveAmenities: ['beachfront', 'spa'],
    minRating: 8.0,
    minReviewCount: 100,
    avoidComplaintCategories: ['noise', 'cleanliness'],
    weights: {
        price: 3,
        location: 4,
        cleanliness: 3,
        luxury: 4,
        privacy: 2,
        views: 3,
        amenities: 4,
        reviewQuality: 3,
    },
};
function makeProperty(overrides = {}) {
    return {
        name: 'Test Resort',
        coordinates: { lat: 9.5, lng: 100.0 },
        address: '123 Beach Rd',
        country: 'Thailand',
        city: 'Koh Samui',
        resolvedTypes: ['luxury'],
        confirmedAmenities: ['beachfront', 'spa', 'gym'],
        platforms: [
            {
                platform: 'booking.com',
                propertyId: 'test-001',
                bookingUrl: 'https://booking.com/test',
                pricePerNight: 250,
                rating: 8.8,
                reviewCount: 500,
            },
        ],
        aggregatedRating: 8.8,
        aggregatedReviewCount: 500,
        aggregatedPricePerNight: 250,
        complaintSummaries: [],
        distanceFromBeach: 0,
        fetchedAt: new Date().toISOString(),
        ...overrides,
    };
}
// ── normalize.ts ─────────────────────────────────────────────────────────────
describe('calcPriceScore', () => {
    it('cheapest property in range scores 10', () => {
        expect(calcPriceScore(100, 100, 500)).toBeCloseTo(10);
    });
    it('most expensive property in range scores 0', () => {
        expect(calcPriceScore(500, 100, 500)).toBeCloseTo(0);
    });
    it('mid-range property scores 5', () => {
        expect(calcPriceScore(300, 100, 500)).toBeCloseTo(5);
    });
});
describe('calcRatingScore', () => {
    it('perfect rating returns 10', () => {
        expect(calcRatingScore(10)).toBe(10);
    });
    it('clamps below 0', () => {
        expect(calcRatingScore(-1)).toBe(0);
    });
});
describe('calcTrustScore', () => {
    it('zero reviews returns 0', () => {
        expect(calcTrustScore(0)).toBe(0);
    });
    it('10000+ reviews returns 10', () => {
        expect(calcTrustScore(10_000)).toBeCloseTo(10);
    });
});
describe('calcLocationScore', () => {
    it('0 km from beach returns 10', () => {
        expect(calcLocationScore(0, 5)).toBe(10);
    });
    it('distance equals max returns 0', () => {
        expect(calcLocationScore(5, 5)).toBe(0);
    });
    it('unknown distance returns 5 (neutral)', () => {
        expect(calcLocationScore(undefined, 5)).toBe(5);
    });
});
describe('calcAmenitiesScore', () => {
    it('all requested amenities present scores 10', () => {
        expect(calcAmenitiesScore(['beachfront', 'spa'], ['beachfront', 'spa'])).toBe(10);
    });
    it('none present scores 0', () => {
        expect(calcAmenitiesScore([], ['beachfront', 'spa'])).toBe(0);
    });
    it('no requirements scores 10', () => {
        expect(calcAmenitiesScore(['beachfront'], [])).toBe(10);
    });
});
describe('calcComplaintPenalty', () => {
    it('returns 0 when no complaints', () => {
        expect(calcComplaintPenalty([], ['noise'])).toBe(0);
    });
    it('penalizes matching complaint above threshold', () => {
        const penalty = calcComplaintPenalty([{ category: 'noise', mentionRate: 0.2 }], ['noise']);
        expect(penalty).toBe(1.5);
    });
    it('does not penalize below 5% threshold', () => {
        const penalty = calcComplaintPenalty([{ category: 'noise', mentionRate: 0.03 }], ['noise']);
        expect(penalty).toBe(0);
    });
});
// ── weights.ts ────────────────────────────────────────────────────────────────
describe('normalizeWeights', () => {
    it('sums to 1', () => {
        const w = normalizeWeights(basePrefs.weights);
        const total = Object.values(w).reduce((s, v) => s + v, 0);
        expect(total).toBeCloseTo(1);
    });
    it('handles all-zero input with equal weights', () => {
        const raw = { price: 0, location: 0, cleanliness: 0, luxury: 0, privacy: 0, views: 0, amenities: 0, reviewQuality: 0 };
        const w = normalizeWeights(raw);
        const total = Object.values(w).reduce((s, v) => s + v, 0);
        expect(total).toBeCloseTo(1);
    });
});
// ── filter.ts ─────────────────────────────────────────────────────────────────
describe('applyHardFilters', () => {
    it('passes a qualifying property', () => {
        const result = applyHardFilters([makeProperty()], basePrefs);
        expect(result.passed).toHaveLength(1);
        expect(result.eliminated).toHaveLength(0);
    });
    it('eliminates below-minimum rating', () => {
        const result = applyHardFilters([makeProperty({ aggregatedRating: 6.0 })], basePrefs);
        expect(result.passed).toHaveLength(0);
        expect(result.eliminated).toHaveLength(1);
    });
    it('eliminates property over budget (strict)', () => {
        const result = applyHardFilters([makeProperty({ aggregatedPricePerNight: 600 })], { ...basePrefs, flexibleBudget: false });
        expect(result.passed).toHaveLength(0);
    });
    it('allows over-budget when flexibleBudget=true', () => {
        const result = applyHardFilters([makeProperty({ aggregatedPricePerNight: 600 })], { ...basePrefs, flexibleBudget: true });
        expect(result.passed).toHaveLength(1);
    });
    it('eliminates non-beachfront when beachfront is required', () => {
        const result = applyHardFilters([makeProperty({ confirmedAmenities: ['spa'] })], basePrefs);
        expect(result.eliminated[0]?.reason).toContain('beachfront');
    });
});
// ── score.ts ──────────────────────────────────────────────────────────────────
describe('scoreProperty', () => {
    it('returns a breakdown with totalScore in 0–10 range', () => {
        const breakdown = scoreProperty(makeProperty(), basePrefs);
        expect(breakdown.totalScore).toBeGreaterThanOrEqual(0);
        expect(breakdown.totalScore).toBeLessThanOrEqual(10);
    });
    it('penalized resort scores lower', () => {
        const clean = makeProperty();
        const noisy = makeProperty({
            complaintSummaries: [{ category: 'noise', mentionRate: 0.3, mentionCount: 150 }],
        });
        const cleanScore = scoreProperty(clean, basePrefs).totalScore;
        const noisyScore = scoreProperty(noisy, basePrefs).totalScore;
        expect(cleanScore).toBeGreaterThan(noisyScore);
    });
});
describe('rankTopThree', () => {
    it('returns at most 3 results', () => {
        const props = Array.from({ length: 10 }, (_, i) => makeProperty({ name: `Resort ${i}`, aggregatedRating: 7 + i * 0.1 }));
        const results = rankTopThree(props, basePrefs);
        expect(results).toHaveLength(3);
    });
    it('assigns rank 1, 2, 3 in order', () => {
        const props = Array.from({ length: 5 }, (_, i) => makeProperty({ name: `Resort ${i}` }));
        const results = rankTopThree(props, basePrefs);
        expect(results.map((r) => r.rank)).toEqual([1, 2, 3]);
    });
    it('returns empty array for empty input', () => {
        expect(rankTopThree([], basePrefs)).toHaveLength(0);
    });
    it('each result has pros (3) and cons (2)', () => {
        const props = Array.from({ length: 3 }, (_, i) => makeProperty({ name: `Resort ${i}` }));
        const results = rankTopThree(props, basePrefs);
        for (const resort of results) {
            expect(resort.pros).toHaveLength(3);
            expect(resort.cons).toHaveLength(2);
        }
    });
});
//# sourceMappingURL=score.test.js.map