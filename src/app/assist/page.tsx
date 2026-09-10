"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Layers, MapPin, Radio } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { expandGrantsToEvent, useTournamentAssistants } from "@/lib/tournament-assistants";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { mostActiveStatus } from "@/lib/event-groups";
import { eventTitle } from "@/lib/tournament-manage";
import { getEvent, tournamentCode } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { Tournament, TournamentStatus } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

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
      return { label: "Pending Approval", className: "border border-white/20 bg-[#111318]/80 text-[#8b8b93]", live: false };
    case "COMPLETED":
      return { label: "Completed", className: "border border-white/20 bg-[#111318]/80 text-[#e2e2e8]", live: false };
  }
}

interface SharedEvent {
  eventId: string;
  name: string;
  date: string;
  location: string;
  categories: Tournament[];
  status: TournamentStatus;
  /** The category the "Open Matches" link lands on. */
  primary: Tournament;
}

export default function AssistIndexPage() {
  const { user } = useAuth();
  const { assignmentsFor, isLoading } = useTournamentAssistants();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { overrides } = useTournamentStatus();

  // A grant is event-wide: one shared category unlocks every category of that
  // event. Collapse to one card per event, with a category switcher inside.
  const shared = useMemo<SharedEvent[]>(() => {
    const accessible = expandGrantsToEvent(assignmentsFor(user?.uniqueId), allTournaments);
    const byEvent = new Map<string, Tournament[]>();
    for (const t of allTournaments) {
      if (!accessible.has(t.id)) continue;
      const list = byEvent.get(t.eventId) ?? [];
      list.push(t);
      byEvent.set(t.eventId, list);
    }
    return [...byEvent.entries()]
      .map(([eventId, cats]) => {
        const ordered = [...cats].sort((a, b) => a.name.localeCompare(b.name));
        const ev = allEvents.find((e) => e.id === eventId);
        return {
          eventId,
          name: eventTitle(ordered[0], ev?.name),
          date: ev?.date ?? ordered[0].date,
          location: ev?.location ?? getEvent(eventId)?.location ?? ordered[0].venue,
          categories: ordered,
          status: mostActiveStatus(ordered.map((c) => effectiveStatus(c, overrides))),
          primary: ordered[0],
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assignmentsFor, user?.uniqueId, allTournaments, allEvents, overrides]);

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }} className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]"
          style={display}
        >
          Assisting
        </h1>
        <p className="mt-1 text-sm text-[#8b8b93]">
          Tournaments a host has shared with you. Open one to run its Matches console — every
          category, its players, pools, scoring and the knockout draw, live for everyone.
        </p>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-[8px] border border-white/10 bg-white/[0.02]" />
      ) : shared.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <Radio className="mx-auto mb-3 h-8 w-8 text-[#8b8b93]" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-[#e2e2e8]">Nothing shared with you yet</p>
          <p className="mt-1 text-xs text-[#8b8b93]">
            Share your SPINID{user?.uniqueId ? ` (${user.uniqueId})` : ""} with a tournament host —
            they grant access from their manage page and the tournament shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shared.map((ev) => {
            const meta = statusMeta(ev.status);
            return (
              <Link
                key={ev.eventId}
                href={`/assist/${ev.primary.id}`}
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
                      #{tournamentCode(ev.primary)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-[2px] border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#c2c6d7]"
                      style={mono}
                    >
                      <Layers className="h-3 w-3" strokeWidth={2} />
                      {ev.categories.length} {ev.categories.length === 1 ? "category" : "categories"}
                    </span>
                  </div>
                  <p className="truncate text-base font-semibold text-[#e2e2e8]">{ev.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8b8b93]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {formatDate(ev.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {ev.location}
                    </span>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 self-start rounded-[2px] border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] sm:self-center">
                  Open Matches
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
