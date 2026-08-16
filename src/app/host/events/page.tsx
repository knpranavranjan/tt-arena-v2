"use client";

import { EventCard } from "@/components/cards/event-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { events } from "@/lib/mock-data";

export default function HostEventsPage() {
  if (events.length === 0) {
    return <EmptyState title="No events yet" description="Events you organize will appear here." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => <EventCard key={e.id} event={e} />)}
    </div>
  );
}
