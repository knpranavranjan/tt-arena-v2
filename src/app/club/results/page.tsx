"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";
import { useCurrentClub } from "@/lib/session-data";
import { useClubMembers } from "@/lib/club-membership";
import { getPlayer, tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

export default function ClubResultsPage() {
  const club = useCurrentClub();
  const members = useClubMembers(club?.id);
  if (!club) return null;

  const playerIds = new Set(members.map((p) => p.id));
  const completed = tournaments.filter(
    (t) => t.status === "COMPLETED" && t.registeredPlayerIds.some((id) => playerIds.has(id)),
  );

  const resultFor = (t: (typeof tournaments)[number]) => {
    const clubPlayerIds = t.registeredPlayerIds.filter((id) => playerIds.has(id));
    const results = clubPlayerIds.map((id) => {
      if (t.champion === id) return `${getPlayer(id)?.name} — Champion`;
      if (t.runnerUp === id) return `${getPlayer(id)?.name} — Runner-up`;
      if (t.semiFinalists?.includes(id)) return `${getPlayer(id)?.name} — Semifinalist`;
      return `${getPlayer(id)?.name} — Participated`;
    });
    return results.join(", ");
  };

  if (completed.length === 0) {
    return <EmptyState title="No results yet" description="Completed tournament results for your club will appear here." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tournament</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Club Results</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {completed.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link href={`/tournaments/${t.id}`} className="font-medium text-foreground hover:text-primary">{t.name}</Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
              <TableCell className="text-muted-foreground">{resultFor(t)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
