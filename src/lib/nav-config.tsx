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

export const playerNav: NavItem[] = sharedNav("/player/dashboard");
export const clubNav: NavItem[] = sharedNav("/club/dashboard");
export const hostNav: NavItem[] = sharedNav("/host/dashboard");
export const adminNav: NavItem[] = sharedNav("/admin/dashboard");
