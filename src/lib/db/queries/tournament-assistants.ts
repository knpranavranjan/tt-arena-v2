import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { tournamentAssistants } from "@/lib/db/schema";

type Grant = {
  uniqueId: string;
  name: string;
  role: string;
  personId?: string;
  addedAt: string;
};

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `asg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listAssistants(): Promise<Record<string, Grant[]>> {
  const rows = await getDb()
    .select()
    .from(tournamentAssistants)
    .orderBy(tournamentAssistants.addedAt);
  const out: Record<string, Grant[]> = {};
  for (const r of rows) {
    (out[r.tournamentId] ??= []).push({
      uniqueId: r.uniqueId,
      name: r.name,
      role: r.role,
      personId: r.personId ?? undefined,
      addedAt: r.addedAt,
    });
  }
  return out;
}

export async function grantAssistant(
  tournamentId: string,
  person: { uniqueId: string; name: string; role: string; personId?: string },
) {
  await getDb()
    .insert(tournamentAssistants)
    .values({
      id: makeId(),
      tournamentId,
      uniqueId: person.uniqueId.trim(),
      name: person.name,
      role: person.role,
      personId: person.personId ?? null,
      addedAt: new Date().toISOString(),
    })
    .onConflictDoNothing();
}

export async function revokeAssistant(tournamentId: string, uniqueId: string) {
  await getDb()
    .delete(tournamentAssistants)
    .where(
      and(
        eq(tournamentAssistants.tournamentId, tournamentId),
        sql`lower(${tournamentAssistants.uniqueId}) = lower(${uniqueId})`,
      ),
    );
}
