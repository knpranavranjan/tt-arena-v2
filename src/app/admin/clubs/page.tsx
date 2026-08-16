"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { clubs, getClubPlayers } from "@/lib/mock-data";

export default function AdminClubsPage() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Club</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Players</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Profile</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium text-foreground">{c.name}</TableCell>
              <TableCell className="text-muted-foreground">{c.location}, {c.state}</TableCell>
              <TableCell className="text-right tabular-nums">{getClubPlayers(c.id).length}</TableCell>
              <TableCell><Badge variant="outline" className="border-success/30 text-success">Verified</Badge></TableCell>
              <TableCell>
                <Link href={`/clubs/${c.id}`} className="text-sm font-medium text-primary hover:underline">View</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
