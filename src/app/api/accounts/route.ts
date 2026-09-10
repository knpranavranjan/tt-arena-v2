import { authenticate, listAccounts, registerAccount } from "@/lib/db/queries/accounts";

const ROLES = ["PLAYER", "CLUB", "HOST", "ADMIN"] as const;

export async function GET() {
  return Response.json(await listAccounts());
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => null);

  if (b?.op === "register") {
    if (!ROLES.includes(b?.role)) {
      return Response.json({ ok: false, error: "invalid role" }, { status: 400 });
    }
    const result = await registerAccount({
      name: String(b.name ?? ""),
      password: String(b.password ?? ""),
      role: b.role,
      email: String(b.email ?? ""),
    });
    return Response.json(result, { status: result.ok ? 201 : 200 });
  }

  if (b?.op === "signin") {
    const result = await authenticate(String(b.identifier ?? ""), String(b.password ?? ""));
    return Response.json(result);
  }

  return Response.json({ ok: false, error: "op must be 'register' or 'signin'" }, { status: 400 });
}
