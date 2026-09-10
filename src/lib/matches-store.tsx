"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { nextPowerOfTwo } from "@/lib/tournament/bracketMath";
import {
  buildBracket,
  championId,
  clearBracketResult,
  propagate,
  setBracketResult,
  setThirdPlaceEnabled,
} from "@/lib/tournament/knockout";
import {
  allMembers,
  autoPairMembers,
  isDoublesCategory,
  makeTeam,
  pairRoster,
  toMembers,
} from "@/lib/tournament/doubles";
import { applySeedOrder, blankPlayer, generatePlayers, seedPlayers, uid } from "@/lib/tournament/players";
import {
  allocate,
  balancedSizes,
  poolLabel,
  recommendPools,
  reconcilePools,
  type PoolRecommendation,
} from "@/lib/tournament/pools";
import { computeQualification, directEntry } from "@/lib/tournament/qualification";
import { categoryCode } from "@/lib/tournament/registrations";
import { hashString, rngFor } from "@/lib/tournament/rng";
import { generateAllPoolMatches } from "@/lib/tournament/roundRobin";
import type { MatchResultPatch } from "@/lib/tournament/scoring";
import { applyManualOrder, computeAllStandings } from "@/lib/tournament/standings";
import type {
  AllocationMethod,
  Bracket,
  CategoryEntry,
  GamePoints,
  MatchBase,
  NameStyle,
  PairMember,
  Player,
  Pool,
  PoolMatch,
  QualificationResult,
  Qualifier,
  RankedRow,
  SeededPlayer,
  Tournament as ConsoleTournament,
  TournamentFormat,
} from "@/lib/tournament/types";

import { normalizeTieBreakOrder } from "@/lib/tie-break";
import { getCategoryBreakdown, getPlayer, getTournamentPlayers } from "@/lib/mock-data";
import type { PublishedResult } from "@/lib/published-results";
import { useRegistrations, type TournamentRegistration } from "@/lib/registrations";
import { usePlayerRoster } from "@/lib/players-store";
import { useTournamentStatus } from "@/lib/tournament-status";
import type { Player as ArenaPlayer, Tournament as ArenaTournament } from "@/lib/types";

/** Resolve a player id to a full record — merged roster (real sign-ups) first,
 *  seed catalogue second. Defaults to the seed lookup for non-hook call sites. */
type ResolvePlayer = (id: string) => ArenaPlayer | undefined;

/* ------------------------------------------------------------------ types */

export type Stage = "players" | "pools" | "groups" | "matches" | "knockout" | "champion";

export interface CategoryDraw {
  categoryId: string;
  /** Competitors in the draw. For a doubles category each entry is a team
   *  `Player` whose `members` holds the two people. */
  players: Player[];
  /** Doubles only: people not currently in a team, waiting to be paired. */
  unpaired: PairMember[];
  /** Hand-set seed order set by dragging on the Players → Seeding tab. When
   *  null, seeding is automatic (by rating). */
  manualSeedOrder: string[] | null;
  pools: Pool[] | null;
  poolMatches: PoolMatch[];
  poolMethod: AllocationMethod;
  /** Per-pool standings order set by dragging rows. Keyed by pool id; a pool
   *  absent from the map is ranked automatically. */
  manualStandingsOrder: Record<string, string[]> | null;
  manualQualifierIds: string[] | null;
  qualifierOrder: string[] | null;
  bracket: Bracket | null;
}

export interface CategorySummary extends CategoryEntry {
  players: number;
  poolsAllocated: boolean;
  matchesPlayed: number;
  matchesTotal: number;
  hasBracket: boolean;
  championId: string | null;
}

export type { PublishedPlacement, PublishedResult } from "@/lib/published-results";

/** A read-only snapshot the player Match Centre renders — recomputed on every
 *  console change so the player view stays live without re-deriving anything. */
export interface CategoryFeed {
  name: string;
  advancePerPool: number;
  standings: Record<string, RankedRow[]>;
  seedOrder: Record<string, number>;
}

interface StoredMatches {
  stage: Stage;
  activeCategoryId: string;
  /** tie-break / bestOf / qualification tweaks made from inside the workspace. */
  configPatch: Partial<ConsoleTournament>;
  draws: Record<string, CategoryDraw>;
  published: Record<string, PublishedResult>;
  /** Stages the host has published to players, per category id. */
  scheduleReleases: Record<string, string[]>;
  /** Derived, written on persist — see `CategoryFeed`. */
  feeds?: Record<string, CategoryFeed>;
}

export interface MatchesActions {
  goto: (stage: Stage) => void;
  updateTournament: (patch: Partial<ConsoleTournament>) => void;
  switchCategory: (categoryId: string) => void;
  setThirdPlace: (enabled: boolean) => void;

  generateSamplePlayers: (count: number, nameStyle: NameStyle, replace?: boolean) => void;
  addPlayer: (player?: Partial<Player>) => void;
  /** Enter an existing platform player (kept by their real id so ratings apply). */
  addRegisteredPlayer: (person: {
    id: string;
    name: string;
    rating: number;
    club: string;
    state: string;
  }) => void;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  duplicatePlayer: (id: string) => void;
  movePlayerOrder: (id: string, direction: -1 | 1) => void;
  setSeedOrder: (ids: string[] | null) => void;
  clearPlayers: () => void;
  syncFromRegistrations: () => void;

  /* doubles: pair building ------------------------------------------ */
  splitPair: (teamId: string) => void;
  formPair: (memberIdA: string, memberIdB: string) => void;
  autoPairAll: () => void;

