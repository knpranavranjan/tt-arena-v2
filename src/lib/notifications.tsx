"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/auth";
import { useCurrentClub, useCurrentPlayer } from "@/lib/session-data";
import { useRegistrations } from "@/lib/registrations";
import { useJoinRequests } from "@/lib/join-requests";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { useMembershipStatus } from "@/lib/membership";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { useTournamentAssistants } from "@/lib/tournament-assistants";
import { useConsoleTournamentIds, useLiveTournaments, type LiveTournament } from "@/lib/live-schedule";
import { buildEventGroups } from "@/lib/event-groups";
import { clubs, getEvent } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { Tournament, TTEvent } from "@/lib/types";

export type NotifTone = "info" | "success" | "warn" | "danger";
export type NotifCategory = "reminder" | "payment" | "request" | "result" | "status";

export interface AppNotification {
  /** Deterministic — derived from live state, not an event log. */
  id: string;
  tone: NotifTone;
  category: NotifCategory;
  title: string;
  body?: string;
  href: string;
  /** epoch ms — for ordering and "x ago". */
  ts: number;
}

const READ_KEY = "tt-demo-notif-read";
const REMINDER_WINDOW_DAYS = 21;

/* -------------------------------------------------------- read state ---- */

interface NotificationsContextValue {
  readIds: Set<string>;
  markRead: (id: string) => void;
  markManyRead: (ids: string[]) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function readStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Hydrate the read-set on mount and stay in sync with other tabs — the same
    // localStorage-store shape used across this codebase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReadIds(new Set(readStorage()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === READ_KEY) setReadIds(new Set(readStorage()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setReadIds(next);
    window.localStorage.setItem(READ_KEY, JSON.stringify([...next]));
  }, []);

  const markRead = useCallback(
    (id: string) => persist(new Set([...readStorage(), id])),
    [persist],
  );
  const markManyRead = useCallback(
    (ids: string[]) => persist(new Set([...readStorage(), ...ids])),
    [persist],
  );

  const value = useMemo(() => ({ readIds, markRead, markManyRead }), [readIds, markRead, markManyRead]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

/* -------------------------------------------------------- derivation ---- */

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  return Math.ceil((d - Date.now()) / 86_400_000);
}

/** The player's next unplayed match in a published category, if any. */
function nextMatchFor(t: LiveTournament, playerId: string) {
  for (const cat of t.categories) {
    for (const pool of cat.pools) {
      const m = cat.poolMatches.find(
        (x) =>
          x.poolId === pool.id &&
          !x.played &&
          x.aId &&
          x.bId &&
          (x.aId === playerId || x.bId === playerId),
      );
      if (m) {
        return { category: cat.name, round: pool.name, opponent: cat.nameOf(m.aId === playerId ? m.bId : m.aId) };
      }
    }
    if (cat.bracket) {
      const size = cat.bracket.size;
      for (let i = 0; i < cat.bracket.rounds.length; i++) {
        const m = cat.bracket.rounds[i].find(
          (x) => !x.isBye && !x.played && x.aId && x.bId && (x.aId === playerId || x.bId === playerId),
        );
        if (m) {
          return {
            category: cat.name,
            round: roundLabel(size, i),
            opponent: cat.nameOf(m.aId === playerId ? m.bId : m.aId),
          };
        }
      }
    }
  }
  return null;
}

function roundLabel(size: number, roundIndex: number): string {
  const remaining = size / 2 ** roundIndex;
  if (remaining === 2) return "Final";
  if (remaining === 4) return "Semi Final";
  if (remaining === 8) return "Quarter Final";
  return `Round of ${remaining}`;
}

interface Ctx {
  role: string;
  playerId?: string;
  clubId?: string;
  registrations: ReturnType<typeof useRegistrations>["registrations"];
  requests: ReturnType<typeof useJoinRequests>["requests"];
  overrides: ReturnType<typeof useTournamentStatus>["overrides"];
  membership: ReturnType<typeof useMembershipStatus>;
  allTournaments: Tournament[];
  allEvents: TTEvent[];
  liveTournaments: LiveTournament[];
  /** Tournament ids this account has been granted match-console access to. */
  assistTournamentIds: string[];
}

