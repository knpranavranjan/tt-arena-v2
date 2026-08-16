"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TournamentStatusBadge } from "@/components/ui/status-badge";
import { tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { TournamentStatus } from "@/lib/types";

export default function AdminTournamentsPage() {
  const [status, setStatus] = useState<TournamentStatus | "all">("all");

  const filtered = useMemo(
    () => tournaments.filter((t) => status === "all" || t.status === status),
    [status],
  );

  return (
    <div className="flex flex-col gap-4">
      <Select value={status} onValueChange={(v) => setStatus((v as TournamentStatus | "all") ?? "all")}>
        <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
          <SelectItem value="SEEDING">Seeding</SelectItem>
          <SelectItem value="POOLS">Pools</SelectItem>
          <SelectItem value="KNOCKOUT">In Progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tournament</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Players</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link href={`/tournaments/${t.id}`} className="font-medium text-foreground hover:text-primary">{t.name}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.organizer}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                <TableCell className="text-muted-foreground">{t.venue}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{t.registeredPlayerIds.length}/{t.maxPlayers}</TableCell>
                <TableCell className="text-muted-foreground">{t.format.replace("_", " ")}</TableCell>
                <TableCell><TournamentStatusBadge status={t.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
