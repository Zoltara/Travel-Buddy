'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/search-context';
import { cn } from '@/lib/utils';

const POPULAR_DESTINATIONS = [
  { city: 'Koh Samui', country: 'Thailand' },
  { city: 'Bali', country: 'Indonesia' },
  { city: 'Maldives', country: 'Maldives' },
  { city: 'Phuket', country: 'Thailand' },
  { city: 'Cancún', country: 'Mexico' },
  { city: 'Santorini', country: 'Greece' },
  { city: 'Tulum', country: 'Mexico' },
  { city: 'Mykonos', country: 'Greece' },
  { city: 'Positano', country: 'Italy' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'Zanzibar', country: 'Tanzania' },
  { city: 'Fiji', country: 'Fiji' },
];

export default function LocationPage() {
  const router = useRouter();
  const { state, dispatch } = useSearch();
  const [city, setCity] = useState(state.location.city ?? '');
  const [country, setCountry] = useState(state.location.country ?? '');
  const [area, setArea] = useState(state.location.area ?? '');
  const [maxBeach, setMaxBeach] = useState(
    state.location.maxDistanceFromBeach?.toString() ?? '',
  );

  function handleQuickSelect(dest: { city: string; country: string }) {
    setCity(dest.city);
    setCountry(dest.country);
  }

  function handleContinue() {
    dispatch({
      type: 'SET_LOCATION',
      payload: {
        city,
        country,
        ...(area ? { area } : {}),
        ...(maxBeach ? { maxDistanceFromBeach: parseFloat(maxBeach) } : {}),
      },
    });
    router.push('/search/dates');
  }

  const isValid = city.trim().length > 0 && country.trim().length > 0;

  return (
    <div className="animate-slide-up space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          Where are you going? 🌍
        </h1>
        <p className="text-gray-500">
          Pick a destination and we&apos;ll do the rest.
        </p>
      </div>

      {/* Quick picks */}
      <div>
        <p className="text-sm font-medium text-gray-500 mb-3">Popular destinations</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={`${dest.city}-${dest.country}`}
              onClick={() => handleQuickSelect(dest)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                city === dest.city && country === dest.country
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:text-brand-700',
              )}
            >
              {dest.city}, {dest.country}
            </button>
          ))}
        </div>
      </div>

      {/* Manual inputs */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">City / Island *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Koh Samui"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Country *</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Thailand"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Specific area{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Chaweng Beach area"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Max distance from beach{' '}
            <span className="text-gray-400 font-normal">(km, optional)</span>
          </label>
          <input
            type="number"
            min={0}
            max={50}
            value={maxBeach}
            onChange={(e) => setMaxBeach(e.target.value)}
            placeholder="e.g. 2"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={!isValid}
        className={cn(
          'w-full py-4 rounded-2xl font-semibold text-base transition-all',
          isValid
            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed',
        )}
      >
        Continue →
      </button>
    </div>
  );
}
