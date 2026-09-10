/**
 * Canonical group-stage tie-break criteria.
 *
 * The host picks the *order* these are applied in on the "Host a Tournament"
 * form (drag & drop). That order is stored on the tournament and the live match
 * console's standings engine resolves every level group by walking it top-down.
 *
 * The ids are a deliberate subset of the engine's `TieBreakRule` union
 * (`src/lib/tournament/types.ts`) so a stored order maps straight through with
 * no translation.
 */

export type TieBreakCriterionId = "point_diff" | "head_to_head" | "games_diff";

export interface TieBreakCriterion {
  id: TieBreakCriterionId;
  label: string;
  hint: string;
}

export const TIE_BREAK_CRITERIA: TieBreakCriterion[] = [
  { id: "point_diff", label: "Point difference", hint: "Points scored minus points conceded" },
  { id: "head_to_head", label: "Head-to-head result", hint: "The result between the tied players only" },
  { id: "games_diff", label: "Games won and games lost", hint: "Games won minus games lost (ITTF standard)" },
];

/** The order every tournament starts with — matches the ITTF-style default. */
export const DEFAULT_TIE_BREAK_ORDER: TieBreakCriterionId[] = ["point_diff", "head_to_head", "games_diff"];

const VALID_IDS = TIE_BREAK_CRITERIA.map((c) => c.id);

export function tieBreakLabel(id: TieBreakCriterionId): string {
  return TIE_BREAK_CRITERIA.find((c) => c.id === id)?.label ?? id;
}

/**
 * Coerce a stored / user-supplied order into a full, valid list: unknown ids
 * dropped, duplicates removed, any criterion the host left out appended in the
 * default order. The result always contains every criterion exactly once, so
 * the engine never has to guess.
 */
export function normalizeTieBreakOrder(
  order: readonly string[] | null | undefined,
): TieBreakCriterionId[] {
  const seen = new Set<TieBreakCriterionId>();
  const out: TieBreakCriterionId[] = [];
  for (const raw of order ?? []) {
    const id = raw as TieBreakCriterionId;
    if (VALID_IDS.includes(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of DEFAULT_TIE_BREAK_ORDER) if (!seen.has(id)) out.push(id);
  return out;
}
