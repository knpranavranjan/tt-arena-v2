"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RatingExportStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { getTournament, ratingExports } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

export default function HostRatingExportsPage() {
  if (ratingExports.length === 0) {
    return (
      <EmptyState
        title="No rating exports yet"
        description="Completed tournaments are automatically queued for export to the external Rating Engine."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        This platform does not calculate ratings — completed tournament results are sent to the external Rating Engine for processing.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tournament</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Attempt</TableHead>
              <TableHead>Response</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratingExports.map((r) => (
              <TableRow key={r.tournamentId}>
                <TableCell>
                  <Link href={`/host/tournaments/${r.tournamentId}`} className="font-medium text-foreground hover:text-primary">
                    {getTournament(r.tournamentId)?.name}
                  </Link>
                </TableCell>
                <TableCell><RatingExportStatusBadge status={r.status} /></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.lastAttempt)}</TableCell>
                <TableCell className="text-muted-foreground">{r.response ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
