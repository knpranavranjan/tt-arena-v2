import { arenaFontVariables } from "@/lib/fonts";
import { ArenaHero } from "@/components/home/arena-hero";
import { LiveRankingsTicker } from "@/components/home/live-rankings-ticker";
import { ArenaStats } from "@/components/home/arena-stats";
import { TournamentsShowcase } from "@/components/home/tournaments-showcase";
import { HostArenaCta } from "@/components/home/host-arena-cta";

export default function HomePage() {
  return (
    <div className={arenaFontVariables} style={{ fontFamily: "var(--font-home-body)" }}>
      <ArenaHero />
      <LiveRankingsTicker />
      <ArenaStats />
      <TournamentsShowcase />
      <HostArenaCta />
    </div>
  );
}
