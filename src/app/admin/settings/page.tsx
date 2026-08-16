"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicRegistration, setPublicRegistration] = useState(true);
  const [ratingEngineUrl, setRatingEngineUrl] = useState("https://rating-engine.internal/api/v1/exports");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Platform Settings</CardTitle>
          <CardDescription>Global settings affecting the entire platform.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance">Maintenance mode</Label>
              <p className="text-xs text-muted-foreground">Temporarily disable public registration and login.</p>
            </div>
            <Switch id="maintenance" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public-reg">Public registration</Label>
              <p className="text-xs text-muted-foreground">Allow new players and clubs to self-register.</p>
            </div>
            <Switch id="public-reg" checked={publicRegistration} onCheckedChange={setPublicRegistration} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Rating Engine Integration</CardTitle>
          <CardDescription>Endpoint used to export completed tournament results.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rating-url">Rating Engine Endpoint</Label>
            <Input id="rating-url" value={ratingEngineUrl} onChange={(e) => setRatingEngineUrl(e.target.value)} />
          </div>
          <Button className="self-start" onClick={() => toast.success("Settings saved")}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
