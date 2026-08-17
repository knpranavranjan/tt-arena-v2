"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, Table2, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
          <Link href={navItems[0]?.href ?? "/"} className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Table2 className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="hidden font-heading text-sm font-semibold text-foreground sm:inline">
              {roleLabel[role]}
            </span>
          </Link>

          <nav className="ml-2 flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium tracking-wide transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">{pageTitle}</span>
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
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</main>
    </div>
  );
}
