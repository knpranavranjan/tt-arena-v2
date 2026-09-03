"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRegistrations } from "@/lib/registrations";
import { derivedPlayerPhone, getPlayer, getTournament, getTournamentPlayers } from "@/lib/mock-data";
import { formatCurrency, initials } from "@/lib/format";

const mono = { fontFamily: "var(--font-home-mono)" };

type RowStatus = "REGISTERED" | "PENDING_PAYMENT";
type PayoutStatus = "Not Applicable" | "Paid" | "Pending";

interface RegistrantRow {
  playerId: string;
  name: string;
  clubName: string | null;
  phone: string;
  entries: number;
  amountPaid: number;
  timeOfReg: string;
  status: RowStatus;
  payoutStatus: PayoutStatus;
}

const statusLabel: Record<RowStatus, string> = {
  REGISTERED: "Registered",
  PENDING_PAYMENT: "Payment Pending",
};

const statusClass: Record<RowStatus, string> = {
  REGISTERED: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  PENDING_PAYMENT: "border border-amber-400/40 bg-amber-400/10 text-amber-300",
};

const payoutClass: Record<PayoutStatus, string> = {
  "Not Applicable": "text-[#5a5a60]",
  Paid: "text-emerald-400",
  Pending: "text-amber-300",
};

const PAGE_SIZE = 10;

export default function ManageTournamentRegistrationsPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;
  const tournament = tournamentId ? getTournament(tournamentId) : undefined;
  const { registrations, isLoading } = useRegistrations();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RowStatus | "all">("all");
  const [payoutFilter, setPayoutFilter] = useState<PayoutStatus | "all">("all");
  const [page, setPage] = useState(1);

  const rows = useMemo<RegistrantRow[]>(() => {
    if (!tournament) return [];

    // Payouts aren't modeled — they only make sense once a tournament has
    // wrapped, so anything still in progress is simply "Not Applicable"; a
    // completed tournament gets a stable seeded Paid/Pending split.
    function payoutFor(seed: number): PayoutStatus {
      if (tournament!.status !== "COMPLETED") return "Not Applicable";
      return seed % 3 === 0 ? "Pending" : "Paid";
    }

    const deadline = new Date(tournament.registrationDeadline).getTime();
    const seedRows: RegistrantRow[] = getTournamentPlayers(tournament).map((player, i) => {
      const seed = Number(player.id.replace(/\D/g, "")) || i + 1;
      const daysBefore = 1 + (seed % 10);
      return {
        playerId: player.id,
        name: player.name,
        clubName: player.clubName,
        phone: derivedPlayerPhone(player),
        entries: 1,
        amountPaid: tournament.entryFee,
        timeOfReg: new Date(deadline - daysBefore * 86_400_000).toISOString(),
        status: "REGISTERED",
        payoutStatus: payoutFor(seed),
      };
    });

    // Live demo registrations (from the public "Register Now" flow) that
    // aren't already part of the tournament's seeded roster — this is what
    // surfaces a real "Payment Pending" row for a manager to follow up on.
    const seedIds = new Set(seedRows.map((r) => r.playerId));
    const liveRows: RegistrantRow[] = registrations
      .filter((r) => r.tournamentId === tournament.id && !seedIds.has(r.playerId))
      .map((r) => {
        const player = getPlayer(r.playerId);
        const seed = Number(r.playerId.replace(/\D/g, "")) || 1;
        return {
          playerId: r.playerId,
          name: r.playerName,
          clubName: player?.clubName ?? null,
          phone: player ? derivedPlayerPhone(player) : "—",
          entries: 1,
          amountPaid: r.status === "REGISTERED" ? tournament.entryFee : 0,
          timeOfReg: r.createdAt,
          status: r.status,
          payoutStatus: payoutFor(seed),
        };
      });

    return [...seedRows, ...liveRows].sort(
      (a, b) => new Date(b.timeOfReg).getTime() - new Date(a.timeOfReg).getTime(),
    );
  }, [tournament, registrations]);

  const filtered = rows.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.phone.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (payoutFilter !== "all" && r.payoutStatus !== payoutFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!tournament) return null;

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-grow">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b93]" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => updateFilter(setSearch, e.target.value)}
            className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] py-3 pl-11 pr-4 text-sm text-[#e2e2e8] placeholder:text-[#5a5a60] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => updateFilter(setStatusFilter, e.target.value as RowStatus | "all")}
          className="rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448] sm:w-48"
        >
          <option value="all">All Statuses</option>
          <option value="REGISTERED">Registered</option>
          <option value="PENDING_PAYMENT">Payment Pending</option>
        </select>
        <select
          value={payoutFilter}
          onChange={(e) => updateFilter(setPayoutFilter, e.target.value as PayoutStatus | "all")}
          className="rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448] sm:w-52"
        >
          <option value="all">All Payout Statuses</option>
          <option value="Not Applicable">Not Applicable</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-[8px] border border-white/10 bg-white/[0.02]" />
      ) : filtered.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <p className="text-sm font-semibold text-[#e2e2e8]">No registrations found</p>
          <p className="mt-1 text-xs text-[#8b8b93]">Try a different search or filter.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[8px] border border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-[#8b8b93]" style={mono}>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Entries</th>
                  <th className="px-4 py-3 font-semibold">Amount Paid</th>
                  <th className="px-4 py-3 font-semibold">Time of Reg.</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payout</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.playerId} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-white/15">
                          <AvatarFallback className="bg-white/10 text-xs text-[#c2c6d7]">
                            {initials(r.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#e2e2e8]">{r.name}</p>
                          {r.clubName && <p className="truncate text-xs text-[#8b8b93]">{r.clubName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[#c2c6d7]">{r.phone}</td>
                    <td className="px-4 py-3.5 tabular-nums text-[#c2c6d7]">{r.entries}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-[#e2e2e8]">
                      {formatCurrency(r.amountPaid)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[#8b8b93]">
                      {new Date(r.timeOfReg).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-[2px] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass[r.status]}`}
                        style={mono}
                      >
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3.5 text-xs font-medium ${payoutClass[r.payoutStatus]}`}>
                      {r.payoutStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-[#8b8b93]">
              Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length} entries
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-white/15 text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-[2px] px-2 text-xs font-semibold transition-colors ${
                    p === safePage
                      ? "bg-[#ff2448] text-white"
                      : "border border-white/15 text-[#c2c6d7] hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-[2px] border border-white/15 text-[#c2c6d7] transition-colors hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
