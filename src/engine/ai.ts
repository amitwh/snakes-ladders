export function chooseDelayMs(rng: () => number): number {
  return 400 + Math.floor(rng() * 500);
}
