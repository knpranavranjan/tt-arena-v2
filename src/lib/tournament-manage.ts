/**
 * Shared derivation for the "manage tournament" surfaces.
 *
 * Overview and the Registrations table are **event-wide** — they aggregate
 * across every category (sibling `Tournament` record) of the event. Only the
 * Matches console is per-category. Both pages build from the helpers here so
 * they can never drift apart.
 *
 * Registrants come from two places:
 *   1. `registeredPlayerIds` on a tournament record (seed catalogue rosters).
 *   2. Live rows in the registrations store — the only source for tournaments
 *      created through "Host a Tournament", which start with an empty roster.
 *
 * No React imports — safe from any client component.
 */
import type { Player, Tournament } from "@/lib/types";
import { derivedPlayerPhone, getPlayer, getTournamentPlayers } from "@/lib/mock-data";

export type ManageRegStatus = "REGISTERED" | "PENDING_PAYMENT";

/** A roster entry — a seed player, or a real sign-up (which carries `phone`). */
type RosterPlayer = Player & { phone?: string | null };

/** Minimal shape of a registrations-store row (avoids a client-module import). */
interface LiveRegistration {
  tournamentId: string;
  playerId: string;
  playerName: string;
  status: string;
  createdAt: string;
}

/** `"<Event> — <Category>"` -> `"<Category>"`; a bare name falls back to `category`. */
export function categoryLabel(t: Pick<Tournament, "name" | "category">): string {
  const i = t.name.lastIndexOf(" — ");
  return (i > 0 ? t.name.slice(i + 3) : t.category || t.name).trim();
}

/**
 * The event's own name — what a player should see for a registration, without
 * the category. Prefer the real event record's name; otherwise strip the
 * `" — <Category>"` suffix from the category `Tournament`'s name.
 */
export function eventTitle(t: Pick<Tournament, "name">, eventName?: string | null): string {
  if (eventName && eventName.trim()) return eventName.trim();
  const i = t.name.lastIndexOf(" — ");
  return (i > 0 ? t.name.slice(0, i) : t.name).trim();
}

/** The real phone the player gave at sign-up, else a stable placeholder. */
function phoneFor(player: RosterPlayer | undefined): string {
  if (!player) return "—";
  const real = (player.phone ?? "").trim();
  return real || derivedPlayerPhone(player);
}

/* ---------------------------------------------------- per-category rows ---- */

export interface ManageRegistrant {
  playerId: string;
  name: string;
  clubName: string | null;
  /** The host division this row is for (e.g. "Men's Singles"). */
  division: string;
  phone: string;
  amountPaid: number;
  timeOfReg: string;
  status: ManageRegStatus;
  source: "roster" | "live";
}

/** Registrants for one category (`Tournament` record). */
export function buildRegistrants(
  tournament: Tournament,
  liveRegs: readonly LiveRegistration[],
  roster: readonly RosterPlayer[] = [],
): ManageRegistrant[] {
  const byId = new Map(roster.map((p) => [p.id, p]));
  const resolve = (id: string): RosterPlayer | undefined => byId.get(id) ?? getPlayer(id);
  const division = categoryLabel(tournament);

  const deadlineMs = new Date(tournament.registrationDeadline).getTime();
  const anchor = Number.isNaN(deadlineMs) ? Date.now() : deadlineMs;

  const rosterRows: ManageRegistrant[] = getTournamentPlayers(tournament).map((player, i) => {
    const seed = Number(player.id.replace(/\D/g, "")) || i + 1;
    const daysBefore = 1 + (seed % 10);
    return {
      playerId: player.id,
      name: player.name,
      clubName: player.clubName,
      division,
      phone: phoneFor(resolve(player.id) ?? player),
      amountPaid: tournament.entryFee,
      timeOfReg: new Date(anchor - daysBefore * 86_400_000).toISOString(),
      status: "REGISTERED",
      source: "roster",
    };
  });

  const seen = new Set(rosterRows.map((r) => r.playerId));
  const liveRows: ManageRegistrant[] = liveRegs
    .filter((r) => r.tournamentId === tournament.id && !seen.has(r.playerId))
    .map((r) => {
      const player = resolve(r.playerId);
      const registered = r.status === "REGISTERED";
      return {
        playerId: r.playerId,
        name: r.playerName || player?.name || "Player",
        clubName: player?.clubName ?? null,
        division,
        phone: phoneFor(player),
        amountPaid: registered ? tournament.entryFee : 0,
        timeOfReg: r.createdAt,
        status: registered ? "REGISTERED" : "PENDING_PAYMENT",
        source: "live",
      };
    });

  return [...rosterRows, ...liveRows];
}

