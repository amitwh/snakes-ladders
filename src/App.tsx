import { useEffect, useRef, useState } from 'react';
import type { GameState, Player } from './types';
import { freshGame, rollDice } from './engine/game';
import { randomDie } from './engine/rng';
import { chooseDelayMs } from './engine/ai';
import { drawScene, runConfetti } from './render/canvas';
import { playPlan } from './render/animate';
import { play as playSfx } from './audio/sfx';
import { Setup } from './ui/Setup';
import { HUD } from './ui/HUD';
import { Dice } from './ui/Dice';
import { Log } from './ui/Log';
import { WinModal } from './ui/WinModal';
import { Footer } from './ui/Footer';

interface SetupOpts { seed: number; variant: 'classic' | 'random'; players: Player[]; }

const TUMBLE_MS = 550;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [opts, setOpts] = useState<SetupOpts | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [die, setDie] = useState<number | null>(null);
  const [tumbling, setTumbling] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiTimer = useRef<number | null>(null);
  // Face overrides per player, mutated during animation (😱 🤩 🥳).
  const moodsRef = useRef<Record<number, string>>({});

  // Redraw whenever state changes (and on resize).
  useEffect(() => {
    if (!state || !canvasRef.current) return;
    drawScene(canvasRef.current, state, { highlight: state.turnIndex, moods: moodsRef.current });
    const onResize = () => drawScene(canvasRef.current!, state, { highlight: state.turnIndex, moods: moodsRef.current });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [state]);

  // AI loop: when the current player is a computer, schedule a roll.
  useEffect(() => {
    if (!state || state.phase !== 'rolling') return;
    const current = state.players[state.turnIndex];
    if (current.kind !== 'computer' || state.winner !== null) return;
    const delay = chooseDelayMs(Math.random);
    aiTimer.current = window.setTimeout(() => void handleRoll(), delay);
    return () => { if (aiTimer.current) window.clearTimeout(aiTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.turnIndex, state?.phase, state?.winner]);

  async function handleRoll() {
    if (!state || !canvasRef.current) return;
    if (state.phase !== 'rolling') return;
    const playerIdx = state.turnIndex;

    // Live random die for everyone — the seed only governs the board layout.
    const value = randomDie();
    setTumbling(true);
    setDie(null);
    playSfx('roll');
    await wait(TUMBLE_MS);
    setTumbling(false);
    setDie(value);

    const { state: next, plan } = rollDice(state, value);
    // Keep the rolling player's turnIndex during the animation so the HUD and
    // dice show the player who is actually moving (not the next player yet).
    setState({ ...next, phase: 'animating', turnIndex: playerIdx });
    await playPlan(canvasRef.current, { ...next, phase: 'animating', turnIndex: playerIdx }, plan, {
      highlight: playerIdx,
      moods: moodsRef.current,
      onStepStart: (s) => {
        if (s.type === 'walk') playSfx('step');
        else if (s.type === 'snake') { playSfx('snake'); moodsRef.current[playerIdx] = '😱'; }
        else if (s.type === 'ladder') { playSfx('ladder'); moodsRef.current[playerIdx] = '🤩'; }
        else if (s.type === 'win') { playSfx('win'); moodsRef.current[playerIdx] = '🥳'; }
      },
    });
    if (next.winner === null) delete moodsRef.current[playerIdx];
    setState(next);
    if (next.winner !== null && canvasRef.current) {
      await runConfetti(canvasRef.current, next);
    }
  }

  if (!opts) return <Setup onStart={(o) => { moodsRef.current = {}; setDie(null); setOpts(o); setState(freshGame(o)); }} />;
  if (!state) return null;

  return (
    <div className="app">
      <div className="hud"><HUD state={state} /></div>
      <div className="canvas-wrap" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        <WinModal state={state} onRematch={() => { moodsRef.current = {}; setDie(null); setState(freshGame(opts)); }} onNew={() => { moodsRef.current = {}; setDie(null); setOpts(null); setState(null); }} />
      </div>
      <div className="sidebar">
        <Dice state={state} die={die} tumbling={tumbling} onRoll={handleRoll} />
        <Log state={state} />
      </div>
      <Footer />
    </div>
  );
}
