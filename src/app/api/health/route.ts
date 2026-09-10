import { sql } from "drizzle-orm";

import { dbDriver, getDb, hasDb } from "@/lib/db/client";

/** GET /api/health — DB connectivity probe. */
export async function GET() {
  if (!hasDb()) {
    return Response.json(
      { ok: false, reason: "DATABASE_URL not set", backend: process.env.NEXT_PUBLIC_DATA_BACKEND ?? "db" },
      { status: 503 },
    );
  }
  const started = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({
      ok: true,
      driver: dbDriver(),
      latencyMs: Date.now() - started,
      backend: process.env.NEXT_PUBLIC_DATA_BACKEND ?? "db",
    });
  } catch (err) {
    return Response.json(
      { ok: false, driver: dbDriver(), error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
