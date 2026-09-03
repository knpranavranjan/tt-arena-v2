import PlayersPage from "@/app/(public)/players/page";

export default function HostPortalPlayersPage() {
  return (
    <div className="-m-4 sm:-m-6">
      <PlayersPage basePath="/host/players" />
    </div>
  );
}
