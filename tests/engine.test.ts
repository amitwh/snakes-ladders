import { describe, it, expect } from 'vitest';
import { createRng, randomDie } from '../src/engine/rng';
import { squareToCell, CLASSIC_LAYOUT, generateLayout, validateLayout } from '../src/engine/board';
import { freshGame, rollDice } from '../src/engine/game';
import { chooseDelayMs } from '../src/engine/ai';

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

  it('randomDie stays in 1..6 and produces varied values', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 600; i++) {
      const d = randomDie();
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
      expect(Number.isInteger(d)).toBe(true);
      seen.add(d);
    }
    expect(seen.size).toBe(6);
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

function twoPlayers(seed = 1) {
  return freshGame({
    seed,
    variant: 'classic',
    players: [
      { id: 'p1', name: 'P1', color: '#ff7043', kind: 'human' },
      { id: 'p2', name: 'P2', color: '#42a5f5', kind: 'human' },
    ],
  });
}

describe('freshGame', () => {
  it('starts all players at 0 (off board) with no winner', () => {
    const s = twoPlayers();
    expect(s.positions).toEqual([0, 0]);
    expect(s.winner).toBeNull();
    expect(s.phase).toBe('rolling');
    expect(s.turnIndex).toBe(0);
  });
});

describe('rollDice', () => {
  it('places a token on the board on the first roll', () => {
    const s = twoPlayers();
    const { state, plan } = rollDice(s, 3);
    expect(state.positions[0]).toBe(3);
    expect(plan.steps.length).toBe(3);
    expect(plan.steps.at(-1)).toEqual({ type: 'walk', from: 2, to: 3 });
  });

  it('walks step-by-step between squares (not a teleport)', () => {
    const s = twoPlayers();
    s.positions = [4, 0]; // skip ahead so the ladder at 6 doesn't interfere
    const { plan } = rollDice(s, 5); // walk 4→9
    const last = plan.steps.at(-1);
    expect(last).toEqual({ type: 'walk', from: 8, to: 9 });
  });

  it('rolling a 6 grants an extra turn (turnIndex unchanged)', () => {
    const r = rollDice(twoPlayers(), 6);
    expect(r.state.turnIndex).toBe(0);
    expect(r.state.phase).toBe('rolling');
  });

  it('rolling 1..5 advances to the next player', () => {
    const r = rollDice(twoPlayers(), 4);
    expect(r.state.turnIndex).toBe(1);
    expect(r.state.phase).toBe('rolling');
  });

  it('chains a 6 then a non-6 correctly', () => {
    let s = twoPlayers();
    s = rollDice(s, 6).state;   // P1 rolls, keeps turn
    expect(s.turnIndex).toBe(0);
    s = rollDice(s, 3).state;   // P1 rolls 3, advances
    expect(s.turnIndex).toBe(1);
  });

  it('appends a snake step when landing on a snake head', () => {
    // CLASSIC_LAYOUT has snake at 99→54
    let s = twoPlayers();
    s.positions = [98, 0]; // skip ahead
    const { plan } = rollDice(s, 1);
    expect(plan.steps.at(-1)).toEqual({ type: 'snake', from: 99, to: 54 });
  });

  it('appends a ladder step when landing on a ladder foot', () => {
    // CLASSIC_LAYOUT: ladder 6→25
    let s = twoPlayers();
    s.positions = [1, 0];
    const { plan } = rollDice(s, 5);
    expect(plan.steps.at(-1)).toEqual({ type: 'ladder', from: 6, to: 25 });
  });

  it('declares a winner on exact landing on 100', () => {
    let s = twoPlayers();
    s.positions = [98, 0];
    const { state } = rollDice(s, 2);
    expect(state.winner).toBe(0);
    expect(state.phase).toBe('gameover');
  });

  it('overshooting 100 also wins (no bounce-back)', () => {
    let s = twoPlayers();
    s.positions = [98, 0];
    const { state, plan } = rollDice(s, 5);
    expect(state.winner).toBe(0);
    // No walk step to >100; instead a single win step at 100.
    expect(plan.steps.at(-1)).toEqual({ type: 'win', at: 100 });
  });

  it('appends a human-readable log line per transition', () => {
    const { state } = rollDice(twoPlayers(), 4);
    expect(state.log.length).toBeGreaterThan(0);
    expect(state.log.some((l) => /P1/.test(l))).toBe(true);
  });
});

