import TournamentDetailPage from "@/app/(public)/tournaments/[tournamentId]/page";

// A single tournament category (the public /tournaments/[id] page), inside the portal.
export default async function PlayerPortalCategoryPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  return (
    <div className="-m-4 sm:-m-6">
      <TournamentDetailPage params={params} />
    </div>
  );
}
