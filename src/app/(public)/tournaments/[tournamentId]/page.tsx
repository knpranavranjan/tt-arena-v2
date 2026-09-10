"use client";

import { use, useMemo, useState, type ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronDown, ChevronRight, MapPin, Trophy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TournamentRegisterButton } from "@/components/tournaments/tournament-register-button";
import { TieBreakRules } from "@/components/tournaments/tie-break-rules";
import { LiveRating } from "@/components/players/live-rating";
import { arenaFontVariables } from "@/lib/fonts";
import { getPlayer, getTournamentPlayers } from "@/lib/mock-data";
import { useAllEvents, useAllTournaments, useHostedTournaments } from "@/lib/hosted-tournaments";
import { effectiveStatus, useTournamentStatus } from "@/lib/tournament-status";
import {
  usePublishedResults,
  type PublishedCategoryResult,
  type PublishedPlacement,
} from "@/lib/published-results";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import type { Tournament, TournamentFormat, TournamentStatus } from "@/lib/types";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

const formatLabel: Record<TournamentFormat, string> = {
  SINGLE_ELIMINATION: "Direct Knockout",
  POOL_KNOCKOUT: "Round Robin + Knockouts",
  ROUND_ROBIN_LEAGUE: "Round Robin / League",
};

const closedStatusLabel: Partial<Record<TournamentStatus, string>> = {
  DRAFT: "Registration Not Open Yet",
  REGISTRATION_CLOSED: "Registration Closed",
  SEEDING: "Seeding In Progress",
  POOLS: "Pools In Progress",
  KNOCKOUT: "Knockout In Progress",
  COMPLETED: "Tournament Completed",
};

const statusBadgeLabel: Record<TournamentStatus, string> = {
  DRAFT: "Draft",
  REGISTRATION_OPEN: "Registration Open",
  REGISTRATION_CLOSED: "Registration Closed",
  SEEDING: "Seeding",
  POOLS: "Pools In Progress",
  KNOCKOUT: "Knockout In Progress",
  COMPLETED: "Completed",
};

function statusBadgeClass(status: TournamentStatus) {
  if (status === "COMPLETED") return "border border-white/20 bg-[#111318]/80 text-[#e2e2e8]";
  if (status === "REGISTRATION_OPEN" || status === "POOLS" || status === "KNOCKOUT") {
    return "bg-[#ff2448] text-white";
  }
  return "border border-amber-400/40 bg-amber-400/10 text-amber-300";
}

