/**
 * Database schema — one Postgres database (Neon now, AWS RDS/Aurora later).
 *
 * Only *mutable, user-generated* data lives here. The seed catalogue
 * (`src/lib/mock-data.ts`: roster players, clubs, seed events/tournaments,
 * pools, seed matches, appUsers) stays in code for this round and is merged
 * with these rows at read time — see `useAllTournaments` / `useAllEvents`.
 *
 * Column names are emitted as snake_case (see `casing: "snake_case"` in
 * `client.ts` and `drizzle.config.ts`); write camelCase here.
 *
 * Date-ish product fields (`date`, `registrationDeadline`, `createdAt` coming
 * from a store, …) are kept as `text` ISO strings — that's exactly what the
 * app reads/writes today, so nothing downstream has to change. `timestamp`
 * columns are server bookkeeping only.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { RegistrationQuestion } from "@/lib/types";
import type { TieBreakCriterionId } from "@/lib/tie-break";

/* ------------------------------------------------------------------ accounts */

export const accounts = pgTable(
  "accounts",
  {
    /** Stable account id — reuses the seed AppUser id (`u-1`…) where there is
     *  one, otherwise `acc-<spinid>`. */
    id: text().primaryKey(),
    /** SPINID login handle, e.g. `SRP01`. Matched case-insensitively. */
    uniqueId: text().notNull(),
    name: text().notNull(),
    passwordHash: text().notNull(),
    passwordSalt: text().notNull(),
    role: text().notNull(),
    email: text().notNull().default(""),
    /** Seed player / club this login previews as (demo parity). */
    linkedId: text(),
    /** True for the four built-in logins. */
    seed: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("accounts_unique_id_ci").on(sql`lower(${t.uniqueId})`),
    uniqueIndex("accounts_email_ci")
      .on(sql`lower(${t.email})`)
      .where(sql`${t.email} <> ''`),
  ],
);

/* ------------------------------------------- hosted events + tournaments ---- */

