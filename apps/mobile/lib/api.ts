import type { SearchPreferences, SearchResponse } from '@travel-buddy/types';
import Constants from 'expo-constants';

const API_BASE: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:4000';

export async function submitSearch(
  preferences: SearchPreferences,
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferences }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: 'Unknown error' }))) as {
      message?: string;
    };
    throw new Error(err.message ?? `API error ${res.status}`);
  }

  return res.json() as Promise<SearchResponse>;
}

export async function getSearchById(id: string): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/search/${id}`);
  if (!res.ok) throw new Error(`Search not found: ${res.status}`);
  return res.json() as Promise<SearchResponse>;
}
