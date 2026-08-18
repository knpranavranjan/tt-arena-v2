import EventsPage from "@/app/(public)/events/page";

export default function PlayerPortalEventsPage() {
  return (
    <div className="-m-4 sm:-m-6">
      <EventsPage basePath="/player/events" />
    </div>
  );
}