function playerNotifications(c: Ctx): AppNotification[] {
  if (!c.playerId) return [];
  const out: AppNotification[] = [];
  const eventName = (t: Tournament) => getEvent(t.eventId)?.name ?? t.name;

  // 1. Payment — unpaid registrations
  for (const r of c.registrations) {
    if (r.playerId !== c.playerId || r.status !== "PENDING_PAYMENT") continue;
    const t = c.allTournaments.find((x) => x.id === r.tournamentId);
    if (!t) continue;
    out.push({
      id: `pay-reg:${t.id}:${c.playerId}`,
      tone: "warn",
      category: "payment",
      title: "Payment pending",
      body: `Complete your entry fee for ${eventName(t)} — ${t.category}.`,
      href: `/tournaments/${t.id}`,
      ts: new Date(r.createdAt).getTime(),
    });
  }

  // 2. Payment — membership
  pushMembership(out, c, "/player/renew", "player membership");

  const registered = c.allTournaments.filter((t) => t.registeredPlayerIds.includes(c.playerId!));
  const registeredLive = c.registrations
    .filter((r) => r.playerId === c.playerId && r.status === "REGISTERED")
    .map((r) => c.allTournaments.find((t) => t.id === r.tournamentId))
    .filter((t): t is Tournament => Boolean(t));
  const mine = [...new Map([...registered, ...registeredLive].map((t) => [t.id, t])).values()];

  // 3. Tournament reminder — starting soon
  for (const t of mine) {
    const d = daysUntil(t.date);
    if (d < 0 || d > REMINDER_WINDOW_DAYS) continue;
    out.push({
      id: `remind-tournament:${t.id}`,
      tone: "info",
      category: "reminder",
      title: d <= 1 ? "Tournament starts soon" : `Tournament in ${d} days`,
      body: `${eventName(t)} — ${t.category} · ${formatDate(t.date)}`,
      href: `/tournaments/${t.id}`,
      ts: new Date(t.date).getTime(),
    });
  }

  // 4. Match reminder — your next match, with tournament + category
  for (const lt of c.liveTournaments) {
    const nm = nextMatchFor(lt, c.playerId);
    if (!nm) continue;
    out.push({
      id: `remind-match:${lt.tournamentId}:${nm.category}`,
      tone: "info",
      category: "reminder",
      title: "Match coming up",
      body: `${nm.round} vs ${nm.opponent} · ${getEvent(getTournamentEventId(c, lt.tournamentId))?.name ?? lt.name} — ${nm.category}`,
      href: "/player/match-centre",
      ts: Date.now(),
    });
  }

  // 5. Results published for a tournament you played
  for (const lt of c.liveTournaments) {
    const t = c.allTournaments.find((x) => x.id === lt.tournamentId);
    for (const cat of lt.categories) {
      // a published result shows up as a completed bracket final
      const final = cat.bracket?.rounds.at(-1)?.[0];
      if (final?.played && final.winnerId && t) {
        out.push({
          id: `result:${lt.tournamentId}:${cat.id}`,
          tone: "success",
          category: "result",
          title: "Results are in",
          body: `${eventName(t)} — ${cat.name}. Champion: ${cat.nameOf(final.winnerId)}.`,
          href: `/tournaments/${t.id}#results`,
          ts: Date.now(),
        });
      }
    }
  }

  // 6. Your club join request was answered
  for (const r of c.requests) {
    if (r.playerId !== c.playerId || r.status === "PENDING") continue;
    const club = clubs.find((x) => x.id === r.clubId);
    if (!club) continue;
    out.push({
      id: `joinreq-update:${r.id}`,
      tone: r.status === "ACCEPTED" ? "success" : "info",
      category: "request",
      title: r.status === "ACCEPTED" ? "Club request accepted" : "Club request declined",
      body: `${club.name} ${r.status === "ACCEPTED" ? "accepted" : "declined"} your request to join.`,
      href: `/clubs/${club.id}`,
      ts: new Date(r.createdAt).getTime(),
    });
  }

  return out;
}

function getTournamentEventId(c: Ctx, tournamentId: string): string {
  return c.allTournaments.find((t) => t.id === tournamentId)?.eventId ?? "";
}

