"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUp, ChevronRight, MapPin, TrendingUp, Users } from "lucide-react";
import { useCurrentPlayer } from "@/lib/session-data";
import { arenaFontVariables } from "@/lib/fonts";
import { players, tournaments, matches, getClub, getTournament, getPlayer, getWeeklyDelta } from "@/lib/mock-data";

function ageFromDob(dob: string) {
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PlayerDashboardPage() {
  const player = useCurrentPlayer();
  if (!player) return null;

  const club = player.clubId ? getClub(player.clubId) : undefined;
  const rank = [...players].sort((a, b) => b.rating - a.rating).findIndex((p) => p.id === player.id) + 1;
  const delta = getWeeklyDelta(player);
  const totalMatches = player.wins + player.losses;
  const winPct = totalMatches > 0 ? Math.round((player.wins / totalMatches) * 100) : 0;

  const circumference = 2 * Math.PI * 45;
  const winDashoffset = circumference * (1 - winPct / 100);

  const history = matches
    .filter((m) => (m.playerAId === player.id || m.playerBId === player.id) && m.status === "COMPLETED")
    .map((m) => {
      const opponentId = m.playerAId === player.id ? m.playerBId : m.playerAId;
      const opponent = getPlayer(opponentId);
      const tournament = getTournament(m.tournamentId);
      const won = m.winnerId === player.id;
      const myScore = m.playerAId === player.id ? m.scoreA : m.scoreB;
      const theirScore = m.playerAId === player.id ? m.scoreB : m.scoreA;
      return { match: m, opponent, tournament, won, myScore, theirScore };
    });

  const registered = tournaments.filter((t) => t.registeredPlayerIds.includes(player.id));

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
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1a1c20] px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff2448] shadow-[0_0_8px_rgba(255,36,72,0.8)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                Active Player
              </span>
            </div>
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
              {club && (
                <Link href={`/clubs/${club.id}`} className="flex items-center gap-1 hover:text-[#ff8f86]">
                  <Users className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {club.name}
                </Link>
              )}
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
                {player.rating.toLocaleString()}
              </span>
              <span className="flex items-center text-xl font-bold text-emerald-400">
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                {delta}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Match history */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
                Match History
              </h2>
              <span className="rounded bg-[#1a1c20] px-2 py-0.5 text-xs text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                {history.length}
              </span>
            </div>
            <Link href="/player/results" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#ff8f86] hover:text-[#ff2448]" style={{ fontFamily: "var(--font-home-mono)" }}>
              View All <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#0c0e12] p-8 text-center text-sm text-[#c2c6d7]">
              No completed matches yet — results will show up here once you play.
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0c0e12]">
              {history.map(({ match, opponent, tournament, won, myScore, theirScore }, i) => (
                <div
                  key={match.id}
                  className={`flex flex-col gap-2 p-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center ${
                    i !== history.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  <div className="w-16 shrink-0">
                    <span className={`text-xs font-bold uppercase tracking-wide ${won ? "text-[#0ea5ff]" : "text-[#ff2448]"}`} style={{ fontFamily: "var(--font-home-mono)" }}>
                      {won ? "Win" : "Loss"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-[#e2e2e8]">{opponent?.name ?? "Unknown Player"}</span>
                    <div className="mt-1 text-xs text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                      {match.round} • {tournament?.name ?? "Tournament"}
                    </div>
                  </div>
                  <div className="text-sm text-[#c2c6d7] sm:flex-1 sm:text-center" style={{ fontFamily: "var(--font-home-mono)" }}>
                    {myScore}-{theirScore} sets
                  </div>
                  <div className="text-xs text-[#c2c6d7] sm:w-32 sm:text-right" style={{ fontFamily: "var(--font-home-mono)" }}>
                    {tournament ? new Date(tournament.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Club + registrations */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="border-b border-white/10 pb-4 text-lg font-semibold uppercase tracking-wide text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
              My Club
            </h2>
            <div className="flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0c0e12]">
              {club ? (
                <Link href={`/clubs/${club.id}`} className="group flex items-center justify-between border-b border-white/5 p-5 transition-colors hover:bg-white/[0.02]">
                  <div>
                    <span className="text-[#e2e2e8] group-hover:text-[#ff8f86]">{club.name}</span>
                    <p className="mt-1 text-xs text-[#c2c6d7]">{club.location}, {club.state}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#c2c6d7] transition-transform group-hover:translate-x-1 group-hover:text-[#ff8f86]" strokeWidth={1.5} />
                </Link>
              ) : (
                <div className="border-b border-white/5 p-5 text-sm text-[#c2c6d7]">Not affiliated with a club yet.</div>
              )}
              <div className="flex justify-center p-4">
                <Link
                  href="/clubs"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff2448]/10 py-3 text-xs font-semibold uppercase tracking-widest text-[#ff8f86] shadow-[0_0_15px_-5px_rgba(255,36,72,0.4)] transition-colors hover:bg-[#ff2448]/20"
                  style={{ fontFamily: "var(--font-home-mono)" }}
                >
                  Browse Clubs <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="border-b border-white/10 pb-4 text-lg font-semibold uppercase tracking-wide text-[#e2e2e8]" style={{ fontFamily: "var(--font-home-display)" }}>
              My Registrations
            </h2>
            <div className="flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0c0e12]">
              {registered.length === 0 ? (
                <div className="p-5 text-sm text-[#c2c6d7]">No tournament registrations yet.</div>
              ) : (
                registered.map((t, i) => (
                  <div key={t.id} className={`flex flex-col gap-3 p-5 ${i !== registered.length - 1 ? "border-b border-white/5" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[#e2e2e8]">{t.name}</h3>
                        <p className="mt-1 text-xs text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                          {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {t.venue}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#0ea5ff]/20 bg-[#0ea5ff]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0ea5ff]" style={{ fontFamily: "var(--font-home-mono)" }}>
                        Registered
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div className="flex justify-center border-t border-white/5 p-4">
                <Link
                  href="/player/registrations"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff2448]/10 py-3 text-xs font-semibold uppercase tracking-widest text-[#ff8f86] shadow-[0_0_15px_-5px_rgba(255,36,72,0.4)] transition-colors hover:bg-[#ff2448]/20"
                  style={{ fontFamily: "var(--font-home-mono)" }}
                >
                  View All Registrations <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
