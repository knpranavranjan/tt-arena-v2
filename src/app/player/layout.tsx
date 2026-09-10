"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RequireRole } from "@/lib/auth";
import { RequireActiveMembership } from "@/lib/membership";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { playerNav } from "@/lib/nav-config";
import { useCurrentPlayerNeedsOnboarding } from "@/lib/session-data";

const ONBOARDING_PATH = "/player/onboarding";

/**
 * Keeps a signed-in player out of the portal until their profile has the
 * fields every page reads (date of birth, gender, state). New sign-ups that
 * completed those on the form pass straight through.
 */
function RequireCompleteProfile({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const needsOnboarding = useCurrentPlayerNeedsOnboarding();

  useEffect(() => {
    if (needsOnboarding) router.replace(ONBOARDING_PATH);
  }, [needsOnboarding, router]);

  if (needsOnboarding) return <div className="flex-1" />;
  return <>{children}</>;
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = playerNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const isRenewPage = pathname === "/player/renew";
  const isOnboardingPage = pathname === ONBOARDING_PATH;

  return (
    <RequireRole role="PLAYER">
      {isRenewPage ? (
        <>{children}</>
      ) : (
        <RequireActiveMembership role="PLAYER">
          <DashboardShell role="PLAYER" navItems={playerNav} pageTitle={active?.label ?? "Player Portal"}>
            {isOnboardingPage ? children : <RequireCompleteProfile>{children}</RequireCompleteProfile>}
          </DashboardShell>
        </RequireActiveMembership>
      )}
    </RequireRole>
  );
}
