import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { membershipFees, memberships } from "@/lib/db/schema";
import { seedMembershipFees } from "@/lib/db/seed-data";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

type MembershipRole = "PLAYER" | "CLUB";

export async function getMembership() {
  const db = getDb();
  const recs = await db.select().from(memberships);
  const [feeRow] = await db
    .select()
    .from(membershipFees)
    .where(eq(membershipFees.id, "default"));
  return {
    records: recs.map((r) => ({
      userId: r.userId,
      role: r.role as MembershipRole,
      expiresAt: r.expiresAt,
    })),
    fees: {
      PLAYER: feeRow?.playerFee ?? seedMembershipFees.playerFee,
      CLUB: feeRow?.clubFee ?? seedMembershipFees.clubFee,
    },
  };
}

export async function activateMembership(userId: string, role: MembershipRole) {
  const expiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();
  await getDb()
    .insert(memberships)
    .values({ userId, role, expiresAt })
    .onConflictDoUpdate({ target: memberships.userId, set: { role, expiresAt } });
  return expiresAt;
}

export async function setMembershipFee(role: MembershipRole, amount: number) {
  await getDb()
    .update(membershipFees)
    .set(role === "PLAYER" ? { playerFee: amount } : { clubFee: amount })
    .where(eq(membershipFees.id, "default"));
}
