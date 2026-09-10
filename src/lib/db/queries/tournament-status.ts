import { getDb } from "@/lib/db/client";
import { tournamentStatusOverrides } from "@/lib/db/schema";

export async function listStatusOverrides(): Promise<Record<string, string>> {
  const rows = await getDb().select().from(tournamentStatusOverrides);
  return Object.fromEntries(rows.map((r) => [r.tournamentId, r.status]));
}

export async function setStatusOverride(tournamentId: string, status: string) {
  await getDb()
    .insert(tournamentStatusOverrides)
    .values({ tournamentId, status, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: tournamentStatusOverrides.tournamentId,
      set: { status, updatedAt: new Date() },
    });
}
