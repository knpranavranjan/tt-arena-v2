"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, ChevronRight, Clock, ListOrdered, MapPin, Radio, Trophy } from "lucide-react";

import { useCurrentPlayer } from "@/lib/session-data";
import { useRegistrations } from "@/lib/registrations";
import { getEvent, getTournament } from "@/lib/mock-data";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { useConsoleTournamentIds, useLiveTournaments, type LiveCategory } from "@/lib/live-schedule";
import { POOLS_STAGE, log2, roundName, roundShortName } from "@/lib/tournament/bracketMath";
import { gameTally } from "@/lib/tournament/scoring";
import { formatDate } from "@/lib/format";
import { duration, ease, fadeUp, liveDotPulse, staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { GameScore } from "@/lib/tournament/types";
import type { Tournament } from "@/lib/types";

const display = { fontFamily: "var(--font-home-display)" };
const mono = { fontFamily: "var(--font-home-mono)" };

/** One live tournament as the player sees it — the event, with every category
 *  the host has published a draw for as a switchable button. */
interface LiveEvent {
  eventId: string;
  name: string;
  date: string;
  venue: string;
  cats: { key: string; category: LiveCategory }[];
}

/* -------------------------------------------------------------- page ---- */

export default function PlayerMatchCentrePage() {
  const player = useCurrentPlayer();
  const { registrations } = useRegistrations();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const consoleIds = useConsoleTournamentIds(player?.id);
  const reduce = useReducedMotion();

  const registered = useMemo<Tournament[]>(() => {
    if (!player) return [];
    const byId = new Map<string, Tournament>();
    for (const t of allTournaments) {
      if (t.registeredPlayerIds.includes(player.id)) byId.set(t.id, t);
    }
    for (const r of registrations) {
      if (r.playerId !== player.id || r.status !== "REGISTERED" || byId.has(r.tournamentId)) continue;
      const t = getTournament(r.tournamentId);
      if (t) byId.set(t.id, t);
    }
    // Host entered them by unique ID on the console — they still get the feed.
    for (const id of consoleIds) {
      if (byId.has(id)) continue;
      const t = allTournaments.find((x) => x.id === id);
      if (t) byId.set(id, t);
    }
    return [...byId.values()];
  }, [player, registrations, allTournaments, consoleIds]);

  const { tournaments: live, isLoading } = useLiveTournaments(registered);

  // One entry per EVENT — the host publishes a draw per category (each its own
  // Tournament row), but the player sees a single tournament with its categories
  // as buttons. Fold every live category of an event into one card.
  const liveEvents = useMemo<LiveEvent[]>(() => {
    const byEvent = new Map<string, LiveEvent>();
    for (const lt of live) {
      const t =
        allTournaments.find((x) => x.id === lt.tournamentId) ?? getTournament(lt.tournamentId);
      const eventId = t?.eventId ?? lt.tournamentId;
      const eventName =
        allEvents.find((e) => e.id === eventId)?.name ??
        getEvent(eventId)?.name ??
        lt.name.split(/\s+[—–-]\s+/)[0];
      const entry =
        byEvent.get(eventId) ??
        ({
          eventId,
          name: eventName,
          date: t?.date ?? lt.date,
          venue: t?.venue ?? "",
          cats: [],
        } satisfies LiveEvent);
      for (const c of lt.categories) {
        entry.cats.push({ key: `${lt.tournamentId}:${c.id}`, category: c });
      }
      byEvent.set(eventId, entry);
    }
    return [...byEvent.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [live, allTournaments, allEvents]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = liveEvents.find((e) => e.eventId === selectedId) ?? liveEvents[0] ?? null;

  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const cat =
    selected?.cats.find((c) => c.key === categoryKey) ?? selected?.cats[0] ?? null;
  const category = cat?.category ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl" style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="flex items-center gap-2.5 text-2xl font-extrabold uppercase tracking-tight text-[#e8e8ee] sm:text-[30px]"
            style={display}
          >
            <Radio className="h-6 w-6 text-[#ff2448]" strokeWidth={2.25} />
            Match Centre
          </h1>
          <p className="mt-1.5 text-sm text-[#8b8b93]">
            Every match in your tournaments on one timeline — results as they land, upcoming ones queued. Read-only.
          </p>
        </div>
        {liveEvents.length > 0 && (
          <span
            className="inline-flex items-center gap-2 rounded-full border border-[#ff2448]/30 bg-[#ff2448]/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#ff8f86]"
            style={mono}
          >
            <LiveDot reduce={!!reduce} />
            {liveEvents.length} live
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-[14px] border border-white/10 bg-white/[0.02]" />
      ) : liveEvents.length === 0 ? (
        <EmptyState hasRegistrations={registered.length > 0} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[288px_1fr]">
          <motion.aside
            className="flex flex-col gap-3"
            variants={staggerChildren(50)}
            initial="hidden"
            animate="show"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f78]" style={mono}>
              Your tournaments
            </p>
            {liveEvents.map((e) => (
              <TournamentCard
                key={e.eventId}
                name={e.name}
                date={e.date}
                categoryCount={e.cats.length}
                active={selected?.eventId === e.eventId}
                onSelect={() => {
                  setSelectedId(e.eventId);
                  setCategoryKey(null);
                }}
                stageChips={railChips(e.cats[0]?.category)}
                reduce={!!reduce}
              />
            ))}
          </motion.aside>

          <div className="min-w-0">
            {selected && (
              <>
                <TournamentHead name={selected.name} date={selected.date} venue={selected.venue} />

                {selected.cats.length > 1 && (
                  <div className="mb-6 inline-flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
                    {selected.cats.map((c) => {
                      const on = cat?.key === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setCategoryKey(c.key)}
                          className={cn(
                            "relative rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                            on ? "text-white" : "text-[#9a9aa2] hover:text-white",
                          )}
                          style={mono}
                        >
                          {on && (
                            <motion.span
                              layoutId="mc-cat-pill"
                              className="absolute inset-0 rounded-full bg-[#ff2448]"
                              transition={{ type: "spring", damping: 26, stiffness: 320 }}
                            />
                          )}
                          <span className="relative">{c.category.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {category && cat && (
                    <motion.div
                      key={`${selected.eventId}:${cat.key}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <CategoryBoard category={category} playerId={player?.id} reduce={!!reduce} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ pieces ---- */

function LiveDot({ reduce }: { reduce: boolean }) {
  return (
    <motion.span
      className="h-1.5 w-1.5 rounded-full bg-[#ff2448]"
      variants={reduce ? undefined : liveDotPulse}
      animate={reduce ? undefined : "animate"}
    />
  );
}

function EmptyState({ hasRegistrations }: { hasRegistrations: boolean }) {
  return (
    <div className="rounded-[14px] border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
        <Radio className="h-5 w-5 text-[#8b8b93]" strokeWidth={2} />
      </div>
      <p className="text-sm font-semibold text-[#e2e2e8]" style={display}>
        Nothing live yet
      </p>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#8b8b93]">
        {hasRegistrations
          ? "As soon as a host publishes a pool schedule or a knockout round for a tournament you're in, it lands here."
          : "Register for a tournament — the host's published draw will show up here."}
      </p>
    </div>
  );
}

function railChips(cat: LiveCategory | undefined): { label: string; on: boolean }[] {
  if (!cat) return [];
  const chips: { label: string; on: boolean }[] = [
    { label: "Groups", on: cat.releasedStages.includes(POOLS_STAGE) },
  ];
  const size = cat.bracket?.size;
  if (size) {
    for (let i = 0; i < log2(size); i++) {
      const key = roundName(size / 2 ** i);
      chips.push({ label: shortRound(key), on: cat.releasedStages.includes(key) });
    }
  } else {
    chips.push({ label: "KO", on: false });
  }
  return chips;
}

function shortRound(name: string) {
  if (name === "Quarter Final") return "QF";
  if (name === "Semi Final") return "SF";
  if (name === "Final") return "F";
  const m = /Round of (\d+)/.exec(name);
  return m ? `R${m[1]}` : name;
}

function TournamentCard({
  name,
  date,
  categoryCount,
  active,
  onSelect,
  stageChips,
  reduce,
}: {
  name: string;
  date: string;
  categoryCount: number;
  active: boolean;
  onSelect: () => void;
  stageChips: { label: string; on: boolean }[];
  reduce: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      variants={fadeUp}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-[12px] border p-4 text-left transition-colors",
        active
          ? "border-[#ff2448]/50 bg-gradient-to-br from-[#ff2448]/[0.12] to-transparent"
          : "border-white/10 bg-white/[0.03] hover:border-white/25",
      )}
    >
      {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#ff2448]" />}
      <div className="flex items-center gap-2">
        <LiveDot reduce={reduce} />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8b93]" style={mono}>
          Live
        </span>
      </div>
      <p className="mt-1.5 text-sm font-bold leading-tight text-[#e8e8ee]">{name}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8b8b93]">
        <Calendar className="h-3 w-3" strokeWidth={1.75} />
        {formatDate(date)}
        <span className="text-[#4a4a52]">·</span>
        {categoryCount} categor{categoryCount === 1 ? "y" : "ies"}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {stageChips.map((s, i) => (
          <span
            key={i}
            className={cn(
              "rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              s.on ? "bg-[#ff2448]/15 text-[#ff8f86]" : "bg-white/[0.04] text-[#5a5a62]",
            )}
            style={mono}
          >
            {s.label}
          </span>
        ))}
      </div>
    </motion.button>
  );
}

function TournamentHead({ name, date, venue }: { name: string; date: string; venue: string }) {
  // The title is the event's own name — the category is chosen with the pills
  // below, so it never belongs in the header.
  const title = name;
  return (
    <div className="relative mb-5 overflow-hidden rounded-[14px] border border-white/10 bg-[#0c0e12] p-6">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#ff2448]/[0.14] blur-3xl"
        aria-hidden
      />
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff8f86]" style={mono}>
        Tournament
      </p>
      <h2 className="mt-1 text-xl font-extrabold uppercase tracking-tight text-[#e8e8ee] sm:text-2xl" style={display}>
        {title}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8b8b93]">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-[#ff2448]" strokeWidth={1.75} />
          {formatDate(date)}
        </span>
        {venue && (
          <>
            <span className="text-[#4a4a52]">·</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#ff2448]" strokeWidth={1.75} />
              {venue}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------- match model -- */

interface TLMatch {
  key: string;
  stageKey: string;
  stageLabel: string;
  context: string;
  aName: string;
  bName: string;
  aIsMe: boolean;
  bIsMe: boolean;
  played: boolean;
  aScores: number[];
  bScores: number[];
  aGames: number;
  bGames: number;
  aWon: boolean;
  bWon: boolean;
  /** both players known, not yet played */
  scheduled: boolean;
  /** waiting on an earlier round to produce a player */
  pending: boolean;
}

function buildTimeline(category: LiveCategory, playerId?: string): TLMatch[] {
  const items: TLMatch[] = [];
  const nameOf = category.nameOf;

  const push = (
    stageKey: string,
    stageLabel: string,
    context: string,
    aId: string | null,
    bId: string | null,
    winnerId: string | null,
    played: boolean,
    games: GameScore[],
    keyBase: string,
  ) => {
    const [ga, gb] = played ? gameTally(games).split("-").map(Number) : [0, 0];
    items.push({
      key: keyBase,
      stageKey,
      stageLabel,
      context,
      aName: aId ? nameOf(aId) : "TBD",
      bName: bId ? nameOf(bId) : "TBD",
      aIsMe: aId === playerId,
      bIsMe: bId === playerId,
      played,
      aScores: played ? games.map((g) => g[0]) : [],
      bScores: played ? games.map((g) => g[1]) : [],
      aGames: ga,
      bGames: gb,
      aWon: played && winnerId === aId,
      bWon: played && winnerId === bId,
      scheduled: !played && Boolean(aId && bId),
      pending: !played && !(aId && bId),
    });
  };

  if (category.poolsReleased) {
    for (const pool of category.pools) {
      const fx = category.poolMatches.filter((m) => m.poolId === pool.id);
      // played first, then scheduled
      fx
        .map((m, i) => ({ m, i }))
        .sort((x, y) => Number(y.m.played) - Number(x.m.played) || x.i - y.i)
        .forEach(({ m, i }) =>
          push("Group Stage", "Group Stage", `${pool.name} · Match ${i + 1}`, m.aId, m.bId, m.winnerId, m.played, m.games, m.id),
        );
    }
  }

  if (category.bracket) {
    const size = category.bracket.size;
    category.bracket.rounds.forEach((round, i) => {
      const label = roundName(size / 2 ** i);
      round
        .filter((m) => !m.isBye)
        .forEach((m) => push(label, label, "", m.aId, m.bId, m.winnerId, m.played, m.games, m.id));
    });
    if (category.bracket.thirdPlace && !category.bracket.thirdPlace.isBye) {
      const m = category.bracket.thirdPlace;
      push("Third Place", "Third Place", "", m.aId, m.bId, m.winnerId, m.played, m.games, m.id);
    }
  }

  return items;
}

/* ------------------------------------------------------ category board -- */

function CategoryBoard({
  category,
  playerId,
  reduce,
}: {
  category: LiveCategory;
  playerId?: string;
  reduce: boolean;
}) {
  const nothing = !category.poolsReleased && !category.bracket;
  const [view, setView] = useState<"timeline" | "standings">("timeline");
  const timeline = useMemo(() => buildTimeline(category, playerId), [category, playerId]);

  const myNext = timeline.find((m) => m.scheduled && (m.aIsMe || m.bIsMe));
  const played = timeline.filter((m) => m.played).length;

  // group consecutive same-stage items so we render one stage marker each
  const groups: { stageLabel: string; done: boolean; items: TLMatch[] }[] = [];
  for (const m of timeline) {
    const last = groups[groups.length - 1];
    if (last && last.stageLabel === m.stageLabel) last.items.push(m);
    else groups.push({ stageLabel: m.stageLabel, done: false, items: [m] });
  }
  for (const g of groups) g.done = g.items.every((m) => m.played);

  return (
    <div className="space-y-8">
      <StageRail category={category} reduce={reduce} />

      {nothing && (
        <p className="rounded-[12px] border border-dashed border-white/15 p-8 text-center text-sm text-[#8b8b93]">
          The host hasn&apos;t published this category&apos;s schedule yet.
        </p>
      )}

      {myNext && (
        <div className="flex items-center gap-3 rounded-[12px] border border-[#ff2448]/40 bg-gradient-to-r from-[#ff2448]/[0.12] to-transparent p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff2448]/15">
            <Clock className="h-4 w-4 text-[#ff8f86]" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff8f86]" style={mono}>
              Your next match · {myNext.stageLabel}
              {myNext.context ? ` · ${myNext.context}` : ""}
            </p>
            <p className="truncate text-sm font-semibold text-[#e8e8ee]">
              <span className={cn(myNext.aIsMe && "text-[#ff8f86]")}>{myNext.aName}</span>{" "}
              <span className="text-[#6f6f78]">vs</span>{" "}
              <span className={cn(myNext.bIsMe && "text-[#ff8f86]")}>{myNext.bName}</span>
            </p>
          </div>
        </div>
      )}

      {(timeline.length > 0 || category.poolsReleased) && (
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              {(["timeline", "standings"] as const).map((v) => {
                const on = view === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
                      on ? "text-white" : "text-[#9a9aa2] hover:text-white",
                    )}
                    style={mono}
                  >
                    {on && (
                      <motion.span
                        layoutId="mc-view-pill"
                        className="absolute inset-0 rounded-full bg-[#ff2448]"
                        transition={{ type: "spring", damping: 26, stiffness: 320 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {v === "standings" && <ListOrdered className="h-3.5 w-3.5" strokeWidth={2.5} />}
                      {v === "timeline" ? "Timeline" : "Standings"}
                    </span>
                  </button>
                );
              })}
            </div>
            {view === "timeline" && (
              <span className="text-[11px] tabular-nums text-[#6f6f78]" style={mono}>
                {played}/{timeline.length} played
              </span>
            )}
          </div>

          {view === "timeline" ? (
            <Timeline groups={groups} reduce={reduce} />
          ) : (
            <StandingsView category={category} playerId={playerId} />
          )}
        </section>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- standings -- */

interface MiniRow {
  playerId: string;
  rank: number;
  played: number;
  won: number;
  lost: number;
  gameDiff: number;
  matchPoints: number;
}

const rowLayout = { layout: { duration: duration.complex, ease: ease.out } } as const;

function StandingsView({ category, playerId }: { category: LiveCategory; playerId?: string }) {
  if (!category.poolsReleased) {
    return (
      <p className="rounded-[14px] border border-dashed border-white/15 bg-white/[0.015] p-10 text-center text-sm text-[#8b8b93]">
        Pool standings show up here the moment the host publishes the group stage.
      </p>
    );
  }

  return (
    <motion.div
      className="space-y-10"
      variants={staggerChildren(70)}
      initial="hidden"
      animate="show"
    >
      <div className="space-y-6">
        {category.pools.map((pool, pi) => {
          const ranked = category.standings[pool.id];
          const rows: MiniRow[] =
            ranked && ranked.length > 0
              ? ranked.map((r) => ({
                  playerId: r.playerId,
                  rank: r.rank,
                  played: r.played,
                  won: r.won,
                  lost: r.lost,
                  gameDiff: r.gameDiff,
                  matchPoints: r.matchPoints,
                }))
              : pool.playerIds.map((id, i) => ({
                  playerId: id,
                  rank: i + 1,
                  played: 0,
                  won: 0,
                  lost: 0,
                  gameDiff: 0,
                  matchPoints: 0,
                }));
          return (
            <PoolStandings
              key={pool.id}
              label={pool.name}
              badge={String.fromCharCode(65 + pi)}
              rows={rows}
              nameOf={category.nameOf}
              playerId={playerId}
              advance={category.advancePerPool}
            />
          );
        })}
      </div>

      <motion.div variants={fadeUp}>
        {category.bracket ? (
          <KnockoutLadder category={category} playerId={playerId} />
        ) : (
          <div className="rounded-[14px] border border-dashed border-white/15 bg-white/[0.015] p-8 text-center">
            <p className="text-sm font-semibold text-[#d4d6dd]" style={display}>
              Knockout result locked
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[#8b8b93]">
              Once the host publishes the knockout draw, the qualifiers appear here with their
              group record and re-rank live after every round.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function PoolStandings({
  label,
  badge,
  rows,
  nameOf,
  playerId,
  advance,
}: {
  label: string;
  badge: string;
  rows: MiniRow[];
  nameOf: (id: string | null | undefined) => string;
  playerId?: string;
  advance: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="overflow-hidden rounded-[16px] border border-white/10 bg-[#0c0e12] shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff2448]/15 text-xs font-extrabold text-[#ff8f86]"
            style={mono}
          >
            {badge}
          </span>
          <span
            className="text-[15px] font-extrabold uppercase tracking-[0.12em] text-[#f1f1f4]"
            style={mono}
          >
            {label}
          </span>
        </div>
        <span
          className="rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300/90"
          style={mono}
        >
          Top {advance} advance
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.14em] text-[#6f6f78]" style={mono}>
              <th className="w-16 px-3 py-3 text-center">Pos</th>
              <th className="px-3 py-3 pl-5">Player</th>
              <th className="w-11 px-2 py-3 text-center" title="Played">P</th>
              <th className="w-11 px-2 py-3 text-center" title="Won">W</th>
              <th className="w-11 px-2 py-3 text-center" title="Lost">L</th>
              <th className="w-14 px-2 py-3 text-center" title="Game difference">GD</th>
              <th className="w-16 px-3 py-3 pr-5 text-center" title="Table points">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const me = Boolean(playerId) && r.playerId === playerId;
              const q = r.rank <= advance;
              return (
                <motion.tr
                  key={r.playerId}
                  layout="position"
                  transition={rowLayout}
                  className={cn(
                    "border-t border-white/[0.06] text-[14px]",
                    me && "bg-[#ff2448]/[0.08]",
                  )}
                >
                  <td className="px-3 py-3.5 text-center">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-extrabold tabular-nums",
                        q
                          ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-inset ring-emerald-400/40"
                          : "bg-white/[0.04] text-[#8b8b93]",
                      )}
                      style={mono}
                    >
                      {r.rank}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 pl-5">
                    <span className="flex items-center gap-2.5">
                      {me && <span className="h-4 w-[3px] shrink-0 rounded-full bg-[#ff2448]" />}
                      <span
                        className={cn(
                          "truncate",
                          me ? "font-bold text-[#f6f6f8]" : "font-medium text-[#d4d6dd]",
                        )}
                      >
                        {nameOf(r.playerId)}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-[#9a9aa2]">{r.played}</td>
                  <td className="px-2 py-3.5 text-center font-semibold tabular-nums text-emerald-300/90">
                    {r.won}
                  </td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-[#ff8f86]/75">{r.lost}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-[#9a9aa2]">
                    {r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}
                  </td>
                  <td className="px-3 py-3.5 pr-5 text-center text-[17px] font-extrabold tabular-nums text-[#f6f6f8]">
                    {r.matchPoints}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* --------------------------------------------------- knockout result --- */

type KoState =
  | { kind: "champion" }
  | { kind: "runnerUp" }
  | { kind: "third" }
  | { kind: "fourth" }
  | { kind: "alive"; label: string }
  | { kind: "out"; label: string }
  | { kind: "seeded" };

/** Where a qualifier currently stands in the (possibly partial) bracket. */
function koStateFor(bracket: NonNullable<LiveCategory["bracket"]>, id: string): KoState {
  const size = bracket.size;
  const finalRoundIdx = log2(size) - 1;

  const tp = bracket.thirdPlace;
  if (tp && !tp.isBye && (tp.aId === id || tp.bId === id)) {
    if (tp.played) return tp.winnerId === id ? { kind: "third" } : { kind: "fourth" };
    return { kind: "alive", label: "Third Place" };
  }

  for (let i = 0; i < bracket.rounds.length; i++) {
    const remaining = size / 2 ** i;
    const m = bracket.rounds[i].find((x) => !x.isBye && (x.aId === id || x.bId === id));
    if (!m) continue;
    if (!m.played) return { kind: "alive", label: roundName(remaining) };
    if (m.winnerId === id) {
      if (i === finalRoundIdx) return { kind: "champion" };
      const laterHasThem = bracket.rounds
        .slice(i + 1)
        .some((r) => r.some((x) => x.aId === id || x.bId === id));
      if (!laterHasThem) return { kind: "alive", label: roundName(size / 2 ** (i + 1)) };
      continue;
    }
    return i === finalRoundIdx
      ? { kind: "runnerUp" }
      : { kind: "out", label: roundShortName(remaining) };
  }
  return { kind: "seeded" };
}

function koRankKey(s: KoState): number {
  switch (s.kind) {
    case "champion":
      return 7000;
    case "runnerUp":
      return 6000;
    case "third":
      return 5000;
    case "fourth":
      return 4000;
    case "alive":
      // still in it — deeper round (fewer letters/higher label) ranks near the top
      return 3000 + labelDepth(s.label);
    case "seeded":
      return 2000;
    case "out":
      return 1000 + labelDepth(s.label);
  }
}

function labelDepth(label: string): number {
  if (label === "Final" || label === "F") return 90;
  if (label === "Semi Final" || label === "SF" || label === "Third Place") return 70;
  if (label === "Quarter Final" || label === "QF") return 50;
  const m = /R(?:ound of )?(\d+)/.exec(label);
  return m ? Math.max(1, 40 - Number(m[1])) : 30;
}

function koPill(s: KoState): { text: string; className: string; live?: boolean } {
  switch (s.kind) {
    case "champion":
      return { text: "Champion", className: "border-amber-400/45 bg-amber-400/15 text-amber-200" };
    case "runnerUp":
      return { text: "Runner-up", className: "border-white/25 bg-white/[0.07] text-[#dfe0e6]" };
    case "third":
      return { text: "3rd place", className: "border-orange-400/40 bg-orange-400/12 text-orange-300" };
    case "fourth":
      return { text: "4th place", className: "border-white/12 bg-white/[0.04] text-[#9a9aa2]" };
    case "alive":
      return {
        text: `In ${s.label}`,
        className: "border-[#ff2448]/45 bg-[#ff2448]/15 text-[#ff8f86]",
        live: true,
      };
    case "seeded":
      return { text: "Awaiting draw", className: "border-white/12 bg-white/[0.03] text-[#8b8b93]" };
    case "out":
      return { text: `Lost ${s.label}`, className: "border-white/10 bg-white/[0.03] text-[#8b8b93]" };
  }
}

function KnockoutLadder({ category, playerId }: { category: LiveCategory; playerId?: string }) {
  const bracket = category.bracket;

  const list = useMemo(() => {
    if (!bracket) return [];
    const poolLetter = new Map(category.pools.map((p, i) => [p.id, String.fromCharCode(65 + i)]));
    return bracket.seeding
      .filter((s) => s.playerId)
      .map((slot) => {
        const id = slot.playerId as string;
        const state = koStateFor(bracket, id);
        const poolRow = slot.poolId
          ? (category.standings[slot.poolId] ?? []).find((r) => r.playerId === id)
          : undefined;
        return {
          id,
          seed: slot.slot + 1,
          poolLetter: slot.poolId ? poolLetter.get(slot.poolId) : undefined,
          rankInPool: slot.rankInPool,
          played: poolRow?.played ?? 0,
          won: poolRow?.won ?? 0,
          lost: poolRow?.lost ?? 0,
          gameDiff: poolRow?.gameDiff ?? 0,
          matchPoints: poolRow?.matchPoints ?? 0,
          state,
          sortKey: koRankKey(state),
        };
      })
      .sort((a, b) => b.sortKey - a.sortKey || a.seed - b.seed);
  }, [bracket, category.pools, category.standings]);

  if (list.length === 0) return null;

  const anyResult = list.some((e) => e.state.kind !== "seeded");

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#ff2448]/25 bg-gradient-to-b from-[#ff2448]/[0.06] to-[#0c0e12]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <div>
          <div
            className="flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-[0.12em] text-[#f1f1f4]"
            style={mono}
          >
            <Trophy className="h-4 w-4 text-[#ff8f86]" strokeWidth={2.5} />
            Knockout Result
          </div>
          <p className="mt-1 text-[11px] text-[#8b8b93]" style={mono}>
            {anyResult
              ? "Ranked by how far each qualifier has gone — updates the moment the host publishes a round."
              : "Qualifiers with their group record — this table ranks by result as the knockout is played."}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.14em] text-[#6f6f78]" style={mono}>
              <th className="w-14 px-3 py-3 text-center">Pos</th>
              <th className="px-3 py-3 pl-5">Player</th>
              <th className="w-20 px-2 py-3">Pool</th>
              <th className="w-10 px-2 py-3 text-center" title="Played">P</th>
              <th className="w-10 px-2 py-3 text-center" title="Won">W</th>
              <th className="w-10 px-2 py-3 text-center" title="Lost">L</th>
              <th className="w-12 px-2 py-3 text-center" title="Game difference">GD</th>
              <th className="w-12 px-2 py-3 text-center" title="Table points">Pts</th>
              <th className="px-3 py-3 pr-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e, i) => {
              const me = Boolean(playerId) && e.id === playerId;
              const pill = koPill(e.state);
              const podium = i < 3 && anyResult;
              return (
                <motion.tr
                  key={e.id}
                  layout="position"
                  transition={rowLayout}
                  className={cn(
                    "border-t border-white/[0.06] text-[14px]",
                    me && "bg-[#ff2448]/[0.09]",
                  )}
                >
                  <td className="px-3 py-3.5 text-center">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-extrabold tabular-nums",
                        podium
                          ? "bg-amber-400/20 text-amber-200 ring-1 ring-inset ring-amber-400/40"
                          : "bg-white/[0.04] text-[#8b8b93]",
                      )}
                      style={mono}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 pl-5">
                    <span className="flex items-center gap-2.5">
                      {me && <span className="h-4 w-[3px] shrink-0 rounded-full bg-[#ff2448]" />}
                      <span
                        className={cn(
                          "truncate",
                          me ? "font-bold text-[#f6f6f8]" : "font-medium text-[#d4d6dd]",
                        )}
                      >
                        {category.nameOf(e.id)}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-3.5 text-[13px] text-[#9a9aa2]" style={mono}>
                    {e.poolLetter ? (
                      <>
                        {e.poolLetter}
                        {e.rankInPool ? (
                          <span className="text-[#6f6f78]"> · #{e.rankInPool}</span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-[#9a9aa2]">{e.played}</td>
                  <td className="px-2 py-3.5 text-center font-semibold tabular-nums text-emerald-300/90">
                    {e.won}
                  </td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-[#ff8f86]/75">{e.lost}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-[#9a9aa2]">
                    {e.gameDiff > 0 ? `+${e.gameDiff}` : e.gameDiff}
                  </td>
                  <td className="px-2 py-3.5 text-center font-semibold tabular-nums text-[#f6f6f8]">
                    {e.matchPoints}
                  </td>
                  <td className="px-3 py-3.5 pr-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                        pill.className,
                      )}
                      style={mono}
                    >
                      {pill.live && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                      )}
                      {pill.text}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StageRail({ category, reduce }: { category: LiveCategory; reduce: boolean }) {
  const stages: { label: string; state: "done" | "live" | "pending" }[] = [];
  const groupDone = category.poolMatches.length > 0 && category.poolMatches.every((m) => m.played);
  stages.push({
    label: "Group Stage",
    state: !category.poolsReleased ? "pending" : groupDone ? "done" : "live",
  });

  const size = category.bracket?.size;
  if (size) {
    for (let i = 0; i < log2(size); i++) {
      const key = roundName(size / 2 ** i);
      const round = category.bracket?.rounds[i];
      const released = category.releasedStages.includes(key);
      const done = Boolean(round?.length) && round!.every((m) => m.played || m.isBye);
      stages.push({ label: key, state: !released ? "pending" : done ? "done" : "live" });
    }
  } else {
    stages.push({ label: "Knockout", state: "pending" });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {stages.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#3a3a42]" strokeWidth={2.5} />}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
              s.state === "live" && "bg-[#ff2448]/15 text-[#ff8f86]",
              s.state === "done" && "border border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300",
              s.state === "pending" && "border border-white/10 bg-white/[0.02] text-[#5a5a62]",
            )}
            style={mono}
          >
            {s.state === "live" && <LiveDot reduce={reduce} />}
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ timeline -- */

function Timeline({
  groups,
  reduce,
}: {
  groups: { stageLabel: string; done: boolean; items: TLMatch[] }[];
  reduce: boolean;
}) {
  let matchIndex = 0;
  return (
    <div className="relative">
      {/* the spine */}
      <div
        className="absolute top-2 bottom-6 left-[15px] w-px bg-gradient-to-b from-white/25 via-white/15 to-transparent md:left-1/2 md:-translate-x-1/2"
        aria-hidden
      />
      <motion.div
        className="flex flex-col gap-3"
        variants={staggerChildren(reduce ? 0 : 45)}
        initial="hidden"
        animate="show"
      >
        {groups.map((g) => (
          <div key={g.stageLabel} className="flex flex-col gap-3">
            {/* stage marker on the spine */}
            <motion.div variants={fadeUp} className="relative flex items-center py-1 md:justify-center">
              <span
                className={cn(
                  "relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                  g.done
                    ? "border border-emerald-500/40 bg-emerald-500/[0.1] text-emerald-300"
                    : "border border-[#ff2448]/40 bg-[#ff2448]/[0.12] text-[#ff8f86]",
                )}
                style={mono}
              >
                {g.stageLabel}
              </span>
            </motion.div>

            {g.items.map((m) => {
              const side = matchIndex++ % 2 === 0 ? "R" : "L";
              return <TimelineNode key={m.key} match={m} side={side} />;
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function TimelineNode({ match: m, side }: { match: TLMatch; side: "L" | "R" }) {
  const mine = m.aIsMe || m.bIsMe;
  const upcoming = !m.played;

  const card = (
    <div
      className={cn(
        "rounded-[10px] border p-3",
        m.played
          ? "border-white/10 bg-[#0c0e12]"
          : "border-dashed border-white/12 bg-white/[0.015]",
        mine && "ring-1 ring-inset ring-[#ff2448]/45",
      )}
    >
      {m.context && (
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#6f6f78]" style={mono}>
          {m.context}
        </p>
      )}

      {upcoming ? (
        <>
          <p className="text-[13px] text-[#c2c6d7]">
            <PlayerName name={m.aName} me={m.aIsMe} />
            <span className="mx-1.5 text-[#6f6f78]">vs</span>
            <PlayerName name={m.bName} me={m.bIsMe} />
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#8b8b93]" style={mono}>
            {m.pending ? "Awaiting players" : "Scheduled"}
          </p>
        </>
      ) : (
        <div className="space-y-1">
          <ScoreRow name={m.aName} me={m.aIsMe} won={m.aWon} scores={m.aScores} games={m.aGames} />
          <ScoreRow name={m.bName} me={m.bIsMe} won={m.bWon} scores={m.bScores} games={m.bGames} />
          <p className="pt-0.5 text-[10px] tabular-nums text-[#6f6f78]" style={mono}>
            {m.aGames}–{m.bGames} in games
          </p>
        </div>
      )}
    </div>
  );

  return (
    <motion.div variants={fadeUp} className="relative">
      {/* node dot, sitting on the spine */}
      <span
        className={cn(
          "absolute top-4 z-10 h-2.5 w-2.5 rounded-full border-2 left-[10px] md:left-1/2 md:-translate-x-1/2",
          m.played
            ? "border-emerald-400 bg-[#0c0e12]"
            : mine
              ? "border-[#ff2448] bg-[#0c0e12]"
              : "border-white/25 bg-[#0c0e12]",
        )}
        aria-hidden
      />
      {/* mobile: single column right of the spine. desktop: alternate sides. */}
      <div className="pl-9 md:grid md:grid-cols-2 md:gap-8 md:pl-0">
        <div className="md:hidden">{card}</div>
        <div className={cn("hidden md:block", side === "L" ? "md:col-start-1 md:pr-2" : "md:col-start-2 md:pl-2")}>
          {card}
        </div>
      </div>
    </motion.div>
  );
}

function PlayerName({ name, me }: { name: string; me: boolean }) {
  return <span className={cn(me && "font-semibold text-[#ff8f86]")}>{name}</span>;
}

function ScoreRow({
  name,
  me,
  won,
  scores,
  games,
}: {
  name: string;
  me: boolean;
  won: boolean;
  scores: number[];
  games: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px]",
        won ? "bg-emerald-500/[0.1]" : "opacity-70",
      )}
    >
      {won ? (
        <Trophy className="h-3 w-3 shrink-0 text-emerald-400" strokeWidth={2.5} />
      ) : (
        <span className="h-3 w-3 shrink-0" />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          won ? "font-semibold text-[#e8e8ee]" : "text-[#9a9aa2]",
          me && "text-[#ff8f86]",
        )}
      >
        {name}
      </span>
      <span className="shrink-0 font-mono text-[11px] tracking-wide text-[#8b8b93]">
        {scores.join("  ")}
      </span>
      <span
        className={cn(
          "w-9 shrink-0 rounded-[3px] py-0.5 text-center text-[9px] font-bold uppercase",
          won ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.05] text-[#8b8b93]",
        )}
        style={mono}
        title={`${games} games`}
      >
        {won ? "Won" : "Lost"}
      </span>
    </div>
  );
}
