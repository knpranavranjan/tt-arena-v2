import {
  grantAssistant,
  listAssistants,
  revokeAssistant,
} from "@/lib/db/queries/tournament-assistants";

export async function GET() {
  return Response.json(await listAssistants());
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  const p = b?.person;
  if (
    typeof b?.tournamentId !== "string" ||
    typeof p?.uniqueId !== "string" ||
    typeof p?.name !== "string" ||
    typeof p?.role !== "string"
  ) {
    return Response.json(
      { error: "tournamentId and person {uniqueId,name,role} required" },
      { status: 400 },
    );
  }
  await grantAssistant(b.tournamentId, {
    uniqueId: p.uniqueId,
    name: p.name,
    role: p.role,
    personId: typeof p.personId === "string" ? p.personId : undefined,
  });
  return Response.json(await listAssistants());
}

export async function DELETE(request: Request) {
  const b = await request.json().catch(() => null);
  if (typeof b?.tournamentId !== "string" || typeof b?.uniqueId !== "string") {
    return Response.json({ error: "tournamentId and uniqueId required" }, { status: 400 });
  }
  await revokeAssistant(b.tournamentId, b.uniqueId);
  return Response.json(await listAssistants());
}
