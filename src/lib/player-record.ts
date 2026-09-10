/**
 * A player's career record — matches played / won / lost / win rate — derived
 * live from a seed baseline plus every published tournament result.
 *
 * Baseline: seed roster players carry a pre-baked `wins`/`losses` (their seed
 * match history); real sign-ups start at 0. Every `RatingChangeEntry` the
 * console writes on "Publish results" adds its `wins`/`losses` on top.
 *
 * No React imports — safe from anywhere.
 */
import type { RatingChangeEntry } from "@/lib/player-ratings";

export interface PlayerRecord {
  played: number;
  wins: number;
  losses: number;
  /** Whole-percent win rate; 0 when the player has no matches. */
  winRate: number;
}

export function careerRecord(
  base: { wins?: number; losses?: number } | undefined | null,
  history: readonly RatingChangeEntry[],
): PlayerRecord {
  const wins = (base?.wins ?? 0) + history.reduce((s, e) => s + (e.wins ?? 0), 0);
  const losses = (base?.losses ?? 0) + history.reduce((s, e) => s + (e.losses ?? 0), 0);
  const played = wins + losses;
  return { played, wins, losses, winRate: played ? Math.round((wins / played) * 100) : 0 };
}