  buildPools: (opts: { poolCount: number; method: AllocationMethod }) => void;
  shufflePools: () => void;
  movePlayerToPool: (playerId: string, poolId: string | null) => void;
  renamePool: (poolId: string, name: string) => void;
  addPool: () => void;
  removePool: (poolId: string) => void;

  setPoolResult: (matchId: string, result: Partial<MatchBase>) => void;
  clearPoolResult: (matchId: string) => void;
  /** Drag a pool's standings into an explicit order (player ids, top first). */
  reorderStanding: (poolId: string, playerIds: string[]) => void;
  /** Drop the manual order for one pool (or every pool) — back to computed. */
  resetStandingsOrder: (poolId?: string) => void;

  setManualQualifiers: (ids: string[] | null) => void;
  setQualifierOrder: (ids: string[] | null) => void;
  generateBracket: (qualifiers: readonly Qualifier[]) => void;
  clearBracket: () => void;
  /** Swap two players between first-round bracket slots (drag & drop). */
  swapKnockoutPlayers: (playerIdA: string, playerIdB: string) => void;
  setKoResult: (matchId: string, result: Partial<MatchBase>) => void;
  clearKoResult: (matchId: string) => void;

  /** Release a stage's schedule to registered players' Match Centre. */
  publishStage: (stageKey: string) => void;
  unpublishStage: (stageKey: string) => void;

  publishResults: (result: PublishedResult) => void;
}

export interface MatchesContextValue {
  hydrated: boolean;
  stage: Stage;
  tournament: ConsoleTournament;

  activeCategoryId: string;
  activeCategory: CategoryEntry;
  categories: CategoryEntry[];
  categorySummaries: CategorySummary[];

  /** The active category runs as doubles — competitors are two-player teams. */
  isDoubles: boolean;
  players: Player[];
  /** Doubles only: people not yet in a team. */
  unpaired: PairMember[];
  pools: Pool[] | null;
  poolMatches: PoolMatch[];
  poolMethod: AllocationMethod;
  manualStandingsOrder: Record<string, string[]> | null;
  manualQualifierIds: string[] | null;
  qualifierOrder: string[] | null;
  bracket: Bracket | null;
  /** Stage keys the host has published for the active category. */
  releasedStages: string[];

  seeded: SeededPlayer[];
  playerById: Map<string, Player>;
  seedOf: (id: string) => number;
  recommendation: PoolRecommendation;
  standingsByPool: Map<string, RankedRow[]>;
  qualification: QualificationResult | null;
  poolsComplete: boolean;
  champion: string | null;
  published: PublishedResult | undefined;
  projectedBracket: number;
  actions: MatchesActions;
}

const Ctx = createContext<MatchesContextValue | null>(null);

export function useTournament(): MatchesContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error("useTournament must be used inside <MatchesProvider>");
  return value;
}

/** Every stage screen needs a tournament and a category, which always exist here. */
export function useActiveTournament(): MatchesContextValue {
  return useTournament();
}

/* ---------------------------------------------------------------- config */

const STORAGE_KEY = "tt-demo-draws";

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat";
}

function parseBestOf(matchFormat: string | undefined): number {
  const m = /(\d+)/.exec(matchFormat ?? "");
  const n = m ? Number(m[1]) : 5;
  return [3, 5, 7].includes(n) ? n : 5;
}

function mapFormat(f: ArenaTournament["format"]): TournamentFormat {
  if (f === "SINGLE_ELIMINATION") return "ko_only";
  if (f === "ROUND_ROBIN_LEAGUE") return "rr_only";
  return "pools_ko";
}

/** Id used for a doubles division when a host actually creates one (any
 *  category whose name matches /doubles/i). No longer force-added to every
 *  tournament — the console only shows the categories the host registered. */
export const DOUBLES_CATEGORY_ID = "open-doubles";

function categoryFormat(name: string) {
  return isDoublesCategory(name) ? ("doubles" as const) : ("singles" as const);
}

function baseConfig(t: ArenaTournament): ConsoleTournament {
  const breakdown = getCategoryBreakdown(t);
  const categories: CategoryEntry[] = (
    breakdown.length
      ? breakdown.map((r) => {
          const name = String(r.category);
          return {
            id: slug(name),
            name,
            maxPlayers: Math.max(r.spotsTotal, r.spotsFilled) || t.maxPlayers || 32,
            code: categoryCode(name),
            entryFee: t.entryFee,
            prizePool: t.prizePool,
            level: "",
            format: categoryFormat(name),
          };
        })
      : [
          {
            id: slug(t.category || "open"),
            name: t.category || "Open",
            maxPlayers: t.maxPlayers || 32,
            code: categoryCode(t.category || "Open"),
            entryFee: t.entryFee,
            prizePool: t.prizePool,
            level: "",
            format: categoryFormat(t.category || "Open"),
          },
        ]
  );

  // The host sets a priority order on the "Host a Tournament" form; the ids are
  // a subset of the engine's TieBreakRule union so they map straight through.
  const tieBreakOrder = normalizeTieBreakOrder(t.tieBreakOrder) as ConsoleTournament["tieBreakOrder"];

  return {
    id: t.id,
    name: t.name,
    location: t.venue,
    organizer: t.organizer,
    date: t.date,
    endDate: t.date,
    code: "",
    status: "live",
    sport: "Table Tennis",
    city: "",
    categories,
    venues: [],
    rules: [],
    organizers: [],
    sponsors: [],
    partners: [],
    creatives: [],
    format: mapFormat(t.format),
    description: t.description ?? "",
    poolSizePreference: t.poolSize && t.poolSize > 1 ? t.poolSize : "auto",
    tieBreakRule: tieBreakOrder?.[0] ?? "head_to_head",
    tieBreakOrder,
    qualificationRule: "winners_fill",
    bestOf: parseBestOf(t.matchFormat),
    tables: 6,
    separatePools: true,
    thirdPlace: false,
    generateSample: false,
    sampleCount: 32,
    nameStyle: "realistic",
    seed: hashString(t.id),
    createdAt: "",
    // Per-category rules, editable on the "Set Rules" screen.
    advancePerPool: 2,
    groupPoints: { win: 1, draw: 0, loss: 0 },
    groupBestOf: parseBestOf(t.matchFormat),
    groupPointsToWin: 11,
    groupWinBy: "win_by_two",
    koBestOf: parseBestOf(t.matchFormat),
    koPointsToWin: 11,
    koSemiFinalBestOf: parseBestOf(t.matchFormat),
    koSemiFinalPointsToWin: 11,
    koWinBy: "win_by_two",
  };
}

