"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RegistrationStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { useCurrentPlayer } from "@/lib/session-data";
import { tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { RegistrationStatus, TournamentStatus } from "@/lib/types";

const statusMap: Record<TournamentStatus, RegistrationStatus> = {
  DRAFT: "REGISTERED",
  REGISTRATION_OPEN: "REGISTERED",
  REGISTRATION_CLOSED: "REGISTRATION_CLOSED",
  SEEDING: "TOURNAMENT_STARTED",
  POOLS: "TOURNAMENT_STARTED",
  KNOCKOUT: "TOURNAMENT_STARTED",
  COMPLETED: "COMPLETED",
};

export default function PlayerRegistrationsPage() {
  const player = useCurrentPlayer();
  if (!player) return null;

  const registrations = tournaments.filter((t) => t.registeredPlayerIds.includes(player.id));

  if (registrations.length === 0) {
    return (
      <EmptyState
        title="No registrations yet"
        description="Once you register for a tournament, it will show up here with its live status."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tournament</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link href={`/tournaments/${t.id}`} className="font-medium text-foreground hover:text-primary">
                  {t.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
              <TableCell className="text-muted-foreground">{t.category}</TableCell>
              <TableCell><RegistrationStatusBadge status={statusMap[t.status]} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
