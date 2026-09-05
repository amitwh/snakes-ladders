# 🐍🪜 Snakes & Ladders

A 2D Snakes & Ladders game for 2–4 players, playable in the browser or as a
desktop app. Built with a pure, fully-tested game engine and a clean
React + Canvas presentation layer.

One codebase, three deliverables: a Vite dev server, a single self-contained
HTML file, and a packaged Electron desktop app.

## Features

- **2–4 players** — mix of Humans and Computers (the computer just decides *when*
  to roll; a Snakes & Ladders move has no choice).
- **Classic or randomised boards** — a seeded PRNG generates a new layout every
  time, validated so no snake/ladder chains and no jump touches square 1 or 100.
- **Live random dice** — every roll uses `crypto.getRandomValues()` (with a
  `Math.random` fallback); the seed only governs the board layout.
- **Animated play** — tokens walk square-by-square, slide down snakes, and climb
  ladders along the drawn path.
- **Synthesised sound** — dice roll, steps, snake bite, ladder climb and victory
  cues are generated with WebAudio (no asset files), with a mute toggle.
- **Personality** — emoji reactions (😱 🤩 🥳), flavour log lines, a 🔥 hot-streak
  callout for consecutive sixes, and a confetti burst on the win.

## Rules

- On your turn, roll the die and move that many squares.
- Roll a **6** for an **extra turn**.
- Land on a **ladder foot** → climb up. Land on a **snake head** → slide down.
- **Overshooting 100 wins immediately** (no bounce-back). First to 100 wins.

## Getting started

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173
```

## Commands

| Command              | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Vite dev server                                       |
| `npm run build`      | `dist/index.html` — fully inlined single file         |
| `npm run preview`    | Serve the production build locally                    |
| `npm run test`       | Vitest — 36 engine tests                              |
| `npm run test:watch` | Vitest in watch mode                                  |
| `npm run app`        | Electron window loading `dist/index.html`             |
| `npm run dist:linux` | Package a Linux AppImage into `dist/`                 |

The `dist/index.html` build is completely self-contained (JS and CSS inlined) —
open it directly from the filesystem with no network access.

## Architecture

Three layers with one-way dependencies — `engine` ← `render` ← `ui`.

```
src/
  engine/   board.ts  game.ts  ai.ts  rng.ts   # pure TypeScript, no DOM
  render/   canvas.ts  animate.ts               # canvas drawing + tween queue
  audio/    sfx.ts                              # WebAudio synthesised cues
  ui/       Setup.tsx  HUD.tsx  Dice.tsx  Log.tsx  WinModal.tsx  App.tsx
  main.tsx
electron/
  main.cjs  preload.cjs                         # desktop shell
tests/
  engine.test.ts                                # Vitest over the engine only
```

- **`engine/`** — the rules as a pure reducer. `rollDice(state)` returns the next
  state plus an ordered `plan` of animation steps (`walk` / `snake` / `ladder` /
  `win`). `rng.ts` is a mulberry32 PRNG so every game is reproducible.
- **`render/`** — draws the board from `(GameState, animationOverrides)` and
  plays a move plan through a tween queue. No React here.
- **`ui/`** — React owns discrete state only; the canvas owns per-frame motion.

### Data flow

Click *Roll* → `rollDice(state)` returns the next state + move plan → the
animator plays the plan against the canvas → on completion the new state is
committed to React → if the active player is a computer, `ai.ts` schedules the
next roll. The engine has no knowledge that animation exists.

## Testing

```bash
npm test
```

The engine is covered by deterministic unit tests, including seeded full-game
replays that terminate with exactly one winner.

## Tech

Vite · React 18 · TypeScript · Canvas · Electron (`electron-builder`) · Vitest
