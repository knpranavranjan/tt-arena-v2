/**
 * Deterministic RNG helpers.
 *
 * Every random decision in the prototype — sample players, simulated matches,
 * lottery tie-breaks — is driven by a seeded PRNG, so a given tournament seed
 * always reproduces the same tournament. When the point of the build is to
 * validate an algorithm, a bug has to be reproducible.
 */

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(value: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Build an RNG from any set of scalar parts (seed, match id, attempt…). */
export function rngFor(...parts: Array<string | number>): Rng {
  return mulberry32(hashString(parts.join('|')))
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

/** Fisher-Yates using a supplied RNG. */
export function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
