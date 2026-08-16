"use client";

import Link from "next/link";
import { Gauge, LineChart, Trophy, Users } from "lucide-react";
import { StatCard } from "@/components/cards/stat-card";
import { TournamentCard } from "@/components/cards/tournament-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { useCurrentPlayer } from "@/lib/session-data";
import { tournaments } from "@/lib/mock-data";

export default function PlayerDashboardPage() {
  const player = useCurrentPlayer();
  if (!player) return null;

  const registered = tournaments.filter((t) => t.registeredPlayerIds.includes(player.id));
  const available = tournaments.filter(
    (t) => t.status === "REGISTRATION_OPEN" && !t.registeredPlayerIds.includes(player.id) && t.category === player.category,
  );
  const winPct = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">Welcome back, {player.name.split(" ")[0]}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s where things stand with your competitive season.</p>
        </div>
        <Button render={<Link href="/player/tournaments" />}>Browse Tournaments</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current Rating" value={player.rating} icon={<LineChart />} />
        <StatCard label="Current Club" value={player.clubName ?? "Unaffiliated"} icon={<Users />} />
        <StatCard label="Registered Tournaments" value={registered.length} icon={<Trophy />} />
        <StatCard label="Win Rate" value={`${winPct}%`} icon={<Gauge />} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-medium text-foreground">Registered Tournaments</h3>
          <Link href="/player/registrations" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {registered.length === 0 ? (
          <EmptyState title="No registered tournaments" description="Browse open tournaments and register to compete." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {registered.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-medium text-foreground">Available For You</h3>
          <Link href="/player/tournaments" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {available.length === 0 ? (
          <EmptyState title="No open tournaments right now" description="Check back soon for new tournaments in your category." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
