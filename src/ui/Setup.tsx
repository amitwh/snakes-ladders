import { useState } from 'react';
import type { Player } from '../types';

const PALETTE = ['#ff7043', '#42a5f5', '#66bb6a', '#ab47bc'];
const DEFAULT_NAMES = ['Red', 'Blue', 'Green', 'Purple'];

export function Setup({ onStart }: { onStart: (opts: { seed: number; variant: 'classic' | 'random'; players: Player[] }) => void }) {
  const [count, setCount] = useState(2);
  const [variant, setVariant] = useState<'classic' | 'random'>('classic');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [players, setPlayers] = useState<Player[]>(() =>
    Array.from({ length: 4 }, (_, i) => ({ id: `p${i + 1}`, name: DEFAULT_NAMES[i], color: PALETTE[i], kind: i < 2 ? 'human' : 'computer' })),
  );

  const update = (i: number, patch: Partial<Player>) => setPlayers((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16 }}>
      <h1>Snakes &amp; Ladders</h1>

      <section>
        <label>Players: </label>
        {[2, 3, 4].map((n) => (
          <button key={n} onClick={() => setCount(n)} style={{ marginRight: 6, background: count === n ? '#f0883e' : '#30363d', color: '#e6edf3' }}>
            {n}
          </button>
        ))}
      </section>

      <section>
        <label>Board: </label>
        <button onClick={() => setVariant('classic')} style={{ marginRight: 6, background: variant === 'classic' ? '#f0883e' : '#30363d', color: '#e6edf3' }}>Classic</button>
        <button onClick={() => setVariant('random')} style={{ background: variant === 'random' ? '#f0883e' : '#30363d', color: '#e6edf3' }}>Randomised (seed)</button>
      </section>

      <section>
        <label>Seed: </label>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value))}
          style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: 4, borderRadius: 4, width: 140 }}
        />
        <button onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))} style={{ marginLeft: 8, background: '#30363d', color: '#e6edf3' }}>Re-roll</button>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        {players.slice(0, count).map((p, i) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 120px 120px', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, background: p.color }} />
            <input
              value={p.name}
              onChange={(e) => update(i, { name: e.target.value })}
              style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: 4, borderRadius: 4 }}
            />
            <select value={p.kind} onChange={(e) => update(i, { kind: e.target.value as 'human' | 'computer' })} style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: 4, borderRadius: 4 }}>
              <option value="human">Human</option>
              <option value="computer">Computer</option>
            </select>
            <select value={p.color} onChange={(e) => update(i, { color: e.target.value })} style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: 4, borderRadius: 4 }}>
              {PALETTE.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        ))}
      </section>

      <button onClick={() => onStart({ seed, variant, players: players.slice(0, count) })} style={{ fontSize: 18, padding: '12px 24px' }}>
        Start Game
      </button>
    </div>
  );
}
