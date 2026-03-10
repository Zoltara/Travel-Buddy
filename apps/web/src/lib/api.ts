import type { SearchPreferences, SearchResponse } from '@travel-buddy/types';

// Always use relative paths so this works on Vercel (Next.js API routes)
// without any environment variable configuration.
const API_BASE = '';

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
    throw new Error('Unable to reach the search API. Please try again.');
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
    throw new Error('Unable to reach the search API. Please try again.');
  }

  if (!res.ok) {
    throw new Error(`Search not found: ${res.status}`);
  }

  return res.json() as Promise<SearchResponse>;
}
