"use client";

import { usePathname } from "next/navigation";
import { RequireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { clubNav } from "@/lib/nav-config";

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = clubNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <RequireRole role="CLUB">
      <DashboardShell role="CLUB" navItems={clubNav} pageTitle={active?.label ?? "Club Portal"}>
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
