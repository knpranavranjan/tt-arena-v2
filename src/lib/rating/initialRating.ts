import { calculateSpecialAdjustment } from "./specialAdjustment";
import type { SpecialAdjustmentStep } from "./types";
import {
  calculateProgrammaticEstimatedRating,
  validateEstimatedRatingForTournamentResult,
  type EstimatedRatingInput,
  type EstimatedRatingResult,
} from "./estimatedRating";

export type InitialRatingCase =
  | "ALL_WINS_ESTIMATE_REQUIRED"
  | "ALL_LOSSES_ESTIMATE_REQUIRED"
  | "MIXED_WORST_LOSS_ABOVE_BEST_WIN"
  | "MIXED_SPECIAL_ADJUSTMENT"
  | "NO_RATED_MATCHES"
  | "INVALID_ESTIMATE";

export type InitialRatingResult = {
  initialRating: number | null;
  caseType: InitialRatingCase;
  isValid: boolean;
  bestWin: number | null;
  worstLoss: number | null;
  highestWin: number | null;
  lowestLoss: number | null;
  reason: string;
  estimatedRatingUsed: number | null;
  generatedEstimate?: EstimatedRatingResult;
  estimateWasCorrected?: boolean;
  estimateValidationReason?: string;

  specialAdjustmentIncludedValues?: number[];
  specialAdjustmentExcludedValues?: number[];
  specialAdjustmentSteps?: SpecialAdjustmentStep[];
};

function minimumRating(value: number) {
  return Math.max(200, Math.round(value));
}

function cleanRatings(values: number[], sortType: "ASC" | "DESC") {
  const cleaned = [...values].filter((value) => Number.isFinite(value) && value > 0);

  if (sortType === "ASC") {
    return cleaned.sort((a, b) => a - b);
  }

  return cleaned.sort((a, b) => b - a);
}

function emptySpecialAdjustmentData() {
  return {
    specialAdjustmentIncludedValues: [],
    specialAdjustmentExcludedValues: [],
    specialAdjustmentSteps: [],
  };
}

function resolveEstimatedRating({
  manualEstimatedRating,
  estimatedRatingProfile,
  wins,
  losses,
}: {
  manualEstimatedRating: number | null;
  estimatedRatingProfile?: EstimatedRatingInput | null;
  wins: number[];
  losses: number[];
}) {
  if (manualEstimatedRating !== null && manualEstimatedRating > 0) {
    const validation = validateEstimatedRatingForTournamentResult({
      generatedEstimatedRating: manualEstimatedRating,
      winsAgainstRated: wins,
      lossesAgainstRated: losses,
    });

    return {
      estimatedRatingUsed: validation.validatedEstimatedRating,
      generatedEstimate: undefined,
      estimateWasCorrected: validation.wasCorrected,
      estimateValidationReason: validation.reason,
    };
  }

  if (estimatedRatingProfile) {
    const generatedEstimate = calculateProgrammaticEstimatedRating(estimatedRatingProfile);

    const validation = validateEstimatedRatingForTournamentResult({
      generatedEstimatedRating: generatedEstimate.estimatedRating,
      winsAgainstRated: wins,
      lossesAgainstRated: losses,
    });

    return {
      estimatedRatingUsed: validation.validatedEstimatedRating,
      generatedEstimate,
      estimateWasCorrected: validation.wasCorrected,
      estimateValidationReason: validation.reason,
    };
  }

  return {
    estimatedRatingUsed: null,
    generatedEstimate: undefined,
    estimateWasCorrected: false,
    estimateValidationReason: "No estimated rating was provided or generated.",
  };
}

