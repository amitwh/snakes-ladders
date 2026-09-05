import type { GameState, Plan, Step } from '../types';
import { drawScene } from './canvas';

const STEP_MS = 120;
const JUMP_MS = 600;
const WIN_MS = 400;

function ease(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tween(ms: number, draw: (t: number) => void): Promise<void> {
  const start = performance.now();
  await new Promise<void>((resolve) => {
    function frame(now: number) {
      const t = Math.min(1, (now - start) / ms);
      draw(ease(t));
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

export async function playPlan(
  canvas: HTMLCanvasElement,
  baseState: GameState,
  plan: Plan,
  onProgress?: (i: number, total: number) => void,
  onStepStart?: (step: Step) => void,
): Promise<void> {
  const total = plan.steps.length;
  for (let i = 0; i < total; i++) {
    const step = plan.steps[i];
    onStepStart?.(step);
    const ms = step.type === 'walk' ? STEP_MS : step.type === 'win' ? WIN_MS : JUMP_MS;
    const interim: GameState = { ...baseState, positions: [...baseState.positions] };

    if (step.type === 'walk') {
      await tween(ms, (t) => {
        // Animate the active player from `from` to `to`.
        const partial = step.from + (step.to - step.from) * t;
        interim.positions[baseState.turnIndex] = partial;
        drawScene(canvas, interim, baseState.turnIndex);
      });
      interim.positions[baseState.turnIndex] = step.to;
    } else if (step.type === 'snake' || step.type === 'ladder') {
      await tween(ms, (t) => {
        const partial = step.from + (step.to - step.from) * t;
        interim.positions[baseState.turnIndex] = partial;
        drawScene(canvas, interim, baseState.turnIndex);
      });
      interim.positions[baseState.turnIndex] = step.to;
    } else if (step.type === 'win') {
      await tween(ms, (_t) => {
        interim.positions[baseState.turnIndex] = step.at;
        drawScene(canvas, interim, baseState.turnIndex);
      });
    }

    baseState = interim;
    onProgress?.(i + 1, total);
    await wait(0); // yield
  }
}
