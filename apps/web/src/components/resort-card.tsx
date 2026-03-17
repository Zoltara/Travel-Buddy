'use client';

import Image from 'next/image';
import {
  convertFromUsd,
  formatMoney,
  type CurrencyCode,
  type ScoredResort,
} from '@travel-buddy/types';
import { cn } from '@/lib/utils';

interface ResortCardProps {
  resort: ScoredResort;
  currency?: CurrencyCode;
}

const RANK_STYLES = {
  1: { badge: 'bg-amber-400 text-white', border: 'border-amber-200' },
  2: { badge: 'bg-gray-400 text-white', border: 'border-gray-200' },
  3: { badge: 'bg-orange-400 text-white', border: 'border-orange-200' },
};

const RANK_LABELS = { 1: '🏆 Best match', 2: '🥈 Runner-up', 3: '🥉 3rd pick' };

export function ResortCard({ resort, currency = 'USD' }: ResortCardProps) {
  const styles = RANK_STYLES[resort.rank];
  const label = RANK_LABELS[resort.rank];

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow',
        styles.border,
      )}
    >
      {/* Photo banner */}
      <div className="relative h-48 bg-gradient-to-br from-brand-100 to-sand-100">
        {resort.photoUrl ? (
          <Image
            src={resort.photoUrl}
            alt={resort.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
            🏖️
          </div>
        )}
        {/* Rank badge */}
        <div className={cn('absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold', styles.badge)}>
          {label}
        </div>
        {/* Score pill */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-800">
          {resort.score.totalScore.toFixed(1)}/10
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Name + location */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">{resort.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            📍 {resort.city}, {resort.country}
            {resort.distanceFromBeach !== undefined && (
              <span className="ml-2 text-brand-600">
                · {resort.distanceFromBeach.toFixed(1)} km from beach
              </span>
            )}
          </p>
        </div>

        {/* Key stats */}
        <div className="flex flex-wrap gap-3">
          {resort.aggregatedPricePerNight !== null && (
            <Stat
              icon="💵"
              value={`${formatMoney(convertFromUsd(resort.aggregatedPricePerNight, currency), currency)}/night`}
              label="Price"
            />
          )}
          {resort.aggregatedRating !== null && (
            <Stat
              icon="⭐"
              value={`${resort.aggregatedRating.toFixed(1)}/10`}
              label={
                resort.aggregatedReviewCount
                  ? `${resort.aggregatedReviewCount.toLocaleString()} reviews`
                  : 'Rating'
              }
            />
          )}
        </div>

        {/* Why selected */}
        <div className="bg-brand-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1">
            Why we picked this
          </p>
          <p className="text-sm text-brand-900">{resort.whySelected}</p>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              ✅ Pros
            </p>
            {resort.pros.map((pro, i) => (
              <p key={i} className="text-xs text-gray-700 flex gap-1">
                <span className="text-green-500 mt-0.5">•</span>
                {pro}
              </p>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
              ⚠️ Cons
            </p>
            {resort.cons.map((con, i) => (
              <p key={i} className="text-xs text-gray-700 flex gap-1">
                <span className="text-red-400 mt-0.5">•</span>
                {con}
              </p>
            ))}
          </div>
        </div>

        {/* Score breakdown (collapsed) */}
        <ScoreBreakdown score={resort.score} />

        {/* Booking links */}
        <div className="flex gap-2 flex-wrap pt-1">
          <a
            href={resort.primaryBookingRef.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl text-center hover:bg-brand-700 transition-colors"
          >
            {resort.primaryBookingRef.platform === 'google-places'
              ? '📍 View on Google Maps →'
              : 'Book Now →'}
          </a>
          {resort.platforms
            .filter((p) => p.platform !== resort.primaryBookingRef.platform && p.bookingUrl)
            .slice(0, 2)
            .map((p) => (
              <a
                key={p.platform}
                href={p.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-3 border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors capitalize"
              >
                {p.platform}
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl">
      <span>{icon}</span>
      <div>
        <p className="text-sm font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function ScoreBreakdown({ score }: { score: ScoredResort['score'] }) {
  const factors = [
    { label: 'Price', value: score.priceScore },
    { label: 'Location', value: score.locationScore },
    { label: 'Rating', value: score.ratingScore },
    { label: 'Trust', value: score.trustScore },
    { label: 'Amenities', value: score.amenitiesScore },
  ];

  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-gray-400 font-medium hover:text-gray-600 flex items-center gap-1">
        <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
        View score breakdown
      </summary>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {factors.map((f) => (
          <div key={f.label} className="text-center">
            <div className="text-xs font-bold text-gray-700">{f.value.toFixed(1)}</div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-0.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full"
                style={{ width: `${(f.value / 10) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{f.label}</div>
          </div>
        ))}
      </div>
      {score.complaintPenalty > 0 && (
        <p className="text-xs text-red-500 mt-1">
          −{score.complaintPenalty.toFixed(1)} complaint penalty applied
        </p>
      )}
    </details>
  );
}
