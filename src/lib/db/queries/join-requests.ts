import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { joinRequests } from "@/lib/db/schema";

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listJoinRequests() {
  return getDb().select().from(joinRequests);
}

export async function createJoinRequest(clubId: string, playerId: string, playerName: string) {
  const db = getDb();
  const dup = await db
    .select()
    .from(joinRequests)
    .where(
      and(
        eq(joinRequests.clubId, clubId),
        eq(joinRequests.playerId, playerId),
        eq(joinRequests.status, "PENDING"),
      ),
    );
  if (dup.length) return dup[0];

  const row = {
    id: makeId(),
    clubId,
    playerId,
    playerName,
    status: "PENDING" as const,
    createdAt: new Date().toISOString(),
  };
  await db.insert(joinRequests).values(row);
  return row;
}

export async function setJoinRequestStatus(id: string, status: string) {
  await getDb().update(joinRequests).set({ status }).where(eq(joinRequests.id, id));
}
