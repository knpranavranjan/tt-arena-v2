"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { dashboardPathForRole, useAuth } from "@/lib/auth";
import { portalPathFor } from "@/lib/portal-paths";

/**
 * The public site is for logged-out visitors only. A signed-in visitor (logo
 * click, shared link, back button) is sent to the same page inside their own
 * portal, so the two worlds never mix.
 */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const search = window.location.search;
    router.replace(portalPathFor(user.role, pathname + search) ?? dashboardPathForRole[user.role]);
  }, [user, pathname, router]);

  if (user) return <div className="flex-1" />;
  return <>{children}</>;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PublicHeader />
      <main className="flex-1">
        <PublicOnly>{children}</PublicOnly>
      </main>
      <PublicFooter />
    </div>
  );
}
