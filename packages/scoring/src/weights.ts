// ─────────────────────────────────────────────────────────────────────────────
// Weight helpers
// ─────────────────────────────────────────────────────────────────────────────
import type { PriorityWeights } from '@travel-buddy/types';

/**
 * Take raw 1–5 slider values and return weights that sum to 1.0.
 */
export function normalizeWeights(
  raw: PriorityWeights,
): Record<keyof PriorityWeights, number> {
  const entries = Object.entries(raw) as [keyof PriorityWeights, number][];
  const total = entries.reduce((sum, [, v]) => sum + Math.max(0, v), 0);
  if (total === 0) {
    // Fall back to equal weights if all zeros
    const equal = 1 / entries.length;
    return Object.fromEntries(entries.map(([k]) => [k, equal])) as Record<
      keyof PriorityWeights,
      number
    >;
  }
  return Object.fromEntries(
    entries.map(([k, v]) => [k, Math.max(0, v) / total]),
  ) as Record<keyof PriorityWeights, number>;
}
