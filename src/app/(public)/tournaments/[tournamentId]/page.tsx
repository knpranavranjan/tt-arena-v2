import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronRight, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TournamentRegisterButton } from "@/components/tournaments/tournament-register-button";
import { arenaFontVariables } from "@/lib/fonts";
import { getPlayer, getTournament, getTournamentPlayers, tournaments } from "@/lib/mock-data";
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

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  if (!tournament) notFound();

  const registeredPlayers = getTournamentPlayers(tournament).sort((a, b) => b.rating - a.rating);
  const siblingCategories = [...tournaments]
    .filter((t) => t.eventId === tournament.eventId)
    .sort((a, b) => a.entryFee - b.entryFee);

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
          className={`mb-4 inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur ${statusBadgeClass(tournament.status)}`}
          style={mono}
        >
          {(tournament.status === "POOLS" || tournament.status === "KNOCKOUT") && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          )}
          {statusBadgeLabel[tournament.status]}
        </span>
        <h1
          className="mb-3 text-[32px] font-extrabold uppercase leading-[1.05] tracking-tight text-[#e2e2e8] drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-[44px]"
          style={display}
        >
          {tournament.name}
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
            </section>

            <section>
              <SectionLabel accent>Details</SectionLabel>
              <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-[#c2c6d7]">
                {tournament.description}
              </div>
            </section>
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
            </div>

            <RegisterCta tournament={tournament} />

            <Link
              href="/events"
              className="flex w-full items-center justify-center rounded-[2px] border border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
              style={mono}
            >
              All Events
            </Link>
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
                      <TableHead className="text-right text-[#8b8b93]">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredPlayers.map((p) => (
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
                        <TableCell className="text-right tabular-nums text-[#e2e2e8]">{p.rating}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {tournament.status === "COMPLETED" && (
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

function RegisterCta({ tournament }: { tournament: Tournament }) {
  if (tournament.status === "REGISTRATION_OPEN") {
    return <TournamentRegisterButton tournament={tournament} />;
  }

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
        {closedStatusLabel[tournament.status]}
      </p>
      {tournament.status === "COMPLETED" ? (
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
          {tournament.registeredPlayerIds.length}/{tournament.maxPlayers} registered
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
