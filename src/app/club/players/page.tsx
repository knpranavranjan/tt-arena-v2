"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { useCurrentClub } from "@/lib/session-data";
import { getClubPlayers } from "@/lib/mock-data";
import { initials } from "@/lib/format";

export default function ClubPlayersPage() {
  const club = useCurrentClub();
  const [search, setSearch] = useState("");

  if (!club) return null;
  const roster = getClubPlayers(club.id).sort((a, b) => b.rating - a.rating);
  const filtered = roster.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search roster…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No players found" description="Try a different search, or add players to your club roster." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/players/${p.id}`} className="flex items-center gap-2 font-medium text-foreground hover:text-primary">
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarFallback className="bg-secondary text-xs">{initials(p.name)}</AvatarFallback>
                      </Avatar>
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="text-muted-foreground">{p.state}</TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">{p.rating}</TableCell>
                  <TableCell><Badge variant="outline" className="border-success/30 text-success">Active</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
