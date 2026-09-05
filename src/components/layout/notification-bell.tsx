"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  CircleCheck,
  CreditCard,
  Inbox,
  Trophy,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { timeAgo, useNotifications, type AppNotification } from "@/lib/notifications";

const toneRing: Record<AppNotification["tone"], string> = {
  info: "text-[#7aa2ff] bg-[#7aa2ff]/12",
  success: "text-emerald-400 bg-emerald-500/12",
  warn: "text-amber-300 bg-amber-400/12",
  danger: "text-[#ff8f86] bg-[#ff2448]/12",
};

function iconFor(n: AppNotification) {
  if (n.category === "payment") return CreditCard;
  if (n.category === "request") return UserPlus;
  if (n.category === "result") return Trophy;
  if (n.category === "status") return CircleCheck;
  return CalendarClock;
}

export function NotificationBell() {
  const { items, isRead, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff2448] px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[12px] border border-white/10 bg-[#131417] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#c2c6d7]" style={{ fontFamily: "var(--font-home-mono)" }}>
                Notifications
              </span>
              {items.length > 0 && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#ff8f86] transition-colors hover:text-[#ff2448]"
                  style={{ fontFamily: "var(--font-home-mono)" }}
                >
                  <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
                  Mark all read
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <Inbox className="h-6 w-6 text-[#5a5a62]" strokeWidth={1.75} />
                <p className="text-xs text-[#8b8b93]">You&apos;re all caught up.</p>
              </div>
            ) : (
              <ul className="max-h-[420px] divide-y divide-white/[0.06] overflow-y-auto">
                {items.map((n) => {
                  const Icon = iconFor(n);
                  const read = isRead(n.id);
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={() => {
                          markRead(n.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]",
                          !read && "bg-[#ff2448]/[0.04]",
                        )}
                      >
                        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", toneRing[n.tone])}>
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-semibold text-[#e8e8ee]">{n.title}</span>
                            {!read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff2448]" />}
                            <span className="ml-auto shrink-0 text-[10px] tabular-nums text-[#6f6f78]">
                              {timeAgo(n.ts)}
                            </span>
                          </span>
                          {n.body && (
                            <span className="mt-0.5 block text-[12px] leading-snug text-[#9a9aa2]">{n.body}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
