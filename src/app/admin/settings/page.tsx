"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useHostingPlans } from "@/lib/hosting-plans";
import { useMembershipFees, type MembershipRole } from "@/lib/membership";
import {
  PasswordSection,
  SettingsButton,
  SettingsField,
  SettingsSection,
  SupportSection,
  display,
} from "@/components/settings/settings-ui";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const { plans, updatePrice } = useHostingPlans();
  // Only holds entries the admin has actually edited this visit — until then
  // each field just displays the live price from context, so it always
  // reflects the current (possibly previously-saved) value without needing
  // an effect to sync it in.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const saveHostingPlans = () => {
    for (const plan of plans) {
      const raw = priceDrafts[plan.id] ?? String(plan.price);
      const parsed = Number(raw);
      if (!raw || Number.isNaN(parsed) || parsed < 0) {
        toast.error(`Enter a valid amount for "${plan.title}"`);
        return;
      }
    }
    for (const plan of plans) {
      const raw = priceDrafts[plan.id] ?? String(plan.price);
      updatePrice(plan.id, Number(raw));
    }
    toast.success("Hosting plan prices updated");
  };

  const { fees, updateFee } = useMembershipFees();
  const [feeDrafts, setFeeDrafts] = useState<Partial<Record<MembershipRole, string>>>({});

  const saveMembershipFees = () => {
    const roles: MembershipRole[] = ["PLAYER", "CLUB"];
    for (const role of roles) {
      const raw = feeDrafts[role] ?? String(fees[role]);
      const parsed = Number(raw);
      if (!raw || Number.isNaN(parsed) || parsed < 0) {
        toast.error(`Enter a valid amount for ${role === "PLAYER" ? "Player" : "Club"} membership`);
        return;
      }
    }
    for (const role of roles) {
      const raw = feeDrafts[role] ?? String(fees[role]);
      updateFee(role, Number(raw));
    }
    toast.success("Membership fees updated");
  };

  if (!user) return null;

  return (
    <div style={{ fontFamily: "var(--font-home-body)" }} className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#e2e2e8] sm:text-[28px]" style={display}>
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#8b8b93]">Manage your admin profile, security, and platform fees.</p>
      </div>

      <div className="flex flex-col gap-6">
        <SettingsSection title="Profile" description="Your name and email as they appear across the platform.">
          <SettingsField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <SettingsField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <SettingsButton onClick={() => toast.success("Profile updated")}>Save Profile</SettingsButton>
        </SettingsSection>

        <PasswordSection />

        <SettingsSection
          title="Hosting Plans"
          description={'The prices shown on the "Choose a hosting plan" step when a club or host submits a tournament.'}
        >
          {plans.map((plan) => (
            <SettingsField
              key={plan.id}
              label={`${plan.title} (₹)`}
              type="number"
              min={0}
              value={priceDrafts[plan.id] ?? String(plan.price)}
              onChange={(e) => setPriceDrafts((current) => ({ ...current, [plan.id]: e.target.value }))}
            />
          ))}
          <SettingsButton onClick={saveHostingPlans}>Save Hosting Plans</SettingsButton>
        </SettingsSection>

        <SettingsSection
          title="Membership Fees"
          description="The annual fee players and clubs pay for site access, and can renew every year."
        >
          <SettingsField
            label="Player Membership (₹ / year)"
            type="number"
            min={0}
            value={feeDrafts.PLAYER ?? String(fees.PLAYER)}
            onChange={(e) => setFeeDrafts((current) => ({ ...current, PLAYER: e.target.value }))}
          />
          <SettingsField
            label="Club Membership (₹ / year)"
            type="number"
            min={0}
            value={feeDrafts.CLUB ?? String(fees.CLUB)}
            onChange={(e) => setFeeDrafts((current) => ({ ...current, CLUB: e.target.value }))}
          />
          <SettingsButton onClick={saveMembershipFees}>Save Membership Fees</SettingsButton>
        </SettingsSection>

        <SupportSection />
      </div>
    </div>
  );
}
