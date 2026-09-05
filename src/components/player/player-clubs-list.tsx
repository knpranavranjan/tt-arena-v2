"use client";

import Link from "next/link";
import { useJoinRequests } from "@/lib/join-requests";
import { getClub } from "@/lib/mock-data";
import type { Player } from "@/lib/types";

/**
 * Every club this player belongs to — their seeded home club (if any) plus
 * any club whose join request has been accepted. A player isn't capped at
 * one club, so this always renders as a list rather than a single value.
 */
export function PlayerClubsList({ player }: { player: Player }) {
  const { requests } = useJoinRequests();

  const clubIds = new Set(
    requests.filter((r) => r.playerId === player.id && r.status === "ACCEPTED").map((r) => r.clubId),
  );
  if (player.clubId) clubIds.add(player.clubId);

  const clubs = [...clubIds]
    .map((id) => getClub(id))
    .filter((c): c is NonNullable<ReturnType<typeof getClub>> => Boolean(c));

  if (clubs.length === 0) {
    return <p className="mt-1 text-sm font-medium text-[#e2e2e8]">Unaffiliated</p>;
  }

  return (
    <div className="mt-1 flex flex-col gap-1">
      {clubs.map((club) => (
        <Link
          key={club.id}
          href={`/clubs/${club.id}`}
          className="text-sm font-medium text-[#e2e2e8] hover:text-[#ff8f86]"
        >
          {club.name}
        </Link>
      ))}
    </div>
  );
}
