/**
 * Domain types for the tournament engine.
 *
 * The engine is deliberately framework-free: no React, no Next.js, no I/O.
 * Everything is a pure function over these structures so the algorithm can be
 * validated in isolation (see `tests/`).
 */

/** One person inside a doubles team entry. */
export interface PairMember {
  id: string
  name: string
  /** Kept so a pair's average rating survives split / re-pair. */
  rating?: number
}

export interface Player {
  id: string
  name: string
  rating: number
  club: string
  state: string
  /**
   * For doubles categories this competitor is a pair — the two people who play
   * together. Absent for singles, where the competitor is one person.
   */
  members?: PairMember[]
}

export interface SeededPlayer extends Player {
  /** 1 = highest rated. Derived, never stored on the player record. */
  seed: number
}

/** Points scored by side A and side B in one game. */
export type GameScore = [number, number]

export type EntryMode = 'auto' | 'manual' | 'bye' | null

export interface MatchBase {
  id: string
  aId: string | null
  bId: string | null
  games: GameScore[]
  winnerId: string | null
  played: boolean
  mode: EntryMode
  table: number
  duration: number | null
}

export interface PoolMatch extends MatchBase {
  poolId: string
  /** Round robin round number, 1-indexed. */
  round: number
}

export interface KnockoutMatch extends MatchBase {
  /** 0 = first round of the bracket. */
  round: number
  index: number
  isBye: boolean
}

export type AnyMatch = PoolMatch | KnockoutMatch

export interface Pool {
  id: string
  name: string
  capacity: number
  playerIds: string[]
}

export interface StandingsRow {
  playerId: string
  played: number
  won: number
  lost: number
  gamesFor: number
  gamesAgainst: number
  pointsFor: number
  pointsAgainst: number
  gameDiff: number
  pointDiff: number
  /** ITTF style: 2 points for a win, 1 for a match played and lost. */
  matchPoints: number
}

export interface RankedRow extends StandingsRow {
  rank: number
  /** Non-null when this player was level on matches won with someone else. */
  tieGroup: number | null
  tieRule: TieBreakRule | null
}

export type TieBreakRule =
  | 'matches_won'
  | 'point_diff'
  | 'points_scored'
  | 'head_to_head'
  | 'games_diff'
  | 'lottery'

export type QualificationRule = 'winners_fill' | 'winners_only' | 'top2' | 'top2_fill'

export type TournamentFormat = 'pools_ko' | 'rr_only' | 'ko_only'

/** How a game ends: `golden` = first to the target; `win_by_two` = must lead by 2. */
export type WinRule = 'golden' | 'win_by_two'

/** Group-table points awarded per match result. */
export interface GamePoints {
  win: number
  draw: number
  loss: number
}

/**
 * `custom` creates the pool shells but leaves them empty, so the organizer
 * drags every player into place by hand.
 */
export type AllocationMethod = 'snake' | 'sequential' | 'random' | 'custom'

export type NameStyle = 'numbered' | 'realistic'

export type PoolSizePreference = 'auto' | number

export interface Qualifier {
  playerId: string
  poolId: string | null
  poolName: string
  /** Finishing position inside the pool (1 = pool winner). */
  rankInPool: number
  row: RankedRow | null
  winRatio: number
  qualSeed: number
  /** Promoted as a best runner-up to fill the bracket. */
  viaFill?: boolean
  /** Forced in by the organizer. */
  manual?: boolean
}

export interface QualificationResult {
  qualifiers: Qualifier[]
  directCount: number
  promoted: Qualifier[]
  contenders: Qualifier[]
  missed: Qualifier[]
  eliminated: Qualifier[]
  /**
   * Every player who finished a pool, in algorithmic seeding order. The
   * organizer's editor works from this list, so someone removed from the
   * qualifiers can always be put back.
   */
  allEntries: Qualifier[]
  bracketSize: number
  byes: number
  advancePerPool: number
  fill: boolean
  /** True when pools differ in size, so raw win totals are not comparable. */
  unevenPools: boolean
}

export interface BracketSlot {
  slot: number
  playerId: string | null
  poolId?: string | null
  rankInPool?: number
  bye?: boolean
}

export interface Bracket {
  size: number
  rounds: KnockoutMatch[][]
  seeding: BracketSlot[]
  /** Optional play-off between the two semi-final losers. */
  thirdPlace: KnockoutMatch | null
}

export type CategoryFormat = 'singles' | 'doubles'

/** One event within the tournament — its own entry list, pools and bracket. */
export interface CategoryEntry {
  id: string
  name: string
  /** Total spots on sale. Also the cap on the draw. */
  maxPlayers: number
  /** Two-letter table chip, e.g. MS, WD, XD. */
  code: string
  entryFee: number
  prizePool: number
  /** Free-text grade shown as a pill: Pro, Open, Intermediate… */
  level: string
  format: CategoryFormat
}

