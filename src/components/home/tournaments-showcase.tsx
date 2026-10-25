"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ArenaPhotoBackdrop } from "@/components/media/arena-photo-backdrop";
import { tournaments } from "@/lib/mock-data";
import { formatEventDates } from "@/lib/format";
import { calendarPhase, useIstToday, type CalendarPhase } from "@/lib/ist-calendar";
import type { Tournament } from "@/lib/types";

const PHASE_ORDER: Record<CalendarPhase, number> = { LIVE: 0, UPCOMING: 1, PAST: 2 };

/** Today's tournaments first, then the next ones, then the most recent past — by IST day. */
function featured(today: string): { t: Tournament; phase: CalendarPhase }[] {
  return tournaments
    .map((t) => ({ t, phase: calendarPhase(t.date, today, t.endDate) }))
    .sort(
      (a, b) =>
        PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] ||
        (a.phase === "PAST" ? b.t.date.localeCompare(a.t.date) : a.t.date.localeCompare(b.t.date)),
    )
    .slice(0, 3);
}

function badgeFor(t: Tournament, phase: CalendarPhase): string {
  if (t.status === "COMPLETED") return "Completed";
  if (phase === "LIVE") return "Live Today";
  return phase === "UPCOMING" ? "Upcoming" : "Results Pending";
}

export function TournamentsShowcase() {
  const today = useIstToday();
  const featuredThree = featured(today);
  if (!featuredThree.length) return null;

  return (
    <section className="border-t border-white/10 bg-[#0c0e12] py-16">
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span
              className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-[#ff8f86]"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              Tournaments
            </span>
            <h2
              className="text-[26px] font-bold text-[#e2e2e8] sm:text-[32px]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              What&apos;s happening in the arena.
            </h2>
          </div>
          <Link
            href="/tournaments"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-[#ff8f86] transition-colors hover:text-[#ff2448]"
          >
            View all tournaments
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
          </Link>
        </div>

        <RevealGroup className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {featuredThree.map(({ t, phase }) => {
            // Highlighted while it's on today (IST) or still open for entries.
            const live = t.status !== "COMPLETED" && (phase === "LIVE" || (phase === "UPCOMING" && t.status === "REGISTRATION_OPEN"));
            return (
              <RevealItem key={t.id}>
                <div className="group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-colors hover:border-[#ff2448]/50">
                  <ArenaPhotoBackdrop />
                  <Link href={`/tournaments/${t.id}`} className="mb-auto block">
                    <span
                      className={`mb-4 inline-block rounded-[2px] px-2.5 py-1.5 text-xs font-semibold ${
                        live
                          ? "bg-[#ff2448] text-[#ffd2cd]"
                          : "border border-white/20 text-[#e2e2e8]"
                      }`}
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      {badgeFor(t, phase)}
                    </span>
                    <h3 className="mb-3 text-xl font-bold uppercase text-[#e2e2e8]">{t.name}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-sm uppercase tracking-wide text-[#c2c6d7]">
                        {formatEventDates(t)}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm uppercase tracking-wide text-[#c2c6d7]">
                        <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} /> {t.venue}
                      </div>
                      <div className="text-sm uppercase tracking-wide text-[#c2c6d7]">{t.category}</div>
                    </div>
                  </Link>
                  <div className="mt-6">
                    <div className="mb-4 flex items-center gap-2 text-[#e2e2e8]">
                      <Users className="h-4 w-4" strokeWidth={1.5} />
                      <span className="text-sm font-bold">{t.registeredPlayerIds.length}</span>
                      <span className="text-xs text-[#c2c6d7]">players</span>
                    </div>
                    <Link
                      href={live ? "/login" : `/tournaments/${t.id}`}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-[2px] px-5 py-3 text-xs font-semibold uppercase tracking-wide transition-all hover:scale-[1.02] ${
                        live
                          ? "bg-[#ff2448] text-[#ffd2cd]"
                          : "border border-white/20 text-[#e2e2e8] hover:bg-white/5"
                      }`}
                      style={{ fontFamily: "var(--font-home-mono)" }}
                    >
                      {live ? "Register" : "View Details"}
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
