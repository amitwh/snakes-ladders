import type { GameState } from '../types';
import { squareToCell } from '../engine/board';

const COLORS = { gridA: '#1c2128', gridB: '#22272e', numText: '#8b949e', border: '#30363d', snake: '#ef5350', ladder: '#66bb6a', win: '#f0883e' };

export function drawScene(canvas: HTMLCanvasElement, state: GameState, highlight?: number) {
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

  const size = Math.min(cssW, cssH);
  const cell = size / 10;
  const ox = (cssW - size) / 2;
  const oy = (cssH - size) / 2;

  // Grid
  for (let n = 1; n <= 100; n++) {
    const { row, col } = squareToCell(n);
    const x = ox + col * cell;
    const y = oy + (9 - row) * cell; // invert Y so row 0 is bottom
    ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.gridA : COLORS.gridB;
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
    ctx.fillStyle = COLORS.numText;
    ctx.font = `${Math.max(10, cell * 0.13)}px -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(n), x + 4, y + 3);
  }

  // Ladders (green rails + rungs)
  for (const [fromStr, to] of Object.entries(state.layout.jumps.ladders)) {
    drawLadder(ctx, ox, oy, cell, Number(fromStr), to);
  }
  // Snakes (red curves)
  for (const [fromStr, to] of Object.entries(state.layout.jumps.snakes)) {
    drawSnake(ctx, ox, oy, cell, Number(fromStr), to);
  }

  // Tokens
  for (let i = 0; i < state.positions.length; i++) {
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
    const tx = cx + Math.cos(angle) * r;
    const ty = cy + Math.sin(angle) * r;

    ctx.beginPath();
    ctx.arc(tx, ty, cell * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = state.players[i].color;
    ctx.fill();
    ctx.lineWidth = highlight === i ? 3 : 2;
    ctx.strokeStyle = highlight === i ? COLORS.win : '#0d1117';
    ctx.stroke();
  }

  // Win flash
  if (state.winner !== null) {
    ctx.fillStyle = 'rgba(240, 136, 62, 0.15)';
    ctx.fillRect(ox, oy, size, size);
  }
}

function cellCenter(ox: number, oy: number, cell: number, n: number) {
  const { row, col } = squareToCell(n);
  return { x: ox + (col + 0.5) * cell, y: oy + (9 - row + 0.5) * cell };
}

function drawLadder(ctx: CanvasRenderingContext2D, ox: number, oy: number, cell: number, from: number, to: number) {
  const a = cellCenter(ox, oy, cell, from);
  const b = cellCenter(ox, oy, cell, to);
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len; // perpendicular
  const railOffset = cell * 0.18;
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

function drawSnake(ctx: CanvasRenderingContext2D, ox: number, oy: number, cell: number, from: number, to: number) {
  const a = cellCenter(ox, oy, cell, from);
  const b = cellCenter(ox, oy, cell, to);
  // Control point offset perpendicular for a curved body.
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const off = cell * 0.6;
  const cx = mx + nx * off, cy = my + ny * off;
  ctx.strokeStyle = COLORS.snake;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(cx, cy, b.x, b.y);
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(a.x, a.y, cell * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.snake;
  ctx.fill();
}
