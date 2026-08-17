"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import type { Category, Gender, Role } from "@/lib/types";

const roleOptions: { value: Role; label: string }[] = [
  { value: "PLAYER", label: "Player" },
  { value: "CLUB", label: "Club" },
  { value: "HOST", label: "Tournament Host" },
];

const categories: Category[] = ["Under 13", "Under 17", "Under 21", "Senior", "Veteran (40+)"];

const fieldClass =
  "w-full rounded-none border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white transition-colors focus:border-[#ff2448] focus:outline-none";
const labelClass = "block text-xs font-semibold uppercase tracking-widest text-[#8b8b93]";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("PLAYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [category, setCategory] = useState<Category | "">("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
    router.push(dashboardPathForRole[role]);
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff2448]">Create Account</h3>
        <h1 className="text-4xl uppercase tracking-tight text-white sm:text-5xl" style={{ fontFamily: "var(--font-auth-display)" }}>
          Join SpinTTRatings.
        </h1>
      </div>

      <div className="w-full border border-white/10 bg-[#0e0e0e] p-8 shadow-2xl md:p-10">
        <div className="mb-8 flex border border-white/10 bg-[#0a0a0a]">
          {roleOptions.map((r, i) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-widest leading-tight transition-colors ${
                i > 0 ? "border-l border-white/10" : ""
              } ${role === r.value ? "bg-[#ff2448] text-white" : "text-[#8b8b93] hover:text-white"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className={labelClass}>Full Name</label>
            <input id="fullName" required type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="email" className={labelClass}>Email</label>
              <input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="dob" className={labelClass}>Date of Birth</label>
              <input id="dob" required type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={`${fieldClass} [color-scheme:dark]`} />
            </div>
            <div className="space-y-2">
              <label htmlFor="gender" className={labelClass}>Gender</label>
              <select
                id="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className={`${fieldClass} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27white%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[position:right_1rem_center] bg-no-repeat`}
              >
                <option value="" disabled>Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          {role === "PLAYER" && (
            <div className="space-y-2">
              <label htmlFor="category" className={labelClass}>Category</label>
              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={`${fieldClass} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27white%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3e%3cpolyline%20points=%276%209%2012%2015%2018%209%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[position:right_1rem_center] bg-no-repeat`}
              >
                <option value="" disabled>Select</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="location" className={labelClass}>Location</label>
            <input
              id="location"
              required
              type="text"
              placeholder="City, State"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`${fieldClass} placeholder:text-[#5a5a60]`}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              required
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-[#ff2448] py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#e01f3f]"
            >
              Create Account
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-[#5a5a60]">
          Demo mode — this creates a preview session, not a real account.
        </p>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#8b8b93]">
            Already have an account?{" "}
            <Link href="/login" className="ml-1 text-sm font-bold uppercase tracking-widest text-[#ff2448] transition-colors hover:text-[#ff8f86]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
