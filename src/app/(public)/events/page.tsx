"use client";

import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCard } from "@/components/cards/event-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { events } from "@/lib/mock-data";
import type { EventStatus } from "@/lib/types";

export default function EventsPage() {
  const [status, setStatus] = useState<EventStatus | "all">("all");

  const filtered = useMemo(
    () => events.filter((e) => status === "all" || e.status === status),
    [status],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live, upcoming and completed table tennis events across the platform.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(v) => setStatus(v as EventStatus | "all")}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="LIVE">Live</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Calendar />} title="No events found" description="Try a different status filter." />
      ) : (
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <RevealItem key={event.id}>
              <EventCard event={event} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}
