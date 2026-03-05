'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useSearch } from '@/lib/search-context';
import { submitSearch } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { PriorityKey, PriorityWeights } from '@travel-buddy/types';
import { toast } from 'sonner';

const PRIORITIES: { key: PriorityKey; label: string; icon: string; desc: string }[] = [
  { key: 'price', label: 'Price', icon: '💰', desc: 'Value for money matters most' },
  { key: 'location', label: 'Location', icon: '📍', desc: 'Closeness to beach / attractions' },
  { key: 'cleanliness', label: 'Cleanliness', icon: '✨', desc: 'Spotless rooms & facilities' },
  { key: 'luxury', label: 'Luxury level', icon: '👑', desc: 'Premium amenities & service' },
  { key: 'privacy', label: 'Privacy', icon: '🔒', desc: 'Secluded, exclusive feel' },
  { key: 'views', label: 'Views', icon: '🌅', desc: 'Ocean, mountain, or city views' },
  { key: 'amenities', label: 'Amenities', icon: '🏊', desc: 'Pool, spa, gym, etc.' },
  { key: 'reviewQuality', label: 'Review quality', icon: '⭐', desc: 'High ratings & many reviews' },
];

const LABELS = ['Not important', 'Low', 'Medium', 'High', 'Critical'];

export default function PrioritiesPage() {
  const router = useRouter();
  const { state, dispatch, buildPreferences } = useSearch();

  const [weights, setWeights] = useState<PriorityWeights>(
    state.priorities.weights ?? {
      price: 3, location: 3, cleanliness: 3, luxury: 3,
      privacy: 3, views: 3, amenities: 3, reviewQuality: 3,
    },
  );

  const mutation = useMutation({
    mutationFn: submitSearch,
    onSuccess: (data) => {
      router.push(`/search/results?id=${data.searchId}`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Search failed. Please try again.');
    },
  });

  function setWeight(key: PriorityKey, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearch() {
    dispatch({ type: 'SET_PRIORITIES', payload: { weights } });

    // Build preferences from updated state + new weights
    const prefs = buildPreferences();

    if (!prefs) {
      toast.error('Please complete all previous steps before searching.');
      router.push('/search/location');
      return;
    }

    // Override weights with current slider values
    mutation.mutate({ ...prefs, weights });
  }

  return (
    <div className="animate-slide-up space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Your Priorities 🎯</h1>
        <p className="text-gray-500">
          Slide each factor from 1 (doesn&apos;t matter) to 5 (critical).
          We&apos;ll weight the scoring accordingly.
        </p>
      </div>

      <div className="space-y-5">
        {PRIORITIES.map((p) => {
          const value = weights[p.key];
          return (
            <div key={p.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{p.label}</p>
                    <p className="text-xs text-gray-400">{p.desc}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    value >= 5
                      ? 'bg-brand-600 text-white'
                      : value >= 4
                      ? 'bg-brand-100 text-brand-700'
                      : value >= 3
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-gray-50 text-gray-500',
                  )}
                >
                  {LABELS[value - 1]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={value}
                onChange={(e) => setWeight(p.key, parseInt(e.target.value, 10))}
                className="w-full h-2 appearance-none bg-gray-200 rounded-full cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1 – Not important</span>
                <span>5 – Critical</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/search/type')}
          className="px-6 py-4 rounded-2xl font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleSearch}
          disabled={mutation.isPending}
          className={cn(
            'flex-1 py-4 rounded-2xl font-semibold text-base transition-all',
            mutation.isPending
              ? 'bg-brand-400 text-white cursor-wait'
              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200',
          )}
        >
          {mutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Searching {state.location.city}…
            </span>
          ) : (
            '🔍 Find My 3 Resorts'
          )}
        </button>
      </div>
    </div>
  );
}
