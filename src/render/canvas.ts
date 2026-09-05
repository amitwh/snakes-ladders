import type { GameState } from '../types';
import { squareToCell } from '../engine/board';

// Bright, high-contrast palette so the board reads clearly at a glance.
const COLORS = {
  gridA: '#ffca28',              // amber — even checker
  gridB: '#fff8e1',              // cream — odd checker
  numText: '#4e342e',            // dark brown — square numbers
  border: 'rgba(78, 52, 46, 0.22)', // subtle warm grid line
  frame: '#8d6e63',              // board frame
  snake: '#43a047',              // green — body
  snakeDark: '#2e7d32',          // green — outline & dorsal bands
  snakeHead: '#1b5e20',          // dark green head
  snakeCell: 'rgba(67, 160, 71, 0.22)',
  ladder: '#e53935',             // red rails
  ladderDark: '#b71c1c',         // ladder outline/shadow
  ladderCell: 'rgba(229, 57, 53, 0.22)',
  startCell: 'rgba(46, 125, 50, 0.28)',
  finishCell: 'rgba(251, 140, 0, 0.30)',
  win: '#fb8c00',
};

export interface RenderOpts {
  highlight?: number;
  moods?: Record<number, string>;              // player index → emoji face
  override?: { player: number; x: number; y: number }; // pixel position for an animating token
}

export interface BoardMetrics { size: number; cell: number; ox: number; oy: number; }

export function boardMetrics(canvas: HTMLCanvasElement): BoardMetrics {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  const size = Math.min(cssW, cssH);
  const cell = size / 10;
  return { size, cell, ox: (cssW - size) / 2, oy: (cssH - size) / 2 };
}

export function cellCenterPx(m: BoardMetrics, n: number): { x: number; y: number } {
  const { row, col } = squareToCell(n);
  return { x: m.ox + (col + 0.5) * m.cell, y: m.oy + (9 - row + 0.5) * m.cell };
}

// Same control point as drawSnake, so the token rides the visible curve.
export function snakeControlPoint(m: BoardMetrics, from: number, to: number): { x: number; y: number } {
  const a = cellCenterPx(m, from);
  const b = cellCenterPx(m, to);
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const off = m.cell * 0.6;
  return { x: (a.x + b.x) / 2 + nx * off, y: (a.y + b.y) / 2 + ny * off };
}

const DEFAULT_FACE = '😊';

export function drawScene(canvas: HTMLCanvasElement, state: GameState, opts: RenderOpts = {}) {
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const m = boardMetrics(canvas);
  const { size, cell, ox, oy } = m;

  // Highlight the source squares of every jump so hazards and rewards are
  // visible before a token lands on them.
  const snakeHeads = new Set<number>(Object.keys(state.layout.jumps.snakes).map(Number));
  const ladderFeet = new Set<number>(Object.keys(state.layout.jumps.ladders).map(Number));

  // Grid
  for (let n = 1; n <= 100; n++) {
    const { row, col } = squareToCell(n);
    const x = ox + col * cell;
    const y = oy + (9 - row) * cell; // invert Y so row 0 is bottom
    ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.gridA : COLORS.gridB;
    ctx.fillRect(x, y, cell, cell);
    if (n === 1) { ctx.fillStyle = COLORS.startCell; ctx.fillRect(x, y, cell, cell); }
    if (n === 100) { ctx.fillStyle = COLORS.finishCell; ctx.fillRect(x, y, cell, cell); }
    if (snakeHeads.has(n)) { ctx.fillStyle = COLORS.snakeCell; ctx.fillRect(x, y, cell, cell); }
    if (ladderFeet.has(n)) { ctx.fillStyle = COLORS.ladderCell; ctx.fillRect(x, y, cell, cell); }

    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

    ctx.fillStyle = COLORS.numText;
    ctx.font = `700 ${Math.max(11, cell * 0.15)}px -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(n), x + cell * 0.08, y + cell * 0.06);
  }

  // Start / finish badges (bottom-right corner of the square).
  drawBadge(ctx, m, 1, 'START', '#1b5e20');
  drawBadge(ctx, m, 100, 'WIN', '#c62828');

  // Board frame
  ctx.strokeStyle = COLORS.frame;
  ctx.lineWidth = Math.max(4, cell * 0.06);
  ctx.strokeRect(ox, oy, size, size);

  // Ladders (green rails + rungs)
  for (const [fromStr, to] of Object.entries(state.layout.jumps.ladders)) {
    drawLadder(ctx, m, Number(fromStr), to);
  }
  // Snakes (red curves)
  for (const [fromStr, to] of Object.entries(state.layout.jumps.snakes)) {
    drawSnake(ctx, m, Number(fromStr), to);
  }

  // Tokens
  for (let i = 0; i < state.positions.length; i++) {
    let tx: number, ty: number;
    if (opts.override && opts.override.player === i) {
      tx = opts.override.x;
      ty = opts.override.y;
    } else {
      const sq = state.positions[i];
      if (sq === 0) continue;
      const { row, col } = squareToCell(sq);
      const x = ox + col * cell;
      const y = oy + (9 - row) * cell;
      const cx = x + cell / 2;
      const cy = y + cell / 2;

      // Determine fan offset if multiple tokens share the square.
      const shared = state.positions.filter((p) => p === sq).length;
      const angle = shared > 1 ? (i * 2 * Math.PI) / shared : 0;
      const r = shared > 1 ? cell * 0.18 : 0;
      tx = cx + Math.cos(angle) * r;
      ty = cy + Math.sin(angle) * r;
    }

    const radius = cell * 0.2;
    const active = opts.highlight === i;
    ctx.save();
    if (active) {
      ctx.shadowColor = COLORS.win;
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 5;
    }
    ctx.beginPath();
    ctx.arc(tx, ty, radius, 0, Math.PI * 2);
    ctx.fillStyle = state.players[i].color;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = active ? 3 : 2;
    ctx.strokeStyle = '#ffffff'; // white outline so tokens pop on the bright board
    ctx.stroke();
    ctx.restore();

    // Face
    ctx.font = `${Math.round(cell * 0.22)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.moods?.[i] ?? DEFAULT_FACE, tx, ty + cell * 0.02);
  }

  // Win flash
  if (state.winner !== null) {
    ctx.fillStyle = 'rgba(251, 140, 0, 0.18)';
    ctx.fillRect(ox, oy, size, size);
  }
}

