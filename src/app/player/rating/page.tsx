"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "@/components/cards/stat-card";
import { useCurrentPlayer } from "@/lib/session-data";
import { usePlayerRatings } from "@/lib/player-ratings";
import { getRatingHistory } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { LineChart as LineChartIcon, TrendingUp, Trophy } from "lucide-react";

export default function PlayerRatingPage() {
  const player = useCurrentPlayer();
  const ratings = usePlayerRatings();
  if (!player) return null;

  const rating = ratings.getRating(player.id) || player.rating;
  const appliedHistory = ratings.getHistory(player.id);

  // Once the rating algorithm has actually run for this player, chart their
  // real tournament-by-tournament changes instead of the cosmetic demo curve.
  const history =
    appliedHistory.length > 0
      ? [
          { label: "Start", rating: appliedHistory[0].previousRating },
          ...appliedHistory.map((entry, i) => ({
            label: formatDate(entry.date) || `Event ${i + 1}`,
            rating: entry.newRating,
          })),
        ]
      : getRatingHistory({ ...player, rating });

  const change = history[history.length - 1].rating - history[0].rating;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current Rating" value={rating} icon={<LineChartIcon />} />
        <StatCard
          label={appliedHistory.length > 0 ? "All-Time Change" : "6-Month Change"}
          value={`${change >= 0 ? "+" : ""}${change}`}
          icon={<TrendingUp />}
          trend={change >= 0 ? "Trending up" : "Trending down"}
        />
        <StatCard label="Category" value={player.category} icon={<Trophy />} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-4 text-sm font-medium text-foreground">Rating History</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={["dataMin - 30", "dataMax + 30"]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-popover-foreground)",
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-primary)" }}
                activeDot={{ r: 5 }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {appliedHistory.length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-4 text-sm font-medium text-foreground">Tournament Results</p>
          <div className="flex flex-col gap-2">
            {[...appliedHistory].reverse().map((entry, i) => (
              <div
                key={`${entry.tournamentId}-${entry.categoryId}-${i}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{entry.tournamentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.categoryName} &middot; {formatDate(entry.date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span className="text-muted-foreground">{entry.previousRating}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="font-semibold text-foreground">{entry.newRating}</span>
                  <span className={entry.delta >= 0 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"}>
                    {entry.delta >= 0 ? "+" : ""}
                    {entry.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
