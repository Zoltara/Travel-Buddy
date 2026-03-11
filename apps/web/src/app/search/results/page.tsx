'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getSearchById } from '@/lib/api';
import { ResortCard } from '@/components/resort-card';
import { Suspense } from 'react';
import { currencyForCountry } from '@travel-buddy/types';
import { useSearch } from '@/lib/search-context';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchId = searchParams.get('id');
  const { state } = useSearch();
  const selectedCurrency =
    state.dates.preferredCurrency ?? currencyForCountry(state.location.country);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', searchId],
    queryFn: () => getSearchById(searchId!),
    enabled: Boolean(searchId),
    staleTime: 1000 * 60 * 60,
  });

  if (!searchId) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No search found. Please start a new search.</p>
        <button
          onClick={() => router.push('/search/location')}
          className="mt-4 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700"
        >
          Start new search
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl mb-2">😕</p>
        <p className="text-gray-700 font-semibold">Something went wrong</p>
        <p className="text-gray-500 text-sm mt-1">
          {(error as Error)?.message ?? 'Please try again.'}
        </p>
        <button
          onClick={() => router.push('/search/priorities')}
          className="mt-4 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    const hasSearchData = data && data.totalPropertiesFound > 0;
    
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">No resorts found</h2>
        {hasSearchData ? (
          <div className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto space-y-2">
            <p>
              We found {data.totalPropertiesFound} properties, but all {data.filteredOut} were 
              eliminated by your filters.
            </p>
            <p className="font-medium text-gray-700 dark:text-slate-300">
              Try adjusting:
            </p>
            <ul className="text-left inline-block text-xs space-y-1">
              <li>• Lower your minimum rating (currently {state.typeFilters.minRating}/10)</li>
              <li>• Increase your budget (currently ${state.dates.budgetPerNightMin}-${state.dates.budgetPerNightMax}/night)</li>
              <li>• Enable &quot;flexible budget&quot;</li>
              <li>• Remove some must-have amenities</li>
              <li>• Try a different destination</li>
            </ul>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            We couldn&apos;t find any resorts for this location. Try a different destination
            or check that your API is running correctly.
          </p>
        )}
        <button
          onClick={() => router.push('/search/type')}
          className="mt-5 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          Adjust filters
        </button>
      </div>
    );
  }

  const locationLabel =
    state.location.city && state.location.country
      ? ` in ${state.location.city}, ${state.location.country}`
      : '';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          Your Top {data.results.length} Picks{locationLabel} ✨
        </h1>
        <p className="text-gray-500 text-sm">
          Ranked from {data.totalPropertiesFound} properties.{' '}
          {data.filteredOut > 0 && `${data.filteredOut} eliminated by your filters. `}
          Sources: {data.platformsQueried.join(', ')}.
          {data.platformsFailed.length > 0 && (
            <span className="text-amber-500">
              {' '}({data.platformsFailed.join(', ')} unavailable)
            </span>
          )}
        </p>
      </div>

      {/* Resort cards */}
      {data.results.map((resort) => (
        <ResortCard key={resort.name} resort={resort} currency={selectedCurrency} />
      ))}

      {/* New search */}
      <div className="pt-4 text-center">
        <button
          onClick={() => router.push('/search/location')}
          className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          🔄 Start a new search
        </button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Loading…</div>}>
      <ResultsContent />
    </Suspense>
  );
}
