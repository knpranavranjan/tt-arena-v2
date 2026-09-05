"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, History } from "lucide-react";
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
import { formatDate } from "@/lib/format";
import type { Match, Player, Tournament } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };

interface MatchRow {
  match: Match;
  opponent: Player | undefined;
  won: boolean;
  myScore: number;
  theirScore: number;
}

interface CategoryGroup {
  tournament: Tournament;
  rows: MatchRow[];
  wins: number;
  losses: number;
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
function buildEventGroups(player: Player): EventGroup[] {
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
        name: event?.name ?? tournament.name,
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

  return [...byEvent.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function TournamentHistoryCard({ player }: { player: Player }) {
  const events = buildEventGroups(player);
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
                    <div className="flex flex-col gap-4 border-t border-white/5 bg-white/[0.015] px-4 pb-4 pt-3">
                      {event.categories.map((category) => (
                        <div key={category.tournament.id}>
                          <div className="mb-1.5 flex items-center gap-2 px-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#ff8f86]" style={mono}>
                              {category.tournament.category}
                            </span>
                            <span className="text-[11px] text-[#7d8795]" style={mono}>
                              {category.wins}W &middot; {category.losses}L
                            </span>
                          </div>
                          <div className="overflow-hidden rounded-[8px] border border-white/10">
                            {category.rows.map((row, i) => (
                              <MatchRow
                                key={row.match.id}
                                row={row}
                                tournament={category.tournament}
                                isLast={i === category.rows.length - 1}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
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

function MatchRow({
  row,
  tournament,
  isLast,
}: {
  row: MatchRow;
  tournament: Tournament;
  isLast: boolean;
}) {
  const { match, opponent, won, myScore, theirScore } = row;
  const dateLabel = formatDate(tournament.date);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={`flex w-full cursor-pointer items-center gap-3 bg-[#0c0e12] p-3 text-left transition-colors hover:bg-white/[0.03] ${
              isLast ? "" : "border-b border-white/5"
            }`}
          />
        }
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            won ? "bg-emerald-500/15 text-emerald-400" : "bg-[#ff2448]/15 text-[#ff2448]"
          }`}
        >
          {won ? <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} /> : <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.5} />}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#e2e2e8]">
          {opponent?.name ?? "Unknown Player"}
        </span>
        <span className="shrink-0 tabular-nums text-sm text-[#c2c6d7]" style={mono}>
          {myScore}-{theirScore}
        </span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            won
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
              : "border-[#ff2448]/30 bg-[#ff2448]/15 text-[#ff2448]"
          }`}
          style={mono}
        >
          {won ? "Win" : "Loss"}
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-6 border border-white/10 bg-[#0c0e12] p-6 text-[#e2e2e8] sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
            {opponent?.name ?? "Unknown Player"}
          </DialogTitle>
          <DialogDescription className="text-base text-[#c2c6d7]">
            {match.round} &middot; {tournament.name} &middot; {tournament.category}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm uppercase tracking-widest text-[#7d8795]" style={mono}>Result</div>
            <div className={`mt-1.5 text-xl font-bold ${won ? "text-emerald-400" : "text-[#ff2448]"}`}>{won ? "Win" : "Loss"}</div>
          </div>
          <div>
            <div className="text-sm uppercase tracking-widest text-[#7d8795]" style={mono}>Score</div>
            <div className="mt-1.5 text-xl font-bold text-[#e2e2e8]">{myScore}-{theirScore} sets</div>
          </div>
          <div>
            <div className="text-sm uppercase tracking-widest text-[#7d8795]" style={mono}>Opponent Rating</div>
            <div className="mt-1.5 text-xl font-bold text-[#e2e2e8]">{opponent?.rating ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm uppercase tracking-widest text-[#7d8795]" style={mono}>Date</div>
            <div className="mt-1.5 text-xl font-bold text-[#e2e2e8]">{dateLabel || "—"}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm uppercase tracking-widest text-[#7d8795]" style={mono}>Venue</div>
            <div className="mt-1.5 text-xl font-bold text-[#e2e2e8]">{tournament.venue}</div>
          </div>
        </div>
        <Link
          href={`/tournaments/${tournament.id}`}
          className="text-center text-sm font-semibold uppercase tracking-widest text-[#ff8f86] hover:text-[#ff2448]"
          style={mono}
        >
          View Tournament
        </Link>
      </DialogContent>
    </Dialog>
  );
}
