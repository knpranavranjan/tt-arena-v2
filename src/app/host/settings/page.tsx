"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ownsTournament } from "@/lib/tournament-owner";
import { useAllTournaments } from "@/lib/hosted-tournaments";
import { platformHostingFee } from "@/lib/mock-data";
import {
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

export default function HostSettingsPage() {
  const { user } = useAuth();
  const allTournaments = useAllTournaments();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [newTournamentAlerts, setNewTournamentAlerts] = useState(true);
  const [registrationUpdates, setRegistrationUpdates] = useState(true);

  // One hosting-fee line per tournament this account created — matched by
  // SPINID (`organizerId`), never the display name.
  const paymentRows = useMemo<PaymentRow[]>(() => {
    if (!user) return [];
    return allTournaments
      .filter((t) => ownsTournament(t, user))
      .map((t) => ({
        id: `${t.id}-hosting-fee`,
        description: `Hosting fee — ${t.name}`,
        date: t.date,
        amount: platformHostingFee,
        status: "Paid" as const,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user, allTournaments]);

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

        <PasswordSection />

        <SettingsSection title="Notifications" description="Choose what you want to hear about.">
          <SettingsToggle
            label="New tournament alerts"
            description="Get notified when a new tournament opens for registration."
            checked={newTournamentAlerts}
            onChange={setNewTournamentAlerts}
          />
          <SettingsToggle
            label="Registration updates"
            description="Get notified when players register or withdraw from your tournaments."
            checked={registrationUpdates}
            onChange={setRegistrationUpdates}
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
