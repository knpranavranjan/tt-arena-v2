"use client";

import { useAuth } from "@/lib/auth";
import { getAppUser, getClub, getPlayer } from "@/lib/mock-data";

/** The seed player/club an account previews as (if any). */
function linkedIdFor(user: ReturnType<typeof useAuth>["user"]): string | null | undefined {
  if (!user) return undefined;
  return user.linkedId ?? getAppUser(user.id)?.linkedId;
}

export function useCurrentPlayer() {
  const { user } = useAuth();
  const linkedId = linkedIdFor(user);
  return linkedId ? getPlayer(linkedId) : undefined;
}

export function useCurrentClub() {
  const { user } = useAuth();
  const linkedId = linkedIdFor(user);
  return linkedId ? getClub(linkedId) : undefined;
}
