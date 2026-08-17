"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Calendar, MapPin, Search, Trophy, User } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ArenaPhotoBackdrop } from "@/components/media/arena-photo-backdrop";
import { arenaFontVariables } from "@/lib/fonts";
import { events, players } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { EventStatus } from "@/lib/types";

const filters: { value: EventStatus | "all"; label: string }[] = [
  { value: "all", label: "All Events" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "LIVE", label: "Live" },
  { value: "COMPLETED", label: "Completed" },
];

const statusLabel = Object.fromEntries(filters.map((f) => [f.value, f.label]));

const counts = {
  UPCOMING: events.filter((e) => e.status === "UPCOMING").length,
  LIVE: events.filter((e) => e.status === "LIVE").length,
  COMPLETED: events.filter((e) => e.status === "COMPLETED").length,
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EventStatus | "all">("all");

  const filtered = useMemo(() => {
    return events
      .filter((e) => {
        if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (status !== "all" && e.status !== status) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === "LIVE") return -1;
          if (b.status === "LIVE") return 1;
          if (a.status === "UPCOMING") return -1;
          if (b.status === "UPCOMING") return 1;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [search, status]);

  return (
    <div className={`relative flex min-h-screen flex-col ${arenaFontVariables}`} style={{ fontFamily: "var(--font-home-body)" }}>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-[#0c0c0c] py-12">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Image
            src="/events/event.png"
            alt="Two players mid-rally at a live broadcast table tennis match, lit by red and blue LED light rigs with a camera operator and crowd visible courtside."
            fill
            priority
            sizes="100vw"
            className="object-cover object-[65%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0c] via-[#0c0c0c]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-[#0c0c0c]/30" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-12">
          <div className="max-w-2xl">
            <span
              className="mb-4 block text-xs font-semibold uppercase tracking-[0.2em] text-[#ff2448]"
              style={{ fontFamily: "var(--font-home-mono)" }}
            >
              The Competition Hub
            </span>
            <h1
              className="mb-6 text-[48px] font-extrabold uppercase leading-tight tracking-tighter text-[#e2e2e8] sm:text-[64px]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Where the game happens.
            </h1>
            <p className="mb-10 max-w-xl text-lg text-[#c2c6d7]">
              Find your next tournament, challenge your ranking, and compete against the best
              around you.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/tournaments"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff2448] px-8 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_#ff2448] active:scale-95"
                style={{ fontFamily: "var(--font-home-mono)" }}
              >
                Find a Tournament
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#e2e2e8] transition-all hover:bg-white/10"
                style={{ fontFamily: "var(--font-home-mono)" }}
              >
                Host a Tournament
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/5 bg-[#0f0f0f] py-4">
        <div
          className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-xs uppercase tracking-[0.15em] text-[#c2c6d7] sm:justify-start sm:px-12"
          style={{ fontFamily: "var(--font-home-mono)" }}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#ff2448]">{counts.UPCOMING}</span> Upcoming
          </div>
          <div className="hidden h-4 w-px bg-white/10 sm:block" />
          <div className="flex items-center gap-2 text-[#e2e2e8]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff2448]" />
            <span className="font-bold text-[#ff2448]">{counts.LIVE}</span> Live
          </div>
          <div className="hidden h-4 w-px bg-white/10 sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#e2e2e8]">{counts.COMPLETED}</span> Completed
          </div>
          <div className="hidden h-4 w-px bg-white/10 sm:block" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#e2e2e8]">{players.length}+</span> Players
          </div>
        </div>
      </section>

      {/* Search & filter */}
      <section className="mx-auto mt-12 mb-16 w-full max-w-[1280px] px-4 sm:px-12">
        <div className="flex flex-col items-stretch gap-4 rounded-[8px] border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl md:flex-row md:items-center">
          <div className="relative w-full flex-grow">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d7]" />
            <input
              type="text"
              placeholder="Search events by name, city, or club…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[4px] border-none bg-[#1a1c20] py-4 pl-12 pr-4 text-sm text-[#e2e2e8] placeholder:text-[#c2c6d7]/50 focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
            />
          </div>
          <div className="flex w-full gap-2 overflow-x-auto md:w-auto">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                className={`shrink-0 whitespace-nowrap rounded-[4px] px-6 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  status === f.value
                    ? "bg-[#ff2448] text-white"
                    : "text-[#c2c6d7] hover:bg-white/10 hover:text-[#e2e2e8]"
                }`}
                style={{ fontFamily: "var(--font-home-mono)" }}
              >
                {f.value === "LIVE" && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
                )}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events list */}
      <section className="mx-auto mb-24 w-full max-w-[1280px] flex-1 px-4 sm:px-12">
        <h2
          className="mb-8 text-2xl font-bold text-[#e2e2e8]"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Featured Events
        </h2>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar />}
            title="No events found"
            description="Try a different search or filter."
          />
        ) : (
          <RevealGroup className="flex flex-col gap-8">
            {filtered.map((event) => (
              <RevealItem key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="group relative flex h-[400px] flex-col justify-end overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-[0_0_15px_-5px_rgba(255,36,72,0.5)]"
                >
                  <ArenaPhotoBackdrop variant="subtle" />
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/60 to-transparent" />
                  <div className="relative z-20 flex flex-col gap-4 p-8">
                    <div className="flex flex-wrap items-center gap-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${
                          event.status === "LIVE"
                            ? "border border-[#ff2448]/50 bg-[#ff2448]/20 text-[#ff8f86]"
                            : "border border-[#ff2448]/30 bg-[#ff2448]/10 text-[#ff8f86]"
                        }`}
                        style={{ fontFamily: "var(--font-home-mono)" }}
                      >
                        {event.status === "LIVE" && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff2448]" />
                        )}
                        {statusLabel[event.status]}
                      </span>
                      <span
                        className="flex items-center gap-1 text-xs uppercase tracking-wide text-[#c2c6d7]"
                        style={{ fontFamily: "var(--font-home-mono)" }}
                      >
                        <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {formatDate(event.date)}
                      </span>
                      <span
                        className="flex items-center gap-1 text-xs uppercase tracking-wide text-[#c2c6d7]"
                        style={{ fontFamily: "var(--font-home-mono)" }}
                      >
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {event.venue}, {event.location}
                      </span>
                    </div>
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                      <div>
                        <h3
                          className="mb-2 text-2xl font-bold uppercase text-[#e2e2e8] sm:text-[32px]"
                          style={{ fontFamily: "var(--font-home-display)" }}
                        >
                          {event.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-[#c2c6d7]">
                          <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" strokeWidth={1.5} />
                            {event.organizer}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Trophy className="h-4 w-4" strokeWidth={1.5} />
                            {event.tournamentIds.length} tournaments
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" strokeWidth={1.5} />
                            {event.participatingClubIds.length} clubs
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full bg-[#ff2448] px-8 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-all group-hover:scale-[1.02]">
                        {event.status === "COMPLETED" ? "View Results" : "View Event"}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                      </span>
                    </div>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>
    </div>
  );
}
