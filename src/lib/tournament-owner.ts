import type { Tournament, TTEvent } from "@/lib/types";

/** Minimal shape of the signed-in account needed to check ownership. */
export interface OwnerIdentity {
  /** SPINID — unique across every account, every role. */
  uniqueId: string;
}

type OwnableEvent = Pick<Tournament, "organizerId"> | Pick<TTEvent, "organizerId">;

/**
 * Whether `user` is the account that created this tournament / event through
 * "Host a Tournament".
 *
 * Identity is the **SPINID** and nothing else. Two accounts can share a display
 * name (a player and a club both called "Pranav Ranjan", say) — they are still
 * different logins and must never see each other's hosted tournaments. The
 * `organizer` string is display-only; it is never compared here.
 *
 * The seed catalogue has no `organizerId`, so it is owned by nobody — those
 * fixtures are not managed through the per-account portals.
 */
export function ownsTournament(
  t: OwnableEvent | null | undefined,
  user: OwnerIdentity | null | undefined,
): boolean {
  return !!t?.organizerId && !!user?.uniqueId && t.organizerId === user.uniqueId;
}
