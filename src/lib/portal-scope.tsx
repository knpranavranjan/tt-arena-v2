"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { isLoginOnlyPublicPath, loginPathFor, portalPathFor } from "@/lib/portal-paths";
import type { Role } from "@/lib/types";

/**
 * Which world a component is rendering in: a role's portal (set by
 * DashboardShell) or the public site (no provider → null). Public page
 * components are reused inside the portals, so their links and actions read
 * this rather than the session.
 */
const PortalScopeContext = createContext<Role | null>(null);

export function PortalScopeProvider({ role, children }: { role: Role; children: ReactNode }) {
  return <PortalScopeContext.Provider value={role}>{children}</PortalScopeContext.Provider>;
}

/** The portal this component is rendered in, or null on the public site. */
export function usePortalScope(): Role | null {
  return useContext(PortalScopeContext);
}

/**
 * Maps a public path ("/clubs/x", "/tournaments/y") to the current portal's
 * twin. On the public site it stays as-is, except login-only pages (player
 * profiles), which become a /login link that returns there afterwards.
 */
export function usePortalHref(): (publicPath: string) => string {
  const role = usePortalScope();
  return useCallback(
    (publicPath: string) => {
      if (role) return portalPathFor(role, publicPath) ?? publicPath;
      return isLoginOnlyPublicPath(publicPath) ? loginPathFor(publicPath) : publicPath;
    },
    [role],
  );
}
