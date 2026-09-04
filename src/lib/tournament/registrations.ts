/**
 * The registration (money) layer.
 *
 * A registration is a paid booking that may cover several categories at once.
 * Each entry on the booking points at the player record inside that category's
 * draw, which is the only place this layer touches the match engine.
 */
import { rngFor } from './rng'
import type {
  CategoryBreakdown,
  CategoryEntry,
  OverviewTotals,
  Player,
  PayoutStatus,
  Registration,
  RegistrationStatus,
} from './types'

/** Payment gateway cut, which is why booking amounts are never round numbers. */
export const PLATFORM_FEE_PCT = 0.0295

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function bookingAmount(feeTotal: number): number {
  return round2(feeTotal * (1 + PLATFORM_FEE_PCT))
}

/**
 * Two-character table chip for a category.
 *   Men's Singles Pro -> MS      Mixed Doubles -> XD
 *   35+ Doubles       -> 35      Under-19 Doubles -> 19
 */
export function categoryCode(name: string): string {
  const digits = name.match(/\d{2}/)
  if (digits) return digits[0]

  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  if (words.length === 0) return '??'
  // "Mixed Doubles" is conventionally XD, but "Mixed Team Event" is MT.
  if (words.length === 2 && words[0].toLowerCase() === 'mixed') return `X${words[1][0]}`.toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

const STATUS_POOL: RegistrationStatus[] = [
  'booked', 'booked', 'booked', 'booked', 'booked', 'booked', 'booked', 'paid', 'paid', 'pending',
]

/** Organizer edits (refunds, status changes) layered over the derived ledger. */
export type RegistrationOverrides = Record<string, Partial<Registration>>

export function registrationId(categoryId: string, playerId: string): string {
  return `reg_${categoryId}_${playerId}`
}

/**
 * Derive the booking ledger from the players already sitting in each draw.
 *
 * Every payment fact is a pure function of the player id and the tournament
 * seed, so the ledger can never drift out of sync with the draws: add a player
 * and their booking appears, remove them and it disappears. Organizer actions
 * that genuinely change a booking — a refund, a status correction — are applied
 * on top through `overrides`.
 */
export function deriveRegistrations(
  categories: readonly CategoryEntry[],
  playersByCategory: Map<string, readonly Player[]>,
  seed: string | number,
  eventDate: string,
  overrides: RegistrationOverrides = {},
): Registration[] {
  const end = new Date(eventDate)
  const endMs = Number.isNaN(end.getTime()) ? Date.now() : end.getTime()
  const windowMs = 12 * 24 * 60 * 60 * 1000
  const out: Registration[] = []

  for (const category of categories) {
    for (const player of playersByCategory.get(category.id) ?? []) {
      // One RNG per booking, keyed on the player — order-independent and stable.
      const rng = rngFor(seed, 'booking', category.id, player.id)
      const status = STATUS_POOL[Math.floor(rng() * STATUS_POOL.length)]
      const phoneTail = Math.floor(rng() * 900000000 + 100000000)
      const registeredAt = new Date(endMs - windowMs * rng()).toISOString()
      const payoutStatus: PayoutStatus = rng() < 0.85 ? 'pending' : 'settled'
      const offline = rng() < 0.08
      const amount = bookingAmount(category.entryFee)
      const id = registrationId(category.id, player.id)

      const base: Registration = {
        id,
        bookingId: `TT${Math.floor(rng() * 0xfffff).toString(36).toUpperCase().padStart(4, '0')}`,
        name: player.name,
        phone: `9${phoneTail}`,
        entries: [{ categoryId: category.id, playerId: player.id, slots: 1 }],
        amountPaid: amount,
        amountRefunded: 0,
        registeredAt,
        status,
        payoutStatus,
        offline,
      }

      out.push(overrides[id] ? { ...base, ...overrides[id] } : base)
    }
  }

  return out.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
}

/** A refund zeroes the amount paid and moves the money to the refunded column. */
export function refundPatch(reg: Registration): Partial<Registration> {
  return { status: 'refunded', amountPaid: 0, amountRefunded: reg.amountPaid, payoutStatus: 'na' }
}

export function isLiveEntry(status: RegistrationStatus): boolean {
  return status !== 'refunded' && status !== 'cancelled'
}

/** Everything the Overview page shows, derived from the ledger. */
export function computeOverview(
  categories: readonly CategoryEntry[],
  registrations: readonly Registration[],
): OverviewTotals {
  const breakdown = new Map<string, CategoryBreakdown>(
    categories.map((c) => [
      c.id,
      { category: c, booked: 0, spots: c.maxPlayers, fillPct: 0, feeCollected: 0, feeRefunded: 0 },
    ]),
  )

  let registrationCount = 0
  let feeCollected = 0
  let feeRefunded = 0
  let payoutPending = 0

  for (const reg of registrations) {
    const live = isLiveEntry(reg.status)
    if (live) registrationCount += reg.entries.reduce((n, e) => n + e.slots, 0)
    feeCollected += reg.amountPaid
    feeRefunded += reg.amountRefunded
    // Money collected that has not yet been settled out to the organizer.
    if (reg.payoutStatus === 'pending' && live) payoutPending += reg.amountPaid

    for (const entry of reg.entries) {
      const row = breakdown.get(entry.categoryId)
      if (!row) continue
      const share = reg.entries.length > 0 ? reg.amountPaid / reg.entries.length : 0
      const refundShare = reg.entries.length > 0 ? reg.amountRefunded / reg.entries.length : 0
      if (live) row.booked += entry.slots
      row.feeCollected += share
      row.feeRefunded += refundShare
    }
  }

  const rows = [...breakdown.values()].map((row) => ({
    ...row,
    feeCollected: Math.round(row.feeCollected),
    feeRefunded: Math.round(row.feeRefunded),
    fillPct: row.spots > 0 ? Math.min(100, Math.round((row.booked / row.spots) * 100)) : 0,
  }))

  return {
    registrations: registrationCount,
    feeCollected: Math.round(feeCollected),
    feeRefunded: Math.round(feeRefunded),
    payoutPending: Math.round(payoutPending),
    categories: rows,
  }
}

/** Fill-rate colour bands used by the breakdown table. */
export function fillTone(pct: number): 'full' | 'high' | 'normal' {
  if (pct >= 100) return 'full'
  if (pct >= 97) return 'high'
  return 'normal'
}
