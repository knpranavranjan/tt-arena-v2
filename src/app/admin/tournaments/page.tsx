"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TournamentStatusBadge } from "@/components/ui/status-badge";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { buildEventGroups, mostActiveStatus } from "@/lib/event-groups";
import { formatDate } from "@/lib/format";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import type { TournamentStatus } from "@/lib/types";

export default function AdminTournamentsPage() {
  const [status, setStatus] = useState<TournamentStatus | "all">("all");
  const { overrides, approve, revert } = useTournamentStatus();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();

  // One row per event — categories a host adds are folded in, so a 4-category
  // submission is a single approval, not four.
  const rows = useMemo(
    () =>
      buildEventGroups(allTournaments, allEvents)
        .map((group) => ({
          group,
          status: mostActiveStatus(group.categories.map((c) => effectiveStatus(c, overrides))),
        }))
        .filter((r) => status === "all" || r.status === status),
    [status, overrides, allTournaments, allEvents],
  );

  const approveEvent = (categoryIds: string[], name: string) => {
    categoryIds.forEach((id) => approve(id));
    toast.success("Event approved", {
      description: `${name} is live — every category is now open and its Matches workspace unlocked.`,
    });
  };

  const revertEvent = (categoryIds: string[], name: string) => {
    categoryIds.forEach((id) => revert(id));
    toast("Reverted to draft", { description: `${name} is hidden from players again.` });
  };

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
              <TableHead>Event</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Players</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Approval</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ group: g, status: s }) => {
              const categoryIds = g.categories.map((c) => c.id);
              return (
                <TableRow key={g.eventId}>
                  <TableCell>
                    <Link href={`/tournaments/${g.primary.id}`} className="font-medium text-foreground hover:text-primary">
                      {g.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{g.organizer}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(g.date)}</TableCell>
                  <TableCell className="text-muted-foreground">{g.venue}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {g.categories.map((c) => c.category).join(", ")}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{g.registeredCount}</TableCell>
                  <TableCell className="text-muted-foreground">{g.format.replace(/_/g, " ")}</TableCell>
                  <TableCell><TournamentStatusBadge status={s} /></TableCell>
                  <TableCell className="text-right">
                    {s === "DRAFT" ? (
                      <Button size="sm" onClick={() => approveEvent(categoryIds, g.name)}>
                        Approve &amp; Go Live
                      </Button>
                    ) : s === "COMPLETED" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => revertEvent(categoryIds, g.name)}>
                        Revert to draft
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
