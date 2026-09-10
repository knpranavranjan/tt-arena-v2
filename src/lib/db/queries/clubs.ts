import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { accounts, clubs } from "@/lib/db/schema";
import type { ClubRow } from "@/lib/db/schema";
import type { Club } from "@/lib/types";
import {
  buildClub,
  defaultFacilities,
  isClubProfileComplete,
  type ClubProfileInput,
} from "@/lib/club-profile";
import { stateFromLocation } from "@/lib/player-profile";

export interface ClubApi extends Club {
  spinId: string;
  profileComplete: boolean;
}

export function clubId(spinId: string): string {
  return `club-usr-${spinId.toLowerCase()}`;
}

function toApi(r: ClubRow): ClubApi {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    state: r.state,
    address: r.address,
    coordinates: (r.coordinates as Club["coordinates"]) ?? undefined,
    description: r.description,
    aboutHighlights: r.aboutHighlights ?? [],
    logoUrl: r.logoUrl ?? undefined,
    playerIds: [],
    founded: r.founded,
    phone: r.phone,
    email: r.email,
    verified: r.verified,
    facilities: { ...defaultFacilities, ...(r.facilities as object) },
    spinId: r.spinId,
    profileComplete: r.profileComplete,
  };
}

export async function listClubs(): Promise<ClubApi[]> {
  const rows = await getDb().select().from(clubs);
  return rows.map(toApi);
}

export async function getCreatedClub(id: string): Promise<ClubApi | undefined> {
  const [row] = await getDb().select().from(clubs).where(eq(clubs.id, id));
  return row ? toApi(row) : undefined;
}

export async function createClub(args: {
  spinId: string;
  name: string;
  input?: ClubProfileInput;
}): Promise<ClubApi> {
  const db = getDb();
  const id = clubId(args.spinId);

  const [existing] = await db.select().from(clubs).where(eq(clubs.id, id));
  if (existing) return toApi(existing);

  const c = buildClub({ id, name: args.name, input: args.input });
  const row = {
    id,
    spinId: args.spinId,
    name: c.name,
    location: c.location,
    state: c.state,
    address: c.address,
    description: c.description,
    aboutHighlights: c.aboutHighlights,
    logoUrl: c.logoUrl ?? null,
    founded: c.founded,
    phone: c.phone,
    email: c.email,
    verified: c.verified,
    coordinates: c.coordinates ?? null,
    facilities: c.facilities as unknown as Record<string, unknown>,
    profileComplete: c.profileComplete,
  };
  await db.insert(clubs).values(row).onConflictDoNothing({ target: clubs.id });
  const [stored] = await db.select().from(clubs).where(eq(clubs.id, id));
  return toApi(stored ?? (row as ClubRow));
}

export async function updateClub(
  id: string,
  patch: ClubProfileInput & { name?: string },
): Promise<ClubApi | undefined> {
  const db = getDb();
  const [current] = await db.select().from(clubs).where(eq(clubs.id, id));
  if (!current) return undefined;

  const location = patch.location ?? current.location;
  const state = patch.state !== undefined ? stateFromLocation(patch.state) : current.state;
  const founded = patch.founded !== undefined ? Number(patch.founded) || current.founded : current.founded;

  const next = {
    name: patch.name?.trim() || current.name,
    location: location.split(",")[0]?.trim() || location,
    state: state || stateFromLocation(location),
    address: patch.address ?? current.address,
    description: patch.description ?? current.description,
    phone: patch.phone ?? current.phone,
    email: patch.email ?? current.email,
    founded,
    coordinates: patch.coordinates ?? current.coordinates ?? null,
    facilities: {
      ...(current.facilities as object),
      ...(patch.facilities ?? {}),
    } as unknown as Record<string, unknown>,
    profileComplete: isClubProfileComplete({ state, location, founded }),
  };
  await db.update(clubs).set(next).where(eq(clubs.id, id));
  const [stored] = await db.select().from(clubs).where(eq(clubs.id, id));
  return stored ? toApi(stored) : undefined;
}

/** Guarantee a CLUB account has a linked club row (self-heals old accounts). */
export async function ensureClubForAccount(account: {
  id: string;
  uniqueId: string;
  name: string;
  role: string;
  linkedId: string | null;
}): Promise<string | null> {
  if (account.role !== "CLUB") return account.linkedId;
  if (account.linkedId) return account.linkedId;

  const db = getDb();
  const club = await createClub({ spinId: account.uniqueId, name: account.name });
  await db.update(accounts).set({ linkedId: club.id }).where(eq(accounts.id, account.id));
  return club.id;
}
