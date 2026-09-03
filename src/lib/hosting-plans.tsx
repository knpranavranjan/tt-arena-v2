"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface HostingPlan {
  id: string;
  title: string;
  description: string;
  price: number;
}

// Defaults shown the first time the app runs (or if storage is cleared).
// Admin Settings edits these prices; the host-tournament page's "Choose a
// hosting plan" modal always reads the live values below rather than
// hardcoded numbers.
export const defaultHostingPlans: HostingPlan[] = [
  {
    id: "one-time",
    title: "One-time tournament hosting",
    description: "Take this one tournament live.",
    price: 2000,
  },
  {
    id: "ten-pack",
    title: "10 tournaments hosting",
    description: "Host up to 10 tournaments — no per-event fee.",
    price: 18000,
  },
  {
    id: "unlimited",
    title: "Unlimited tournament hosting",
    description: "Host as many tournaments as you like, anytime.",
    price: 30000,
  },
];

interface HostingPlansContextValue {
  plans: HostingPlan[];
  isLoading: boolean;
  updatePrice: (id: string, price: number) => void;
}

const STORAGE_KEY = "tt-demo-hosting-plans";

const HostingPlansContext = createContext<HostingPlansContextValue | null>(null);

function readStorage(): HostingPlan[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultHostingPlans;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultHostingPlans;
    // Merge onto defaults so a plan added in a later app version still shows
    // up even if an older snapshot is sitting in someone's localStorage.
    return defaultHostingPlans.map((def) => {
      const saved = parsed.find((p) => p && p.id === def.id);
      return saved && typeof saved.price === "number" ? { ...def, price: saved.price } : def;
    });
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return defaultHostingPlans;
  }
}

export function HostingPlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<HostingPlan[]>(defaultHostingPlans);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPlans(readStorage());
    setIsLoading(false);
    // Keep multiple open tabs/portals in sync with each other.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPlans(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updatePrice = useCallback((id: string, price: number) => {
    setPlans((current) => {
      const next = current.map((p) => (p.id === id ? { ...p, price } : p));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <HostingPlansContext.Provider value={{ plans, isLoading, updatePrice }}>{children}</HostingPlansContext.Provider>
  );
}

export function useHostingPlans() {
  const ctx = useContext(HostingPlansContext);
  if (!ctx) throw new Error("useHostingPlans must be used within HostingPlansProvider");
  return ctx;
}
