"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin, Search, Trophy, User, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/empty-state";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ArenaPhotoBackdrop } from "@/components/media/arena-photo-backdrop";
import { arenaFontVariables } from "@/lib/fonts";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import { buildEventGroups, categoryCountLabel, mostActiveStatus, type EventGroup } from "@/lib/event-groups";
import { formatDate, formatEventDates } from "@/lib/format";
import { calendarPhase, tournamentDay, useIstToday, type CalendarPhase } from "@/lib/ist-calendar";
import type { TournamentStatus } from "@/lib/types";
import { usePortalHref } from "@/lib/portal-scope";
import { useHostName } from "@/lib/host-names";

const statuses: { value: TournamentStatus | "all"; label: string }[] = [
  { value: "all", label: "Status" },
  { value: "REGISTRATION_OPEN", label: "Registration Open" },
  { value: "SEEDING", label: "Seeding" },
  { value: "POOLS", label: "Pools" },
  { value: "KNOCKOUT", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const statusLabel = Object.fromEntries(statuses.map((s) => [s.value, s.label]));

const STATUS_TEXT: Record<TournamentStatus, string> = {
  DRAFT: "Pending Approval",
  REGISTRATION_OPEN: "Registration Open",
  REGISTRATION_CLOSED: "Registration Closed",
  SEEDING: "Seeding",
  POOLS: "Pools",
  KNOCKOUT: "In Progress",
  COMPLETED: "Completed",
};

interface DisplayGroup extends EventGroup {
  status: TournamentStatus;
  /** Where the event's days sit on today's IST calendar. */
  phase: CalendarPhase;
  /** Live multi-day event: today's day number, e.g. { day: 2, total: 3 }. */
  liveDay: { day: number; total: number } | null;
  href: string;
}

// "Live" follows the IST calendar: an event is live for the whole of its day
// in IST. Results published early still count as completed; a past day whose
// results aren't in yet reads "Results Pending".
function badgeText(g: DisplayGroup): string {
  if (g.status === "COMPLETED") return STATUS_TEXT.COMPLETED;
  if (g.phase === "LIVE") return g.liveDay ? `Live · Day ${g.liveDay.day} of ${g.liveDay.total}` : "Live Today";
  if (g.phase === "PAST") return "Results Pending";
  return STATUS_TEXT[g.status];
}

const byDateAsc = (a: DisplayGroup, b: DisplayGroup) => a.date.localeCompare(b.date);
const byDateDesc = (a: DisplayGroup, b: DisplayGroup) => b.date.localeCompare(a.date);

export default function TournamentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TournamentStatus | "all">("all");
  const portalHref = usePortalHref();
  const today = useIstToday();

  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { overrides } = useTournamentStatus();

  const groups = useMemo<DisplayGroup[]>(() => {
    return buildEventGroups(allTournaments, allEvents)
      .map((g) => ({
        ...g,
        status: mostActiveStatus(g.categories.map((c) => effectiveStatus(c, overrides))),
        phase: calendarPhase(g.date, today, g.endDate),
        liveDay: tournamentDay(g.date, today, g.endDate),
        href: portalHref(`/tournaments/${g.primary.id}`),
      }))
      // A hosted event stays hidden from players until an admin approves it.
      .filter((g) => g.status !== "DRAFT");
  }, [allTournaments, allEvents, overrides, portalHref, today]);

  const filtered = groups.filter((g) => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status !== "all" && g.status !== status) return false;
    return true;
  });

  const isDone = (g: DisplayGroup) => g.status === "COMPLETED" || g.phase === "PAST";
  const live = filtered.filter((g) => !isDone(g) && g.phase === "LIVE");
  const upcoming = filtered.filter((g) => !isDone(g) && g.phase === "UPCOMING").sort(byDateAsc);
  const completed = filtered.filter(isDone).sort(byDateDesc);

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#111318] pb-20 pt-16">
        <div className="absolute inset-y-0 right-0 z-0 w-2/3" aria-hidden="true">
          <Image
            src="/clubhero/club.png"
            alt=""
            fill
            priority
            sizes="66vw"
            className="object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111318] via-[#111318]/60 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-12">
          <div className="max-w-2xl">
            <h1
              className="mb-6 text-[48px] font-extrabold uppercase leading-tight tracking-tighter text-[#e2e2e8] sm:text-[64px]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              The{" "}
              <span className="text-[#ff8f86] drop-shadow-[0_0_18px_rgba(255,36,72,0.5)]">
                Tournaments
              </span>
            </h1>
            <p className="max-w-xl text-lg text-[#c2c6d7]">
              Every tournament running on the platform, from registration to champion.
            </p>
          </div>
        </div>
      </section>

      {/* Discovery bar */}
      <section className="relative z-20 mx-auto mt-10 mb-12 w-full max-w-[1280px] px-4 sm:mt-14 sm:px-12">
        <div className="flex flex-col items-stretch gap-4 md:flex-row">
          <div className="relative flex-grow">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d7]" />
            <input
              type="text"
              placeholder="Search tournaments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[52px] w-full rounded-[4px] border border-white/10 bg-[#1a1c20] pl-11 pr-4 text-sm text-[#e2e2e8] placeholder:text-[#c2c6d7]/50 focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus((v as TournamentStatus | "all") ?? "all")}>
            <SelectTrigger className="!h-[52px] w-full !rounded-[4px] border-white/10 bg-[#1a1c20] px-4 text-sm text-[#e2e2e8] md:w-56">
              <SelectValue>{(value: TournamentStatus | "all") => statusLabel[value] ?? "Status"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="mx-auto w-full max-w-[1280px] px-4 pb-24 sm:px-12">
          <EmptyState
            icon={<Trophy />}
            title="No tournaments found"
            description="Try a different search or status filter."
          />
        </section>
      ) : (
        <div className="mx-auto w-full max-w-[1280px] px-4 pb-24 sm:px-12">
          <section className="mb-16">
            <SectionHeading dotColor="bg-[#ff2448]" pulse={live.length > 0}>
              {`Live Now · Today, ${formatDate(today)} (IST)`}
            </SectionHeading>
            {live.length === 0 ? (
              <p className="text-sm text-[#8b8b93]">No tournaments are being held today.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {live.map((g) => (
                  <LiveCard key={g.eventId} group={g} />
                ))}
              </div>
            )}
          </section>

          <section className="mb-16">
            <SectionHeading>Upcoming</SectionHeading>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#8b8b93]">No upcoming tournaments match your filters.</p>
            ) : (
              <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((g) => (
                  <RevealItem key={g.eventId}>
                    <TournamentCard group={g} />
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
          </section>

          <section>
            <SectionHeading>Past</SectionHeading>
            {completed.length === 0 ? (
              <p className="text-sm text-[#8b8b93]">No past tournaments match your filters.</p>
            ) : (
              <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completed.map((g) => (
                  <RevealItem key={g.eventId}>
                    <TournamentCard group={g} />
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  children,
  dotColor,
  pulse,
}: {
  children: string;
  dotColor?: string;
  pulse?: boolean;
}) {
  return (
    <h2
      className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#c2c6d7]"
      style={{ fontFamily: "var(--font-home-mono)" }}
    >
      {dotColor && <span className={`h-2 w-2 rounded-full ${dotColor} ${pulse ? "animate-pulse" : ""}`} />}
      {children}
    </h2>
  );
}

function LiveCard({ group: g }: { group: DisplayGroup }) {
  const hostName = useHostName()(g);
  return (
    <Link
      href={g.href}
      className="group relative flex flex-col overflow-hidden rounded-[8px] border border-[#ff2448]/40 bg-white/[0.03] backdrop-blur-xl transition-colors hover:border-[#ff2448]/70 md:flex-row"
    >
      <span
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-[2px] bg-[#ff2448] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#ffd2cd] backdrop-blur"
        style={{ fontFamily: "var(--font-home-mono)" }}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        {badgeText(g)}
      </span>
      <div className="relative h-64 w-full overflow-hidden md:h-auto md:w-3/5">
        <ArenaPhotoBackdrop variant="subtle" />
      </div>
      <div className="flex w-full flex-col justify-center p-8 md:w-2/5">
        <h2 className="mb-2 text-2xl font-bold uppercase text-[#e2e2e8] sm:text-[28px]">{g.name}</h2>
        <div className="mb-6 space-y-1.5 text-[#c2c6d7]">
          <p className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {formatEventDates(g)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {g.venue}
          </p>
          {hostName && (
            <p className="flex items-center gap-1.5">
              <User className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>
                Hosted by <span className="font-semibold text-[#e2e2e8]">{hostName}</span>
              </span>
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {categoryCountLabel(g)}
          </p>
        </div>
        <div className="mb-8">
          <div className="mb-1 text-xs uppercase tracking-wide text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
            Players
          </div>
          <div className="text-2xl font-bold text-[#e2e2e8]">{g.registeredCount} registered</div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-[4px] border border-[#ff2448] bg-[#ff2448]/10 px-6 py-3 text-sm font-semibold text-[#ff8f86] transition-all group-hover:bg-[#ff2448] group-hover:text-white">
          View Tournament
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

function TournamentCard({ group: g }: { group: DisplayGroup }) {
  const hostName = useHostName()(g);
  return (
    <Link
      href={g.href}
      className="group flex h-full flex-col overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:border-[#ff2448]/40"
    >
      <div className="relative h-40 overflow-hidden">
        <ArenaPhotoBackdrop variant="subtle" />
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-[2px] border border-white/20 bg-[#111318]/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#e2e2e8]"
          style={{ fontFamily: "var(--font-home-mono)" }}
        >
          {badgeText(g)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-3 text-lg font-bold uppercase text-[#e2e2e8]">{g.name}</h3>
        <div className="mb-6 space-y-1.5 text-sm text-[#c2c6d7]">
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {formatEventDates(g)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {g.venue}
          </p>
          {hostName && (
            <p className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span>
                Hosted by <span className="font-semibold text-[#e2e2e8]">{hostName}</span>
              </span>
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {categoryCountLabel(g)}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-1.5 border-t border-white/10 pt-4 text-sm text-[#e2e2e8]">
          <Users className="h-3.5 w-3.5 text-[#c2c6d7]" strokeWidth={1.5} />
          {g.registeredCount} registered
        </div>
      </div>
    </Link>
  );
}
