"use client";

import { useCallback, useEffect, useState } from "react";

import { getCategoryBreakdown } from "@/lib/mock-data";
import { POOLS_STAGE, THIRD_PLACE_STAGE, roundName } from "@/lib/tournament/bracketMath";
import type { Bracket, Pool, PoolMatch, RankedRow } from "@/lib/tournament/types";
import type { Tournament } from "@/lib/types";

// The Matches console writes its per-tournament draw state to this key. Reads
// here are strictly one-way — the player Match Centre never mutates it.
const STORAGE_KEY = "tt-demo-draws";
const DOUBLES_CATEGORY_ID = "open-doubles";

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat";
}

interface StoredDraw {
  players?: { id: string; name: string }[];
  pools?: Pool[] | null;
  poolMatches?: PoolMatch[];
  bracket?: Bracket | null;
}
interface StoredCategoryFeed {
  name?: string;
  advancePerPool?: number;
  standings?: Record<string, RankedRow[]>;
  seedOrder?: Record<string, number>;
}
interface StoredBlob {
  draws?: Record<string, StoredDraw>;
  scheduleReleases?: Record<string, string[]>;
  feeds?: Record<string, StoredCategoryFeed>;
}

function readStore(): Record<string, StoredBlob> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Tournament ids where this player is on a console entry list (host added them
 * by unique ID) AND the host has published a schedule — so they see it in the
 * Match Centre even without a public registration record.
 */
export function useConsoleTournamentIds(playerId: string | undefined): string[] {
  const [ids, setIds] = useState<string[]>([]);

  const refresh = useCallback(() => {
    if (!playerId) {
      setIds([]);
      return;
    }
    const store = readStore();
    const found: string[] = [];
    for (const [tid, blob] of Object.entries(store)) {
      const released = blob?.scheduleReleases;
      if (!released || !Object.values(released).some((s) => s && s.length > 0)) continue;
      const inDraw = Object.values(blob?.draws ?? {}).some((d) =>
        (d.players ?? []).some((p) => p.id === playerId),
      );
      if (inDraw) found.push(tid);
    }
    setIds(found);
  }, [playerId]);

  useEffect(() => {
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

  return ids;
}

export interface LiveCategory {
  id: string;
  name: string;
  releasedStages: string[];
  poolsReleased: boolean;
  advancePerPool: number;
  players: { id: string; name: string }[];
  pools: Pool[];
  poolMatches: PoolMatch[];
  standings: Record<string, RankedRow[]>;
  seedOf: (playerId: string) => number;
  /** The bracket, trimmed to the rounds the host has released. */
  bracket: Bracket | null;
  nameOf: (playerId: string | null | undefined) => string;
}

export interface LiveTournament {
  tournamentId: string;
  name: string;
  date: string;
  categories: LiveCategory[];
}

/** Keep only the bracket rounds the host has published. */
function trimBracket(bracket: Bracket, released: Set<string>): Bracket | null {
  let maxRound = -1;
  bracket.rounds.forEach((_, i) => {
    if (released.has(roundName(bracket.size / 2 ** i))) maxRound = i;
  });
  const showThird = released.has(THIRD_PLACE_STAGE);
  if (maxRound < 0 && !showThird) return null;
  return {
    ...bracket,
    rounds: bracket.rounds.slice(0, Math.max(maxRound + 1, 0)),
    thirdPlace: showThird ? bracket.thirdPlace : null,
  };
}

function buildLiveTournament(tournament: Tournament, blob: StoredBlob | undefined): LiveTournament | null {
  const releases = blob?.scheduleReleases;
  if (!releases) return null;

  const nameById = new Map<string, string>();
  for (const row of getCategoryBreakdown(tournament)) {
    nameById.set(slug(String(row.category)), String(row.category));
  }
  if (nameById.size === 0) {
    nameById.set(slug(tournament.category || "open"), tournament.category || "Open");
  }
  nameById.set(DOUBLES_CATEGORY_ID, "Open Doubles");

  const categories: LiveCategory[] = [];
  for (const [categoryId, stages] of Object.entries(releases)) {
    if (!stages || stages.length === 0) continue;
    const draw = blob?.draws?.[categoryId];
    const feed = blob?.feeds?.[categoryId];
    const released = new Set(stages);
    const players = draw?.players ?? [];
    const nameMap = new Map(players.map((p) => [p.id, p.name]));
    const seedOrder = feed?.seedOrder ?? {};

    const poolsReleased = released.has(POOLS_STAGE);
    const bracket =
      draw?.bracket && stages.some((s) => s !== POOLS_STAGE)
        ? trimBracket(draw.bracket, released)
        : null;

    categories.push({
      id: categoryId,
      name: feed?.name ?? nameById.get(categoryId) ?? categoryId,
      releasedStages: stages,
      poolsReleased,
      advancePerPool: feed?.advancePerPool ?? 2,
      players: players.map((p) => ({ id: p.id, name: p.name })),
      pools: poolsReleased ? (draw?.pools ?? []) : [],
      poolMatches: poolsReleased ? (draw?.poolMatches ?? []) : [],
      standings: poolsReleased ? (feed?.standings ?? {}) : {},
      seedOf: (id) => seedOrder[id] ?? 0,
      bracket,
      nameOf: (id) => (id ? (nameMap.get(id) ?? "—") : "—"),
    });
  }

  if (categories.length === 0) return null;
  return {
    tournamentId: tournament.id,
    name: tournament.name,
    date: tournament.date,
    categories,
  };
}

/**
 * Live, read-only view of every tournament the player is registered in that the
 * host has published any schedule for. Re-reads when the console (another tab)
 * publishes or scores.
 */
export function useLiveTournaments(registeredTournaments: readonly Tournament[]): {
  tournaments: LiveTournament[];
  isLoading: boolean;
} {
  const ids = registeredTournaments.map((t) => t.id).join(",");
  const [tournaments, setTournaments] = useState<LiveTournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    const store = readStore();
    const list: LiveTournament[] = [];
    for (const t of registeredTournaments) {
      const live = buildLiveTournament(t, store[t.id]);
      if (live) list.push(live);
    }
    setTournaments(list);
    setIsLoading(false);
    // `registeredTournaments` identity changes each render — the id list is the
    // real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  useEffect(() => {
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

  return { tournaments, isLoading };
}
