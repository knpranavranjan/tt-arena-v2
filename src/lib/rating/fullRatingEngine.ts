import { calculateMatchDelta } from "./ratingChart";
import { calculateSpecialAdjustment } from "./specialAdjustment";
import { calculateStandardAdjustment } from "./standardAdjustment";
import { calculateInitialRatingForUnratedPlayer } from "./initialRating";
import { NEUTRAL_ESTIMATED_RATING_PROFILE, type EstimatedRatingInput } from "./estimatedRating";
import type { SpecialAdjustmentStep } from "./types";

export type FullEnginePlayerInput = {
  id: string;
  name: string;
  rating: number | null;
  /**
   * tt-arena adaptation: optional, unlike the original tester. Every tt-arena
   * player already carries a `rating`, so this profile is only ever consulted
   * for a genuinely unrated player — defaults to a neutral profile when
   * omitted rather than requiring every caller to invent one.
   */
  estimatedRatingProfile?: EstimatedRatingInput;
};

export type FullEngineMatchInput = {
  id: string;
  playerAId: string;
  playerBId: string;
  winnerId: string;
};

export type MatchDeltaBreakdown = {
  matchId: string;
  opponentId: string;
  opponentName: string;
  playerRatingUsed: number;
  opponentRatingUsed: number;
  result: "WIN" | "LOSS";
  points: number;
  originalPoints: number;
  explanation: string;
  lowRatingProtectionApplied: boolean;
};

export type PassOneResult = {
  eligible: boolean;
  netPoints: number;
  twentyPointWinsCount: number;
  fiftyPointWinsCount: number;
  fiftyPointWinDiffs: number[];
  winsAgainstRated: number[];
  lossesAgainstRated: number[];
  matchDeltas: MatchDeltaBreakdown[];
};

export type StandardAdjustmentCheck = {
  qualifies: boolean;
  adjustedRating: number;
  reason: string;
};

export type SpecialAdjustmentCheck = {
  applies: boolean;
  triggerReasons: string[];
  adjustedRating: number | null;
  includedValues: number[];
  excludedValues: number[];
  steps: SpecialAdjustmentStep[];
};

export type PassTwoResult = {
  applicable: boolean;
  initialRating: number | null;
  caseType: string;
  isValid: boolean;
  bestWin: number | null;
  worstLoss: number | null;
  estimatedRatingUsed: number | null;
  generatedEstimatedRating: number | null;
  estimateWasCorrected: boolean;
  estimateValidationReason: string;
  reason: string;

  specialAdjustmentIncludedValues: number[];
  specialAdjustmentExcludedValues: number[];
  specialAdjustmentSteps: SpecialAdjustmentStep[];

  winsAgainstRated: number[];
  lossesAgainstRated: number[];
};

export type PlayerFullCalculation = {
  playerId: string;
  name: string;
  wasRatedBeforeTournament: boolean;
  preTournamentRating: number | null;

  passOne: PassOneResult;
  standardAdjustment: StandardAdjustmentCheck;
  specialAdjustment: SpecialAdjustmentCheck;

  adjustedRatingAfterPassOne: number | null;
  passTwo: PassTwoResult;

  startingRatingForFinalPass: number | null;
  finalPassDeltas: MatchDeltaBreakdown[];
  finalPassNetPoints: number;
  finalRating: number | null;
};

export type FullTournamentCalculationResult = {
  players: PlayerFullCalculation[];
  warnings: string[];
  calculationNotes: string[];
};

function getPlayer(players: FullEnginePlayerInput[], playerId: string) {
  const player = players.find((item) => item.id === playerId);

  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  return player;
}

function getOpponentId(match: FullEngineMatchInput, playerId: string) {
  if (match.playerAId === playerId) {
    return match.playerBId;
  }

  if (match.playerBId === playerId) {
    return match.playerAId;
  }

  throw new Error(`Player ${playerId} is not part of match ${match.id}`);
}

function didPlayerWin(match: FullEngineMatchInput, playerId: string) {
  return match.winnerId === playerId;
}

function getValidMatches(matches: FullEngineMatchInput[]) {
  return matches.filter((match) => {
    return (
      match.playerAId &&
      match.playerBId &&
      match.winnerId &&
      match.playerAId !== match.playerBId &&
      (match.winnerId === match.playerAId || match.winnerId === match.playerBId)
    );
  });
}

function emptySpecialAdjustmentCheck(): SpecialAdjustmentCheck {
  return {
    applies: false,
    triggerReasons: [],
    adjustedRating: null,
    includedValues: [],
    excludedValues: [],
    steps: [],
  };
}

