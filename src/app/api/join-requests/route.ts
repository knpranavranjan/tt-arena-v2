import {
  createJoinRequest,
  listJoinRequests,
  setJoinRequestStatus,
} from "@/lib/db/queries/join-requests";

export async function GET() {
  return Response.json(await listJoinRequests());
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  if (typeof b?.clubId !== "string" || typeof b?.playerId !== "string" || typeof b?.playerName !== "string") {
    return Response.json({ error: "clubId, playerId, playerName required" }, { status: 400 });
  }
  const row = await createJoinRequest(b.clubId, b.playerId, b.playerName);
  return Response.json(row, { status: 201 });
}

export async function PATCH(request: Request) {
  const b = await request.json().catch(() => null);
  const ok = ["PENDING", "ACCEPTED", "DECLINED"].includes(b?.status);
  if (typeof b?.id !== "string" || !ok) {
    return Response.json({ error: "id and status (PENDING|ACCEPTED|DECLINED) required" }, { status: 400 });
  }
  await setJoinRequestStatus(b.id, b.status);
  return Response.json({ ok: true });
}
