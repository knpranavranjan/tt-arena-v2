import { notFound } from "next/navigation";
import { Building2, Calendar, MapPin } from "lucide-react";
import { PlayerCard } from "@/components/cards/player-card";
import { EventCard } from "@/components/cards/event-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { getClub, getClubPlayers, events } from "@/lib/mock-data";

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const club = getClub(clubId);
  if (!club) notFound();

  const clubPlayers = getClubPlayers(club.id).sort((a, b) => b.rating - a.rating);
  const clubEvents = events.filter((e) => e.participatingClubIds.includes(club.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground">
          <Building2 className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">{club.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
            {club.location}, {club.state} · Founded {club.founded}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{club.description}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MiniStat label="Players" value={clubPlayers.length} />
        <MiniStat
          label="Upcoming Events"
          value={clubEvents.filter((e) => e.status !== "COMPLETED").length}
        />
        <MiniStat label="Founded" value={club.founded} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Club Players</h2>
        {clubPlayers.length === 0 ? (
          <EmptyState title="No players yet" description="This club hasn't added any players to the platform." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {clubPlayers.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Club Events</h2>
        {clubEvents.length === 0 ? (
          <EmptyState
            icon={<Calendar />}
            title="No events yet"
            description="This club hasn't participated in any events recorded on the platform."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
