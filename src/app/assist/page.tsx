"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, MapPin, Radio } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useAllTournaments } from "@/lib/hosted-tournaments";
import { useTournamentAssistants } from "@/lib/tournament-assistants";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { getEvent, tournamentCode } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
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

export default function AssistIndexPage() {
  const { user } = useAuth();
  const { assignmentsFor, isLoading } = useTournamentAssistants();
  const allTournaments = useAllTournaments();
  const { overrides } = useTournamentStatus();

  const shared = useMemo(() => {
    const ids = new Set(assignmentsFor(user?.uniqueId));
    return allTournaments
      .filter((t) => ids.has(t.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assignmentsFor, user?.uniqueId, allTournaments]);

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
          Tournaments a host has shared with you. Open one to run its Matches console — players,
          pools, scoring and the knockout draw, live for everyone.
        </p>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-[8px] border border-white/10 bg-white/[0.02]" />
      ) : shared.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <Radio className="mx-auto mb-3 h-8 w-8 text-[#8b8b93]" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-[#e2e2e8]">Nothing shared with you yet</p>
          <p className="mt-1 text-xs text-[#8b8b93]">
            A tournament host adds you from their manage page using your unique ID
            {user?.uniqueId ? ` (@${user.uniqueId})` : ""}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shared.map((t) => {
            const meta = statusMeta(effectiveStatus(t, overrides));
            const location = getEvent(t.eventId)?.location ?? t.venue;
            return (
              <Link
                key={t.id}
                href={`/assist/${t.id}`}
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
                      #{tournamentCode(t)}
                    </span>
                  </div>
                  <p className="truncate text-base font-semibold text-[#e2e2e8]">{t.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8b8b93]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {formatDate(t.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {location}
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
