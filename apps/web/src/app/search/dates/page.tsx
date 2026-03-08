'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/search-context';
import { cn } from '@/lib/utils';
import {
  SUPPORTED_CURRENCIES,
  convertFromUsd,
  convertToUsd,
  currencyForCountry,
  formatMoney,
  type CurrencyCode,
} from '@travel-buddy/types';

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayIso(): string {
  return todayPlus(0);
}

function addDays(date: string, days: number): string {
  const parsed = parseDateOnly(date);
  if (!parsed) return todayPlus(days);
  const d = new Date(parsed.y, parsed.m - 1, parsed.d);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateOnly(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    y: Number(match[1]),
    m: Number(match[2]),
    d: Number(match[3]),
  };
}

function diffNights(checkIn: string, checkOut: string): number {
  const inParts = parseDateOnly(checkIn);
  const outParts = parseDateOnly(checkOut);
  if (!inParts || !outParts) return 0;

  const inUtc = Date.UTC(inParts.y, inParts.m - 1, inParts.d);
  const outUtc = Date.UTC(outParts.y, outParts.m - 1, outParts.d);
  return Math.max(0, Math.floor((outUtc - inUtc) / (1000 * 60 * 60 * 24)));
}

export default function DatesPage() {
  const router = useRouter();
  const { state, dispatch } = useSearch();

  const [checkIn, setCheckIn] = useState(
    state.dates.checkIn ?? todayIso(),
  );
  const [checkOut, setCheckOut] = useState(
    state.dates.checkOut ?? addDays(state.dates.checkIn ?? todayIso(), 1),
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    state.dates.preferredCurrency ?? currencyForCountry(state.location.country),
  );

  const initialBudgetMin = useMemo(
    () =>
      Math.round(
        convertFromUsd(state.dates.budgetPerNightMin ?? 100, currency),
      ),
    [state.dates.budgetPerNightMin, currency],
  );
  const initialBudgetMax = useMemo(
    () =>
      Math.round(
        convertFromUsd(state.dates.budgetPerNightMax ?? 400, currency),
      ),
    [state.dates.budgetPerNightMax, currency],
  );
  const [guests, setGuests] = useState(state.dates.guests ?? 2);
  const [budgetMin, setBudgetMin] = useState(initialBudgetMin);
  const [budgetMax, setBudgetMax] = useState(initialBudgetMax);
  const [flexible, setFlexible] = useState(
    state.dates.flexibleBudget ?? false,
  );

  const nights = checkIn && checkOut ? diffNights(checkIn, checkOut) : 0;

  const totalEstimate = budgetMax * nights;

  const isValid =
    checkIn &&
    checkOut &&
    nights > 0 &&
    guests >= 1 &&
    budgetMin >= 0 &&
    budgetMax >= budgetMin;

  function handleContinue() {
    dispatch({
      type: 'SET_DATES',
      payload: {
        checkIn,
        checkOut,
        guests,
        budgetPerNightMin: Math.round(convertToUsd(budgetMin, currency)),
        budgetPerNightMax: Math.round(convertToUsd(budgetMax, currency)),
        preferredCurrency: currency,
        flexibleBudget: flexible,
      },
    });
    router.push('/search/type');
  }

  return (
    <div className="animate-slide-up space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">When & Budget 📅</h1>
        <p className="text-gray-500">
          We&apos;ll only show available resorts in your range.
        </p>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-800">Trip dates</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={todayIso()}
              onChange={(e) => {
                const nextCheckIn = e.target.value;
                setCheckIn(nextCheckIn);

                // Keep checkout anchored to check-in if it becomes invalid.
                if (!checkOut || checkOut <= nextCheckIn) {
                  setCheckOut(addDays(nextCheckIn, 1));
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={addDays(checkIn || todayIso(), 1)}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        {nights > 0 && (
          <p className="text-sm text-brand-600 font-medium">
            📆 {nights} night{nights !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Guests */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800">Guests</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setGuests(Math.max(1, guests - 1))}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50"
          >
            −
          </button>
          <span className="text-2xl font-bold text-gray-900 w-12 text-center">
            {guests}
          </span>
          <button
            onClick={() => setGuests(Math.min(20, guests + 1))}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50"
          >
            +
          </button>
          <span className="text-gray-500 text-sm">
            {guests === 1 ? 'guest' : 'guests'}
          </span>
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Budget per night ({currency})</h2>
          <select
            value={currency}
            onChange={(e) => {
              const nextCurrency = e.target.value as CurrencyCode;
              const minUsd = convertToUsd(budgetMin, currency);
              const maxUsd = convertToUsd(budgetMax, currency);
              setCurrency(nextCurrency);
              setBudgetMin(Math.round(convertFromUsd(minUsd, nextCurrency)));
              setBudgetMax(Math.round(convertFromUsd(maxUsd, nextCurrency)));
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Min ({currency})</label>
            <input
              type="number"
              min={0}
              max={budgetMax}
              value={budgetMin}
              onChange={(e) => setBudgetMin(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Max ({currency})</label>
            <input
              type="number"
              min={budgetMin}
              value={budgetMax}
              onChange={(e) => setBudgetMax(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {nights > 0 && (
          <p className="text-sm text-gray-500">
            Est. total up to{' '}
            <strong className="text-gray-800">
              {formatMoney(totalEstimate, currency)}
            </strong>{' '}
            for {nights} nights
          </p>
        )}

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setFlexible(!flexible)}
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative',
              flexible ? 'bg-brand-600' : 'bg-gray-200',
            )}
          >
            <div
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                flexible ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </div>
          <span className="text-sm text-gray-700">
            Flexible budget{' '}
            <span className="text-gray-400">(show slightly over budget)</span>
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/search/location')}
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
