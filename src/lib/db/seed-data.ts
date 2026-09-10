/**
 * Plain seed data for the database (no React imports — safe to use from
 * `scripts/seed.ts` and the dev reset route).
 *
 * KEEP IN SYNC with the in-app defaults until Phase 2 wires those to import
 * from here:
 *   - accounts   → `SEED_ACCOUNTS` in `src/lib/auth.tsx`
 *   - plans      → `defaultHostingPlans` in `src/lib/hosting-plans.tsx`
 *   - fees       → `defaultMembershipFees` in `src/lib/membership.tsx`
 */

export interface SeedAccount {
  id: string;
  uniqueId: string;
  name: string;
  /** Plaintext demo password — hashed by the seeder before it hits the DB. */
  password: string;
  role: "PLAYER" | "CLUB" | "HOST" | "ADMIN";
  email: string;
  linkedId: string | null;
}

export const seedAccounts: SeedAccount[] = [
  { id: "u-1", uniqueId: "SRP01", name: "Arjun Sharma", password: "player", role: "PLAYER", email: "arjun@apexttc.in", linkedId: "p-1" },
  { id: "u-2", uniqueId: "SRC01", name: "Apex TTC Admin", password: "club", role: "CLUB", email: "contact@apexttc.in", linkedId: "club-apex" },
  { id: "u-3", uniqueId: "SRH01", name: "Karnataka TTA Ops", password: "host", role: "HOST", email: "ops@ktta.in", linkedId: null },
  { id: "u-4", uniqueId: "SRA01", name: "Platform Admin", password: "admin", role: "ADMIN", email: "admin@ttmanagement.app", linkedId: null },
];

export const seedHostingPlans = [
  { id: "one-time", title: "One-time tournament hosting", description: "Take this one tournament live.", price: 2000 },
  { id: "ten-pack", title: "10 tournaments hosting", description: "Host up to 10 tournaments — no per-event fee.", price: 18000 },
  { id: "unlimited", title: "Unlimited tournament hosting", description: "Host as many tournaments as you like, anytime.", price: 30000 },
];

export const seedMembershipFees = { id: "default", playerFee: 499, clubFee: 1499 };
