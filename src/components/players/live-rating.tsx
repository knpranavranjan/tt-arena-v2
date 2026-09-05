"use client";

import type { CSSProperties } from "react";
import { usePlayerRatings } from "@/lib/player-ratings";

/**
 * A player's current rating, reflecting any tournament rating update — for
 * server components that render a player's static record and can't call the
 * ratings hook themselves. Renders synchronously from localStorage once
 * mounted, so it may flash the seeded rating for a frame on first paint.
 */
export function LiveRating({
  playerId,
  className,
  style,
}: {
  playerId: string;
  className?: string;
  style?: CSSProperties;
}) {
  const ratings = usePlayerRatings();
  return (
    <span className={className} style={style}>
      {ratings.getRating(playerId)}
    </span>
  );
}
