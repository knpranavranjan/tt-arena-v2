"use client";

import { EventCard } from "@/components/cards/event-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { useCurrentClub } from "@/lib/session-data";
import { events } from "@/lib/mock-data";

export default function ClubEventsPage() {
  const club = useCurrentClub();
  if (!club) return null;

  const clubEvents = events.filter((e) => e.participatingClubIds.includes(club.id));

  if (clubEvents.length === 0) {
    return <EmptyState title="No events yet" description="Events your club participates in will appear here." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clubEvents.map((e) => <EventCard key={e.id} event={e} />)}
    </div>
  );
}
