import { useState } from 'react';
import type { Player } from '../types';

const PALETTE = ['#ff7043', '#42a5f5', '#66bb6a', '#ab47bc'];
const DEFAULT_NAMES = ['Red', 'Blue', 'Green', 'Purple'];

const card: React.CSSProperties = {
  padding: 28,
  maxWidth: 680,
  margin: '5vh auto',
  display: 'grid',
  gap: 20,
  background: 'var(--panel)',
  borderRadius: 16,
  border: '1px solid var(--border)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
const label: React.CSSProperties = { minWidth: 72, color: 'var(--muted)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 };
const input: React.CSSProperties = { background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: '6px 8px', borderRadius: 6 };

function toggle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'var(--accent)' : '#30363d',
    color: active ? '#0d1117' : '#e6edf3',
  };
}

export function Setup({ onStart }: { onStart: (opts: { seed: number; variant: 'classic' | 'random'; players: Player[] }) => void }) {
  const [count, setCount] = useState(2);
  const [variant, setVariant] = useState<'classic' | 'random'>('classic');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [players, setPlayers] = useState<Player[]>(() =>
    Array.from({ length: 4 }, (_, i) => ({ id: `p${i + 1}`, name: DEFAULT_NAMES[i], color: PALETTE[i], kind: i < 2 ? 'human' : 'computer' })),
  );

  const update = (i: number, patch: Partial<Player>) => setPlayers((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <div style={card}>
      <header style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🐍🪜</div>
        <h1 style={{ margin: '4px 0 0' }}>Snakes &amp; Ladders</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
          Roll a 6 for an extra turn. First to square 100 wins. Watch out for the fangs.
        </p>
      </header>

      <section style={row}>
        <span style={label}>Players</span>
        {[2, 3, 4].map((n) => (
          <button key={n} onClick={() => setCount(n)} style={toggle(count === n)}>
            {n}
          </button>
        ))}
      </section>

      <section style={row}>
        <span style={label}>Board</span>
        <button onClick={() => setVariant('classic')} style={toggle(variant === 'classic')}>🏛️ Classic</button>
        <button onClick={() => setVariant('random')} style={toggle(variant === 'random')}>🎲 Randomised</button>
      </section>

      {variant === 'random' && (
        <section style={row}>
          <span style={label}>Seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            style={{ ...input, width: 140 }}
          />
          <button onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))} style={{ background: '#30363d', color: '#e6edf3' }}>Re-roll</button>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>Same seed = same board. Dice are always live.</span>
        </section>
      )}

      <section style={{ display: 'grid', gap: 10 }}>
        {players.slice(0, count).map((p, i) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 130px 56px', gap: 10, alignItems: 'center' }}>
            <span style={{ width: 18, height: 18, borderRadius: 9, background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
            <input value={p.name} onChange={(e) => update(i, { name: e.target.value })} style={input} />
            <select value={p.kind} onChange={(e) => update(i, { kind: e.target.value as 'human' | 'computer' })} style={input}>
              <option value="human">🧑 Human</option>
              <option value="computer">🤖 Computer</option>
            </select>
            <input
              type="color"
              value={p.color}
              onChange={(e) => update(i, { color: e.target.value })}
              style={{ ...input, padding: 2, height: 34, width: 56, cursor: 'pointer' }}
              title="Token colour"
            />
          </div>
        ))}
      </section>

      <button onClick={() => onStart({ seed, variant, players: players.slice(0, count) })} style={{ fontSize: 18, padding: '12px 24px' }}>
        ▶ Start Game
      </button>
    </div>
  );
}
