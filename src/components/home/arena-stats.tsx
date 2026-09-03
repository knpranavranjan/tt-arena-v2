import { Calendar, Trophy, Users } from "lucide-react";
import { StatCounter } from "@/components/home/stat-counter";
import { events, players, tournaments } from "@/lib/mock-data";

const stats = [
  { label: "Tournaments", value: tournaments.length, icon: Trophy },
  { label: "Rated Players", value: players.length, icon: Users },
  {
    label: "Upcoming Events",
    value: events.filter((e) => e.status === "UPCOMING").length,
    icon: Calendar,
  },
];

export function ArenaStats() {
  return (
    <section className="relative bg-[#111318] py-20">
      <div className="w-full px-6 text-center sm:px-10 lg:px-16 xl:px-20">
        <span
          className="mb-3 block text-sm font-semibold uppercase tracking-[0.15em] text-[#ff8f86]"
          style={{ fontFamily: "var(--font-home-mono)" }}
        >
          The Arena
        </span>
        <h2
          className="mb-12 text-[26px] font-bold text-[#e2e2e8] sm:text-[34px]"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Where competition comes alive.
        </h2>

        <div className="relative mx-auto grid max-w-none grid-cols-1 gap-8 md:grid-cols-3 md:gap-0">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent md:block"
            aria-hidden="true"
          />
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`relative z-10 flex flex-col items-center gap-3 bg-[#111318] py-6 md:bg-transparent ${
                i === 1 ? "md:border-x md:border-white/10" : ""
              }`}
            >
              <stat.icon className="h-10 w-10 text-[#ff8f86]" strokeWidth={1.5} aria-hidden="true" />
              <span
                className="text-5xl font-extrabold tabular-nums text-[#e2e2e8]"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                <StatCounter value={stat.value} />
              </span>
              <span
                className="text-sm font-semibold uppercase tracking-[0.15em] text-[#c2c6d7]"
                style={{ fontFamily: "var(--font-home-mono)" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
