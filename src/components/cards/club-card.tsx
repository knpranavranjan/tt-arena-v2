import Link from "next/link";
import { Building2, MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Club } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ClubCard({
  club,
  playerCount,
  upcomingEvents,
  className,
}: {
  club: Club;
  playerCount: number;
  upcomingEvents: number;
  className?: string;
}) {
  return (
    <Link
      href={`/clubs/${club.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11 border border-border">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <Building2 className="h-5 w-5" strokeWidth={1.5} />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-medium text-foreground group-hover:text-primary">
            {club.name}
          </p>
          <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {club.location}, {club.state}
          </p>
        </div>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{club.description}</p>
      <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
          {playerCount} players
        </span>
        <span>{upcomingEvents} upcoming events</span>
      </div>
    </Link>
  );
}
