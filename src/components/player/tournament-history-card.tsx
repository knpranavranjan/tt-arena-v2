"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getEvent, getPlayer, getTournament, matches } from "@/lib/mock-data";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { usePlayerRatings, type RatingChangeEntry } from "@/lib/player-ratings";
import { eventTitle } from "@/lib/tournament-manage";
import { formatDate } from "@/lib/format";
import type { Match, Player, Tournament, TTEvent } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };

interface MatchRow {
  match: Match;
  opponent: Player | undefined;
  won: boolean;
  myScore: number;
  theirScore: number;
}

interface CategoryGroup {
  /** A real `Tournament` for seed-match groups; a light stand-in for published ones. */
  tournament: Pick<Tournament, "id" | "name" | "category">;
  rows: MatchRow[];
  wins: number;
  losses: number;
  /** Set for published results, where per-match rows aren't recorded. */
  summaryMatches?: number;
}

interface EventGroup {
  key: string;
  name: string;
  date: string;
  venue: string;
  categories: CategoryGroup[];
  wins: number;
  losses: number;
  matchCount: number;
}

/**
 * Every tournament this player has actually played matches in, grouped the
 * way a real event works: one event (e.g. "TT Open 2026") can hold several
 * categories (e.g. Senior Singles, Under 21 Singles), each its own draw with
 * its own opponents and results.
 */
function buildEventGroups(player: Player): Map<string, EventGroup> {
  const played = matches.filter(
    (m) => (m.playerAId === player.id || m.playerBId === player.id) && m.status === "COMPLETED",
  );

  const byEvent = new Map<string, EventGroup>();
  const categoryLookup = new Map<string, Map<string, CategoryGroup>>();

  for (const match of played) {
    const tournament = getTournament(match.tournamentId);
    if (!tournament) continue;
    const event = getEvent(tournament.eventId);
    // Fall back to the tournament's own identity when it has no event record,
    // so every match still lands somewhere.
    const eventKey = event?.id ?? tournament.id;

    if (!byEvent.has(eventKey)) {
      byEvent.set(eventKey, {
        key: eventKey,
        name: eventTitle(tournament, event?.name),
        date: event?.date ?? tournament.date,
        venue: event?.venue ?? tournament.venue,
        categories: [],
        wins: 0,
        losses: 0,
        matchCount: 0,
      });
      categoryLookup.set(eventKey, new Map());
    }

    const eventGroup = byEvent.get(eventKey)!;
    const categories = categoryLookup.get(eventKey)!;

    if (!categories.has(tournament.id)) {
      const group: CategoryGroup = { tournament, rows: [], wins: 0, losses: 0 };
      categories.set(tournament.id, group);
      eventGroup.categories.push(group);
    }

    const opponentId = match.playerAId === player.id ? match.playerBId : match.playerAId;
    const won = match.winnerId === player.id;
    const row: MatchRow = {
      match,
      opponent: getPlayer(opponentId),
      won,
      myScore: match.playerAId === player.id ? match.scoreA : match.scoreB,
      theirScore: match.playerAId === player.id ? match.scoreB : match.scoreA,
    };

    const categoryGroup = categories.get(tournament.id)!;
    categoryGroup.rows.push(row);
    if (won) categoryGroup.wins += 1;
    else categoryGroup.losses += 1;

    if (won) eventGroup.wins += 1;
    else eventGroup.losses += 1;
    eventGroup.matchCount += 1;
  }

  return byEvent;
}

/**
 * Fold published tournament results (`RatingChangeEntry` rows the console writes
 * on "Publish results") into the event groups — one group per tournament not
 * already covered by a seed-match group. Only aggregate W/L is recorded, so
 * these render as a summary with no per-match drill-down.
 */
function mergePublishedHistory(
  byEvent: Map<string, EventGroup>,
  history: readonly RatingChangeEntry[],
  resolveTournament: (id: string) => Tournament | undefined,
  resolveEvent: (id: string) => TTEvent | undefined,
) {
  const seenTournamentIds = new Set<string>();
  for (const g of byEvent.values()) {
    for (const c of g.categories) seenTournamentIds.add(c.tournament.id);
  }

  for (const entry of history) {
    if (entry.matchesPlayed <= 0) continue;
    if (seenTournamentIds.has(entry.tournamentId)) continue;
    seenTournamentIds.add(entry.tournamentId);

    const t = resolveTournament(entry.tournamentId);
    const event = t ? resolveEvent(t.eventId) : undefined;
    const key = event?.id ?? t?.id ?? entry.tournamentId;

    let group = byEvent.get(key);
    if (!group) {
      group = {
        key,
        name: t ? eventTitle(t, event?.name) : eventTitle({ name: entry.tournamentName }),
        date: event?.date ?? t?.date ?? entry.date,
        venue: event?.venue ?? t?.venue ?? "",
        categories: [],
        wins: 0,
        losses: 0,
        matchCount: 0,
      };
      byEvent.set(key, group);
    }

    group.categories.push({
      tournament: {
        id: entry.tournamentId,
        name: entry.tournamentName,
        category: entry.categoryName,
      },
      rows: [],
      wins: entry.wins,
      losses: entry.losses,
      summaryMatches: entry.matchesPlayed,
    });
    group.wins += entry.wins;
    group.losses += entry.losses;
    group.matchCount += entry.matchesPlayed;
  }
}

