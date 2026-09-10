"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  calculateFullTournamentRating,
  type FullEngineMatchInput,
  type FullEnginePlayerInput,
} from "@/lib/rating";
import { allBracketMatches } from "@/lib/tournament/knockout";
import type { Bracket, PoolMatch } from "@/lib/tournament/types";
import { getPlayer } from "@/lib/mock-data";
import { USE_DB, apiGet, apiSend } from "@/lib/data-backend";

/**
 * Player ratings, kept the same way tournament-status.tsx keeps admin
 * approval overrides: `mock-data.players` is a static in-memory array, so a
 * rating change made by the rating engine is layered on top here and merged
 * back with `getRating()` wherever a player's rating is shown.
 *
 * Flow: the Champion screen's "Publish results" applies the rating algorithm
 * (src/lib/rating) to every completed match in that category's singles draw,
 * once, and records the resulting deltas here.
 */

const STORAGE_KEY = "tt-demo-player-ratings";

export interface RatingChangeEntry {
  tournamentId: string;
  tournamentName: string;
  categoryId: string;
  categoryName: string;
  /** The tournament's own date, for chronological ordering in a history chart. */
  date: string;
  /** When this entry was written, for tie-breaking same-date tournaments. */
  appliedAt: string;
  previousRating: number;
  newRating: number;
  delta: number;
  matchesCounted: number;
}

interface StoredRatings {
  overrides: Record<string, number>;
  history: Record<string, RatingChangeEntry[]>;
  /** `${tournamentId}:${categoryId}` keys already applied, so publishing twice
   *  (e.g. a stale reload replaying the same click) never double-counts. */
  appliedKeys: string[];
}

interface ApplyTournamentResultsInput {
  tournamentId: string;
  tournamentName: string;
  categoryId: string;
  categoryName: string;
  date: string;
  players: { id: string; name: string }[];
  matches: FullEngineMatchInput[];
}

interface ApplyTournamentResultsOutcome {
  applied: boolean;
  reason?: string;
  changes: RatingChangeEntry[];
  warnings: string[];
}

interface PlayerRatingsContextValue {
  isLoading: boolean;
  /** A player's live rating: the latest applied result, or their base rating. */
  getRating: (playerId: string) => number;
  /** Every rating change applied to this player, oldest first. */
  getHistory: (playerId: string) => RatingChangeEntry[];
  hasApplied: (tournamentId: string, categoryId: string) => boolean;
  applyTournamentResults: (input: ApplyTournamentResultsInput) => ApplyTournamentResultsOutcome;
}

const EMPTY_STORE: StoredRatings = { overrides: {}, history: {}, appliedKeys: [] };

function readStorage(): StoredRatings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return { overrides: {}, history: {}, appliedKeys: [] };
    return {
      overrides: parsed.overrides ?? {},
      history: parsed.history ?? {},
      appliedKeys: Array.isArray(parsed.appliedKeys) ? parsed.appliedKeys : [],
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return { overrides: {}, history: {}, appliedKeys: [] };
  }
}

const Ctx = createContext<PlayerRatingsContextValue | null>(null);

