"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { ExportReportMenu } from "@/components/tournament/ExportReportMenu";
import { ManageAccessButton } from "@/components/tournament/manage-access-button";
import { getEvent, getTournament, tournamentCode } from "@/lib/mock-data";
import { useAllEvents, useAllTournaments, useHostedTournaments } from "@/lib/hosted-tournaments";
import { effectiveStatus, isLive, useTournamentStatus } from "@/lib/tournament-status";
import { applyEventEdit, applyTournamentEdit, useTournamentEdits } from "@/lib/tournament-edits";
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
      return { label: "Draft", className: "border border-white/20 bg-[#111318]/80 text-[#8b8b93]", live: false };
    case "COMPLETED":
      return { label: "Completed", className: "border border-white/20 bg-[#111318]/80 text-[#e2e2e8]", live: false };
  }
}

export default function ManageHostTournamentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { isLoading: hostedLoading } = useHostedTournaments();
  const rawTournament = tournamentId
    ? allTournaments.find((t) => t.id === tournamentId) ?? getTournament(tournamentId)
    : undefined;
  const { overrides } = useTournamentStatus();
  const { tournamentEdit, eventEdit } = useTournamentEdits();

  // Fold in any host edits so the manage header matches what players see.
  const tournament = rawTournament
    ? applyTournamentEdit(rawTournament, tournamentEdit(rawTournament.id))
    : undefined;

  if (!tournament && hostedLoading) {
    return <div className="mx-auto h-64 w-full max-w-6xl animate-pulse rounded-[8px] bg-white/5" />;
  }

  if (!tournament) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <p className="text-sm font-semibold text-[#e2e2e8]">Tournament not found</p>
          <Link
            href="/host/tournaments"
            className="mt-4 inline-flex items-center rounded-[2px] border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
            style={mono}
          >
            Back to Manage Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const status = effectiveStatus(tournament, overrides);
  const meta = statusMeta(status);
  const rawEvent = allEvents.find((e) => e.id === tournament.eventId) ?? getEvent(tournament.eventId);
  const event = rawEvent ? applyEventEdit(rawEvent, eventEdit(rawEvent.id)) : undefined;
  const location = event?.location ?? tournament.venue;
  const basePath = `/host/tournaments/${tournament.id}`;

  // Sibling categories of this event — the list view collapses them to one card.
  const siblings = allTournaments
    .filter((t) => t.eventId === tournament.eventId)
    .map((t) => applyTournamentEdit(t, tournamentEdit(t.id)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const subPath = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : "";

  const tabs = [
    { href: basePath, label: "Overview" },
    { href: `${basePath}/registrations`, label: "Registrations" },
    { href: `${basePath}/matches`, label: "Matches" },
    // Editing the published details only makes sense once the tournament is
    // live — before that the host resubmits the form.
    ...(isLive(status) ? [{ href: `${basePath}/tournament`, label: "Tournament" }] : []),
  ];

  // Overview / Registrations / Tournament are all event-wide — the category
  // picker only matters inside the per-category Matches console.
  const showCategorySwitcher = siblings.length > 1 && subPath.startsWith("/matches");

  return (
    <div className="mx-auto w-full max-w-6xl" style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
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
          <h1 className="text-xl font-extrabold uppercase leading-tight tracking-tight text-[#e2e2e8] sm:text-2xl" style={display}>
            {tournament.name}
          </h1>
          <p className="mt-1.5 text-xs uppercase tracking-wide text-[#5a5a60]" style={mono}>
            Tournament ID #{tournamentCode(tournament)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ManageAccessButton tournament={tournament} />
          <ExportReportMenu tournament={tournament} />
        </div>
      </div>

      {showCategorySwitcher && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5a5a60]" style={mono}>
            Category
          </span>
          {siblings.map((s) => {
            const active = s.id === tournament.id;
            const label = s.name.lastIndexOf(" — ") > 0 ? s.name.slice(s.name.lastIndexOf(" — ") + 3) : s.category;
            return (
              <Link
                key={s.id}
                href={`/host/tournaments/${s.id}${subPath}`}
                className={`rounded-[2px] border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                  active
                    ? "border-[#ff2448] bg-[#ff2448]/10 text-[#ff8f86]"
                    : "border-white/15 text-[#c2c6d7] hover:border-white/30 hover:bg-white/5"
                }`}
                style={mono}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mb-8 flex gap-2 border-b border-white/10">
        {tabs.map((tab) => {
          const active = tab.href === basePath ? pathname === basePath : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-1 pb-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                active ? "text-[#ff2448]" : "text-[#8b8b93] hover:text-[#e2e2e8]"
              }`}
              style={mono}
            >
              {tab.label}
              {active && <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#ff2448]" />}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
