import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSearch } from '@/lib/search-context';
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

function parseDateOnly(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function diffNights(checkIn: string, checkOut: string): number {
  const inParts = parseDateOnly(checkIn);
  const outParts = parseDateOnly(checkOut);
  if (!inParts || !outParts) return 0;

  const inUtc = Date.UTC(inParts.y, inParts.m - 1, inParts.d);
  const outUtc = Date.UTC(outParts.y, outParts.m - 1, outParts.d);
  return Math.max(0, Math.floor((outUtc - inUtc) / 86400000));
}

export default function DatesScreen() {
  const router = useRouter();
  const { state, dispatch } = useSearch();

  const [checkIn, setCheckIn] = useState(state.dates.checkIn ?? todayPlus(30));
  const [checkOut, setCheckOut] = useState(state.dates.checkOut ?? todayPlus(37));
  const [currency, setCurrency] = useState<CurrencyCode>(
    state.dates.preferredCurrency ?? currencyForCountry(state.location.country),
  );
  const [guests, setGuests] = useState(state.dates.guests ?? 2);
  const [budgetMin, setBudgetMin] = useState(
    Math.round(convertFromUsd(state.dates.budgetPerNightMin ?? 100, currency)),
  );
  const [budgetMax, setBudgetMax] = useState(
    Math.round(convertFromUsd(state.dates.budgetPerNightMax ?? 400, currency)),
  );
  const [flexible, setFlexible] = useState(state.dates.flexibleBudget ?? false);

  const nights = diffNights(checkIn, checkOut);

  const isValid = checkIn && checkOut && nights > 0 && guests >= 1 && budgetMax >= budgetMin;

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
    router.push('/(search)/type');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>When & Budget 📅</Text>
      <Text style={styles.subtext}>We'll only show available resorts in your range.</Text>

      <Text style={styles.label}>Check-in date (YYYY-MM-DD)</Text>
      <TextInput value={checkIn} onChangeText={setCheckIn} style={styles.input} placeholderTextColor="#9ca3af" />

      <Text style={styles.label}>Check-out date (YYYY-MM-DD)</Text>
      <TextInput value={checkOut} onChangeText={setCheckOut} style={styles.input} placeholderTextColor="#9ca3af" />

      {nights > 0 && (
        <Text style={styles.info}>📆 {nights} night{nights !== 1 ? 's' : ''}</Text>
      )}

      <Text style={styles.sectionLabel}>Guests</Text>
      <View style={styles.counter}>
        <TouchableOpacity onPress={() => setGuests(Math.max(1, guests - 1))} style={styles.counterBtn}>
          <Text style={styles.counterBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{guests}</Text>
        <TouchableOpacity onPress={() => setGuests(Math.min(20, guests + 1))} style={styles.counterBtn}>
          <Text style={styles.counterBtnText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.counterLabel}>{guests === 1 ? 'guest' : 'guests'}</Text>
      </View>

      <Text style={styles.sectionLabel}>Budget per night ({currency})</Text>
      <View style={styles.currencyRow}>
        {SUPPORTED_CURRENCIES.map((code) => {
          const active = currency === code;
          return (
            <TouchableOpacity
              key={code}
              onPress={() => {
                const minUsd = convertToUsd(budgetMin, currency);
                const maxUsd = convertToUsd(budgetMax, currency);
                setCurrency(code);
                setBudgetMin(Math.round(convertFromUsd(minUsd, code)));
                setBudgetMax(Math.round(convertFromUsd(maxUsd, code)));
              }}
              style={[styles.currencyChip, active && styles.currencyChipActive]}
            >
              <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>{code}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Min ({currency})</Text>
          <TextInput
            value={String(budgetMin)}
            onChangeText={(t) => setBudgetMin(parseInt(t, 10) || 0)}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Max ({currency})</Text>
          <TextInput
            value={String(budgetMax)}
            onChangeText={(t) => setBudgetMax(parseInt(t, 10) || 0)}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      {nights > 0 && (
        <Text style={styles.estimateText}>Est. total up to {formatMoney(budgetMax * nights, currency)} for {nights} nights</Text>
      )}

      <View style={styles.switchRow}>
        <Switch value={flexible} onValueChange={setFlexible} trackColor={{ true: '#0284c7' }} />
        <Text style={styles.switchLabel}>Flexible budget (show slightly over budget)</Text>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isValid}
          style={[styles.button, !isValid && styles.buttonDisabled, { flex: 1 }]}
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
  subtext: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff', color: '#111827' },
  info: { fontSize: 13, color: '#0284c7', fontWeight: '600', marginTop: 6 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  counterBtnText: { fontSize: 20, color: '#374151', fontWeight: '700' },
  counterValue: { fontSize: 24, fontWeight: '800', color: '#111827', width: 48, textAlign: 'center' },
  counterLabel: { fontSize: 14, color: '#6b7280' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  currencyChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  currencyChipActive: { borderColor: '#0284c7', backgroundColor: '#e0f2fe' },
  currencyChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  currencyChipTextActive: { color: '#0369a1' },
  estimateText: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  switchLabel: { fontSize: 14, color: '#374151', flex: 1 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  button: { backgroundColor: '#0284c7', padding: 16, borderRadius: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#e5e7eb' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
