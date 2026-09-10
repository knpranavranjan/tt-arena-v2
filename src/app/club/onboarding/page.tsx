"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCurrentClub } from "@/lib/session-data";
import { useCreatedClubs } from "@/lib/clubs-store";
import { USE_DB } from "@/lib/data-backend";

const fieldClass =
  "w-full rounded-none border border-white/10 bg-[#0a0a0a] px-4 py-3 text-white transition-colors focus:border-[#ff2448] focus:outline-none";
const labelClass = "block text-xs font-semibold uppercase tracking-widest text-[#8b8b93]";
const display = { fontFamily: "var(--font-home-display)" };

const currentYear = new Date().getFullYear();

export default function ClubOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const club = useCurrentClub();
  const { createLocalClub, updateProfile, upsertCreatedClub } = useCreatedClubs();

  const [location, setLocation] = useState(() => club?.location ?? "");
  const [founded, setFounded] = useState(() => (club?.founded ? String(club.founded) : ""));
  const [description, setDescription] = useState(() => club?.description ?? "");
  const [saving, setSaving] = useState(false);

  const complete = club && "profileComplete" in club && club.profileComplete;
  useEffect(() => {
    if (complete) router.replace("/club/dashboard");
  }, [complete, router]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const year = Number(founded);
    if (!location.trim() || !Number.isFinite(year) || year < 1900 || year > currentYear) {
      toast.error("Enter a location and a valid founding year.");
      return;
    }
    setSaving(true);
    const input = { location, address: location, state: location, founded: year, description };
    try {
      if (club) {
        await updateProfile(club.id, input);
      } else if (!USE_DB) {
        createLocalClub({ spinId: user.uniqueId, name: user.name, input });
      } else {
        const created = await fetch("/api/clubs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ spinId: user.uniqueId, name: user.name, profile: input }),
        }).then((r) => r.json());
        if (created?.id) upsertCreatedClub(created);
      }
      toast.success("Club profile complete.");
      router.replace("/club/dashboard");
    } catch (err) {
      console.error("club onboarding save", err);
      toast.error("Couldn't save your club profile. Try again.");
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
            Set up your club profile
          </h1>
          <p className="mt-2 text-sm text-[#8b8b93]">
            Players see this on your club page. You can add facilities and more later in Settings.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 border border-white/10 bg-[#0e0e0e] p-6 shadow-2xl sm:p-8"
        >
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
          </div>

          <div className="space-y-2">
            <label htmlFor="founded" className={labelClass}>
              Founded (year)
            </label>
            <input
              id="founded"
              type="number"
              required
              min={1900}
              max={currentYear}
              placeholder="e.g. 2014"
              value={founded}
              onChange={(e) => setFounded(e.target.value)}
              className={`${fieldClass} [color-scheme:dark] placeholder:text-[#5a5a60]`}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className={labelClass}>
              About the club <span className="text-[#5a5a60]">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="A line or two about your club, coaching, and facilities."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${fieldClass} placeholder:text-[#5a5a60]`}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 bg-[#ff2448] py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#e01f3f] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Enter the portal"}
          </button>
        </form>
      </div>
    </div>
  );
}
