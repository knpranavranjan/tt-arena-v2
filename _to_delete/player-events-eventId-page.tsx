import EventDetailsPage from "@/app/(public)/events/[eventId]/page";

export default async function PlayerPortalEventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <div className="-m-4 sm:-m-6">
      <EventDetailsPage params={params} />
    </div>
  );
}