export interface Tournament {
  id: string
  name: string
  location: string
  organizer: string
  date: string
  endDate: string
  /** Public reference code, e.g. #GSTT-2026-CHN. */
  code: string
  status: TournamentStatus
  sport: string
  city: string
  /** Each category runs as its own draw, with its own entry cap. */
  categories: CategoryEntry[]
  venues: Venue[]
  rules: string[]
  organizers: Organizer[]
  sponsors: Sponsor[]
  partners: Partner[]
  creatives: Creative[]
  format: TournamentFormat
  description: string
  poolSizePreference: PoolSizePreference
  tieBreakRule: TieBreakRule
  qualificationRule: QualificationRule
  bestOf: number
  tables: number
  separatePools: boolean
  /** Play a third-place match between the two semi-final losers. */
  thirdPlace: boolean
  /* ---- per-category rules set on the "Set Rules" screen (optional so every
     existing caller and `defaultTournament()` stay valid) ---- */
  /** Players who qualify for the knockout from each group. */
  advancePerPool?: number
  /** Group-table points for win / draw / loss. */
  groupPoints?: GamePoints
  /** Group stage: games per match. */
  groupBestOf?: number
  /** Group stage: points to win a game. */
  groupPointsToWin?: number
  /** Group stage: how a game ends. */
  groupWinBy?: WinRule
  /** Knockout — quarter-finals and every earlier round: games per match. */
  koBestOf?: number
  /** Knockout — quarter-finals and every earlier round: points to win a game. */
  koPointsToWin?: number
  /** Knockout — semi-finals, final and the third-place play-off: games per match.
   *  Falls back to `koBestOf` when unset. */
  koSemiFinalBestOf?: number
  /** Knockout — semi-finals, final and the third-place play-off: points to win a
   *  game. Falls back to `koPointsToWin` when unset. */
  koSemiFinalPointsToWin?: number
  /** Knockout stage: how a game ends (applies to every knockout round). */
  koWinBy?: WinRule
  generateSample: boolean
  sampleCount: number
  nameStyle: NameStyle
  /** Drives every random decision, so a tournament is fully reproducible. */
  seed: number
  createdAt: string
}

export interface PoolStandings {
  pool: Pool
  rows: RankedRow[]
}

export interface HistoryEntry {
  id: string
  archivedAt: string
  tournament: Tournament
  /** The category whose draw this snapshot captures. */
  category: CategoryEntry
  playerCount: number
  players: Player[]
  seeded: SeededPlayer[]
  pools: Pool[] | null
  poolMatches: PoolMatch[]
  standings: PoolStandings[]
  qualification: QualificationResult | null
  bracket: Bracket | null
  championId: string | null
  runnerUpId: string | null
  thirdPlaceId: string | null
  fourthPlaceId: string | null
  semiFinalists: string[]
  quarterFinalists: string[]
}

/* ------------------------------------------------------------ event record */
/*
 * Everything below describes the event as a product: who is running it, where
 * it happens, and who has paid to enter. The match engine above never reads any
 * of it — the two layers meet only at `Registration.playerId`, which is the
 * player the algorithm actually draws.
 */

export type TournamentStatus = 'draft' | 'live' | 'completed'

export interface Venue {
  id: string
  name: string
  address: string
  city: string
}

export interface Organizer {
  id: string
  name: string
  phones: string[]
  instagram: string
}

export interface Sponsor {
  id: string
  name: string
  /** Title Sponsor, Equipment Sponsor, Beverage Partner… */
  tier: string
}

export interface Partner {
  id: string
  name: string
  /** Short mark shown in the tile when there is no logo image. */
  initials: string
}

export interface Creative {
  id: string
  label: string
}

export type RegistrationStatus = 'booked' | 'paid' | 'pending' | 'refunded' | 'cancelled'
export type PayoutStatus = 'pending' | 'settled' | 'na'

/** One category a registration bought into. */
export interface RegistrationEntry {
  categoryId: string
  /** The player record this entry created in that category's draw. */
  playerId: string
  slots: number
}

/**
 * A paid entry. One person can enter several categories on a single booking,
 * which is why `entries` is a list and the amount is per booking, not per draw.
 */
export interface Registration {
  id: string
  bookingId: string
  name: string
  phone: string
  entries: RegistrationEntry[]
  amountPaid: number
  amountRefunded: number
  registeredAt: string
  status: RegistrationStatus
  payoutStatus: PayoutStatus
  /** Booked at the desk rather than online. */
  offline: boolean
}

/** Per-category rollup shown on the Overview breakdown table. */
export interface CategoryBreakdown {
  category: CategoryEntry
  booked: number
  spots: number
  fillPct: number
  feeCollected: number
  feeRefunded: number
}

export interface OverviewTotals {
  registrations: number
  feeCollected: number
  feeRefunded: number
  payoutPending: number
  categories: CategoryBreakdown[]
}
