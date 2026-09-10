import {
  confirmRegistrationPayment,
  createRegistration,
  listRegistrations,
} from "@/lib/db/queries/registrations";

export async function GET() {
  return Response.json(await listRegistrations());
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  if (
    typeof b?.tournamentId !== "string" ||
    typeof b?.playerId !== "string" ||
    typeof b?.playerName !== "string"
  ) {
    return Response.json(
      { error: "tournamentId, playerId, playerName required" },
      { status: 400 },
    );
  }
  const answers = Array.isArray(b.answers)
    ? b.answers.filter(
        (a: unknown): a is { question: string; answer: string } =>
          !!a && typeof a === "object" && "question" in a && "answer" in a,
      )
    : undefined;
  const row = await createRegistration(
    b.tournamentId,
    b.playerId,
    b.playerName,
    Number(b.entryFee) || 0,
    answers,
  );
  return Response.json(row, { status: 201 });
}

export async function PATCH(request: Request) {
  const b = await request.json().catch(() => null);
  if (b?.op !== "confirmPayment" || typeof b?.tournamentId !== "string" || typeof b?.playerId !== "string") {
    return Response.json(
      { error: "op:'confirmPayment', tournamentId, playerId required" },
      { status: 400 },
    );
  }
  await confirmRegistrationPayment(b.tournamentId, b.playerId);
  return Response.json({ ok: true });
}
