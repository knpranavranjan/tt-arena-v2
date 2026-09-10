"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock, MapPin } from "lucide-react";

import { MatchesTab } from "@/components/tournament-console/MatchesTab";
import { useAuth } from "@/lib/auth";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { expandGrantsToEvent, useTournamentAssistants } from "@/lib/tournament-assistants";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { eventTitle } from "@/lib/tournament-manage";
import { getEvent, tournamentCode } from "@/lib/mock-data";
import type { TournamentStatus } from "@/lib/types";

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

/** "<Event> — <Category>" -> "<Category>"; bare name falls back to `category`. */
function categoryLabel(name: string, fallback: string) {
  const i = name.lastIndexOf(" — ");
  return i > 0 ? name.slice(i + 3) : fallback;
}

function NoAccess({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl" style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-[#8b8b93]" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-[#e2e2e8]" style={display}>
          {message}
        </p>
        <Link
          href="/assist"
          className="mt-4 inline-flex items-center gap-1.5 rounded-[2px] border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
          style={mono}
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to Assisting
        </Link>
      </div>
    </div>
  );
}

export default function AssistTournamentMatchesPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;

  const { user, isLoading: authLoading } = useAuth();
  const { assignmentsFor, isLoading: accessLoading } = useTournamentAssistants();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { overrides } = useTournamentStatus();

  const tournament = useMemo(
    () => (tournamentId ? allTournaments.find((t) => t.id === tournamentId) : undefined),
    [tournamentId, allTournaments],
  );

  // Every category of this event, in a stable order — the switcher jumps
  // between them and access covers all of them.
  const siblings = useMemo(
    () =>
      tournament
        ? allTournaments
            .filter((t) => t.eventId === tournament.eventId)
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [tournament, allTournaments],
  );

  // A grant on any one category of this event unlocks the whole event.
  const accessible = useMemo(
    () => expandGrantsToEvent(assignmentsFor(user?.uniqueId), allTournaments),
    [assignmentsFor, user?.uniqueId, allTournaments],
  );

  if (authLoading || accessLoading) {
    return <div className="mx-auto h-64 w-full max-w-6xl animate-pulse rounded-[8px] border border-white/10 bg-white/[0.02]" />;
  }

  if (!tournamentId || !accessible.has(tournamentId)) {
    return <NoAccess message="You don't have access to this tournament's Matches console." />;
  }

  if (!tournament) {
    return <NoAccess message="This tournament no longer exists." />;
  }

  const event = allEvents.find((e) => e.id === tournament.eventId);
  const meta = statusMeta(effectiveStatus(tournament, overrides));
  const location = event?.location ?? getEvent(tournament.eventId)?.location ?? tournament.venue;

  return (
    <div className="mx-auto w-full max-w-6xl" style={{ fontFamily: "var(--font-home-body)" }}>
      <Link
        href="/assist"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8b8b93] transition-colors hover:text-[#e2e2e8]"
        style={mono}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Assisting
      </Link>

      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
              style={mono}
            >
              {meta.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
              {meta.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#8b8b93]">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
              {location}
            </span>
          </div>
          <h1
            className="text-xl font-extrabold uppercase leading-tight tracking-tight text-[#e2e2e8] sm:text-2xl"
            style={display}
          >
            {eventTitle(tournament, event?.name)}
          </h1>
          <p className="mt-1.5 text-xs uppercase tracking-wide text-[#5a5a60]" style={mono}>
            Tournament ID #{tournamentCode(tournament)} · Assistant access
          </p>
        </div>
      </div>

      {siblings.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5a5a60]" style={mono}>
            Category
          </span>
          {siblings.map((s) => {
            const active = s.id === tournament.id;
            return (
              <Link
                key={s.id}
                href={`/assist/${s.id}`}
                className={`rounded-[2px] border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                  active
                    ? "border-[#ff2448] bg-[#ff2448]/10 text-[#ff8f86]"
                    : "border-white/15 text-[#c2c6d7] hover:border-white/30 hover:bg-white/5"
                }`}
                style={mono}
              >
                {categoryLabel(s.name, s.category)}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mb-8 flex gap-2 border-b border-white/10">
        <span
          className="relative px-1 pb-3 text-xs font-bold uppercase tracking-widest text-[#ff2448]"
          style={mono}
        >
          Matches
          <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#ff2448]" />
        </span>
      </div>

      <MatchesTab key={tournament.id} tournament={tournament} />
    </div>
  );
}
