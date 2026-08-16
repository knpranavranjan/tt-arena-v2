"use client";

import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PlayerSettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [registrationReminders, setRegistrationReminders] = useState(true);

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Notifications</CardTitle>
          <CardDescription>Choose what you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifs">Email notifications</Label>
              <p className="text-xs text-muted-foreground">Tournament updates and results.</p>
            </div>
            <Switch id="email-notifs" checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reg-reminders">Registration reminders</Label>
              <p className="text-xs text-muted-foreground">Alerts before a registration deadline.</p>
            </div>
            <Switch id="reg-reminders" checked={registrationReminders} onCheckedChange={setRegistrationReminders} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Withdraw from a tournament</p>
              <p className="text-xs text-muted-foreground">Manage active registrations from the Registrations tab.</p>
            </div>
          </div>
          <Button className="self-start" onClick={() => toast.success("Preferences saved")}>
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
