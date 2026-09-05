import { useEffect, useRef, useState } from 'react';
import type { GameState, Player } from './types';
import { freshGame, rollDice } from './engine/game';
import { createRng } from './engine/rng';
import { chooseDelayMs } from './engine/ai';
import { drawScene } from './render/canvas';
import { playPlan } from './render/animate';
import { play as playSfx } from './audio/sfx';
import { Setup } from './ui/Setup';
import { HUD } from './ui/HUD';
import { Dice } from './ui/Dice';
import { Log } from './ui/Log';
import { WinModal } from './ui/WinModal';

interface SetupOpts { seed: number; variant: 'classic' | 'random'; players: Player[]; }

export default function App() {
  const [opts, setOpts] = useState<SetupOpts | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiTimer = useRef<number | null>(null);

  // Redraw whenever state changes (and on resize).
  useEffect(() => {
    if (!state || !canvasRef.current) return;
    drawScene(canvasRef.current, state, state.turnIndex);
    const onResize = () => drawScene(canvasRef.current!, state, state.turnIndex);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [state]);

  // AI loop: when the current player is a computer, schedule a roll.
  useEffect(() => {
    if (!state || state.phase !== 'rolling') return;
    const current = state.players[state.turnIndex];
    if (current.kind !== 'computer' || state.winner !== null) return;
    const rng = createRng(state.seed + state.rollCount);
    const delay = chooseDelayMs(rng);
    aiTimer.current = window.setTimeout(() => void handleRoll(), delay);
    return () => { if (aiTimer.current) window.clearTimeout(aiTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.turnIndex, state?.phase, state?.winner]);

  async function handleRoll() {
    if (!state || !canvasRef.current) return;
    if (state.phase !== 'rolling') return;
    const current = state.players[state.turnIndex];
    if (current.kind === 'computer') {
      // AI: use seeded stream for die.
      const rng = createRng(state.seed * 31 + state.rollCount * 17 + state.turnIndex);
      const die = Math.floor(rng() * 6) + 1;
      const { state: next, plan } = rollDice(state, die);
      playSfx('roll');
      setState({ ...next, phase: 'animating' });
      await playPlan(canvasRef.current, { ...next, phase: 'animating', turnIndex: state.turnIndex }, plan, undefined, (s) => {
        if (s.type === 'walk') playSfx('step');
        else if (s.type === 'snake') playSfx('snake');
        else if (s.type === 'ladder') playSfx('ladder');
        else if (s.type === 'win') playSfx('win');
      });
      setState(next);
    } else {
      // Ruling B: human rolls are also deterministic from the seed.
      const rng = createRng(state.seed + state.rollCount * 7 + state.turnIndex * 13);
      const die = Math.floor(rng() * 6) + 1;
      const { state: next, plan } = rollDice(state, die);
      playSfx('roll');
      setState({ ...next, phase: 'animating' });
      await playPlan(canvasRef.current, { ...next, phase: 'animating', turnIndex: state.turnIndex }, plan, undefined, (s) => {
        if (s.type === 'walk') playSfx('step');
        else if (s.type === 'snake') playSfx('snake');
        else if (s.type === 'ladder') playSfx('ladder');
        else if (s.type === 'win') playSfx('win');
      });
      setState(next);
    }
  }

  if (!opts) return <Setup onStart={(o) => { setOpts(o); setState(freshGame(o)); }} />;
  if (!state) return null;

  return (
    <div className="app">
      <div className="hud"><HUD state={state} /></div>
      <div className="canvas-wrap" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        <WinModal state={state} onRematch={() => setState(freshGame(opts))} onNew={() => { setOpts(null); setState(null); }} />
      </div>
      <div className="sidebar">
        <Dice state={state} onRoll={handleRoll} />
        <Log state={state} />
      </div>
    </div>
  );
}
