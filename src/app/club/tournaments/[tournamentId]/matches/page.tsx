"use client";

import { useParams } from "next/navigation";
import { MatchesTab } from "@/components/tournament-console/MatchesTab";
import { getTournament } from "@/lib/mock-data";

export default function ManageClubTournamentMatchesPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;
  const tournament = tournamentId ? getTournament(tournamentId) : undefined;
  if (!tournament) return null;

  return <MatchesTab tournament={tournament} />;
}
