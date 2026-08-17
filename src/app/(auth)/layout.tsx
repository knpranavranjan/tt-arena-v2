import Image from "next/image";
import { PublicHeader } from "@/components/layout/public-header";
import { authFontVariables } from "@/lib/fonts";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`flex min-h-full flex-1 flex-col bg-[#0c0c0c] ${authFontVariables}`} style={{ fontFamily: "var(--font-home-body)" }}>
      <PublicHeader />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
        <div className="absolute inset-0 z-0 opacity-10" aria-hidden="true">
          <Image
            src="/signup/signup.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/80 to-transparent" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
