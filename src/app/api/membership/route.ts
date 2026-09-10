import {
  activateMembership,
  getMembership,
  setMembershipFee,
} from "@/lib/db/queries/membership";

export async function GET() {
  return Response.json(await getMembership());
}

/** POST { op: "activate", userId, role } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body?.op !== "activate" || typeof body.userId !== "string") {
    return Response.json({ error: "op:'activate' and userId required" }, { status: 400 });
  }
  const role = body.role === "CLUB" ? "CLUB" : "PLAYER";
  const expiresAt = await activateMembership(body.userId, role);
  return Response.json({ expiresAt });
}

/** PATCH { op: "fee", role, amount } */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (body?.op !== "fee" || (body.role !== "PLAYER" && body.role !== "CLUB")) {
    return Response.json({ error: "op:'fee' and role PLAYER|CLUB required" }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return Response.json({ error: "amount must be a non-negative number" }, { status: 400 });
  }
  await setMembershipFee(body.role, Math.round(amount));
  return Response.json(await getMembership());
}
