"use client";

import { Activity, Building2, ShieldCheck, Trophy, Users } from "lucide-react";
import { StatCard } from "@/components/cards/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TournamentStatusBadge } from "@/components/ui/status-badge";
import { appUsers, clubs, events, players, tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

const activity = [
  { time: "2 min ago", text: "Player Sneha Iyer registered for TT Open 2026 — Senior Singles" },
  { time: "18 min ago", text: "Host Karnataka TTA Ops closed registration for Monsoon Cup — Open Singles" },
  { time: "1 hr ago", text: "Rating export sent for Eastern Regional Championship" },
  { time: "3 hrs ago", text: "New club SpinForge Academy verified" },
];

export default function AdminDashboardPage() {
  const active = tournaments.filter((t) => !["DRAFT", "COMPLETED"].includes(t.status));
  const completed = tournaments.filter((t) => t.status === "COMPLETED");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground">Platform Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">System-wide activity across TT Tournament Management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Players" value={players.length} icon={<Users />} />
        <StatCard label="Total Clubs" value={clubs.length} icon={<Building2 />} />
        <StatCard label="Total Tournaments" value={tournaments.length} icon={<Trophy />} />
        <StatCard label="Platform Users" value={appUsers.length} icon={<ShieldCheck />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Tournaments" value={active.length} />
        <StatCard label="Completed Tournaments" value={completed.length} />
        <StatCard label="Total Events" value={events.length} />
        <StatCard label="Live Events" value={events.filter((e) => e.status === "LIVE").length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-heading text-lg font-medium text-foreground">Tournament Oversight</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.organizer}</TableCell>
                    <TableCell><TournamentStatusBadge status={t.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 font-heading text-lg font-medium text-foreground">
            <Activity className="h-4 w-4" strokeWidth={1.5} /> System Activity
          </h3>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Last synced {formatDate(new Date().toISOString())}</p>
    </div>
  );
}
