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
    const p = b?.profile && typeof b.profile === "object" ? b.profile : undefined;
    const cp = b?.clubProfile && typeof b.clubProfile === "object" ? b.clubProfile : undefined;
    const result = await registerAccount({
      name: String(b.name ?? ""),
      password: String(b.password ?? ""),
      role: b.role,
      email: String(b.email ?? ""),
      profile: p
        ? {
            dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth) : undefined,
            gender: p.gender === "MALE" || p.gender === "FEMALE" ? p.gender : undefined,
            state: p.state ? String(p.state) : undefined,
            phone: p.phone ? String(p.phone) : undefined,
            skillLevel: p.skillLevel ? String(p.skillLevel) : undefined,
          }
        : undefined,
      clubProfile: cp
        ? {
            location: cp.location ? String(cp.location) : undefined,
            address: cp.address ? String(cp.address) : undefined,
            state: cp.state ? String(cp.state) : undefined,
            phone: cp.phone ? String(cp.phone) : undefined,
            description: cp.description ? String(cp.description) : undefined,
            founded: cp.founded !== undefined ? Number(cp.founded) || undefined : undefined,
            coordinates:
              cp.coordinates && typeof cp.coordinates === "object"
                ? {
                    lat: Number(cp.coordinates.lat) || 0,
                    lng: Number(cp.coordinates.lng) || 0,
                  }
                : undefined,
          }
        : undefined,
    });
    return Response.json(result, { status: result.ok ? 201 : 200 });
  }

  if (b?.op === "signin") {
    const result = await authenticate(String(b.identifier ?? ""), String(b.password ?? ""));
    return Response.json(result);
  }

  return Response.json({ ok: false, error: "op must be 'register' or 'signin'" }, { status: 400 });
}
