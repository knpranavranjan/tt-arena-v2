"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, User } from "lucide-react";
import { EventStatusBadge } from "@/components/ui/status-badge";
import { TournamentCard } from "@/components/cards/tournament-card";
import { ClubCard } from "@/components/cards/club-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { TieBreakRules } from "@/components/tournaments/tie-break-rules";
import { getClub } from "@/lib/mock-data";
import { useAllEvents, useAllTournaments, useHostedTournaments } from "@/lib/hosted-tournaments";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { formatDate } from "@/lib/format";

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const allEvents = useAllEvents();
  const allTournaments = useAllTournaments();
  const { isLoading } = useHostedTournaments();
  const { overrides } = useTournamentStatus();

  const event = allEvents.find((e) => e.id === eventId);

  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!event) notFound();

  const eventTournaments = allTournaments.filter((t) => event.tournamentIds.includes(t.id));
  const eventClubs = event.participatingClubIds.map((id) => getClub(id)).filter(Boolean);
  const openCategory = eventTournaments.find(
    (t) => effectiveStatus(t, overrides) === "REGISTRATION_OPEN",
  );
  const poster = event.posterUrl ?? eventTournaments.find((t) => t.posterUrl)?.posterUrl;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {poster && (
            <div className="aspect-[4/5] w-40 shrink-0 overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster} alt={`${event.name} poster`} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <EventStatusBadge status={event.status} />
                <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">{event.name}</h1>
              </div>
              {openCategory && (
                <Button render={<Link href={`/tournaments/${openCategory.id}`} />}>Register Now</Button>
              )}
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" strokeWidth={1.5} /> {formatDate(event.date)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" strokeWidth={1.5} /> {event.venue}, {event.location}</span>
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" strokeWidth={1.5} /> {event.organizer}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Tournament Categories</h2>
        {eventTournaments.length === 0 ? (
          <EmptyState title="No tournaments yet" description="Tournament categories for this event haven't been published." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventTournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Tournament Rules</h2>
        <TieBreakRules order={eventTournaments[0]?.tieBreakOrder} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Participating Clubs</h2>
        {eventClubs.length === 0 ? (
          <EmptyState title="No clubs listed" description="No clubs have been associated with this event yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventClubs.map((club) => (
              <ClubCard
                key={club!.id}
                club={club!}
                playerCount={club!.playerIds.length}
                upcomingEvents={allEvents.filter((e) => e.participatingClubIds.includes(club!.id) && e.status !== "COMPLETED").length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
