"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TournamentStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

export default function HostTournamentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button render={<Link href="/host/tournaments/new" />}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Create Tournament
        </Button>
      </div>

      {tournaments.length === 0 ? (
        <EmptyState title="No tournaments yet" description="Create your first tournament to get started." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/host/tournaments/${t.id}`} className="font-medium text-foreground hover:text-primary">
                      {t.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                  <TableCell className="text-muted-foreground">{t.format.replace("_", " ")}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{t.registeredPlayerIds.length}/{t.maxPlayers}</TableCell>
                  <TableCell><TournamentStatusBadge status={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
