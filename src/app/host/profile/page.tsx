"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function HostProfilePage() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState("Karnataka Table Tennis Association");
  const [contactPhone, setContactPhone] = useState("+91 80 4000 1234");

  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Host profile updated");
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Organizer Profile</CardTitle>
          <CardDescription>This information appears publicly on tournaments you host.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="organization">Organization Name</Label>
              <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input id="phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <Button type="submit" className="self-start">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
