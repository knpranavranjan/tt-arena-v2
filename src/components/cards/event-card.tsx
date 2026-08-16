import Link from "next/link";
import { Calendar, MapPin, User } from "lucide-react";
import { EventStatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import type { TTEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EventCard({ event, className }: { event: TTEvent; className?: string }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-base font-medium text-foreground group-hover:text-primary">
          {event.name}
        </p>
        <EventStatusBadge status={event.status} className="shrink-0" />
      </div>
      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {formatDate(event.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {event.location}
        </span>
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {event.organizer}
        </span>
      </div>
    </Link>
  );
}
