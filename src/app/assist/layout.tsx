"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Wordmark } from "@/components/layout/public-header";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

/**
 * Slim shell for assistants — any role. It deliberately carries no portal nav:
 * an assistant sees only the Matches console for tournaments a host has shared
 * with them, nothing else.
 */
export default function AssistLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/assist");
  }, [isLoading, user, router]);

  if (isLoading) return <div className="flex-1" />;
  if (!user) return null;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <Wordmark />
            <Link
              href="/assist"
              className="hidden rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              Match Assistant
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                }
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</main>
    </div>
  );
}
