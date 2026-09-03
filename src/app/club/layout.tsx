"use client";

import { usePathname } from "next/navigation";
import { RequireRole } from "@/lib/auth";
import { RequireActiveMembership } from "@/lib/membership";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { clubNav } from "@/lib/nav-config";

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = clubNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const isRenewPage = pathname === "/club/renew";

  return (
    <RequireRole role="CLUB">
      {isRenewPage ? (
        <>{children}</>
      ) : (
        <RequireActiveMembership role="CLUB">
          <DashboardShell role="CLUB" navItems={clubNav} pageTitle={active?.label ?? "Club Portal"}>
            {children}
          </DashboardShell>
        </RequireActiveMembership>
      )}
    </RequireRole>
  );
}
