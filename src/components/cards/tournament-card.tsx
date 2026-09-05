import Link from "next/link";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { TournamentStatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import type { Tournament } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TournamentCard({ tournament, className }: { tournament: Tournament; className?: string }) {
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-base font-medium text-foreground group-hover:text-primary">
          {tournament.name}
        </p>
        <TournamentStatusBadge status={tournament.status} className="shrink-0" />
      </div>
      <div className="grid grid-cols-2 gap-y-1.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {formatDate(tournament.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span className="truncate">{tournament.venue}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {tournament.category}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {tournament.registeredPlayerIds.length} registered
        </span>
      </div>
    </Link>
  );
}
