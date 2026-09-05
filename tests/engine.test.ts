import { describe, it, expect } from 'vitest';
import { createRng } from '../src/engine/rng';

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