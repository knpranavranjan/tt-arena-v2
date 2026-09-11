"use client";

import { useMemo } from "react";
import { usePlayerRoster, type RosterPlayer } from "@/lib/players-store";
import { useJoinRequests, type JoinRequest } from "@/lib/join-requests";

/**
 * A player belongs to a club two ways: their profile's home club (seed
 * roster, or set at sign-up), or a club whose join request they sent was
 * accepted (`useJoinRequests`). Neither alone is the full membership — the
 * "Join Club" flow only ever writes an accepted request, it never touches a
 * player's `clubId`. Every place that lists or counts a club's players needs
 * both, for seed and real accounts alike.
 */
export function clubMembersOf(
  clubId: string,
  roster: readonly RosterPlayer[],
  requests: readonly JoinRequest[],
): RosterPlayer[] {
  const acceptedIds = new Set(
    requests.filter((r) => r.clubId === clubId && r.status === "ACCEPTED").map((r) => r.playerId),
  );
  return roster.filter((p) => p.clubId === clubId || acceptedIds.has(p.id));
}

/** Live member list for one club — seed + real sign-ups, home club or accepted request. */
export function useClubMembers(clubId: string | undefined): RosterPlayer[] {
  const roster = usePlayerRoster();
  const { requests } = useJoinRequests();
  return useMemo(
    () => (clubId ? clubMembersOf(clubId, roster, requests) : []),
    [clubId, roster, requests],
  );
}
