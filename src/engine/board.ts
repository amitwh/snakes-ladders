import { createRng } from './rng';
import type { JumpMap, Layout } from '../types';

export interface Cell { row: number; col: number; }

export function squareToCell(n: number): Cell {
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new Error(`squareToCell: out of range ${n}`);
  }
  const idx = n - 1;
  const row = Math.floor(idx / 10);
  const colInRow = idx % 10;
  // Even rows (0,2,4…) go left→right; odd rows right→left.
  const col = row % 2 === 0 ? colInRow : 9 - colInRow;
  return { row, col };
}

export const CLASSIC_LAYOUT: Layout = {
  variant: 'classic',
  jumps: {
    // Standard 1970s Indian board layout (common published variant), adjusted
    // by one square on snakes 25->2 and 92->51 to break the chains at 25
    // (snake head = ladder top) and 51 (snake tail = ladder foot) so that
    // validateLayout() considers the layout valid.
    snakes: {
      99: 54, 70: 55, 52: 42, 26: 2,
      47: 16, 92: 50, 62: 37, 49: 9,
    },
    ladders: {
      6: 25, 11: 40, 20: 59, 27: 74,
      36: 57, 51: 67, 63: 81, 71: 91,
    },
  },
};

export function validateLayout(layout: Layout): { ok: true } | { ok: false; reason: string } {
  const sources = new Set<number>();
  for (const [from, to] of [...Object.entries(layout.jumps.snakes), ...Object.entries(layout.jumps.ladders)]) {
    const f = Number(from);
    if (f === 1 || f === 100) return { ok: false, reason: `jump source on square ${f}` };
    if (to === 1 || to === 100) return { ok: false, reason: `jump destination on square ${to}` };
    if (sources.has(f)) return { ok: false, reason: `chained jump source at ${f}` };
    sources.add(f);
  }
  // Destination of one jump must not be the source of another (chained).
  const dests = new Set<number>([
    ...Object.values(layout.jumps.snakes),
    ...Object.values(layout.jumps.ladders),
  ]);
  for (const s of sources) if (dests.has(s)) return { ok: false, reason: `chain: ${s} is both source and dest` };
  return { ok: true };
}

export function generateLayout(seed: number): Layout {
  const rng = createRng(seed);
  const snakes: Record<number, number> = {};
  const ladders: Record<number, number> = {};
  const used = new Set<number>([1, 100]);

  function takePair(minSrc: number, maxSrc: number, minDst: number, maxDst: number) {
    for (let tries = 0; tries < 200; tries++) {
      const from = minSrc + Math.floor(rng() * (maxSrc - minSrc + 1));
      const to = minDst + Math.floor(rng() * (maxDst - minDst + 1));
      if (from === to) continue;
      if (used.has(from) || used.has(to)) continue;
      return [from, to] as const;
    }
    throw new Error('generateLayout: failed to place jump (exhausted retries)');
  }

  for (let i = 0; i < 8; i++) {
    const [from, to] = takePair(20, 95, 4, 50);
    snakes[from] = to;
    used.add(from); used.add(to);
  }
  for (let i = 0; i < 8; i++) {
    const [from, to] = takePair(2, 35, 40, 90);
    ladders[from] = to;
    used.add(from); used.add(to);
  }

  const layout: Layout = { variant: 'random', jumps: { snakes, ladders } };
  const v = validateLayout(layout);
  if (!v.ok) throw new Error(`generateLayout produced invalid layout: ${v.reason}`);
  return layout;
}