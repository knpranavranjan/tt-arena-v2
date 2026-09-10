import { getDb } from "@/lib/db/client";
import { events, tournaments } from "@/lib/db/schema";
import type { EventRow, TournamentRow } from "@/lib/db/schema";
import type {
  RegistrationQuestion,
  Tournament,
  TournamentFormat,
  TournamentStatus,
  TTEvent,
} from "@/lib/types";
import type { TieBreakCriterionId } from "@/lib/tie-break";

function toEvent(r: EventRow): TTEvent {
  return {
    id: r.id,
    name: r.name,
    organizer: r.organizer,
    venue: r.venue,
    date: r.date,
    location: r.location,
    status: r.status as TTEvent["status"],
    tournamentIds: r.tournamentIds ?? [],
    participatingClubIds: r.participatingClubIds ?? [],
    ...(r.posterUrl ? { posterUrl: r.posterUrl } : {}),
  };
}

function toTournament(r: TournamentRow): Tournament {
  return {
    id: r.id,
    eventId: r.eventId,
    name: r.name,
    venue: r.venue,
    organizer: r.organizer,
    date: r.date,
    registrationDeadline: r.registrationDeadline,
    maxPlayers: r.maxPlayers,
    registeredPlayerIds: r.registeredPlayerIds ?? [],
    format: r.format as TournamentFormat,
    category: r.category,
    entryFee: r.entryFee,
    description: r.description,
    status: r.status as TournamentStatus,
    matchFormat: r.matchFormat,
    ballType: r.ballType,
    umpireStatus: r.umpireStatus,
    prizePool: r.prizePool,
    ...(r.totalPrizePool != null ? { totalPrizePool: r.totalPrizePool } : {}),
    ...(r.posterUrl ? { posterUrl: r.posterUrl } : {}),
    ...(r.registrationQuestions
      ? { registrationQuestions: r.registrationQuestions as RegistrationQuestion[] }
      : {}),
    ...(r.poolSize != null ? { poolSize: r.poolSize } : {}),
    ...(r.tieBreakOrder ? { tieBreakOrder: r.tieBreakOrder as TieBreakCriterionId[] } : {}),
    ...(r.champion ? { champion: r.champion } : {}),
    ...(r.runnerUp ? { runnerUp: r.runnerUp } : {}),
    ...(r.semiFinalists ? { semiFinalists: r.semiFinalists } : {}),
  };
}

export async function getHosted() {
  const db = getDb();
  const [evs, trns] = await Promise.all([
    db.select().from(events),
    db.select().from(tournaments),
  ]);
  return { events: evs.map(toEvent), tournaments: trns.map(toTournament) };
}

export async function addHosted(event: TTEvent, categories: Tournament[]) {
  const db = getDb();
  await db.insert(events).values({
    id: event.id,
    name: event.name,
    organizer: event.organizer,
    venue: event.venue,
    date: event.date,
    location: event.location,
    status: event.status,
    tournamentIds: event.tournamentIds ?? [],
    participatingClubIds: event.participatingClubIds ?? [],
    posterUrl: event.posterUrl ?? null,
    origin: "hosted",
  });

  if (categories.length) {
    await db.insert(tournaments).values(
      categories.map((t) => ({
        id: t.id,
        eventId: t.eventId,
        name: t.name,
        venue: t.venue,
        organizer: t.organizer,
        date: t.date,
        registrationDeadline: t.registrationDeadline,
        maxPlayers: t.maxPlayers,
        registeredPlayerIds: t.registeredPlayerIds ?? [],
        format: t.format,
        category: t.category,
        entryFee: t.entryFee,
        description: t.description,
        status: t.status,
        matchFormat: t.matchFormat,
        ballType: t.ballType,
        umpireStatus: t.umpireStatus,
        prizePool: t.prizePool,
        totalPrizePool: t.totalPrizePool ?? null,
        posterUrl: t.posterUrl ?? null,
        registrationQuestions: t.registrationQuestions ?? null,
        poolSize: t.poolSize ?? null,
        tieBreakOrder: t.tieBreakOrder ?? null,
        champion: t.champion ?? null,
        runnerUp: t.runnerUp ?? null,
        semiFinalists: t.semiFinalists ?? null,
        origin: "hosted",
      })),
    );
  }
}
