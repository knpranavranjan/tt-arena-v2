"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCurrentPlayer } from "@/lib/session-data";
import { useCreatedPlayers } from "@/lib/players-store";
import { useRegistrations } from "@/lib/registrations";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { eventTitle } from "@/lib/tournament-manage";
import {
  MembershipSection,
  PaymentHistoryTable,
  PasswordSection,
  SettingsButton,
  SettingsField,
  SettingsSection,
  SettingsToggle,
  SupportSection,
  display,
  mono,
  type PaymentRow,
} from "@/components/settings/settings-ui";

const skillLevels = ["Beginner", "Intermediate", "Advanced", "Pro"];

export default function PlayerSettingsPage() {
  const { user } = useAuth();
  const player = useCurrentPlayer();
  const { createdPlayers, updateProfile } = useCreatedPlayers();
  const { registrations } = useRegistrations();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();

  const editable = !!player && createdPlayers.some((p) => p.id === player.id);

  const [form, setForm] = useState(() => toForm(player));
  const [saving, setSaving] = useState(false);

  // Re-seed once the profile row resolves (loads async) or the account changes.
  const [seededId, setSeededId] = useState(player?.id);
  if (player && player.id !== seededId) {
    setSeededId(player.id);
    setForm(toForm(player));
  }

  const set = <K extends keyof PlayerForm>(key: K, value: PlayerForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [newTournamentAlerts, setNewTournamentAlerts] = useState(true);
  const [resultsUpdates, setResultsUpdates] = useState(true);

  // One row per EVENT the player paid an entry fee for — the fee is the sum
  // across every category they entered, never one line per category.
  const paymentRows = useMemo<PaymentRow[]>(() => {
    if (!player) return [];
    type Acc = { name: string; date: string; amount: number; anyPending: boolean };
    const byEvent = new Map<string, Acc>();

    const add = (eventId: string, name: string, date: string, fee: number, pending: boolean) => {
      const cur = byEvent.get(eventId);
      if (!cur) {
        byEvent.set(eventId, { name, date, amount: fee, anyPending: pending });
        return;
      }
      cur.amount += fee;
      cur.anyPending = cur.anyPending || pending;
      if (new Date(date).getTime() < new Date(cur.date).getTime()) cur.date = date;
    };

    // Seed roster memberships (demo players)
    for (const t of allTournaments) {
      if (!t.registeredPlayerIds.includes(player.id)) continue;
      const ev = allEvents.find((e) => e.id === t.eventId);
      add(t.eventId, eventTitle(t, ev?.name), ev?.date ?? t.date, t.entryFee, false);
    }
    // Live registrations from the public "Register Now" flow
    for (const r of registrations) {
      if (r.playerId !== player.id) continue;
      const t = allTournaments.find((x) => x.id === r.tournamentId);
      if (!t || t.registeredPlayerIds.includes(player.id)) continue;
      const ev = allEvents.find((e) => e.id === t.eventId);
      add(t.eventId, eventTitle(t, ev?.name), r.createdAt, t.entryFee, r.status !== "REGISTERED");
    }

    return [...byEvent.entries()]
      .map(([eventId, a]) => ({
        id: eventId,
        description: a.name,
        date: a.date,
        amount: a.amount,
        status: a.anyPending ? ("Pending" as const) : ("Paid" as const),
      }))
      .sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
  }, [player, registrations, allTournaments, allEvents]);

  if (!user) return null;

  async function saveProfile() {
    if (!player || !editable) return;
    setSaving(true);
    try {
      await updateProfile(player.id, {
        name: form.name.trim() || player.name,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender === "FEMALE" ? "FEMALE" : "MALE",
        state: form.state.trim(),
        phone: form.phone.trim(),
        skillLevel: form.skillLevel || undefined,
      });
      toast.success("Profile updated", {
        description: "Your dashboard, public player page and the players list now show the new details.",
      });
    } catch (err) {
      console.error("player profile save", err);
      toast.error("Couldn't save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }} className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#8b8b93]">Manage your profile, security, and notification preferences.</p>
      </div>

      <div className="flex flex-col gap-6">
        <SettingsSection
          title="Profile"
          description="Everything here shows on your dashboard, your public player page and the players list — it updates everywhere the moment you save."
        >
          {!editable && (
            <p className="rounded-[4px] border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200/90">
              This is a demo player login — profile editing is available on a real player sign-up.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField label="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} disabled={!editable} />
            <SettingsField label="Email" type="email" value={user.email ?? ""} disabled title="Email is managed on your account." />
            <SettingsField label="Date of Birth" type="date" className="[color-scheme:dark]" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} disabled={!editable} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
                Gender
              </span>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                disabled={!editable}
                className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448] disabled:opacity-50"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </label>
            <SettingsField label="State (City, State)" value={form.state} onChange={(e) => set("state", e.target.value)} disabled={!editable} />
            <SettingsField label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} disabled={!editable} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b93]" style={mono}>
                Skill Level
              </span>
              <select
                value={form.skillLevel}
                onChange={(e) => set("skillLevel", e.target.value)}
                disabled={!editable}
                className="w-full rounded-[4px] border border-white/10 bg-[#1a1c20] px-4 py-3 text-sm text-[#e2e2e8] focus:border-[#ff2448] focus:outline-none focus:ring-1 focus:ring-[#ff2448] disabled:opacity-50"
              >
                <option value="">Not set</option>
                {skillLevels.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-[#5a5a60]">
            Your age bracket is derived from your date of birth. Your rating starts from your skill level and then
            tracks your published tournament results.
          </p>
          <SettingsButton onClick={saveProfile} disabled={!editable || saving}>
            {saving ? "Saving…" : "Save Profile"}
          </SettingsButton>
        </SettingsSection>

        <MembershipSection />

        <PasswordSection />

        <SettingsSection title="Notifications" description="Choose what you want to hear about.">
          <SettingsToggle
            label="New tournament alerts"
            description="Get notified when a new tournament opens for registration."
            checked={newTournamentAlerts}
            onChange={setNewTournamentAlerts}
          />
          <SettingsToggle
            label="Tournament updates & results"
            description="Registration confirmations, deadline reminders, and results."
            checked={resultsUpdates}
            onChange={setResultsUpdates}
          />
          <SettingsButton onClick={() => toast.success("Preferences saved")}>Save Preferences</SettingsButton>
        </SettingsSection>

        <SettingsSection title="Payment History" description="Entry fees you've paid — one line per tournament, totalled across its categories.">
          <PaymentHistoryTable rows={paymentRows} />
        </SettingsSection>

        <SupportSection />
      </div>
    </div>
  );
}

interface PlayerForm {
  name: string;
  dateOfBirth: string;
  gender: string;
  state: string;
  phone: string;
  skillLevel: string;
}

function toForm(player: ReturnType<typeof useCurrentPlayer>): PlayerForm {
  return {
    name: player?.name ?? "",
    dateOfBirth: player?.dateOfBirth ?? "",
    gender: player?.gender ?? "MALE",
    state: player?.state ?? "",
    phone: (player && "phone" in player ? player.phone : "") ?? "",
    skillLevel: (player && "skillLevel" in player ? player.skillLevel : "") ?? "",
  };
}
