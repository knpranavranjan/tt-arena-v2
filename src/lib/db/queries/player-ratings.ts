import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  playerRatingOverrides,
  ratingAppliedKeys,
  ratingChangeLog,
} from "@/lib/db/schema";

type RatingChangeEntry = {
  tournamentId: string;
  tournamentName: string;
  categoryId: string;
  categoryName: string;
  date: string;
  appliedAt: string;
  previousRating: number;
  newRating: number;
  delta: number;
  matchesCounted: number;
};

/** The full `StoredRatings` shape the client store expects. */
export async function getRatingsState() {
  const db = getDb();
  const [ovr, log, keys] = await Promise.all([
    db.select().from(playerRatingOverrides),
    db.select().from(ratingChangeLog),
    db.select().from(ratingAppliedKeys),
  ]);

  const overrides: Record<string, number> = {};
  for (const r of ovr) overrides[r.playerId] = r.rating;

  const history: Record<string, RatingChangeEntry[]> = {};
  for (const r of log) {
    (history[r.playerId] ??= []).push({
      tournamentId: r.tournamentId,
      tournamentName: r.tournamentName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      date: r.date,
      appliedAt: r.appliedAt,
      previousRating: r.previousRating,
      newRating: r.newRating,
      delta: r.delta,
      matchesCounted: r.matchesCounted,
    });
  }
  // Oldest first, matching the store's contract.
  for (const list of Object.values(history)) {
    list.sort((a, b) => a.date.localeCompare(b.date) || a.appliedAt.localeCompare(b.appliedAt));
  }

  return { overrides, history, appliedKeys: keys.map((k) => k.key) };
}

/** Persist a computed set of rating changes for one `${tournamentId}:${categoryId}`. */
export async function applyRatingChanges(
  key: string,
  changes: { playerId: string; newRating: number; entry: RatingChangeEntry }[],
) {
  const db = getDb();
  const [seen] = await db
    .select()
    .from(ratingAppliedKeys)
    .where(eq(ratingAppliedKeys.key, key));
  if (seen) return { applied: false as const, reason: "already applied" };

  for (const c of changes) {
    await db
      .insert(playerRatingOverrides)
      .values({ playerId: c.playerId, rating: c.newRating, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: playerRatingOverrides.playerId,
        set: { rating: c.newRating, updatedAt: new Date() },
      });

    await db.insert(ratingChangeLog).values({
      id: globalThis.crypto?.randomUUID?.() ?? `rcl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerId: c.playerId,
      ...c.entry,
    });
  }

  await db.insert(ratingAppliedKeys).values({ key }).onConflictDoNothing();
  return { applied: true as const };
}
