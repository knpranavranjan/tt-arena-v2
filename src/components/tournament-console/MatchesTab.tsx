"use client";

import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { MatchesProvider } from "@/lib/matches-store";
import Workspace from "@/components/tournament-console/Workspace";
import type { Tournament } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

/**
 * The "Matches" tab body for every portal's tournament-manage view. The live
 * workspace only opens once an admin has approved the event; until then it
 * shows the pending-approval gate.
 */
export function MatchesTab({ tournament }: { tournament: Tournament }) {
  const { overrides, isLoading } = useTournamentStatus();
  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-[8px] border border-white/10 bg-white/[0.02]" />;
  }

  const status = effectiveStatus(tournament, overrides);

  if (status === "DRAFT") {
    return (
      <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
        <p className="text-sm font-semibold text-[#e2e2e8]" style={display}>
          Pending admin approval
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#8b8b93]" style={mono}>
          The live tournament workspace — players, pools, match scoring and the knockout draw —
          unlocks here as soon as an admin approves this event.
        </p>
      </div>
    );
  }

  return (
    <MatchesProvider tournament={tournament}>
      <Workspace />
    </MatchesProvider>
  );
}
