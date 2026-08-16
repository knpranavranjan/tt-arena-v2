"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar, MapPin, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TournamentStatusBadge, RatingExportStatusBadge } from "@/components/ui/status-badge";
import { TournamentProgress } from "@/components/tournament/tournament-progress";
import { KnockoutBracket, type BracketRoundData } from "@/components/tournament/knockout-bracket";
import { EmptyState } from "@/components/feedback/empty-state";
import { getPlayer, getTournamentPlayers, matches as allMatches, poolStandings, ratingExports } from "@/lib/mock-data";
import { generatePools, poolQualifiers, seedPlayers } from "@/lib/tournament-logic";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RatingExportStatus, Tournament, TournamentStatus } from "@/lib/types";

const nextStatusLabel: Partial<Record<TournamentStatus, string>> = {
  REGISTRATION_OPEN: "Close Registration",
  REGISTRATION_CLOSED: "Confirm Seeding",
  SEEDING: "Generate Pools",
  POOLS: "Generate Knockout",
};

const statusFlow: TournamentStatus[] = [
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "SEEDING",
  "POOLS",
  "KNOCKOUT",
  "COMPLETED",
];

export function TournamentWorkspace({ tournament }: { tournament: Tournament }) {
  const [status, setStatus] = useState<TournamentStatus>(tournament.status);
  const [champion, setChampion] = useState<string | undefined>(tournament.champion);
  const [runnerUp, setRunnerUp] = useState<string | undefined>(tournament.runnerUp);
  const [exportStatus, setExportStatus] = useState<RatingExportStatus | undefined>(
    ratingExports.find((r) => r.tournamentId === tournament.id)?.status,
  );
  const [pendingChampion, setPendingChampion] = useState<string>("");
  const [pendingRunnerUp, setPendingRunnerUp] = useState<string>("");

  const registeredPlayers = useMemo(() => getTournamentPlayers(tournament), [tournament]);
  const seeded = useMemo(() => seedPlayers(registeredPlayers), [registeredPlayers]);
  const pools = useMemo(
    () => (status !== "REGISTRATION_OPEN" && status !== "REGISTRATION_CLOSED" && status !== "SEEDING"
      ? generatePools(seeded, tournament.poolSize ?? 4)
      : []),
    [seeded, tournament.poolSize, status],
  );
  const qualifiers = useMemo(() => (pools.length ? poolQualifiers(pools) : []), [pools]);

  const tournamentMatches = allMatches.filter((m) => m.tournamentId === tournament.id);

  const advance = () => {
    const idx = statusFlow.indexOf(status);
    if (idx === -1 || idx >= statusFlow.length - 2) return;
    const next = statusFlow[idx + 1];
    setStatus(next);
    toast.success(`Tournament moved to ${next.replace("_", " ")}`);
  };

  const declareResult = () => {
    if (!pendingChampion || !pendingRunnerUp) {
      toast.error("Select both a champion and runner-up");
      return;
    }
    setChampion(pendingChampion);
    setRunnerUp(pendingRunnerUp);
    setStatus("COMPLETED");
    toast.success("Tournament marked as completed");
  };

  const exportToRatingEngine = () => {
    setExportStatus("SENT");
    toast.success("Results sent to Rating Engine");
  };

  const bracketRounds: BracketRoundData[] = qualifiers.length >= 2
    ? [
        {
          name: qualifiers.length > 2 ? "Semifinal" : "Final",
          matches: chunk(qualifiers, 2).map((pair, i) => ({
            id: `bracket-${i}`,
            playerA: pair[0] ? { name: pair[0].name, seed: seeded.indexOf(pair[0]) + 1 } : undefined,
            playerB: pair[1] ? { name: pair[1].name, seed: seeded.indexOf(pair[1]) + 1 } : undefined,
          })),
        },
      ]
    : [];

  const registrationPct = Math.round((tournament.registeredPlayerIds.length / tournament.maxPlayers) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <TournamentStatusBadge status={status} />
            <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">{tournament.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" strokeWidth={1.5} /> {formatDate(tournament.date)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {tournament.venue}</span>
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" strokeWidth={1.5} /> {tournament.organizer}</span>
              <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" strokeWidth={1.5} /> {tournament.category}</span>
            </div>
          </div>
          {nextStatusLabel[status] && (
            <Button onClick={advance}>{nextStatusLabel[status]}</Button>
          )}
          <Button variant="outline" render={<Link href={`/tournaments/${tournament.id}`} />}>
            View Public Page
          </Button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <TournamentProgress status={status} className="min-w-[560px]" />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="seeding">Seeding</TabsTrigger>
            <TabsTrigger value="pools">Pools</TabsTrigger>
            <TabsTrigger value="matches">Pool Matches</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="knockout">Knockout</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="rating-export">Rating Export</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniStat label="Registered" value={`${tournament.registeredPlayerIds.length}/${tournament.maxPlayers}`} />
            <MiniStat label="Entry Fee" value={formatCurrency(tournament.entryFee)} />
            <MiniStat label="Format" value={tournament.format.replace("_", " ")} />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Registration fill</span>
              <span className="font-medium text-foreground">{registrationPct}%</span>
            </div>
            <Progress value={registrationPct} className="mt-2" />
          </div>
          <p className="text-sm text-muted-foreground">{tournament.description}</p>
        </TabsContent>

        <TabsContent value="players" className="mt-4">
          {registeredPlayers.length === 0 ? (
            <EmptyState title="No players registered" description="Players will appear here once registration opens." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead>Registration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredPlayers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.clubName ?? "Unaffiliated"}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.rating}</TableCell>
                      <TableCell className="text-muted-foreground">Registered</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="seeding" className="mt-4">
          {seeded.length === 0 ? (
            <EmptyState title="No players to seed" description="Seeding becomes available once players are registered." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Seed</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seeded.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="tabular-nums text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.clubName ?? "Unaffiliated"}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.rating}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Automatic seeding by current rating. Manual override is not available in this phase.</p>
        </TabsContent>

        <TabsContent value="pools" className="mt-4">
          {pools.length === 0 ? (
            <EmptyState title="Pools not generated yet" description="Generate pools once seeding is confirmed." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pools.map((pool) => (
                <div key={pool.name} className="rounded-lg border border-border bg-card p-4">
                  <p className="font-heading text-sm font-semibold text-foreground">{pool.name}</p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {pool.players.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{p.name}</span>
                        <span className="tabular-nums text-muted-foreground">{p.rating}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          {tournamentMatches.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Round</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournamentMatches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground">{m.round}</TableCell>
                      <TableCell className="text-foreground">
                        {getPlayer(m.playerAId)?.name} vs {getPlayer(m.playerBId)?.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">Table {m.table}</TableCell>
                      <TableCell className="text-muted-foreground">{m.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="Live match scoring is coming in a future phase"
              description="Pool round-robin matches will be scheduled here. Full live scoring, table assignment and referee tools are part of the upcoming Match Management system."
            />
          )}
        </TabsContent>

        <TabsContent value="standings" className="mt-4">
          {pools.length === 0 ? (
            <EmptyState title="No standings yet" description="Standings appear once pool matches have results." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pools.map((pool) => {
                const poolKey = pool.name.toLowerCase().replace("pool ", "pool-");
                const standings = poolStandings[poolKey];
                return (
                  <div key={pool.name} className="rounded-lg border border-border bg-card p-4">
                    <p className="font-heading text-sm font-semibold text-foreground">{pool.name}</p>
                    {standings ? (
                      <div className="mt-2 flex flex-col gap-1.5 text-sm">
                        {standings.map((s) => (
                          <div key={s.playerId} className="flex items-center justify-between">
                            <span className="text-foreground">{getPlayer(s.playerId)?.name}</span>
                            <span className="tabular-nums text-muted-foreground">{s.wins}W–{s.losses}L · {s.points}pts</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">Pending pool match results.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="knockout" className="mt-4">
          {bracketRounds.length === 0 ? (
            <EmptyState title="Knockout bracket not generated yet" description="Generate the knockout stage once pools are complete." />
          ) : (
            <div className="rounded-lg border border-border bg-card p-4">
              <KnockoutBracket rounds={bracketRounds} champion={champion ? getPlayer(champion)?.name : undefined} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          {status === "COMPLETED" && champion ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <ResultCard label="Champion" name={getPlayer(champion)?.name} highlight />
              <ResultCard label="Runner-up" name={runnerUp ? getPlayer(runnerUp)?.name : undefined} />
            </div>
          ) : status === "KNOCKOUT" && qualifiers.length >= 2 ? (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Declare the final result once the knockout stage concludes. Live match scoring will automate this in a future phase.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Champion</label>
                  <Select value={pendingChampion} onValueChange={(v) => setPendingChampion(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Select champion" /></SelectTrigger>
                    <SelectContent>
                      {qualifiers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Runner-up</label>
                  <Select value={pendingRunnerUp} onValueChange={(v) => setPendingRunnerUp(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Select runner-up" /></SelectTrigger>
                    <SelectContent>
                      {qualifiers.filter((p) => p.id !== pendingChampion).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="self-start" onClick={declareResult}>Complete Tournament</Button>
            </div>
          ) : (
            <EmptyState title="No results yet" description="Results become available once the knockout stage is underway." />
          )}
        </TabsContent>

        <TabsContent value="rating-export" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-4">
            {status !== "COMPLETED" ? (
              <p className="text-sm text-muted-foreground">Rating export becomes available once the tournament is completed.</p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Export status</p>
                  <div className="mt-1">
                    <RatingExportStatusBadge status={exportStatus ?? "PENDING"} />
                  </div>
                </div>
                {exportStatus !== "SENT" && (
                  <Button onClick={exportToRatingEngine}>Send to Rating Engine</Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="font-heading text-xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ResultCard({ label, name, highlight }: { label: string; name?: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "flex flex-col items-center gap-1 rounded-lg border border-champion/40 bg-champion/10 p-5 text-center"
          : "flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-5 text-center"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold text-foreground">{name ?? "—"}</p>
    </div>
  );
}
