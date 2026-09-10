import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { registrations } from "@/lib/db/schema";

type Answer = { question: string; answer: string };

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toApi(r: typeof registrations.$inferSelect) {
  return {
    id: r.id,
    tournamentId: r.tournamentId,
    playerId: r.playerId,
    playerName: r.playerName,
    status: r.status,
    createdAt: r.createdAt,
    ...(r.answers && r.answers.length ? { answers: r.answers } : {}),
  };
}

export async function listRegistrations() {
  const rows = await getDb().select().from(registrations);
  return rows.map(toApi);
}

export async function createRegistration(
  tournamentId: string,
  playerId: string,
  playerName: string,
  entryFee: number,
  answers?: Answer[],
) {
  const db = getDb();
  const [dup] = await db
    .select()
    .from(registrations)
    .where(and(eq(registrations.tournamentId, tournamentId), eq(registrations.playerId, playerId)));
  if (dup) return toApi(dup);

  const row = {
    id: makeId(),
    tournamentId,
    playerId,
    playerName,
    status: entryFee > 0 ? "PENDING_PAYMENT" : "REGISTERED",
    answers: answers && answers.length ? answers : null,
    createdAt: new Date().toISOString(),
  };
  await db.insert(registrations).values(row).onConflictDoNothing();
  return toApi(row as typeof registrations.$inferSelect);
}

export async function confirmRegistrationPayment(tournamentId: string, playerId: string) {
  await getDb()
    .update(registrations)
    .set({ status: "REGISTERED" })
    .where(and(eq(registrations.tournamentId, tournamentId), eq(registrations.playerId, playerId)));
}
