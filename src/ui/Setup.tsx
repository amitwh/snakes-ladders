import { useState } from 'react';
import type { Player } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { Footer } from './Footer';

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
    <>
    <div className="setup">
      <header className="setup__header">
        <div className="setup__theme"><ThemeToggle /></div>
        <div className="setup__logo">🐍🪜</div>
        <h1 className="setup__title">Snakes &amp; Ladders</h1>
        <p className="setup__sub">
          Roll a 6 for an extra turn. First to square 100 wins. Watch out for the fangs.
        </p>
      </header>

      <section className="setup__section">
        <span className="setup__label">Players</span>
        <div className="seg">
          {[2, 3, 4].map((n) => (
            <button key={n} className={count === n ? 'is-active' : ''} onClick={() => setCount(n)}>
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="setup__section">
        <span className="setup__label">Board</span>
        <div className="seg">
          <button className={variant === 'classic' ? 'is-active' : ''} onClick={() => setVariant('classic')}>🏛️ Classic</button>
          <button className={variant === 'random' ? 'is-active' : ''} onClick={() => setVariant('random')}>🎲 Randomised</button>
        </div>
      </section>

      {variant === 'random' && (
        <section className="setup__section">
          <span className="setup__label">Seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            style={{ width: 140 }}
          />
          <button className="btn-secondary" onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}>Re-roll</button>
          <span className="setup__hint">Same seed = same board. Dice are always live.</span>
        </section>
      )}

      <section style={{ display: 'grid', gap: 10 }}>
        {players.slice(0, count).map((p, i) => (
          <div key={p.id} className="player-row">
            <span className="player-row__dot" style={{ background: p.color, color: p.color }} />
            <input value={p.name} onChange={(e) => update(i, { name: e.target.value })} />
            <select value={p.kind} onChange={(e) => update(i, { kind: e.target.value as 'human' | 'computer' })}>
              <option value="human">🧑 Human</option>
              <option value="computer">🤖 Computer</option>
            </select>
            <input
              type="color"
              value={p.color}
              onChange={(e) => update(i, { color: e.target.value })}
              title="Token colour"
            />
          </div>
        ))}
      </section>

      <button className="setup__start" onClick={() => onStart({ seed, variant, players: players.slice(0, count) })}>
        ▶ Start Game
      </button>
    </div>
    <Footer />
    </>
  );
}