function clubNotifications(c: Ctx): AppNotification[] {
  if (!c.clubId) return [];
  const out: AppNotification[] = [];
  const club = clubs.find((x) => x.id === c.clubId);

  // 1. New player join requests
  for (const r of c.requests) {
    if (r.clubId !== c.clubId || r.status !== "PENDING") continue;
    out.push({
      id: `club-joinreq:${r.id}`,
      tone: "info",
      category: "request",
      title: "New join request",
      body: `${r.playerName} wants to join ${club?.name ?? "your club"}.`,
      href: "/club/dashboard#join-requests",
      ts: new Date(r.createdAt).getTime(),
    });
  }

  // 2. Platform membership payment reminder
  pushMembership(out, c, "/club/renew", "club platform membership");

  return out;
}

function hostNotifications(c: Ctx): AppNotification[] {
  const out: AppNotification[] = [];
  // Events this host created (hosted events keep their organiser name; we match
  // on the signed-in host being the organiser of any hosted event).
  const hostedEvents = c.allEvents.filter((e) => e.id.startsWith("evt-host"));
  for (const e of hostedEvents) {
    const cats = c.allTournaments.filter((t) => t.eventId === e.id);
    if (cats.length === 0) continue;
    const status = effectiveStatus(cats[0], c.overrides);

    if (status === "DRAFT") {
      out.push({
        id: `host-fee:${e.id}`,
        tone: "warn",
        category: "payment",
        title: "Hosting fee due",
        body: `Pay the hosting fee for ${e.name} to keep it in the approval queue.`,
        href: "/host/tournaments",
        ts: new Date(e.date).getTime(),
      });
      out.push({
        id: `host-approval:${e.id}`,
        tone: "info",
        category: "status",
        title: "Awaiting admin review",
        body: `${e.name} is pending approval before players can register.`,
        href: "/host/tournaments",
        ts: new Date(e.date).getTime(),
      });
    } else {
      out.push({
        id: `host-approved:${e.id}`,
        tone: "success",
        category: "status",
        title: "Tournament approved",
        body: `${e.name} is live — players can register now.`,
        href: `/tournaments/${cats[0].id}`,
        ts: new Date(e.date).getTime(),
      });
    }
  }
  return out;
}

function adminNotifications(c: Ctx): AppNotification[] {
  const out: AppNotification[] = [];

  // 1. Tournaments awaiting approval — one per event
  const groups = buildEventGroups(c.allTournaments, c.allEvents);
  for (const g of groups) {
    const anyDraft = g.categories.some((cat) => effectiveStatus(cat, c.overrides) === "DRAFT");
    if (!anyDraft) continue;
    out.push({
      id: `admin-approval:${g.eventId}`,
      tone: "warn",
      category: "request",
      title: "Tournament approval request",
      body: `${g.name} — ${g.categories.length} categor${g.categories.length === 1 ? "y" : "ies"} awaiting review.`,
      href: "/admin/tournaments",
      ts: new Date(g.date).getTime(),
    });
  }

  // 2. Club verification requests
  for (const club of clubs) {
    if (club.verified) continue;
    out.push({
      id: `admin-club-verify:${club.id}`,
      tone: "info",
      category: "request",
      title: "Club verification request",
      body: `${club.name} (${club.location}) is unverified.`,
      href: "/admin/clubs",
      ts: Date.now(),
    });
  }

  // 3. Pending club join requests across the platform (aggregate)
  const pendingJoin = c.requests.filter((r) => r.status === "PENDING").length;
  if (pendingJoin > 0) {
    out.push({
      id: "admin-joinreqs",
      tone: "info",
      category: "request",
      title: "Player join requests",
      body: `${pendingJoin} player${pendingJoin === 1 ? "" : "s"} waiting on a club decision.`,
      href: "/admin/players",
      ts: Date.now(),
    });
  }

  return out;
}

