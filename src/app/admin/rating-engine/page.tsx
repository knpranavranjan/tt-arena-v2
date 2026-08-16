"use client";

import Link from "next/link";
import { Plug } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RatingExportStatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/cards/stat-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { getTournament, ratingExports, tournaments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

export default function AdminRatingEnginePage() {
  const completed = tournaments.filter((t) => t.status === "COMPLETED").length;
  const sent = ratingExports.filter((r) => r.status === "SENT").length;
  const pending = completed - ratingExports.length + ratingExports.filter((r) => r.status === "PENDING").length;
  const failed = ratingExports.filter((r) => r.status === "FAILED").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
        <Plug className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">
          TT Tournament Management does not calculate ratings. Completed tournament results are exported to the
          external Rating Engine, which returns updated ratings independently. This view reflects export
          integration status only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sent" value={sent} />
        <StatCard label="Pending" value={Math.max(pending, 0)} />
        <StatCard label="Failed" value={failed} />
      </div>

      {ratingExports.length === 0 ? (
        <EmptyState title="No exports yet" description="Rating exports will appear here as tournaments complete." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Last Attempt</TableHead>
                <TableHead>Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratingExports.map((r) => (
                <TableRow key={r.tournamentId}>
                  <TableCell>
                    <Link href={`/tournaments/${r.tournamentId}`} className="font-medium text-foreground hover:text-primary">
                      {getTournament(r.tournamentId)?.name}
                    </Link>
                  </TableCell>
                  <TableCell><RatingExportStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.sentAt ? formatDate(r.sentAt) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.lastAttempt)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.response ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
