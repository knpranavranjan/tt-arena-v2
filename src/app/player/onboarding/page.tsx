"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCurrentPlayer } from "@/lib/session-data";
import { useCreatedPlayers } from "@/lib/players-store";
import { USE_DB } from "@/lib/data-backend";
import {
  ageFromDob,
  categoryForAge,
  type SkillLevel,
} from "@/lib/player-profile";
import type { Gender } from "@/lib/types";

const fieldClass =
  "w-full rounded-none border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white transition-colors focus:border-[#ff2448] focus:outline-none";
const labelClass = "block text-xs font-semibold uppercase tracking-widest text-[#8b8b93]";
const display = { fontFamily: "var(--font-home-display)" };

const skillLevels: SkillLevel[] = ["Beginner", "Intermediate", "Advanced", "Pro"];

export default function PlayerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const player = useCurrentPlayer();
  const { createLocalPlayer, updateProfile, upsertCreatedPlayer } = useCreatedPlayers();

  // Seed the form from anything already on the profile (usually nothing —
  // that's why they're here). Lazy initialisers so there's no effect churn.
  const [dob, setDob] = useState(() => player?.dateOfBirth ?? "");
  const [gender, setGender] = useState<Gender | "">(
    () => (player?.gender as Gender | undefined) ?? "",
  );
  const [location, setLocation] = useState(() => player?.state ?? "");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [saving, setSaving] = useState(false);

  // Already complete — bounce to the dashboard.
  const complete = player && "profileComplete" in player && player.profileComplete;
  useEffect(() => {
    if (complete) router.replace("/player/dashboard");
  }, [complete, router]);

  const previewCategory = useMemo(
    () => (dob ? categoryForAge(ageFromDob(dob)) : null),
    [dob],
  );

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob || !gender || !location.trim()) {
      toast.error("Date of birth, gender and location are all required.");
      return;
    }
    setSaving(true);
    const input = {
      dateOfBirth: dob,
      gender: gender || undefined,
      state: location,
      skillLevel: skillLevel || undefined,
    };
    try {
      const linkedId = user.linkedId ?? player?.id;

      if (player) {
        await updateProfile(player.id, input);
      } else if (!USE_DB) {
        // localStorage mode with no row yet — create it from the session.
        createLocalPlayer({ spinId: user.uniqueId, name: user.name, input });
      } else {
        // DB mode, row somehow missing — create then it's complete.
        const created = await fetch("/api/players", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ spinId: user.uniqueId, name: user.name, profile: input }),
        }).then((r) => r.json());
        if (created?.id) upsertCreatedPlayer(created);
      }

      toast.success("Profile complete — welcome to the arena.");
      router.replace("/player/dashboard");
      void linkedId;
    } catch (err) {
      console.error("onboarding save", err);
      toast.error("Couldn't save your profile. Try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="-m-4 min-h-full bg-[#0c0c0c] p-4 sm:-m-6 sm:p-6"
      style={{ fontFamily: "var(--font-home-body)" }}
    >
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff2448]">
            One more step
          </p>
          <h1
            className="text-3xl font-bold uppercase tracking-tight text-[#e2e2e8] sm:text-4xl"
            style={display}
          >
            Set up your player profile
          </h1>
          <p className="mt-2 text-sm text-[#8b8b93]">
            Your rating, category and rankings are built from these. You can refine
            them later in Settings.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 border border-white/10 bg-[#0e0e0e] p-6 shadow-2xl sm:p-8"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="dob" className={labelClass}>
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={`${fieldClass} [color-scheme:dark]`}
              />
              {previewCategory && (
                <p className="text-[11px] text-[#5a5a60]">
                  Category: <span className="text-[#ff8f86]">{previewCategory}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="gender" className={labelClass}>
                Gender
              </label>
              <select
                id="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className={`${fieldClass} appearance-none`}
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className={labelClass}>
              Location
            </label>
            <input
              id="location"
              type="text"
              required
              placeholder="City, State"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`${fieldClass} placeholder:text-[#5a5a60]`}
            />
            <p className="text-[11px] text-[#5a5a60]">
              We use the state for regional rankings.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="skill" className={labelClass}>
              Skill Level <span className="text-[#5a5a60]">(optional)</span>
            </label>
            <select
              id="skill"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
              className={`${fieldClass} appearance-none`}
            >
              <option value="">Prefer not to say</option>
              {skillLevels.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#5a5a60]">
              Sets your provisional starting rating until you play rated matches.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 bg-[#ff2448] py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#e01f3f] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Enter the arena"}
          </button>
        </form>
      </div>
    </div>
  );
}