export function calculateInitialRatingForUnratedPlayer({
  winsAgainstRated,
  lossesAgainstRated,
  estimatedRating,
  estimatedRatingProfile,
}: {
  winsAgainstRated: number[];
  lossesAgainstRated: number[];
  estimatedRating: number | null;
  estimatedRatingProfile?: EstimatedRatingInput | null;
}): InitialRatingResult {
  const wins = cleanRatings(winsAgainstRated, "DESC");
  const losses = cleanRatings(lossesAgainstRated, "ASC");

  const bestWin = wins.length > 0 ? wins[0] : null;
  const worstLoss = losses.length > 0 ? losses[0] : null;

  const highestWin = bestWin;
  const lowestLoss = worstLoss;

  if (wins.length === 0 && losses.length === 0) {
    return {
      initialRating: null,
      caseType: "NO_RATED_MATCHES",
      isValid: false,
      bestWin,
      worstLoss,
      highestWin,
      lowestLoss,
      estimatedRatingUsed: null,
      ...emptySpecialAdjustmentData(),
      reason:
        "Initial rating cannot be calculated because the unrated player has no matches against rated players.",
    };
  }

  if (wins.length > 0 && losses.length === 0) {
    const resolvedEstimate = resolveEstimatedRating({
      manualEstimatedRating: estimatedRating,
      estimatedRatingProfile,
      wins,
      losses,
    });

    if (resolvedEstimate.estimatedRatingUsed === null) {
      return {
        initialRating: null,
        caseType: "ALL_WINS_ESTIMATE_REQUIRED",
        isValid: false,
        bestWin,
        worstLoss,
        highestWin,
        lowestLoss,
        estimatedRatingUsed: null,
        generatedEstimate: resolvedEstimate.generatedEstimate,
        estimateWasCorrected: resolvedEstimate.estimateWasCorrected,
        estimateValidationReason: resolvedEstimate.estimateValidationReason,
        ...emptySpecialAdjustmentData(),
        reason:
          "Estimated rating is required because the unrated player won all matches against rated players.",
      };
    }

    return {
      initialRating: minimumRating(resolvedEstimate.estimatedRatingUsed),
      caseType: "ALL_WINS_ESTIMATE_REQUIRED",
      isValid: true,
      bestWin,
      worstLoss,
      highestWin,
      lowestLoss,
      estimatedRatingUsed: resolvedEstimate.estimatedRatingUsed,
      generatedEstimate: resolvedEstimate.generatedEstimate,
      estimateWasCorrected: resolvedEstimate.estimateWasCorrected,
      estimateValidationReason: resolvedEstimate.estimateValidationReason,
      ...emptySpecialAdjustmentData(),
      reason: "Estimated rating is used because the unrated player won all matches against rated players.",
    };
  }

  if (wins.length === 0 && losses.length > 0) {
    const resolvedEstimate = resolveEstimatedRating({
      manualEstimatedRating: estimatedRating,
      estimatedRatingProfile,
      wins,
      losses,
    });

    if (resolvedEstimate.estimatedRatingUsed === null) {
      return {
        initialRating: null,
        caseType: "ALL_LOSSES_ESTIMATE_REQUIRED",
        isValid: false,
        bestWin,
        worstLoss,
        highestWin,
        lowestLoss,
        estimatedRatingUsed: null,
        generatedEstimate: resolvedEstimate.generatedEstimate,
        estimateWasCorrected: resolvedEstimate.estimateWasCorrected,
        estimateValidationReason: resolvedEstimate.estimateValidationReason,
        ...emptySpecialAdjustmentData(),
        reason:
          "Estimated rating is required because the unrated player lost all matches against rated players.",
      };
    }

    return {
      initialRating: minimumRating(resolvedEstimate.estimatedRatingUsed),
      caseType: "ALL_LOSSES_ESTIMATE_REQUIRED",
      isValid: true,
      bestWin,
      worstLoss,
      highestWin,
      lowestLoss,
      estimatedRatingUsed: resolvedEstimate.estimatedRatingUsed,
      generatedEstimate: resolvedEstimate.generatedEstimate,
      estimateWasCorrected: resolvedEstimate.estimateWasCorrected,
      estimateValidationReason: resolvedEstimate.estimateValidationReason,
      ...emptySpecialAdjustmentData(),
      reason: "Estimated rating is used because the unrated player lost all matches against rated players.",
    };
  }

  if (bestWin !== null && worstLoss !== null && worstLoss >= bestWin) {
    return {
      initialRating: minimumRating(bestWin),
      caseType: "MIXED_WORST_LOSS_ABOVE_BEST_WIN",
      isValid: true,
      bestWin,
      worstLoss,
      highestWin,
      lowestLoss,
      estimatedRatingUsed: null,
      ...emptySpecialAdjustmentData(),
      reason:
        "Estimated rating is ignored. Player has both wins and losses. Since worst loss is greater than or equal to best win, initial rating is the best win rating.",
    };
  }

  const specialAdjustment = calculateSpecialAdjustment({ wins, losses });

  return {
    initialRating: minimumRating(specialAdjustment.adjustedRating),
    caseType: "MIXED_SPECIAL_ADJUSTMENT",
    isValid: true,
    bestWin,
    worstLoss,
    highestWin,
    lowestLoss,
    estimatedRatingUsed: null,
    specialAdjustmentIncludedValues: specialAdjustment.includedValues,
    specialAdjustmentExcludedValues: specialAdjustment.excludedValues,
    specialAdjustmentSteps: specialAdjustment.steps,
    reason:
      "Estimated rating is ignored. Player has both wins and losses, and worst loss is below best win, so Special Adjustment formula is used.",
  };
}
