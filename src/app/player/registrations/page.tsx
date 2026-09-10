"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RegistrationStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { useCurrentPlayer } from "@/lib/session-data";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { useRegistrations } from "@/lib/registrations";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { categoryLabel, eventTitle } from "@/lib/tournament-manage";
import { formatDate } from "@/lib/format";
import type { RegistrationStatus, Tournament, TournamentStatus } from "@/lib/types";

const statusMap: Record<TournamentStatus, RegistrationStatus> = {
  DRAFT: "REGISTERED",
  REGISTRATION_OPEN: "REGISTERED",
  REGISTRATION_CLOSED: "REGISTRATION_CLOSED",
  SEEDING: "TOURNAMENT_STARTED",
  POOLS: "TOURNAMENT_STARTED",
  KNOCKOUT: "TOURNAMENT_STARTED",
  COMPLETED: "COMPLETED",
};

interface Row {
  eventId: string;
  name: string;
  date: string;
  categories: string[];
  primaryId: string;
  status: RegistrationStatus;
}

export default function PlayerRegistrationsPage() {
  const player = useCurrentPlayer();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { registrations } = useRegistrations();
  const { overrides } = useTournamentStatus();

  const rows = useMemo<Row[]>(() => {
    if (!player) return [];
    // Every category Tournament this player is in — from a roster or a live reg.
    const mine: Tournament[] = [];
    const seen = new Set<string>();
    for (const t of allTournaments) {
      const inRoster = t.registeredPlayerIds.includes(player.id);
      const inLive = registrations.some(
        (r) => r.tournamentId === t.id && r.playerId === player.id && r.status !== "PENDING_PAYMENT",
      );
      if ((inRoster || inLive) && !seen.has(t.id)) {
        seen.add(t.id);
        mine.push(t);
      }
    }

    const byEvent = new Map<string, Row>();
    for (const t of mine) {
      const ev = allEvents.find((e) => e.id === t.eventId);
      const div = categoryLabel(t);
      const existing = byEvent.get(t.eventId);
      if (existing) {
        if (!existing.categories.includes(div)) existing.categories.push(div);
        continue;
      }
      byEvent.set(t.eventId, {
        eventId: t.eventId,
        name: eventTitle(t, ev?.name),
        date: ev?.date ?? t.date,
        categories: [div],
        primaryId: t.id,
        status: statusMap[effectiveStatus(t, overrides)],
      });
    }
    return [...byEvent.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [player, allTournaments, allEvents, registrations, overrides]);

  if (!player) return null;

  if (rows.length === 0) {
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
          {rows.map((r) => (
            <TableRow key={r.eventId}>
              <TableCell>
                <Link
                  href={`/tournaments/${r.primaryId}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {r.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(r.date)}</TableCell>
              <TableCell className="text-muted-foreground">{r.categories.join(", ")}</TableCell>
              <TableCell>
                <RegistrationStatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
