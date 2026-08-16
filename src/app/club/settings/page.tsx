"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function ClubSettingsPage() {
  const [tournamentAlerts, setTournamentAlerts] = useState(true);
  const [rosterChangeAlerts, setRosterChangeAlerts] = useState(true);

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Notifications</CardTitle>
          <CardDescription>Manage alerts sent to club administrators.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tournament-alerts">Tournament updates</Label>
              <p className="text-xs text-muted-foreground">Registration deadlines and results for your players.</p>
            </div>
            <Switch id="tournament-alerts" checked={tournamentAlerts} onCheckedChange={setTournamentAlerts} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="roster-alerts">Roster change alerts</Label>
              <p className="text-xs text-muted-foreground">Notify when a player joins or leaves the club.</p>
            </div>
            <Switch id="roster-alerts" checked={rosterChangeAlerts} onCheckedChange={setRosterChangeAlerts} />
          </div>
          <Button className="self-start" onClick={() => toast.success("Preferences saved")}>
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
