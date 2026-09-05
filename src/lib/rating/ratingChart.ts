import type { MatchDeltaInput, MatchDeltaOutput, RatingChartResult } from "./types";

const ratingChart = [
  { min: 0, max: 12, higherRatedWins: 8, lowerRatedWins: 8 },
  { min: 13, max: 37, higherRatedWins: 7, lowerRatedWins: 10 },
  { min: 38, max: 62, higherRatedWins: 6, lowerRatedWins: 13 },
  { min: 63, max: 87, higherRatedWins: 5, lowerRatedWins: 16 },
  { min: 88, max: 112, higherRatedWins: 4, lowerRatedWins: 20 },
  { min: 113, max: 137, higherRatedWins: 3, lowerRatedWins: 25 },
  { min: 138, max: 162, higherRatedWins: 2, lowerRatedWins: 30 },
  { min: 163, max: 187, higherRatedWins: 2, lowerRatedWins: 35 },
  { min: 188, max: 212, higherRatedWins: 1, lowerRatedWins: 40 },
  { min: 213, max: 237, higherRatedWins: 1, lowerRatedWins: 45 },
  { min: 238, max: Number.POSITIVE_INFINITY, higherRatedWins: 0, lowerRatedWins: 50 },
];

export function getRatingChartResult(ratingDifference: number): RatingChartResult {
  const absoluteDifference = Math.abs(ratingDifference);

  const row = ratingChart.find(
    (item) => absoluteDifference >= item.min && absoluteDifference <= item.max,
  );

  if (!row) {
    throw new Error("Rating difference did not match the rating chart.");
  }

  return {
    ratingDifference: absoluteDifference,
    higherRatedWinsPoints: row.higherRatedWins,
    lowerRatedWinsPoints: row.lowerRatedWins,
  };
}

export function calculateMatchDelta(input: MatchDeltaInput): MatchDeltaOutput {
  const ratingDifference = Math.abs(input.playerRating - input.opponentRating);
  const chartResult = getRatingChartResult(ratingDifference);
  const playerWasHigherRated = input.playerRating >= input.opponentRating;

  let points = 0;
  let explanation = "";

  if (input.result === "WIN") {
    if (playerWasHigherRated) {
      points = chartResult.higherRatedWinsPoints;
      explanation = `Player was higher rated and won. Gain = ${points}.`;
    } else {
      points = chartResult.lowerRatedWinsPoints;
      explanation = `Player was lower rated and won. Upset win gain = ${points}.`;
    }
  }

  if (input.result === "LOSS") {
    if (playerWasHigherRated) {
      points = -chartResult.lowerRatedWinsPoints;
      explanation = `Player was higher rated and lost. Upset loss = ${Math.abs(points)}.`;
    } else {
      points = -chartResult.higherRatedWinsPoints;
      explanation = `Player was lower rated and lost. Expected loss = ${Math.abs(points)}.`;
    }
  }

  return {
    playerRating: input.playerRating,
    opponentRating: input.opponentRating,
    result: input.result,
    ratingDifference,
    playerWasHigherRated,
    points,
    explanation,
  };
}
