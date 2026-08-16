import {
  Activity,
  Building2,
  Calendar,
  Cog,
  Gauge,
  LayoutDashboard,
  LineChart,
  Plug,
  Settings,
  Shield,
  Trophy,
  User,
  Users,
} from "lucide-react";
import type { NavItem } from "@/components/layout/dashboard-shell";

export const playerNav: NavItem[] = [
  { href: "/player/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/player/profile", label: "Profile", icon: User },
  { href: "/player/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/player/registrations", label: "Registrations", icon: Calendar },
  { href: "/player/results", label: "Results", icon: Gauge },
  { href: "/player/rating", label: "Rating", icon: LineChart },
  { href: "/player/settings", label: "Settings", icon: Settings },
];

export const clubNav: NavItem[] = [
  { href: "/club/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/club/players", label: "Players", icon: Users },
  { href: "/club/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/club/events", label: "Events", icon: Calendar },
  { href: "/club/results", label: "Results", icon: Gauge },
  { href: "/club/profile", label: "Club Profile", icon: Building2 },
  { href: "/club/settings", label: "Settings", icon: Settings },
];

export const hostNav: NavItem[] = [
  { href: "/host/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/host/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/host/events", label: "Events", icon: Calendar },
  { href: "/host/players", label: "Players", icon: Users },
  { href: "/host/results", label: "Results", icon: Gauge },
  { href: "/host/rating-exports", label: "Rating Exports", icon: Plug },
  { href: "/host/profile", label: "Profile", icon: User },
  { href: "/host/settings", label: "Settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Shield },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/clubs", label: "Clubs", icon: Building2 },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/rating-engine", label: "Rating Engine", icon: Plug },
  { href: "/admin/system-activity", label: "System Activity", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Cog },
];
