import type { GameState } from '../types';
import { isMuted, setMuted } from '../audio/sfx';

export function HUD({ state }: { state: GameState }) {
  const current = state.players[state.turnIndex];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 8, background: 'var(--panel)', borderRadius: 8 }}>
      <strong>Turn:</strong>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, background: current.color }} />
        {current.name} ({current.kind})
      </span>
      <span style={{ marginLeft: 16 }}>Seed: <code>{state.seed}</code> ({state.layout.variant})</span>
      <span style={{ marginLeft: 16 }}>Rolls: {state.rollCount}</span>
      <span style={{ flex: 1 }} />
      {state.players.map((p, i) => (
        <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#0d1117', borderRadius: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: p.color }} />
          {p.name}: {state.positions[i] || '—'}
        </span>
      ))}
      <button onClick={() => setMuted(!isMuted())} style={{ background: '#30363d', color: '#e6edf3' }}>
        {isMuted() ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
}
