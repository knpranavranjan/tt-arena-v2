"use client";

import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCurrentClub } from "@/lib/session-data";
import { useState } from "react";

export default function ClubProfilePage() {
  const club = useCurrentClub();
  const [description, setDescription] = useState(club?.description ?? "");
  const [contact, setContact] = useState("contact@apexttc.in");

  if (!club) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Club profile updated");
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground">
              <Building2 className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <div>
              <CardTitle className="font-heading text-xl">{club.name}</CardTitle>
              <CardDescription>Manage how your club appears publicly.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Club Name</Label>
                <Input value={club.name} disabled />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Location</Label>
                <Input value={`${club.location}, ${club.state}`} disabled />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="contact">Contact Email</Label>
                <Input id="contact" type="email" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="self-start">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