/** Delegated match-console access — fires for any role the host shared with. */
function assistNotifications(c: Ctx): AppNotification[] {
  const out: AppNotification[] = [];
  for (const tid of c.assistTournamentIds) {
    const t = c.allTournaments.find((x) => x.id === tid);
    if (!t) continue;
    out.push({
      id: `assist-access:${tid}`,
      tone: "info",
      category: "status",
      title: "Match console access",
      body: `You can run the live Matches console for ${getEvent(t.eventId)?.name ?? t.name}.`,
      href: `/assist/${tid}`,
      ts: new Date(t.date).getTime(),
    });
  }
  return out;
}

function pushMembership(out: AppNotification[], c: Ctx, href: string, what: string) {
  const m = c.membership;
  if (m.isLoading) return;
  const lapsed = m.hasRecord && !m.isActive;
  const expiringSoon = m.daysRemaining != null && m.daysRemaining >= 0 && m.daysRemaining <= 14;
  if (!lapsed && !expiringSoon) return;
  out.push({
    id: `pay-membership:${c.role}`,
    tone: lapsed ? "danger" : "warn",
    category: "payment",
    title: lapsed ? "Membership expired" : "Membership renewal due",
    body: lapsed
      ? `Renew your ${what} to keep full access.`
      : `Your ${what} expires in ${m.daysRemaining} day${m.daysRemaining === 1 ? "" : "s"}.`,
    href,
    ts: Date.now(),
  });
}

/* -------------------------------------------------------------- hook ---- */

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");

  const { user } = useAuth();
  const player = useCurrentPlayer();
  const club = useCurrentClub();
  const { registrations } = useRegistrations();
  const { requests } = useJoinRequests();
  const { overrides } = useTournamentStatus();
  const membership = useMembershipStatus();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { assignmentsFor } = useTournamentAssistants();

  const consoleIds = useConsoleTournamentIds(user?.role === "PLAYER" ? player?.id : undefined);

  const registeredForLive = useMemo<Tournament[]>(() => {
    if (user?.role !== "PLAYER" || !player) return [];
    const byId = new Map<string, Tournament>();
    for (const t of allTournaments) if (t.registeredPlayerIds.includes(player.id)) byId.set(t.id, t);
    for (const r of registrations) {
      if (r.playerId !== player.id || r.status !== "REGISTERED" || byId.has(r.tournamentId)) continue;
      const t = allTournaments.find((x) => x.id === r.tournamentId);
      if (t) byId.set(t.id, t);
    }
    for (const id of consoleIds) {
      if (byId.has(id)) continue;
      const t = allTournaments.find((x) => x.id === id);
      if (t) byId.set(id, t);
    }
    return [...byId.values()];
  }, [user?.role, player, registrations, allTournaments, consoleIds]);

  const { tournaments: liveTournaments } = useLiveTournaments(registeredForLive);

  const items = useMemo<AppNotification[]>(() => {
    if (!user) return [];
    const c: Ctx = {
      role: user.role,
      playerId: player?.id,
      clubId: club?.id,
      registrations,
      requests,
      overrides,
      membership,
      allTournaments,
      allEvents,
      liveTournaments,
      assistTournamentIds: assignmentsFor(user.uniqueId),
    };
    let derived: AppNotification[] = [];
    if (user.role === "PLAYER") derived = playerNotifications(c);
    else if (user.role === "CLUB") derived = clubNotifications(c);
    else if (user.role === "HOST") derived = hostNotifications(c);
    else if (user.role === "ADMIN") derived = adminNotifications(c);

    // Delegated match-console access — appended for any role.
    derived = [...derived, ...assistNotifications(c)];

    return derived.sort((a, b) => b.ts - a.ts);
  }, [user, player?.id, club?.id, registrations, requests, overrides, membership, allTournaments, allEvents, liveTournaments, assignmentsFor]);

  const unreadCount = items.filter((n) => !ctx.readIds.has(n.id)).length;

  return {
    items,
    isRead: (id: string) => ctx.readIds.has(id),
    unreadCount,
    markRead: ctx.markRead,
    markAllRead: () => ctx.markManyRead(items.map((n) => n.id)),
  };
}

/** Compact relative time. */
export function timeAgo(ts: number): string {
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return diff > 0 ? `in ${days}d` : `${days}d`;
  const wks = Math.round(days / 7);
  return diff > 0 ? `in ${wks}w` : `${wks}w`;
}
