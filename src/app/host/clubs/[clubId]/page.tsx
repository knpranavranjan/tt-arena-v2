import ClubProfilePage from "@/app/(public)/clubs/[clubId]/page";

export default async function HostPortalClubProfilePage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  return (
    <div className="-m-4 sm:-m-6">
      <ClubProfilePage params={params} />
    </div>
  );
}
