"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { CircleDollarSign, RotateCcw, Users, Wallet, type LucideIcon } from "lucide-react";
import { useAllTournaments } from "@/lib/hosted-tournaments";
import { useRegistrations } from "@/lib/registrations";
import { usePlayerRoster } from "@/lib/players-store";
import {
  buildEventRegistrants,
  eventCategoryBreakdown,
  eventOverviewTotals,
} from "@/lib/tournament-manage";
import { formatCurrency } from "@/lib/format";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

function formatCompactCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

export default function ManageClubTournamentOverviewPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;
  const allTournaments = useAllTournaments();
  const { registrations } = useRegistrations();
  const roster = usePlayerRoster();

  const tournament = tournamentId ? allTournaments.find((t) => t.id === tournamentId) : undefined;
  // Overview is event-wide: every category of this event.
  const siblings = useMemo(
    () => (tournament ? allTournaments.filter((t) => t.eventId === tournament.eventId) : []),
    [tournament, allTournaments],
  );

  const registrants = useMemo(
    () => buildEventRegistrants(siblings, registrations, roster),
    [siblings, registrations, roster],
  );
  const totals = useMemo(() => eventOverviewTotals(registrants), [registrants]);
  const breakdown = useMemo(
    () => eventCategoryBreakdown(siblings, registrations, roster),
    [siblings, registrations, roster],
  );

  const totalSpots = siblings.reduce((sum, t) => sum + (t.maxPlayers || 32), 0);

  if (!tournament) return null;

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Registrations"
          value={String(totals.totalRegistrations)}
          subtext={`of ${totalSpots} spots`}
        />
        <StatCard
          icon={CircleDollarSign}
          label="Fee Collected"
          value={formatCompactCurrency(totals.feeCollected)}
          subtext={formatCurrency(totals.feeCollected)}
          accent
        />
        <StatCard icon={RotateCcw} label="Fee Refunded" value={formatCompactCurrency(totals.feeRefunded)} subtext={formatCurrency(totals.feeRefunded)} />
        <StatCard icon={Wallet} label="Payout Pending" value={formatCompactCurrency(totals.payoutPending)} subtext={formatCurrency(totals.payoutPending)} />
      </section>

      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c2c6d7]" style={mono}>
          Categories Breakdown
        </h2>
        {breakdown.length === 0 ? (
          <p className="text-sm text-[#8b8b93]">No categories on this event yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-[8px] border border-white/10">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-[#8b8b93]" style={mono}>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Spots Filled</th>
                  <th className="px-4 py-3 font-semibold">Fill %</th>
                  <th className="px-4 py-3 text-right font-semibold">Fee Collected</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row) => {
                  const fillPercent =
                    row.spotsTotal > 0 ? Math.min(100, Math.round((row.spotsFilled / row.spotsTotal) * 100)) : 0;
                  return (
                    <tr key={row.category} className="border-b border-white/10 last:border-0">
                      <td className="px-4 py-3.5 font-medium text-[#e2e2e8]">{row.category}</td>
                      <td className="px-4 py-3.5 tabular-nums text-[#c2c6d7]">
                        {row.spotsFilled}/{row.spotsTotal}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[#ff2448]"
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-xs text-[#8b8b93]">{fillPercent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-[#e2e2e8]">
                        {formatCurrency(row.feeCollected)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
          {label}
        </p>
        <Icon className={`h-4 w-4 ${accent ? "text-[#ff8f86]" : "text-[#5a5a60]"}`} strokeWidth={1.75} />
      </div>
      <p className={`text-2xl font-extrabold ${accent ? "text-[#ff8f86]" : "text-[#e2e2e8]"}`} style={display}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[#8b8b93]">{subtext}</p>
    </div>
  );
}
