import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { tournamentEdits } from "@/lib/db/schema";

type EditsData = {
  tournaments: Record<string, Record<string, unknown>>;
  events: Record<string, Record<string, unknown>>;
};

export async function listTournamentEdits(): Promise<EditsData> {
  const rows = await getDb().select().from(tournamentEdits);
  const out: EditsData = { tournaments: {}, events: {} };
  for (const r of rows) {
    if (r.kind === "tournament") out.tournaments[r.targetId] = r.patch;
    else if (r.kind === "event") out.events[r.targetId] = r.patch;
  }
  return out;
}

/** Shallow-merge `patch` onto whatever is stored for (kind, targetId). */
export async function mergeTournamentEdit(
  kind: "tournament" | "event",
  targetId: string,
  patch: Record<string, unknown>,
) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(tournamentEdits)
    .where(and(eq(tournamentEdits.kind, kind), eq(tournamentEdits.targetId, targetId)));
  const merged = { ...(existing?.patch ?? {}), ...patch };
  await db
    .insert(tournamentEdits)
    .values({ kind, targetId, patch: merged, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [tournamentEdits.kind, tournamentEdits.targetId],
      set: { patch: merged, updatedAt: new Date() },
    });
  return merged;
}
