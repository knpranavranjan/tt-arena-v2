"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

const roleCopy: Record<Role, { label: string; email: string }> = {
  PLAYER: { label: "Player", email: "arjun@apexttc.in" },
  CLUB: { label: "Club", email: "contact@apexttc.in" },
  HOST: { label: "Host", email: "ops@ktta.in" },
  ADMIN: { label: "Admin", email: "admin@ttmanagement.app" },
};

function LoginForm() {
  const [role, setRole] = useState<Role>("PLAYER");
  const [email, setEmail] = useState(roleCopy.PLAYER.email);
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRoleChange = (value: string) => {
    const nextRole = value as Role;
    setRole(nextRole);
    setEmail(roleCopy[nextRole].email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
    const next = searchParams.get("next") ?? dashboardPathForRole[role];
    router.push(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Sign in</CardTitle>
        <CardDescription>Demo mode — pick a role to preview each portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={role} onValueChange={handleRoleChange}>
          <TabsList className="grid w-full grid-cols-4">
            {(Object.keys(roleCopy) as Role[]).map((r) => (
              <TabsTrigger key={r} value={r}>{roleCopy[r].label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
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
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="mt-1">
            Sign in as {roleCopy[role].label}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
