"use client";

import { useParams } from "next/navigation";
import { MatchesTab } from "@/components/tournament-console/MatchesTab";
import { getTournament } from "@/lib/mock-data";
import { useAllTournaments } from "@/lib/hosted-tournaments";

export default function ManageHostTournamentMatchesPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;
  const allTournaments = useAllTournaments();
  const tournament = tournamentId
    ? allTournaments.find((t) => t.id === tournamentId) ?? getTournament(tournamentId)
    : undefined;
  if (!tournament) return null;

  return <MatchesTab tournament={tournament} />;
}
