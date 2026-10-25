import { listAccounts } from "@/lib/db/queries/accounts";

/**
 * GET /api/accounts/names — SPINID → display name for every account, nothing
 * else (no email). Public pages use it to label a tournament with the name of
 * the account that hosted it.
 */
export async function GET() {
  const rows = await listAccounts();
  return Response.json(rows.map((a) => ({ uniqueId: a.uniqueId, name: a.name })));
}
