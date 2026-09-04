/**
 * Knockout bracket generation and progression.
 *
 * Qualifiers are placed into standard seed slots, so seeds 1 and 2 can only meet
 * in the final. Empty slots become byes and resolve automatically — that is what
 * gives the top seeds a walkover when the field is not a power of two. Winners
 * always feed match `floor(i / 2)` of the next round.
 */
import { log2, nextPowerOfTwo, roundName, seedOrder } from './bracketMath'
import type { Bracket, BracketSlot, KnockoutMatch, MatchBase, Qualifier } from './types'

function newMatch(round: number, index: number): KnockoutMatch {
  return {
    id: `ko_r${round}_m${index}`,
    round,
    index,
    aId: null,
    bId: null,
    games: [],
    winnerId: null,
    played: false,
    isBye: false,
    mode: null,
    duration: null,
    table: index + 1,
  }
}

type Slot = Qualifier | null

/**
 * Avoid a first-round meeting between players out of the same pool. Only
 * participants holding the same finishing position in their pool are swapped,
 * so the seeding structure stays intact.
 */
function separateSamePool(slots: Slot[]): Slot[] {
  const half = slots.length / 2
  const conflict = (i: number): boolean => {
    const a = slots[2 * i]
    const b = slots[2 * i + 1]
    return Boolean(a && b && a.poolId && a.poolId === b.poolId)
  }

  for (let i = 0; i < half; i++) {
    if (!conflict(i)) continue
    let fixed = false

    for (let j = 0; j < half && !fixed; j++) {
      if (j === i) continue
      for (const slotA of [2 * i, 2 * i + 1]) {
        for (const slotB of [2 * j, 2 * j + 1]) {
          const x = slots[slotA]
          const y = slots[slotB]
          if (!x || !y || x.rankInPool !== y.rankInPool) continue

          // Trial swap; keep it only if it resolves i without breaking j.
          slots[slotA] = y
          slots[slotB] = x
          if (!conflict(i) && !conflict(j)) {
            fixed = true
            break
          }
          slots[slotA] = x
          slots[slotB] = y
        }
        if (fixed) break
      }
    }
  }
  return slots
}

export const THIRD_PLACE_ID = 'ko_third_place'

export interface BuildBracketOptions {
  separatePools?: boolean
  /** Add a play-off between the two semi-final losers. */
  thirdPlace?: boolean
}

/** Build a full bracket from an ordered qualifier list (strongest first). */
export function buildBracket(qualifiers: readonly Qualifier[], options: BuildBracketOptions = {}): Bracket {
  const size = nextPowerOfTwo(Math.max(2, qualifiers.length))
  const order = seedOrder(size)
  let slots: Slot[] = order.map((seed) => qualifiers[seed - 1] ?? null)

  if (options.separatePools !== false) slots = separateSamePool(slots)

  const rounds: KnockoutMatch[][] = []
  const first: KnockoutMatch[] = []
  for (let i = 0; i < size / 2; i++) {
    const m = newMatch(0, i)
    m.aId = slots[2 * i]?.playerId ?? null
    m.bId = slots[2 * i + 1]?.playerId ?? null
    first.push(m)
  }
  rounds.push(first)

  for (let r = 1; r < log2(size); r++) {
    const count = size / 2 ** (r + 1)
    rounds.push(Array.from({ length: count }, (_, i) => newMatch(r, i)))
  }

  const seeding: BracketSlot[] = slots.map((s, i) => ({
    slot: i,
    playerId: s?.playerId ?? null,
    poolId: s?.poolId ?? null,
    rankInPool: s?.rankInPool,
    bye: !s,
  }))

  return propagate({ size, rounds, seeding, thirdPlace: makeThirdPlace(size, options.thirdPlace) })
}

/** A third-place match only makes sense once there are semi-finals to lose. */
function makeThirdPlace(size: number, enabled: boolean | undefined): KnockoutMatch | null {
  if (!enabled || size < 4) return null
  const m = newMatch(-1, 0)
  m.id = THIRD_PLACE_ID
  return m
}

/** Turn the third-place play-off on or off without disturbing the main draw. */
export function setThirdPlaceEnabled(bracket: Bracket, enabled: boolean): Bracket {
  if (enabled === Boolean(bracket.thirdPlace)) return bracket
  return propagate({ ...bracket, thirdPlace: makeThirdPlace(bracket.size, enabled) })
}

function loserOf(m: KnockoutMatch | undefined): string | null {
  if (!m || !m.played || m.isBye || !m.winnerId) return null
  return m.winnerId === m.aId ? m.bId : m.aId
}

function clearResult(m: KnockoutMatch): void {
  m.played = false
  m.winnerId = null
  m.games = []
  m.mode = null
  m.duration = null
}

/**
 * Recompute participants for every round from the previous round's winners,
 * auto-resolve byes, and clear any stored result whose participants no longer
 * match — i.e. the organizer changed an earlier winner.
 */
