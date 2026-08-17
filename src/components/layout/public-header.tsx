"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/players", label: "Players" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
      <span className="relative flex h-7 w-7 items-center justify-center rounded-sm border border-primary/40 bg-primary/10">
        <span className="h-2.5 w-2.5 rounded-[1px] bg-primary" />
      </span>
      <span className="text-foreground">
        Spin<span className="text-primary">TT</span>Ratings
      </span>
    </Link>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const { user, dashboardPath } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-sm px-3 py-2 text-sm font-medium tracking-wide transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Switch Account
              </Button>
              <Button size="sm" render={<Link href={dashboardPath(user.role)} />}>
                My Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Login
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
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
                  className="rounded-sm px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                {user ? (
                  <>
                    <Button size="sm" onClick={() => setOpen(false)} render={<Link href={dashboardPath(user.role)} />}>
                      My Dashboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)} render={<Link href="/login" />}>
                      Switch Account
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)} render={<Link href="/login" />}>
                      Login
                    </Button>
                    <Button size="sm" onClick={() => setOpen(false)} render={<Link href="/register" />}>
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
