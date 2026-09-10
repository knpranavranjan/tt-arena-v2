"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SEED_ACCOUNTS } from "@/lib/auth";
import { players as rosterPlayers, playerSrId } from "@/lib/mock-data";
import { USE_DB, apiGet } from "@/lib/data-backend";
import { useCreatedPlayers, type CreatedPlayer } from "@/lib/players-store";

/**
 * Everyone who exists on the platform and can therefore be entered into a
 * tournament: the seeded player roster plus anyone who has registered an
 * account. `id` is the stable rating identity; `handle` is the SPINID the host
 * types to find them.
 */
export interface DirectoryPerson {
  id: string;
  handle: string;
  name: string;
  rating: number;
  club: string;
  state: string;
  /** true = has their own login; false = seeded roster only. */
  hasAccount: boolean;
}

const ACCOUNTS_KEY = "tt-demo-accounts";

interface StoredAccount {
  uniqueId?: string;
  name?: string;
  role?: string;
  linkedId?: string | null;
}

/** A platform login of any role — the pool a host can grant console access to. */
export interface PlatformAccount {
  uniqueId: string;
  name: string;
  role: string;
  /** Rating/directory id when linked (players), else undefined. */
  personId?: string;
}

function readAccounts(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** The platform's account list, from the DB (`/api/accounts`) or localStorage. */
function useAccountList(): StoredAccount[] {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  useEffect(() => {
    if (USE_DB) {
      apiGet<StoredAccount[]>("/api/accounts")
        .then(setAccounts)
        .catch((e) => console.error("platform-directory accounts load", e));
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccounts(readAccounts());
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCOUNTS_KEY) setAccounts(readAccounts());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return accounts;
}

function build(accounts: StoredAccount[], created: readonly CreatedPlayer[] = []): DirectoryPerson[] {
  // handle map: seed roster player id -> account handle (when one is linked)
  const handleByRosterId = new Map<string, string>();
  for (const a of [...SEED_ACCOUNTS, ...accounts]) {
    if (a.role === "PLAYER" && a.linkedId && a.uniqueId) handleByRosterId.set(a.linkedId, a.uniqueId);
  }

  const people = new Map<string, DirectoryPerson>();

  for (const p of rosterPlayers) {
    people.set(p.id, {
      id: p.id,
      handle: handleByRosterId.get(p.id) ?? playerSrId(p.id),
      name: p.name,
      rating: p.rating,
      club: p.clubName ?? "",
      state: p.state,
      hasAccount: handleByRosterId.has(p.id),
    });
  }

  // Real player sign-ups (own DB/localStorage profile row) — full identity.
  for (const p of created) {
    people.set(p.id, {
      id: p.id,
      handle: p.spinId ?? playerSrId(p.id),
      name: p.name,
      rating: p.rating,
      club: p.clubName ?? "",
      state: p.state ?? "",
      hasAccount: true,
    });
  }

  for (const a of [...SEED_ACCOUNTS, ...accounts]) {
    if (a.role !== "PLAYER" || !a.uniqueId) continue;
    const id = a.linkedId ?? `acc-${a.uniqueId.trim().toLowerCase()}`;
    if (people.has(id)) {
      people.set(id, { ...people.get(id)!, handle: a.uniqueId, hasAccount: true });
      continue;
    }
    people.set(id, {
      id,
      handle: a.uniqueId,
      name: a.name ?? a.uniqueId,
      rating: 1500,
      club: "",
      state: "",
      hasAccount: true,
    });
  }

  return [...people.values()];
}

function buildAccounts(accounts: StoredAccount[]): PlatformAccount[] {
  const byHandle = new Map<string, PlatformAccount>();
  for (const a of [...SEED_ACCOUNTS, ...accounts]) {
    const uniqueId = a.uniqueId?.trim();
    if (!uniqueId) continue;
    byHandle.set(uniqueId.toLowerCase(), {
      uniqueId,
      name: a.name ?? uniqueId,
      role: a.role ?? "PLAYER",
      personId: a.linkedId ?? undefined,
    });
  }
  return [...byHandle.values()];
}

/**
 * Every platform login, regardless of role — the set a tournament host can hand
 * match-console access to. Searchable by SPINID only (never by name), so access
 * is only ever granted to an ID the host was deliberately given.
 */
export function usePlatformAccounts() {
  const accounts = useAccountList();

  const all = useMemo(() => buildAccounts(accounts), [accounts]);

  const search = useCallback(
    (query: string, excludeHandles: ReadonlySet<string> = new Set()) => {
      const excl = new Set([...excludeHandles].map((h) => h.toLowerCase()));
      const pool = all.filter((a) => !excl.has(a.uniqueId.toLowerCase()));
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return pool
        .map((a) => {
          const handle = a.uniqueId.toLowerCase();
          let score = -1;
          if (handle === q) score = 0;
          else if (handle.startsWith(q)) score = 1;
          else if (handle.includes(q)) score = 2;
          return { a, score };
        })
        .filter((r) => r.score >= 0)
        .sort((x, y) => x.score - y.score || x.a.uniqueId.localeCompare(y.a.uniqueId))
        .slice(0, 12)
        .map((r) => r.a);
    },
    [all],
  );

  return { all, search };
}

/** Live directory of platform players, searchable by SPINID only. */
export function usePlatformDirectory() {
  const accounts = useAccountList();
  const { createdPlayers } = useCreatedPlayers();

  const all = useMemo(() => build(accounts, createdPlayers), [accounts, createdPlayers]);

  const search = useCallback(
    (query: string, excludeIds: ReadonlySet<string> = new Set()) => {
      const q = query.trim().toLowerCase();
      const pool = all.filter((p) => !excludeIds.has(p.id));
      if (!q) return [];
      return pool
        .map((p) => {
          const handle = p.handle.toLowerCase();
          let score = -1;
          if (handle === q) score = 0;
          else if (handle.startsWith(q)) score = 1;
          else if (handle.includes(q)) score = 2;
          return { p, score };
        })
        .filter((r) => r.score >= 0)
        .sort((a, b) => a.score - b.score || a.p.handle.localeCompare(b.p.handle))
        .slice(0, 12)
        .map((r) => r.p);
    },
    [all],
  );

  return { all, search };
}
