# AGENTS.md

## Project overview

Next.js 14 App Router (pages router is not used) + TypeScript strict + Tailwind CSS 3.
The entire app is a single client-side page — no server components, no API routes, no database.

## Commands

```bash
npm run dev      # dev server on localhost:3000
npm run build    # production build
npm run lint     # ESLint (Next.js built-in config)
npx tsc --noEmit # typecheck
```

## Architecture

```
src/
├── app/
│   ├── layout.tsx   # root layout, metadata
│   ├── page.tsx      # single page, wires everything together
│   └── globals.css   # Tailwind directives + body base style
├── components/
│   ├── Garden.tsx       # 4×3 soil grid, renders Plant SVGs
│   ├── Plant.tsx        # 6 inline SVG plant stages (Seed → Blooming)
│   ├── HabitList.tsx    # habit rows with complete/delete buttons
│   ├── AddHabitForm.tsx # inline form with validation, max 40 chars
│   ├── XPBar.tsx        # level badge + XP progress bar
│   └── Confetti.tsx     # particle overlay on level-up
├── hooks/
│   └── useGameState.ts  # single state hook: habits, XP, level, localStorage sync
└── lib/
    ├── types.ts      # Habit, GameState interfaces + constants (MAX_HABITS=12, XP_PER_COMPLETION=10, FLOWER_COLORS)
    ├── gameLogic.ts  # getXPForLevel (level*100), addXP (carries overflow), getGrowthStage (6 thresholds)
    └── storage.ts    # save/load/clear localStorage under key "habbittodo_save"
```

## Key conventions

- Path alias `@/*` maps to `./src/*` (configured in tsconfig).
- Every component is marked `"use client"` — the whole tree is client-rendered.
- `useGameState` is the only state owner. Components receive data/callbacks as props.
- `useGameState` auto-saves to localStorage on state change (guarded by `loaded` flag to avoid overwriting on first render).
- Plant growth is purely cosmetic — computed from `completions` via `getGrowthStage()`. No separate "plant" entity; each `Habit` maps 1:1 to a garden slot by array index.

## Data model quirks

- `Habit.id` is generated with `crypto.randomUUID()` — requires `crypto` global (available in modern browsers).
- `Habit.color` is assigned from `FLOWER_COLORS[habits.length % FLOWER_COLORS.length]` at creation time.
- Deleting a habit shifts subsequent habits left in the array, so their garden positions change.
- `GameState.levelUp` is a transient timer-based flag in the React state (not persisted) — it triggers Confetti for ~2.5s then self-clears.
- `floatTexts`/`showFloat` in the hook are unused dead code — wired but never rendered in any component.
