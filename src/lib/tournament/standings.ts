/**
 * Standings and the tie-break engine.
 *
 * Ranking is driven first by group points (2 for a win, 1 for a match played and
 * lost by default, but configurable per category). Players level on points form
 * a tie group, and the organizer's chosen rule orders that group. A deterministic
 * fallback chain runs afterwards, so the table always has a strict total order —
 * no two players can ever share a rank.
 */
import { rngFor } from './rng'
import type { AnyMatch, GamePoints, Pool, PoolMatch, RankedRow, StandingsRow, TieBreakRule } from './types'

/** Default when a category has not set its own group points. */
export const DEFAULT_GROUP_POINTS: GamePoints = { win: 2, draw: 1, loss: 1 }

export interface TieBreakOption {
  value: TieBreakRule
  label: string
  hint: string
}

export const TIE_BREAK_RULES: TieBreakOption[] = [
  { value: 'matches_won', label: 'Matches Won', hint: 'Falls through to the standard chain when players are level' },
  { value: 'point_diff', label: 'Point Difference', hint: 'Points scored minus points conceded' },
  { value: 'points_scored', label: 'Total Points Scored', hint: 'Raw points for' },
  { value: 'head_to_head', label: 'Head-to-Head', hint: 'Mini-league between the tied players only' },
  { value: 'games_diff', label: 'Games Difference', hint: 'Games won minus games lost (ITTF standard)' },
  { value: 'lottery', label: 'Draw / Lottery', hint: 'Seeded random draw — reproducible for the same tournament' },
]

export function ruleLabel(value: TieBreakRule): string {
  return TIE_BREAK_RULES.find((r) => r.value === value)?.label ?? value
}

/** One rule or a host-set priority list — always resolved to a non-empty list. */
export type TieBreakSpec = TieBreakRule | readonly TieBreakRule[]

function resolveRules(spec: TieBreakSpec): TieBreakRule[] {
  const list = (Array.isArray(spec) ? spec : [spec]).filter(Boolean) as TieBreakRule[]
  return list.length ? list : ['matches_won']
}

/** Human-readable "Point difference → Head-to-head → …" for a resolved list. */
export function describeTieBreakOrder(spec: TieBreakSpec): string {
  return resolveRules(spec).map(ruleLabel).join(' → ')
}

function emptyRow(playerId: string): StandingsRow {
  return {
    playerId,
    played: 0,
    won: 0,
    lost: 0,
    gamesFor: 0,
    gamesAgainst: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    gameDiff: 0,
    pointDiff: 0,
    matchPoints: 0,
  }
}

/** Accumulate raw statistics for a set of players over a set of matches. */
export function buildRows(
  playerIds: readonly string[],
  matches: readonly AnyMatch[],
  points: GamePoints = DEFAULT_GROUP_POINTS,
): StandingsRow[] {
  const map = new Map(playerIds.map((id) => [id, emptyRow(id)]))

  for (const m of matches) {
    if (!m.played || !m.winnerId || !m.aId || !m.bId) continue
    const a = map.get(m.aId)
    const b = map.get(m.bId)
    if (!a || !b) continue

    let ga = 0
    let gb = 0
    let pa = 0
    let pb = 0
    for (const [x, y] of m.games) {
      pa += x
      pb += y
      if (x > y) ga += 1
      else if (y > x) gb += 1
    }

    a.played += 1
    b.played += 1
    a.gamesFor += ga
    a.gamesAgainst += gb
    b.gamesFor += gb
    b.gamesAgainst += ga
    a.pointsFor += pa
    a.pointsAgainst += pb
    b.pointsFor += pb
    b.pointsAgainst += pa

    if (m.winnerId === m.aId) {
      a.won += 1
      b.lost += 1
    } else {
      b.won += 1
      a.lost += 1
    }
  }

  return [...map.values()].map((r) => ({
    ...r,
    gameDiff: r.gamesFor - r.gamesAgainst,
    pointDiff: r.pointsFor - r.pointsAgainst,
    matchPoints: r.won * points.win + r.lost * points.loss,
  }))
}

type Comparator = (a: StandingsRow, b: StandingsRow) => number

/** Mini-league counting only the matches between the tied players. */
function headToHead(group: readonly StandingsRow[], matches: readonly AnyMatch[]): Comparator {
  const ids = new Set(group.map((r) => r.playerId))
  const subset = matches.filter((m) => m.played && m.aId && m.bId && ids.has(m.aId) && ids.has(m.bId))
  const mini = new Map(buildRows([...ids], subset).map((r) => [r.playerId, r]))

  return (a, b) => {
    const x = mini.get(a.playerId)!
    const y = mini.get(b.playerId)!
    return y.won - x.won || y.gameDiff - x.gameDiff || y.pointDiff - x.pointDiff
  }
}

/** Deterministic fallback applied after the chosen rule. */
function fallbackChain(seedOf: (id: string) => number): Comparator {
  return (a, b) =>
    b.gameDiff - a.gameDiff ||
    b.pointDiff - a.pointDiff ||
    b.pointsFor - a.pointsFor ||
    seedOf(a.playerId) - seedOf(b.playerId)
}

