"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Layers, MapPin, Plus, Search, Trophy } from "lucide-react";
import { tournamentCode } from "@/lib/mock-data";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { applyEventEdit, applyTournamentEdit, useTournamentEdits } from "@/lib/tournament-edits";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { buildEventGroups, categoryCountLabel, mostActiveStatus } from "@/lib/event-groups";
import { formatDate } from "@/lib/format";
import type { TournamentStatus } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

const statuses: { value: TournamentStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "REGISTRATION_OPEN", label: "Registration Open" },
  { value: "REGISTRATION_CLOSED", label: "Registration Closed" },
  { value: "SEEDING", label: "Seeding" },
  { value: "POOLS", label: "Pools In Progress" },
  { value: "KNOCKOUT", label: "Knockout In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

function statusMeta(status: TournamentStatus): { label: string; className: string; live: boolean } {
  switch (status) {
    case "REGISTRATION_OPEN":
      return { label: "Registration Open", className: "bg-[#ff2448] text-white", live: false };
    case "POOLS":
      return { label: "Pools In Progress", className: "bg-[#ff2448] text-white", live: true };
    case "KNOCKOUT":
      return { label: "Live", className: "bg-[#ff2448] text-white", live: true };
    case "SEEDING":
      return { label: "Seeding", className: "border border-amber-400/40 bg-amber-400/10 text-amber-300", live: false };
    case "REGISTRATION_CLOSED":
      return { label: "Registration Closed", className: "border border-amber-400/40 bg-amber-400/10 text-amber-300", live: false };
    case "DRAFT":
      return { label: "Draft", className: "border border-white/20 bg-[#111318]/80 text-[#8b8b93]", live: false };
    case "COMPLETED":
      return { label: "Completed", className: "border border-white/20 bg-[#111318]/80 text-[#e2e2e8]", live: false };
  }
}

export default function HostTournamentsPage() {
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { overrides } = useTournamentStatus();
  const { tournamentEdit, eventEdit } = useTournamentEdits();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TournamentStatus | "all">("all");

  // One card per event — categories a host adds are folded into their event.
  const groups = useMemo(() => {
    const edited = allTournaments.map((t) => applyTournamentEdit(t, tournamentEdit(t.id)));
    const editedEvents = allEvents.map((e) => applyEventEdit(e, eventEdit(e.id)));
    return buildEventGroups(edited, editedEvents)
      .map((g) => ({
        ...g,
        status: mostActiveStatus(g.categories.map((c) => effectiveStatus(c, overrides))),
        capacity: g.categories.reduce((sum, c) => sum + c.maxPlayers, 0),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTournaments, allEvents, overrides, tournamentEdit, eventEdit]);

  const filtered = groups.filter((g) => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status !== "all" && g.status !== status) return false;
    return true;
  });

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }} className="mx-auto w-full max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
            Manage Tournaments
          </h1>
          <p className="mt-1 text-sm text-[#8b8b93]">
            Every tournament on the platform. Open one to see registrations, fees collected, and category
            breakdowns.
          </p>
        </div>
        <Link
          href="/host-tournament"
          className="flex shrink-0 items-center gap-1.5 rounded-[2px] border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
          style={mono}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Create Tournament
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-grow">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b93]" />
          <input
            type="text"
            placeholder="Search tournaments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] py-3 pl-11 pr-4 text-sm text-[#e2e2e8] placeholder:text-[#5a5a60] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TournamentStatus | "all")}
          className="rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448] sm:w-56"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value} className="bg-[#1a1c20]">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-[#8b8b93]" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-[#e2e2e8]">No tournaments found</p>
          <p className="mt-1 text-xs text-[#8b8b93]">Try a different search or status filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => {
            const meta = statusMeta(g.status);
            return (
              <Link
                key={g.eventId}
                href={`/host/tournaments/${g.primary.id}`}
                className="flex flex-col gap-3 rounded-[8px] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
                      style={mono}
                    >
                      {meta.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
                      {meta.label}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-[#5a5a60]" style={mono}>
                      #{tournamentCode(g.primary)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-[2px] border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#c2c6d7]"
                      style={mono}
                    >
                      <Layers className="h-3 w-3" strokeWidth={2} />
                      {categoryCountLabel(g)}
                    </span>
                  </div>
                  <p className="truncate text-base font-semibold text-[#e2e2e8]">{g.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8b8b93]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {formatDate(g.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {g.venue}
                    </span>
                    <span>
                      {g.registeredCount}/{g.capacity} registered
                    </span>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 self-start rounded-[2px] border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] sm:self-center">
                  Manage
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
