import type { TieBreakCriterionId } from "@/lib/tie-break";

export type Role = "PLAYER" | "CLUB" | "HOST" | "ADMIN";

export type Category = "Under 13" | "Under 17" | "Under 21" | "Senior" | "Veteran (40+)";

export type Gender = "MALE" | "FEMALE";

export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  clubId: string | null;
  clubName: string | null;
  state: string;
  category: Category;
  gender: Gender;
  rating: number;
  dateOfBirth: string;
  wins: number;
  losses: number;
  recentForm: ("W" | "L")[];
  playStyle?: string;
}

export interface ClubFacilities {
  tableCount: number;
  tableVarieties: string;
  floorType: string;
  floorGrade: string;
  lighting: string;
  isAirConditioned: boolean;
  hasWashroom: boolean;
  hasParking: boolean;
  hasROWater: boolean;
  seatingCapacity: number;
}

export interface Club {
  id: string;
  name: string;
  location: string;
  state: string;
  address: string;
  /** Exact pin from "use current location" at sign-up. When absent, the map is
   *  placed from `address`. */
  coordinates?: { lat: number; lng: number };
  description: string;
  aboutHighlights: string[];
  logoUrl?: string;
  playerIds: string[];
  founded: number;
  phone: string;
  email: string;
  verified: boolean;
  facilities: ClubFacilities;
}

export type TournamentFormat = "SINGLE_ELIMINATION" | "POOL_KNOCKOUT" | "ROUND_ROBIN_LEAGUE";

export type QuestionResponseType = "Multiple Choice" | "Short Answer" | "Yes / No";

export interface RegistrationQuestion {
  question: string;
  responseType: QuestionResponseType;
  options?: string[];
}

export type TournamentStatus =
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "SEEDING"
  | "POOLS"
  | "KNOCKOUT"
  | "COMPLETED";

export type RegistrationStatus =
  | "AVAILABLE"
  | "REGISTERED"
  | "REGISTRATION_CLOSED"
  | "TOURNAMENT_STARTED"
  | "COMPLETED"
  | "WITHDRAWN";

export interface Tournament {
  id: string;
  eventId: string;
  name: string;
  venue: string;
  /** Display name of the host. NOT unique — a player and a club can share a
   *  name. Never use this to decide ownership; use `organizerId`. */
  organizer: string;
  /** SPINID of the account that created this via "Host a Tournament" — the
   *  canonical, unique owner identity. Absent on the seed catalogue. */
  organizerId?: string;
  date: string;
  registrationDeadline: string;
  maxPlayers: number;
  registeredPlayerIds: string[];
  format: TournamentFormat;
  // Freeform, unlike Player.category — hosts can name a division anything
  // ("Under 15", "Open", "Veterans 45+"), not just the fixed player brackets.
  category: string;
  entryFee: number;
  description: string;
  status: TournamentStatus;
  matchFormat: string;
  ballType: string;
  umpireStatus: string;
  prizePool: number;
  /** Combined cash pool across every category of the parent event. */
  totalPrizePool?: number;
  /** Standardised 4:5 portrait poster (data URL or path), shown on the event page. */
  posterUrl?: string;
  /** Custom questions the host asks each player at registration. */
  registrationQuestions?: RegistrationQuestion[];
  poolSize?: number;
  /** Host-set priority order the group-stage tie-break algorithm walks in the
   *  live match console. Ids from `TIE_BREAK_CRITERIA`; when absent the engine
   *  falls back to `DEFAULT_TIE_BREAK_ORDER`. */
  tieBreakOrder?: TieBreakCriterionId[];
  champion?: string;
  runnerUp?: string;
  semiFinalists?: string[];
}

export type EventStatus = "UPCOMING" | "LIVE" | "COMPLETED";

export interface TTEvent {
  id: string;
  name: string;
  /** Display name of the host — NOT unique. Use `organizerId` for ownership. */
  organizer: string;
  /** SPINID of the account that created this. Absent on the seed catalogue. */
  organizerId?: string;
  venue: string;
  date: string;
  location: string;
  status: EventStatus;
  tournamentIds: string[];
  participatingClubIds: string[];
  /** Standardised 4:5 portrait poster (data URL or path). */
  posterUrl?: string;
}

export interface Pool {
  id: string;
  tournamentId: string;
  name: string;
  playerIds: string[];
}

export interface PoolStanding {
  playerId: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
  qualified: boolean;
}

export type MatchStatus = "SCHEDULED" | "LIVE" | "COMPLETED";

export interface Match {
  id: string;
  tournamentId: string;
  round: string;
  table: number;
  playerAId: string;
  playerBId: string;
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  winnerId?: string;
}

export type RatingExportStatus = "PENDING" | "SENT" | "FAILED";

export interface RatingExport {
  tournamentId: string;
  status: RatingExportStatus;
  createdAt: string;
  sentAt?: string;
  lastAttempt: string;
  response?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
  linkedId: string | null;
}