const DEFAULT_POINTS: GamePoints = { win: 2, draw: 1, loss: 1 };

/** Recompute the read-only per-category snapshot for the player Match Centre. */
function buildFeeds(state: StoredMatches, config: ConsoleTournament): Record<string, CategoryFeed> {
  const t = { ...config, ...state.configPatch };
  const points = t.groupPoints ?? DEFAULT_POINTS;
  const out: Record<string, CategoryFeed> = {};
  for (const [catId, draw] of Object.entries(state.draws)) {
    const seededPlayers = applySeedOrder(draw.players, draw.manualSeedOrder);
    const seedOrder: Record<string, number> = {};
    for (const p of seededPlayers) seedOrder[p.id] = p.seed;

    let standings: Record<string, RankedRow[]> = {};
    if (draw.pools) {
      const seedOf = (id: string) => seedOrder[id] ?? 9999;
      const map = computeAllStandings(
        draw.pools,
        draw.poolMatches,
        t.tieBreakOrder ?? t.tieBreakRule,
        seedOf,
        t.seed,
        points,
      );
      if (draw.manualStandingsOrder) {
        for (const pool of draw.pools) {
          const ord = draw.manualStandingsOrder[pool.id];
          if (ord) map.set(pool.id, applyManualOrder(map.get(pool.id) ?? [], ord));
        }
      }
      standings = Object.fromEntries(map);
    }
    out[catId] = {
      name: config.categories.find((c) => c.id === catId)?.name ?? catId,
      advancePerPool: t.advancePerPool ?? 2,
      standings,
      seedOrder,
    };
  }
  return out;
}

function toConsolePlayer(p: ArenaPlayer): Player {
  return { id: p.id, name: p.name, rating: p.rating, club: p.clubName ?? "", state: p.state };
}

/** A console player built straight off a registration, when the player record
 *  can't be resolved (a real sign-up not in this browser's roster snapshot). */
function playerFromRegistration(r: TournamentRegistration): Player {
  return { id: r.playerId, name: r.playerName || "Player", rating: 1500, club: "", state: "" };
}

/**
 * Registered entrants for one category — the seeded roster plus live sign-ups.
 *
 * `soleCategory` is true for a host-created tournament: its console has exactly
 * one division, so the tournament record *is* that division and every
 * registration on it belongs here (no player-bracket matching). Seed
 * tournaments with several bracket categories still match on `player.category`.
 */
function rosterFor(
  t: ArenaTournament,
  categoryName: string,
  liveRegs: readonly TournamentRegistration[],
  resolve: ResolvePlayer = getPlayer,
  soleCategory = false,
): Player[] {
  const seen = new Set<string>();
  const out: Player[] = [];
  const push = (p: ArenaPlayer | Player | undefined) => {
    if (!p || seen.has(p.id)) return;
    seen.add(p.id);
    out.push("club" in p ? (p as Player) : toConsolePlayer(p as ArenaPlayer));
  };

  const roster = getTournamentPlayers(t);
  for (const p of roster) if (soleCategory || String(p.category) === categoryName) push(p);

  for (const r of liveRegs) {
    if (r.tournamentId !== t.id) continue;
    const p = resolve(r.playerId);
    if (soleCategory) {
      push(p ?? playerFromRegistration(r));
    } else if (p && String(p.category) === categoryName) {
      push(p);
    }
  }

  // Older mock tournaments carry a category label no registrant matches — fall
  // back to the whole roster so the workspace isn't empty.
  if (out.length === 0 && !soleCategory) for (const p of roster) push(p);
  return out;
}

function emptyDraw(
  categoryId: string,
  players: Player[] = [],
  unpaired: PairMember[] = [],
): CategoryDraw {
  return {
    categoryId,
    players,
    unpaired,
    manualSeedOrder: null,
    pools: null,
    poolMatches: [],
    poolMethod: "snake",
    manualStandingsOrder: null,
    manualQualifierIds: null,
    qualifierOrder: null,
    bracket: null,
  };
}

/** The fresh draw for one category. Doubles pairs its registrants two-by-two;
 *  the host re-pairs from the tray on the Players step. */
function initialDraw(
  t: ArenaTournament,
  category: CategoryEntry,
  liveRegs: readonly TournamentRegistration[],
  resolve: ResolvePlayer = getPlayer,
  soleCategory = false,
): CategoryDraw {
  const roster = rosterFor(t, category.name, liveRegs, resolve, soleCategory);
  if (category.format === "doubles") {
    const { teams, unpaired } = pairRoster(roster, `${t.id}:${category.id}`);
    return emptyDraw(category.id, teams, unpaired);
  }
  return emptyDraw(category.id, roster);
}

