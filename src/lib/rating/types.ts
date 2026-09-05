/**
 * The rating algorithm — ported from the standalone `rating-algorithm-tester`
 * project (a USATT-style rating-point-chart system with two custom "TT Arena"
 * extensions, see specialAdjustment.ts). Framework-free, pure TypeScript, so
 * it runs the same on every platform — nothing about it depended on the
 * original Vite shell; that shell just couldn't build on Windows because its
 * node_modules carried a macOS-only native binding.
 */

export type MatchResult = "WIN" | "LOSS";

export type RatingChartResult = {
  ratingDifference: number;
  higherRatedWinsPoints: number;
  lowerRatedWinsPoints: number;
};

export type MatchDeltaInput = {
  playerRating: number;
  opponentRating: number;
  result: MatchResult;
};

export type MatchDeltaOutput = {
  playerRating: number;
  opponentRating: number;
  result: MatchResult;
  ratingDifference: number;
  playerWasHigherRated: boolean;
  points: number;
  explanation: string;
};

export type SpecialAdjustmentInput = {
  wins: number[];
  losses: number[];
};

export type SpecialAdjustmentStep = {
  step: string;
  includedValues: number[];
  excludedValues: number[];
  currentMean: number;
  comparisonMean: number | null;
  explanation: string;
};

export type SpecialAdjustmentOutput = {
  adjustedRating: number;
  sortedWins: number[];
  sortedLosses: number[];
  includedValues: number[];
  excludedValues: number[];
  steps: SpecialAdjustmentStep[];
};
