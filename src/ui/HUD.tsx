import type { GameState } from '../types';
import { isMuted, setMuted } from '../audio/sfx';
import { ThemeToggle } from './ThemeToggle';

export function HUD({ state }: { state: GameState }) {
  const current = state.players[state.turnIndex];
  return (
    <div className="hud-panel">
      <strong>Turn:</strong>
      <span className="hud-turn">
        <span className="hud-dot" style={{ background: current.color }} />
        {current.name} ({current.kind})
      </span>
      <span className="hud-meta">Seed: <code>{state.seed}</code> ({state.layout.variant})</span>
      <span className="hud-meta">Rolls: {state.rollCount}</span>
      <div className="hud-actions">
        {state.players.map((p, i) => (
          <span key={p.id} className="hud-chip">
            <span className="hud-dot" style={{ background: p.color }} />
            {p.name}: {state.positions[i] || '—'}
          </span>
        ))}
        <button className="btn-secondary" onClick={() => setMuted(!isMuted())}>
          {isMuted() ? 'Unmute' : 'Mute'}
        </button>
        <ThemeToggle />
      </div>
    </div>
  );
}