function initialState(
  t: ArenaTournament,
  liveRegs: readonly TournamentRegistration[],
  resolve: ResolvePlayer = getPlayer,
): StoredMatches {
  const config = baseConfig(t);
  const soleCategory = config.categories.length === 1;
  const draws: Record<string, CategoryDraw> = {};
  for (const c of config.categories) {
    draws[c.id] = initialDraw(t, c, liveRegs, resolve, soleCategory);
  }
  return {
    stage: "players",
    activeCategoryId: config.categories[0].id,
    configPatch: {},
    draws,
    published: {},
    scheduleReleases: {},
  };
}

function readAll(): Record<string, StoredMatches> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Rebuild a full workspace state from whatever is persisted for this
 * tournament, reconciled against the current config. `keepNav` preserves the
 * local viewer's step + active category so an external write (another tab, the
 * host, or an assistant on /assist) is adopted without yanking them around.
 * Used both for the initial hydrate and for live cross-tab sync.
 */
function reconcile(
  stored: StoredMatches | undefined,
  config: ReturnType<typeof baseConfig>,
  t: ArenaTournament,
  liveRegs: readonly TournamentRegistration[],
  resolve: ResolvePlayer = getPlayer,
  keepNav?: { stage: Stage; activeCategoryId: string },
): StoredMatches {
  const soleCategory = config.categories.length === 1;
  if (!stored || !stored.draws) return initialState(t, liveRegs, resolve);
  const draws: Record<string, CategoryDraw> = {};
  for (const c of config.categories) {
    const saved = stored.draws[c.id];
    if (!saved) {
      draws[c.id] = initialDraw(t, c, liveRegs, resolve, soleCategory);
      continue;
    }
    // While still setting up (no pools/bracket yet), keep the entry list in
    // step with registrations — pull in anyone who has since signed up.
    const settingUp = !saved.pools && !saved.bracket && c.format !== "doubles";
    if (settingUp) {
      const have = new Set(saved.players.map((p) => p.id));
      const added = rosterFor(t, c.name, liveRegs, resolve, soleCategory).filter(
        (p) => !have.has(p.id),
      );
      draws[c.id] = {
        ...saved,
        unpaired: saved.unpaired ?? [],
        players: added.length ? [...saved.players, ...added] : saved.players,
      };
    } else {
      draws[c.id] = { ...saved, unpaired: saved.unpaired ?? [] };
    }
  }
  const wantActive = keepNav?.activeCategoryId ?? stored.activeCategoryId;
  const activeCategoryId = draws[wantActive] ? wantActive : config.categories[0].id;
  return {
    stage: keepNav?.stage ?? stored.stage ?? "players",
    activeCategoryId,
    configPatch: stored.configPatch ?? {},
    draws,
    published: stored.published ?? {},
    scheduleReleases: stored.scheduleReleases ?? {},
  };
}

/* --------------------------------------------------------------- helpers */

function syncPools(draw: CategoryDraw, pools: Pool[] | null, tables: number): CategoryDraw {
  if (!pools) return { ...draw, pools: null, poolMatches: [] };
  const { pools: clean } = reconcilePools(pools, draw.players);
  return {
    ...draw,
    pools: clean,
    poolMatches: generateAllPoolMatches(clean, draw.poolMatches, tables),
  };
}

function afterPlayerChange(draw: CategoryDraw, players: Player[], tables: number): CategoryDraw {
  const next = { ...draw, players };
  return next.pools ? syncPools(next, next.pools, tables) : next;
}

const clearedResult: MatchResultPatch = {
  games: [],
  winnerId: null,
  played: false,
  mode: null,
  duration: null,
};
const resetQualifierOverrides = { manualQualifierIds: null, qualifierOrder: null } as const;
// A change to who is in which pool makes any hand-set standings order meaningless.
const resetPoolOverrides = { ...resetQualifierOverrides, manualStandingsOrder: null } as const;

/* --------------------------------------------------------------- provider */

