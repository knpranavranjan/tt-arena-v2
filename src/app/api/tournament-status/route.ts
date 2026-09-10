import { listStatusOverrides, setStatusOverride } from "@/lib/db/queries/tournament-status";

const STATUSES = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "SEEDING",
  "POOLS",
  "KNOCKOUT",
  "COMPLETED",
];

export async function GET() {
  return Response.json(await listStatusOverrides());
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  if (typeof b?.tournamentId !== "string" || !STATUSES.includes(b?.status)) {
    return Response.json({ error: "tournamentId and a valid status required" }, { status: 400 });
  }
  await setStatusOverride(b.tournamentId, b.status);
  return Response.json({ ok: true });
}
