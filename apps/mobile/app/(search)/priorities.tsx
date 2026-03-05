import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSearch } from '@/lib/search-context';
import { submitSearch } from '@/lib/api';
import type { PriorityKey, PriorityWeights } from '@travel-buddy/types';

const PRIORITIES: { key: PriorityKey; label: string; icon: string }[] = [
  { key: 'price', label: 'Price', icon: '💰' },
  { key: 'location', label: 'Location', icon: '📍' },
  { key: 'cleanliness', label: 'Cleanliness', icon: '✨' },
  { key: 'luxury', label: 'Luxury level', icon: '👑' },
  { key: 'privacy', label: 'Privacy', icon: '🔒' },
  { key: 'views', label: 'Views', icon: '🌅' },
  { key: 'amenities', label: 'Amenities', icon: '🏊' },
  { key: 'reviewQuality', label: 'Review quality', icon: '⭐' },
];

const LABELS = ['1 – Not important', '2 – Low', '3 – Medium', '4 – High', '5 – Critical'];

export default function PrioritiesScreen() {
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
      router.push(`/(search)/results?id=${data.searchId}`);
    },
    onError: (err: Error) => {
      Alert.alert('Search Failed', err.message ?? 'Please try again.');
    },
  });

  function setWeight(key: PriorityKey, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearch() {
    dispatch({ type: 'SET_PRIORITIES', payload: { weights } });
    const prefs = buildPreferences();
    if (!prefs) {
      Alert.alert('Incomplete', 'Please complete all previous steps.');
      router.push('/(search)/location');
      return;
    }
    mutation.mutate({ ...prefs, weights });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your Priorities 🎯</Text>
      <Text style={styles.subtext}>Tap a value 1–5 for each factor. We'll weight your results accordingly.</Text>

      {PRIORITIES.map((p) => (
        <View key={p.key} style={styles.priorityRow}>
          <View style={styles.priorityHeader}>
            <Text style={styles.priorityIcon}>{p.icon}</Text>
            <Text style={styles.priorityLabel}>{p.label}</Text>
            <Text style={styles.priorityValue}>{weights[p.key]}</Text>
          </View>
          <View style={styles.sliderRow}>
            {[1, 2, 3, 4, 5].map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setWeight(p.key, v)}
                style={[styles.sliderDot, weights[p.key] >= v && styles.sliderDotActive]}
              >
                <Text style={[styles.sliderDotText, weights[p.key] >= v && styles.sliderDotTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sliderHint}>{LABELS[weights[p.key] - 1]}</Text>
        </View>
      ))}

      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSearch}
          disabled={mutation.isPending}
          style={[styles.button, { flex: 1 }]}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🔍 Find My 3 Resorts</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtext: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  priorityRow: { marginBottom: 16, padding: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  priorityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  priorityIcon: { fontSize: 18, marginRight: 8 },
  priorityLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  priorityValue: { fontSize: 22, fontWeight: '800', color: '#0284c7' },
  sliderRow: { flexDirection: 'row', gap: 8 },
  sliderDot: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  sliderDotActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  sliderDotText: { fontSize: 15, fontWeight: '700', color: '#9ca3af' },
  sliderDotTextActive: { color: '#fff' },
  sliderHint: { marginTop: 6, fontSize: 11, color: '#9ca3af' },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  button: { backgroundColor: '#0284c7', padding: 16, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
