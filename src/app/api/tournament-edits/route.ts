import { listTournamentEdits, mergeTournamentEdit } from "@/lib/db/queries/tournament-edits";

export async function GET() {
  return Response.json(await listTournamentEdits());
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  if ((b?.kind !== "tournament" && b?.kind !== "event") || typeof b?.targetId !== "string") {
    return Response.json({ error: "kind ('tournament'|'event') and targetId required" }, { status: 400 });
  }
  if (!b.patch || typeof b.patch !== "object" || Array.isArray(b.patch)) {
    return Response.json({ error: "patch must be an object" }, { status: 400 });
  }
  const merged = await mergeTournamentEdit(b.kind, b.targetId, b.patch);
  return Response.json({ ok: true, patch: merged });
}
