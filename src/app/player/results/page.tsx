"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/cards/stat-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { useCurrentPlayer } from "@/lib/session-data";
import { tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { Gauge, Swords, Trophy } from "lucide-react";

export default function PlayerResultsPage() {
  const player = useCurrentPlayer();
  if (!player) return null;

  const completed = tournaments.filter(
    (t) => t.registeredPlayerIds.includes(player.id) && t.status === "COMPLETED",
  );

  const resultFor = (t: (typeof tournaments)[number]) => {
    if (t.champion === player.id) return "Champion";
    if (t.runnerUp === player.id) return "Runner-up";
    if (t.semiFinalists?.includes(player.id)) return "Semifinalist";
    return "Participated";
  };

  const winPct = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Matches Played" value={player.wins + player.losses} icon={<Swords />} />
        <StatCard label="Win Rate" value={`${winPct}%`} icon={<Gauge />} />
        <StatCard label="Tournaments Completed" value={completed.length} icon={<Trophy />} />
      </div>

      {completed.length === 0 ? (
        <EmptyState title="No completed tournaments yet" description="Your results will appear here once a tournament you're registered for finishes." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completed.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/tournaments/${t.id}`} className="font-medium text-foreground hover:text-primary">
                      {t.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                  <TableCell className="text-foreground">{resultFor(t)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
