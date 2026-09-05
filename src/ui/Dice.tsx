import { useEffect, useState } from 'react';
import type { GameState } from '../types';
import { randomDie } from '../engine/rng';

// Pip positions in a 3×3 grid (indices 0..8, row-major).
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function Dice({ state, die, tumbling, onRoll }: {
  state: GameState;
  die: number | null;
  tumbling: boolean;
  onRoll: () => void;
}) {
  const current = state.players[state.turnIndex];
  const disabled = state.phase !== 'rolling' || current.kind !== 'human';

  // While tumbling, flash random faces; otherwise show the settled value.
  const [face, setFace] = useState(6);
  useEffect(() => {
    if (!tumbling) return;
    const id = window.setInterval(() => setFace(randomDie()), 70);
    return () => window.clearInterval(id);
  }, [tumbling]);

  // Space / Enter rolls for the human player.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRoll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, onRoll]);

  const shown = tumbling ? face : die ?? 6;
  return (
    <div className="dice-panel">
      <div className={`die${tumbling ? ' tumbling' : ''}`} aria-label={`die showing ${shown}`}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={`pip${PIPS[shown].includes(i) ? ' on' : ''}`} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        <button onClick={onRoll} disabled={disabled}>🎲 Roll Dice</button>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>
          {disabled
            ? (current.kind !== 'human' ? `${current.name} is rolling…` : 'Wait for animation…')
            : 'Click or press Space'}
        </span>
      </div>
    </div>
  );
}