function drawBadge(ctx: CanvasRenderingContext2D, m: BoardMetrics, n: number, label: string, color: string) {
  const { cell } = m;
  const { row, col } = squareToCell(n);
  const x = m.ox + col * cell;
  const y = m.oy + (9 - row) * cell;
  ctx.fillStyle = color;
  ctx.font = `800 ${Math.max(9, cell * 0.14)}px -apple-system, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, x + cell - cell * 0.08, y + cell - cell * 0.06);
}

function drawLadder(ctx: CanvasRenderingContext2D, m: BoardMetrics, from: number, to: number) {
  const { cell } = m;
  const a = cellCenterPx(m, from);
  const b = cellCenterPx(m, to);
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len; // perpendicular
  const railOffset = cell * 0.18;
  // Rails
  ctx.strokeStyle = COLORS.ladderDark;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x + nx * railOffset, a.y + ny * railOffset);
  ctx.lineTo(b.x + nx * railOffset, b.y + ny * railOffset);
  ctx.moveTo(a.x - nx * railOffset, a.y - ny * railOffset);
  ctx.lineTo(b.x - nx * railOffset, b.y - ny * railOffset);
  ctx.stroke();
  ctx.strokeStyle = COLORS.ladder;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * railOffset, a.y + ny * railOffset);
  ctx.lineTo(b.x + nx * railOffset, b.y + ny * railOffset);
  ctx.moveTo(a.x - nx * railOffset, a.y - ny * railOffset);
  ctx.lineTo(b.x - nx * railOffset, b.y - ny * railOffset);
  ctx.stroke();
  // Rungs
  ctx.lineWidth = 3;
  for (let t = 0.15; t < 1; t += 0.18) {
    const x1 = a.x + dx * t + nx * railOffset;
    const y1 = a.y + dy * t + ny * railOffset;
    const x2 = a.x + dx * t - nx * railOffset;
    const y2 = a.y + dy * t - ny * railOffset;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

// Quadratic bézier helpers for building the tapered snake body.
function quadPoint(a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}
function quadTangent(a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  const u = 1 - t;
  return { x: 2 * u * (c.x - a.x) + 2 * t * (b.x - c.x), y: 2 * u * (c.y - a.y) + 2 * t * (b.y - c.y) };
}

function drawSnake(ctx: CanvasRenderingContext2D, m: BoardMetrics, from: number, to: number) {
  const { cell } = m;
  const a = cellCenterPx(m, from);   // head (higher square)
  const b = cellCenterPx(m, to);     // tail (lower square)
  const c = snakeControlPoint(m, from, to);

  // A real snake is mostly uniform, narrowing only near the tail — not a cone.
  const headHalf = cell * 0.16;
  const bodyHalf = cell * 0.105;
  const tailHalf = cell * 0.03;
  const halfAt = (t: number) => {
    if (t < 0.22) return headHalf + (bodyHalf - headHalf) * (t / 0.22); // head → neck
    if (t < 0.72) return bodyHalf;                                       // body
    return bodyHalf + (tailHalf - bodyHalf) * ((t - 0.72) / 0.28);       // → tail point
  };

  const N = 34;
  const left: number[] = [];
  const right: number[] = [];
  const spine: { x: number; y: number; nx: number; ny: number; hw: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = quadPoint(a, c, b, t);
    const tan = quadTangent(a, c, b, t);
    const tl = Math.hypot(tan.x, tan.y) || 1;
    const nx = -tan.y / tl, ny = tan.x / tl;   // unit perpendicular
    const hw = halfAt(t);
    left.push(p.x + nx * hw, p.y + ny * hw);
    right.push(p.x - nx * hw, p.y - ny * hw);
    spine.push({ x: p.x, y: p.y, nx, ny, hw });
  }
  ctx.beginPath();
  ctx.moveTo(left[0], left[1]);
  for (let i = 1; i <= N; i++) ctx.lineTo(left[i * 2], left[i * 2 + 1]);
  for (let i = N; i >= 0; i--) ctx.lineTo(right[i * 2], right[i * 2 + 1]);
  ctx.closePath();
  ctx.fillStyle = COLORS.snake;
  ctx.fill();
  ctx.strokeStyle = COLORS.snakeDark;
  ctx.lineWidth = Math.max(1.25, cell * 0.02);
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dorsal bands: short darker marks down the back.
  ctx.strokeStyle = COLORS.snakeDark;
  ctx.lineWidth = Math.max(1, cell * 0.022);
  ctx.lineCap = 'round';
  for (const t of [0.34, 0.46, 0.58, 0.7]) {
    const s = spine[Math.round(t * N)];
    const w = s.hw * 0.72;
    ctx.beginPath();
    ctx.moveTo(s.x + s.nx * w, s.y + s.ny * w);
    ctx.lineTo(s.x - s.nx * w, s.y - s.ny * w);
    ctx.stroke();
  }

  // Head: wider than the neck, oriented along the body direction.
  const tan0 = quadTangent(a, c, b, 0);
  const tl0 = Math.hypot(tan0.x, tan0.y) || 1;
  const hdx = tan0.x / tl0, hdy = tan0.y / tl0;   // toward the tail/body
  const fwd = { x: -hdx, y: -hdy };               // snout direction
  const perp = { x: -hdy, y: hdx };               // lateral
  const hr = headHalf * 1.2;

  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(Math.atan2(hdy, hdx));
  ctx.beginPath();
  ctx.ellipse(0, 0, hr * 1.4, hr * 0.95, 0, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.snakeHead;
  ctx.fill();
  ctx.strokeStyle = COLORS.snake;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Eyes near the snout with vertical slit pupils.
  for (const side of [-1, 1]) {
    const ex = a.x + fwd.x * hr * 0.45 + perp.x * hr * 0.5 * side;
    const ey = a.y + fwd.y * hr * 0.45 + perp.y * hr * 0.5 * side;
    ctx.beginPath();
    ctx.arc(ex, ey, hr * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ex, ey, hr * 0.1, hr * 0.24, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
  }
}

interface Particle { x: number; y: number; vx: number; vy: number; rot: number; vr: number; color: string; size: number; }

// Celebratory confetti burst over the board; resolves when it finishes.
export function runConfetti(canvas: HTMLCanvasElement, state: GameState, durationMs = 2600): Promise<void> {
  const ctx = canvas.getContext('2d')!;
  const m = boardMetrics(canvas);
  const palette = ['#f0883e', '#ef5350', '#66bb6a', '#42a5f5', '#ab47bc', '#ffd54f'];
  const origin = state.winner !== null && state.positions[state.winner] > 0
    ? cellCenterPx(m, state.positions[state.winner])
    : { x: m.ox + m.size / 2, y: m.oy + m.size / 2 };
  const particles: Particle[] = Array.from({ length: 140 }, () => ({
    x: origin.x,
    y: origin.y,
    vx: (Math.random() - 0.5) * 9,
    vy: -(Math.random() * 8 + 3),
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
    color: palette[Math.floor(Math.random() * palette.length)],
    size: 4 + Math.random() * 5,
  }));

  const start = performance.now();
  return new Promise((resolve) => {
    function frame(now: number) {
      const elapsed = now - start;
      drawScene(canvas, state, {});
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / durationMs);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (elapsed < durationMs) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}
