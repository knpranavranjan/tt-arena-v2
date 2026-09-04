/**
 * Qualification engine.
 *
 * Direct qualifiers are the top N of every pool. When that count is not a power
 * of two, the best remaining finishers ("best runners-up") are promoted until
 * the bracket is full — seven pools produce seven winners, and the single best
 * runner-up fills the eighth slot.
 *
 * Cross-pool comparison follows the tournament rules: matches won, then point
 * difference, then points scored. Win ratio is carried alongside so an organizer
 * can spot an unfair comparison between uneven pools and override it.
 *
 * Two organizer overrides sit on top, and both keep the algorithm in charge of
 * everything they do not explicitly change:
 *
 *   `manualQualifierIds` — the exact set of players who qualify. Anyone added
 *     by hand is merged into the seeding order by the same rule the algorithm
 *     uses (pool finishing position, then wins, point difference, points
 *     scored, seed) rather than being appended to the end of the list.
 *
 *   `qualifierOrder` — an explicit order set by dragging. Players named here
 *     take that order; anyone not named keeps their algorithmic position at the
 *     back of the list.
 */
import { nextPowerOfTwo } from './bracketMath'
import type { Pool, QualificationResult, QualificationRule, Qualifier, RankedRow, SeededPlayer } from './types'

export interface QualificationOption {
  value: QualificationRule
  label: string
  advancePerPool: number
  fill: boolean
}

export const QUALIFICATION_RULES: QualificationOption[] = [
  { value: 'winners_fill', label: 'Pool winners + best runners-up (fill bracket)', advancePerPool: 1, fill: true },
  { value: 'winners_only', label: 'Pool winners only', advancePerPool: 1, fill: false },
  { value: 'top2', label: 'Top 2 per pool', advancePerPool: 2, fill: false },
  { value: 'top2_fill', label: 'Top 2 per pool + best third placed (fill bracket)', advancePerPool: 2, fill: true },
]

export function qualificationConfig(rule: QualificationRule): QualificationOption {
  return QUALIFICATION_RULES.find((r) => r.value === rule) ?? QUALIFICATION_RULES[0]
}

type Entry = Omit<Qualifier, 'qualSeed'>
type EntryComparator = (a: Entry, b: Entry) => number

/** Cross-pool comparator: wins -> point difference -> points scored -> seed. */
function crossCompare(seedOf: (id: string) => number): EntryComparator {
  return (a, b) =>
    (b.row?.won ?? 0) - (a.row?.won ?? 0) ||
    (b.row?.pointDiff ?? 0) - (a.row?.pointDiff ?? 0) ||
    (b.row?.pointsFor ?? 0) - (a.row?.pointsFor ?? 0) ||
    seedOf(a.playerId) - seedOf(b.playerId)
}

function toEntry(pool: Pool, row: RankedRow): Entry {
  return {
    playerId: row.playerId,
    poolId: pool.id,
    poolName: pool.name,
    rankInPool: row.rank,
    row,
    winRatio: row.played ? row.won / row.played : 0,
  }
}

/**
 * The single ordering rule used everywhere: all pool winners first (strongest
 * to weakest), then all runners-up, and so on. Applying this to the manual
 * selection too is what keeps a hand-picked qualifier list seeded the same way
 * the algorithm would have seeded it.
 */
function algorithmicOrder(entries: readonly Entry[], cmp: EntryComparator): Entry[] {
  return [...entries].sort((a, b) => a.rankInPool - b.rankInPool || cmp(a, b))
}

/**
 * Apply an explicit drag order on top of the algorithmic order. Players the
 * organizer has not placed keep their algorithmic position, at the back.
 */
function applyCustomOrder(entries: readonly Entry[], order: readonly string[] | null | undefined): Entry[] {
  if (!order || order.length === 0) return [...entries]
  const position = new Map(order.map((id, i) => [id, i]))
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((x, y) => {
      const px = position.get(x.entry.playerId) ?? Number.POSITIVE_INFINITY
      const py = position.get(y.entry.playerId) ?? Number.POSITIVE_INFINITY
      return px - py || x.index - y.index
    })
    .map((x) => x.entry)
}

function withSeeds(entries: readonly Entry[]): Qualifier[] {
  return entries.map((e, i) => ({ ...e, qualSeed: i + 1 }))
}

export interface QualificationOptions {
  rule?: QualificationRule
  seedOf?: (id: string) => number
  advancePerPool?: number
  fill?: boolean
  /** Organizer override — the exact set of player ids that should qualify. */
  manualQualifierIds?: string[] | null
  /** Organizer override — explicit seeding order set by dragging. */
  qualifierOrder?: string[] | null
}

