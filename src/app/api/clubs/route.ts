import {
  createClub,
  getCreatedClub,
  listClubs,
  updateClub,
} from "@/lib/db/queries/clubs";
import type { ClubProfileInput } from "@/lib/club-profile";

/** GET /api/clubs — every club profile created by a real CLUB sign-up. */
export async function GET() {
  return Response.json(await listClubs());
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  if (typeof b?.spinId !== "string" || typeof b?.name !== "string") {
    return Response.json({ error: "spinId and name required" }, { status: 400 });
  }
  const row = await createClub({
    spinId: b.spinId,
    name: b.name,
    input: (b.profile ?? undefined) as ClubProfileInput | undefined,
  });
  return Response.json(row, { status: 201 });
}

export async function PATCH(request: Request) {
  const b = await request.json().catch(() => null);
  if (typeof b?.id !== "string") {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  const existing = await getCreatedClub(b.id);
  if (!existing) {
    return Response.json({ error: "club not found" }, { status: 404 });
  }
  const row = await updateClub(b.id, (b.patch ?? {}) as ClubProfileInput & { name?: string });
  return Response.json(row);
}
