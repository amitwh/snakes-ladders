import type { GameState, Plan, Step } from '../types';
import { boardMetrics, cellCenterPx, drawScene, snakePath } from './canvas';

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

export interface PlayOpts {
  highlight: number;                          // the moving player
  moods?: Record<number, string>;             // live face overrides (mutated via onStepStart)
  onStepStart?: (step: Step) => void;
  onProgress?: (i: number, total: number) => void;
}

export async function playPlan(
  canvas: HTMLCanvasElement,
  baseState: GameState,
  plan: Plan,
  opts: PlayOpts,
): Promise<void> {
  const total = plan.steps.length;
  for (let i = 0; i < total; i++) {
    const step = plan.steps[i];
    opts.onStepStart?.(step);
    const ms = step.type === 'walk' ? STEP_MS : step.type === 'win' ? WIN_MS : JUMP_MS;
    const interim: GameState = { ...baseState, positions: [...baseState.positions] };
    const show = (x: number, y: number) =>
      drawScene(canvas, interim, {
        highlight: opts.highlight,
        moods: opts.moods,
        override: { player: opts.highlight, x, y },
      });

    if (step.type === 'walk' || step.type === 'ladder') {
      // Ladders climb straight up the rails; walks slide centre-to-centre.
      // from can be 0 (off-board start) — enter via square 1 in that case.
      const m = boardMetrics(canvas);
      const a = cellCenterPx(m, Math.max(1, step.from));
      const b = cellCenterPx(m, step.to);
      await tween(ms, (t) => show(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
      interim.positions[opts.highlight] = step.to;
    } else if (step.type === 'snake') {
      // Snakes slide along the same S-curve the body is drawn on.
      const m = boardMetrics(canvas);
      await tween(ms, (t) => {
        const p = snakePath(m, step.from, step.to, t);
        show(p.x, p.y);
      });
      interim.positions[opts.highlight] = step.to;
    } else if (step.type === 'win') {
      interim.positions[opts.highlight] = step.at;
      await tween(ms, () => {
        drawScene(canvas, interim, { highlight: opts.highlight, moods: opts.moods });
      });
    }

    baseState = interim;
    opts.onProgress?.(i + 1, total);
    await wait(0); // yield
  }
}
