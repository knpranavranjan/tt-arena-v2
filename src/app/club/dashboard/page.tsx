"use client";

import Link from "next/link";
import { Calendar, Gauge, Trophy, Users } from "lucide-react";
import { StatCard } from "@/components/cards/stat-card";
import { PlayerCard } from "@/components/cards/player-card";
import { TournamentCard } from "@/components/cards/tournament-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { useCurrentClub } from "@/lib/session-data";
import { events, getClubPlayers, tournaments } from "@/lib/mock-data";

export default function ClubDashboardPage() {
  const club = useCurrentClub();
  if (!club) return null;

  const clubPlayers = getClubPlayers(club.id);
  const playerIds = new Set(clubPlayers.map((p) => p.id));
  const clubTournaments = tournaments.filter((t) =>
    t.registeredPlayerIds.some((id) => playerIds.has(id)),
  );
  const upcoming = clubTournaments.filter((t) => t.status !== "COMPLETED");
  const clubEvents = events.filter((e) => e.participatingClubIds.includes(club.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">{club.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{club.location}, {club.state}</p>
        </div>
        <Button render={<Link href="/club/players" />}>Manage Roster</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Players" value={clubPlayers.length} icon={<Users />} />
        <StatCard label="Active Registrations" value={upcoming.length} icon={<Trophy />} />
        <StatCard label="Upcoming Events" value={clubEvents.filter((e) => e.status !== "COMPLETED").length} icon={<Calendar />} />
        <StatCard
          label="Avg. Rating"
          value={clubPlayers.length ? Math.round(clubPlayers.reduce((s, p) => s + p.rating, 0) / clubPlayers.length) : 0}
          icon={<Gauge />}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-medium text-foreground">Club Roster</h3>
          <Link href="/club/players" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {clubPlayers.length === 0 ? (
          <EmptyState title="No players yet" description="Add players to your club roster to get started." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {clubPlayers.slice(0, 4).map((p) => <PlayerCard key={p.id} player={p} />)}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-medium text-foreground">Active Tournaments</h3>
          <Link href="/club/tournaments" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState title="No active tournaments" description="Tournaments involving your players will show up here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
