import { applyRatingChanges, getRatingsState } from "@/lib/db/queries/player-ratings";

export async function GET() {
  return Response.json(await getRatingsState());
}

/**
 * POST { key, changes: [{ playerId, newRating, entry }] }
 *
 * The rating engine runs on the client (it's deterministic); this only
 * persists the computed result. Idempotent on `key`.
 */
export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  if (typeof b?.key !== "string" || !Array.isArray(b?.changes)) {
    return Response.json({ error: "key and changes[] required" }, { status: 400 });
  }
  for (const c of b.changes) {
    if (typeof c?.playerId !== "string" || typeof c?.newRating !== "number" || !c?.entry) {
      return Response.json({ error: "each change needs playerId, newRating, entry" }, { status: 400 });
    }
  }
  const result = await applyRatingChanges(b.key, b.changes);
  return Response.json(result);
}
