import { categoryLimit } from "@/lib/tournament-categories";
import type { Tournament } from "@/lib/types";

/**
 * Can this player enter this category? One rule, used by the registration
 * checkout (to block the row) and by POST /api/registrations (so it can't be
 * bypassed). "Under" is strict: a 2000-rated player is not under 2000, and a
 * player who is 21 on the first day of play is not under 21.
 */
export type Eligibility = { ok: true } | { ok: false; reason: string };

/** Whole years old on `onDay` ("YYYY-MM-DD"), or null when the DOB is missing/unparseable. */
export function ageOn(dateOfBirth: string | null | undefined, onDay: string): number | null {
  const dob = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOfBirth ?? "");
  const day = /^(\d{4})-(\d{2})-(\d{2})/.exec(onDay);
  if (!dob || !day) return null;
  let age = +day[1] - +dob[1];
  if (+day[2] < +dob[2] || (+day[2] === +dob[2] && +day[3] < +dob[3])) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function categoryEligibility(
  category: Pick<Tournament, "categoryType" | "ratingLimit" | "ageLimit" | "date">,
  player: { rating: number | null | undefined; dateOfBirth?: string | null },
): Eligibility {
  const l = categoryLimit(category);
  if (!l) return { ok: true };

  if (l.type === "RATING") {
    const rating = player.rating;
    if (!rating) return { ok: false, reason: "You don't have a rating on record yet." };
    return rating < l.limit
      ? { ok: true }
      : { ok: false, reason: `Your rating ${rating} isn't under ${l.limit}.` };
  }

  const age = ageOn(player.dateOfBirth, category.date);
  if (age === null) return { ok: false, reason: "Add your date of birth to your profile to enter age categories." };
  return age < l.limit
    ? { ok: true }
    : { ok: false, reason: `You're ${age} on the first day — this category is under ${l.limit}.` };
}
