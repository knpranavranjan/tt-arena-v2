"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";
import { getPlayer, tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

export default function HostResultsPage() {
  const completed = tournaments.filter((t) => t.status === "COMPLETED");

  if (completed.length === 0) {
    return <EmptyState title="No completed tournaments yet" description="Results for completed tournaments will appear here." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tournament</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Champion</TableHead>
            <TableHead>Runner-up</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {completed.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link href={`/host/tournaments/${t.id}`} className="font-medium text-foreground hover:text-primary">{t.name}</Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
              <TableCell className="text-foreground">{t.champion ? getPlayer(t.champion)?.name : "—"}</TableCell>
              <TableCell className="text-muted-foreground">{t.runnerUp ? getPlayer(t.runnerUp)?.name : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
