import type { Tournament, TournamentFormat, TournamentStatus, TTEvent } from "@/lib/types";

/**
 * A host creates one event with several category records (`Tournament`s that
 * share an `eventId`). Everywhere we list or approve "tournaments" we really
 * want one row per event, with the categories folded in — this builds that view.
 */
export interface EventGroup {
  eventId: string;
  event?: TTEvent;
  name: string;
  date: string;
  venue: string;
  organizer: string;
  format: TournamentFormat;
  categories: Tournament[];
  /** The category to link to (prefers one open for registration). */
  primary: Tournament;
  /** Unique players across every category. */
  registeredCount: number;
}

// Most-active status wins when an event's categories are at different stages,
// so one badge/section still reads true for the event as a whole.
const STATUS_PRIORITY: TournamentStatus[] = [
  "KNOCKOUT",
  "POOLS",
  "SEEDING",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "DRAFT",
  "COMPLETED",
];

export function mostActiveStatus(statuses: TournamentStatus[]): TournamentStatus {
  return [...statuses].sort(
    (a, b) => STATUS_PRIORITY.indexOf(a) - STATUS_PRIORITY.indexOf(b),
  )[0];
}

export function buildEventGroups(tournaments: Tournament[], events: TTEvent[]): EventGroup[] {
  const byEvent = new Map<string, Tournament[]>();
  for (const t of tournaments) {
    const bucket = byEvent.get(t.eventId);
    if (bucket) bucket.push(t);
    else byEvent.set(t.eventId, [t]);
  }

  const groups: EventGroup[] = [];
  for (const [eventId, categories] of byEvent) {
    const event = events.find((e) => e.id === eventId);
    const primary = categories.find((c) => c.status === "REGISTRATION_OPEN") ?? categories[0];
    groups.push({
      eventId,
      event,
      // `Tournament.name` is "<Event> — <Category>"; fall back to that stem.
      name: event?.name ?? primary.name.split(" — ")[0],
      date: primary.date,
      venue: primary.venue,
      organizer: primary.organizer,
      format: primary.format,
      categories,
      primary,
      registeredCount: new Set(categories.flatMap((c) => c.registeredPlayerIds)).size,
    });
  }
  return groups;
}

export function categoryCountLabel(group: EventGroup): string {
  return group.categories.length === 1
    ? group.categories[0].category
    : `${group.categories.length} categories`;
}