function emptyPassTwoSpecialAdjustmentData() {
  return {
    specialAdjustmentIncludedValues: [],
    specialAdjustmentExcludedValues: [],
    specialAdjustmentSteps: [],
  };
}

function shouldApplySpecialAdjustment(passOne: PassOneResult) {
  const triggerReasons: string[] = [];

  if (passOne.netPoints >= 150) {
    triggerReasons.push("Net gain is 150 points or more.");
  }

  if (passOne.fiftyPointWinsCount >= 3) {
    triggerReasons.push("Player has three or more 50-point wins.");
  }

  const topTwoFiftyPointDiffs = [...passOne.fiftyPointWinDiffs].sort((a, b) => b - a).slice(0, 2);
  const topTwoDiffTotal = topTwoFiftyPointDiffs.reduce((sum, value) => sum + value, 0);

  if (topTwoFiftyPointDiffs.length >= 2 && topTwoDiffTotal >= 700) {
    triggerReasons.push(
      "Player has two 50-point wins with total rating differential of 700 or more.",
    );
  }

  return triggerReasons;
}

function calculatePlayerMatchDelta({
  player,
  opponent,
  match,
  playerRatingUsed,
  opponentRatingUsed,
  applyLowRatingProtection,
}: {
  player: FullEnginePlayerInput;
  opponent: FullEnginePlayerInput;
  match: FullEngineMatchInput;
  playerRatingUsed: number;
  opponentRatingUsed: number;
  applyLowRatingProtection: boolean;
}): MatchDeltaBreakdown {
  const result = didPlayerWin(match, player.id) ? "WIN" : "LOSS";

  const delta = calculateMatchDelta({
    playerRating: playerRatingUsed,
    opponentRating: opponentRatingUsed,
    result,
  });

  let points = delta.points;
  let explanation = delta.explanation;
  let lowRatingProtectionApplied = false;

  if (applyLowRatingProtection && playerRatingUsed < 100 && result === "LOSS" && points < -3) {
    points = -3;
    lowRatingProtectionApplied = true;
    explanation = `${delta.explanation} Low-rating protection applied because player rating is below 100, so loss is capped at -3.`;
  }

  return {
    matchId: match.id,
    opponentId: opponent.id,
    opponentName: opponent.name,
    playerRatingUsed,
    opponentRatingUsed,
    result,
    points,
    originalPoints: delta.points,
    explanation,
    lowRatingProtectionApplied,
  };
}

/**
 * The complete tournament rating calculation:
 *  Pass 1    — net points + Standard/Special Adjustment eligibility for
 *              already-rated players, using only matches between two
 *              already-rated players.
 *  Pass 2    — initial ratings for unrated players, from their matches
 *              against the (possibly adjusted) rated players.
 *  Final Pass — every valid match recalculated from the settled starting
 *              ratings, with low-rating protection capping a loss at -3 once
 *              a player's starting rating is below 100.
 */
