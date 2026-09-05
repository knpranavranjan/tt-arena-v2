/**
 * Sample player generation and automatic seeding.
 */
import { rngFor, type Rng } from './rng'
import type { NameStyle, Player, SeededPlayer } from './types'

const FIRST = [
  'Aarav', 'Vihaan', 'Ishaan', 'Rohan', 'Kabir', 'Advait', 'Neel', 'Arjun',
  'Dhruv', 'Karan', 'Manav', 'Rehan', 'Siddharth', 'Yash', 'Ansh', 'Devansh',
  'Mira', 'Anaya', 'Diya', 'Kiara', 'Saanvi', 'Aditi', 'Nitya', 'Ira',
  'Tanvi', 'Riya', 'Meera', 'Prisha', 'Alisha', 'Naina', 'Sara', 'Avni',
]

const LAST = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Kulkarni',
  'Desai', 'Joshi', 'Gupta', 'Bose', 'Chatterjee', 'Rao', 'Shetty', 'Pillai',
  'Bhat', 'Kapoor', 'Malhotra', 'Sinha', 'Ghosh', 'Mehta', 'Chauhan', 'Naik',
]

const CLUBS = [
  'Central TT Academy', 'Riverside Paddlers', 'Metro Sports Club', 'Northgate TTC',
  'Olympia Table Tennis', 'Spin City Academy', 'Eastside Racquets', 'Grand Slam TTC',
  'Pinnacle Sports', 'Skyline TTC',
]

const STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat', 'West Bengal',
  'Kerala', 'Telangana', 'Punjab', 'Rajasthan',
]

let counter = 0

export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}_${counter.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

/**
 * Ratings that read like a real entry list: a plausible top rating and a spread
 * that widens with the field, so a 500-player event still produces sane numbers
 * instead of running negative.
 */
function generateRatings(count: number, rng: Rng): number[] {
  const top = 2750 + Math.floor(rng() * 120)
  const span = Math.min(1700, 130 + count * 26)
  const bottom = Math.max(820, top - span)

  const ratings = Array.from({ length: count }, () => bottom + Math.round(rng() * (top - bottom)))
  ratings.sort((a, b) => b - a)

  // Nudge duplicates apart so the seeding order is unambiguous.
  for (let i = 1; i < ratings.length; i++) {
    if (ratings[i] >= ratings[i - 1]) ratings[i] = Math.max(400, ratings[i - 1] - 1)
  }
  return ratings
}

export function generatePlayers(
  count: number,
  seed: string | number,
  nameStyle: NameStyle = 'numbered',
  startIndex = 0,
): Player[] {
  const rng = rngFor(seed, 'players', count, nameStyle, startIndex)
  const ratings = generateRatings(count, rng)

  return Array.from({ length: count }, (_, i) => ({
    id: uid('p'),
    name:
      nameStyle === 'realistic'
        ? `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`
        : `Player ${startIndex + i + 1}`,
    rating: ratings[i],
    club: CLUBS[Math.floor(rng() * CLUBS.length)],
    state: STATES[Math.floor(rng() * STATES.length)],
  }))
}

export function blankPlayer(index: number): Player {
  return { id: uid('p'), name: `Player ${index + 1}`, rating: 1500, club: '', state: '' }
}

/**
 * Automatic seeding: strictly by rating, highest first. Name is the tiebreak so
 * equal ratings never produce an unstable order.
 */
export function seedPlayers(players: readonly Player[]): SeededPlayer[] {
  return [...players]
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
    .map((p, i) => ({ ...p, seed: i + 1 }))
}

export function seedMap(players: readonly Player[]): Map<string, number> {
  return new Map(seedPlayers(players).map((p) => [p.id, p.seed]))
}

/**
 * Rating seeding with an optional hand-set order laid on top: players named in
 * `manualOrder` take that order; anyone else keeps rating order, behind them.
 * Shared by the console's live view and the read-only player Match Centre.
 */
export function applySeedOrder(
  players: readonly Player[],
  manualOrder: readonly string[] | null | undefined,
): SeededPlayer[] {
  const base = seedPlayers(players)
  if (!manualOrder || manualOrder.length === 0) return base
  const byId = new Map(base.map((p) => [p.id, p]))
  const ordered: SeededPlayer[] = []
  for (const id of manualOrder) {
    const p = byId.get(id)
    if (p) {
      ordered.push(p)
      byId.delete(id)
    }
  }
  for (const p of base) if (byId.has(p.id)) ordered.push(p)
  return ordered.map((p, i) => ({ ...p, seed: i + 1 }))
}
