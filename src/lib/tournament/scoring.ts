/**
 * Match simulation and manual score validation.
 *
 * Table tennis rules modelled: games to 11, win by 2, best of N games. Per-rally
 * win probability comes from the rating gap and is clamped, so even a huge
 * mismatch still produces a plausible scoreline rather than 11-0, 11-0.
 */
import { rngFor, type Rng } from './rng'
import type { AnyMatch, GameScore, MatchBase, Player, Tournament, WinRule } from './types'

export const MAX_GAME_POINTS = 40 // hard stop for a runaway deuce

export function gamesToWin(bestOf: number): number {
  return Math.ceil(bestOf / 2)
}

/** Rating gap -> probability of winning a single rally. */
export function rallyProbability(ratingA = 1500, ratingB = 1500): number {
  const edge = Math.max(-0.19, Math.min(0.19, (ratingA - ratingB) / 2200))
  return 0.5 + edge
}

/**
 * One game to `target`. When `winBy2` the leader must be 2 clear (standard table
 * tennis deuce); otherwise the first to `target` takes it (Golden Point).
 */
function simulateGame(p: number, rng: Rng, target = 11, winBy2 = true): GameScore {
  const margin = winBy2 ? 2 : 1
  let a = 0
  let b = 0
  for (;;) {
    if (rng() < p) a += 1
    else b += 1
    if (a >= target && a - b >= margin) return [a, b]
    if (b >= target && b - a >= margin) return [a, b]
    if (a >= MAX_GAME_POINTS || b >= MAX_GAME_POINTS) {
      // Force a legal finish rather than loop forever.
      return a > b ? [Math.max(a, b + margin), b] : [a, Math.max(b, a + margin)]
    }
  }
}

export interface MatchSummary {
  games: GameScore[]
  gamesA: number
  gamesB: number
  pointsA: number
  pointsB: number
  winner: 'a' | 'b' | null
}

export function summarise(games: GameScore[]): MatchSummary {
  let gamesA = 0
  let gamesB = 0
  let pointsA = 0
  let pointsB = 0

  for (const [a, b] of games) {
    pointsA += a
    pointsB += b
    if (a > b) gamesA += 1
    else if (b > a) gamesB += 1
  }
  return { games, gamesA, gamesB, pointsA, pointsB, winner: gamesA > gamesB ? 'a' : gamesB > gamesA ? 'b' : null }
}

/**
 * Simulate one match.
 *
 * `forceWinner` re-rolls until the requested player wins — that is how
 * "organizer picked a winner without entering scores" yields a believable
 * scoreline instead of a fabricated 11-0.
 */
export function simulateMatch(opts: {
  ratingA?: number
  ratingB?: number
  bestOf?: number
  pointsToWin?: number
  winBy2?: boolean
  rng: Rng
  forceWinner?: 'a' | 'b' | null
}): MatchSummary {
  const { ratingA, ratingB, bestOf = 5, pointsToWin = 11, winBy2 = true, rng, forceWinner = null } = opts
  const need = gamesToWin(bestOf)
  const p = rallyProbability(ratingA, ratingB)

  for (let attempt = 0; attempt < 400; attempt++) {
    const games: GameScore[] = []
    let ga = 0
    let gb = 0
    while (ga < need && gb < need) {
      const game = simulateGame(p, rng, pointsToWin, winBy2)
      games.push(game)
      if (game[0] > game[1]) ga += 1
      else gb += 1
    }
    const winner: 'a' | 'b' = ga > gb ? 'a' : 'b'
    if (!forceWinner || forceWinner === winner) return summarise(games)
  }

  // Effectively unreachable; keeps the function total.
  const games: GameScore[] = Array.from({ length: need }, () => (forceWinner === 'b' ? [8, 11] : [11, 8]))
  return summarise(games)
}

/** Plausible match length in minutes — cosmetic only. */
export function estimateDuration(games: readonly GameScore[], rng: Rng): number {
  return games.length * 7 + Math.floor(rng() * 8)
}

export interface ValidationResult {
  ok: boolean
  winner: 'a' | 'b' | null
  games: GameScore[]
  errors: string[]
}