export function TournamentHistoryCard({ player }: { player: Player }) {
  const { getHistory } = usePlayerRatings();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();

  const events = useMemo(() => {
    const byEvent = buildEventGroups(player);
    mergePublishedHistory(
      byEvent,
      getHistory(player.id),
      (id) => allTournaments.find((t) => t.id === id),
      (id) => allEvents.find((e) => e.id === id),
    );
    return [...byEvent.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [player, getHistory, allTournaments, allEvents]);

  const [expanded, setExpanded] = useState<string | null>(events[0]?.key ?? null);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0c0e12]">
      <div className="flex items-center gap-3 p-5">
        <History className="h-5 w-5 text-[#c2c6d7]" strokeWidth={1.5} />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[#e2e2e8]" style={mono}>
          Tournament History
        </h2>
        <span className="rounded bg-[#1a1c20] px-2 py-0.5 text-xs text-[#c2c6d7]" style={mono}>
          {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="border-t border-white/5 p-8 text-center text-sm text-[#c2c6d7]">
          No completed tournaments yet — results will show up here once you play.
        </div>
      ) : (
        <ScrollArea className="max-h-[760px] border-t border-white/5">
          <div className="flex flex-col">
            {events.map((event) => {
              const isOpen = expanded === event.key;
              return (
                <div key={event.key} className="border-b border-white/5 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : event.key)}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#c2c6d7]" strokeWidth={2} />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#c2c6d7]" strokeWidth={2} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold text-[#e2e2e8]">{event.name}</p>
                      <p className="mt-0.5 text-sm text-[#7d8795]" style={mono}>
                        {formatDate(event.date)} &middot; {event.venue}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold" style={mono}>
                        <span className="text-emerald-400">{event.wins}W</span>{" "}
                        <span className="text-[#7d8795]">&middot;</span>{" "}
                        <span className="text-[#ff2448]">{event.losses}L</span>
                      </span>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-[#7d8795]" style={mono}>
                        {event.categories.length} categor{event.categories.length === 1 ? "y" : "ies"}
                      </p>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="flex flex-col gap-2 border-t border-white/5 bg-white/[0.015] px-4 pb-4 pt-3">
                      {event.categories.map((category) =>
                        category.rows.length === 0 ? (
                          <CategorySummary key={category.tournament.id} category={category} />
                        ) : (
                          <CategoryDialog key={category.tournament.id} category={category} />
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

/**
 * A published category result — only aggregate W/L is on record, so this is a
 * static summary row (no per-match drill-down like `CategoryDialog`).
 */
function CategorySummary({ category }: { category: CategoryGroup }) {
  const { tournament, wins, losses, summaryMatches } = category;
  const played = summaryMatches ?? wins + losses;
  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-[#0c0e12] px-4 py-3">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-xs font-bold uppercase tracking-widest text-[#ff8f86]" style={mono}>
          {tournament.category}
        </span>
        <span className="shrink-0 text-[11px] text-[#7d8795]" style={mono}>
          {played} match{played === 1 ? "" : "es"}
        </span>
      </span>
      <span className="shrink-0 text-xs font-bold" style={mono}>
        <span className="text-emerald-400">{wins}W</span>{" "}
        <span className="text-[#7d8795]">&middot;</span>{" "}
        <span className="text-[#ff2448]">{losses}L</span>
      </span>
    </div>
  );
}

/**
 * One category of a tournament the player entered. The row shows the category
 * and its W–L; opening it lists every opponent faced in that category's draw
 * with the result alone — no scores.
 */
function CategoryDialog({ category }: { category: CategoryGroup }) {
  const { tournament, rows, wins, losses } = category;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-[#0c0e12] px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.03]"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-bold uppercase tracking-widest text-[#ff8f86]" style={mono}>
            {tournament.category}
          </span>
          <span className="shrink-0 text-[11px] text-[#7d8795]" style={mono}>
            {rows.length} match{rows.length === 1 ? "" : "es"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="text-xs font-bold" style={mono}>
            <span className="text-emerald-400">{wins}W</span>{" "}
            <span className="text-[#7d8795]">&middot;</span>{" "}
            <span className="text-[#ff2448]">{losses}L</span>
          </span>
          <ChevronRight className="h-4 w-4 text-[#7d8795]" strokeWidth={2} />
        </span>
      </DialogTrigger>
      <DialogContent
        className="max-w-[calc(100%-2rem)] gap-5 border border-white/10 bg-[#0c0e12] p-6 text-[#e2e2e8] sm:max-w-md"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
            {tournament.category}
          </DialogTitle>
          <DialogDescription className="text-base text-[#c2c6d7]">
            {tournament.name} &middot;{" "}
            <span className="text-emerald-400">{wins}W</span>{" "}
            <span className="text-[#7d8795]">&middot;</span>{" "}
            <span className="text-[#ff2448]">{losses}L</span>
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-[8px] border border-white/10">
          {rows.map((row, i) => (
            <div
              key={row.match.id}
              className={`flex items-center gap-3 bg-[#0c0e12] px-4 py-3 ${
                i === rows.length - 1 ? "" : "border-b border-white/5"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#e2e2e8]">
                {row.opponent?.name ?? "Unknown Player"}
              </span>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  row.won
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                    : "border-[#ff2448]/30 bg-[#ff2448]/15 text-[#ff2448]"
                }`}
                style={mono}
              >
                {row.won ? "Win" : "Loss"}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
