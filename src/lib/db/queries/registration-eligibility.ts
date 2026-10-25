import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  playerRatingOverrides,
  players,
  ratingChangeLog,
  tournamentEdits,
  tournaments,
} from "@/lib/db/schema";
import { categoryEligibility, type Eligibility } from "@/lib/category-eligibility";
import { getPlayer } from "@/lib/mock-data";
import type { CategoryType } from "@/lib/types";

/**
 * Server-side twin of the checkout's eligibility check, so a registration
 * can't bypass a category's age / rating limit. Reads the category as players
 * see it (stored row + any host edit) and the player's current rating
 * (override → latest published rating → profile → seed) and date of birth.
 * Seed-catalogue categories have no limits, so they always pass.
 */
export async function checkRegistrationEligibility(tournamentId: string, playerId: string): Promise<Eligibility> {
  const db = getDb();
  const [row] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
  if (!row) return { ok: true };

  const [edit] = await db
    .select()
    .from(tournamentEdits)
    .where(and(eq(tournamentEdits.kind, "tournament"), eq(tournamentEdits.targetId, tournamentId)));
  const patch = (edit?.patch ?? {}) as Partial<{
    categoryType: CategoryType;
    ratingLimit: number;
    ageLimit: number;
    date: string;
  }>;
  const category = {
    categoryType: patch.categoryType ?? ((row.categoryType as CategoryType | null) ?? undefined),
    ratingLimit: patch.ratingLimit ?? row.ratingLimit ?? undefined,
    ageLimit: patch.ageLimit ?? row.ageLimit ?? undefined,
    date: patch.date ?? row.date,
  };

  const [override] = await db.select().from(playerRatingOverrides).where(eq(playerRatingOverrides.playerId, playerId));
  const [lastLog] = await db
    .select()
    .from(ratingChangeLog)
    .where(eq(ratingChangeLog.playerId, playerId))
    .orderBy(desc(ratingChangeLog.appliedAt))
    .limit(1);
  const [profile] = await db.select().from(players).where(eq(players.id, playerId));
  const seed = getPlayer(playerId);

  return categoryEligibility(category, {
    rating: override?.rating ?? lastLog?.newRating ?? profile?.rating ?? seed?.rating ?? null,
    dateOfBirth: profile?.dateOfBirth || seed?.dateOfBirth || null,
  });
}
