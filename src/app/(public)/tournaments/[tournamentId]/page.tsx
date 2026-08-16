import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Trophy, User, Users } from "lucide-react";
import { TournamentStatusBadge } from "@/components/ui/status-badge";
import { TournamentProgress } from "@/components/tournament/tournament-progress";
import { KnockoutBracket, type BracketRoundData } from "@/components/tournament/knockout-bracket";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  getPlayer,
  getTournament,
  getTournamentPlayers,
  matches,
  poolStandings,
  pools,
} from "@/lib/mock-data";
import { formatCurrency, formatDate, initials } from "@/lib/format";

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  if (!tournament) notFound();

  const registeredPlayers = getTournamentPlayers(tournament);
  const tournamentPools = pools.filter((p) => p.tournamentId === tournament.id);
  const showPools = ["POOLS", "KNOCKOUT", "COMPLETED"].includes(tournament.status) && tournamentPools.length > 0;
  const tournamentMatches = matches.filter((m) => m.tournamentId === tournament.id);
  const showKnockout = ["KNOCKOUT", "COMPLETED"].includes(tournament.status);

  const rounds: BracketRoundData[] = [];
  if (tournament.status === "KNOCKOUT" && tournamentMatches.length > 0) {
    rounds.push({
      name: "Semifinal",
      matches: tournamentMatches.map((m) => ({
        id: m.id,
        playerA: { name: getPlayer(m.playerAId)?.name ?? "TBD" },
        playerB: { name: getPlayer(m.playerBId)?.name ?? "TBD" },
        scoreA: m.status === "SCHEDULED" ? undefined : m.scoreA,
        scoreB: m.status === "SCHEDULED" ? undefined : m.scoreB,
        winner: m.status === "COMPLETED" ? (m.scoreA > m.scoreB ? "A" : "B") : undefined,
        isLive: m.status === "LIVE",
      })),
    });
  }
  if (tournament.status === "COMPLETED" && tournament.champion && tournament.runnerUp) {
    rounds.push({
      name: "Final",
      matches: [
        {
          id: "final",
          playerA: { name: getPlayer(tournament.champion)?.name ?? "—" },
          playerB: { name: getPlayer(tournament.runnerUp)?.name ?? "—" },
          winner: "A",
        },
      ],
    });
  }

  const registrationPct = Math.round((tournament.registeredPlayerIds.length / tournament.maxPlayers) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <TournamentStatusBadge status={tournament.status} />
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">{tournament.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{tournament.description}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" strokeWidth={1.5} /> {formatDate(tournament.date)}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" strokeWidth={1.5} /> {tournament.venue}</span>
          <span className="flex items-center gap-1.5"><User className="h-4 w-4" strokeWidth={1.5} /> {tournament.organizer}</span>
          <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4" strokeWidth={1.5} /> {tournament.category} · {tournament.format.replace("_", " ")}</span>
        </div>
        <div className="mt-6 overflow-x-auto">
          <TournamentProgress status={tournament.status} className="min-w-[560px]" />
        </div>
      </div>

      {/* Registration */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Registration</h2>
        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {tournament.registeredPlayerIds.length} / {tournament.maxPlayers} players registered
              </span>
              <span className="font-medium text-foreground">{registrationPct}%</span>
            </div>
            <Progress value={registrationPct} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Registration deadline: {formatDate(tournament.registrationDeadline)}
            </p>
          </div>
          <div className="flex items-center justify-center rounded-md border border-border bg-secondary/40 px-4 py-3 text-center sm:justify-self-end">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Entry Fee</p>
              <p className="font-heading text-lg font-semibold text-foreground">{formatCurrency(tournament.entryFee)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Players */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Players</h2>
        {registeredPlayers.length === 0 ? (
          <EmptyState icon={<Users />} title="No players registered yet" description="Registered players will appear here once they sign up." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registeredPlayers
                  .sort((a, b) => b.rating - a.rating)
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/players/${p.id}`} className="flex items-center gap-2 font-medium text-foreground hover:text-primary">
                          <Avatar className="h-7 w-7 border border-border">
                            <AvatarFallback className="bg-secondary text-xs">{initials(p.name)}</AvatarFallback>
                          </Avatar>
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.clubName ?? "Unaffiliated"}</TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">{p.rating}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Pools */}
      {showPools && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Pools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournamentPools.map((pool) => (
              <div key={pool.id} className="rounded-lg border border-border bg-card p-4">
                <p className="font-heading text-sm font-semibold text-foreground">{pool.name}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {pool.playerIds.map((pid) => {
                    const p = getPlayer(pid);
                    const standing = poolStandings[pool.id]?.find((s) => s.playerId === pid);
                    if (!p) return null;
                    return (
                      <div key={pid} className="flex items-center justify-between text-sm">
                        <Link href={`/players/${p.id}`} className="text-foreground hover:text-primary">
                          {p.name}
                        </Link>
                        {standing ? (
                          <span className="tabular-nums text-muted-foreground">
                            {standing.wins}W–{standing.losses}L · {standing.points}pts
                            {standing.qualified && <span className="ml-1.5 text-success">✓</span>}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Knockout */}
      {showKnockout && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Knockout</h2>
          {rounds.length === 0 ? (
            <EmptyState title="Knockout bracket not generated yet" description="The bracket will appear once the pool stage is complete." />
          ) : (
            <div className="rounded-lg border border-border bg-card p-4">
              <KnockoutBracket rounds={rounds} champion={tournament.status === "COMPLETED" ? getPlayer(tournament.champion!)?.name : undefined} />
            </div>
          )}
        </section>
      )}

      {/* Champion */}
      {tournament.status === "COMPLETED" && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Champion</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <ResultCard label="Champion" name={getPlayer(tournament.champion!)?.name} highlight />
            <ResultCard label="Runner-up" name={getPlayer(tournament.runnerUp!)?.name} />
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Semifinalists</p>
              <div className="mt-2 flex flex-col gap-1">
                {tournament.semiFinalists?.map((id) => (
                  <span key={id} className="text-sm text-foreground">{getPlayer(id)?.name}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
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