export function PlayerRatingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredRatings>(EMPTY_STORE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (USE_DB) {
      apiGet<StoredRatings>("/api/player-ratings")
        .then((s) =>
          setState({
            overrides: s.overrides ?? {},
            history: s.history ?? {},
            appliedKeys: Array.isArray(s.appliedKeys) ? s.appliedKeys : [],
          }),
        )
        .catch((e) => console.error("player-ratings load", e))
        .finally(() => setIsLoading(false));
      return;
    }
    setState(readStorage());
    setIsLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: StoredRatings) => {
    setState(next);
    if (USE_DB) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full or unavailable — overrides still work for this session */
    }
  }, []);

  const getRating = useCallback(
    (playerId: string) => state.overrides[playerId] ?? getPlayer(playerId)?.rating ?? 0,
    [state.overrides],
  );

  const getHistory = useCallback(
    (playerId: string) => state.history[playerId] ?? [],
    [state.history],
  );

  const hasApplied = useCallback(
    (tournamentId: string, categoryId: string) =>
      state.appliedKeys.includes(`${tournamentId}:${categoryId}`),
    [state.appliedKeys],
  );

  // Reads the on-disk copy fresh (rather than the `state` closure) so this
  // stays correct even if called more than once in a tight window.
  const applyTournamentResults = useCallback(
    (input: ApplyTournamentResultsInput): ApplyTournamentResultsOutcome => {
      const key = `${input.tournamentId}:${input.categoryId}`;
      // localStorage mode re-reads fresh (survives a tight double-call); DB mode
      // uses the hydrated state and leans on the server's key guard.
      const current = USE_DB ? state : readStorage();

      if (current.appliedKeys.includes(key)) {
        return {
          applied: false,
          reason: "Ratings were already updated for this category.",
          changes: [],
          warnings: [],
        };
      }

      if (input.matches.length === 0) {
        return { applied: false, reason: "No completed matches to rate.", changes: [], warnings: [] };
      }

      const engineInput: FullEnginePlayerInput[] = input.players.map((p) => ({
        id: p.id,
        name: p.name,
        rating: current.overrides[p.id] ?? getPlayer(p.id)?.rating ?? null,
      }));

      const result = calculateFullTournamentRating({ players: engineInput, matches: input.matches });

      const nextOverrides = { ...current.overrides };
      const nextHistory = { ...current.history };
      const changes: RatingChangeEntry[] = [];
      const serverChanges: { playerId: string; newRating: number; entry: RatingChangeEntry }[] = [];
      const appliedAt = new Date().toISOString();

      for (const p of result.players) {
        if (p.finalRating === null || p.preTournamentRating === null) continue;
        if (p.finalRating === p.preTournamentRating) continue;

        const entry: RatingChangeEntry = {
          tournamentId: input.tournamentId,
          tournamentName: input.tournamentName,
          categoryId: input.categoryId,
          categoryName: input.categoryName,
          date: input.date,
          appliedAt,
          previousRating: p.preTournamentRating,
          newRating: p.finalRating,
          delta: p.finalRating - p.preTournamentRating,
          matchesCounted: p.finalPassDeltas.length,
        };

        nextOverrides[p.playerId] = p.finalRating;
        nextHistory[p.playerId] = [...(nextHistory[p.playerId] ?? []), entry];
        changes.push(entry);
        serverChanges.push({ playerId: p.playerId, newRating: p.finalRating, entry });
      }

      persist({
        overrides: nextOverrides,
        history: nextHistory,
        appliedKeys: [...current.appliedKeys, key],
      });

      if (USE_DB) {
        apiSend("/api/player-ratings", "POST", { key, changes: serverChanges }).catch((e) =>
          console.error("player-ratings apply", e),
        );
      }

      return { applied: true, changes, warnings: result.warnings };
    },
    [persist, state],
  );

  const value = useMemo<PlayerRatingsContextValue>(
    () => ({ isLoading, getRating, getHistory, hasApplied, applyTournamentResults }),
    [isLoading, getRating, getHistory, hasApplied, applyTournamentResults],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayerRatings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayerRatings must be used within PlayerRatingsProvider");
  return ctx;
}

/** Build rating-engine match inputs from a category draw's pool + knockout matches. */
export function buildRatingMatchInputs(
  poolMatches: readonly PoolMatch[],
  bracket: Bracket | null,
): FullEngineMatchInput[] {
  const fromPools: FullEngineMatchInput[] = poolMatches
    .filter((m) => m.played && m.aId && m.bId && m.winnerId)
    .map((m) => ({ id: m.id, playerAId: m.aId as string, playerBId: m.bId as string, winnerId: m.winnerId as string }));

  const fromBracket: FullEngineMatchInput[] = bracket
    ? allBracketMatches(bracket)
        .filter((m) => m.played && !m.isBye && m.aId && m.bId && m.winnerId)
        .map((m) => ({ id: m.id, playerAId: m.aId as string, playerBId: m.bId as string, winnerId: m.winnerId as string }))
    : [];

  return [...fromPools, ...fromBracket];
}