export function propagate(bracket: Bracket): Bracket {
  const rounds = bracket.rounds.map((r) => r.map((m) => ({ ...m })))

  for (let r = 0; r < rounds.length; r++) {
    for (let i = 0; i < rounds[r].length; i++) {
      const m = rounds[r][i]

      if (r > 0) {
        m.aId = rounds[r - 1][2 * i]?.winnerId ?? null
        m.bId = rounds[r - 1][2 * i + 1]?.winnerId ?? null
      }

      const bothPresent = Boolean(m.aId && m.bId)

      if (bothPresent) {
        // A stored result is stale once it names someone who is no longer in
        // the match — i.e. the organizer changed an earlier winner.
        const stale = m.played && m.winnerId !== m.aId && m.winnerId !== m.bId
        if (stale || m.isBye) clearResult(m)
        m.isBye = false
      } else if (r === 0 && (m.aId || m.bId)) {
        // A genuine walkover. Byes exist only in the first round: the bracket
        // is sized so every first-round match holds at least one player, so a
        // gap in any later round means "waiting", never "advance for free".
        m.isBye = true
        m.played = true
        m.winnerId = m.aId ?? m.bId
        m.games = []
        m.mode = 'bye'
        m.duration = null
      } else {
        // Waiting on a feeding result.
        clearResult(m)
        m.isBye = false
      }
    }
  }

  // The third-place play-off is fed by the two semi-final losers, so it follows
  // the same rules: changing a semi-final clears it, and if one semi was a
  // walkover the remaining loser takes third place unopposed.
  let thirdPlace: KnockoutMatch | null = null
  if (bracket.thirdPlace) {
    const semis = rounds[rounds.length - 2]
    thirdPlace = { ...bracket.thirdPlace }
    thirdPlace.aId = loserOf(semis?.[0])
    thirdPlace.bId = loserOf(semis?.[1])

    if (thirdPlace.aId && thirdPlace.bId) {
      const stale = thirdPlace.played && thirdPlace.winnerId !== thirdPlace.aId && thirdPlace.winnerId !== thirdPlace.bId
      if (stale || thirdPlace.isBye) clearResult(thirdPlace)
      thirdPlace.isBye = false
    } else if (thirdPlace.aId || thirdPlace.bId) {
      thirdPlace.isBye = true
      thirdPlace.played = true
      thirdPlace.winnerId = thirdPlace.aId ?? thirdPlace.bId
      thirdPlace.games = []
      thirdPlace.mode = 'bye'
      thirdPlace.duration = null
    } else {
      clearResult(thirdPlace)
      thirdPlace.isBye = false
    }
  }

  return { ...bracket, rounds, thirdPlace }
}

export function setBracketResult(
  bracket: Bracket,
  matchId: string,
  result: Partial<MatchBase>,
): Bracket {
  const rounds = bracket.rounds.map((r) => r.map((m) => (m.id === matchId ? { ...m, ...result } : m)))
  const thirdPlace =
    bracket.thirdPlace && bracket.thirdPlace.id === matchId
      ? { ...bracket.thirdPlace, ...result }
      : bracket.thirdPlace
  return propagate({ ...bracket, rounds, thirdPlace })
}

export function clearBracketResult(bracket: Bracket, matchId: string): Bracket {
  return setBracketResult(bracket, matchId, {
    played: false,
    winnerId: null,
    games: [],
    mode: null,
    duration: null,
  })
}

export function bracketRoundName(bracket: Bracket, roundIndex: number): string {
  return roundName(bracket.size / 2 ** roundIndex)
}

export function finalMatch(bracket: Bracket): KnockoutMatch | undefined {
  return bracket.rounds[bracket.rounds.length - 1]?.[0]
}

export function championId(bracket: Bracket): string | null {
  const f = finalMatch(bracket)
  return f && f.played ? f.winnerId : null
}

/** Loser of the final. */
export function runnerUpId(bracket: Bracket): string | null {
  const f = finalMatch(bracket)
  return loserOf(f)
}

/** Winner of the play-off, when one was played. */
export function thirdPlaceId(bracket: Bracket): string | null {
  const m = bracket.thirdPlace
  return m && m.played ? m.winnerId : null
}

export function fourthPlaceId(bracket: Bracket): string | null {
  return loserOf(bracket.thirdPlace ?? undefined)
}

/** Every match in the bracket, including the third-place play-off. */
export function allBracketMatches(bracket: Bracket): KnockoutMatch[] {
  return bracket.thirdPlace ? [...bracket.rounds.flat(), bracket.thirdPlace] : bracket.rounds.flat()
}

export function findBracketMatch(bracket: Bracket, matchId: string): KnockoutMatch | undefined {
  return allBracketMatches(bracket).find((m) => m.id === matchId)
}

/** Losers of the round in which `remaining` players were still alive. */
export function losersOfRound(bracket: Bracket, remaining: number): string[] {
  const roundIndex = bracket.rounds.findIndex((_, r) => bracket.size / 2 ** r === remaining)
  if (roundIndex < 0) return []
  return bracket.rounds[roundIndex]
    .filter((m) => m.played && !m.isBye)
    .map((m) => (m.winnerId === m.aId ? m.bId : m.aId))
    .filter((id): id is string => Boolean(id))
}

export function bracketProgress(bracket: Bracket): { total: number; played: number; byes: number } {
  const all = allBracketMatches(bracket)
  const playable = all.filter((m) => m.aId && m.bId)
  return {
    total: playable.length,
    played: playable.filter((m) => m.played).length,
    byes: all.filter((m) => m.isBye).length,
  }
}

/** The next unplayed match with both participants — drives "play next". */
export function nextPlayableMatch(bracket: Bracket): KnockoutMatch | null {
  for (const m of allBracketMatches(bracket)) {
    if (!m.played && m.aId && m.bId) return m
  }
  return null
}
