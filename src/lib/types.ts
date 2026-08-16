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
}

export interface Club {
  id: string;
  name: string;
  location: string;
  state: string;
  description: string;
  logoUrl?: string;
  playerIds: string[];
  founded: number;
}

export type TournamentFormat = "SINGLE_ELIMINATION" | "POOL_KNOCKOUT";

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
  organizer: string;
  date: string;
  registrationDeadline: string;
  maxPlayers: number;
  registeredPlayerIds: string[];
  format: TournamentFormat;
  category: Category;
  entryFee: number;
  description: string;
  status: TournamentStatus;
  poolSize?: number;
  champion?: string;
  runnerUp?: string;
  semiFinalists?: string[];
}

export type EventStatus = "UPCOMING" | "LIVE" | "COMPLETED";

export interface TTEvent {
  id: string;
  name: string;
  organizer: string;
  venue: string;
  date: string;
  location: string;
  status: EventStatus;
  tournamentIds: string[];
  participatingClubIds: string[];
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
