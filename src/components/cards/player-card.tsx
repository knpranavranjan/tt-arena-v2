import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlayerCard({ player, className }: { player: Player; className?: string }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40",
        className,
      )}
    >
      <Avatar className="h-11 w-11 border border-border">
        <AvatarFallback className="bg-secondary font-heading text-secondary-foreground">
          {initials(player.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-base font-medium text-foreground group-hover:text-primary">
          {player.name}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {player.clubName ?? "Unaffiliated"} · {player.state}
        </p>
      </div>
      <div className="text-right">
        <p className="font-heading text-lg font-semibold tabular-nums text-foreground">{player.rating}</p>
        <p className="text-xs text-muted-foreground">{player.category}</p>
      </div>
    </Link>
  );
}
