"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/layout/notification-bell";
import { dashboardPathForRole, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const redButtonClass = "bg-[#ff2448] text-white hover:bg-[#e01f3f]";

// Every role now has its own in-portal Players/Clubs/Events pages, so a
// signed-in visitor who ends up on a public page (e.g. the marketing
// homepage) still gets routed back into their own portal instead of the
// shared public listings.
const portalListingPaths: Partial<Record<Role, { players: string; clubs: string; events: string }>> = {
  PLAYER: { players: "/player/players", clubs: "/player/clubs", events: "/player/tournament" },
  CLUB: { players: "/club/players", clubs: "/club/clubs", events: "/club/events" },
  HOST: { players: "/host/players", clubs: "/host/clubs", events: "/host/events" },
  ADMIN: { players: "/admin/players", clubs: "/admin/clubs", events: "/admin/events" },
};

function getNavItems(role?: Role) {
  const portal = role ? portalListingPaths[role] : undefined;
  // For a signed-in visitor, "Overview" should return them to their own portal
  // home — not the public marketing landing page they've already moved past.
  // Anonymous visitors still get the marketing homepage.
  return [
    { href: role ? dashboardPathForRole[role] : "/", label: "Overview" },
    { href: portal?.players ?? "/players", label: "Players" },
    { href: portal?.clubs ?? "/clubs", label: "Clubs" },
    { href: portal?.events ?? "/events", label: "Events" },
  ];
}

export function Wordmark() {
  // Signed-in visitors get their own portal's overview instead of the public
  // landing page — this is shared by both PublicHeader and DashboardShell, so
  // it also covers the logo inside every role's dashboard chrome.
  const { user } = useAuth();
  return (
    <Link
      href={user ? dashboardPathForRole[user.role] : "/"}
      className="font-heading text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl"
    >
      SpinTTRatings
    </Link>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navItems = getNavItems(user?.role);
  // The landing page — and the login/register pages themselves — keep Log In /
  // Sign Up as the visible CTAs even when the visitor's browser has an active
  // (possibly stale, or role-mismatched) session: someone who got bounced to
  // /login?next=... after RequireRole rejected their current role still has a
  // user in storage, but showing "Go to Dashboard" there instead of the sign-in
  // form they're looking at is exactly the wrong shortcut. Everywhere else, a
  // signed-in visitor gets the "Go to Dashboard" shortcut instead of the
  // sign-up prompts.
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const showAuthButtons = !user || pathname === "/" || isAuthPage;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-20">
        <Wordmark />

        {/* Login/register are focused, single-purpose pages — the marketing/portal
            nav (Overview, Players, Clubs, Events) doesn't belong there, it's just
            a distraction from the form. */}
        {!isAuthPage && (
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-sm py-2 text-xs font-bold uppercase tracking-widest transition-colors",
                    active ? "text-[#ff2448]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#ff2448]" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="hidden items-center gap-3 md:flex">
          {user && !showAuthButtons && <NotificationBell />}
          {user && !showAuthButtons ? (
            <Button
              size="lg"
              className={cn(redButtonClass, "h-8 px-4 text-xs font-semibold uppercase tracking-wide")}
              render={<Link href={dashboardPathForRole[user.role]} />}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="lg" className="h-8 px-3 text-xs font-semibold uppercase tracking-wide" render={<Link href="/login" />}>
                Log In
              </Button>
              <Button size="lg" className={cn(redButtonClass, "h-8 px-4 text-xs font-semibold uppercase tracking-wide")} render={<Link href="/register" />}>
                Sign Up
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="font-heading">Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {!isAuthPage &&
                navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-sm px-3 py-2.5 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                {user && !showAuthButtons ? (
                  <Button
                    size="sm"
                    className={redButtonClass}
                    onClick={() => setOpen(false)}
                    render={<Link href={dashboardPathForRole[user.role]} />}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)} render={<Link href="/login" />}>
                      Log In
                    </Button>
                    <Button size="sm" className={redButtonClass} onClick={() => setOpen(false)} render={<Link href="/register" />}>
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