function ruleComparator(
  rule: TieBreakRule,
  group: readonly StandingsRow[],
  matches: readonly AnyMatch[],
  lotterySeed: number,
): Comparator {
  switch (rule) {
    case 'point_diff':
      return (a, b) => b.pointDiff - a.pointDiff
    case 'points_scored':
      return (a, b) => b.pointsFor - a.pointsFor
    case 'games_diff':
      return (a, b) => b.gameDiff - a.gameDiff
    case 'head_to_head':
      return headToHead(group, matches)
    case 'lottery': {
      // Keyed on the tied set, so the draw is stable across re-renders but
      // changes if the tie itself changes.
      const key = group.map((r) => r.playerId).sort().join(',')
      const rng = rngFor(lotterySeed, 'lottery', key)
      const draw = new Map(group.map((r) => [r.playerId, rng()]))
      return (a, b) => (draw.get(a.playerId) ?? 0) - (draw.get(b.playerId) ?? 0)
    }
    case 'matches_won':
    default:
      return () => 0
  }
}

/**
 * Combine the host's priority list into one comparator: try each rule in turn,
 * stop at the first that separates the pair.
 */
function orderedComparator(
  rules: readonly TieBreakRule[],
  group: readonly StandingsRow[],
  matches: readonly AnyMatch[],
  lotterySeed: number,
): Comparator {
  const cmps = rules.map((r) => ruleComparator(r, group, matches, lotterySeed))
  return (a, b) => {
    for (const cmp of cmps) {
      const d = cmp(a, b)
      if (d) return d
    }
    return 0
  }
}

/** Rank a pool. Rows come back sorted, each carrying `rank` and tie metadata. */
export function rankRows(
  rows: readonly StandingsRow[],
  matches: readonly AnyMatch[],
  rule: TieBreakSpec,
  seedOf: (id: string) => number,
  lotterySeed = 0,
): RankedRow[] {
  const rules = resolveRules(rule)
  const primary = rules[0]
  const chain = fallbackChain(seedOf)
  const sorted = [...rows].sort((a, b) => b.matchPoints - a.matchPoints || chain(a, b))

  // Split into groups level on group points.
  const groups: StandingsRow[][] = []
  for (const row of sorted) {
    const last = groups[groups.length - 1]
    if (last && last[0].matchPoints === row.matchPoints) last.push(row)
    else groups.push([row])
  }

  const out: RankedRow[] = []
  let tieGroupId = 0

  for (const group of groups) {
    if (group.length > 1) {
      tieGroupId += 1
      const cmp = orderedComparator(rules, group, matches, lotterySeed)
      group.sort((a, b) => cmp(a, b) || chain(a, b))
    }
    for (const row of group) {
      out.push({
        ...row,
        rank: out.length + 1,
        tieGroup: group.length > 1 ? tieGroupId : null,
        tieRule: group.length > 1 ? primary : null,
      })
    }
  }
  return out
}

export function computePoolStandings(
  pool: Pool,
  matches: readonly PoolMatch[],
  rule: TieBreakSpec,
  seedOf: (id: string) => number,
  lotterySeed = 0,
  points: GamePoints = DEFAULT_GROUP_POINTS,
): RankedRow[] {
  const poolMatches = matches.filter((m) => m.poolId === pool.id)
  return rankRows(buildRows(pool.playerIds, poolMatches, points), poolMatches, rule, seedOf, lotterySeed)
}

export function computeAllStandings(
  pools: readonly Pool[],
  matches: readonly PoolMatch[],
  rule: TieBreakSpec,
  seedOf: (id: string) => number,
  lotterySeed = 0,
  points: GamePoints = DEFAULT_GROUP_POINTS,
): Map<string, RankedRow[]> {
  const map = new Map<string, RankedRow[]>()
  for (const pool of pools) map.set(pool.id, computePoolStandings(pool, matches, rule, seedOf, lotterySeed, points))
  return map
}

/**
 * Force a pool table into an explicit order the organizer set by dragging. Named
 * players take that order; anyone unnamed (a new entrant, say) keeps their
 * computed position behind them. Ranks are renumbered 1..n and the tie markers
 * cleared — the organizer has made the call, so nothing is "tied" any more.
 */
export function applyManualOrder(
  rows: readonly RankedRow[],
  order: readonly string[] | null | undefined,
): RankedRow[] {
  if (!order || order.length === 0) return [...rows]
  const pos = new Map(order.map((id, i) => [id, i]))
  const sorted = [...rows].sort((a, b) => {
    const pa = pos.get(a.playerId) ?? Number.POSITIVE_INFINITY
    const pb = pos.get(b.playerId) ?? Number.POSITIVE_INFINITY
    return pa - pb || a.rank - b.rank
  })
  return sorted.map((r, i) => ({ ...r, rank: i + 1, tieGroup: null, tieRule: null }))
}

export function poolComplete(pool: Pool, matches: readonly PoolMatch[]): boolean {
  const list = matches.filter((m) => m.poolId === pool.id)
  return list.length > 0 && list.every((m) => m.played)
}
