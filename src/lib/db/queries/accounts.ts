import { getDb } from "@/lib/db/client";
import { accounts } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createPlayer, ensurePlayerForAccount } from "@/lib/db/queries/players";
import { createClub, ensureClubForAccount } from "@/lib/db/queries/clubs";
import type { PlayerProfileInput } from "@/lib/player-profile";
import type { ClubProfileInput } from "@/lib/club-profile";

type Role = "PLAYER" | "CLUB" | "HOST" | "ADMIN";

/** Public account shape (no password material). */
export interface AccountRecord {
  id: string;
  uniqueId: string;
  name: string;
  role: Role;
  email: string;
  linkedId: string | null;
  seed: boolean;
}

const ROLE_LETTER: Record<Role, string> = { PLAYER: "P", HOST: "H", CLUB: "C", ADMIN: "A" };

function nextUniqueId(role: Role, existing: string[]): string {
  const prefix = `SR${ROLE_LETTER[role]}`;
  let max = 0;
  for (const uid of existing) {
    if (!uid.toUpperCase().startsWith(prefix)) continue;
    const n = parseInt(uid.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

const toRecord = (a: typeof accounts.$inferSelect): AccountRecord => ({
  id: a.id,
  uniqueId: a.uniqueId,
  name: a.name,
  role: a.role as Role,
  email: a.email,
  linkedId: a.linkedId,
  seed: a.seed,
});

export async function listAccounts(): Promise<AccountRecord[]> {
  const rows = await getDb().select().from(accounts);
  return rows.map(toRecord);
}

export type RegisterResult =
  | { ok: true; account: AccountRecord }
  | { ok: false; error: string };

export async function registerAccount(input: {
  name: string;
  password: string;
  role: Role;
  email: string;
  /** Player-only: sign-up profile fields. Missing pieces are filled at onboarding. */
  profile?: PlayerProfileInput;
  /** Club-only: sign-up profile fields. */
  clubProfile?: ClubProfileInput;
}): Promise<RegisterResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name || !input.password || !email) {
    return { ok: false, error: "Enter your name, email and a password." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const db = getDb();
  const rows = await db.select().from(accounts);
  if (rows.some((a) => a.email && a.email.toLowerCase() === email.toLowerCase())) {
    return {
      ok: false,
      error: "That email already has an account. Use a different email to register for another role.",
    };
  }

  const uniqueId = nextUniqueId(input.role, rows.map((a) => a.uniqueId));
  const { hash, salt } = await hashPassword(input.password);
  const id = `acc-${uniqueId.toLowerCase()}`;

  // A PLAYER account owns a player profile row from the moment it exists, so
  // every /player/* surface has something to render. Other roles link later
  // (a club to its club record, a host to nothing).
  let linkedId: string | null = null;
  if (input.role === "PLAYER") {
    const player = await createPlayer({ spinId: uniqueId, name, input: input.profile });
    linkedId = player.id;
  } else if (input.role === "CLUB") {
    const club = await createClub({
      spinId: uniqueId,
      name,
      input: { ...input.clubProfile, email },
    });
    linkedId = club.id;
  }

  await db.insert(accounts).values({
    id,
    uniqueId,
    name,
    passwordHash: hash,
    passwordSalt: salt,
    role: input.role,
    email,
    linkedId,
    seed: false,
  });

  return { ok: true, account: { id, uniqueId, name, role: input.role, email, linkedId, seed: false } };
}

export type SignInResult =
  | { ok: true; account: AccountRecord }
  | { ok: false; error: string };

export async function authenticate(identifier: string, password: string): Promise<SignInResult> {
  const id = identifier.trim();
  if (!id || !password) return { ok: false, error: "Enter your email or SPINID and password." };

  const rows = await getDb().select().from(accounts);
  const acc = rows.find(
    (a) =>
      a.uniqueId.toLowerCase() === id.toLowerCase() ||
      (a.email && a.email.toLowerCase() === id.toLowerCase()),
  );
  if (!acc || !(await verifyPassword(password, acc.passwordHash, acc.passwordSalt))) {
    return { ok: false, error: "Unknown email / SPINID, or wrong password." };
  }

  // Self-heal: PLAYER/CLUB accounts created before profile provisioning existed
  // have no linkedId — give them a profile row now so their portal isn't blank.
  const record = toRecord(acc);
  if (record.role === "PLAYER" && !record.linkedId) {
    record.linkedId = await ensurePlayerForAccount(record);
  } else if (record.role === "CLUB" && !record.linkedId) {
    record.linkedId = await ensureClubForAccount(record);
  }
  return { ok: true, account: record };
}
