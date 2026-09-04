/**
 * Doubles support for the tournament engine.
 *
 * The engine only ever deals with a single competitor per side. A doubles team
 * is modelled as one synthetic `Player` whose `members` array carries the two
 * people who play together, so pools, round-robin, standings, qualification and
 * the knockout bracket all work unchanged.
 */
import { rngFor, shuffle } from './rng'
import type { PairMember, Player } from './types'

/** A category runs as doubles when its name says so ("… Doubles"). */
export function isDoublesCategory(name: string): boolean {
  return /doubles/i.test(name)
}

export function toMembers(p: Player): PairMember[] {
  return p.members && p.members.length > 0
    ? p.members
    : [{ id: p.id, name: p.name, rating: p.rating }]
}

/** "Asha Rao / Bibek Sen" — or just the one name for a solo/unfilled entry. */
export function pairLabel(members: readonly PairMember[]): string {
  return members.map((m) => m.name).filter(Boolean).join(' / ') || '—'
}

/** Stable id for a team, derived from its members so re-syncing lines up. */
export function teamId(members: readonly PairMember[]): string {
  return `team_${members.map((m) => m.id).sort().join('__')}`
}

/**
 * Build a team `Player` from its members. Rating is the pair average so seeding
 * still orders the draw sensibly.
 */
export function makeTeam(members: PairMember[]): Player {
  const ratings = members.map((m) => m.rating ?? 0).filter((n) => n > 0)
  const rating = ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 1500
  return {
    id: teamId(members),
    name: pairLabel(members),
    rating,
    club: '',
    state: '',
    members,
  }
}

/**
 * Pair a flat list of people into teams of two. The list is taken in the order
 * given (callers pass a seeded or shuffled order), then chunked 2-by-2. An odd
 * person left over is returned in `unpaired`.
 */
export function autoPairMembers(members: readonly PairMember[]): {
  teams: Player[]
  unpaired: PairMember[]
} {
  const teams: Player[] = []
  let i = 0
  for (; i + 1 < members.length; i += 2) {
    teams.push(makeTeam([members[i], members[i + 1]]))
  }
  const unpaired = i < members.length ? [members[i]] : []
  return { teams, unpaired }
}

/** Every person currently in the draw, whether paired or waiting in the tray. */
export function allMembers(teams: readonly Player[], unpaired: readonly PairMember[]): PairMember[] {
  return [...teams.flatMap(toMembers), ...unpaired]
}

/**
 * Turn a flat roster into a doubles field: shuffle deterministically by the
 * given seed, then pair two-by-two. An odd entrant is left in `unpaired`.
 */
export function pairRoster(
  roster: readonly Player[],
  seed: string | number,
): { teams: Player[]; unpaired: PairMember[] } {
  const shuffled = shuffle(roster, rngFor(seed, 'doubles-pairing'))
  return autoPairMembers(shuffled.map((p) => ({ id: p.id, name: p.name, rating: p.rating })))
}
