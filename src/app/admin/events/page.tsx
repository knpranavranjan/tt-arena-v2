"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EventStatusBadge } from "@/components/ui/status-badge";
import { events } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

export default function AdminEventsPage() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Organizer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Tournaments</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <Link href={`/events/${e.id}`} className="font-medium text-foreground hover:text-primary">{e.name}</Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{e.organizer}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
              <TableCell className="text-muted-foreground">{e.location}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{e.tournamentIds.length}</TableCell>
              <TableCell><EventStatusBadge status={e.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
