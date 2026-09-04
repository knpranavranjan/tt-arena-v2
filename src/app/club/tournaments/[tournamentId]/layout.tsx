"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { ExportReportMenu } from "@/components/tournament/ExportReportMenu";
import { useCurrentClub } from "@/lib/session-data";
import { getClubPlayers, getEvent, getTournament, tournamentCode } from "@/lib/mock-data";
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

export default function ManageTournamentLayout({ children }: { children: React.ReactNode }) {
  const club = useCurrentClub();
  const pathname = usePathname();
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;
  const tournament = tournamentId ? getTournament(tournamentId) : undefined;

  if (!club) return null;

  if (!tournament) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <p className="text-sm font-semibold text-[#e2e2e8]">Tournament not found</p>
          <Link
            href="/club/tournaments"
            className="mt-4 inline-flex items-center rounded-[2px] border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
            style={mono}
          >
            Back to Manage Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const clubPlayerIds = new Set(getClubPlayers(club.id).map((p) => p.id));
  const belongsToClub = tournament.registeredPlayerIds.some((id) => clubPlayerIds.has(id));
  if (!belongsToClub) return null;

  const meta = statusMeta(tournament.status);
  const location = getEvent(tournament.eventId)?.location ?? tournament.venue;
  const basePath = `/club/tournaments/${tournament.id}`;
  const tabs = [
    { href: basePath, label: "Overview" },
    { href: `${basePath}/registrations`, label: "Registrations" },
    { href: `${basePath}/matches`, label: "Matches" },
  ];

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
        <ExportReportMenu tournament={tournament} />
      </div>

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