export function computeQualification(
  pools: readonly Pool[],
  standingsByPool: Map<string, RankedRow[]>,
  options: QualificationOptions = {},
): QualificationResult {
  const { rule = 'winners_fill', seedOf = () => 0, manualQualifierIds = null, qualifierOrder = null } = options
  const cfg = qualificationConfig(rule)
  const advance = options.advancePerPool ?? cfg.advancePerPool
  const fill = options.fill ?? cfg.fill
  const cmp = crossCompare(seedOf)

  const direct: Entry[] = []
  const contenders: Entry[] = [] // next-best finishers, candidates for a fill slot
  const eliminated: Entry[] = []

  for (const pool of pools) {
    for (const row of standingsByPool.get(pool.id) ?? []) {
      const entry = toEntry(pool, row)
      if (row.rank <= advance) direct.push(entry)
      else if (row.rank === advance + 1) contenders.push(entry)
      else eliminated.push(entry)
    }
  }

  const orderedDirect = algorithmicOrder(direct, cmp)
  const orderedContenders = [...contenders].sort(cmp)

  // What the algorithm would pick on its own.
  const bracketSize = nextPowerOfTwo(Math.max(2, orderedDirect.length))
  const slotsToFill = fill ? Math.max(0, bracketSize - orderedDirect.length) : 0
  const autoPromoted = orderedContenders.slice(0, Math.min(slotsToFill, orderedContenders.length))
  const autoSelected: Entry[] = [...orderedDirect, ...autoPromoted.map((e) => ({ ...e, viaFill: true }))]

  // Every finisher, in algorithmic order — the editor works from this list, so
  // a player removed from the qualifiers can always be added back.
  const allEntries = algorithmicOrder([...direct, ...contenders, ...eliminated], cmp)

  let selected: Entry[]
  if (manualQualifierIds) {
    const wanted = new Set(manualQualifierIds)
    const autoById = new Map(autoSelected.map((e) => [e.playerId, e]))
    selected = allEntries
      .filter((e) => wanted.has(e.playerId))
      .map((e) => {
        const auto = autoById.get(e.playerId)
        return auto ? { ...auto } : { ...e, manual: true }
      })
  } else {
    selected = autoSelected
  }

  // Seed the chosen players with the same rule the algorithm uses, then let any
  // explicit drag order win.
  const qualifiers = withSeeds(applyCustomOrder(algorithmicOrder(selected, cmp), qualifierOrder))

  const finalBracketSize = nextPowerOfTwo(Math.max(2, qualifiers.length))
  const qualifiedIds = new Set(qualifiers.map((q) => q.playerId))

  return {
    qualifiers,
    directCount: orderedDirect.length,
    // Derived from the final list, so the "filled" markers always match reality
    // even after the organizer edits the selection.
    promoted: qualifiers.filter((q) => q.rankInPool > advance),
    contenders: withSeeds(orderedContenders),
    missed: withSeeds(orderedContenders.filter((e) => !qualifiedIds.has(e.playerId))),
    eliminated: withSeeds(algorithmicOrder(eliminated, cmp)),
    allEntries: withSeeds(allEntries),
    bracketSize: finalBracketSize,
    byes: finalBracketSize - qualifiers.length,
    advancePerPool: advance,
    fill,
    unevenPools: new Set(pools.map((p) => p.playerIds.length)).size > 1,
  }
}

/** Every player enters the bracket directly — used by the "Knockout only" format. */
export function directEntry(
  seeded: readonly SeededPlayer[],
  options: Pick<QualificationOptions, 'manualQualifierIds' | 'qualifierOrder'> = {},
): QualificationResult {
  const { manualQualifierIds = null, qualifierOrder = null } = options

  const entries: Entry[] = seeded.map((p) => ({
    playerId: p.id,
    poolId: null,
    poolName: '—',
    rankInPool: 1,
    row: null,
    winRatio: 0,
  }))

  // With no pools to compare, rating seeding is the algorithmic order.
  const selected = manualQualifierIds
    ? entries.filter((e) => new Set(manualQualifierIds).has(e.playerId))
    : entries
  const qualifiers = withSeeds(applyCustomOrder(selected, qualifierOrder))
  const bracketSize = nextPowerOfTwo(Math.max(2, qualifiers.length))

  return {
    qualifiers,
    directCount: qualifiers.length,
    promoted: [],
    contenders: [],
    missed: [],
    eliminated: [],
    allEntries: withSeeds(entries),
    bracketSize,
    byes: bracketSize - qualifiers.length,
    advancePerPool: 1,
    fill: false,
    unevenPools: false,
  }
}
