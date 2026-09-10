import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next's .env.local on its own.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local yet — `db:push` will report the missing DATABASE_URL clearly
}

// Same fallback list as src/lib/db/client.ts (Vercel–Neon integration names).
const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url },
});
