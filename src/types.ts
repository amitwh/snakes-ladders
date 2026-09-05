export type PlayerKind = 'human' | 'computer';
export type Square = number; // 1..100, 0 means not on board yet

export interface Player {
  id: string;
  name: string;
  color: string;
  kind: PlayerKind;
}

export interface JumpMap {
  snakes: Record<number, number>; // head → tail
  ladders: Record<number, number>; // foot → top
}

export interface Layout {
  jumps: JumpMap;
  // classic vs randomised flag for HUD/Setup rendering
  variant: 'classic' | 'random';
}

export type Step =
  | { type: 'walk'; from: Square; to: Square }
  | { type: 'snake'; from: Square; to: Square }
  | { type: 'ladder'; from: Square; to: Square }
  | { type: 'win'; at: Square };

export interface Plan {
  steps: Step[];
}

export type Phase = 'rolling' | 'animating' | 'gameover';

export interface GameState {
  seed: number;
  layout: Layout;
  players: Player[];
  positions: Square[];           // length === players.length; 0 = not yet on board
  turnIndex: number;             // index into players
  phase: Phase;
  rollCount: number;
  winner: number | null;         // index into players
  log: string[];
}

export interface RollResult {
  state: GameState;
  plan: Plan;
}
