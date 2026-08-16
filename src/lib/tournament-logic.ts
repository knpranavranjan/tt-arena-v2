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
