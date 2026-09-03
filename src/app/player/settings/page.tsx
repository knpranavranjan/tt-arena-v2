"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useCurrentPlayer } from "@/lib/session-data";
import { useRegistrations } from "@/lib/registrations";
import { tournaments } from "@/lib/mock-data";
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
  type PaymentRow,
} from "@/components/settings/settings-ui";

export default function PlayerSettingsPage() {
  const { user } = useAuth();
  const player = useCurrentPlayer();
  const { registrations } = useRegistrations();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [newTournamentAlerts, setNewTournamentAlerts] = useState(true);
  const [resultsUpdates, setResultsUpdates] = useState(true);

  const paymentRows = useMemo<PaymentRow[]>(() => {
    if (!player) return [];
    const rows: PaymentRow[] = [];
    for (const t of tournaments) {
      if (t.registeredPlayerIds.includes(player.id)) {
        rows.push({ id: `${t.id}-seed`, description: t.name, date: t.date, amount: t.entryFee, status: "Paid" });
      }
    }
    for (const r of registrations) {
      if (r.playerId !== player.id) continue;
      const t = tournaments.find((x) => x.id === r.tournamentId);
      if (!t || t.registeredPlayerIds.includes(player.id)) continue;
      rows.push({
        id: r.id,
        description: t.name,
        date: r.createdAt,
        amount: t.entryFee,
        status: r.status === "REGISTERED" ? "Paid" : "Pending",
      });
    }
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [player, registrations]);

  if (!user) return null;

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }} className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#8b8b93]">Manage your profile, security, and notification preferences.</p>
      </div>

      <div className="flex flex-col gap-6">
        <SettingsSection title="Profile" description="Your name and email as they appear across the platform.">
          <SettingsField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <SettingsField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <SettingsButton onClick={() => toast.success("Profile updated")}>Save Profile</SettingsButton>
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

        <SettingsSection title="Payment History" description="Entry fees you've paid for tournaments.">
          <PaymentHistoryTable rows={paymentRows} />
        </SettingsSection>

        <SupportSection />
      </div>
    </div>
  );
}
