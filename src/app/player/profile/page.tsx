"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentPlayer } from "@/lib/session-data";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";

export default function PlayerProfilePage() {
  const player = useCurrentPlayer();
  const { user } = useAuth();
  const [phone, setPhone] = useState("+91 98765 43210");

  if (!player || !user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated");
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarFallback className="bg-secondary font-heading text-xl text-secondary-foreground">
                {initials(player.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="font-heading text-xl">{player.name}</CardTitle>
              <CardDescription>Manage your player profile information.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={player.name} readOnly />
              <Field label="Date of Birth" value={player.dateOfBirth} readOnly />
              <Field label="Gender" value={player.gender === "MALE" ? "Male" : "Female"} readOnly />
              <Field label="Category" value={player.category} readOnly />
              <Field label="Club" value={player.clubName ?? "Unaffiliated"} readOnly />
              <Field label="State" value={player.state} readOnly />
              <Field label="Email" value={user.email ?? "—"} readOnly />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Name, category, club and state are managed by your club/host and cannot be edited here.
            </p>
            <Button type="submit" className="self-start">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} readOnly={readOnly} disabled={readOnly} />
    </div>
  );
}