export function MatchesProvider({
  tournament: arenaTournament,
  children,
}: {
  tournament: ArenaTournament;
  children: React.ReactNode;
}) {
  const { registrations } = useRegistrations();
  const roster = usePlayerRoster();
  const status = useTournamentStatus();

  const config = useMemo(() => baseConfig(arenaTournament), [arenaTournament]);

  // Resolve a player id against the merged roster (real sign-ups carry their
  // own profile row) first, then the seed catalogue.
  const rosterMap = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster]);
  const resolvePlayer = useCallback<ResolvePlayer>(
    (id) => rosterMap.get(id) ?? getPlayer(id),
    [rosterMap],
  );
  const resolveRef = useRef(resolvePlayer);
  useEffect(() => {
    resolveRef.current = resolvePlayer;
  });

  const [state, setState] = useState<StoredMatches>(() =>
    initialState(arenaTournament, registrations, resolvePlayer),
  );
  const [hydrated, setHydrated] = useState(false);

  // `registrations` identity churns every render — the reconcile helpers only
  // need the latest value, not a re-subscription, so hold it in a ref.
  const regsRef = useRef(registrations);
  useEffect(() => {
    regsRef.current = registrations;
  });

  // Load any persisted draw for this tournament; otherwise keep the freshly
  // seeded one. Reconcile categories so a config change still lines up.
  useEffect(() => {
    const stored = readAll()[arenaTournament.id];
    if (stored && stored.draws) {
      setState(reconcile(stored, config, arenaTournament, regsRef.current, resolveRef.current));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaTournament.id]);

  // Live cross-tab / multi-login sync. The Matches console is now editable by
  // the host *and* by any assistant the host granted access to (via /assist),
  // possibly in several tabs at once. When another tab writes this tournament's
  // blob, adopt it — keeping this viewer's own step + active category. Writes
  // are whole-blob and last-write-wins, the same contract every other store in
  // this app uses; because every tab adopts on the `storage` event near-
  // instantly, concurrent edits interleave in practice.
  useEffect(() => {
    if (!hydrated) return;
    const adopt = () => {
      const stored = readAll()[arenaTournament.id];
      if (!stored || !stored.draws) return;
      setState((cur) => {
        const next = reconcile(stored, config, arenaTournament, regsRef.current, resolveRef.current, {
          stage: cur.stage,
          activeCategoryId: cur.activeCategoryId,
        });
        return JSON.stringify(next) === JSON.stringify(cur) ? cur : next;
      });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) adopt();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", adopt);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", adopt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, arenaTournament.id, config]);

  // Persist on every change once hydrated. A `feeds` snapshot is recomputed on
  // each write so the read-only player Match Centre never re-derives standings.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const all = readAll();
      all[arenaTournament.id] = { ...state, feeds: buildFeeds(state, config) };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      /* storage full or unavailable — the workspace still works for this session */
    }
  }, [hydrated, state, config, arenaTournament.id]);

  const mutate = useCallback((fn: (s: StoredMatches) => StoredMatches) => setState(fn), []);

  const mutateDraw = useCallback(
    (fn: (draw: CategoryDraw, tournament: ConsoleTournament) => CategoryDraw) =>
      mutate((s) => {
        const draw = s.draws[s.activeCategoryId];
        if (!draw) return s;
        const t = { ...config, ...s.configPatch };
        return { ...s, draws: { ...s.draws, [s.activeCategoryId]: fn(draw, t) } };
      }),
    [mutate, config],
  );

  const tournament: ConsoleTournament = { ...config, ...state.configPatch };

  const categories = tournament.categories;
  const activeCategory =
    categories.find((c) => c.id === state.activeCategoryId) ?? categories[0];
  const activeDraw = state.draws[state.activeCategoryId] ?? emptyDraw(activeCategory.id);

  /* -------------------------------------------------------- derived data */

  const seeded = useMemo(
    () => applySeedOrder(activeDraw.players, activeDraw.manualSeedOrder),
    [activeDraw.players, activeDraw.manualSeedOrder],
  );
  const playerById = useMemo(
    () => new Map(activeDraw.players.map((p) => [p.id, p])),
    [activeDraw.players],
  );
  const seedById = useMemo(() => new Map(seeded.map((p) => [p.id, p.seed])), [seeded]);
  const seedOf = useCallback((id: string) => seedById.get(id) ?? 9999, [seedById]);

  const recommendation = useMemo(
    () => recommendPools(activeDraw.players.length, tournament.poolSizePreference),
    [activeDraw.players.length, tournament.poolSizePreference],
  );

  const groupPoints: GamePoints = tournament.groupPoints ?? DEFAULT_POINTS;

  // Stable string key for the host's tie-break priority list, so the standings
  // memo only recomputes when the order actually changes (the `tournament`
  // object itself is rebuilt every render).
  const tieBreakKey = (tournament.tieBreakOrder ?? [tournament.tieBreakRule]).join(",");

  const standingsByPool = useMemo(() => {
    if (!activeDraw.pools) return new Map<string, RankedRow[]>();
    const computed = computeAllStandings(
      activeDraw.pools,
      activeDraw.poolMatches,
      tieBreakKey.split(",") as ConsoleTournament["tieBreakRule"][],
      seedOf,
      tournament.seed,
      groupPoints,
    );
    // A hand-set drag order (from the Pool Matches standings table) wins over
    // the computed ranking; everything downstream — qualification, the bracket
    // seeding, an rr_only champion — reads this map, so it all follows.
    const manual = activeDraw.manualStandingsOrder;
    if (manual) {
      for (const pool of activeDraw.pools) {
        if (manual[pool.id]) {
          computed.set(pool.id, applyManualOrder(computed.get(pool.id) ?? [], manual[pool.id]));
        }
      }
    }
    return computed;
  }, [
    activeDraw.pools,
    activeDraw.poolMatches,
    activeDraw.manualStandingsOrder,
    tieBreakKey,
    tournament.seed,
    seedOf,
    groupPoints,
  ]);

  const qualification = useMemo(() => {
    const overrides = {
      manualQualifierIds: activeDraw.manualQualifierIds,
      qualifierOrder: activeDraw.qualifierOrder,
    };
    if (tournament.format === "ko_only") return directEntry(seeded, overrides);
    if (!activeDraw.pools) return null;
    return computeQualification(activeDraw.pools, standingsByPool, {
      rule: tournament.qualificationRule,
      // Explicit "qualifiers per group" from the Set Rules screen overrides the
      // preset rule's advance count; no best-runner-up fill.
      advancePerPool: tournament.advancePerPool,
      fill: false,
      seedOf,
      ...overrides,
    });
  }, [
    activeDraw.pools,
    activeDraw.manualQualifierIds,
    activeDraw.qualifierOrder,
    standingsByPool,
    tournament.qualificationRule,
    tournament.advancePerPool,
    tournament.format,
    seeded,
    seedOf,
  ]);

  const poolsComplete = useMemo(
    () => activeDraw.poolMatches.length > 0 && activeDraw.poolMatches.every((m) => m.played),
    [activeDraw.poolMatches],
  );

  const champion = useMemo(() => {
    if (tournament.format === "rr_only") {
      if (!poolsComplete || !activeDraw.pools?.length) return null;
      return standingsByPool.get(activeDraw.pools[0].id)?.[0]?.playerId ?? null;
    }
    return activeDraw.bracket ? championId(activeDraw.bracket) : null;
  }, [activeDraw.bracket, activeDraw.pools, tournament.format, poolsComplete, standingsByPool]);

  const categorySummaries = useMemo<CategorySummary[]>(
    () =>
      categories.map((c) => {
        const draw = state.draws[c.id];
        return {
          ...c,
          players: draw?.players.length ?? 0,
          poolsAllocated: Boolean(draw?.pools),
          matchesPlayed: draw?.poolMatches.filter((m) => m.played).length ?? 0,
          matchesTotal: draw?.poolMatches.length ?? 0,
          hasBracket: Boolean(draw?.bracket),
          championId: draw?.bracket ? championId(draw.bracket) : null,
        };
      }),
    [categories, state.draws],
  );

  /* -------------------------------------------------------------- actions */

  const actions = useMemo<MatchesActions>(
    () => ({
      goto: (stage) => mutate((s) => ({ ...s, stage })),

      updateTournament: (patch) =>
        mutate((s) => {
          const configPatch = { ...s.configPatch, ...patch };
          let draws = s.draws;
          if (patch.tables) {
            const tables = patch.tables;
            draws = Object.fromEntries(
              Object.entries(s.draws).map(([id, d]) => [
                id,
                d.pools ? syncPools(d, d.pools, tables) : d,
              ]),
            );
          }
          return { ...s, configPatch, draws };
        }),

      switchCategory: (categoryId) =>
        mutate((s) => (s.draws[categoryId] ? { ...s, activeCategoryId: categoryId } : s)),

      setThirdPlace: (enabled) =>
        mutate((s) => ({
          ...s,
          configPatch: { ...s.configPatch, thirdPlace: enabled },
          draws: Object.fromEntries(
            Object.entries(s.draws).map(([id, d]) => [
              id,
              d.bracket ? { ...d, bracket: setThirdPlaceEnabled(d.bracket, enabled) } : d,
            ]),
          ),
        })),

      /* players -------------------------------------------------------- */

      generateSamplePlayers: (count, nameStyle, replace = true) =>
        mutateDraw((draw, t) => {
          const seed = `${t.seed}:${draw.categoryId}:${replace ? 0 : draw.players.length}`;
          const rolled = generatePlayers(count, seed, nameStyle, replace ? 0 : draw.players.length);
          return afterPlayerChange(
            draw,
            replace ? rolled : [...draw.players, ...rolled],
            t.tables,
          );
        }),

      addPlayer: (player = {}) =>
        mutateDraw((draw, t) =>
          afterPlayerChange(
            draw,
            [...draw.players, { ...blankPlayer(draw.players.length), ...player, id: uid("p") }],
            t.tables,
          ),
        ),

      addRegisteredPlayer: (person) =>
        mutateDraw((draw, t) =>
          draw.players.some((p) => p.id === person.id)
            ? draw
            : afterPlayerChange(draw, [...draw.players, { ...person }], t.tables),
        ),

      updatePlayer: (id, patch) =>
        mutateDraw((draw, t) =>
          afterPlayerChange(
            draw,
            draw.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
            t.tables,
          ),
        ),

      removePlayer: (id) =>
        mutateDraw((draw, t) =>
          afterPlayerChange(draw, draw.players.filter((p) => p.id !== id), t.tables),
        ),

      duplicatePlayer: (id) =>
        mutateDraw((draw, t) => {
          const i = draw.players.findIndex((p) => p.id === id);
          if (i < 0) return draw;
          const copy: Player = {
            ...draw.players[i],
            id: uid("p"),
            name: `${draw.players[i].name} (copy)`,
          };
          const players = [...draw.players];
          players.splice(i + 1, 0, copy);
          return afterPlayerChange(draw, players, t.tables);
        }),

      movePlayerOrder: (id, direction) =>
        mutateDraw((draw) => {
          const i = draw.players.findIndex((p) => p.id === id);
          const j = i + direction;
          if (i < 0 || j < 0 || j >= draw.players.length) return draw;
          const players = [...draw.players];
          [players[i], players[j]] = [players[j], players[i]];
          return { ...draw, players };
        }),

      setSeedOrder: (ids) =>
        mutateDraw((draw) => ({
          ...draw,
          manualSeedOrder:
            ids && ids.length
              ? ids.filter((id) => draw.players.some((p) => p.id === id))
              : null,
        })),

      clearPlayers: () => mutateDraw((draw, t) => afterPlayerChange(draw, [], t.tables)),

      syncFromRegistrations: () =>
        mutate((s) => {
          const draw = s.draws[s.activeCategoryId];
          if (!draw) return s;
          const category = categories.find((c) => c.id === s.activeCategoryId);
          if (!category) return s;
          const fresh = rosterFor(
            arenaTournament,
            category.name,
            registrations,
            resolveRef.current,
            categories.length === 1,
          );
          const have = new Set(draw.players.map((p) => p.id));
          const added = fresh.filter((p) => !have.has(p.id));
          if (added.length === 0) return s;
          const t = { ...config, ...s.configPatch };
          return {
            ...s,
            draws: {
              ...s.draws,
              [s.activeCategoryId]: afterPlayerChange(
                draw,
                [...draw.players, ...added],
                t.tables,
              ),
            },
          };
        }),

      /* doubles: pair building ------------------------------------- */

      splitPair: (teamId) =>
        mutateDraw((draw, t) => {
          const team = draw.players.find((p) => p.id === teamId);
          if (!team) return draw;
          return afterPlayerChange(
            {
              ...draw,
              unpaired: [...draw.unpaired, ...toMembers(team)],
              ...resetQualifierOverrides,
            },
            draw.players.filter((p) => p.id !== teamId),
            t.tables,
          );
        }),

      formPair: (memberIdA, memberIdB) =>
        mutateDraw((draw, t) => {
          const a = draw.unpaired.find((m) => m.id === memberIdA);
          const b = draw.unpaired.find((m) => m.id === memberIdB);
          if (!a || !b || a.id === b.id) return draw;
          return afterPlayerChange(
            {
              ...draw,
              unpaired: draw.unpaired.filter((m) => m.id !== a.id && m.id !== b.id),
              ...resetQualifierOverrides,
            },
            [...draw.players, makeTeam([a, b])],
            t.tables,
          );
        }),

      autoPairAll: () =>
        mutateDraw((draw, t) => {
          const { teams, unpaired } = autoPairMembers(allMembers(draw.players, draw.unpaired));
          return afterPlayerChange(
            { ...draw, unpaired, ...resetQualifierOverrides },
            teams,
            t.tables,
          );
        }),

      /* pools -------------------------------------------------------- */

      buildPools: ({ poolCount, method }) =>
        mutateDraw((draw, t) => {
          const count = Math.max(1, Math.min(poolCount, Math.max(1, draw.players.length)));
          const sizes = balancedSizes(draw.players.length, count);
          const rng = rngFor(t.seed, draw.categoryId, "alloc", method, count);
          const pools = allocate(method, seedPlayers(draw.players), sizes, rng);
          return syncPools(
            { ...draw, poolMethod: method, ...resetPoolOverrides },
            pools,
            t.tables,
          );
        }),

      shufflePools: () =>
        mutateDraw((draw, t) => {
          if (!draw.pools) return draw;
          const sizes = draw.pools.map((p) => p.playerIds.length);
          // Fresh nonce every click so each shuffle is a new random draw.
          const rng = rngFor(t.seed, draw.categoryId, "shuffle", Date.now(), Math.random());
          const shuffled = allocate("random", seedPlayers(draw.players), sizes, rng)
            .map((p, i) => ({ ...p, id: draw.pools![i].id, name: draw.pools![i].name }));
          return syncPools({ ...draw, ...resetPoolOverrides }, shuffled, t.tables);
        }),

      movePlayerToPool: (playerId, targetPoolId) =>
        mutateDraw((draw, t) => {
          if (!draw.pools) return draw;
          const pools = draw.pools.map((p) => ({
            ...p,
            playerIds: p.playerIds.filter((id) => id !== playerId),
          }));
          const target = pools.find((p) => p.id === targetPoolId);
          if (target) {
            target.playerIds = [...target.playerIds, playerId];
            target.capacity = Math.max(target.capacity, target.playerIds.length);
          }
          return syncPools({ ...draw, ...resetPoolOverrides }, pools, t.tables);
        }),

      renamePool: (poolId, name) =>
        mutateDraw((draw) => ({
          ...draw,
          pools: draw.pools?.map((p) => (p.id === poolId ? { ...p, name } : p)) ?? null,
        })),

      addPool: () =>
        mutateDraw((draw, t) => {
          const pools: Pool[] = [
            ...(draw.pools ?? []),
            {
              id: `pool_${uid("x")}`,
              name: `Pool ${poolLabel(draw.pools?.length ?? 0)}`,
              capacity: 0,
              playerIds: [],
            },
          ];
          return syncPools({ ...draw, ...resetPoolOverrides }, pools, t.tables);
        }),

      removePool: (poolId) =>
        mutateDraw((draw, t) => {
          if (!draw.pools) return draw;
          const victim = draw.pools.find((p) => p.id === poolId);
          const rest = draw.pools.filter((p) => p.id !== poolId);
          if (!victim || rest.length === 0) return draw;
          const pools = rest.map((p) => ({ ...p, playerIds: [...p.playerIds] }));
          for (const id of victim.playerIds) {
            pools.sort((a, b) => a.playerIds.length - b.playerIds.length);
            pools[0].playerIds.push(id);
          }
          pools.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          return syncPools(
            { ...draw, ...resetPoolOverrides },
            pools.map((p) => ({ ...p, capacity: p.playerIds.length })),
            t.tables,
          );
        }),

      /* pool matches ------------------------------------------------- */

      setPoolResult: (matchId, result) =>
        mutateDraw((draw) => ({
          ...draw,
          poolMatches: draw.poolMatches.map((m) => (m.id === matchId ? { ...m, ...result } : m)),
          ...resetQualifierOverrides,
        })),

      clearPoolResult: (matchId) =>
        mutateDraw((draw) => ({
          ...draw,
          poolMatches: draw.poolMatches.map((m) =>
            m.id === matchId ? { ...m, ...clearedResult } : m,
          ),
          ...resetQualifierOverrides,
        })),

      reorderStanding: (poolId, playerIds) =>
        mutateDraw((draw) => ({
          ...draw,
          manualStandingsOrder: { ...(draw.manualStandingsOrder ?? {}), [poolId]: playerIds },
          // The pool outcome the host just asserted changes who qualifies, so
          // any earlier hand-picked qualifier list is stale.
          ...resetQualifierOverrides,
        })),

      resetStandingsOrder: (poolId) =>
        mutateDraw((draw) => {
          if (!draw.manualStandingsOrder) return draw;
          if (!poolId) return { ...draw, manualStandingsOrder: null, ...resetQualifierOverrides };
          const next = { ...draw.manualStandingsOrder };
          delete next[poolId];
          return {
            ...draw,
            manualStandingsOrder: Object.keys(next).length ? next : null,
            ...resetQualifierOverrides,
          };
        }),

      /* qualification and knockout --------------------------------- */

      setManualQualifiers: (ids) =>
        mutateDraw((draw) => ({
          ...draw,
          manualQualifierIds: ids,
          qualifierOrder: ids ? draw.qualifierOrder : null,
        })),

      setQualifierOrder: (ids) =>
        mutateDraw((draw) => ({
          ...draw,
          qualifierOrder: ids,
          manualQualifierIds: ids ?? draw.manualQualifierIds,
        })),

      generateBracket: (qualifiers) =>
        mutate((s) => {
          const draw = s.draws[s.activeCategoryId];
          if (!draw) return s;
          const t = { ...config, ...s.configPatch };
          const bracket = buildBracket(qualifiers, {
            separatePools: t.separatePools,
            thirdPlace: t.thirdPlace,
          });
          return {
            ...s,
            draws: { ...s.draws, [s.activeCategoryId]: { ...draw, bracket } },
            stage: "knockout",
          };
        }),

      clearBracket: () => mutateDraw((draw) => ({ ...draw, bracket: null })),

      swapKnockoutPlayers: (playerIdA, playerIdB) =>
        mutateDraw((draw) => {
          if (!draw.bracket || playerIdA === playerIdB) return draw;
          const first = draw.bracket.rounds[0].map((m) => ({ ...m }));
          let touched = false;
          for (const m of first) {
            let changed = false;
            if (m.aId === playerIdA) { m.aId = playerIdB; changed = true; }
            else if (m.aId === playerIdB) { m.aId = playerIdA; changed = true; }
            if (m.bId === playerIdA) { m.bId = playerIdB; changed = true; }
            else if (m.bId === playerIdB) { m.bId = playerIdA; changed = true; }
            if (changed) {
              touched = true;
              // A new matchup invalidates any score already entered for it.
              if (m.played) {
                m.played = false;
                m.winnerId = null;
                m.games = [];
                m.mode = null;
                m.duration = null;
              }
            }
          }
          if (!touched) return draw;
          const seeding = draw.bracket.seeding.map((s) =>
            s.playerId === playerIdA
              ? { ...s, playerId: playerIdB }
              : s.playerId === playerIdB
                ? { ...s, playerId: playerIdA }
                : s,
          );
          return {
            ...draw,
            bracket: propagate({ ...draw.bracket, rounds: [first, ...draw.bracket.rounds.slice(1)], seeding }),
          };
        }),

      setKoResult: (matchId, result) =>
        mutateDraw((draw) =>
          draw.bracket
            ? { ...draw, bracket: setBracketResult(draw.bracket, matchId, result) }
            : draw,
        ),

      clearKoResult: (matchId) =>
        mutateDraw((draw) =>
          draw.bracket ? { ...draw, bracket: clearBracketResult(draw.bracket, matchId) } : draw,
        ),

      publishStage: (stageKey) =>
        mutate((s) => {
          const current = s.scheduleReleases[s.activeCategoryId] ?? [];
          if (current.includes(stageKey)) return s;
          return {
            ...s,
            scheduleReleases: {
              ...s.scheduleReleases,
              [s.activeCategoryId]: [...current, stageKey],
            },
          };
        }),

      unpublishStage: (stageKey) =>
        mutate((s) => {
          const current = s.scheduleReleases[s.activeCategoryId] ?? [];
          if (!current.includes(stageKey)) return s;
          return {
            ...s,
            scheduleReleases: {
              ...s.scheduleReleases,
              [s.activeCategoryId]: current.filter((k) => k !== stageKey),
            },
          };
        }),

      // The Champion screen already knows the placings — it passes them in, so
      // this action just records them and marks the event completed. (Both
      // setState calls stay outside each other's updaters.)
      publishResults: (result) => {
        status.complete(arenaTournament.id);
        mutate((s) => ({
          ...s,
          published: { ...s.published, [s.activeCategoryId]: result },
        }));
      },
    }),
    [mutate, mutateDraw, config, categories, arenaTournament, registrations, status],
  );

  const value: MatchesContextValue = {
    hydrated,
    stage: state.stage,
    tournament,
    activeCategoryId: state.activeCategoryId,
    activeCategory,
    categories,
    categorySummaries,
    isDoubles: activeCategory.format === "doubles",
    players: activeDraw.players,
    unpaired: activeDraw.unpaired ?? [],
    pools: activeDraw.pools,
    poolMatches: activeDraw.poolMatches,
    poolMethod: activeDraw.poolMethod,
    manualStandingsOrder: activeDraw.manualStandingsOrder ?? null,
    manualQualifierIds: activeDraw.manualQualifierIds,
    qualifierOrder: activeDraw.qualifierOrder,
    bracket: activeDraw.bracket,
    releasedStages: state.scheduleReleases[state.activeCategoryId] ?? [],
    seeded,
    playerById,
    seedOf,
    recommendation,
    standingsByPool,
    qualification,
    poolsComplete,
    champion,
    published: state.published[state.activeCategoryId],
    projectedBracket: nextPowerOfTwo(Math.max(2, activeDraw.players.length)),
    actions,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
