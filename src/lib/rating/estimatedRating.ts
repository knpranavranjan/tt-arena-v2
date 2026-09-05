export type EstimatedSkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO" | "ELITE";

export type EstimatedRatingInput = {
  skillLevel: EstimatedSkillLevel;
  clubVerified: boolean;
  coachVerified: boolean;
  practiceMatches: number;
  practiceWins: number;
  practiceLosses: number;
};

export type EstimatedRatingResult = {
  baseRating: number;
  modifierPoints: number;
  rawEstimatedRating: number;
  estimatedRating: number;
  winRate: number | null;
  breakdown: string[];
};

/**
 * A neutral profile for a player tt-arena has no skill-survey data for. It
 * only matters if that player has zero rated matches AND already has no
 * stored rating — tt-arena seeds every player with a rating, so this path is
 * dormant today but stays correct if unrated sign-ups are ever introduced.
 */
export const NEUTRAL_ESTIMATED_RATING_PROFILE: EstimatedRatingInput = {
  skillLevel: "INTERMEDIATE",
  clubVerified: false,
  coachVerified: false,
  practiceMatches: 0,
  practiceWins: 0,
  practiceLosses: 0,
};

const skillBaseRating: Record<EstimatedSkillLevel, number> = {
  BEGINNER: 500,
  INTERMEDIATE: 900,
  ADVANCED: 1300,
  PRO: 1700,
  ELITE: 2000,
};

function clampRating(value: number) {
  return Math.max(200, Math.min(2400, Math.round(value)));
}

export function calculateProgrammaticEstimatedRating({
  skillLevel,
  clubVerified,
  coachVerified,
  practiceMatches,
  practiceWins,
  practiceLosses,
}: EstimatedRatingInput): EstimatedRatingResult {
  const safePracticeMatches = Math.max(0, Math.round(practiceMatches || 0));
  const safePracticeWins = Math.max(0, Math.round(practiceWins || 0));
  const safePracticeLosses = Math.max(0, Math.round(practiceLosses || 0));

  const totalPracticeResults = safePracticeWins + safePracticeLosses;

  const baseRating = skillBaseRating[skillLevel];

  let modifierPoints = 0;
  const breakdown: string[] = [];

  breakdown.push(`Base rating from skill level ${skillLevel}: ${baseRating}`);

  if (clubVerified) {
    modifierPoints += 100;
    breakdown.push("Club verified player: +100");
  }

  if (coachVerified) {
    modifierPoints += 100;
    breakdown.push("Coach verified player: +100");
  }

  if (safePracticeMatches >= 10) {
    modifierPoints += 50;
    breakdown.push("Played 10 or more practice matches: +50");
  }

  if (safePracticeMatches >= 25) {
    modifierPoints += 50;
    breakdown.push("Played 25 or more practice matches: +50");
  }

  const winRate = totalPracticeResults > 0 ? safePracticeWins / totalPracticeResults : null;

  if (winRate !== null && winRate >= 0.7 && totalPracticeResults >= 5) {
    modifierPoints += 100;
    breakdown.push("Practice win rate is 70% or higher: +100");
  }

  if (winRate !== null && winRate <= 0.3 && totalPracticeResults >= 5) {
    modifierPoints -= 100;
    breakdown.push("Practice win rate is 30% or lower: -100");
  }

  if (winRate === null) {
    breakdown.push("No practice win/loss history: +0");
  }

  const rawEstimatedRating = baseRating + modifierPoints;
  const estimatedRating = clampRating(rawEstimatedRating);

  return {
    baseRating,
    modifierPoints,
    rawEstimatedRating,
    estimatedRating,
    winRate,
    breakdown,
  };
}

export function validateEstimatedRatingForTournamentResult({
  generatedEstimatedRating,
  winsAgainstRated,
  lossesAgainstRated,
}: {
  generatedEstimatedRating: number;
  winsAgainstRated: number[];
  lossesAgainstRated: number[];
}) {
  const wins = [...winsAgainstRated]
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a);

  const losses = [...lossesAgainstRated]
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  const highestWin = wins.length > 0 ? wins[0] : null;
  const lowestLoss = losses.length > 0 ? losses[0] : null;

  if (wins.length > 0 && losses.length === 0 && highestWin !== null) {
    const validatedRating = Math.max(generatedEstimatedRating, highestWin);

    return {
      validatedEstimatedRating: validatedRating,
      wasCorrected: validatedRating !== generatedEstimatedRating,
      reason:
        validatedRating !== generatedEstimatedRating
          ? `Generated estimate was below highest opponent beaten. Corrected from ${generatedEstimatedRating} to ${validatedRating}.`
          : "Generated estimate is valid for all-wins case.",
    };
  }

  if (wins.length === 0 && losses.length > 0 && lowestLoss !== null) {
    const validatedRating = Math.min(generatedEstimatedRating, lowestLoss);

    return {
      validatedEstimatedRating: validatedRating,
      wasCorrected: validatedRating !== generatedEstimatedRating,
      reason:
        validatedRating !== generatedEstimatedRating
          ? `Generated estimate was above lowest opponent lost to. Corrected from ${generatedEstimatedRating} to ${validatedRating}.`
          : "Generated estimate is valid for all-losses case.",
    };
  }

  return {
    validatedEstimatedRating: generatedEstimatedRating,
    wasCorrected: false,
    reason: "Estimated rating validation is not required for mixed result or no-rated-match case.",
  };
}
