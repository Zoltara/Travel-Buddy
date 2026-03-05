import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getSearchById } from '@/lib/api';
import {
  convertFromUsd,
  currencyForCountry,
  formatMoney,
  type CurrencyCode,
  type ScoredResort,
} from '@travel-buddy/types';
import { useSearch } from '@/lib/search-context';

const RANK_LABELS: Record<number, string> = {
  1: '🏆 Best match',
  2: '🥈 Runner-up',
  3: '🥉 3rd pick',
};

const RANK_COLORS: Record<number, string> = {
  1: '#f59e0b',
  2: '#9ca3af',
  3: '#f97316',
};

export default function ResultsScreen() {
  const router = useRouter();
  const { state } = useSearch();
  const { id } = useLocalSearchParams<{ id: string }>();
  const selectedCurrency =
    state.dates.preferredCurrency ?? currencyForCountry(state.location.country);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', id],
    queryFn: () => getSearchById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Searching resorts…</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{(error as Error)?.message ?? 'Please try again.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (data.results.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>🔍</Text>
        <Text style={styles.errorTitle}>No resorts found</Text>
        <Text style={styles.errorText}>Try relaxing your filters or increasing your budget.</Text>
        <TouchableOpacity onPress={() => router.push('/(search)/type')} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Adjust filters</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.meta}>
        {data.totalPropertiesFound} properties found · {data.filteredOut} filtered out ·{' '}
        Sources: {data.platformsQueried.join(', ')}
      </Text>

      {data.results.map((resort) => (
        <ResortCard key={resort.name} resort={resort} currency={selectedCurrency} />
      ))}

      <TouchableOpacity onPress={() => router.push('/(search)/location')} style={styles.newSearchBtn}>
        <Text style={styles.newSearchText}>🔄 New search</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ResortCard({ resort, currency }: { resort: ScoredResort; currency: CurrencyCode }) {
  const rankColor = RANK_COLORS[resort.rank] ?? '#9ca3af';
  const rankLabel = RANK_LABELS[resort.rank] ?? `#${resort.rank}`;

  return (
    <View style={[styles.card, { borderTopColor: rankColor, borderTopWidth: 4 }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Text style={styles.rankBadgeText}>{rankLabel}</Text>
        </View>
        <View style={[styles.scoreBadge]}>
          <Text style={styles.scoreBadgeText}>{resort.score.totalScore.toFixed(1)}/10</Text>
        </View>
      </View>

      <Text style={styles.resortName}>{resort.name}</Text>
      <Text style={styles.resortLocation}>📍 {resort.city}, {resort.country}</Text>

      <View style={styles.statsRow}>
        {resort.aggregatedPricePerNight !== null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatMoney(convertFromUsd(resort.aggregatedPricePerNight, currency), currency)}</Text>
            <Text style={styles.statLabel}>per night</Text>
          </View>
        )}
        {resort.aggregatedRating !== null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>⭐ {resort.aggregatedRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{resort.aggregatedReviewCount?.toLocaleString() ?? '?'} reviews</Text>
          </View>
        )}
      </View>

      <View style={styles.whyBox}>
        <Text style={styles.whyLabel}>WHY WE PICKED THIS</Text>
        <Text style={styles.whyText}>{resort.whySelected}</Text>
      </View>

      <View style={styles.prosCons}>
        <View style={styles.prosCol}>
          <Text style={styles.prosLabel}>✅ Pros</Text>
          {resort.pros.map((pro, i) => (
            <Text key={i} style={styles.proItem}>• {pro}</Text>
          ))}
        </View>
        <View style={styles.consCol}>
          <Text style={styles.consLabel}>⚠️ Cons</Text>
          {resort.cons.map((con, i) => (
            <Text key={i} style={styles.conItem}>• {con}</Text>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => Linking.openURL(resort.primaryBookingRef.bookingUrl)}
        style={styles.bookBtn}
      >
        <Text style={styles.bookBtnText}>Book Now →</Text>
      </TouchableOpacity>

      {resort.platforms.filter((p) => p.platform !== resort.primaryBookingRef.platform && p.bookingUrl).slice(0, 2).map((p) => (
        <TouchableOpacity key={p.platform} onPress={() => Linking.openURL(p.bookingUrl)} style={styles.altLink}>
          <Text style={styles.altLinkText}>Also on {p.platform} →</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 15 },
  errorIcon: { fontSize: 40, marginBottom: 8 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  errorText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#0284c7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  meta: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rankBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  rankBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: '#f3f4f6' },
  scoreBadgeText: { fontWeight: '700', fontSize: 13, color: '#374151' },
  resortName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  resortLocation: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 10, padding: 10 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  whyBox: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginBottom: 12 },
  whyLabel: { fontSize: 10, fontWeight: '700', color: '#1d4ed8', letterSpacing: 0.5, marginBottom: 4 },
  whyText: { fontSize: 13, color: '#1e40af', lineHeight: 18 },
  prosCons: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  prosCol: { flex: 1 },
  consCol: { flex: 1 },
  prosLabel: { fontSize: 11, fontWeight: '700', color: '#16a34a', marginBottom: 4 },
  consLabel: { fontSize: 11, fontWeight: '700', color: '#dc2626', marginBottom: 4 },
  proItem: { fontSize: 12, color: '#374151', marginBottom: 3, lineHeight: 16 },
  conItem: { fontSize: 12, color: '#374151', marginBottom: 3, lineHeight: 16 },
  bookBtn: { backgroundColor: '#0284c7', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  altLink: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', marginBottom: 6 },
  altLinkText: { fontSize: 13, color: '#6b7280', fontWeight: '600', textTransform: 'capitalize' },
  newSearchBtn: { marginTop: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  newSearchText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
});