/** Validate a manually entered scoreline against the match's game rules. */
export function validateGames(
  games: ReadonlyArray<readonly [string | number, string | number]>,
  bestOf: number,
  pointsToWin = 11,
  winBy2 = true,
): ValidationResult {
  const errors: string[] = []
  const need = gamesToWin(bestOf)
  const deuceAt = pointsToWin - 1

  const clean: GameScore[] = games
    .filter((g) => g && (g[0] !== '' || g[1] !== ''))
    .map(([a, b]) => [Number(a) || 0, Number(b) || 0])

  if (clean.length === 0) errors.push('Enter at least one game score.')
  if (clean.length > bestOf) errors.push(`A best of ${bestOf} match cannot have more than ${bestOf} games.`)

  let ga = 0
  let gb = 0
  clean.forEach(([a, b], i) => {
    const hi = Math.max(a, b)
    const lo = Math.min(a, b)
    if (a === b) {
      errors.push(`Game ${i + 1} cannot be a draw.`)
    } else if (winBy2) {
      if (hi < pointsToWin) errors.push(`Game ${i + 1}: a game is won at ${pointsToWin} points.`)
      else if (hi > pointsToWin && hi - lo !== 2)
        errors.push(`Game ${i + 1}: past ${deuceAt}-${deuceAt} a game is won by exactly 2 points.`)
      else if (hi === pointsToWin && lo > deuceAt - 1)
        errors.push(`Game ${i + 1}: at ${deuceAt}-${deuceAt} the game continues until a 2 point lead.`)
    } else if (hi !== pointsToWin) {
      errors.push(`Game ${i + 1}: Golden Point — a game is won at exactly ${pointsToWin}.`)
    }
    if (a > b) ga += 1
    else if (b > a) gb += 1
  })

  if (Math.max(ga, gb) > need) errors.push(`A player cannot win more than ${need} games in a best of ${bestOf}.`)
  if (errors.length === 0 && Math.max(ga, gb) < need) errors.push(`Match incomplete — a player needs ${need} games.`)

  return { ok: errors.length === 0, winner: ga > gb ? 'a' : gb > ga ? 'b' : null, games: clean, errors }
}

export type MatchResultPatch = Pick<MatchBase, 'games' | 'winnerId' | 'played' | 'mode' | 'duration'>

/** The game-rule slice a simulation needs — a group or knockout rule set. */
export type MatchRules = Pick<Tournament, 'seed' | 'bestOf'> & {
  pointsToWin?: number
  winBy?: WinRule
}

/** Simulated result for a match — the "Auto" button everywhere in the UI. */
export function autoResult(
  match: AnyMatch,
  playerById: Map<string, Player>,
  tournament: MatchRules,
  attempt: number | string = 0,
): MatchResultPatch {
  const rng = rngFor(tournament.seed, match.id, attempt)
  const res = simulateMatch({
    ratingA: playerById.get(match.aId ?? '')?.rating,
    ratingB: playerById.get(match.bId ?? '')?.rating,
    bestOf: tournament.bestOf,
    pointsToWin: tournament.pointsToWin,
    winBy2: tournament.winBy !== 'golden',
    rng,
  })
  return {
    games: res.games,
    winnerId: res.winner === 'a' ? match.aId : match.bId,
    played: true,
    mode: 'auto',
    duration: estimateDuration(res.games, rng),
  }
}

/** Organizer picked a winner but entered no scores. */
export function winnerOnlyResult(
  match: AnyMatch,
  winnerId: string,
  playerById: Map<string, Player>,
  tournament: MatchRules,
  attempt: number | string = 0,
): MatchResultPatch {
  const rng = rngFor(tournament.seed, match.id, 'pick', winnerId, attempt)
  const res = simulateMatch({
    ratingA: playerById.get(match.aId ?? '')?.rating,
    ratingB: playerById.get(match.bId ?? '')?.rating,
    bestOf: tournament.bestOf,
    pointsToWin: tournament.pointsToWin,
    winBy2: tournament.winBy !== 'golden',
    rng,
    forceWinner: winnerId === match.aId ? 'a' : 'b',
  })
  return { games: res.games, winnerId, played: true, mode: 'manual', duration: estimateDuration(res.games, rng) }
}

export function formatGames(games: readonly GameScore[] | undefined): string {
  if (!games || games.length === 0) return '—'
  return games.map(([a, b]) => `${a}-${b}`).join(', ')
}

export function gameTally(games: readonly GameScore[] | undefined): string {
  let a = 0
  let b = 0
  for (const [x, y] of games ?? []) {
    if (x > y) a += 1
    else if (y > x) b += 1
  }
  return `${a}-${b}`
}
