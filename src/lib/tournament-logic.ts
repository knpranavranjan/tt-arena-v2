import type { Player } from "@/lib/types";

export function seedPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.rating - a.rating);
}

export interface GeneratedPool {
  name: string;
  players: Player[];
}

export function generatePools(seeded: Player[], poolSize: number): GeneratedPool[] {
  const poolCount = Math.max(1, Math.ceil(seeded.length / Math.max(1, poolSize)));
  const pools: GeneratedPool[] = Array.from({ length: poolCount }, (_, i) => ({
    name: `Pool ${String.fromCharCode(65 + i)}`,
    players: [],
  }));
  seeded.forEach((player, i) => {
    const round = Math.floor(i / poolCount);
    const posInRound = i % poolCount;
    const poolIndex = round % 2 === 0 ? posInRound : poolCount - 1 - posInRound;
    pools[poolIndex].players.push(player);
  });
  return pools;
}

export function poolQualifiers(pools: GeneratedPool[], perPool = 2): Player[] {
  return pools.flatMap((pool) => pool.players.slice(0, Math.min(perPool, pool.players.length)));
}

// ---------------------------------------------------------------------------
// Fixtures maths — round-robin group play, live standings, knockout bracket.
// Pure functions: they take the persisted score/winner maps from the Fixtures
// store and derive everything else on the fly, so the Matches workspace never
// has to keep a second copy of state.
// ---------------------------------------------------------------------------

export interface RoundRobinPair {
  key: string;
  aId: string;
  bId: string;
}

// Every unordered pair in a pool, in a stable order. `key` is
// `${poolIndex}:${aId}:${bId}` so it survives re-seeding as long as the same
// two players stay in the same pool.
export function roundRobinPairs(poolIndex: number, playerIds: string[]): RoundRobinPair[] {
  const pairs: RoundRobinPair[] = [];
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      pairs.push({
        key: `${poolIndex}:${playerIds[i]}:${playerIds[j]}`,
        aId: playerIds[i],
        bId: playerIds[j],
      });
    }
  }
  return pairs;
}

export interface StandingRow {
  playerId: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
  qualified: boolean;
}

export interface PairResult {
  aId: string;
  bId: string;
  a: number;
  b: number;
}

// 2 points per win, 0 for a loss — matches the seeded `poolStandings` demo
// data (3-0 → 6 pts, 1-2 → 2 pts). A pair with an equal score is treated as
// "not played yet" (table tennis has no draws).
export function computeStandings(
  playerIds: string[],
  results: PairResult[],
  qualifyCount = 2,
): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    playerIds.map((id) => [
      id,
      { playerId: id, played: 0, wins: 0, losses: 0, points: 0, qualified: false },
    ]),
  );

  for (const r of results) {
    if (r.a === r.b) continue;
    const a = rows.get(r.aId);
    const b = rows.get(r.bId);
    if (!a || !b) continue;
    a.played += 1;
    b.played += 1;
    if (r.a > r.b) {
      a.wins += 1;
      a.points += 2;
      b.losses += 1;
    } else {
      b.wins += 1;
      b.points += 2;
      a.losses += 1;
    }
  }

  const ordered = [...rows.values()].sort(
    (x, y) =>
      y.points - x.points ||
      y.wins - x.wins ||
      playerIds.indexOf(x.playerId) - playerIds.indexOf(y.playerId),
  );
  ordered.forEach((row, i) => {
    row.qualified = i < qualifyCount;
  });
  return ordered;
}

export interface KnockoutSlot {
  playerId?: string;
  bye?: boolean;
}

export interface KnockoutMatch {
  key: string;
  a: KnockoutSlot;
  b: KnockoutSlot;
  winnerId?: string;
}

export interface KnockoutRound {
  name: string;
  matches: KnockoutMatch[];
}

function roundName(slotCount: number): string {
  if (slotCount === 2) return "Final";
  if (slotCount === 4) return "Semifinal";
  if (slotCount === 8) return "Quarterfinal";
  return `Round of ${slotCount}`;
}

// Standard bracket seed order: for size 4 → [1,4,2,3], size 8 →
// [1,8,4,5,2,7,3,6]. Keeps the top seeds apart until the later rounds.
function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const sum = order.length * 2 + 1;
    const next: number[] = [];
    for (const s of order) {
      next.push(s);
      next.push(sum - s);
    }
    order = next;
  }
  return order;
}

export function buildKnockout(
  qualifierIds: string[],
  winners: Record<string, string>,
): { rounds: KnockoutRound[]; championId?: string } {
  if (qualifierIds.length < 2) return { rounds: [] };

  let size = 1;
  while (size < qualifierIds.length) size *= 2;

  const positioned: (string | undefined)[] = seedOrder(size).map(
    (seed) => qualifierIds[seed - 1],
  );

  const rounds: KnockoutRound[] = [];
  let current: KnockoutSlot[] = positioned.map((id) =>
    id ? { playerId: id } : { bye: true },
  );
  let roundIndex = 0;

  while (current.length > 1) {
    const matches: KnockoutMatch[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i];
      const b = current[i + 1];
      const key = `${roundIndex}:${i / 2}`;
      let winnerId: string | undefined = winners[key];
      // Auto-advance a player who drew a bye.
      if (!winnerId) {
        if (a.playerId && b.bye) winnerId = a.playerId;
        else if (b.playerId && a.bye) winnerId = b.playerId;
      }
      // Drop a stale pick if that player is no longer in this match.
      if (winnerId && winnerId !== a.playerId && winnerId !== b.playerId) {
        winnerId = undefined;
      }
      matches.push({ key, a, b, winnerId });
    }
    rounds.push({ name: roundName(current.length), matches });
    current = matches.map((m) => (m.winnerId ? { playerId: m.winnerId } : {}));
    roundIndex += 1;
  }

  const championId = rounds[rounds.length - 1]?.matches[0]?.winnerId;
  return { rounds, championId };
}
