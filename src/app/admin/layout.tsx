"use client";

import { usePathname } from "next/navigation";
import { RequireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = adminNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <RequireRole role="ADMIN">
      <DashboardShell role="ADMIN" navItems={adminNav} pageTitle={active?.label ?? "Admin Portal"}>
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
