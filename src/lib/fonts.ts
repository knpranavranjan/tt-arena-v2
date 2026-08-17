import { Anton, Anybody, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

// Shared across every "arena" redesigned public page (home, players, ...) so the
// typography is declared once instead of re-loaded per route. Scoped via CSS
// variables — apply the `.variable` classes to a page's root element, the rest
// of the site (dashboards, auth, etc.) keeps the Inter/Barlow Condensed system
// from the root layout untouched.
export const anybody = Anybody({
  variable: "--font-home-display",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

export const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-home-body",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const jetBrainsMono = JetBrains_Mono({
  variable: "--font-home-mono",
  weight: ["600"],
  subsets: ["latin"],
});

export const arenaFontVariables = `${anybody.variable} ${hankenGrotesk.variable} ${jetBrainsMono.variable}`;

// Auth pages (login/register) use Anton for display headlines instead of
// Anybody — reuses the same Hanken Grotesk body font as the rest of the site.
export const anton = Anton({
  variable: "--font-auth-display",
  weight: "400",
  subsets: ["latin"],
});

export const authFontVariables = `${anton.variable} ${hankenGrotesk.variable}`;
