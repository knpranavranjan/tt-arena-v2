"use client";

import { usePathname } from "next/navigation";
import { RequireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { hostNav } from "@/lib/nav-config";

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = hostNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <RequireRole role="HOST">
      <DashboardShell role="HOST" navItems={hostNav} pageTitle={active?.label ?? "Host Portal"}>
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
