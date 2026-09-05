import { useEffect, useRef } from 'react';
import type { GameState } from '../types';

export function Log({ state }: { state: GameState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [state.log.length]);
  return (
    <div ref={ref} style={{ flex: 1, overflowY: 'auto', background: 'var(--panel)', borderRadius: 8, padding: 8, fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
      {state.log.map((line, i) => (
        <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid #21262d' }}>{line}</div>
      ))}
    </div>
  );
}
