/**
 * Seed / reset the database.
 *
 * `seedDatabase(db)`               — idempotent: ensure the built-in accounts,
 *                                    hosting plans and membership fees exist.
 * `seedDatabase(db, { reset: true })` — wipe every migrated table first, then
 *                                    re-seed. Used by `npm run db:seed` and the
 *                                    dev-only `POST /api/dev/reset` route.
 */
import { sql } from "drizzle-orm";

import type { Db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import { seedAccounts, seedHostingPlans, seedMembershipFees } from "@/lib/db/seed-data";
import { hashPassword } from "@/lib/auth/password";

const ALL_TABLES = [
  t.players,
  t.clubs,
  t.accounts,
  t.events,
  t.tournaments,
  t.tournamentStatusOverrides,
  t.tournamentEdits,
  t.registrations,
  t.tournamentAssistants,
  t.playerRatingOverrides,
  t.ratingChangeLog,
  t.ratingAppliedKeys,
  t.hostingPlans,
  t.memberships,
  t.membershipFees,
  t.joinRequests,
  t.notificationReads,
];

export async function seedDatabase(db: Db, { reset = false }: { reset?: boolean } = {}) {
  if (reset) {
    for (const table of ALL_TABLES) {
      await db.delete(table);
    }
  }

  // Accounts — hash the demo passwords.
  for (const a of seedAccounts) {
    const { hash, salt } = await hashPassword(a.password);
    await db
      .insert(t.accounts)
      .values({
        id: a.id,
        uniqueId: a.uniqueId,
        name: a.name,
        passwordHash: hash,
        passwordSalt: salt,
        role: a.role,
        email: a.email,
        linkedId: a.linkedId,
        seed: true,
      })
      .onConflictDoNothing({ target: t.accounts.id });
  }

  for (const p of seedHostingPlans) {
    await db
      .insert(t.hostingPlans)
      .values(p)
      .onConflictDoUpdate({
        target: t.hostingPlans.id,
        set: { title: p.title, description: p.description, price: p.price },
      });
  }

  await db
    .insert(t.membershipFees)
    .values(seedMembershipFees)
    .onConflictDoUpdate({
      target: t.membershipFees.id,
      set: { playerFee: seedMembershipFees.playerFee, clubFee: seedMembershipFees.clubFee },
    });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(t.accounts);
  return { accounts: count };
}
