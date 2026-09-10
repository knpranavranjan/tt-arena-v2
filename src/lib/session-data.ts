"use client";

import { useAuth } from "@/lib/auth";
import { getAppUser, getClub, getPlayer } from "@/lib/mock-data";
import { useCreatedPlayers } from "@/lib/players-store";
import type { CreatedPlayer } from "@/lib/players-store";
import { useCreatedClubs } from "@/lib/clubs-store";
import type { CreatedClub } from "@/lib/clubs-store";

/** The seed player/club an account previews as (if any). */
function linkedIdFor(user: ReturnType<typeof useAuth>["user"]): string | null | undefined {
  if (!user) return undefined;
  return user.linkedId ?? getAppUser(user.id)?.linkedId;
}

/**
 * The signed-in player's profile — a seed roster player for the demo logins,
 * or a real profile row (from the DB / localStorage store) for genuine
 * sign-ups. `undefined` only when the account truly has no player yet.
 */
export function useCurrentPlayer(): CreatedPlayer | ReturnType<typeof getPlayer> {
  const { user } = useAuth();
  const { createdPlayers } = useCreatedPlayers();
  const linkedId = linkedIdFor(user);
  if (!linkedId) return undefined;
  return getPlayer(linkedId) ?? createdPlayers.find((p) => p.id === linkedId);
}

/** Whether the current player still owes onboarding (no DOB / gender / state). */
export function useCurrentPlayerNeedsOnboarding(): boolean {
  const { user } = useAuth();
  const { createdPlayers, isLoading } = useCreatedPlayers();
  const linkedId = linkedIdFor(user);
  if (isLoading || !user || user.role !== "PLAYER" || !linkedId) return false;
  if (getPlayer(linkedId)) return false;
  const mine = createdPlayers.find((p) => p.id === linkedId);
  return mine ? !mine.profileComplete : false;
}

/**
 * The signed-in club's profile — a seed club for the demo login, or a real
 * club row for genuine CLUB sign-ups.
 */
export function useCurrentClub(): CreatedClub | ReturnType<typeof getClub> {
  const { user } = useAuth();
  const { createdClubs } = useCreatedClubs();
  const linkedId = linkedIdFor(user);
  if (!linkedId) return undefined;
  return getClub(linkedId) ?? createdClubs.find((c) => c.id === linkedId);
}

/** Whether the current club still owes onboarding (no state / founding year). */
export function useCurrentClubNeedsOnboarding(): boolean {
  const { user } = useAuth();
  const { createdClubs, isLoading } = useCreatedClubs();
  const linkedId = linkedIdFor(user);
  if (isLoading || !user || user.role !== "CLUB" || !linkedId) return false;
  if (getClub(linkedId)) return false;
  const mine = createdClubs.find((c) => c.id === linkedId);
  return mine ? !mine.profileComplete : false;
}
