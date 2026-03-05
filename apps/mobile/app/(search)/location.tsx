import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSearch } from '@/lib/search-context';

const POPULAR = [
  { city: 'Koh Samui', country: 'Thailand' },
  { city: 'Bali', country: 'Indonesia' },
  { city: 'Maldives', country: 'Maldives' },
  { city: 'Phuket', country: 'Thailand' },
  { city: 'Cancún', country: 'Mexico' },
  { city: 'Santorini', country: 'Greece' },
  { city: 'Tulum', country: 'Mexico' },
  { city: 'Dubai', country: 'UAE' },
];

export default function LocationScreen() {
  const router = useRouter();
  const { state, dispatch } = useSearch();
  const [city, setCity] = useState(state.location.city ?? '');
  const [country, setCountry] = useState(state.location.country ?? '');
  const [area, setArea] = useState(state.location.area ?? '');
  const [maxBeach, setMaxBeach] = useState(
    state.location.maxDistanceFromBeach?.toString() ?? '',
  );

  const isValid = city.trim() && country.trim();

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
    router.push('/(search)/dates');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Where are you going? 🌍</Text>
      <Text style={styles.subtext}>Pick a destination and we'll do the rest.</Text>

      <Text style={styles.sectionLabel}>Popular destinations</Text>
      <View style={styles.chips}>
        {POPULAR.map((dest) => {
          const active = city === dest.city && country === dest.country;
          return (
            <TouchableOpacity
              key={`${dest.city}-${dest.country}`}
              onPress={() => { setCity(dest.city); setCountry(dest.country); }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {dest.city}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>City / Island *</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="e.g. Koh Samui"
        style={styles.input}
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Country *</Text>
      <TextInput
        value={country}
        onChangeText={setCountry}
        placeholder="e.g. Thailand"
        style={styles.input}
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Specific area (optional)</Text>
      <TextInput
        value={area}
        onChangeText={setArea}
        placeholder="e.g. Chaweng Beach"
        style={styles.input}
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Max distance from beach in km (optional)</Text>
      <TextInput
        value={maxBeach}
        onChangeText={setMaxBeach}
        placeholder="e.g. 2"
        keyboardType="numeric"
        style={styles.input}
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity
        onPress={handleContinue}
        disabled={!isValid}
        style={[styles.button, !isValid && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Continue →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtext: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff', color: '#111827' },
  button: { marginTop: 28, backgroundColor: '#0284c7', padding: 16, borderRadius: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#e5e7eb' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
