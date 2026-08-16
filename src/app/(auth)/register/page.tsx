"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

const roleOptions: { value: Role; label: string; description: string }[] = [
  { value: "PLAYER", label: "Player", description: "Register for tournaments and track your rating" },
  { value: "CLUB", label: "Club", description: "Manage your club roster and tournaments" },
  { value: "HOST", label: "Host", description: "Create and run tournaments" },
  { value: "ADMIN", label: "Admin", description: "Platform-level oversight (invite only)" },
];

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("PLAYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
    router.push(dashboardPathForRole[role]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Create your account</CardTitle>
        <CardDescription>Demo mode — this creates a preview session, not a real account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">I am a</Label>
            <Select value={role} onValueChange={(v) => setRole((v as Role) ?? "PLAYER")}>
              <SelectTrigger id="role" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {roleOptions.find((r) => r.value === role)?.description}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="mt-1">
            Create account
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
