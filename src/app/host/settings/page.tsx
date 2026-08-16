"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function HostSettingsPage() {
  const [registrationAlerts, setRegistrationAlerts] = useState(true);
  const [exportFailureAlerts, setExportFailureAlerts] = useState(true);

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Notifications</CardTitle>
          <CardDescription>Manage alerts for tournaments you operate.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reg-alerts">New registrations</Label>
              <p className="text-xs text-muted-foreground">Notify when a player registers for your tournament.</p>
            </div>
            <Switch id="reg-alerts" checked={registrationAlerts} onCheckedChange={setRegistrationAlerts} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="export-alerts">Rating export failures</Label>
              <p className="text-xs text-muted-foreground">Notify if a rating export to the external engine fails.</p>
            </div>
            <Switch id="export-alerts" checked={exportFailureAlerts} onCheckedChange={setExportFailureAlerts} />
          </div>
          <Button className="self-start" onClick={() => toast.success("Preferences saved")}>
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
