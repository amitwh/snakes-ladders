import { describe, it, expect } from 'vitest';
import { createRng } from '../src/engine/rng';
import { squareToCell, CLASSIC_LAYOUT, generateLayout, validateLayout } from '../src/engine/board';

describe('createRng (mulberry32)', () => {
  it('produces the same sequence from the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('produces different sequences from different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    let diff = 0;
    for (let i = 0; i < 100; i++) if (a() !== b()) diff++;
    expect(diff).toBeGreaterThan(90);
  });

  it('stays in [0, 1)', () => {
    const r = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('integer roll helper covers the full dice range', () => {
    const r = createRng(99);
    for (let i = 0; i < 6_000; i++) {
      const v = r();
      const d = Math.floor(v * 6) + 1;
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });
});

describe('squareToCell (boustrophedon)', () => {
  it('places square 1 at bottom-left and 10 at bottom-right', () => {
    expect(squareToCell(1)).toEqual({ row: 0, col: 0 });
    expect(squareToCell(10)).toEqual({ row: 0, col: 9 });
  });

  it('reverses direction on row 1', () => {
    expect(squareToCell(11)).toEqual({ row: 1, col: 9 });
    expect(squareToCell(20)).toEqual({ row: 1, col: 0 });
  });

  it('places square 100 at top-left', () => {
    expect(squareToCell(100)).toEqual({ row: 9, col: 0 });
    expect(squareToCell(91)).toEqual({ row: 9, col: 9 });
  });

  it('handles every square 1..100', () => {
    const seen = new Set<string>();
    for (let n = 1; n <= 100; n++) {
      const { row, col } = squareToCell(n);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThanOrEqual(9);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThanOrEqual(9);
      const key = `${row},${col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe('CLASSIC_LAYOUT', () => {
  it('passes validation', () => {
    expect(validateLayout(CLASSIC_LAYOUT).ok).toBe(true);
  });

  it('has the expected count of snakes and ladders', () => {
    expect(Object.keys(CLASSIC_LAYOUT.jumps.snakes)).toHaveLength(8);
    expect(Object.keys(CLASSIC_LAYOUT.jumps.ladders)).toHaveLength(8);
  });
});

describe('generateLayout', () => {
  it('is deterministic from a seed', () => {
    expect(generateLayout(123)).toEqual(generateLayout(123));
  });

  it('produces a different layout from a different seed', () => {
    expect(generateLayout(1)).not.toEqual(generateLayout(2));
  });

  it('always passes validation', () => {
    for (let s = 0; s < 50; s++) {
      expect(validateLayout(generateLayout(s)).ok).toBe(true);
    }
  });
});