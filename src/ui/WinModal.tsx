import type { GameState } from '../types';

export function WinModal({ state, onRematch, onNew }: { state: GameState; onRematch: () => void; onNew: () => void }) {
  if (state.winner === null) return null;
  const winner = state.players[state.winner];
  return (
    <div className="win-overlay">
      <div className="win-card">
        <h2>🎉 {winner.name} wins!</h2>
        <p>Reached square 100 in {state.rollCount} rolls.</p>
        <div className="win-actions">
          <button onClick={onRematch}>Rematch</button>
          <button className="btn-secondary" onClick={onNew}>New Game</button>
        </div>
      </div>
    </div>
  );
}
