import type { GameState } from '../types';
import { isMuted, setMuted } from '../audio/sfx';

export function HUD({ state }: { state: GameState }) {
  const current = state.players[state.turnIndex];
  return (
    <div className="hud-panel">
      <strong>Turn:</strong>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="hud-dot" style={{ background: current.color }} />
        {current.name} ({current.kind})
      </span>
      <span style={{ marginLeft: 8, color: 'var(--muted)' }}>
        Seed: <code>{state.seed}</code> ({state.layout.variant})
      </span>
      <span style={{ marginLeft: 8, color: 'var(--muted)' }}>Rolls: {state.rollCount}</span>
      <span style={{ flex: 1 }} />
      {state.players.map((p, i) => (
        <span key={p.id} className="hud-chip">
          <span className="hud-dot" style={{ background: p.color }} />
          {p.name}: {state.positions[i] || '—'}
        </span>
      ))}
      <button className="btn-secondary" onClick={() => setMuted(!isMuted())}>
        {isMuted() ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
}
