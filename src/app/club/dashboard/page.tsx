"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ShieldCheck, Trophy, X } from "lucide-react";
import { arenaFontVariables } from "@/lib/fonts";
import { useCurrentClub } from "@/lib/session-data";
import { useJoinRequests } from "@/lib/join-requests";
import { abbreviateName, formatDate } from "@/lib/format";
import { getClubPlayers, getPlayer, tournaments } from "@/lib/mock-data";
import type { Player, Tournament, TournamentStatus } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };
const scrollbarStyle = {
  scrollbarWidth: "thin" as const,
  scrollbarColor: "rgba(255,255,255,0.18) transparent",
};

function calcAge(dob: string) {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function tournamentStatusMeta(status: TournamentStatus): { label: string; textClass: string; accent: string } {
  switch (status) {
    case "REGISTRATION_OPEN":
      return { label: "Registration Open", textClass: "text-[#ff8f86]", accent: "#ff2448" };
    case "POOLS":
      return { label: "Pools In Progress", textClass: "text-[#ff8f86]", accent: "#ff2448" };
    case "KNOCKOUT":
      return { label: "Knockout In Progress", textClass: "text-[#ff8f86]", accent: "#ff2448" };
    case "SEEDING":
      return { label: "Seeding", textClass: "text-amber-300", accent: "#fbbf24" };
    case "REGISTRATION_CLOSED":
      return { label: "Registration Closed", textClass: "text-amber-300", accent: "#fbbf24" };
    case "DRAFT":
      return { label: "Draft", textClass: "text-[#8b8b93]", accent: "rgba(255,255,255,0.25)" };
    case "COMPLETED":
      return { label: "Completed", textClass: "text-[#8b8b93]", accent: "rgba(255,255,255,0.25)" };
  }
}

export default function ClubDashboardPage() {
  const club = useCurrentClub();
  const { pendingForClub, updateStatus } = useJoinRequests();
  if (!club) return null;

  const clubPlayers = getClubPlayers(club.id).sort((a, b) => b.rating - a.rating);
  const playerIds = new Set(clubPlayers.map((p) => p.id));
  const clubTournaments = tournaments.filter((t) => t.registeredPlayerIds.some((id) => playerIds.has(id)));
  const activeTournaments = clubTournaments.filter((t) => t.status !== "COMPLETED");
  const completedTournaments = clubTournaments.filter((t) => t.status === "COMPLETED");
  const pendingRequests = pendingForClub(club.id);

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      {/* Banner */}
      <div className="relative h-[180px] w-full overflow-hidden rounded-[10px] sm:h-[220px]">
        <Image src="/clubhero/club.png" alt="" fill sizes="100vw" priority className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a12] via-[#050a12]/45 to-transparent" />
      </div>

      {/* Header */}
      <div className="relative z-10 -mt-14 flex flex-col gap-6 px-2 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between sm:px-4">
        <div className="max-w-2xl">
          {club.verified && (
            <span
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#ff2448]/40 bg-[#111318]/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#ff8f86] backdrop-blur"
              style={mono}
            >
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Verified
            </span>
          )}
          <h1
            className="mb-3 text-[34px] font-extrabold uppercase leading-[1.05] tracking-tight text-[#e2e2e8] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-[46px]"
            style={display}
          >
            {club.name}
          </h1>
          <p className="flex items-center gap-2 text-sm text-[#c2c6d7]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff2448]" />
            {club.location}, {club.state} &middot; est. {club.founded}
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <div className="min-w-[110px] rounded-[6px] border border-white/10 bg-white/[0.04] px-5 py-3 text-center backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
              Members
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#e2e2e8]" style={display}>
              {clubPlayers.length}
            </p>
          </div>
          <div className="min-w-[110px] rounded-[6px] border border-white/10 bg-white/[0.04] px-5 py-3 text-center backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
              Events Hosted
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#ff2448]" style={display}>
              {clubTournaments.length}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c2c6d7]" style={mono}>
              Roster
            </h2>
            {clubPlayers.length === 0 ? (
              <p className="text-sm text-[#8b8b93]">No players yet. Add players to your club roster to get started.</p>
            ) : (
              <>
                <div className="max-h-[420px] overflow-y-auto pr-1" style={scrollbarStyle}>
                  {clubPlayers.map((p) => (
                    <RosterRow key={p.id} player={p} />
                  ))}
                </div>
                <Link
                  href="/club/players"
                  className="mt-4 flex w-full items-center justify-center rounded-[2px] border border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
                  style={mono}
                >
                  Browse All Players
                </Link>
              </>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
              Host a Tournament
            </h2>
            <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
              <p className="mb-4 text-sm leading-relaxed text-[#c2c6d7]">
                Set up a new tournament for {club.name} and open registrations to players across the platform.
              </p>
              <Link
                href="/host-tournament"
                className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-[#ff2448] py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95"
                style={mono}
              >
                <Trophy className="h-4 w-4" strokeWidth={1.75} />
                Host a Tournament
              </Link>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="min-w-0 space-y-10">
          <section id="join-requests" className="scroll-mt-20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
                Join Requests
              </h2>
              {pendingRequests.length > 0 && (
                <span
                  className="rounded-full bg-[#ff2448]/15 px-2.5 py-1 text-[10px] font-bold text-[#ff8f86]"
                  style={mono}
                >
                  {pendingRequests.length} PENDING
                </span>
              )}
            </div>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-[#8b8b93]">No pending requests. Players who ask to join will show up here.</p>
            ) : (
              <div
                className="max-h-[320px] space-y-2 overflow-y-auto pr-1"
                style={scrollbarStyle}
              >
                {pendingRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#e2e2e8]">{r.playerName}</p>
                      <p className="text-xs text-[#8b8b93]">Wants to join &middot; {timeAgo(r.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(r.id, "DECLINED")}
                        className="flex items-center gap-1 rounded-[2px] border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
                        style={mono}
                      >
                        <X className="h-3 w-3" strokeWidth={2.5} />
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(r.id, "ACCEPTED")}
                        className="flex items-center gap-1 rounded-[2px] bg-[#ff2448] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white transition-all hover:brightness-110"
                        style={mono}
                      >
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
              Events You&apos;re Hosting
            </h2>
            {activeTournaments.length === 0 ? (
              <p className="text-sm text-[#8b8b93]">No active tournaments right now.</p>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1" style={scrollbarStyle}>
                {activeTournaments.map((t) => (
                  <TournamentHostingCard key={t.id} tournament={t} />
                ))}
              </div>
            )}
            <div className="mt-4 space-y-2">
              <Link
                href="/club/tournaments"
                className="flex w-full items-center justify-center rounded-[2px] bg-[#ff2448] py-3 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_16px_-4px_#ff2448] active:scale-95"
                style={mono}
              >
                Manage Tournaments
              </Link>
              <Link
                href="/club/events"
                className="flex w-full items-center justify-center rounded-[2px] border border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
                style={mono}
              >
                View All Events
              </Link>
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
              Tournament History
            </h2>
            {completedTournaments.length === 0 ? (
              <p className="mt-3 text-sm text-[#8b8b93]">Completed tournaments will show up here.</p>
            ) : (
              <>
                <p className="mb-2 text-xs text-[#8b8b93]">Open a tournament to see match-by-match results.</p>
                <div className="max-h-[300px] overflow-y-auto pr-1" style={scrollbarStyle}>
                  {completedTournaments.map((t) => (
                    <TournamentHistoryRow key={t.id} tournament={t} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function RosterRow({ player }: { player: Player }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0 transition-colors hover:bg-white/[0.02]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#e2e2e8]">{abbreviateName(player.name)}</p>
        <p className="mt-0.5 text-xs text-[#8b8b93]">
          {calcAge(player.dateOfBirth)} &middot; {player.gender === "MALE" ? "Male" : "Female"}
        </p>
      </div>
      <span className="shrink-0 text-sm font-extrabold text-[#ff8f86]" style={mono}>
        {player.rating}
      </span>
    </Link>
  );
}

function TournamentHostingCard({ tournament }: { tournament: Tournament }) {
  const meta = tournamentStatusMeta(tournament.status);
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="block rounded-[6px] border border-white/10 bg-white/[0.03] p-3.5 transition-colors hover:border-white/20"
      style={{ borderLeftWidth: 3, borderLeftColor: meta.accent }}
    >
      <p className={`text-[10px] font-bold uppercase tracking-wide ${meta.textClass}`} style={mono}>
        {meta.label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[#e2e2e8]">{tournament.name}</p>
      <p className="mt-1 text-xs text-[#8b8b93]">
        {formatDate(tournament.date)} &middot; {tournament.venue}
      </p>
    </Link>
  );
}

function TournamentHistoryRow({ tournament }: { tournament: Tournament }) {
  const champion = tournament.champion ? getPlayer(tournament.champion) : undefined;
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0 transition-colors hover:bg-white/[0.02]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#e2e2e8]">{tournament.name}</p>
        <p className="mt-0.5 text-xs text-[#8b8b93]">
          {formatDate(tournament.date)} &middot; {tournament.venue} &middot; {tournament.registeredPlayerIds.length} players
        </p>
      </div>
      {champion && (
        <span className="shrink-0 text-[11px] font-bold uppercase text-[#ff8f86]" style={mono}>
          Winner &ndash; {abbreviateName(champion.name)}
        </span>
      )}
    </Link>
  );
}
