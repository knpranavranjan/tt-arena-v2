/**
 * Round robin fixture generation (circle method).
 *
 * Every player meets every other player exactly once, and fixtures are grouped
 * into rounds in which nobody plays twice — which is what a real schedule needs.
 *
 *   pool of 4 -> 3 rounds x 2 matches = 6 fixtures
 *   pool of 3 -> 3 rounds x 1 match  = 3 fixtures
 */
import type { Pool, PoolMatch } from './types'

export function roundRobinRounds(ids: readonly string[]): Array<Array<[string, string]>> {
  if (ids.length < 2) return []

  const arr: Array<string | null> = [...ids]
  if (arr.length % 2 === 1) arr.push(null) // bye marker for odd pools
  const n = arr.length
  const rounds: Array<Array<[string, string]>> = []

  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[string, string]> = []
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i]
      const b = arr[n - 1 - i]
      if (a === null || b === null) continue
      // Alternate sides so nobody is always listed first.
      pairs.push(r % 2 === 0 ? [a, b] : [b, a])
    }
    rounds.push(pairs)
    arr.splice(1, 0, arr.pop() as string | null) // rotate, keeping arr[0] fixed
  }
  return rounds
}

/** Stable id, so results survive any pool edit that leaves the pairing intact. */
export function matchId(poolId: string, a: string, b: string): string {
  const [x, y] = [a, b].sort()
  return `${poolId}::${x}::${y}`
}

export function makePoolMatches(pool: Pool, tableOffset = 0, tableCount = 4): PoolMatch[] {
  const rounds = roundRobinRounds(pool.playerIds)
  const matches: PoolMatch[] = []
  let n = 0

  rounds.forEach((pairs, roundIndex) => {
    for (const [a, b] of pairs) {
      matches.push({
        id: matchId(pool.id, a, b),
        poolId: pool.id,
        round: roundIndex + 1,
        aId: a,
        bId: b,
        games: [],
        winnerId: null,
        played: false,
        mode: null,
        table: ((tableOffset + n) % Math.max(1, tableCount)) + 1,
        duration: null,
      })
      n += 1
    }
  })
  return matches
}

/**
 * Regenerate every fixture, carrying across any result whose exact pairing
 * still exists. Editing pools therefore never silently destroys scores that
 * remain meaningful.
 */
export function generateAllPoolMatches(
  pools: readonly Pool[],
  previousMatches: readonly PoolMatch[] = [],
  tableCount = 4,
): PoolMatch[] {
  const previous = new Map(previousMatches.map((m) => [m.id, m]))
  const out: PoolMatch[] = []
  let offset = 0

  for (const pool of pools) {
    const fresh = makePoolMatches(pool, offset, tableCount)
    offset += fresh.length
    for (const m of fresh) {
      const old = previous.get(m.id)
      out.push(
        old
          ? { ...m, games: old.games, winnerId: old.winnerId, played: old.played, mode: old.mode, duration: old.duration }
          : m,
      )
    }
  }
  return out
}
