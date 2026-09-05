import { useEffect, useRef } from 'react';
import type { GameState, Player } from '../types';

// Colour a player's name inside a log line using their token colour.
function colorize(line: string, players: Player[]) {
  // Longest name first to avoid partial-name collisions (e.g. "Al" vs "Alex").
  const match = [...players].sort((a, b) => b.name.length - a.name.length)
    .find((p) => p.name && line.includes(p.name));
  if (!match) return line;
  const i = line.indexOf(match.name);
  return (
    <>
      {line.slice(0, i)}
      <span style={{ color: match.color, fontWeight: 700 }}>{match.name}</span>
      {line.slice(i + match.name.length)}
    </>
  );
}

export function Log({ state }: { state: GameState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [state.log.length]);
  return (
    <div ref={ref} className="log-panel">
      {state.log.map((line, i) => (
        <div key={i} className="log-line">{colorize(line, state.players)}</div>
      ))}
    </div>
  );
}
