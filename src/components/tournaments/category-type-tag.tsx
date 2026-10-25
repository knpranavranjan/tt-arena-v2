import { categoryLimit, limitLabel } from "@/lib/tournament-categories";
import type { Tournament } from "@/lib/types";

/** Who can enter a category: "Rating under 2000" / "Age under 21" / "Open to all". */
export function CategoryTypeTag({
  category,
}: {
  category: Pick<Tournament, "categoryType" | "ratingLimit" | "ageLimit">;
}) {
  const l = categoryLimit(category);
  const tone = !l
    ? "border-white/15 bg-white/5 text-[#8b8b93]"
    : l.type === "RATING"
      ? "border-[#0ea5ff]/20 bg-[#0ea5ff]/10 text-[#0ea5ff]"
      : "border-amber-400/40 bg-amber-400/10 text-amber-300";
  return (
    <span
      className={`shrink-0 rounded-[3px] border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${tone}`}
      style={{ fontFamily: "var(--font-home-mono)" }}
    >
      {limitLabel(category)}
    </span>
  );
}
