import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSearch } from '@/lib/search-context';
import type { ResortType, MustHaveAmenity, ComplaintCategory } from '@travel-buddy/types';

const RESORT_TYPES: { value: ResortType; label: string; icon: string }[] = [
  { value: 'luxury', label: 'Luxury', icon: '👑' },
  { value: 'boutique', label: 'Boutique', icon: '🏡' },
  { value: 'eco', label: 'Eco-resort', icon: '🌿' },
  { value: 'adults-only', label: 'Adults-only', icon: '🍸' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'party', label: 'Party', icon: '🎉' },
  { value: 'quiet', label: 'Quiet', icon: '🕊️' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'all-inclusive', label: 'All-inclusive', icon: '🍽️' },
];

const AMENITIES: { value: MustHaveAmenity; label: string; icon: string }[] = [
  { value: 'beachfront', label: 'Beachfront', icon: '🏖️' },
  { value: 'private-pool', label: 'Pool', icon: '🏊' },
  { value: 'breakfast-included', label: 'Breakfast', icon: '🥣' },
  { value: 'free-cancellation', label: 'Free cancel', icon: '✅' },
  { value: 'airport-transfer', label: 'Airport transfer', icon: '🚌' },
  { value: 'gym', label: 'Gym', icon: '💪' },
  { value: 'spa', label: 'Spa', icon: '🧖' },
  { value: 'kid-friendly', label: 'Kid-friendly', icon: '🧒' },
  { value: 'pet-friendly', label: 'Pet-friendly', icon: '🐾' },
  { value: 'good-wifi', label: 'WiFi', icon: '📶' },
];

const COMPLAINTS: { value: ComplaintCategory; label: string }[] = [
  { value: 'noise', label: 'Noise' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'staff', label: 'Staff' },
  { value: 'location', label: 'Location' },
];

export default function TypeScreen() {
  const router = useRouter();
  const { state, dispatch } = useSearch();

  const [types, setTypes] = useState<ResortType[]>(state.typeFilters.resortTypes ?? []);
  const [amenities, setAmenities] = useState<MustHaveAmenity[]>(state.typeFilters.mustHaveAmenities ?? []);
  const [minRating, setMinRating] = useState(state.typeFilters.minRating ?? 8.0);
  const [minReviews, setMinReviews] = useState(state.typeFilters.minReviewCount ?? 100);
  const [avoidComplaints, setAvoidComplaints] = useState<ComplaintCategory[]>(state.typeFilters.avoidComplaintCategories ?? []);

  const toggle = <T extends string>(list: T[], val: T, setList: (l: T[]) => void) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  function handleContinue() {
    dispatch({
      type: 'SET_TYPE_FILTERS',
      payload: { resortTypes: types, mustHaveAmenities: amenities, minRating, minReviewCount: minReviews, avoidComplaintCategories: avoidComplaints },
    });
    router.push('/(search)/priorities');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Resort Type 🏨</Text>

      <Text style={styles.sectionLabel}>Type (pick all that apply)</Text>
      <View style={styles.grid}>
        {RESORT_TYPES.map((t) => {
          const active = types.includes(t.value);
          return (
            <TouchableOpacity key={t.value} onPress={() => toggle(types, t.value, setTypes)} style={[styles.typeCard, active && styles.typeCardActive]}>
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Must-have amenities</Text>
      <View style={styles.chips}>
        {AMENITIES.map((a) => {
          const active = amenities.includes(a.value);
          return (
            <TouchableOpacity key={a.value} onPress={() => toggle(amenities, a.value, setAmenities)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={styles.chipIcon}>{a.icon}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Review quality</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Min rating (0–10)</Text>
          <TextInput value={String(minRating)} onChangeText={(t) => setMinRating(parseFloat(t) || 0)} keyboardType="numeric" style={styles.input} />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Min reviews</Text>
          <TextInput value={String(minReviews)} onChangeText={(t) => setMinReviews(parseInt(t, 10) || 0)} keyboardType="numeric" style={styles.input} />
        </View>
      </View>

      <Text style={styles.label}>Avoid complaints about:</Text>
      <View style={styles.chips}>
        {COMPLAINTS.map((c) => {
          const active = avoidComplaints.includes(c.value);
          return (
            <TouchableOpacity key={c.value} onPress={() => toggle(avoidComplaints, c.value, setAvoidComplaints)} style={[styles.chip, active && styles.chipDanger]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{active ? '✗ ' : ''}{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={types.length === 0}
          style={[styles.button, types.length === 0 && styles.buttonDisabled, { flex: 1 }]}
        >
          <Text style={styles.buttonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: { width: '30%', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center' },
  typeCardActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  typeIcon: { fontSize: 22, marginBottom: 4 },
  typeLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  typeLabelActive: { color: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  chipDanger: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff', color: '#111827' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  button: { backgroundColor: '#0284c7', padding: 16, borderRadius: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#e5e7eb' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
