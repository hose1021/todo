# AGENTS.md

## Project overview

Next.js 14 App Router (pages router not used) + TypeScript strict + Tailwind CSS 3.
Static export (`output: "export"` in next.config.mjs) — no server at runtime. `images: { unoptimized: true }` is required for static export.
Single client-side page, no API routes, no database. Russian-language UI.

## Commands

```bash
npm run dev           # dev server on localhost:3000
npm run build         # production build → out/
npm run test          # vitest (single run)
npm run test:watch    # vitest (watch mode)
npm run lint          # ESLint (Next.js built-in config)
npx tsc --noEmit      # typecheck (no separate check script — must run manually)
```

## Architecture

```
src/
├── app/
│   ├── layout.tsx       # root layout (SERVER component, no "use client"), Russian metadata
│   ├── page.tsx          # single page, wires everything together
│   └── globals.css       # Tailwind directives + body base style
├── components/
│   ├── Garden.tsx        # 6×5 soil grid (MAX_PLANTS=30 slots), shows Plant objects
│   ├── Plant.tsx          # 6 stages: sprites from /trees/ (next/image), emoji fallback
│   ├── HabitList.tsx      # habit rows: complete, delete, rename, toggle daily (↻), keyboard selection
│   ├── AddHabitForm.tsx   # inline form, max 40 chars, MAX_HABITS=50
│   ├── Shop.tsx           # buy plants (TREE_VARIANTS) for 50 💎, shows 10.png preview
│   ├── InventoryStrip.tsx # bar under garden: purchased plants → click to plant
│   ├── XPBar.tsx          # level badge + XP progress bar
│   ├── Confetti.tsx       # particle overlay on level-up (~2.5s)
│   └── HelpModal.tsx      # first-visit tutorial modal (localStorage key: "habbittodo_help_seen")
├── hooks/
│   └── useGameState.ts    # single state owner: habits, plants, inventory, XP, level, streak, mute, localStorage
└── lib/
    ├── types.ts           # Habit, Plant, GameState + constants
    ├── gameLogic.ts       # getXPForLevel, addXP, getPlantStage, getPlantProgress, getPlantSpriteSrc, formatTimeRemaining, STAGE_NAMES
    ├── storage.ts         # save/load/clear localStorage under key "habbittodo_save"
    └── sound.ts           # Web Audio API sounds: plant, complete, delete, levelUp
tests/
└── gameLogic.test.ts      # vitest tests for gameLogic functions
public/trees/
├── tree_1/                # 10 sprite PNGs (1.png–10.png)
└── tree_2/                # 10 sprite PNGs
```

## Build/deploy quirks

- `next.config.mjs`: `basePath` reads from `NEXT_PUBLIC_BASE_PATH` env (empty by default). Used for subpath deployments.
- Build output lands in `out/` (static export).
- `vitest.config.ts` sets up `@` → `./src` alias matching tsconfig paths.

## Game mechanics

- **Habit**: name, completions count, `isDaily` flag. `MAX_HABITS=50`, `MAX_PLANTS=30`.
- **Daily habits**: marked with ↻ — resets `completions` to 0 each day (detected by 30s ticker, not midnight trigger).
- **Streak** 🔥: completing any habit sets `lastCompletionDate`. If consecutive day, streak++. If missed a day, resets to 1. Shown in header.
- **Plant**: bought in Shop (50 💎), stored in inventory (max 99), planted into a garden slot (0–29). Has `variant` (folder name like "tree_1"), `color`, `plantedAt` timestamp, `upgrades` (0–3).
- **Growth**: time-based for stages 0→1 (2h) and 1→2 (6h). Stages 2→3, 3→4, 4→5 require crystal upgrades (UPGRADE_PRICE=30 💎 each). `effectiveStage = min(2, timeStage) + upgrades`.
- **XP vs Crystals**: XP levels up (level×100). Crystals (💎) are currency. +10 XP + 10 💎 per habit completion.
- **Refund**: deleting a plant returns full cost (50 + upgrades×30 💎).
- **Re-render ticker**: `setInterval` every 30s forces re-render for time-based stage updates and daily habit resets.

## Key conventions

- Path alias `@/*` maps to `./src/*` (tsconfig paths and vitest.config.ts).
- All components and `page.tsx` are `"use client"`. `layout.tsx` is the only server component (runs at build time only due to static export).
- `useGameState` is the single state owner. Components receive data/callbacks as props.
- `useGameState` auto-saves to localStorage on state change (guarded by `loaded` flag).
- `migrateIfNeeded()` converts old-format saves (habits with `plantVariant` → separate `Habit[]` + `Plant[]` + `inventory[]`). Also converts numeric variant IDs to string folder names.

## Data model quirks

- `Habit.id` and `Plant.id` generated via `crypto.randomUUID()`.
- `Plant.color` from `FLOWER_COLORS[inventory.length % FLOWER_COLORS.length]` at purchase time.
- Deleting a plant sets its garden slot to `null` (the array stays length 30).
- `levelUp` is a transient timer-based React state flag — triggers Confetti for ~2.5s.
- `floatTexts`/`showFloat` in the hook are unused dead code.
- Old localStorage saves auto-migrated: habits with `plantVariant` → new `Habit[]` + `Plant[]` + `inventory`.
- Mute state persisted separately under `habbittodo_mute` key.
- `screenshot-*.png` files are gitignored.

## Sprites

- Plant sprites in `public/trees/{variant}/`. Each folder has 10 PNGs.
- `TREE_VARIANTS` in types.ts lists available variant folder names.
- `getPlantSpriteSrc(plant)` maps stage + progress → `/trees/{variant}/{1-10}.png`.
- Sprite mapping: stages 0–2 get 2 frames each (early/late by timer progress), stages 3–4 get 1 frame, stage 5 gets 1.
- Shop shows `10.png` (final stage) as preview. Inventory shows `1.png` (seed).

## Russian localization

- `STAGE_NAMES` in gameLogic.ts: "Семя", "Росток", "Юный", "Растущий", "Взрослый", "Цветущий".
- `formatTimeRemaining(ms)` returns Russian labels: "Готово", "5м", "3ч", "2ч 30м".
- Help modal and all UI text is in Russian.

## ESLint

- Pinned to eslint@8.57.1 + eslint-config-next@14 — do NOT upgrade to eslint 9, Next.js 14 is incompatible.
- Config in `.eslintrc.json`: extends `next/core-web-vitals`.
