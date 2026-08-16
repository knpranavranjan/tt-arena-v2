"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { events, tournaments } from "@/lib/mock-data";
import type { Category, Tournament, TournamentFormat } from "@/lib/types";

const categories: Category[] = ["Under 13", "Under 17", "Under 21", "Senior", "Veteran (40+)"];

export default function NewTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [date, setDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("16");
  const [format, setFormat] = useState<TournamentFormat>("POOL_KNOCKOUT");
  const [category, setCategory] = useState<Category>("Senior");
  const [entryFee, setEntryFee] = useState("500");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `trn-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) || Date.now()}`;
    const newTournament: Tournament = {
      id,
      eventId: events[0]?.id ?? "evt-open-2026",
      name,
      venue,
      organizer,
      date,
      registrationDeadline: deadline,
      maxPlayers: Number(maxPlayers) || 16,
      registeredPlayerIds: [],
      format,
      category,
      entryFee: Number(entryFee) || 0,
      description,
      status: "DRAFT",
      poolSize: format === "POOL_KNOCKOUT" ? 4 : undefined,
    };
    tournaments.push(newTournament);
    toast.success("Tournament created");
    router.push(`/host/tournaments/${id}`);
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Create Tournament</CardTitle>
          <CardDescription>Step 1 — Tournament Information. Players, seeding, pools and knockout are configured from the tournament workspace after creation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Tournament Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" required value={venue} onChange={(e) => setVenue(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="organizer">Organizer</Label>
                <Input id="organizer" required value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deadline">Registration Deadline</Label>
                <Input id="deadline" type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maxPlayers">Maximum Players</Label>
                <Input id="maxPlayers" type="number" min={2} required value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                <Input id="entryFee" type="number" min={0} value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={(v) => setFormat((v as TournamentFormat) ?? "POOL_KNOCKOUT")}>
                  <SelectTrigger id="format"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                    <SelectItem value="POOL_KNOCKOUT">Pool + Knockout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory((v as Category) ?? "Senior")}>
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" className="self-start">Create Tournament</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
