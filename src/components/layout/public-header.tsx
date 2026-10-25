"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const redButtonClass = "bg-[#ff2448] text-white hover:bg-[#e01f3f]";

// The public site is only ever seen logged-out (PublicOnly in the (public)
// layout sends signed-in visitors to their portal), so this header never reads
// the session: public listings + Log In / Sign Up, always.
const navItems = [
  { href: "/players", label: "Players" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
];

/** Shared by PublicHeader (→ landing page) and DashboardShell (→ the portal's dashboard). */
export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="font-heading text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
      SpinTTRatings
    </Link>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Login/register are focused, single-purpose pages — the listings nav is
  // just a distraction from the form there.
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-20">
        <Wordmark />

        {!isAuthPage && (
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          <Button variant="ghost" size="lg" className="h-8 px-3 text-xs font-semibold uppercase tracking-wide" render={<Link href="/login" />}>
            Log In
          </Button>
          <Button size="lg" className={cn(redButtonClass, "h-8 px-4 text-xs font-semibold uppercase tracking-wide")} render={<Link href="/register" />}>
            Sign Up
          </Button>
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
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} render={<Link href="/login" />}>
                  Log In
                </Button>
                <Button size="sm" className={redButtonClass} onClick={() => setOpen(false)} render={<Link href="/register" />}>
                  Sign Up
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
