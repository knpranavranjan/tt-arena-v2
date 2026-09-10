"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { USE_DB, apiGet, apiSend } from "@/lib/data-backend";

export type JoinRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface JoinRequest {
  id: string;
  clubId: string;
  playerId: string;
  playerName: string;
  status: JoinRequestStatus;
  createdAt: string;
}

interface JoinRequestsContextValue {
  requests: JoinRequest[];
  isLoading: boolean;
  sendRequest: (clubId: string, playerId: string, playerName: string) => void;
  hasPendingRequest: (clubId: string, playerId: string) => boolean;
  pendingForClub: (clubId: string) => JoinRequest[];
  updateStatus: (requestId: string, status: JoinRequestStatus) => void;
}

const STORAGE_KEY = "tt-demo-join-requests";

const JoinRequestsContext = createContext<JoinRequestsContextValue | null>(null);

function readStorage(): JoinRequest[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function JoinRequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    apiGet<JoinRequest[]>("/api/join-requests")
      .then(setRequests)
      .catch((e) => console.error("join-requests load", e));
  }, []);

  useEffect(() => {
    if (USE_DB) {
      apiGet<JoinRequest[]>("/api/join-requests")
        .then(setRequests)
        .catch((e) => console.error("join-requests load", e))
        .finally(() => setIsLoading(false));
      return;
    }
    setRequests(readStorage());
    setIsLoading(false);
    // Keep multiple open tabs/portals (e.g. a player tab and a club tab) in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRequests(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refetch]);

  const persist = useCallback(
    (next: JoinRequest[]) => {
      setRequests(next);
      if (!USE_DB) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [],
  );

  const sendRequest = useCallback(
    (clubId: string, playerId: string, playerName: string) => {
      setRequests((current) => {
        if (current.some((r) => r.clubId === clubId && r.playerId === playerId && r.status === "PENDING")) {
          return current;
        }
        const next: JoinRequest[] = [
          ...current,
          {
            id: makeId(),
            clubId,
            playerId,
            playerName,
            status: "PENDING",
            createdAt: new Date().toISOString(),
          },
        ];
        if (USE_DB) {
          apiSend("/api/join-requests", "POST", { clubId, playerId, playerName })
            .then(refetch)
            .catch((e) => console.error("join-requests send", e));
        } else {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [refetch],
  );

  const hasPendingRequest = useCallback(
    (clubId: string, playerId: string) =>
      requests.some((r) => r.clubId === clubId && r.playerId === playerId && r.status === "PENDING"),
    [requests],
  );

  const pendingForClub = useCallback(
    (clubId: string) => requests.filter((r) => r.clubId === clubId && r.status === "PENDING"),
    [requests],
  );

  const updateStatus = useCallback(
    (requestId: string, status: JoinRequestStatus) => {
      persist(requests.map((r) => (r.id === requestId ? { ...r, status } : r)));
      if (USE_DB) {
        apiSend("/api/join-requests", "PATCH", { id: requestId, status }).catch((e) =>
          console.error("join-requests update", e),
        );
      }
    },
    [requests, persist],
  );

  return (
    <JoinRequestsContext.Provider
      value={{ requests, isLoading, sendRequest, hasPendingRequest, pendingForClub, updateStatus }}
    >
      {children}
    </JoinRequestsContext.Provider>
  );
}

export function useJoinRequests() {
  const ctx = useContext(JoinRequestsContext);
  if (!ctx) throw new Error("useJoinRequests must be used within JoinRequestsProvider");
  return ctx;
}
