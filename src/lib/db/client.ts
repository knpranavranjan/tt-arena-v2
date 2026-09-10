/**
 * The database connection — and the ONE place the engine is chosen.
 *
 * Neon (testing) and AWS RDS/Aurora (later) are both Postgres, so switching is
 * three env values and zero code:
 *
 *   Neon now      DB_DRIVER=neon   DATABASE_URL=postgres://…-pooler.…neon.tech/…?sslmode=require
 *   AWS later     DB_DRIVER=pg     DATABASE_URL=postgres://…rds.amazonaws.com/…   PGSSLMODE=require
 *
 * `getDb()` is lazy so `next build` (which imports every route module for type
 * collection) doesn't need a live `DATABASE_URL`.
 */
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

import { schema } from "@/lib/db/schema";

export type Db = NodePgDatabase<typeof schema>;

let cached: Db | null = null;

/**
 * The Postgres URL. `DATABASE_URL` is canonical; the fallbacks are the names
 * the Vercel–Neon integration injects, so `vercel env pull` works with no
 * renaming. Prefer a pooled URL (host contains `-pooler`).
 */
export function databaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  );
}

/** True when a connection string is configured. Stores fall back to
 *  localStorage when this is false (or when NEXT_PUBLIC_DATA_BACKEND=local). */
export function hasDb(): boolean {
  return Boolean(databaseUrl());
}

export function dbDriver(): "neon" | "pg" {
  return process.env.DB_DRIVER === "pg" ? "pg" : "neon";
}

export function getDb(): Db {
  if (cached) return cached;

  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "No database URL. Set DATABASE_URL (or POSTGRES_URL) in .env.local — see .env.example.",
    );
  }

  if (dbDriver() === "pg") {
    const pool = new Pool({ connectionString: url });
    cached = drizzlePg(pool, { schema, casing: "snake_case" });
  } else {
    // neon-http: every query is one HTTPS round-trip — ideal for Route
    // Handlers, no pooling/WebSocket setup. No interactive transactions, which
    // this app doesn't use.
    cached = drizzleNeon(neon(url), {
      schema,
      casing: "snake_case",
    }) as unknown as Db;
  }

  return cached;
}
