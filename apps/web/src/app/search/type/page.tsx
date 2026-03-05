'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/search-context';
import { cn } from '@/lib/utils';
import type { ResortType, MustHaveAmenity, ComplaintCategory } from '@travel-buddy/types';

const RESORT_TYPES: { value: ResortType; label: string; icon: string; desc: string }[] = [
  { value: 'luxury', label: 'Luxury', icon: '👑', desc: '5-star, premium' },
  { value: 'boutique', label: 'Boutique', icon: '🏡', desc: 'Intimate & unique' },
  { value: 'eco', label: 'Eco-resort', icon: '🌿', desc: 'Nature & sustainability' },
  { value: 'adults-only', label: 'Adults-only', icon: '🍸', desc: 'No kids, pure zen' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', desc: 'Kids activities & pools' },
  { value: 'party', label: 'Party vibe', icon: '🎉', desc: 'Nightlife & energy' },
  { value: 'quiet', label: 'Quiet / Romantic', icon: '🕊️', desc: 'Peaceful & secluded' },
  { value: 'business', label: 'Business', icon: '💼', desc: 'Work-friendly facilities' },
  { value: 'all-inclusive', label: 'All-inclusive', icon: '🍽️', desc: 'Everything included' },
];

const AMENITIES: { value: MustHaveAmenity; label: string; icon: string }[] = [
  { value: 'beachfront', label: 'Beachfront', icon: '🏖️' },
  { value: 'private-pool', label: 'Private pool', icon: '🏊' },
  { value: 'breakfast-included', label: 'Breakfast included', icon: '🥣' },
  { value: 'free-cancellation', label: 'Free cancellation', icon: '✅' },
  { value: 'airport-transfer', label: 'Airport transfer', icon: '🚌' },
  { value: 'gym', label: 'Gym', icon: '💪' },
  { value: 'spa', label: 'Spa', icon: '🧖' },
  { value: 'kid-friendly', label: 'Kid-friendly', icon: '🧒' },
  { value: 'pet-friendly', label: 'Pet-friendly', icon: '🐾' },
  { value: 'good-wifi', label: 'Good WiFi', icon: '📶' },
];

const COMPLAINT_CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: 'noise', label: 'Noise' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'staff', label: 'Unfriendly staff' },
  { value: 'location', label: 'Poor location' },
];

export default function TypePage() {
  const router = useRouter();
  const { state, dispatch } = useSearch();

  const [selectedTypes, setSelectedTypes] = useState<ResortType[]>(
    state.typeFilters.resortTypes ?? [],
  );
  const [selectedAmenities, setSelectedAmenities] = useState<MustHaveAmenity[]>(
    state.typeFilters.mustHaveAmenities ?? [],
  );
  const [minRating, setMinRating] = useState(
    state.typeFilters.minRating ?? 8.0,
  );
  const [minReviews, setMinReviews] = useState(
    state.typeFilters.minReviewCount ?? 100,
  );
  const [avoidComplaints, setAvoidComplaints] = useState<ComplaintCategory[]>(
    state.typeFilters.avoidComplaintCategories ?? [],
  );

  function toggleType(t: ResortType) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  function toggleAmenity(a: MustHaveAmenity) {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  }

  function toggleComplaint(c: ComplaintCategory) {
    setAvoidComplaints((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function handleContinue() {
    dispatch({
      type: 'SET_TYPE_FILTERS',
      payload: {
        resortTypes: selectedTypes,
        mustHaveAmenities: selectedAmenities,
        minRating,
        minReviewCount: minReviews,
        avoidComplaintCategories: avoidComplaints,
      },
    });
    router.push('/search/priorities');
  }

  const isValid = selectedTypes.length > 0;

  return (
    <div className="animate-slide-up space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Resort Type 🏨</h1>
        <p className="text-gray-500">What kind of resort are you looking for?</p>
      </div>

      {/* Resort types */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800">Type (pick all that apply)</h2>
        <div className="grid grid-cols-3 gap-2">
          {RESORT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleType(type.value)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                selectedTypes.includes(type.value)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300',
              )}
            >
              <div className="text-xl mb-1">{type.icon}</div>
              <div className="text-xs font-semibold">{type.label}</div>
              <div
                className={cn(
                  'text-xs mt-0.5',
                  selectedTypes.includes(type.value) ? 'text-brand-200' : 'text-gray-400',
                )}
              >
                {type.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Must-haves */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800">Must-have amenities</h2>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <button
              key={amenity.value}
              onClick={() => toggleAmenity(amenity.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all',
                selectedAmenities.includes(amenity.value)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300',
              )}
            >
              <span>{amenity.icon}</span>
              {amenity.label}
            </button>
          ))}
        </div>
      </div>

      {/* Review quality */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-800">Review quality</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Minimum rating (0–10)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Min. number of reviews
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={minReviews}
              onChange={(e) => setMinReviews(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Avoid resorts with complaints about:
          </p>
          <div className="flex flex-wrap gap-2">
            {COMPLAINT_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => toggleComplaint(c.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                  avoidComplaints.includes(c.value)
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-red-300',
                )}
              >
                {avoidComplaints.includes(c.value) ? '✗ ' : ''}
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/search/dates')}
          className="px-6 py-4 rounded-2xl font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={cn(
            'flex-1 py-4 rounded-2xl font-semibold text-base transition-all',
            isValid
              ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
