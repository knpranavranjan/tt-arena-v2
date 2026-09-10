import { getDb, hasDb } from "@/lib/db/client";
import { seedDatabase } from "@/lib/db/seed";

/**
 * POST /api/dev/reset — wipe every migrated table and re-seed.
 *
 * Dev only, and gated by the `x-seed-token` header matching DEV_SEED_TOKEN.
 * Never enabled in production.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ ok: false, error: "disabled in production" }, { status: 403 });
  }
  const token = process.env.DEV_SEED_TOKEN;
  if (!token || request.headers.get("x-seed-token") !== token) {
    return Response.json({ ok: false, error: "bad or missing x-seed-token" }, { status: 401 });
  }
  if (!hasDb()) {
    return Response.json({ ok: false, error: "DATABASE_URL not set" }, { status: 503 });
  }

  try {
    const result = await seedDatabase(getDb(), { reset: true });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
