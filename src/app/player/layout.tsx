"use client";

import { usePathname } from "next/navigation";
import { RequireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { playerNav } from "@/lib/nav-config";

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = playerNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <RequireRole role="PLAYER">
      <DashboardShell role="PLAYER" navItems={playerNav} pageTitle={active?.label ?? "Player Portal"}>
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
