// ─────────────────────────────────────────────────────────────────────────────
// API Request / Response shapes
// ─────────────────────────────────────────────────────────────────────────────

import type { SearchPreferences } from './preferences.js';
import type { ScoredResort } from './scoring.js';

// ── POST /api/search ─────────────────────────────────────────────────────────

export interface SearchRequest {
  preferences: SearchPreferences;
}

export interface SearchResponse {
  searchId: string;
  results: ScoredResort[];
  /** ISO timestamp */
  searchedAt: string;
  /** How many raw properties were found before scoring/filtering */
  totalPropertiesFound: number;
  /** How many were eliminated by hard filters */
  filteredOut: number;
  /** Which platforms responded successfully */
  platformsQueried: string[];
  /** Which platforms failed */
  platformsFailed: string[];
  /** Cache TTL in seconds */
  ttl: number;
}

// ── GET /api/search/:id ───────────────────────────────────────────────────────

export interface SearchCacheEntry {
  searchId: string;
  preferences: SearchPreferences;
  response: SearchResponse;
  createdAt: string;
  expiresAt: string;
}

// ── Health check ─────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  uptime: number;
  timestamp: string;
}

// ── Error shape ──────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
