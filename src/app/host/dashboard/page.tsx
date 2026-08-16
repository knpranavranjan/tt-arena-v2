"use client";

import Link from "next/link";
import { Plus, Trophy, Users, Zap } from "lucide-react";
import { StatCard } from "@/components/cards/stat-card";
import { TournamentCard } from "@/components/cards/tournament-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { tournaments } from "@/lib/mock-data";

export default function HostDashboardPage() {
  const active = tournaments.filter((t) => !["DRAFT", "COMPLETED"].includes(t.status));
  const completed = tournaments.filter((t) => t.status === "COMPLETED");
  const totalRegistrations = tournaments.reduce((sum, t) => sum + t.registeredPlayerIds.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">Host Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage your tournament operations from here.</p>
        </div>
        <Button render={<Link href="/host/tournaments/new" />}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Create Tournament
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Tournaments" value={tournaments.length} icon={<Trophy />} />
        <StatCard label="Active Tournaments" value={active.length} icon={<Zap />} />
        <StatCard label="Total Registered Players" value={totalRegistrations} icon={<Users />} />
        <StatCard label="Completed" value={completed.length} icon={<Trophy />} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-medium text-foreground">Active Tournaments</h3>
          <Link href="/host/tournaments" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {active.length === 0 ? (
          <EmptyState title="No active tournaments" description="Create a tournament to get started." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
