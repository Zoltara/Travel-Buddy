import type { SearchPreferences, SearchResponse } from '@travel-buddy/types';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveApiBase(): string {
  const configured = process.env['NEXT_PUBLIC_API_URL']?.trim();
  if (configured) return normalizeBaseUrl(configured);

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    return normalizeBaseUrl(origin);
  }

  return 'http://localhost:4000';
}

const API_BASE = resolveApiBase();

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
      `Unable to reach search API (${API_BASE}). Configure NEXT_PUBLIC_API_URL if your API is hosted elsewhere.`,
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(
      (err as { message?: string }).message ?? `API ${res.status}`,
    );
  }

  return res.json() as Promise<SearchResponse>;
}

export async function getSearchById(id: string): Promise<SearchResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/search/${id}`);
  } catch {
    throw new Error(
      `Unable to reach search API (${API_BASE}). Configure NEXT_PUBLIC_API_URL if your API is hosted elsewhere.`,
    );
  }

  if (!res.ok) {
    throw new Error(`Search not found: ${res.status}`);
  }

  return res.json() as Promise<SearchResponse>;
}
