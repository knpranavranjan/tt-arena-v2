"use client";

import { useCallback, useEffect, useState } from "react";

import { getPlayer } from "@/lib/mock-data";
import type { Tournament } from "@/lib/types";

// The draws/results the Matches console writes to localStorage. Publishing a
// category's champion on the console's Champion step drops a `PublishedResult`
// here, keyed inside `tt-demo-draws[<tournamentId>].published[<categorySlug>]`.
// The public event page reads it back through this module.

const STORAGE_KEY = "tt-demo-draws";

export interface PublishedPlacement {
  playerId: string;
  name: string;
  seed?: number;
  rating?: number;
  club?: string;
}

export interface PublishedResult {
  /** Legacy id-only fields — kept so older published blobs still resolve. */
  champion?: string;
  runnerUp?: string;
  semiFinalists?: string[];
  /** Self-contained payload written since the results page shipped. */
  categoryName?: string;
  publishedAt?: string;
  podium?: {
    champion?: PublishedPlacement;
    runnerUp?: PublishedPlacement;
    /** Present only when a 3rd/4th place was actually decided. */
    third?: PublishedPlacement;
    fourth?: PublishedPlacement;
  };
  stats?: { players: number; matchesPlayed: number; format: string };
}

/** One category's published result, normalised for the public results panel. */
export interface PublishedCategoryResult {
  tournamentId: string;
  categoryName: string;
  publishedAt?: string;
  champion?: PublishedPlacement;
  runnerUp?: PublishedPlacement;
  third?: PublishedPlacement;
  fourth?: PublishedPlacement;
  stats?: { players: number; matchesPlayed: number; format: string };
}

function placementFromId(id: string | undefined): PublishedPlacement | undefined {
  if (!id) return undefined;
  const p = getPlayer(id);
  return { playerId: id, name: p?.name ?? id, rating: p?.rating, club: p?.clubName ?? undefined };
}

function normalise(
  tournamentId: string,
  fallbackCategory: string,
  raw: PublishedResult,
): PublishedCategoryResult | null {
  const champion = raw.podium?.champion ?? placementFromId(raw.champion);
  if (!champion) return null;
  return {
    tournamentId,
    categoryName: raw.categoryName || fallbackCategory,
    publishedAt: raw.publishedAt,
    champion,
    runnerUp: raw.podium?.runnerUp ?? placementFromId(raw.runnerUp),
    third: raw.podium?.third,
    fourth: raw.podium?.fourth,
    stats: raw.stats,
  };
}

function readFromStorage(tournaments: readonly Tournament[]): PublishedCategoryResult[] {
  let store: Record<string, { published?: Record<string, PublishedResult> }> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") store = parsed;
  } catch {
    return [];
  }

  const out: PublishedCategoryResult[] = [];
  for (const t of tournaments) {
    const published = store[t.id]?.published;
    if (!published) continue;
    for (const raw of Object.values(published)) {
      const row = normalise(t.id, t.category, raw);
      if (row) out.push(row);
    }
  }
  return out;
}

/**
 * Live view of every published category result across a set of category
 * tournaments (an event's siblings). Re-reads when another tab publishes.
 */
export function usePublishedResults(tournaments: readonly Tournament[]): PublishedCategoryResult[] {
  const ids = tournaments.map((t) => t.id).join(",");
  const [results, setResults] = useState<PublishedCategoryResult[]>([]);

  const refresh = useCallback(() => {
    setResults(readFromStorage(tournaments));
    // `tournaments` identity changes each render; the joined id list is the
    // real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  useEffect(() => {
    // First client read after mount (kept out of the initial state so the
    // server render and hydration agree on an empty list), then stay in sync
    // with the tab that does the publishing. Same shape as the other
    // localStorage-backed stores in this codebase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return results;
}
