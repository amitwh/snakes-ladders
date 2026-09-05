import type { GameState } from '../types';

export function WinModal({ state, onRematch, onNew }: { state: GameState; onRematch: () => void; onNew: () => void }) {
  if (state.winner === null) return null;
  const winner = state.players[state.winner];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center' }}>
      <div style={{ background: 'var(--panel)', padding: 24, borderRadius: 12, textAlign: 'center', minWidth: 280 }}>
        <h2>🎉 {winner.name} wins!</h2>
        <p>Reached square 100 in {state.rollCount} rolls.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={onRematch}>Rematch</button>
          <button onClick={onNew} style={{ background: '#30363d', color: '#e6edf3' }}>New Game</button>
        </div>
      </div>
    </div>
  );
}
