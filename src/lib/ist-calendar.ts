import { useEffect, useState } from "react";

/**
 * Tournament days run on the Indian Standard Time calendar. A tournament's
 * `date` is a calendar day ("2026-09-13"); it is "live" for the whole of that
 * day in IST — not by the viewer's own timezone, and not by its stored status.
 */

export const IST_TIME_ZONE = "Asia/Kolkata";

const keyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's (or `at`'s) calendar day in IST, as "YYYY-MM-DD". */
export function istDateKey(at: Date = new Date()): string {
  return keyFormat.format(at);
}

export type CalendarPhase = "LIVE" | "UPCOMING" | "PAST";

/**
 * Where a tournament sits relative to `today` (all "YYYY-MM-DD", IST): live on
 * every day from `date` through `endDate` (a multi-day event), else upcoming/past.
 */
export function calendarPhase(date: string, today: string, endDate?: string): CalendarPhase {
  const start = date.slice(0, 10);
  const end = endDate && endDate.slice(0, 10) > start ? endDate.slice(0, 10) : start;
  if (today < start) return "UPCOMING";
  return today > end ? "PAST" : "LIVE";
}

const dayIndex = (key: string) => Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / 86_400_000;

/** For a live multi-day event: which day today is, e.g. { day: 2, total: 3 }. Null for single-day. */
export function tournamentDay(date: string, today: string, endDate?: string): { day: number; total: number } | null {
  if (!endDate || endDate.slice(0, 10) <= date.slice(0, 10)) return null;
  const total = dayIndex(endDate) - dayIndex(date) + 1;
  const day = dayIndex(today) - dayIndex(date) + 1;
  return day >= 1 && day <= total ? { day, total } : null;
}

// IST is a fixed UTC+05:30 (no daylight saving).
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function msUntilNextIstMidnight(now = Date.now()): number {
  return DAY_MS - ((now + IST_OFFSET_MS) % DAY_MS);
}

/**
 * Today's IST day, kept current: rolls over at IST midnight while the page is
 * open, so a tournament moves into (and out of) "Live" on its day without a reload.
 */
export function useIstToday(): string {
  const [today, setToday] = useState(istDateKey);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setToday(istDateKey());
        schedule();
      }, msUntilNextIstMidnight() + 1000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);
  return today;
}
