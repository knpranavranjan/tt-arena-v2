import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { accounts, players } from "@/lib/db/schema";
import type { PlayerRow } from "@/lib/db/schema";
import type { Player } from "@/lib/types";
import {
  buildPlayer,
  categoryForAge,
  ageFromDob,
  isProfileComplete,
  ratingForSkill,
  stateFromLocation,
  type PlayerProfileInput,
} from "@/lib/player-profile";

/** API shape — the `Player` the client stores expect, plus profile metadata. */
export interface PlayerApi extends Player {
  spinId: string;
  phone: string | null;
  skillLevel: string | null;
  profileComplete: boolean;
}

export function playerId(spinId: string): string {
  return `p-usr-${spinId.toLowerCase()}`;
}

function toApi(r: PlayerRow): PlayerApi {
  return {
    id: r.id,
    name: r.name,
    clubId: r.clubId,
    clubName: r.clubName,
    state: r.state,
    category: r.category as Player["category"],
    gender: r.gender as Player["gender"],
    rating: r.rating,
    dateOfBirth: r.dateOfBirth,
    wins: r.wins,
    losses: r.losses,
    recentForm: r.recentForm ?? [],
    playStyle: r.playStyle ?? undefined,
    spinId: r.spinId,
    phone: r.phone,
    skillLevel: r.skillLevel,
    profileComplete: r.profileComplete,
  };
}

export async function listPlayers(): Promise<PlayerApi[]> {
  const rows = await getDb().select().from(players);
  return rows.map(toApi);
}

export async function getCreatedPlayer(id: string): Promise<PlayerApi | undefined> {
  const [row] = await getDb().select().from(players).where(eq(players.id, id));
  return row ? toApi(row) : undefined;
}

/**
 * Insert a player row for a freshly-registered account (no-op if it somehow
 * already exists). Returns the stored profile.
 */
export async function createPlayer(args: {
  spinId: string;
  name: string;
  input?: PlayerProfileInput;
}): Promise<PlayerApi> {
  const db = getDb();
  const id = playerId(args.spinId);

  const [existing] = await db.select().from(players).where(eq(players.id, id));
  if (existing) return toApi(existing);

  const p = buildPlayer({ id, name: args.name, input: args.input });
  const row = {
    id,
    spinId: args.spinId,
    name: p.name,
    clubId: p.clubId,
    clubName: p.clubName,
    state: p.state,
    category: p.category,
    gender: p.gender,
    rating: p.rating,
    dateOfBirth: p.dateOfBirth,
    wins: p.wins,
    losses: p.losses,
    recentForm: p.recentForm,
    playStyle: p.playStyle ?? null,
    phone: p.phone,
    skillLevel: p.skillLevel,
    profileComplete: p.profileComplete,
  };
  await db.insert(players).values(row).onConflictDoNothing({ target: players.id });
  const [stored] = await db.select().from(players).where(eq(players.id, id));
  return toApi(stored ?? (row as PlayerRow));
}

/** Patch a profile (onboarding / settings). Recomputes derived fields. */
export async function updatePlayer(
  id: string,
  patch: PlayerProfileInput & { name?: string },
): Promise<PlayerApi | undefined> {
  const db = getDb();
  const [current] = await db.select().from(players).where(eq(players.id, id));
  if (!current) return undefined;

  const dateOfBirth = patch.dateOfBirth ?? current.dateOfBirth;
  const gender = patch.gender || current.gender;
  const state = patch.state !== undefined ? stateFromLocation(patch.state) : current.state;
  const skillLevel = patch.skillLevel || current.skillLevel || undefined;

  const next = {
    name: patch.name?.trim() || current.name,
    dateOfBirth,
    gender,
    state,
    category: categoryForAge(ageFromDob(dateOfBirth)),
    rating: patch.skillLevel ? ratingForSkill(patch.skillLevel) : current.rating,
    phone: patch.phone ?? current.phone,
    skillLevel: skillLevel ?? null,
    profileComplete: isProfileComplete({ dateOfBirth, gender, state }),
  };
  await db.update(players).set(next).where(eq(players.id, id));
  const [stored] = await db.select().from(players).where(eq(players.id, id));
  return stored ? toApi(stored) : undefined;
}

/**
 * Guarantee a PLAYER account has a linked player row. Used on sign-in so
 * accounts created before player provisioning existed self-heal on next login.
 * Returns the linkedId (existing or newly created).
 */
export async function ensurePlayerForAccount(account: {
  id: string;
  uniqueId: string;
  name: string;
  role: string;
  linkedId: string | null;
}): Promise<string | null> {
  if (account.role !== "PLAYER") return account.linkedId;
  if (account.linkedId) return account.linkedId;

  const db = getDb();
  const player = await createPlayer({ spinId: account.uniqueId, name: account.name });
  await db.update(accounts).set({ linkedId: player.id }).where(eq(accounts.id, account.id));
  return player.id;
}
