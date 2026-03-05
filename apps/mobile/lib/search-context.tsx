import React, { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type {
  LocationPreferences,
  DateBudgetPreferences,
  TypeFilterPreferences,
  PriorityPreferences,
  SearchPreferences,
} from '@travel-buddy/types';

interface SearchState {
  location: Partial<LocationPreferences>;
  dates: Partial<DateBudgetPreferences>;
  typeFilters: Partial<TypeFilterPreferences>;
  priorities: Partial<PriorityPreferences>;
}

const defaultWeights = {
  price: 3, location: 3, cleanliness: 3, luxury: 3,
  privacy: 3, views: 3, amenities: 3, reviewQuality: 3,
};

const initialState: SearchState = {
  location: {},
  dates: { guests: 2, flexibleBudget: false, budgetPerNightMin: 100, budgetPerNightMax: 400, preferredCurrency: 'USD' },
  typeFilters: { resortTypes: [], mustHaveAmenities: [], minRating: 8.0, minReviewCount: 100, avoidComplaintCategories: [] },
  priorities: { weights: defaultWeights },
};

type Action =
  | { type: 'SET_LOCATION'; payload: Partial<LocationPreferences> }
  | { type: 'SET_DATES'; payload: Partial<DateBudgetPreferences> }
  | { type: 'SET_TYPE_FILTERS'; payload: Partial<TypeFilterPreferences> }
  | { type: 'SET_PRIORITIES'; payload: Partial<PriorityPreferences> }
  | { type: 'RESET' };

function reducer(state: SearchState, action: Action): SearchState {
  switch (action.type) {
    case 'SET_LOCATION': return { ...state, location: { ...state.location, ...action.payload } };
    case 'SET_DATES': return { ...state, dates: { ...state.dates, ...action.payload } };
    case 'SET_TYPE_FILTERS': return { ...state, typeFilters: { ...state.typeFilters, ...action.payload } };
    case 'SET_PRIORITIES': return { ...state, priorities: { ...state.priorities, ...action.payload } };
    case 'RESET': return initialState;
    default: return state;
  }
}

const SearchContext = createContext<{
  state: SearchState;
  dispatch: Dispatch<Action>;
  buildPreferences: () => SearchPreferences | null;
} | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function buildPreferences(): SearchPreferences | null {
    const { location, dates, typeFilters, priorities } = state;
    if (
      !location.country || !location.city ||
      !dates.checkIn || !dates.checkOut || !dates.guests ||
      dates.budgetPerNightMin === undefined || dates.budgetPerNightMax === undefined ||
      !typeFilters.resortTypes?.length || typeFilters.minRating === undefined ||
      typeFilters.minReviewCount === undefined || !priorities.weights
    ) return null;

    return {
      country: location.country, city: location.city,
      ...(location.area !== undefined ? { area: location.area } : {}),
      ...(location.maxDistanceFromBeach !== undefined ? { maxDistanceFromBeach: location.maxDistanceFromBeach } : {}),
      ...(location.maxDistanceFromCenter !== undefined ? { maxDistanceFromCenter: location.maxDistanceFromCenter } : {}),
      checkIn: dates.checkIn, checkOut: dates.checkOut,
      guests: dates.guests, budgetPerNightMin: dates.budgetPerNightMin,
      budgetPerNightMax: dates.budgetPerNightMax,
      ...(dates.preferredCurrency !== undefined ? { preferredCurrency: dates.preferredCurrency } : {}),
      flexibleBudget: dates.flexibleBudget ?? false,
      resortTypes: typeFilters.resortTypes, mustHaveAmenities: typeFilters.mustHaveAmenities ?? [],
      minRating: typeFilters.minRating, minReviewCount: typeFilters.minReviewCount,
      avoidComplaintCategories: typeFilters.avoidComplaintCategories ?? [],
      weights: priorities.weights,
    };
  }

  return (
    <SearchContext.Provider value={{ state, dispatch, buildPreferences }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
