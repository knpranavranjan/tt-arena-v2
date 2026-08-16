"use client";

import { Activity, Building2, CheckCircle2, Plug, UserPlus } from "lucide-react";

const activity = [
  { icon: UserPlus, time: "2 min ago", text: "Player Sneha Iyer registered for TT Open 2026 — Senior Singles" },
  { icon: CheckCircle2, time: "18 min ago", text: "Host Karnataka TTA Ops closed registration for Monsoon Cup — Open Singles" },
  { icon: Plug, time: "1 hr ago", text: "Rating export sent for Eastern Regional Championship (202 Accepted)" },
  { icon: Building2, time: "3 hrs ago", text: "New club SpinForge Academy verified" },
  { icon: UserPlus, time: "5 hrs ago", text: "Player Dev Patil created an account" },
  { icon: CheckCircle2, time: "Yesterday", text: "Eastern Regional Championship marked completed — champion: Arjun Sharma" },
  { icon: Plug, time: "2 days ago", text: "Rating Engine integration health check passed" },
];

export default function AdminSystemActivityPage() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Activity className="h-4 w-4 text-primary" strokeWidth={1.5} />
        Recent platform activity
      </p>
      <div className="mt-2 flex flex-col divide-y divide-border">
        {activity.map((a, i) => (
          <div key={i} className="flex items-start gap-3 py-3 text-sm">
            <a.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <div>
              <p className="text-foreground">{a.text}</p>
              <p className="text-xs text-muted-foreground">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
