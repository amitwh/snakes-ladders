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
      phase: 'gameover',
      winner: state.turnIndex,
      log: [...state.log],
    };
    pushLog(newState, `${player.name} rolled ${die} → reached square ${BOARD_END} and won!`);
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

  const newState: GameState = {
    ...state,
    positions: newPositions,
    rollCount: state.rollCount + 1,
    turnIndex: nextTurn,
    phase: 'rolling',
    log: [...state.log],
  };
  const tail = steps.at(-1);
  let msg = `${player.name} rolled ${die}, moved to ${finalSquare}`;
  if (tail?.type === 'snake') msg += `, bitten by snake down to ${tail.to}`;
  else if (tail?.type === 'ladder') msg += `, climbed ladder up to ${tail.to}`;
  msg += keepTurn ? ' (rolled 6 — extra turn)' : '.';
  pushLog(newState, msg);

  return { state: newState, plan: { steps } };
}
