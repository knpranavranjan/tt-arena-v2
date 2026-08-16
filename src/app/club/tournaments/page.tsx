"use client";

import { TournamentCard } from "@/components/cards/tournament-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { useCurrentClub } from "@/lib/session-data";
import { getClubPlayers, tournaments } from "@/lib/mock-data";

export default function ClubTournamentsPage() {
  const club = useCurrentClub();
  if (!club) return null;

  const playerIds = new Set(getClubPlayers(club.id).map((p) => p.id));
  const clubTournaments = tournaments.filter((t) => t.registeredPlayerIds.some((id) => playerIds.has(id)));

  if (clubTournaments.length === 0) {
    return <EmptyState title="No tournaments yet" description="Tournaments involving your club's players will appear here." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clubTournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}
    </div>
  );
}
