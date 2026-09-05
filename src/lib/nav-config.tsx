import { BarChart3, Building2, Calendar, LayoutDashboard, Radio, Users } from "lucide-react";
import type { NavItem } from "@/components/layout/dashboard-shell";

// Every portal keeps Players/Clubs/Events inside its own shell rather than
// jumping out to the shared public pages — those live outside every portal's
// RequireRole+DashboardShell layout entirely, so navigating to them dropped
// the whole portal nav (sidebar, role badge, and for admin the Analytics tab
// too) and swapped in the public site's own header instead.
export const playerNav: NavItem[] = [
  { href: "/player/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/player/match-centre", label: "Match Centre", icon: Radio },
  { href: "/player/players", label: "Players", icon: Users },
  { href: "/player/clubs", label: "Clubs", icon: Building2 },
  { href: "/player/tournament", label: "Events", icon: Calendar },
];

export const clubNav: NavItem[] = [
  { href: "/club/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/club/players", label: "Players", icon: Users },
  { href: "/club/clubs", label: "Clubs", icon: Building2 },
  { href: "/club/events", label: "Events", icon: Calendar },
];

export const hostNav: NavItem[] = [
  { href: "/host/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/host/players", label: "Players", icon: Users },
  { href: "/host/clubs", label: "Clubs", icon: Building2 },
  { href: "/host/events", label: "Events", icon: Calendar },
];

// Admin also gets an extra "Analytics" tab (platform-wide revenue and
// growth) — the only role with this view.
export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/clubs", label: "Clubs", icon: Building2 },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];
