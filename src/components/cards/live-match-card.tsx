import Link from "next/link";
import { LiveDot } from "@/components/motion/live-dot";
import { getPlayer, getTournament } from "@/lib/mock-data";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LiveMatchCard({ match, className }: { match: Match; className?: string }) {
  const playerA = getPlayer(match.playerAId);
  const playerB = getPlayer(match.playerBId);
  const tournament = getTournament(match.tournamentId);
  const aLeads = match.scoreA > match.scoreB;
  const bLeads = match.scoreB > match.scoreA;

  return (
    <Link
      href={`/tournaments/${match.tournamentId}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-live/30 bg-card p-4 transition-colors hover:border-live/50",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-live">
          <LiveDot /> Live · Table {match.table}
        </span>
        <span className="text-xs text-muted-foreground">{match.round}</span>
      </div>
      <div className="flex flex-col gap-1.5 font-heading">
        <div className="flex items-center justify-between">
          <span className={cn("truncate text-base", aLeads ? "font-semibold text-foreground" : "text-muted-foreground")}>
            {playerA?.name ?? "TBD"}
          </span>
          <span className={cn("tabular-nums text-lg", aLeads ? "text-primary" : "text-muted-foreground")}>
            {match.scoreA}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn("truncate text-base", bLeads ? "font-semibold text-foreground" : "text-muted-foreground")}>
            {playerB?.name ?? "TBD"}
          </span>
          <span className={cn("tabular-nums text-lg", bLeads ? "text-primary" : "text-muted-foreground")}>
            {match.scoreB}
          </span>
        </div>
      </div>
      <p className="truncate text-xs text-muted-foreground group-hover:text-foreground">{tournament?.name}</p>
    </Link>
  );
}
