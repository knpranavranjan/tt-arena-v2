"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

// "next" is only honoured when it belongs to the role the account signs in as,
// otherwise RequireRole would bounce straight back here.
const rolePathPrefix: Record<Role, string> = {
  PLAYER: "/player",
  CLUB: "/club",
  HOST: "/host",
  ADMIN: "/admin",
};

const fieldClass =
  "w-full rounded-none border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white transition-colors focus:border-[#ff2448] focus:outline-none";
const labelClass = "block text-xs font-semibold uppercase tracking-widest text-[#8b8b93]";

function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await signIn({ identifier, password });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const requestedNext = searchParams.get("next");
    const next =
      requestedNext && requestedNext.startsWith(rolePathPrefix[res.role])
        ? requestedNext
        : dashboardPathForRole[res.role];
    router.push(next);
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff2448]">Sign In</h3>
        <h1 className="text-4xl uppercase tracking-tight text-white sm:text-5xl" style={{ fontFamily: "var(--font-auth-display)" }}>
          Welcome Back.
        </h1>
      </div>

      <div className="w-full border border-white/10 bg-[#0e0e0e] p-8 shadow-2xl md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="identifier" className={labelClass}>Email or SPINID</label>
            <input
              id="identifier"
              required
              type="text"
              autoComplete="username"
              placeholder="you@email.com or SRP01"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={`${fieldClass} placeholder:text-[#5a5a60]`}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              required
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${fieldClass} placeholder:text-[#5a5a60]`}
            />
          </div>

          {error && (
            <p className="border border-[#ff2448]/40 bg-[#ff2448]/10 px-4 py-3 text-xs font-medium text-[#ff8f86]">
              {error}
            </p>
          )}

          <div className="pt-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-[#ff2448] py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#e01f3f]"
            >
              Sign in
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs leading-relaxed text-[#5a5a60]">
          Demo logins — <span className="text-[#8b8b93]">SRP01 / player</span> ·{" "}
          <span className="text-[#8b8b93]">SRC01 / club</span> ·{" "}
          <span className="text-[#8b8b93]">SRH01 / host</span> ·{" "}
          <span className="text-[#8b8b93]">SRA01 / admin</span>
        </p>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#8b8b93]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="ml-1 text-sm font-bold uppercase tracking-widest text-[#ff2448] transition-colors hover:text-[#ff8f86]">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
