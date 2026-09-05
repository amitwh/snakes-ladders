import type { GameState } from '../types';

export function Dice({ state, onRoll }: { state: GameState; onRoll: () => void }) {
  const current = state.players[state.turnIndex];
  const disabled = state.phase !== 'rolling' || current.kind !== 'human';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--panel)', borderRadius: 8 }}>
      <button onClick={onRoll} disabled={disabled}>Roll Dice</button>
      <span style={{ opacity: 0.7, fontSize: 12 }}>{disabled ? (current.kind !== 'human' ? 'Computer is rolling…' : 'Wait for animation…') : 'Click to roll'}</span>
    </div>
  );
}