export function calculateFullTournamentRating({
  players,
  matches,
}: {
  players: FullEnginePlayerInput[];
  matches: FullEngineMatchInput[];
}): FullTournamentCalculationResult {
  const warnings: string[] = [];
  const validMatches = getValidMatches(matches);

  const preRatingMap = new Map<string, number | null>();
  const adjustedRatingMap = new Map<string, number | null>();
  const startingRatingMap = new Map<string, number | null>();

  for (const player of players) {
    preRatingMap.set(player.id, player.rating);
  }

  const passOneMap = new Map<string, PassOneResult>();
  const standardAdjustmentMap = new Map<string, StandardAdjustmentCheck>();
  const specialAdjustmentMap = new Map<string, SpecialAdjustmentCheck>();

  /**
   * PASS 1:
   * Only already-rated players are evaluated here.
   * Only matches between two already-rated players are used.
   */
  for (const player of players) {
    const playerRating = preRatingMap.get(player.id) ?? null;

    const passOne: PassOneResult = {
      eligible: playerRating !== null,
      netPoints: 0,
      twentyPointWinsCount: 0,
      fiftyPointWinsCount: 0,
      fiftyPointWinDiffs: [],
      winsAgainstRated: [],
      lossesAgainstRated: [],
      matchDeltas: [],
    };

    if (playerRating !== null) {
      const playerMatches = validMatches.filter(
        (match) => match.playerAId === player.id || match.playerBId === player.id,
      );

      for (const match of playerMatches) {
        const opponentId = getOpponentId(match, player.id);
        const opponent = getPlayer(players, opponentId);
        const opponentRating = preRatingMap.get(opponent.id) ?? null;

        if (opponentRating === null) {
          continue;
        }

        const delta = calculatePlayerMatchDelta({
          player,
          opponent,
          match,
          playerRatingUsed: playerRating,
          opponentRatingUsed: opponentRating,
          applyLowRatingProtection: false,
        });

        passOne.netPoints += delta.points;
        passOne.matchDeltas.push(delta);

        if (delta.result === "WIN") {
          passOne.winsAgainstRated.push(opponentRating);

          if (delta.points >= 20) {
            passOne.twentyPointWinsCount += 1;
          }

          if (delta.points >= 50) {
            passOne.fiftyPointWinsCount += 1;
            passOne.fiftyPointWinDiffs.push(Math.abs(playerRating - opponentRating));
          }
        } else {
          passOne.lossesAgainstRated.push(opponentRating);
        }
      }
    }

    passOneMap.set(player.id, passOne);

    const standard =
      playerRating === null
        ? {
            qualifies: false,
            adjustedRating: 0,
            reason: "Player is unrated before tournament, so Standard Adjustment is not checked in Pass 1.",
          }
        : calculateStandardAdjustment({
            preRating: playerRating,
            netPoints: passOne.netPoints,
            twentyPointWinsCount: passOne.twentyPointWinsCount,
          });

    standardAdjustmentMap.set(player.id, standard);

    const specialTriggerReasons = playerRating === null ? [] : shouldApplySpecialAdjustment(passOne);

    let special: SpecialAdjustmentCheck = {
      ...emptySpecialAdjustmentCheck(),
      triggerReasons: specialTriggerReasons,
    };

    if (playerRating !== null && specialTriggerReasons.length > 0) {
      try {
        const specialResult = calculateSpecialAdjustment({
          wins: passOne.winsAgainstRated,
          losses: passOne.lossesAgainstRated,
        });

        special = {
          applies: true,
          triggerReasons: specialTriggerReasons,
          adjustedRating: specialResult.adjustedRating,
          includedValues: specialResult.includedValues,
          excludedValues: specialResult.excludedValues,
          steps: specialResult.steps,
        };
      } catch (error) {
        warnings.push(
          `${player.name}: Special Adjustment triggered but could not be calculated. ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    specialAdjustmentMap.set(player.id, special);

    if (playerRating === null) {
      adjustedRatingMap.set(player.id, null);
    } else if (special.applies && special.adjustedRating !== null) {
      adjustedRatingMap.set(player.id, special.adjustedRating);
    } else if (standard.qualifies) {
      adjustedRatingMap.set(player.id, standard.adjustedRating);
    } else {
      adjustedRatingMap.set(player.id, playerRating);
    }
  }

  /**
   * PASS 2:
   * Unrated players receive initial ratings.
   * Estimated rating is generated programmatically only when required.
   */
  const passTwoMap = new Map<string, PassTwoResult>();

  for (const player of players) {
    const preRating = preRatingMap.get(player.id) ?? null;

    if (preRating !== null) {
      const passTwo: PassTwoResult = {
        applicable: false,
        initialRating: null,
        caseType: "ALREADY_RATED",
        isValid: true,
        bestWin: null,
        worstLoss: null,
        estimatedRatingUsed: null,
        generatedEstimatedRating: null,
        estimateWasCorrected: false,
        estimateValidationReason: "Player already had a rating before tournament.",
        reason: "Pass 2 is not applicable for already-rated players.",
        ...emptyPassTwoSpecialAdjustmentData(),
        winsAgainstRated: [],
        lossesAgainstRated: [],
      };

      passTwoMap.set(player.id, passTwo);
      continue;
    }

    const winsAgainstRated: number[] = [];
    const lossesAgainstRated: number[] = [];

    const playerMatches = validMatches.filter(
      (match) => match.playerAId === player.id || match.playerBId === player.id,
    );

    for (const match of playerMatches) {
      const opponentId = getOpponentId(match, player.id);
      const opponent = getPlayer(players, opponentId);
      const opponentAdjustedRating = adjustedRatingMap.get(opponent.id) ?? null;

      if (opponentAdjustedRating === null) {
        continue;
      }

      if (didPlayerWin(match, player.id)) {
        winsAgainstRated.push(opponentAdjustedRating);
      } else {
        lossesAgainstRated.push(opponentAdjustedRating);
      }
    }

    const sortedWinsAgainstRated = [...winsAgainstRated].sort((a, b) => b - a);
    const sortedLossesAgainstRated = [...lossesAgainstRated].sort((a, b) => a - b);

    const initial = calculateInitialRatingForUnratedPlayer({
      winsAgainstRated: sortedWinsAgainstRated,
      lossesAgainstRated: sortedLossesAgainstRated,
      estimatedRating: null,
      estimatedRatingProfile: player.estimatedRatingProfile ?? NEUTRAL_ESTIMATED_RATING_PROFILE,
    });

    const passTwo: PassTwoResult = {
      applicable: true,
      initialRating: initial.initialRating,
      caseType: initial.caseType,
      isValid: initial.isValid,
      bestWin: initial.bestWin,
      worstLoss: initial.worstLoss,
      estimatedRatingUsed: initial.estimatedRatingUsed,
      generatedEstimatedRating: initial.generatedEstimate?.estimatedRating ?? null,
      estimateWasCorrected: initial.estimateWasCorrected ?? false,
      estimateValidationReason: initial.estimateValidationReason ?? "Estimate validation not required.",
      reason: initial.reason,
      specialAdjustmentIncludedValues: initial.specialAdjustmentIncludedValues ?? [],
      specialAdjustmentExcludedValues: initial.specialAdjustmentExcludedValues ?? [],
      specialAdjustmentSteps: initial.specialAdjustmentSteps ?? [],
      winsAgainstRated: sortedWinsAgainstRated,
      lossesAgainstRated: sortedLossesAgainstRated,
    };

    passTwoMap.set(player.id, passTwo);

    if (initial.isValid && initial.initialRating !== null) {
      startingRatingMap.set(player.id, initial.initialRating);
    } else {
      startingRatingMap.set(player.id, null);
      warnings.push(`${player.name}: ${initial.reason}`);
    }
  }

  /**
   * Starting ratings for final pass:
   * Rated players use adjusted rating from Pass 1.
   * Unrated players use initial rating from Pass 2.
   */
  for (const player of players) {
    const preRating = preRatingMap.get(player.id) ?? null;

    if (preRating !== null) {
      startingRatingMap.set(player.id, adjustedRatingMap.get(player.id) ?? null);
    }
  }

  /**
   * FINAL PASS:
   * All valid matches are processed using fixed starting ratings.
   */
  const finalPlayers: PlayerFullCalculation[] = players.map((player) => {
    const preRating = preRatingMap.get(player.id) ?? null;
    const startingRating = startingRatingMap.get(player.id) ?? null;
    const passOne = passOneMap.get(player.id)!;
    const standard = standardAdjustmentMap.get(player.id)!;
    const special = specialAdjustmentMap.get(player.id)!;
    const passTwo = passTwoMap.get(player.id)!;

    const finalPassDeltas: MatchDeltaBreakdown[] = [];
    let finalPassNetPoints = 0;

    if (startingRating !== null) {
      const playerMatches = validMatches.filter(
        (match) => match.playerAId === player.id || match.playerBId === player.id,
      );

      for (const match of playerMatches) {
        const opponentId = getOpponentId(match, player.id);
        const opponent = getPlayer(players, opponentId);
        const opponentStartingRating = startingRatingMap.get(opponent.id) ?? null;

        if (opponentStartingRating === null) {
          warnings.push(
            `${player.name}: Final pass skipped ${match.id} because ${opponent.name} has no starting rating.`,
          );
          continue;
        }

        const delta = calculatePlayerMatchDelta({
          player,
          opponent,
          match,
          playerRatingUsed: startingRating,
          opponentRatingUsed: opponentStartingRating,
          applyLowRatingProtection: true,
        });

        finalPassDeltas.push(delta);
        finalPassNetPoints += delta.points;
      }
    }

    const finalRating =
      startingRating === null ? null : Math.max(0, Math.round(startingRating + finalPassNetPoints));

    return {
      playerId: player.id,
      name: player.name,
      wasRatedBeforeTournament: preRating !== null,
      preTournamentRating: preRating,
      passOne,
      standardAdjustment: standard,
      specialAdjustment: special,
      adjustedRatingAfterPassOne: adjustedRatingMap.get(player.id) ?? null,
      passTwo,
      startingRatingForFinalPass: startingRating,
      finalPassDeltas,
      finalPassNetPoints,
      finalRating,
    };
  });

  return {
    players: finalPlayers,
    warnings,
    calculationNotes: [
      "Pass 1 uses only matches between already-rated players.",
      "Standard Adjustment applies when net gain is 60+, or net gain is 40+ with at least two 20+ point wins.",
      "Special Adjustment is checked after Pass 1 for rated players.",
      "Pass 2 calculates initial ratings for unrated players using matches against rated/adjusted players.",
      "If an unrated player has mixed wins/losses and worst loss is below best win, Pass 2 uses the Special Adjustment formula and displays the full step calculation.",
      "Initial ratings are protected with minimum 200 logic.",
      "Final Pass uses fixed starting ratings and applies all valid matches.",
      "Low-rating protection caps a loss at -3 when the player's starting rating is below 100.",
    ],
  };
}
