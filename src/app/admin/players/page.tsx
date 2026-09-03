"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { players } from "@/lib/mock-data";

const mono = { fontFamily: "var(--font-home-mono)" };
const display = { fontFamily: "var(--font-home-display)" };

export default function AdminPlayersPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      players
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.rating - a.rating),
    [search],
  );

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }} className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
          Players
        </h1>
        <p className="mt-1 text-sm text-[#8b8b93]">Every player registered on the platform.</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b93]" />
        <input
          type="text"
          placeholder="Search players…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] py-3 pl-11 pr-4 text-sm text-[#e2e2e8] placeholder:text-[#5a5a60] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/15 p-12 text-center">
          <p className="text-sm font-semibold text-[#e2e2e8]">No players found</p>
          <p className="mt-1 text-xs text-[#8b8b93]">Try a different search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-white/10">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-[#8b8b93]" style={mono}>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">Club</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Rating</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-white/10 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3.5 font-medium text-[#e2e2e8]">{p.name}</td>
                  <td className="px-4 py-3.5 text-[#8b8b93]">{p.clubName ?? "Unaffiliated"}</td>
                  <td className="px-4 py-3.5 text-[#8b8b93]">{p.state}</td>
                  <td className="px-4 py-3.5 text-[#8b8b93]">{p.category}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-[#ff8f86]" style={mono}>
                    {p.rating}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/players/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#c2c6d7] transition-colors hover:text-[#ff8f86]"
                      style={mono}
                    >
                      View
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
