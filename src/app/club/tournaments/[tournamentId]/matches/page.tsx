"use client";

import { useParams } from "next/navigation";
import { MatchesTab } from "@/components/tournament-console/MatchesTab";
import { useAllTournaments } from "@/lib/hosted-tournaments";

export default function ManageClubTournamentMatchesPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;
  const allTournaments = useAllTournaments();
  const tournament = tournamentId ? allTournaments.find((t) => t.id === tournamentId) : undefined;
  if (!tournament) return null;

  return <MatchesTab tournament={tournament} />;
}
