"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Routes that own their own page-end treatment and don't want the shared footer.
const HIDDEN_ON = ["/players"];

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/", label: "Overview" },
      { href: "/players", label: "Players" },
      { href: "/clubs", label: "Clubs" },
      { href: "/events", label: "Events" },
      { href: "/#rankings", label: "Rankings" },
    ],
  },
  {
    title: "Organizers",
    links: [
      { href: "/host-tournament", label: "Host a Tournament" },
      { href: "/tournaments", label: "Tournament Management" },
      { href: "/events", label: "Events" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "About" },
      { href: "#", label: "Contact" },
    ],
  },
];

const social = [
  { mark: "X", label: "X (Twitter)" },
  { mark: "IG", label: "Instagram" },
  { mark: "YT", label: "YouTube" },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
      <span className="relative flex h-7 w-7 items-center justify-center rounded-sm border border-primary/40 bg-primary/10">
        <span className="h-2.5 w-2.5 rounded-[1px] bg-primary" />
      </span>
      <span className="text-foreground">
        Spin<span className="text-primary">TT</span>Ratings
      </span>
    </Link>
  );
}

export function PublicFooter() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <footer className="border-t border-border bg-arena-depth">
      <div className="grid w-full gap-10 px-6 py-14 sm:px-10 lg:px-16 xl:px-20 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-3 text-base text-muted-foreground">Rated on talent.</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{col.title}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-base text-secondary-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-6 py-5 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SpinTTRatings. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {social.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {s.mark}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
