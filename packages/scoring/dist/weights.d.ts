import type { PriorityWeights } from '@travel-buddy/types';
/**
 * Take raw 1–5 slider values and return weights that sum to 1.0.
 */
export declare function normalizeWeights(raw: PriorityWeights): Record<keyof PriorityWeights, number>;
//# sourceMappingURL=weights.d.ts.map