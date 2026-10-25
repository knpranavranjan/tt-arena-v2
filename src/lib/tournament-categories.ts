import type { CategoryType, Tournament } from "@/lib/types";

/**
 * Hosts restrict each category of an event one of two ways — the category
 * name itself is free text either way:
 * - AGE: entrants must be under `ageLimit` (1–100) on the first day of play.
 * - RATING: entrants' rating must be under `ratingLimit` (50, 100 … 3000).
 * No limit set = open to everyone.
 */

export const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: "AGE", label: "Age" },
  { value: "RATING", label: "Rating" },
];

/** 50, 100, 150 … 3000. */
export const RATING_LIMITS: number[] = Array.from({ length: 60 }, (_, i) => (i + 1) * 50);

/** 1 … 100. */
export const AGE_LIMITS: number[] = Array.from({ length: 100 }, (_, i) => i + 1);

export const limitsFor = (type: CategoryType) => (type === "RATING" ? RATING_LIMITS : AGE_LIMITS);

export const categoryTypeOf = (t: Pick<Tournament, "categoryType">): CategoryType => t.categoryType ?? "AGE";

/** The restriction a category carries, if any. */
export function categoryLimit(
  t: Pick<Tournament, "categoryType" | "ratingLimit" | "ageLimit">,
): { type: CategoryType; limit: number } | null {
  const type = categoryTypeOf(t);
  const limit = type === "RATING" ? t.ratingLimit : t.ageLimit;
  return limit ? { type, limit } : null;
}

/** "Rating under 2000" / "Age under 21" / "Open to all". */
export function limitLabel(t: Pick<Tournament, "categoryType" | "ratingLimit" | "ageLimit">): string {
  const l = categoryLimit(t);
  if (!l) return "Open to all";
  return `${l.type === "RATING" ? "Rating" : "Age"} under ${l.limit}`;
}
