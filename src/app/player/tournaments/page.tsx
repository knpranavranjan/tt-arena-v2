"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentCard } from "@/components/cards/tournament-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { useCurrentPlayer } from "@/lib/session-data";
import { tournaments } from "@/lib/mock-data";

export default function PlayerTournamentsPage() {
  const player = useCurrentPlayer();
  if (!player) return null;

  const available = tournaments.filter(
    (t) => t.status === "REGISTRATION_OPEN" && !t.registeredPlayerIds.includes(player.id),
  );
  const registered = tournaments.filter(
    (t) => t.registeredPlayerIds.includes(player.id) && t.status !== "COMPLETED",
  );
  const completed = tournaments.filter(
    (t) => t.registeredPlayerIds.includes(player.id) && t.status === "COMPLETED",
  );

  return (
    <Tabs defaultValue="available">
      <TabsList>
        <TabsTrigger value="available">Available ({available.length})</TabsTrigger>
        <TabsTrigger value="registered">Registered ({registered.length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="available" className="mt-4">
        <Grid items={available} empty="No tournaments open for registration right now." />
      </TabsContent>
      <TabsContent value="registered" className="mt-4">
        <Grid items={registered} empty="You haven't registered for any upcoming tournaments." />
      </TabsContent>
      <TabsContent value="completed" className="mt-4">
        <Grid items={completed} empty="No completed tournaments yet." />
      </TabsContent>
    </Tabs>
  );
}

function Grid({ items, empty }: { items: typeof tournaments; empty: string }) {
  if (items.length === 0) return <EmptyState title="Nothing here yet" description={empty} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => <TournamentCard key={t.id} tournament={t} />)}
    </div>
  );
}
