import { Building2, Calendar, LayoutDashboard, Users } from "lucide-react";
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
// of jumping out to the public site.
export const playerNav: NavItem[] = [
  { href: "/player/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/player/players", label: "Players", icon: Users },
  { href: "/player/clubs", label: "Clubs", icon: Building2 },
  { href: "/player/events", label: "Events", icon: Calendar },
];
export const clubNav: NavItem[] = sharedNav("/club/dashboard");
export const hostNav: NavItem[] = sharedNav("/host/dashboard");
export const adminNav: NavItem[] = sharedNav("/admin/dashboard");
