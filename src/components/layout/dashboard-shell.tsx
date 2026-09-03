"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Settings, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Wordmark } from "@/components/layout/public-header";
import { useAuth } from "@/lib/auth";
import { useCurrentClub } from "@/lib/session-data";
import { useJoinRequests } from "@/lib/join-requests";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const roleLabel: Record<Role, string> = {
  PLAYER: "Player Portal",
  CLUB: "Club Portal",
  HOST: "Host Portal",
  ADMIN: "Admin Portal",
};

const settingsPathForRole: Record<Role, string> = {
  PLAYER: "/player/settings",
  CLUB: "/club/settings",
  HOST: "/host/settings",
  ADMIN: "/admin/settings",
};

export function DashboardShell({
  role,
  navItems,
  pageTitle,
  children,
}: {
  role: Role;
  navItems: NavItem[];
  pageTitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <Wordmark />
            <span className="hidden rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:inline-block">
              {roleLabel[role]}
            </span>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground lg:inline">{pageTitle}</span>
            {role === "CLUB" && <JoinRequestsBell />}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button type="button" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                  }
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem render={<Link href={settingsPathForRole[role]} />}>
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                  >
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="font-heading">{roleLabel[role]}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4">
                  {navItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "rounded-sm px-3 py-2.5 text-sm font-bold uppercase tracking-widest",
                          active ? "text-[#ff2448]" : "text-foreground hover:bg-accent",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</main>
    </div>
  );
}

function JoinRequestsBell() {
  const club = useCurrentClub();
  const { pendingForClub } = useJoinRequests();
  const count = club ? pendingForClub(club.id).length : 0;

  return (
    <Link
      href="/club/dashboard#join-requests"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={count > 0 ? `${count} pending join requests` : "Join requests"}
    >
      <Bell className="h-4 w-4" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff2448] px-1 text-[10px] font-bold leading-none text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
