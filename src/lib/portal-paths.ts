import type { Role } from "@/lib/types";

/**
 * The public site (/, /players, /clubs, /events, /tournaments/x,
 * /host-tournament) is only ever seen logged-out. Every public page has a
 * twin inside each role's portal; this is the one mapping between them, used
 * for links rendered inside a portal, for sending a signed-in visitor off the
 * public site, and for honouring `?next=` after login/register.
 */

export const portalPrefixForRole: Record<Role, string> = {
  PLAYER: "/player",
  CLUB: "/club",
  HOST: "/host",
  ADMIN: "/admin",
};

const dashboardPath = (role: Role) => `${portalPrefixForRole[role]}/dashboard`;

// The player portal names its events list "/player/tournament".
const eventsListPath = (role: Role) => (role === "PLAYER" ? "/player/tournament" : `${portalPrefixForRole[role]}/events`);

/** The portal twin of a public path, or null when `path` isn't a public page. Query/hash are kept. */
export function portalPathFor(role: Role, path: string): string | null {
  const cut = path.search(/[?#]/);
  const pathname = cut === -1 ? path : path.slice(0, cut);
  const suffix = cut === -1 ? "" : path.slice(cut);
  const p = portalPrefixForRole[role];
  const segs = pathname.split("/").filter(Boolean);

  let mapped: string | null = null;
  if (segs.length === 0) mapped = dashboardPath(role);
  else if (segs.length <= 2 && (segs[0] === "players" || segs[0] === "clubs")) mapped = `${p}/${segs.join("/")}`;
  else if (segs.length === 1 && (segs[0] === "events" || segs[0] === "tournaments")) mapped = eventsListPath(role);
  else if (segs.length === 2 && segs[0] === "events") mapped = `${p}/events/${segs[1]}`;
  else if (segs.length === 2 && segs[0] === "tournaments") mapped = `${p}/categories/${segs[1]}`;
  else if (segs.length === 1 && segs[0] === "host-tournament")
    mapped = role === "ADMIN" ? dashboardPath(role) : `${p}/host-tournament`;

  return mapped && mapped + suffix;
}

/**
 * Public pages that need a signed-in account (player profiles, the host form).
 * On the public site a link to one goes to /login instead, and after login the
 * visitor lands on the portal twin via `?next=`; inside a portal the same link
 * goes straight to the twin.
 */
export function isLoginOnlyPublicPath(path: string): boolean {
  return /^\/players\/[^/?#]+/.test(path) || /^\/host-tournament(?:[?#]|$)/.test(path);
}

export const loginPathFor = (path: string) => `/login?next=${encodeURIComponent(path)}`;

/**
 * Where to send an account after it signs in / registers, given the `?next=`
 * it arrived with. A public page becomes its portal twin; the account's own
 * portal and shared pages like /assist are kept; another role's portal falls
 * back to the dashboard (RequireRole would only bounce it back to /login).
 * Only same-origin relative paths are accepted (no `//evil.com` redirects).
 */
export function resolveNextPath(requested: string | null | undefined, role: Role): string {
  if (!requested || !requested.startsWith("/") || requested.startsWith("//")) return dashboardPath(role);
  if (/^\/(login|register)\b/.test(requested)) return dashboardPath(role);
  const portal = portalPathFor(role, requested);
  if (portal) return portal;
  const inOtherPortal = (Object.keys(portalPrefixForRole) as Role[]).some((r) => {
    if (r === role) return false;
    const prefix = portalPrefixForRole[r];
    return requested === prefix || requested.startsWith(`${prefix}/`) || requested.startsWith(`${prefix}?`);
  });
  return inOtherPortal ? dashboardPath(role) : requested;
}
