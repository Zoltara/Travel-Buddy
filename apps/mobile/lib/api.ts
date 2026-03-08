import type { SearchPreferences, SearchResponse } from '@travel-buddy/types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function detectExpoHost(): string | null {
  const extra = Constants.expoConfig?.extra as
    | { expoGo?: { debuggerHost?: string } }
    | undefined;
  const debuggerHost = extra?.expoGo?.debuggerHost;
  if (!debuggerHost) return null;
  const host = debuggerHost.split(':')[0]?.trim();
  return host || null;
}

function resolveApiBase(): string {
  const fromExpoExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExpoExtra?.trim()) {
    const normalized = normalizeBaseUrl(fromExpoExtra);
    const isLoopback = /localhost|127\.0\.0\.1/.test(normalized);
    if (!isLoopback) return normalized;

    const host = detectExpoHost();
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return normalized.replace(/localhost|127\.0\.0\.1/, host);
    }

    if (Platform.OS === 'android') {
      return normalized.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
    }

    return normalized;
  }

  const host = detectExpoHost();
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:4000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://127.0.0.1:4000';
}

const API_BASE: string = resolveApiBase();

export async function submitSearch(
  preferences: SearchPreferences,
): Promise<SearchResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences }),
    });
  } catch {
    throw new Error(
      `Unable to reach search API (${API_BASE}). Update expo.extra.apiUrl in app.json to your API URL.`,
    );
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: 'Unknown error' }))) as {
      message?: string;
    };
    throw new Error(err.message ?? `API error ${res.status}`);
  }

  return res.json() as Promise<SearchResponse>;
}

export async function getSearchById(id: string): Promise<SearchResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/search/${id}`);
  } catch {
    throw new Error(
      `Unable to reach search API (${API_BASE}). Update expo.extra.apiUrl in app.json to your API URL.`,
    );
  }
  if (!res.ok) throw new Error(`Search not found: ${res.status}`);
  return res.json() as Promise<SearchResponse>;
}
