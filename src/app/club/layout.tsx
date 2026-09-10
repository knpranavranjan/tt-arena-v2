"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RequireRole } from "@/lib/auth";
import { RequireActiveMembership } from "@/lib/membership";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { clubNav } from "@/lib/nav-config";
import { useCurrentClubNeedsOnboarding } from "@/lib/session-data";

const ONBOARDING_PATH = "/club/onboarding";

function RequireCompleteProfile({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const needsOnboarding = useCurrentClubNeedsOnboarding();

  useEffect(() => {
    if (needsOnboarding) router.replace(ONBOARDING_PATH);
  }, [needsOnboarding, router]);

  if (needsOnboarding) return <div className="flex-1" />;
  return <>{children}</>;
}

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = clubNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const isRenewPage = pathname === "/club/renew";
  const isOnboardingPage = pathname === ONBOARDING_PATH;

  return (
    <RequireRole role="CLUB">
      {isRenewPage ? (
        <>{children}</>
      ) : (
        <RequireActiveMembership role="CLUB">
          <DashboardShell role="CLUB" navItems={clubNav} pageTitle={active?.label ?? "Club Portal"}>
            {isOnboardingPage ? children : <RequireCompleteProfile>{children}</RequireCompleteProfile>}
          </DashboardShell>
        </RequireActiveMembership>
      )}
    </RequireRole>
  );
}
