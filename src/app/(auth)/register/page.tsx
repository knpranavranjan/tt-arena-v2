"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import { USE_DB } from "@/lib/data-backend";
import { useCreatedPlayers } from "@/lib/players-store";
import { useCreatedClubs } from "@/lib/clubs-store";
import {
  ClubLocationPicker,
  DEFAULT_CLUB_LOCATION,
  type ClubLocation,
} from "@/components/auth/club-location-picker";
import type { Gender, Role } from "@/lib/types";

const roleOptions: { value: Role; label: string }[] = [
  { value: "PLAYER", label: "Player" },
  { value: "CLUB", label: "Club" },
  { value: "HOST", label: "Tournament Host" },
];

type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Pro";

const skillLevels: { value: SkillLevel; description: string }[] = [
  { value: "Beginner", description: "Learning basic strokes and rules." },
  { value: "Intermediate", description: "Consistent gameplay and knows spin control." },
  {
    value: "Advanced",
    description:
      "Tactical play with custom rubbers. For players participating in district, state level tournaments.",
  },
  {
    value: "Pro",
    description:
      "For players participating in high-level tournaments (state, nationals, and international).",
  },
];

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
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [skillOpen, setSkillOpen] = useState(false);
  const skillRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState("");
  const [clubLocation, setClubLocation] = useState<ClubLocation>(DEFAULT_CLUB_LOCATION);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ uniqueId: string; role: Role } | null>(null);
  const { register } = useAuth();
  const { createLocalPlayer } = useCreatedPlayers();
  const { createLocalClub } = useCreatedClubs();
  const router = useRouter();

  // Close the skill-level listbox on outside click / Escape.
  useEffect(() => {
    if (!skillOpen) return;
    const onDown = (e: MouseEvent) => {
      if (skillRef.current && !skillRef.current.contains(e.target as Node)) setSkillOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSkillOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [skillOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === "PLAYER" && (!dob || !gender)) {
      setError("Date of birth and gender are required to set up your player profile.");
      return;
    }

    const playerProfile =
      role === "PLAYER"
        ? {
            dateOfBirth: dob,
            gender: gender || undefined,
            state: location,
            phone: phone || undefined,
            skillLevel: skillLevel || undefined,
          }
        : undefined;
    const clubProfileInput =
      role === "CLUB"
        ? {
            location,
            address: location,
            state: location,
            phone: phone || undefined,
            coordinates:
              clubLocation.mode === "current"
                ? { lat: Number(clubLocation.lat) || 0, lng: Number(clubLocation.lng) || 0 }
                : undefined,
          }
        : undefined;

    const res = await register({ name, password, role, email, profile: playerProfile, clubProfile: clubProfileInput });
    if (!res.ok) {
      setError(res.error);
      return;
    }

    // localStorage mode: the DB path already created the profile row server-side.
    if (!USE_DB && role === "PLAYER") {
      createLocalPlayer({ spinId: res.uniqueId, name, input: playerProfile });
    }
    if (!USE_DB && role === "CLUB") {
      createLocalClub({ spinId: res.uniqueId, name, input: clubProfileInput });
    }

    setDone({ uniqueId: res.uniqueId, role: res.role });
  };

  if (done) {
    return (
      <div>
        <div className="mb-8 text-center">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff2448]">Account Created</h3>
          <h1 className="text-4xl uppercase tracking-tight text-white sm:text-5xl" style={{ fontFamily: "var(--font-auth-display)" }}>
            You&apos;re In.
          </h1>
        </div>

        <div className="w-full border border-white/10 bg-[#0e0e0e] p-8 text-center shadow-2xl md:p-10">
          <p className={labelClass}>Your SPINID</p>
          <p className="mt-3 text-5xl font-extrabold tracking-tight text-[#ff2448]" style={{ fontFamily: "var(--font-auth-display)" }}>
            {done.uniqueId}
          </p>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[#8b8b93]">
            This is your permanent ID — the system assigned it. Sign in from now on with
            this SPINID <span className="text-[#c2c6d7]">or your email</span>, plus your password.
          </p>
          <button
            type="button"
            onClick={() => router.push(dashboardPathForRole[done.role])}
            className="mt-8 flex w-full items-center justify-center gap-2 bg-[#ff2448] py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#e01f3f]"
          >
            Continue to dashboard
          </button>
        </div>
      </div>
    );
  }

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
          <div className="border border-white/10 bg-[#0a0a0a] px-4 py-3">
            <p className="text-[11px] leading-relaxed text-[#8b8b93]">
              A unique <span className="font-semibold text-[#ff8f86]">SPINID</span> is issued
              automatically on sign-up — <span className="text-[#c2c6d7]">SRP##</span> player,{" "}
              <span className="text-[#c2c6d7]">SRC##</span> club,{" "}
              <span className="text-[#c2c6d7]">SRH##</span> host. It&apos;s permanent and is what
              you sign in with.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="fullName" className={labelClass}>Full Name</label>
            <input id="fullName" required type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            <p className="text-[11px] text-[#5a5a60]">Shown on your dashboard. Two people can share the same name.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
            </div>
          </div>
          <p className="-mt-3 text-[11px] text-[#5a5a60]">
            One account per email. To register for another role, use a different email.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="dob" className={labelClass}>Date of Birth</label>
              <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={`${fieldClass} [color-scheme:dark]`} />
            </div>
            <div className="space-y-2">
              <label htmlFor="gender" className={labelClass}>Gender</label>
              <select
                id="gender"
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
              <label htmlFor="skillLevel" className={labelClass}>Skill Level</label>
              <div ref={skillRef} className="relative">
                <button
                  id="skillLevel"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={skillOpen}
                  onClick={() => setSkillOpen((v) => !v)}
                  className={`${fieldClass} flex items-center justify-between gap-3 text-left ${
                    skillLevel ? "text-white" : "text-[#5a5a60]"
                  } ${skillOpen ? "border-[#ff2448]" : ""}`}
                >
                  <span>{skillLevel || "Select"}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 shrink-0 transition-transform ${skillOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {skillOpen && (
                  <ul
                    role="listbox"
                    aria-label="Skill level"
                    className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto border border-white/10 bg-[#0a0a0a] shadow-2xl"
                  >
                    {skillLevels.map((s) => {
                      const active = skillLevel === s.value;
                      return (
                        <li key={s.value} role="option" aria-selected={active}>
                          <button
                            type="button"
                            onClick={() => {
                              setSkillLevel(s.value);
                              setSkillOpen(false);
                            }}
                            className={`block w-full border-b border-white/5 px-4 py-3 text-left text-[13px] leading-snug transition-colors last:border-b-0 ${
                              active
                                ? "bg-[#ff2448]/15 text-white"
                                : "text-[#8b8b93] hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span className="font-semibold text-white">{s.value}:</span> {s.description}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="location" className={labelClass}>
              {role === "CLUB" ? "Club Address" : "Location"}
            </label>
            <input
              id="location"
              type="text"
              placeholder={role === "CLUB" ? "Street, area, city, state, PIN" : "City, State"}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`${fieldClass} placeholder:text-[#5a5a60]`}
            />
          </div>

          {role === "CLUB" && (
            <ClubLocationPicker value={clubLocation} onChange={setClubLocation} address={location} />
          )}

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
              Create Account
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-[#5a5a60]">
          Demo mode — the account is saved in this browser only.
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
