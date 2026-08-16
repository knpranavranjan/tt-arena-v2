"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { TournamentWorkspace } from "@/components/tournament/tournament-workspace";
import { getTournament } from "@/lib/mock-data";

export default function HostTournamentWorkspacePage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const tournament = getTournament(tournamentId);
  if (!tournament) notFound();

  return <TournamentWorkspace tournament={tournament} />;
}
