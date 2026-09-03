"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

const roleOptions: { value: Role; label: string; email: string }[] = [
  { value: "PLAYER", label: "Player", email: "arjun@apexttc.in" },
  { value: "CLUB", label: "Club", email: "contact@apexttc.in" },
  { value: "HOST", label: "Host", email: "ops@ktta.in" },
  { value: "ADMIN", label: "Admin", email: "admin@ttmanagement.app" },
];

// "next" is only honored when it actually belongs to the role being signed in
// as. Landing here as /login?next=/club/dashboard (RequireRole bounced you
// here) but then picking a different tab — say Player — used to still push
// you to /club/dashboard: RequireRole immediately bounces that mismatched
// role straight back to /login?next=/club/dashboard, so submitting looked
// like it did nothing. Falling back to that role's own dashboard breaks the
// loop.
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
  const [role, setRole] = useState<Role>("PLAYER");
  const [email, setEmail] = useState(roleOptions[0].email);
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRoleChange = (next: Role) => {
    setRole(next);
    setEmail(roleOptions.find((r) => r.value === next)?.email ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
    const requestedNext = searchParams.get("next");
    const next =
      requestedNext && requestedNext.startsWith(rolePathPrefix[role])
        ? requestedNext
        : dashboardPathForRole[role];
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
        <div className="mb-8 flex border border-white/10 bg-[#0a0a0a]">
          {roleOptions.map((r, i) => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleRoleChange(r.value)}
              className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-widest transition-colors ${
                i > 0 ? "border-l border-white/10" : ""
              } ${role === r.value ? "bg-[#ff2448] text-white" : "text-[#8b8b93] hover:text-white"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
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

          <div className="pt-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-[#ff2448] py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#e01f3f]"
            >
              Sign in as {roleOptions.find((r) => r.value === role)?.label}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-[#5a5a60]">
          Demo mode — pick a role to preview each portal.
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
