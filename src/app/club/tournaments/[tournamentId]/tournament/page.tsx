"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EventEditForm } from "@/components/tournament/event-edit-form";
import { useAuth } from "@/lib/auth";
import { ownsTournament } from "@/lib/tournament-owner";
import { useAllEvents, useAllTournaments, useHostedTournaments } from "@/lib/hosted-tournaments";
import { effectiveStatus, isLive, useTournamentStatus } from "@/lib/tournament-status";
import { applyTournamentEdit, useTournamentEdits } from "@/lib/tournament-edits";

const mono = { fontFamily: "var(--font-home-mono)" };

export default function ManageClubTournamentEditPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;

  const { user } = useAuth();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { isLoading } = useHostedTournaments();
  const { overrides } = useTournamentStatus();
  const { tournamentEdit } = useTournamentEdits();

  const tournament = tournamentId ? allTournaments.find((t) => t.id === tournamentId) : undefined;
  const event = allEvents.find((e) => e.id === tournament?.eventId);
  // Every category of this event — edits here fan out to all of them.
  const categories = useMemo(
    () =>
      tournament
        ? allTournaments
            .filter((t) => t.eventId === tournament.eventId)
            .map((t) => applyTournamentEdit(t, tournamentEdit(t.id)))
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [tournament, allTournaments, tournamentEdit],
  );

  if (isLoading) {
    return <div className="h-96 w-full animate-pulse rounded-[8px] bg-white/5" />;
  }
  if (!tournament || categories.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
        <p className="text-sm font-semibold text-[#e2e2e8]">Tournament not found</p>
      </div>
    );
  }
  if (!ownsTournament(tournament, user)) return null;

  const anyLive = categories.some((c) => isLive(effectiveStatus(c, overrides)));
  if (!anyLive) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-sm font-semibold text-[#e2e2e8]">Editing opens once the tournament is live</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#8b8b93]">
          While it&apos;s still a draft awaiting approval, change the details by resubmitting the host form.
          Once an admin approves it, this tab lets you edit everything players see.
        </p>
        <Link
          href={`/club/tournaments/${tournament.id}`}
          className="mt-4 inline-flex items-center rounded-[2px] border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5"
          style={mono}
        >
          Back to Overview
        </Link>
      </div>
    );
  }

  return (
    <EventEditForm
      key={tournament.eventId}
      event={event}
      categories={categories}
      backHref={`/club/tournaments/${tournament.id}`}
    />
  );
}
