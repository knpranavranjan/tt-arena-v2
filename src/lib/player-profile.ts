/**
 * Pure helpers for turning sign-up input into a full player profile.
 *
 * No React / no server imports — safe from Route Handlers, the localStorage
 * auth path, and the onboarding form alike.
 */
import type { Category, Gender, Player } from "@/lib/types";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Pro";

/** Fields the sign-up form / onboarding step collect for a player. */
export interface PlayerProfileInput {
  dateOfBirth?: string;
  gender?: Gender | "";
  /** Freeform "City, State" — we keep the trailing state segment. */
  state?: string;
  phone?: string;
  /** A `SkillLevel` in practice; typed wide since it also arrives from request bodies. */
  skillLevel?: string;
}

const SKILL_RATING: Record<SkillLevel, number> = {
  Beginner: 1200,
  Intermediate: 1400,
  Advanced: 1650,
  Pro: 1850,
};

/** A sensible starting rating from the self-reported skill level. */
export function ratingForSkill(level?: string | null): number {
  return (level && SKILL_RATING[level as SkillLevel]) || SKILL_RATING.Beginner;
}

/** Age in whole years from an ISO date string, or null when unparseable. */
export function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  if (Number.isNaN(t)) return null;
  const years = (Date.now() - t) / (1000 * 60 * 60 * 24 * 365.25);
  return years > 0 && years < 120 ? Math.floor(years) : null;
}

/** Map age to the platform's fixed player brackets. */
export function categoryForAge(age: number | null): Category {
  if (age === null) return "Senior";
  if (age <= 13) return "Under 13";
  if (age <= 17) return "Under 17";
  if (age <= 21) return "Under 21";
  if (age >= 40) return "Veteran (40+)";
  return "Senior";
}

/** "Bengaluru, Karnataka" -> "Karnataka"; a bare token is returned as-is. */
export function stateFromLocation(location?: string | null): string {
  if (!location) return "";
  const parts = location
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

/** True once we have enough to render every `/player/*` surface without gaps. */
export function isProfileComplete(input: {
  dateOfBirth?: string | null;
  gender?: string | null;
  state?: string | null;
}): boolean {
  return Boolean(input.dateOfBirth && input.gender && stateFromLocation(input.state));
}

/**
 * Build a full `Player` from an account + whatever profile input we have.
 * Missing pieces get safe defaults and `profileComplete` reports the gap.
 */
export function buildPlayer(args: {
  id: string;
  name: string;
  input?: PlayerProfileInput;
}): Player & { profileComplete: boolean; skillLevel: string | null; phone: string | null } {
  const input = args.input ?? {};
  const dateOfBirth = input.dateOfBirth ?? "";
  const gender: Gender = input.gender === "FEMALE" ? "FEMALE" : "MALE";
  const state = stateFromLocation(input.state);
  const category = categoryForAge(ageFromDob(dateOfBirth));
  return {
    id: args.id,
    name: args.name,
    clubId: null,
    clubName: null,
    state,
    category,
    gender,
    rating: ratingForSkill(input.skillLevel),
    dateOfBirth,
    wins: 0,
    losses: 0,
    recentForm: [],
    playStyle: undefined,
    phone: input.phone ?? null,
    skillLevel: input.skillLevel || null,
    profileComplete: isProfileComplete(input),
  };
}
