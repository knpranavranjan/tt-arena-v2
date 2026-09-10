import {
  createPlayer,
  getCreatedPlayer,
  listPlayers,
  updatePlayer,
} from "@/lib/db/queries/players";
import type { PlayerProfileInput } from "@/lib/player-profile";

/** GET /api/players — every player profile created by a real sign-up. */
export async function GET() {
  return Response.json(await listPlayers());
}

/**
 * POST /api/players — create a profile for an existing account.
 * Registration already does this inline; this covers the localStorage→DB
 * hand-off and any account that reaches the portal without a row.
 */
export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  if (typeof b?.spinId !== "string" || typeof b?.name !== "string") {
    return Response.json({ error: "spinId and name required" }, { status: 400 });
  }
  const row = await createPlayer({
    spinId: b.spinId,
    name: b.name,
    input: (b.profile ?? undefined) as PlayerProfileInput | undefined,
  });
  return Response.json(row, { status: 201 });
}

/** PATCH /api/players — complete or edit a profile (onboarding, settings). */
export async function PATCH(request: Request) {
  const b = await request.json().catch(() => null);
  if (typeof b?.id !== "string") {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  const existing = await getCreatedPlayer(b.id);
  if (!existing) {
    return Response.json({ error: "player not found" }, { status: 404 });
  }
  const patch = (b.patch ?? {}) as PlayerProfileInput & { name?: string };
  const row = await updatePlayer(b.id, patch);
  return Response.json(row);
}
