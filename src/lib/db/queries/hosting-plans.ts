import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { hostingPlans } from "@/lib/db/schema";
import { seedHostingPlans } from "@/lib/db/seed-data";

/** All plans in canonical order; a missing row falls back to its seed default. */
export async function listHostingPlans() {
  const rows = await getDb().select().from(hostingPlans);
  const byId = new Map(rows.map((r) => [r.id, r]));
  return seedHostingPlans.map((def) => byId.get(def.id) ?? def);
}

export async function setHostingPlanPrice(id: string, price: number) {
  // Rows are always present (the seeder inserts every plan), so a plain update.
  await getDb().update(hostingPlans).set({ price }).where(eq(hostingPlans.id, id));
}
