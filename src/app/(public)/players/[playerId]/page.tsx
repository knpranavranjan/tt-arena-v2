"use client";

import { use, useMemo, type ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Trophy } from "lucide-react";
import { LiveRating } from "@/components/players/live-rating";
import { PlayerClubsList } from "@/components/player/player-clubs-list";
import { TournamentHistoryCard } from "@/components/player/tournament-history-card";
import { arenaFontVariables } from "@/lib/fonts";
import { getPlayer } from "@/lib/mock-data";
import { useCreatedPlayers, usePlayerRoster } from "@/lib/players-store";
import { usePlayerRecord } from "@/lib/player-ratings";
import { formatDate, initials } from "@/lib/format";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

export default function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = use(params);
  const roster = usePlayerRoster();
  const { isLoading: rosterLoading } = useCreatedPlayers();
  const player = useMemo(
    () => roster.find((p) => p.id === playerId) ?? getPlayer(playerId),
    [roster, playerId],
  );

  const baseline = useMemo(
    () => (player ? { wins: player.wins, losses: player.losses } : undefined),
    [player],
  );
  const record = usePlayerRecord(player?.id ?? "", baseline);

  // Don't 404 a real sign-up before the created-players roster has loaded.
  if (!player && rosterLoading) {
    return <div className="min-h-screen bg-[#050a12]" />;
  }
  if (!player) notFound();

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-10 sm:px-12 sm:py-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c0e12]">
          <div className="absolute inset-0 z-0 opacity-30" style={{ maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)" }}>
            <Image src="/l.player/player.png" alt="" fill sizes="100vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e12] via-[#0c0e12]/80 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 p-8 sm:flex-row sm:items-center md:p-12">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#ff2448]/15 text-2xl font-semibold text-[#ff8f86]"
              style={display}
            >
              {initials(player.name)}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#e2e2e8] drop-shadow-[0_0_15px_rgba(255,36,72,0.25)] sm:text-4xl" style={display}>
                {player.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#c2c6d7]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {player.state}
                </span>
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {player.category} &middot; {player.gender === "MALE" ? "Men's" : "Women's"}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]" style={mono}>
                Rating Points
              </span>
              <LiveRating
                playerId={player.id}
                fallbackRating={player.rating}
                className="mt-1 block text-4xl font-extrabold tabular-nums tracking-tighter text-[#e2e2e8]"
                style={display}
              />
            </div>
          </div>
        </section>

        {/* Stat tiles — live from published tournament results */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatBlock label="Matches Played" value={record.played} />
          <StatBlock label="Wins" value={record.wins} accent="text-emerald-400" />
          <StatBlock label="Losses" value={record.losses} accent="text-[#ff2448]" />
        </div>

        {/* Player information */}
        <section>
          <h2 className="mb-4 text-xl font-bold uppercase tracking-wide text-[#e2e2e8]" style={display}>
            Player Information
          </h2>
          <div className="grid gap-5 rounded-2xl border border-white/5 bg-[#0c0e12] p-6 sm:grid-cols-2">
            <InfoRow label="Win Rate" value={`${record.winRate}%`} />
            <InfoRow label="Date of Birth" value={formatDate(player.dateOfBirth)} />
            <InfoRow label="Clubs" value={<PlayerClubsList player={player} />} />
            <InfoRow label="State" value={player.state} />
          </div>
        </section>

        {/* Tournament history */}
        <section>
          <h2 className="mb-4 text-xl font-bold uppercase tracking-wide text-[#e2e2e8]" style={display}>
            Tournament History
          </h2>
          <TournamentHistoryCard player={player} />
        </section>
      </div>
    </div>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0c0e12] p-5 text-center">
      <p className={`text-3xl font-bold tabular-nums ${accent ?? "text-[#e2e2e8]"}`} style={{ fontFamily: "var(--font-home-display)" }}>
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-widest text-[#c2c6d7]" style={mono}>
        {label}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#c2c6d7]" style={mono}>
        {label}
      </p>
      {typeof value === "string" ? <p className="mt-1 text-sm font-medium text-[#e2e2e8]">{value}</p> : value}
    </div>
  );
}
