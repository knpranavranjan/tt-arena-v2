"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  MapPin,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCurrentPlayer } from "@/lib/session-data";
import { usePlayerRatings } from "@/lib/player-ratings";
import { useRegistrations } from "@/lib/registrations";
import { useJoinRequests } from "@/lib/join-requests";
import { arenaFontVariables } from "@/lib/fonts";
import { players, tournaments, getClub, getClubPlayers, getTournament, getWeeklyDelta } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { Tournament, TournamentStatus } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TournamentHistoryCard } from "@/components/player/tournament-history-card";
import { HostArenaCta } from "@/components/home/host-arena-cta";

function ageFromDob(dob: string) {
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
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

function TournamentHostingCard({ tournament }: { tournament: Tournament }) {
  const meta = tournamentStatusMeta(tournament.status);
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="block rounded-[6px] border border-white/10 bg-white/[0.03] p-3.5 transition-colors hover:border-white/20"
      style={{ borderLeftWidth: 3, borderLeftColor: meta.accent }}
    >
      <p className={`text-[10px] font-bold uppercase tracking-wide ${meta.textClass}`} style={{ fontFamily: "var(--font-home-mono)" }}>
        {meta.label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[#e2e2e8]">{tournament.name}</p>
      <p className="mt-1 text-xs text-[#8b8b93]">
        {formatDate(tournament.date)} &middot; {tournament.venue}
      </p>
    </Link>
  );
}

export default function PlayerDashboardPage() {
  const player = useCurrentPlayer();
  const ratings = usePlayerRatings();
  const { registrations } = useRegistrations();
  const { requests: joinRequests } = useJoinRequests();
  if (!player) return null;

  const rating = ratings.getRating(player.id);
  const rank =
    [...players].sort((a, b) => ratings.getRating(b.id) - ratings.getRating(a.id)).findIndex((p) => p.id === player.id) +
    1;
  // Reflect the real change from this player's last rated tournament once
  // there is one; otherwise fall back to the demo's cosmetic weekly delta.
  const lastRatingChange = ratings.getHistory(player.id).at(-1);
  const delta = lastRatingChange ? lastRatingChange.delta : getWeeklyDelta(player);
  const totalMatches = player.wins + player.losses;
  const winPct = totalMatches > 0 ? Math.round((player.wins / totalMatches) * 100) : 0;

  const circumference = 2 * Math.PI * 45;
  const winDashoffset = circumference * (1 - winPct / 100);

  // A tournament shows up here either from the seeded roster or the moment a
  // live registration's payment is confirmed — a player can be in both lists
  // at once, so de-dupe by tournament id.
  const seededRegistered = tournaments.filter((t) => t.registeredPlayerIds.includes(player.id));
  const seededRegisteredIds = new Set(seededRegistered.map((t) => t.id));
  const liveRegistered = registrations
    .filter((r) => r.playerId === player.id && r.status === "REGISTERED" && !seededRegisteredIds.has(r.tournamentId))
    .map((r) => getTournament(r.tournamentId))
    .filter((t): t is Tournament => Boolean(t));
  const registered = [...seededRegistered, ...liveRegistered];

  // Tournaments this player submitted through "Host a Tournament" — the form
  // stamps `organizer` with the hosting player's own name, so that's the real
  // ownership signal (distinct from `registered`, which is tournaments they
  // signed up to play in).
  const hostedTournaments = tournaments.filter((t) => t.organizer === player.name);

  // A player isn't limited to one club: their seeded home club (if any) plus
  // every club whose join request a club admin has accepted.
  const myClubIds = new Set(
    joinRequests.filter((r) => r.playerId === player.id && r.status === "ACCEPTED").map((r) => r.clubId),
  );
  if (player.clubId) myClubIds.add(player.clubId);
  const myClubs = [...myClubIds]
    .map((id) => getClub(id))
    .filter((c): c is NonNullable<ReturnType<typeof getClub>> => Boolean(c))
    .map((c) => ({ club: c, memberCount: getClubPlayers(c.id).length }));

  return (
    <div className={`-m-4 flex flex-col gap-8 bg-[#0c0c0c] p-4 sm:-m-6 sm:p-6 ${arenaFontVariables}`} style={{ fontFamily: "var(--font-home-body)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c0e12]">
        <div className="absolute inset-0 z-0 opacity-30" style={{ maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)" }}>
          <Image src="/l.player/player.png" alt="" fill sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e12] via-[#0c0e12]/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-start justify-between gap-8 p-8 md:flex-row md:items-center md:p-12">
          {/* Identity */}
          <div className="flex-1 space-y-4">
            <h1
              className="m-0 text-3xl font-bold text-[#e2e2e8] drop-shadow-[0_0_15px_rgba(255,36,72,0.25)] sm:text-[40px]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              {player.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[#c2c6d7]">
              <span>{ageFromDob(player.dateOfBirth)} • {player.gender === "MALE" ? "Male" : "Female"}</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {player.state}
              </span>
            </div>
            {rank > 0 && (
              <div
                className="mt-2 inline-block rounded-lg border border-[#ff2448]/30 bg-[#ff2448]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#ff8f86]"
                style={{ fontFamily: "var(--font-home-mono)" }}
              >
                Rank #{rank} Nationally
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="flex flex-col items-center justify-center md:border-l md:border-r md:border-white/10 md:px-12">
            <div className="mb-1 flex items-center gap-2 text-[#c2c6d7]">
              <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ fontFamily: "var(--font-home-mono)" }}>
                Rating Points
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tabular-nums tracking-tighter text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
                {rating.toLocaleString()}
              </span>
              <span className={`flex items-center text-xl font-bold ${delta >= 0 ? "text-emerald-400" : "text-[#ff2448]"}`}>
                {delta >= 0 ? <ArrowUp className="h-5 w-5" strokeWidth={2.5} /> : <ArrowDown className="h-5 w-5" strokeWidth={2.5} />}
                {Math.abs(delta)}
              </span>
            </div>
          </div>

          {/* Win rate */}
          <div className="flex items-center justify-center gap-6">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-[#1a1c20]" />
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" strokeDasharray={circumference} className="stroke-[#ff2448]/40" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={winDashoffset}
                  className="stroke-[#0ea5ff]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold leading-none text-[#e2e2e8]">{winPct}%</span>
                <span className="mt-1 text-[10px] text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>WIN RATE</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xl font-bold leading-none">
                <span className="text-[#0ea5ff]">{player.wins}W</span> <span className="text-[#c2c6d7]">•</span>{" "}
                <span className="text-[#ff2448]">{player.losses}L</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                Win / Loss
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-8">
          <TournamentHistoryCard player={player} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-8">
          {/* My clubs — a player can belong to as many clubs as they've joined */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0c0e12]">
            <div className="flex items-center gap-3 p-5">
              <Users className="h-5 w-5 text-[#c2c6d7]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-mono)" }}>
                My Clubs
              </h2>
              {myClubs.length > 0 && (
                <span className="rounded bg-[#1a1c20] px-2 py-0.5 text-xs text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                  {myClubs.length}
                </span>
              )}
            </div>

            {myClubs.length > 0 ? (
              <div className="flex flex-col border-t border-white/5">
                {myClubs.map(({ club, memberCount }, i) => (
                  <Link
                    key={club.id}
                    href={`/clubs/${club.id}`}
                    className={`group flex items-center gap-4 p-5 transition-colors hover:bg-white/[0.02] ${
                      i !== myClubs.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ff2448]/15 text-base font-bold text-[#ff8f86]">
                      {club.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-lg font-semibold text-[#e2e2e8] group-hover:text-[#ff8f86]">{club.name}</span>
                      <p className="mt-1 text-sm text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                        {club.location}, {club.state} • {memberCount} members • Est. {club.founded}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[#c2c6d7] transition-transform group-hover:translate-x-1 group-hover:text-[#ff8f86]" strokeWidth={1.5} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border-t border-white/5 p-5 text-sm text-[#c2c6d7]">Not affiliated with a club yet.</div>
            )}

            <Link
              href="/clubs"
              className="border-t border-white/5 py-3 text-center text-xs font-semibold uppercase tracking-widest text-[#c2c6d7] transition-colors hover:bg-white/[0.02] hover:text-[#e2e2e8]"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              Browse Clubs
            </Link>
          </div>

          {/* Registrations */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0c0e12]">
            <div className="flex items-center gap-3 p-5">
              <Ticket className="h-5 w-5 text-[#c2c6d7]" strokeWidth={1.5} />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-mono)" }}>
                My Registrations
              </h2>
              <span className="rounded bg-[#1a1c20] px-2 py-0.5 text-xs text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                {registered.length}
              </span>
            </div>

            {registered.length === 0 ? (
              <div className="border-t border-white/5 p-5 text-sm text-[#c2c6d7]">No tournament registrations yet.</div>
            ) : (
              <ScrollArea className="max-h-[300px] border-t border-white/5">
                <div className="flex flex-col">
                  {registered.map((t, i) => (
                    <div
                      key={t.id}
                      className={`flex items-center gap-4 p-4 ${i !== registered.length - 1 ? "border-b border-white/5" : ""}`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff2448]/15 text-[#ff2448]">
                        <MapPin className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-[#e2e2e8]">{t.name}</h3>
                        <p className="mt-1 text-sm text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                          {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {t.venue}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#0ea5ff]/20 bg-[#0ea5ff]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0ea5ff]" style={{ fontFamily: "var(--font-home-mono)" }}>
                        Registered
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          {/* Tournaments I'm hosting */}
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={{ fontFamily: "var(--font-home-mono)" }}>
              Tournaments You&apos;re Hosting
            </h2>
            {hostedTournaments.length === 0 ? (
              <p className="text-sm text-[#8b8b93]">
                No tournaments right now. Get started from{" "}
                <Link href="/host-tournament" className="text-[#ff8f86] hover:text-[#ff2448]">
                  Host a Tournament
                </Link>
                .
              </p>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {hostedTournaments.map((t) => (
                  <TournamentHostingCard key={t.id} tournament={t} />
                ))}
              </div>
            )}
            <div className="mt-4 space-y-2">
              <Link
                href="/player/tournaments"
                className="flex w-full items-center justify-center rounded-[2px] bg-[#ff2448] py-3 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_16px_-4px_#ff2448] active:scale-95"
                style={{ fontFamily: "var(--font-home-mono)" }}
              >
                Manage Tournaments
              </Link>
              <Link
                href="/player/tournament"
                className="flex w-full items-center justify-center rounded-[2px] border border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
                style={{ fontFamily: "var(--font-home-mono)" }}
              >
                View All Events
              </Link>
            </div>
          </section>
        </div>
      </div>

      <HostArenaCta />
    </div>
  );
}