/* ------------------------------------------------- event-wide aggregate --- */

export interface EventRegistrant {
  playerId: string;
  name: string;
  clubName: string | null;
  phone: string;
  /** Every host division this player registered for. */
  divisions: string[];
  /** = `divisions.length`. */
  entries: number;
  /** Total across the player's registered divisions. */
  amountPaid: number;
  /** Earliest registration time across their divisions. */
  timeOfReg: string;
  /** REGISTERED if any division is registered, else PENDING_PAYMENT. */
  status: ManageRegStatus;
}

/** One row per player, merged across every category of the event. */
export function buildEventRegistrants(
  siblings: readonly Tournament[],
  liveRegs: readonly LiveRegistration[],
  roster: readonly RosterPlayer[] = [],
): EventRegistrant[] {
  const byPlayer = new Map<string, EventRegistrant>();

  for (const t of siblings) {
    for (const row of buildRegistrants(t, liveRegs, roster)) {
      const existing = byPlayer.get(row.playerId);
      if (!existing) {
        byPlayer.set(row.playerId, {
          playerId: row.playerId,
          name: row.name,
          clubName: row.clubName,
          phone: row.phone,
          divisions: [row.division],
          entries: 1,
          amountPaid: row.amountPaid,
          timeOfReg: row.timeOfReg,
          status: row.status,
        });
        continue;
      }
      if (!existing.divisions.includes(row.division)) {
        existing.divisions.push(row.division);
        existing.entries = existing.divisions.length;
      }
      existing.amountPaid += row.amountPaid;
      if (row.status === "REGISTERED") existing.status = "REGISTERED";
      if (row.timeOfReg < existing.timeOfReg) existing.timeOfReg = row.timeOfReg;
      if (!existing.phone || existing.phone === "—") existing.phone = row.phone;
    }
  }

  return [...byPlayer.values()].sort(
    (a, b) => new Date(b.timeOfReg).getTime() - new Date(a.timeOfReg).getTime(),
  );
}

export interface OverviewTotals {
  totalRegistrations: number;
  feeCollected: number;
  feeRefunded: number;
  payoutPending: number;
}

export function eventOverviewTotals(registrants: readonly EventRegistrant[]): OverviewTotals {
  return {
    totalRegistrations: registrants.length,
    feeCollected: registrants.reduce((sum, r) => sum + r.amountPaid, 0),
    feeRefunded: 0,
    payoutPending: 0,
  };
}

export interface CategoryBreakdownRow {
  category: string;
  spotsFilled: number;
  spotsTotal: number;
  feeCollected: number;
}

/** One row per host division — always shown, even with zero registrations. */
export function eventCategoryBreakdown(
  siblings: readonly Tournament[],
  liveRegs: readonly LiveRegistration[],
  roster: readonly RosterPlayer[] = [],
): CategoryBreakdownRow[] {
  return siblings
    .map((t) => {
      const rows = buildRegistrants(t, liveRegs, roster);
      return {
        category: categoryLabel(t),
        spotsFilled: rows.length,
        spotsTotal: Math.max(t.maxPlayers || 32, rows.length),
        feeCollected: rows.reduce((s, r) => s + r.amountPaid, 0),
      };
    })
    .sort((a, b) => b.spotsFilled - a.spotsFilled || a.category.localeCompare(b.category));
}
