import { BarChart3, Building2, Calendar, LayoutDashboard, Users } from "lucide-react";
import type { NavItem } from "@/components/layout/dashboard-shell";

// Every authenticated portal shares the same top-level nav — a link back to that
// role's own dashboard, plus the three public listing pages (shared across all
// roles, not role-scoped) rather than each portal maintaining its own copy.
function sharedNav(dashboardHref: string): NavItem[] {
  return [
    { href: dashboardHref, label: "Dashboard", icon: LayoutDashboard },
    { href: "/players", label: "Players", icon: Users },
    { href: "/clubs", label: "Clubs", icon: Building2 },
    { href: "/events", label: "Events", icon: Calendar },
  ];
}

// The player portal keeps Players/Clubs/Events inside the portal shell instead
// of jumping out to the public site. "Manage Tournaments" (tournaments this
// player has hosted via "Host a Tournament") is reached from the dashboard
// card instead of the top nav — no separate nav entry.
export const playerNav: NavItem[] = [
  { href: "/player/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/player/players", label: "Players", icon: Users },
  { href: "/player/clubs", label: "Clubs", icon: Building2 },
  { href: "/player/tournament", label: "Events", icon: Calendar },
];
export const clubNav: NavItem[] = sharedNav("/club/dashboard");
export const hostNav: NavItem[] = sharedNav("/host/dashboard");

// Admin keeps Players/Clubs/Events inside its own portal shell too (like the
// player portal above) rather than the shared public pages — those live
// outside the admin layout, so navigating to them dropped the "Analytics"
// tab (and the rest of the admin nav) entirely. Admin also gets an extra
// "Analytics" tab (platform-wide revenue and growth) — the only role with
// this view.
export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/clubs", label: "Clubs", icon: Building2 },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];
