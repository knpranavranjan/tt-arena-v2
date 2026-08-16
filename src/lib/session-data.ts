"use client";

import { useAuth } from "@/lib/auth";
import { getAppUser, getClub, getPlayer } from "@/lib/mock-data";

export function useCurrentPlayer() {
  const { user } = useAuth();
  if (!user) return undefined;
  const linkedId = getAppUser(user.id)?.linkedId;
  return linkedId ? getPlayer(linkedId) : undefined;
}

export function useCurrentClub() {
  const { user } = useAuth();
  if (!user) return undefined;
  const linkedId = getAppUser(user.id)?.linkedId;
  return linkedId ? getClub(linkedId) : undefined;
}