describe('flavour & fun', () => {
  it('starts with sixStreak at 0', () => {
    expect(twoPlayers().sixStreak).toBe(0);
  });

  it('increments sixStreak on a 6 and resets on non-6', () => {
    let s = twoPlayers();
    s = rollDice(s, 6).state;
    expect(s.sixStreak).toBe(1);
    s = rollDice(s, 6).state;
    expect(s.sixStreak).toBe(2);
    s = rollDice(s, 3).state;
    expect(s.sixStreak).toBe(0);
  });

  it('announces a hot streak from the second consecutive 6', () => {
    let s = twoPlayers();
    s = rollDice(s, 6).state;
    s = rollDice(s, 6).state;
    expect(s.log.at(-1)).toMatch(/🔥/);
    expect(s.log.at(-1)).toMatch(/2/);
  });

  it('resets when the turn passes to the next player', () => {
    let s = twoPlayers();
    s = rollDice(s, 6).state; // P1 keeps turn
    s = rollDice(s, 2).state; // P1 moves on, streak resets, turn passes
    expect(s.sixStreak).toBe(0);
    s = rollDice(s, 6).state; // P2 rolls 6
    expect(s.sixStreak).toBe(1);
  });

  it('snake landings get a 🐍 log line', () => {
    let s = twoPlayers();
    s.positions = [98, 0];
    const { state } = rollDice(s, 1); // lands on snake 99→54
    expect(state.log.at(-1)).toMatch(/🐍/);
    expect(state.log.at(-1)).toMatch(/P1/);
  });

  it('ladder landings get a 🪜 log line', () => {
    let s = twoPlayers();
    s.positions = [1, 0];
    const { state } = rollDice(s, 5); // lands on ladder 6→25
    expect(state.log.at(-1)).toMatch(/🪜/);
  });

  it('winning gets a 🏆 log line', () => {
    let s = twoPlayers();
    s.positions = [98, 0];
    const { state } = rollDice(s, 2);
    expect(state.log.at(-1)).toMatch(/🏆/);
    expect(state.log.at(-1)).toMatch(/P1/);
  });
});

describe('chooseDelayMs', () => {
  it('returns a number within [400, 900)', () => {
    const r = createRng(5);
    for (let i = 0; i < 100; i++) {
      const d = chooseDelayMs(r);
      expect(d).toBeGreaterThanOrEqual(400);
      expect(d).toBeLessThan(900);
    }
  });

  it('is deterministic from the same rng stream', () => {
    const a = chooseDelayMs(createRng(11));
    const b = chooseDelayMs(createRng(11));
    expect(a).toBe(b);
  });
});

describe('full seeded game', () => {
  it('terminates with exactly one winner under 500 rolls', () => {
    let s = freshGame({
      seed: 2026,
      variant: 'random',
      players: [
        { id: 'p1', name: 'P1', color: '#ff7043', kind: 'computer' },
        { id: 'p2', name: 'P2', color: '#42a5f5', kind: 'computer' },
      ],
    });
    // Override the engine's internal die source so the test is deterministic.
    const rng = createRng(2026);
    let rolls = 0;
    while (s.phase !== 'gameover' && rolls < 500) {
      const die = Math.floor(rng() * 6) + 1;
      s = rollDice(s, die).state;
      rolls++;
    }
    expect(s.winner).not.toBeNull();
    expect(s.winner).toBeGreaterThanOrEqual(0);
    expect(s.winner!).toBeLessThan(s.players.length);
    expect(rolls).toBeLessThan(500);
  });

  it('two seeds produce identical replays (determinism)', () => {
    function replay(seed: number) {
      let s = freshGame({
        seed,
        variant: 'random',
        players: [
          { id: 'p1', name: 'P1', color: '#ff7043', kind: 'computer' },
          { id: 'p2', name: 'P2', color: '#42a5f5', kind: 'computer' },
        ],
      });
      const rng = createRng(seed);
      const positions: number[] = [];
      let rolls = 0;
      while (s.phase !== 'gameover' && rolls < 500) {
        const die = Math.floor(rng() * 6) + 1;
        s = rollDice(s, die).state;
        positions.push(...s.positions);
      }
      return { winner: s.winner, positions };
    }
    expect(replay(7)).toEqual(replay(7));
  });
});