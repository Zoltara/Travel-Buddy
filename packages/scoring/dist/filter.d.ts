import type { RawPropertyData, SearchPreferences } from '@travel-buddy/types';
export interface FilterResult {
    passed: RawPropertyData[];
    eliminated: Array<{
        property: RawPropertyData;
        reason: string;
    }>;
}
export declare function applyHardFilters(properties: RawPropertyData[], prefs: SearchPreferences): FilterResult;
//# sourceMappingURL=filter.d.ts.map