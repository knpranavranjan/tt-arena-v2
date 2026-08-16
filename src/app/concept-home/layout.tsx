import type { Metadata } from "next";
import Link from "next/link";
import { Russo_One, Chakra_Petch } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import { SmoothScrollProvider } from "@/components/concept-home/smooth-scroll-provider";

const russoOne = Russo_One({
  variable: "--font-concept-display",
  weight: "400",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-concept-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpinTT — Alt Concept",
  description: "Alternate home page design concept for comparison.",
};

export default function ConceptHomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${russoOne.variable} ${chakraPetch.variable} min-h-screen bg-[#0a0a0f] text-[#f5f5f7] antialiased`}
      style={{ fontFamily: "var(--font-concept-body)" }}
    >
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-white/10 bg-black/90 px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.15em] text-white/70 backdrop-blur">
        <span className="rounded-sm bg-[#147dff] px-1.5 py-0.5 text-[10px] font-bold text-white">
          Concept
        </span>
        Alternate home page direction — for comparison only, not linked in nav
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-white underline underline-offset-2 hover:text-[#147dff]"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2} />
          Back to live site
        </Link>
      </div>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </div>
  );
}
