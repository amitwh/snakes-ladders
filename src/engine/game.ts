import type { GameState, Layout, Player, RollResult, Step } from '../types';
import { CLASSIC_LAYOUT, generateLayout } from './board';

const BOARD_END = 100;

export function freshGame(opts: { seed: number; variant: 'classic' | 'random'; players: Player[] }): GameState {
  const layout: Layout = opts.variant === 'classic'
    ? CLASSIC_LAYOUT
    : generateLayout(opts.seed);
  return {
    seed: opts.seed,
    layout,
    players: opts.players,
    positions: opts.players.map(() => 0),
    turnIndex: 0,
    phase: 'rolling',
    rollCount: 0,
    sixStreak: 0,
    winner: null,
    log: [`Game started with seed ${opts.seed} (${opts.variant}).`],
  };
}

function rollDie(seed: number, rollCount: number): number {
  // Mix the seed with the roll count to get a deterministic die value for tests
  // AND for human players — the actual game calls rollDice(state) without an
  // explicit dieValue, in which case the caller should provide Math.random()
  // externally. Tests always inject. For end-to-end reproducibility in dev,
  // use the seeded stream here.
  const x = Math.sin(seed * 9301 + rollCount * 49297) * 233280;
  return Math.floor((x - Math.floor(x)) * 6) + 1;
}

function pushLog(state: GameState, line: string) {
  state.log.push(line);
}

// Flavour templates. `%n` name, `%d` die, `%f` from, `%t` to. Choice is
// deterministic per roll (seed + rollCount) so seeded replays stay identical.
const WALK_LINES = [
  '🎲 %n rolled %d → square %t.',
  '🎲 %n shakes out a %d and hops to %t.',
  '🎲 A %d for %n — off to square %t.',
  '🎲 %n rattles the cup… %d! Marches to %t.',
];
const SNAKE_LINES = [
  '🐍 Hisss! %n landed on %f and slid down to %t.',
  '🐍 Ouch! A snake gobbled %n at %f — back to %t.',
  '🐍 Down you go, %n! %f was a snake head. Hello, %t.',
];
const LADDER_LINES = [
  '🪜 Up we go! %n climbed from %f to %t.',
  '🪜 %n found a ladder at %f and zipped up to %t!',
  '🪜 Nice one, %n — ladder at %f, express lift to %t!',
];
const SIX_LINES = [
  '🎯 %n rolled %d → square %t — and a 6 earns another roll!',
  '🎯 Six! %n moves to %t and keeps the dice.',
];

function pick(lines: string[], state: GameState): string {
  return lines[(state.seed + state.rollCount) % lines.length];
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/%([ndft])/g, (_, k) => String(vars[k] ?? k));
}

export function rollDice(state: GameState, dieValue?: number): RollResult {
  if (state.phase === 'gameover') return { state, plan: { steps: [] } };
  const player = state.players[state.turnIndex];
  const fromPos = state.positions[state.turnIndex];

  const die = dieValue ?? rollDie(state.seed, state.rollCount + 1);
  const steps: Step[] = [];
  const targetUncapped = fromPos + die;

  // Build the walk, then chain snake/ladder at the final square.
  let cursor = fromPos;
  const finalSquare = Math.min(targetUncapped, BOARD_END);
  for (let s = cursor + 1; s <= finalSquare; s++) {
    steps.push({ type: 'walk', from: cursor, to: s });
    cursor = s;
  }

  // Overshoot wins immediately.
  if (targetUncapped >= BOARD_END) {
    const newState: GameState = {
      ...state,
      positions: state.positions.map((p, i) => (i === state.turnIndex ? BOARD_END : p)),
      rollCount: state.rollCount + 1,
      sixStreak: die === 6 ? state.sixStreak + 1 : 0,
      phase: 'gameover',
      winner: state.turnIndex,
      log: [...state.log],
    };
    pushLog(newState, `🏆 ${player.name} rolled ${die} and reached square ${BOARD_END} — ${player.name} WINS!`);
    return { state: newState, plan: { steps: [...steps, { type: 'win', at: BOARD_END }] } };
  }

  // Apply snake or ladder at the final square.
  let finalPos = cursor;
  const at = finalSquare;
  const snakeTail = state.layout.jumps.snakes[at];
  const ladderTop = state.layout.jumps.ladders[at];
  if (snakeTail !== undefined) {
    steps.push({ type: 'snake', from: at, to: snakeTail });
    finalPos = snakeTail;
  } else if (ladderTop !== undefined) {
    steps.push({ type: 'ladder', from: at, to: ladderTop });
    finalPos = ladderTop;
  }

  const newPositions = state.positions.map((p, i) => (i === state.turnIndex ? finalPos : p));
  const keepTurn = die === 6;
  const nextTurn = keepTurn
    ? state.turnIndex
    : (state.turnIndex + 1) % state.players.length;
  const sixStreak = keepTurn ? state.sixStreak + 1 : 0;

  const newState: GameState = {
    ...state,
    positions: newPositions,
    rollCount: state.rollCount + 1,
    turnIndex: nextTurn,
    phase: 'rolling',
    sixStreak,
    log: [...state.log],
  };
  const tail = steps.at(-1);
  const vars = { n: player.name, d: die, f: finalSquare, t: finalPos };
  if (tail?.type === 'snake') {
    pushLog(newState, fill(pick(SNAKE_LINES, state), vars));
  } else if (tail?.type === 'ladder') {
    pushLog(newState, fill(pick(LADDER_LINES, state), vars));
  } else if (keepTurn) {
    pushLog(newState, fill(pick(SIX_LINES, state), vars));
  } else {
    pushLog(newState, fill(pick(WALK_LINES, state), vars));
  }
  if (sixStreak >= 2) {
    pushLog(newState, `🔥 ${player.name} is on fire — ${sixStreak} sixes in a row!`);
  }

  return { state: newState, plan: { steps } };
}