export default function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();
  const { isLoading } = useHostedTournaments();
  const { overrides } = useTournamentStatus();

  const tournament = allTournaments.find((t) => t.id === tournamentId);

  // Every category of this event (this record included), cheapest entry first.
  const siblingCategories = useMemo(
    () =>
      tournament
        ? allTournaments
            .filter((t) => t.eventId === tournament.eventId)
            .sort((a, b) => a.entryFee - b.entryFee)
        : [],
    [allTournaments, tournament],
  );
  const publishedResults = usePublishedResults(siblingCategories);

  // Hosted tournaments hydrate from localStorage — don't 404 before that lands.
  if (isLoading) return <div className="min-h-screen bg-[#050a12]" />;
  if (!tournament) notFound();

  const status = effectiveStatus(tournament, overrides);
  const registeredPlayers = getTournamentPlayers(tournament).sort((a, b) => b.rating - a.rating);
  // The hero shows the event's own name — never the "— <category>" suffix that
  // each category record carries.
  const eventName = allEvents.find((e) => e.id === tournament.eventId)?.name ?? tournament.name;

  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      {/* Banner */}
      <div className="relative h-[220px] w-full overflow-hidden sm:h-[280px]">
        <Image
          src="/events/events.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover object-[65%_center] opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a12] via-[#050a12]/60 to-[#050a12]/20" />
      </div>

      <div className="mx-auto -mt-20 w-full max-w-[1280px] px-4 pb-24 sm:px-12">
        <span
          className={`mb-4 inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur ${statusBadgeClass(status)}`}
          style={mono}
        >
          {(status === "POOLS" || status === "KNOCKOUT") && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          )}
          {statusBadgeLabel[status]}
        </span>
        <h1
          className="mb-3 text-[32px] font-extrabold uppercase leading-[1.05] tracking-tight text-[#e2e2e8] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-[44px]"
          style={display}
        >
          {eventName}
        </h1>
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#c2c6d7]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#ff2448]" strokeWidth={1.75} />
            {formatDate(tournament.date)}
          </span>
          <span className="text-[#8b8b93]">&middot;</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#ff2448]" strokeWidth={1.75} />
            {tournament.venue}
          </span>
          <span className="text-[#8b8b93]">&middot;</span>
          <span>hosted by {tournament.organizer}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="min-w-0 space-y-10">
            <section>
              <SectionLabel>Venue</SectionLabel>
              <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5 text-sm text-[#e2e2e8]">
                {tournament.venue}
              </div>
            </section>

            <section>
              <SectionLabel accent>Categories &amp; Entry Fees</SectionLabel>
              <div className="overflow-hidden rounded-[8px] border border-white/10">
                {siblingCategories.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.id}`}
                    className={`flex items-center justify-between gap-3 border-b border-white/10 p-4 last:border-0 transition-colors ${
                      t.id === tournament.id ? "bg-[#ff2448]/[0.08]" : "bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-[#e2e2e8]">{t.category} Singles</span>
                    <span className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-[#ff8f86]" style={display}>
                        {formatCurrency(t.entryFee)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#8b8b93]" strokeWidth={2} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel accent>Format &amp; Rules</SectionLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <RuleCard label="Format" value={formatLabel[tournament.format]} />
                <RuleCard label="Match Format" value={tournament.matchFormat} />
                <RuleCard label="Ball Type" value={tournament.ballType} />
                <RuleCard label="Umpire" value={tournament.umpireStatus} />
              </div>
              <TieBreakRules className="mt-3" order={tournament.tieBreakOrder} />
            </section>

            {tournament.description && (
              <section>
                <SectionLabel accent>Details</SectionLabel>
                <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-[#c2c6d7]">
                  {tournament.description}
                </div>
              </section>
            )}

            {tournament.registrationQuestions && tournament.registrationQuestions.length > 0 && (
              <section>
                <SectionLabel accent>Registration Questions</SectionLabel>
                <div className="space-y-3 rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs text-[#8b8b93]">Players answer these when they register.</p>
                  {tournament.registrationQuestions.map((q, i) => (
                    <div key={i} className="border-t border-white/10 pt-3 first-of-type:border-0 first-of-type:pt-0">
                      <p className="text-sm font-medium text-[#e2e2e8]">
                        {i + 1}. {q.question}
                      </p>
                      <p className="mt-0.5 text-xs text-[#8b8b93]" style={mono}>
                        {q.responseType}
                        {q.options && q.options.length > 0 ? ` — ${q.options.join(" · ")}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="min-w-0 space-y-4">
            <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
                Cash Prize Pool
              </p>
              <p className="mt-2 text-4xl font-extrabold text-[#e2e2e8]" style={display}>
                {formatCurrency(tournament.prizePool)}
              </p>
              {tournament.totalPrizePool && tournament.totalPrizePool !== tournament.prizePool && (
                <p className="mt-1 text-xs text-[#8b8b93]">
                  {formatCurrency(tournament.totalPrizePool)} across all categories
                </p>
              )}
            </div>

            <RegisterCta tournament={tournament} status={status} categories={siblingCategories} />

            <Link
              href="/events"
              className="flex w-full items-center justify-center rounded-[2px] border border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
              style={mono}
            >
              All Events
            </Link>

            {tournament.posterUrl && (
              <div className="overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03]">
                <div className="aspect-[4/5] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tournament.posterUrl}
                    alt={`${tournament.name} poster`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p
                  className="border-t border-white/10 px-3 py-2 text-center text-[10px] uppercase tracking-widest text-[#8b8b93]"
                  style={mono}
                >
                  Event Poster
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Registered players / champion */}
        <div id="players" className="mt-16 space-y-12 scroll-mt-24">
          <section>
            <SectionLabel>Registered Players ({registeredPlayers.length})</SectionLabel>
            {registeredPlayers.length === 0 ? (
              <p className="text-sm text-[#8b8b93]">No players registered yet. Registered players will appear here once they sign up.</p>
            ) : (
              <div className="overflow-x-auto rounded-[8px] border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-[#8b8b93]">Player</TableHead>
                      <TableHead className="text-[#8b8b93]">Club</TableHead>
                      <TableHead className="text-[#8b8b93]">Categories</TableHead>
                      <TableHead className="text-right text-[#8b8b93]">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredPlayers.map((p) => {
                      const playerCategories = siblingCategories.filter((c) =>
                        c.registeredPlayerIds.includes(p.id),
                      );
                      return (
                        <TableRow key={p.id} className="border-white/10 hover:bg-white/[0.03]">
                          <TableCell>
                            <Link href={`/players/${p.id}`} className="flex items-center gap-2 font-medium text-[#e2e2e8] hover:text-[#ff8f86]">
                              <Avatar className="h-7 w-7 border border-white/15">
                                <AvatarFallback className="bg-white/10 text-xs text-[#c2c6d7]">{initials(p.name)}</AvatarFallback>
                              </Avatar>
                              {p.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-[#8b8b93]">{p.clubName ?? "Unaffiliated"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {playerCategories.map((c) => (
                                <span
                                  key={c.id}
                                  className={`rounded-[2px] border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                    c.id === tournament.id
                                      ? "border-[#ff2448]/40 bg-[#ff2448]/10 text-[#ff8f86]"
                                      : "border-white/15 bg-white/[0.03] text-[#c2c6d7]"
                                  }`}
                                  style={mono}
                                >
                                  {c.category}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-[#e2e2e8]">
                            <LiveRating playerId={p.id} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {status === "COMPLETED" && publishedResults.length === 0 && (
            <section id="champion" className="scroll-mt-24">
              <SectionLabel>Champion</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-3">
                <ResultCard label="Champion" name={getPlayer(tournament.champion!)?.name} highlight />
                <ResultCard label="Runner-up" name={getPlayer(tournament.runnerUp!)?.name} />
                <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#8b8b93]" style={mono}>
                    Semifinalists
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {tournament.semiFinalists?.map((id) => (
                      <span key={id} className="text-sm text-[#e2e2e8]">
                        {getPlayer(id)?.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          <PublishedResultsSection results={publishedResults} activeTournamentId={tournament.id} />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <h2 className={`mb-4 text-xs font-bold uppercase tracking-widest ${accent ? "text-[#ff2448]" : "text-[#c2c6d7]"}`} style={mono}>
      {children}
    </h2>
  );
}

function RuleCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-wide text-[#8b8b93]" style={mono}>
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold leading-snug text-[#e2e2e8]">{value}</p>
    </div>
  );
}

function RegisterCta({
  tournament,
  status,
  categories,
}: {
  tournament: Tournament;
  status: TournamentStatus;
  categories: Tournament[];
}) {
  if (status === "REGISTRATION_OPEN") {
    return <TournamentRegisterButton tournament={tournament} categories={categories} />;
  }

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
        {closedStatusLabel[status]}
      </p>
      {status === "COMPLETED" ? (
        <a
          href="#champion"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-[#ff8f86] transition-colors hover:text-[#ff2448]"
          style={mono}
        >
          View Results
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      ) : (
        <p className="mt-2 text-xs text-[#8b8b93]">
          {tournament.registeredPlayerIds.length} registered
        </p>
      )}
    </div>
  );
}

function ResultCard({ label, name, highlight }: { label: string; name?: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "flex flex-col items-center gap-1 rounded-[8px] border border-[#ff2448]/40 bg-[#ff2448]/10 p-5 text-center"
          : "flex flex-col items-center gap-1 rounded-[8px] border border-white/10 bg-white/[0.03] p-5 text-center"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[#8b8b93]" style={mono}>
        {label}
      </p>
      <p className="text-lg font-semibold text-[#e2e2e8]" style={display}>
        {name ?? "—"}
      </p>
    </div>
  );
}

/**
 * Published results for every category of this event. Each host publishes their
 * category's podium from the Matches console; this reads them back and shows one
 * expandable row per category.
 */
function PublishedResultsSection({
  results,
  activeTournamentId,
}: {
  results: PublishedCategoryResult[];
  activeTournamentId: string;
}) {
  // `results` can arrive a tick after mount (localStorage read in an effect),
  // so the default-open row is derived every render rather than frozen in
  // state. `override` is null until the visitor clicks something.
  const keyOf = (r: PublishedCategoryResult) => `${r.tournamentId}:${r.categoryName}`;
  const defaultKey = (() => {
    const first = results.find((r) => r.tournamentId === activeTournamentId) ?? results[0];
    return first ? keyOf(first) : null;
  })();
  const [override, setOverride] = useState<string | null>(null);
  const openKey = override === null ? defaultKey : override === "__none" ? null : override;

  if (results.length === 0) return null;

  return (
    <section id="results" className="scroll-mt-24">
      <SectionLabel>Results</SectionLabel>
      <div className="overflow-hidden rounded-[8px] border border-white/10">
        {results.map((r) => {
          const key = keyOf(r);
          const open = openKey === key;
          return (
            <div key={key} className="border-b border-white/10 last:border-0">
              <button
                type="button"
                onClick={() => setOverride(open ? "__none" : key)}
                className="flex w-full items-center gap-3 bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.05]"
              >
                <span className="text-sm font-semibold text-[#e2e2e8]">{r.categoryName}</span>
                <span className="flex items-center gap-1.5 text-xs text-[#ff8f86]" style={mono}>
                  <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
                  {r.champion?.name ?? "—"}
                </span>
                <span className="ml-auto shrink-0 text-[#8b8b93]">
                  {open ? (
                    <ChevronDown className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  )}
                </span>
              </button>

              {open && (
                <div className="border-t border-white/10 p-5">
                  <div
                    className={`grid gap-4 ${r.third ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
                  >
                    <PodiumCard label="Champion" placement={r.champion} highlight />
                    <PodiumCard label="Runner-up" placement={r.runnerUp} />
                    {r.third && <PodiumCard label="Third Place" placement={r.third} />}
                  </div>
                  {r.stats && (
                    <p className="mt-4 text-xs text-[#8b8b93]" style={mono}>
                      {r.stats.players} players · {r.stats.matchesPlayed} matches · {r.stats.format}
                      {r.publishedAt ? ` · published ${formatDate(r.publishedAt)}` : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PodiumCard({
  label,
  placement,
  highlight,
}: {
  label: string;
  placement?: PublishedPlacement;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "flex flex-col items-center gap-1 rounded-[8px] border border-[#ff2448]/40 bg-[#ff2448]/10 p-5 text-center"
          : "flex flex-col items-center gap-1 rounded-[8px] border border-white/10 bg-white/[0.03] p-5 text-center"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[#8b8b93]" style={mono}>
        {label}
      </p>
      <p className="text-lg font-semibold text-[#e2e2e8]" style={display}>
        {placement?.name ?? "—"}
      </p>
      {placement && (placement.seed != null || placement.rating != null || placement.club) && (
        <p className="text-[11px] text-[#8b8b93]">
          {[
            placement.seed != null ? `Seed ${placement.seed}` : null,
            placement.rating != null ? `Rating ${placement.rating}` : null,
            placement.club || null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
