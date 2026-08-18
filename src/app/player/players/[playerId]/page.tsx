import PlayerProfilePage from "@/app/(public)/players/[playerId]/page";

export default async function PlayerPortalPlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  return (
    <div className="-m-4 sm:-m-6">
      <PlayerProfilePage params={params} />
    </div>
  );
}
