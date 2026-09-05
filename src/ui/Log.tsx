import { useEffect, useRef } from 'react';
import type { GameState } from '../types';

export function Log({ state }: { state: GameState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [state.log.length]);
  return (
    <div ref={ref} className="log-panel">
      {state.log.map((line, i) => (
        <div key={i} className="log-line">{line}</div>
      ))}
    </div>
  );
}
