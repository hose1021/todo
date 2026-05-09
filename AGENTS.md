# AGENTS.md

## Project overview

Next.js 14 App Router (pages router is not used) + TypeScript strict + Tailwind CSS 3.
Single client-side page — no server components (except layout.tsx), no API routes, no database.
Russian-language UI.

## Commands

```bash
npm run dev      # dev server on localhost:3000
npm run build    # production build
npm run lint     # ESLint (Next.js built-in config)
npx tsc --noEmit # typecheck (no separate check script — must run manually)
```

## Architecture

```
src/
├── app/
│   ├── layout.tsx   # root layout (SERVER component, no "use client"), Russian metadata
│   ├── page.tsx      # single page, wires everything together
│   └── globals.css   # Tailwind directives + body base style
├── components/
│   ├── Garden.tsx       # 6×5 soil grid (30 slots), shows Plant objects
│   ├── Plant.tsx        # 6 inline emoji plant stages (Семя → Цветущий)
│   ├── HabitList.tsx    # habit rows with complete (+10 XP) / delete buttons
│   ├── AddHabitForm.tsx # inline form with validation, max 40 chars
│   ├── Shop.tsx         # buy plants (3 variants) for 50 XP each
│   ├── InventoryStrip.tsx # bar under garden: bought plants → click to plant
│   ├── XPBar.tsx        # level badge + XP progress bar
│   └── Confetti.tsx     # particle overlay on level-up
├── hooks/
│   └── useGameState.ts  # single state hook: habits, plants, inventory, XP, level, localStorage
└── lib/
    ├── types.ts      # Habit, Plant, GameState + constants
    ├── gameLogic.ts  # getXPForLevel, addXP, getPlantStage (time-based + upgrades)
    ├── storage.ts    # save/load/clear localStorage under key "habbittodo_save"
    └── sound.ts      # Web Audio API sounds: plant, complete, delete, levelUp
```

## Game mechanics

- **Habit**: just a task — name, completions count. No plant attached. MAX_HABITS=50.
- **Plant**: bought in Shop (50 💎), stored in inventory, then planted into a garden slot (0–29). Has `variant` (0–2), `color`, `plantedAt` timestamp, `upgrades` (0–3).
- **Growth**: time-based for stages 0→1 (2h) and 1→2 (6h). Stages 2→3, 3→4, 4→5 require crystal upgrades (30 💎 each). `effectiveStage = min(2, timeStage) + upgrades`.
- **XP vs Crystals**: XP levels up (level*100). Crystals (💎) are the currency for buying/upgrading plants. +10 XP + 10 💎 per habit completion.
- **Refund**: deleting a plant returns full crystal cost (50 + upgrades*30 💎).
- **Re-render ticker**: `setInterval` every 30s forces re-render so time-based stages update visually.

## Key conventions

- Path alias `@/*` maps to `./src/*` (tsconfig paths).
- All components in `components/` and `page.tsx` are `"use client"`. `layout.tsx` is the only server component.
- `useGameState` is the single state owner. Components receive data/callbacks as props.
- `useGameState` auto-saves to localStorage on state change (guarded by `loaded` flag).
- `migrateIfNeeded()` in the hook converts old-format saves (habits with plantVariant) to new format.

## Data model quirks

- `Habit.id` generated via `crypto.randomUUID()`.
- `Plant.id` generated via `crypto.randomUUID()`.
- `Plant.color` from `FLOWER_COLORS[inventory.length % FLOWER_COLORS.length]` at purchase time.
- Deleting a plant sets its garden slot to `null`.
- `levelUp` is a transient timer-based React state flag — triggers Confetti for ~2.5s.
- `floatTexts`/`showFloat` in the hook are unused dead code.
- Old localStorage saves are auto-migrated: habits with `plantVariant` → new `Habit[]` + `Plant[]` + `inventory`.
- `screenshot-*.png` files are gitignored.
