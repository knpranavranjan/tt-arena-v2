"use client";

import { useMemo } from "react";
import { getPlayer, matches, tournaments as seedTournaments } from "@/lib/mock-data";
import { usePlayerRatings } from "@/lib/player-ratings";
import { calculateFullTournamentRating } from "@/lib/rating/fullRatingEngine";
import type { Player } from "@/lib/types";

/**
 * A player's rating going into a tournament (category) and coming out of it,
 * so the tournament history can show progress tournament by tournament.
 *
 * - Published results (`rating_change_log`, written on "Publish results")
 *   carry the real before/after ratings — used as-is.
 * - The seed catalogue only stores each player's *current* seed rating. Its
 *   tournaments are replayed through the same rating engine to get each
 *   tournament's gain/loss, then chained backwards from that seed rating, so
 *   every row adds up to the rating the player actually has.
 */
export interface TournamentRatingChange {
  before: number;
  after: number;
  delta: number;
  /** Chronological position — higher is later. */
  seq: number;
}

// tournamentId → playerId → rating delta, for the static seed matches. Computed once.
let seedDeltaCache: Map<string, Map<string, number>> | null = null;

function seedDeltas(): Map<string, Map<string, number>> {
  if (seedDeltaCache) return seedDeltaCache;
  const byTournament = new Map<string, typeof matches>();
  for (const m of matches) {
    if (m.status !== "COMPLETED" || !m.winnerId) continue;
    const list = byTournament.get(m.tournamentId) ?? [];
    list.push(m);
    byTournament.set(m.tournamentId, list);
  }

  seedDeltaCache = new Map();
  for (const [tournamentId, played] of byTournament) {
    const ids = [...new Set(played.flatMap((m) => [m.playerAId, m.playerBId]))];
    const result = calculateFullTournamentRating({
      players: ids.map((id) => ({ id, name: getPlayer(id)?.name ?? id, rating: getPlayer(id)?.rating ?? null })),
      matches: played.map((m) => ({ id: m.id, playerAId: m.playerAId, playerBId: m.playerBId, winnerId: m.winnerId! })),
    });
    const deltas = new Map<string, number>();
    for (const p of result.players) {
      if (p.preTournamentRating !== null && p.finalRating !== null) {
        deltas.set(p.playerId, p.finalRating - p.preTournamentRating);
      }
    }
    seedDeltaCache.set(tournamentId, deltas);
  }
  return seedDeltaCache;
}

/** tournamentId (category) → that tournament's rating change for `player`. */
export function useRatingTimeline(player: Player): Map<string, TournamentRatingChange> {
  const { getHistory, getRating } = usePlayerRatings();

  return useMemo(() => {
    const timeline = new Map<string, TournamentRatingChange>();
    const history = getHistory(player.id);

    // Seed tournaments this player completed matches in, newest first.
    const seedIds = [
      ...new Set(
        matches
          .filter((m) => m.status === "COMPLETED" && (m.playerAId === player.id || m.playerBId === player.id))
          .map((m) => m.tournamentId),
      ),
    ]
      .filter((id) => !history.some((h) => h.tournamentId === id))
      .map((id) => ({ id, date: seedTournaments.find((t) => t.id === id)?.date ?? "" }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // The seed catalogue ends at the rating the first published result started
    // from (or, with none, the player's current rating).
    let after = history[0]?.previousRating ?? (getRating(player.id) || player.rating);
    const deltas = seedDeltas();
    seedIds.forEach(({ id }, i) => {
      const delta = deltas.get(id)?.get(player.id) ?? 0;
      timeline.set(id, { before: after - delta, after, delta, seq: seedIds.length - 1 - i });
      after -= delta;
    });

    history.forEach((h, i) => {
      timeline.set(h.tournamentId, {
        before: h.previousRating,
        after: h.newRating,
        delta: h.delta,
        seq: seedIds.length + i,
      });
    });

    return timeline;
  }, [player.id, player.rating, getHistory, getRating]);
}
