import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";
import { getPlayer, tournaments } from "@/lib/mock-data";
import { formatDate, initials } from "@/lib/format";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const player = getPlayer(playerId);
  if (!player) notFound();

  const history = tournaments.filter((t) => t.registeredPlayerIds.includes(player.id));
  const winPct = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  const resultFor = (tournamentId: string) => {
    const t = tournaments.find((x) => x.id === tournamentId);
    if (!t || t.status !== "COMPLETED") return "—";
    if (t.champion === player.id) return "Champion";
    if (t.runnerUp === player.id) return "Runner-up";
    if (t.semiFinalists?.includes(player.id)) return "Semifinalist";
    return "Participated";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 border border-border">
          <AvatarFallback className="bg-secondary font-heading text-2xl text-secondary-foreground">
            {initials(player.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-semibold text-foreground">{player.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {player.clubId ? (
              <Link href={`/clubs/${player.clubId}`} className="flex items-center gap-1.5 hover:text-primary">
                <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                {player.clubName}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                Unaffiliated
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              {player.state}
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" strokeWidth={1.5} />
              {player.category} · {player.gender === "MALE" ? "Men's" : "Women's"}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-accent px-5 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-foreground/70">Rating</p>
          <p className="font-heading text-3xl font-semibold tabular-nums text-accent-foreground">{player.rating}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatBlock label="Matches Played" value={player.wins + player.losses} />
        <StatBlock label="Wins" value={player.wins} />
        <StatBlock label="Losses" value={player.losses} />
        <StatBlock label="Win Rate" value={`${winPct}%`} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent Form</p>
        <div className="mt-2 flex gap-1.5">
          {player.recentForm.map((r, i) => (
            <span
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                r === "W" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Player Information</h2>
        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          <InfoRow label="Date of Birth" value={formatDate(player.dateOfBirth)} />
          <InfoRow label="Club" value={player.clubName ?? "Unaffiliated"} />
          <InfoRow label="State" value={player.state} />
          <InfoRow label="Category" value={player.category} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Tournament History</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={<Calendar />}
            title="No tournament history yet"
            description="This player hasn't participated in any tournaments recorded on the platform."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/tournaments/${t.id}`} className="font-medium text-foreground hover:text-primary">
                        {t.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                    <TableCell className="text-muted-foreground">{t.format.replace("_", " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{resultFor(t.id)}</TableCell>
                    <TableCell className="text-muted-foreground">{t.status.replace("_", " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}
