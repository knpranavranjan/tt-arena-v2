"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const redButtonClass = "bg-[#ff2448] text-white hover:bg-[#e01f3f]";

// Only the player portal has its own Players/Clubs/Events listing pages today —
// club/host/admin portals don't, so their sessions keep the public links.
const portalListingPaths: Partial<Record<Role, { players: string; clubs: string; events: string }>> = {
  PLAYER: { players: "/player/players", clubs: "/player/clubs", events: "/player/events" },
};

function getNavItems(role?: Role) {
  const portal = role ? portalListingPaths[role] : undefined;
  return [
    { href: "/", label: "Overview" },
    { href: portal?.players ?? "/players", label: "Players" },
    { href: portal?.clubs ?? "/clubs", label: "Clubs" },
    { href: portal?.events ?? "/events", label: "Events" },
  ];
}

export function Wordmark() {
  return (
    <Link href="/" className="font-heading text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
      SpinTTRatings
    </Link>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navItems = getNavItems(user?.role);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors",
                  active ? "text-[#ff2448]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-[#ff2448]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Switch Account
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Log In
              </Button>
              <Button size="sm" className={redButtonClass} render={<Link href="/register" />}>
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
              {navItems.map((item) => (
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
                {user ? (
                  <Button variant="outline" size="sm" onClick={() => setOpen(false)} render={<Link href="/login" />}>
                    Switch Account
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
