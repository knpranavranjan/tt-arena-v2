"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCurrentClub } from "@/lib/session-data";
import { useCreatedClubs } from "@/lib/clubs-store";
import { ownsTournament } from "@/lib/tournament-owner";
import { useAllEvents, useAllTournaments } from "@/lib/hosted-tournaments";
import { eventTitle } from "@/lib/tournament-manage";
import { platformHostingFee } from "@/lib/mock-data";
import {
  MembershipSection,
  PaymentHistoryTable,
  PasswordSection,
  SettingsButton,
  SettingsField,
  SettingsSection,
  SettingsTextArea,
  SettingsToggle,
  SupportSection,
  display,
  type PaymentRow,
} from "@/components/settings/settings-ui";

export default function ClubSettingsPage() {
  const { user } = useAuth();
  const club = useCurrentClub();
  const { createdClubs, updateProfile } = useCreatedClubs();
  const allTournaments = useAllTournaments();
  const allEvents = useAllEvents();

  // Profile editing writes to the real club row; the 4 demo logins have no row.
  const editable = !!club && createdClubs.some((c) => c.id === club.id);

  const [form, setForm] = useState(() => toForm(club));
  const [saving, setSaving] = useState(false);

  // Re-seed the form once the club row resolves (it loads async), or if the
  // signed-in club changes. Set-state-during-render is the sanctioned pattern
  // for deriving state from a prop that changes.
  const [seededId, setSeededId] = useState(club?.id);
  if (club && club.id !== seededId) {
    setSeededId(club.id);
    setForm(toForm(club));
  }

  const set = <K extends keyof ClubForm>(key: K, value: ClubForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setFac = <K extends keyof ClubForm["facilities"]>(key: K, value: ClubForm["facilities"][K]) =>
    setForm((f) => ({ ...f, facilities: { ...f.facilities, [key]: value } }));

  const [newTournamentAlerts, setNewTournamentAlerts] = useState(true);
  const [joinRequestAlerts, setJoinRequestAlerts] = useState(true);

  // One hosting-fee line per TOURNAMENT this account created (matched by SPINID
  // `organizerId`) — the fee is paid once per submission, not per category, so
  // fold the category records into their event.
  const paymentRows = useMemo<PaymentRow[]>(() => {
    if (!user) return [];
    const byEvent = new Map<string, { name: string; date: string }>();
    for (const t of allTournaments) {
      if (!ownsTournament(t, user) || byEvent.has(t.eventId)) continue;
      const ev = allEvents.find((e) => e.id === t.eventId);
      byEvent.set(t.eventId, { name: eventTitle(t, ev?.name), date: ev?.date ?? t.date });
    }
    return [...byEvent.entries()]
      .map(([eventId, e]) => ({
        id: `${eventId}-hosting-fee`,
        description: `Hosting fee — ${e.name}`,
        date: e.date,
        amount: platformHostingFee,
        status: "Paid" as const,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user, allTournaments, allEvents]);

  if (!club) return null;

  async function saveProfile() {
    if (!club || !editable) return;
    setSaving(true);
    try {
      await updateProfile(club.id, {
        name: form.name.trim() || club.name,
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        state: form.state.trim() || form.location.trim(),
        address: form.address.trim() || form.location.trim(),
        description: form.description.trim(),
        founded: form.founded.trim() ? Number(form.founded) : undefined,
        aboutHighlights: form.highlights
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        facilities: {
          tableCount: Number(form.facilities.tableCount) || 0,
          tableVarieties: form.facilities.tableVarieties.trim(),
          floorType: form.facilities.floorType.trim(),
          floorGrade: form.facilities.floorGrade.trim(),
          lighting: form.facilities.lighting.trim(),
          seatingCapacity: Number(form.facilities.seatingCapacity) || 0,
          isAirConditioned: form.facilities.isAirConditioned,
          hasWashroom: form.facilities.hasWashroom,
          hasParking: form.facilities.hasParking,
          hasROWater: form.facilities.hasROWater,
        },
      });
      toast.success("Club profile updated", {
        description: "The clubs directory and your club page now show the new details.",
      });
    } catch (err) {
      console.error("club profile save", err);
      toast.error("Couldn't save your club profile. Try again.");
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
        <p className="mt-1 text-sm text-[#8b8b93]">Manage your club profile, security, and notification preferences.</p>
      </div>

      <div className="flex flex-col gap-6">
        <SettingsSection
          title="Club Profile"
          description="Everything here shows on your public club page and the clubs directory — it updates everywhere the moment you save."
        >
          {!editable && (
            <p className="rounded-[4px] border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200/90">
              This is a demo club login — profile editing is available on a real club sign-up.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField label="Club Name" value={form.name} onChange={(e) => set("name", e.target.value)} disabled={!editable} />
            <SettingsField label="Founded (year)" type="number" inputMode="numeric" value={form.founded} onChange={(e) => set("founded", e.target.value)} disabled={!editable} />
            <SettingsField label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={!editable} />
            <SettingsField label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} disabled={!editable} />
            <SettingsField label="Location (City)" value={form.location} onChange={(e) => set("location", e.target.value)} disabled={!editable} />
            <SettingsField label="State" value={form.state} onChange={(e) => set("state", e.target.value)} disabled={!editable} />
          </div>
          <SettingsField label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} disabled={!editable} />
          <SettingsTextArea
            label="About the Club"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={!editable}
          />
          <SettingsTextArea
            label="Highlights (one per line)"
            rows={4}
            placeholder={"State-level coaching\nJunior development squad\nOpen 7 days a week"}
            value={form.highlights}
            onChange={(e) => set("highlights", e.target.value)}
            disabled={!editable}
          />
        </SettingsSection>

        <SettingsSection title="Facilities" description="Shown as the facility grid on your club page.">
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField label="Number of Tables" type="number" inputMode="numeric" value={form.facilities.tableCount} onChange={(e) => setFac("tableCount", e.target.value)} disabled={!editable} />
            <SettingsField label="Table Brands / Varieties" value={form.facilities.tableVarieties} onChange={(e) => setFac("tableVarieties", e.target.value)} disabled={!editable} />
            <SettingsField label="Floor Type" value={form.facilities.floorType} onChange={(e) => setFac("floorType", e.target.value)} disabled={!editable} />
            <SettingsField label="Floor Grade" value={form.facilities.floorGrade} onChange={(e) => setFac("floorGrade", e.target.value)} disabled={!editable} />
            <SettingsField label="Lighting" value={form.facilities.lighting} onChange={(e) => setFac("lighting", e.target.value)} disabled={!editable} />
            <SettingsField label="Spectator Seating Capacity" type="number" inputMode="numeric" value={form.facilities.seatingCapacity} onChange={(e) => setFac("seatingCapacity", e.target.value)} disabled={!editable} />
          </div>
          <SettingsToggle label="Air conditioned" checked={form.facilities.isAirConditioned} onChange={(v) => setFac("isAirConditioned", v)} />
          <SettingsToggle label="Washrooms available" checked={form.facilities.hasWashroom} onChange={(v) => setFac("hasWashroom", v)} />
          <SettingsToggle label="Parking available" checked={form.facilities.hasParking} onChange={(v) => setFac("hasParking", v)} />
          <SettingsToggle label="RO drinking water" checked={form.facilities.hasROWater} onChange={(v) => setFac("hasROWater", v)} />
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
            label="Player join request alerts"
            description="Get notified when a player requests to join your club."
            checked={joinRequestAlerts}
            onChange={setJoinRequestAlerts}
          />
          <SettingsButton onClick={() => toast.success("Preferences saved")}>Save Preferences</SettingsButton>
        </SettingsSection>

        <SettingsSection title="Payment History" description="Hosting fees paid for tournaments you've organized.">
          <PaymentHistoryTable rows={paymentRows} />
        </SettingsSection>

        <SupportSection />
      </div>
    </div>
  );
}

interface ClubForm {
  name: string;
  email: string;
  phone: string;
  founded: string;
  location: string;
  state: string;
  address: string;
  description: string;
  highlights: string;
  facilities: {
    tableCount: string;
    tableVarieties: string;
    floorType: string;
    floorGrade: string;
    lighting: string;
    seatingCapacity: string;
    isAirConditioned: boolean;
    hasWashroom: boolean;
    hasParking: boolean;
    hasROWater: boolean;
  };
}

function toForm(club: ReturnType<typeof useCurrentClub>): ClubForm {
  const f = club?.facilities;
  return {
    name: club?.name ?? "",
    email: club?.email ?? "",
    phone: club?.phone ?? "",
    founded: club?.founded ? String(club.founded) : "",
    location: club?.location ?? "",
    state: club?.state ?? "",
    address: club?.address ?? "",
    description: club?.description ?? "",
    highlights: (club?.aboutHighlights ?? []).join("\n"),
    facilities: {
      tableCount: f?.tableCount ? String(f.tableCount) : "",
      tableVarieties: f?.tableVarieties ?? "",
      floorType: f?.floorType ?? "",
      floorGrade: f?.floorGrade ?? "",
      lighting: f?.lighting ?? "",
      seatingCapacity: f?.seatingCapacity ? String(f.seatingCapacity) : "",
      isAirConditioned: f?.isAirConditioned ?? false,
      hasWashroom: f?.hasWashroom ?? false,
      hasParking: f?.hasParking ?? false,
      hasROWater: f?.hasROWater ?? false,
    },
  };
}
