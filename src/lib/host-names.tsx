"use client";

import { useCallback, useEffect, useState } from "react";
import { SEED_ACCOUNTS } from "@/lib/auth";
import { USE_DB, apiGet } from "@/lib/data-backend";

/**
 * "Hosted by" labels. A tournament/event stores `organizerId` (the hosting
 * account's SPINID) plus an `organizer` name captured at creation. The label
 * is resolved live from the account's current name, so it is right for every
 * existing and future account (and follows a rename); the stored name is the
 * fallback for seed events that have no hosting account.
 */

interface AccountName {
  uniqueId?: string;
  name?: string;
}

const ACCOUNTS_KEY = "tt-demo-accounts";

function toMap(list: readonly AccountName[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const a of list) {
    const id = a.uniqueId?.trim().toLowerCase();
    if (id && a.name?.trim()) map.set(id, a.name.trim());
  }
  return map;
}

// One fetch shared by every card on the page.
let dbNames: Promise<AccountName[]> | null = null;
function loadDbNames(): Promise<AccountName[]> {
  dbNames ??= apiGet<AccountName[]>("/api/accounts/names").catch((e) => {
    console.error("host-names load", e);
    dbNames = null;
    return [];
  });
  return dbNames;
}

function readLocalAccounts(): AccountName[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function useAccountNames(): Map<string, string> {
  const [names, setNames] = useState(() => toMap(SEED_ACCOUNTS));
  useEffect(() => {
    let alive = true;
    const apply = (list: AccountName[]) => alive && setNames(toMap([...SEED_ACCOUNTS, ...list]));
    if (USE_DB) loadDbNames().then(apply);
    else apply(readLocalAccounts());
    return () => {
      alive = false;
    };
  }, []);
  return names;
}

/** `hostName(t)` → the hosting account's name, else the stored organizer name. */
export function useHostName(): (rec: { organizer?: string; organizerId?: string }) => string {
  const names = useAccountNames();
  return useCallback(
    (rec) => (rec.organizerId && names.get(rec.organizerId.trim().toLowerCase())) || rec.organizer || "",
    [names],
  );
}
