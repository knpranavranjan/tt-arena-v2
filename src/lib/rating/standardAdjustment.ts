export type StandardAdjustmentInput = {
  preRating: number;
  netPoints: number;
  twentyPointWinsCount: number;
};

export type StandardAdjustmentResult = {
  qualifies: boolean;
  adjustedRating: number;
  reason: string;
};

export function calculateStandardAdjustment({
  preRating,
  netPoints,
  twentyPointWinsCount,
}: StandardAdjustmentInput): StandardAdjustmentResult {
  const adjustedRating = preRating + netPoints;

  if (netPoints >= 60) {
    return {
      qualifies: true,
      adjustedRating,
      reason: "Player qualifies because net gain is 60 points or more.",
    };
  }

  if (netPoints >= 40 && twentyPointWinsCount >= 2) {
    return {
      qualifies: true,
      adjustedRating,
      reason:
        "Player qualifies because net gain is 40 points or more and has at least two 20+ point wins.",
    };
  }

  return {
    qualifies: false,
    adjustedRating: preRating,
    reason: "Player does not qualify for Standard Adjustment.",
  };
}