export const events = pgTable("events", {
  id: text().primaryKey(),
  name: text().notNull(),
  organizer: text().notNull(),
  venue: text().notNull(),
  date: text().notNull(),
  location: text().notNull(),
  status: text().notNull(),
  tournamentIds: jsonb().$type<string[]>().notNull().default([]),
  participatingClubIds: jsonb().$type<string[]>().notNull().default([]),
  posterUrl: text(),
  /** `hosted` for now — leaves room to fold the seed catalogue in later. */
  origin: text().notNull().default("hosted"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const tournaments = pgTable("tournaments", {
  id: text().primaryKey(),
  eventId: text().notNull(),
  name: text().notNull(),
  venue: text().notNull(),
  organizer: text().notNull(),
  date: text().notNull(),
  registrationDeadline: text().notNull(),
  maxPlayers: integer().notNull().default(32),
  registeredPlayerIds: jsonb().$type<string[]>().notNull().default([]),
  format: text().notNull(),
  category: text().notNull(),
  entryFee: integer().notNull().default(0),
  description: text().notNull().default(""),
  status: text().notNull(),
  matchFormat: text().notNull().default("Best of 5 sets"),
  ballType: text().notNull().default("Plastic 40+, 3-star (match)"),
  umpireStatus: text().notNull().default("No – self-officiated"),
  prizePool: integer().notNull().default(0),
  totalPrizePool: integer(),
  posterUrl: text(),
  registrationQuestions: jsonb().$type<RegistrationQuestion[]>(),
  poolSize: integer(),
  tieBreakOrder: jsonb().$type<TieBreakCriterionId[]>(),
  champion: text(),
  runnerUp: text(),
  semiFinalists: jsonb().$type<string[]>(),
  origin: text().notNull().default("hosted"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ---------------------------------------------- lifecycle status override --- */

export const tournamentStatusOverrides = pgTable("tournament_status_overrides", {
  tournamentId: text().primaryKey(),
  status: text().notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------ post go-live host edits --- */

export const tournamentEdits = pgTable(
  "tournament_edits",
  {
    /** `tournament` | `event` — the two patch namespaces in tournament-edits.tsx. */
    kind: text().notNull(),
    targetId: text().notNull(),
    patch: jsonb().$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.kind, t.targetId] })],
);

/* ----------------------------------------------------------- registrations -- */

export const registrations = pgTable(
  "registrations",
  {
    id: text().primaryKey(),
    tournamentId: text().notNull(),
    playerId: text().notNull(),
    playerName: text().notNull(),
    status: text().notNull(),
    answers: jsonb().$type<{ question: string; answer: string }[]>(),
    createdAt: text().notNull(),
  },
  (t) => [uniqueIndex("registrations_tournament_player").on(t.tournamentId, t.playerId)],
);

/* ------------------------------------------------- delegated console access - */

export const tournamentAssistants = pgTable(
  "tournament_assistants",
  {
    id: text().primaryKey(),
    tournamentId: text().notNull(),
    uniqueId: text().notNull(),
    name: text().notNull(),
    role: text().notNull(),
    personId: text(),
    addedAt: text().notNull(),
  },
  (t) => [
    uniqueIndex("tournament_assistants_tournament_uid").on(
      t.tournamentId,
      sql`lower(${t.uniqueId})`,
    ),
  ],
);

/* -------------------------------------------------------- player ratings ---- */

export const playerRatingOverrides = pgTable("player_rating_overrides", {
  playerId: text().primaryKey(),
  rating: integer().notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const ratingChangeLog = pgTable("rating_change_log", {
  id: text().primaryKey(),
  playerId: text().notNull(),
  tournamentId: text().notNull(),
  tournamentName: text().notNull(),
  categoryId: text().notNull(),
  categoryName: text().notNull(),
  date: text().notNull(),
  appliedAt: text().notNull(),
  previousRating: integer().notNull(),
  newRating: integer().notNull(),
  delta: integer().notNull(),
  matchesCounted: integer().notNull(),
});

/** Idempotency guard — `${tournamentId}:${categoryId}` already applied. */
export const ratingAppliedKeys = pgTable("rating_applied_keys", {
  key: text().primaryKey(),
  appliedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* --------------------------------------------------------- hosting plans ---- */

export const hostingPlans = pgTable("hosting_plans", {
  id: text().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  price: integer().notNull(),
});

/* ----------------------------------------------------------- memberships ---- */

export const memberships = pgTable("memberships", {
  userId: text().primaryKey(),
  role: text().notNull(),
  expiresAt: text().notNull(),
});

export const membershipFees = pgTable("membership_fees", {
  id: text().primaryKey().default("default"),
  playerFee: integer().notNull(),
  clubFee: integer().notNull(),
});

/* --------------------------------------------------------- join requests ---- */

export const joinRequests = pgTable("join_requests", {
  id: text().primaryKey(),
  clubId: text().notNull(),
  playerId: text().notNull(),
  playerName: text().notNull(),
  status: text().notNull(),
  createdAt: text().notNull(),
});

/* ------------------------------------------------------ notification reads -- */

export const notificationReads = pgTable(
  "notification_reads",
  {
    userId: text().notNull(),
    notificationId: text().notNull(),
    readAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.notificationId] })],
);

/* ------------------------------------------------------------------ exports - */

export const schema = {
  accounts,
  events,
  tournaments,
  tournamentStatusOverrides,
  tournamentEdits,
  registrations,
  tournamentAssistants,
  playerRatingOverrides,
  ratingChangeLog,
  ratingAppliedKeys,
  hostingPlans,
  memberships,
  membershipFees,
  joinRequests,
  notificationReads,
};

export type AccountRow = typeof accounts.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type TournamentRow = typeof tournaments.$inferSelect;
export type RegistrationRow = typeof registrations.$inferSelect;
export type TournamentAssistantRow = typeof tournamentAssistants.$inferSelect;
export type RatingChangeRow = typeof ratingChangeLog.$inferSelect;
export type HostingPlanRow = typeof hostingPlans.$inferSelect;
export type MembershipRow = typeof memberships.$inferSelect;
export type JoinRequestRow = typeof joinRequests.$inferSelect;
