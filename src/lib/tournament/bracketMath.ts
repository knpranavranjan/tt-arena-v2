/**
 * Bracket sizing maths.
 *
 * The organizer never calculates a bracket size. Any entrant count snaps up to
 * the nearest standard knockout size (2, 4, 8, 16, 32, 64, 128, 256, 512,
 * 1024, …) and round names are derived from how many players are still alive.
 *
 *   30 players -> Round of 32
 *   90 players -> Round of 128
 *   17 players -> Round of 32
 */

export function nextPowerOfTwo(n: number): number {
  if (!Number.isFinite(n) || n <= 1) return 2
  let p = 2
  while (p < n) p *= 2
  return p
}

export function isPowerOfTwo(n: number): boolean {
  return n >= 2 && (n & (n - 1)) === 0
}

export function log2(n: number): number {
  return Math.round(Math.log2(n))
}

export function roundCount(size: number): number {
  return log2(nextPowerOfTwo(size))
}

/** Name of a round, from the number of players contesting it. */
export function roundName(remaining: number): string {
  if (remaining === 2) return 'Final'
  if (remaining === 4) return 'Semi Final'
  if (remaining === 8) return 'Quarter Final'
  return `Round of ${remaining}`
}

export function roundShortName(remaining: number): string {
  if (remaining === 2) return 'F'
  if (remaining === 4) return 'SF'
  if (remaining === 8) return 'QF'
  return `R${remaining}`
}

/**
 * Standard single-elimination seed order.
 *
 * Read in pairs — [0] v [1], [2] v [3], … — this places seeds so that 1 and 2
 * can only meet in the final, 1-4 only in the semis, and so on.
 *
 *   size 4 -> 1, 4, 2, 3
 *   size 8 -> 1, 8, 4, 5, 2, 7, 3, 6
 */
export function seedOrder(size: number): number[] {
  let order = [1, 2]
  while (order.length < size) {
    const mirror = order.length * 2 + 1
    const next: number[] = []
    for (const s of order) next.push(s, mirror - s)
    order = next
  }
  return order
}

export function byeSummary(entrants: number): { size: number; byes: number; rounds: number } {
  const size = nextPowerOfTwo(entrants)
  return { size, byes: size - entrants, rounds: log2(size) }
}
