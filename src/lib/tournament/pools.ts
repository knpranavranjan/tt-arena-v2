/**
 * Pool recommendation engine and allocation strategies.
 */
import { shuffle, type Rng } from './rng'
import type { AllocationMethod, Player, Pool, PoolSizePreference, SeededPlayer } from './types'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** A, B, … Z, AA, AB, … so any field size gets a readable label. */
export function poolLabel(index: number): string {
  if (index < 26) return LETTERS[index]
  return LETTERS[Math.floor(index / 26) - 1] + LETTERS[index % 26]
}

/** Split `total` players across `poolCount` pools as evenly as possible. */
export function balancedSizes(total: number, poolCount: number): number[] {
  const base = Math.floor(total / poolCount)
  const remainder = total % poolCount
  return Array.from({ length: poolCount }, (_, i) => base + (i < remainder ? 1 : 0))
}

/**
 * Score a candidate pool size — lower is better. Pools of about four are ideal
 * (three matches each, quick to run) and perfectly even pools beat ragged ones.
 */
function scorePreference(total: number, size: number): number {
  const poolCount = Math.ceil(total / size)
  const sizes = balancedSizes(total, poolCount)
  const uneven = new Set(sizes).size > 1
  const tooSmall = Math.min(...sizes) < 2
  return Math.abs(size - 4) * 3 + (uneven ? 2 : 0) + (tooSmall ? 100 : 0)
}

export interface PoolRecommendation {
  poolCount: number
  sizes: number[]
  preferredSize: number
  summary: string
}

/**
 * Recommend the most balanced structure for a field.
 *
 * With 30 players and a preferred size of 4 this returns 8 pools:
 * six of four and two of three.
 */
export function recommendPools(total: number, preference: PoolSizePreference = 'auto'): PoolRecommendation {
  if (total < 2) return { poolCount: 0, sizes: [], preferredSize: 0, summary: 'Not enough players' }

  let size: number
  if (preference === 'auto') {
    const candidates = [3, 4, 5, 6, 7, 8].filter((s) => s <= Math.max(2, total))
    size = candidates.reduce(
      (best, s) => (scorePreference(total, s) < scorePreference(total, best) ? s : best),
      candidates[0] ?? total,
    )
  } else {
    size = Math.max(2, Math.min(Number(preference), total))
  }

  let poolCount = Math.max(1, Math.ceil(total / size))
  let sizes = balancedSizes(total, poolCount)

  // A pool of one cannot play a round robin — merge until every pool has two.
  while (poolCount > 1 && Math.min(...sizes) < 2) {
    poolCount -= 1
    sizes = balancedSizes(total, poolCount)
  }

  return { poolCount, sizes, preferredSize: size, summary: describeSizes(poolCount, sizes) }
}

export function describeSizes(poolCount: number, sizes: readonly number[]): string {
  const tally = new Map<number, number>()
  sizes.forEach((s) => tally.set(s, (tally.get(s) ?? 0) + 1))
  const parts = [...tally.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([size, n]) => `${n} pool${n > 1 ? 's' : ''} of ${size}`)
  return `${poolCount} pool${poolCount > 1 ? 's' : ''} — ${parts.join(', ')}`
}

/** Total round robin fixtures implied by a set of pool sizes. */
export function fixtureCount(sizes: readonly number[]): number {
  return sizes.reduce((sum, n) => sum + (n * (n - 1)) / 2, 0)
}

export function makeEmptyPools(sizes: readonly number[]): Pool[] {
  return sizes.map((size, i) => ({
    id: `pool_${i}`,
    name: `Pool ${poolLabel(i)}`,
    capacity: size,
    playerIds: [],
  }))
}

/**
 * Snake (serpentine) allocation.
 *
 * Round one fills pools left to right, round two right to left, and so on. Top
 * seeds are kept apart and average pool ratings stay close:
 *
 *   Pool A -> seeds 1, 16, 17, 32
 *   Pool B -> seeds 2, 15, 18, 31
 *
 * Full pools are skipped, so ragged structures (6 pools of 4 + 2 of 3) work too.
 */
export function snakeAllocate(seeded: readonly SeededPlayer[], sizes: readonly number[]): Pool[] {
  const pools = makeEmptyPools(sizes)
  let index = 0
  let round = 0

  while (index < seeded.length) {
    const open = pools.filter((p) => p.playerIds.length < p.capacity)
    if (open.length === 0) break
    const order = round % 2 === 0 ? open : [...open].reverse()
    for (const pool of order) {
      if (index >= seeded.length) break
      pool.playerIds.push(seeded[index].id)
      index += 1
    }
    round += 1
  }
  return pools
}

/** Straight fill: seeds 1-4 in Pool A, 5-8 in Pool B. A useful contrast case. */
export function sequentialAllocate(seeded: readonly SeededPlayer[], sizes: readonly number[]): Pool[] {
  const pools = makeEmptyPools(sizes)
  let index = 0
  for (const pool of pools) {
    while (pool.playerIds.length < pool.capacity && index < seeded.length) {
      pool.playerIds.push(seeded[index].id)
      index += 1
    }
  }
  return pools
}

export function randomAllocate(seeded: readonly SeededPlayer[], sizes: readonly number[], rng: Rng): Pool[] {
  return sequentialAllocate(shuffle(seeded, rng), sizes)
}

export function allocate(
  method: AllocationMethod,
  seeded: readonly SeededPlayer[],
  sizes: readonly number[],
  rng: Rng,
): Pool[] {
  // `custom` lays out the pool shells and leaves them empty — every player
  // starts unassigned so the organizer can drag them in by hand.
  if (method === 'custom') return makeEmptyPools(sizes)
  if (method === 'sequential') return sequentialAllocate(seeded, sizes)
  if (method === 'random') return randomAllocate(seeded, sizes, rng)
  return snakeAllocate(seeded, sizes)
}

/**
 * Keep pools consistent with the player list after edits: drop players that no
 * longer exist and report anyone not yet assigned to a pool.
 */
export function reconcilePools(
  pools: readonly Pool[],
  players: readonly Player[],
): { pools: Pool[]; unassigned: string[] } {
  const valid = new Set(players.map((p) => p.id))
  const assigned = new Set<string>()

  const next = pools.map((pool) => {
    const playerIds = pool.playerIds.filter((id) => {
      if (!valid.has(id) || assigned.has(id)) return false
      assigned.add(id)
      return true
    })
    return { ...pool, playerIds, capacity: Math.max(playerIds.length, pool.capacity) }
  })

  return { pools: next, unassigned: players.filter((p) => !assigned.has(p.id)).map((p) => p.id) }
}

/** Average and top rating in a pool — the quickest check that balancing worked. */
export function poolStrength(pool: Pool, playerById: Map<string, Player>): { avg: number; top: number } {
  const ratings = pool.playerIds.map((id) => playerById.get(id)?.rating ?? 0)
  if (!ratings.length) return { avg: 0, top: 0 }
  return {
    avg: Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length),
    top: Math.max(...ratings),
  }
}
