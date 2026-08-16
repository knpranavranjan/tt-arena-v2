import { ConceptHero } from "@/components/concept-home/concept-hero";
import { ConceptRankings } from "@/components/concept-home/concept-rankings";
import { ConceptStats } from "@/components/concept-home/concept-stats";
import { ConceptTournaments } from "@/components/concept-home/concept-tournaments";
import { ConceptCta } from "@/components/concept-home/concept-cta";

export default function ConceptHomePage() {
  return (
    <div>
      <ConceptHero />
      <ConceptRankings />
      <ConceptStats />
      <ConceptTournaments />
      <ConceptCta />
    </div>
  );
}
