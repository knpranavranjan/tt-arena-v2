"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "@/components/cards/stat-card";
import { useCurrentPlayer } from "@/lib/session-data";
import { getRatingHistory } from "@/lib/mock-data";
import { LineChart as LineChartIcon, TrendingUp, Trophy } from "lucide-react";

export default function PlayerRatingPage() {
  const player = useCurrentPlayer();
  if (!player) return null;

  const history = getRatingHistory(player);
  const change = history[history.length - 1].rating - history[0].rating;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current Rating" value={player.rating} icon={<LineChartIcon />} />
        <StatCard
          label="6-Month Change"
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
    </div>
  );
}
