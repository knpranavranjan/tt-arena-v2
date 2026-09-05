import type { SpecialAdjustmentInput, SpecialAdjustmentOutput, SpecialAdjustmentStep } from "./types";

function exactMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function roundedMean(values: number[]): number {
  return Math.round(exactMean(values));
}

function formatMean(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function cleanRatings(values: number[], order: "ASC" | "DESC"): number[] {
  const cleaned = [...values].filter((value) => Number.isFinite(value) && value > 0);

  if (order === "ASC") {
    return cleaned.sort((a, b) => a - b);
  }

  return cleaned.sort((a, b) => b - a);
}

function addStep({
  steps,
  step,
  includedValues,
  excludedValues,
  comparisonMean,
  explanation,
}: {
  steps: SpecialAdjustmentStep[];
  step: string;
  includedValues: number[];
  excludedValues: number[];
  comparisonMean: number | null;
  explanation: string;
}) {
  steps.push({
    step,
    includedValues: [...includedValues],
    excludedValues: [...excludedValues],
    currentMean: exactMean(includedValues),
    comparisonMean,
    explanation,
  });
}

/**
 * The classic USATT "Special Adjustment": sort wins descending / losses
 * ascending, pair them off from the top, and average the values that survive
 * pairing. Two deliberate "TT Arena" extensions (below) govern what happens to
 * whichever side has entries left over once pairing stops.
 */
export function calculateSpecialAdjustment(input: SpecialAdjustmentInput): SpecialAdjustmentOutput {
  const sortedWins = cleanRatings(input.wins, "DESC");
  const sortedLosses = cleanRatings(input.losses, "ASC");

  const includedValues: number[] = [];
  const excludedValues: number[] = [];
  const steps: SpecialAdjustmentStep[] = [];

  if (sortedWins.length === 0) {
    throw new Error("Special Adjustment requires at least one win.");
  }

  if (sortedLosses.length === 0) {
    const bestTwoWins = sortedWins.slice(0, 2);

    if (bestTwoWins.length < 2) {
      throw new Error("No-loss Special Adjustment requires at least two wins.");
    }

    includedValues.push(...bestTwoWins);
    excludedValues.push(...sortedWins.slice(2));

    addStep({
      steps,
      step: "NO_LOSSES_AVERAGE_TWO_BEST_WINS",
      includedValues,
      excludedValues,
      comparisonMean: null,
      explanation:
        "Player has no losses. Adjusted rating is the rounded average of the two best wins.",
    });

    return {
      adjustedRating: roundedMean(includedValues),
      sortedWins,
      sortedLosses,
      includedValues,
      excludedValues,
      steps,
    };
  }

  let winIndex = 0;
  let lossIndex = 0;
  let stoppedPairing = false;

  while (winIndex < sortedWins.length && lossIndex < sortedLosses.length && !stoppedPairing) {
    const win = sortedWins[winIndex];
    const loss = sortedLosses[lossIndex];

    if (loss > win) {
      excludedValues.push(win, loss);

      addStep({
        steps,
        step: `PAIR_${winIndex + 1}_STOP_LOSS_HIGHER_THAN_WIN`,
        includedValues,
        excludedValues,
        comparisonMean: includedValues.length > 0 ? exactMean(includedValues) : null,
        explanation: `Loss ${loss} is higher than win ${win}. This pair is excluded and paired processing stops.`,
      });

      winIndex += 1;
      lossIndex += 1;
      stoppedPairing = true;
      break;
    }

    if (includedValues.length === 0) {
      includedValues.push(win, loss);

      addStep({
        steps,
        step: `PAIR_${winIndex + 1}_FIRST_PAIR_INCLUDED`,
        includedValues,
        excludedValues,
        comparisonMean: null,
        explanation: `First pair included: win ${win}, loss ${loss}. Current mean is ${formatMean(
          exactMean(includedValues),
        )}.`,
      });

      winIndex += 1;
      lossIndex += 1;
      continue;
    }

    const comparisonMean = exactMean(includedValues);

    if (win > comparisonMean && loss > comparisonMean) {
      includedValues.push(win);
      excludedValues.push(loss);

      addStep({
        steps,
        step: `PAIR_${winIndex + 1}_LOSS_EXCLUDED`,
        includedValues,
        excludedValues,
        comparisonMean,
        explanation: `Before this pair, comparison mean was ${formatMean(
          comparisonMean,
        )}. Both win ${win} and loss ${loss} are above the comparison mean. Include win, exclude loss, then stop paired processing.`,
      });

      winIndex += 1;
      lossIndex += 1;
      stoppedPairing = true;
      break;
    }

    if (win < comparisonMean && loss < comparisonMean) {
      includedValues.push(loss);
      excludedValues.push(win);

      addStep({
        steps,
        step: `PAIR_${winIndex + 1}_WIN_EXCLUDED`,
        includedValues,
        excludedValues,
        comparisonMean,
        explanation: `Before this pair, comparison mean was ${formatMean(
          comparisonMean,
        )}. Both win ${win} and loss ${loss} are below the comparison mean. Include loss, exclude win, then stop paired processing.`,
      });

      winIndex += 1;
      lossIndex += 1;
      stoppedPairing = true;
      break;
    }

    includedValues.push(win, loss);

    addStep({
      steps,
      step: `PAIR_${winIndex + 1}_BOTH_INCLUDED`,
      includedValues,
      excludedValues,
      comparisonMean,
      explanation: `Before this pair, comparison mean was ${formatMean(
        comparisonMean,
      )}. Pair included: win ${win}, loss ${loss}.`,
    });

    winIndex += 1;
    lossIndex += 1;
  }

  /*
    TT Arena extension:
    If losses are finished and wins remain, compare every remaining win
    against the SAME anchor mean that existed before remaining-win processing.

    Example:
    Wins: 2565, 2400, 1200, 1200
    Losses: 1200

    First pair mean = 1882.5

    Remaining win 2400 is checked against 1882.5.
    Remaining win 1200 is also checked against 1882.5,
    not against the newly updated mean 2055.
  */
  if (!stoppedPairing && winIndex < sortedWins.length) {
    const anchorMean = exactMean(includedValues);

    while (winIndex < sortedWins.length) {
      const win = sortedWins[winIndex];

      if (win >= anchorMean) {
        includedValues.push(win);

        addStep({
          steps,
          step: `REMAINING_WIN_${winIndex + 1}_INCLUDED`,
          includedValues,
          excludedValues,
          comparisonMean: anchorMean,
          explanation: `Remaining win ${win} is greater than or equal to anchor mean ${formatMean(
            anchorMean,
          )}, so it is included. Current mean becomes ${formatMean(
            exactMean(includedValues),
          )}, but next remaining wins are still compared against the same anchor mean ${formatMean(
            anchorMean,
          )}.`,
        });

        winIndex += 1;
      } else {
        excludedValues.push(...sortedWins.slice(winIndex));

        addStep({
          steps,
          step: `REMAINING_WIN_${winIndex + 1}_STOP`,
          includedValues,
          excludedValues,
          comparisonMean: anchorMean,
          explanation: `Remaining win ${win} is below anchor mean ${formatMean(
            anchorMean,
          )}. This win and all remaining wins are excluded.`,
        });

        break;
      }
    }
  }

  /*
    TT Arena extension:
    If wins are finished and losses remain, compare every remaining loss
    against the SAME anchor mean that existed before remaining-loss processing.
  */
  if (!stoppedPairing && lossIndex < sortedLosses.length) {
    const anchorMean = exactMean(includedValues);

    while (lossIndex < sortedLosses.length) {
      const loss = sortedLosses[lossIndex];

      if (loss <= anchorMean) {
        includedValues.push(loss);

        addStep({
          steps,
          step: `REMAINING_LOSS_${lossIndex + 1}_INCLUDED`,
          includedValues,
          excludedValues,
          comparisonMean: anchorMean,
          explanation: `Remaining loss ${loss} is less than or equal to anchor mean ${formatMean(
            anchorMean,
          )}, so it is included. Current mean becomes ${formatMean(
            exactMean(includedValues),
          )}, but next remaining losses are still compared against the same anchor mean ${formatMean(
            anchorMean,
          )}.`,
        });

        lossIndex += 1;
      } else {
        excludedValues.push(...sortedLosses.slice(lossIndex));

        addStep({
          steps,
          step: `REMAINING_LOSS_${lossIndex + 1}_STOP`,
          includedValues,
          excludedValues,
          comparisonMean: anchorMean,
          explanation: `Remaining loss ${loss} is above anchor mean ${formatMean(
            anchorMean,
          )}. This loss and all remaining losses are excluded.`,
        });

        break;
      }
    }
  }

  return {
    adjustedRating: roundedMean(includedValues),
    sortedWins,
    sortedLosses,
    includedValues,
    excludedValues,
    steps,
  };
}
