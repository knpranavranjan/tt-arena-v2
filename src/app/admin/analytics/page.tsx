"use client";

import { Building2, IndianRupee, Trophy, Users, type LucideIcon } from "lucide-react";
import { clubs, getClubPlayers, players, tournaments } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function formatCompactCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}

interface MonthRevenue {
  key: string;
  label: string;
  amount: number;
}

function revenueByMonth(): MonthRevenue[] {
  const byMonth = new Map<string, MonthRevenue>();
  for (const t of tournaments) {
    const amount = t.entryFee * t.registeredPlayerIds.length;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const existing = byMonth.get(key);
    if (existing) {
      existing.amount += amount;
    } else {
      byMonth.set(key, { key, label: monthFormatter.format(d), amount });
    }
  }
  return [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) {
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
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const revenue = revenueByMonth();
  const totalRevenue = revenue.reduce((sum, m) => sum + m.amount, 0);
  const maxMonthAmount = Math.max(1, ...revenue.map((m) => m.amount));

  const topClubs = clubs
    .map((c) => ({ id: c.id, name: c.name, members: getClubPlayers(c.id).length }))
    .sort((a, b) => b.members - a.members)
    .slice(0, 5);
  const maxClubMembers = Math.max(1, ...topClubs.map((c) => c.members));

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }} className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[#8b8b93]">Platform-wide growth and revenue at a glance.</p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Players" value={String(players.length)} />
        <StatCard icon={Building2} label="Total Clubs" value={String(clubs.length)} />
        <StatCard icon={Trophy} label="Tournaments Hosted" value={String(tournaments.length)} />
        <StatCard icon={IndianRupee} label="Revenue This Year" value={formatCompactCurrency(totalRevenue)} accent />
      </div>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
            Revenue By Month
          </h2>
          {revenue.length === 0 ? (
            <p className="text-sm text-[#8b8b93]">No entry-fee revenue recorded yet.</p>
          ) : (
            <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-end gap-4 sm:gap-6" style={{ height: 220 }}>
                {revenue.map((m) => {
                  const barHeight = Math.max(6, Math.round((m.amount / maxMonthAmount) * 180));
                  return (
                    <div key={m.key} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-xs font-semibold tabular-nums text-[#ff8f86]" style={mono}>
                        {formatCompactCurrency(m.amount)}
                      </span>
                      <div
                        className="w-full max-w-12 rounded-t-[3px] bg-gradient-to-t from-[#ff2448] to-[#ff5c72] transition-all"
                        style={{ height: barHeight }}
                      />
                      <span className="text-[11px] uppercase tracking-wide text-[#8b8b93]" style={mono}>
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#ff2448]" style={mono}>
            Top Clubs By Members
          </h2>
          <div className="space-y-4 rounded-[8px] border border-white/10 bg-white/[0.03] p-5">
            {topClubs.map((c) => (
              <div key={c.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-[#e2e2e8]">{c.name}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-[#ff8f86]" style={mono}>
                    {c.members}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#ff2448]"
                    style={{ width: `${Math.max(4, (c.members / maxClubMembers) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
