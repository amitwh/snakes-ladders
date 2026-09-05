// Mulberry32 — a tiny, fast, well-distributed 32-bit PRNG.
// Reference: https://stackoverflow.com/a/47593316
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return function rng(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}