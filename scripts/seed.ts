/**
 * Standalone seeder: `npm run db:seed` (wipes + re-seeds) or
 * `npm run db:seed -- --keep` (idempotent top-up, no wipe).
 *
 * Runs outside Next via `tsx`, so it loads .env.local itself.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  /* fall through — getDb() throws a clear error if DATABASE_URL is missing */
}

import { getDb } from "@/lib/db/client";
import { seedDatabase } from "@/lib/db/seed";

const keep = process.argv.includes("--keep");

async function main() {
  const result = await seedDatabase(getDb(), { reset: !keep });
  console.log(
    `✓ seed complete — ${result.accounts} account(s)${keep ? " (kept existing data)" : " (reset)"}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ seed failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
