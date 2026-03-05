import type { RawPropertyData, ScoredResort, ScoreBreakdown, SearchPreferences } from '@travel-buddy/types';
/**
 * Score a single RawPropertyData against user preferences.
 * Returns a ScoreBreakdown without ranking (rank is assigned later).
 */
export declare function scoreProperty(prop: RawPropertyData, prefs: SearchPreferences): ScoreBreakdown;
/**
 * Score all passed properties and return the top 3 as ScoredResort[].
 * Caller is responsible for already applying hard filters.
 */
export declare function rankTopThree(properties: RawPropertyData[], prefs: SearchPreferences): ScoredResort[];
//# sourceMappingURL=score.d.ts.map