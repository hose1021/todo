# AGENTS.md

## Project overview

Next.js 14 App Router (pages router not used) + TypeScript strict + Tailwind CSS 3.
Static export (`output: "export"` in next.config.mjs) — no server at runtime. `images: { unoptimized: true }` is required for static export.
Single client-side page, no API routes, no database. Russian-language UI. Inter font via `next/font/google`.

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
│   ├── layout.tsx       # root layout (SERVER component, no "use client"), Inter font + Russian metadata
│   ├── page.tsx          # single page, wires everything together, bottom nav on mobile
│   └── globals.css       # Tailwind directives + dark background gradient
├── components/
│   ├── Garden.tsx        # 6×6 grid (MAX_PLANTS=36), long-press select, upgrade/remove panel, 🏆 achievements button
│   ├── Plant.tsx          # emoji-based (🌱 sprout while growing, plant emoji when grown), scale/saturate per level
│   ├── HabitList.tsx      # swipe-right=complete, swipe-left=delete, rename, toggle daily (↻), sort modes, add-habit button at bottom
│   ├── AddHabitForm.tsx   # inline form or modal (embedded prop), max 40 chars
│   ├── Shop.tsx           # 16 plant types, grouped by rarity, horizontal scroll per rarity tier
│   ├── InventoryStrip.tsx # emoji preview, plant button
│   ├── XPBar.tsx          # level badge + XP progress bar
│   ├── Confetti.tsx       # particle overlay on level-up (~2.5s)
│   ├── HelpModal.tsx      # first-visit tutorial (localStorage key: "habbittodo_help_seen")
│   └── AchievementPanel.tsx # 15 achievements grid, progress bars, claim button (shown as modal)
├── hooks/
│   └── useGameState.ts    # single state owner: habits, plants, inventory, XP, crystals, streak, achievements, mute
├── lib/
│   ├── types.ts           # Habit, Plant, GameState, AchievementDef, constants (MAX_HABITS=50, MAX_PLANTS=36, XP_PER_COMPLETION=10)
│   ├── plants.ts          # PLANT_TYPES (16 types), RARITY_LEVELS (1–5), GROWTH_LEVELS (1–3), SPROUT_EMOJI
│   ├── gameLogic.ts       # getXPForLevel, addXP, getPlantGrowth, getPlantScaleSaturate, formatTimeRemaining
│   ├── achievements.ts    # ACHIEVEMENTS (15 defs), evaluateAchievements, initAchievementStates
│   ├── storage.ts         # save/load/clear localStorage under key "habbittodo_save"
│   └── sound.ts           # Web Audio API sounds: plant, complete, delete, levelUp
tests/
└── gameLogic.test.ts      # vitest tests for gameLogic functions
```

## Build/deploy quirks

- `next.config.mjs`: `basePath` reads from `NEXT_PUBLIC_BASE_PATH` env (empty by default). Used for subpath deployments.
- Build output lands in `out/` (static export).
- `vitest.config.ts` sets up `@` → `./src` alias matching tsconfig paths.

## Game mechanics

### Habits & XP
- **Habit**: name, completions count, `isDaily` flag. `MAX_HABITS=50`.
- **Daily habits** (↻): completions reset to 0 each day by 30s ticker.
- **Streak** 🔥: completing any habit sets `lastCompletionDate`. Consecutive day → streak++. Missed day → reset to 1.
- **XP**: +10 per habit completion. Level-up at `level × 100` XP. No crystals from completions.

### Plants (emoji-based)
- **16 plant types** in `plants.ts` (grass, tree, daffodil, tulip, sunflower, rose, hibiscus, oryzasativa, cherryblossom, palmtree, hyacinth, mushroom, evergreen, clover4, cactus, bamboo). Each has: `cost`, `growHours`, `emoji`, `size`, `rarity` (1–5), `canPlant(achievements)`. Names and rarities are in Russian.
- **Model**: `Plant { id, type, plantedAt, growthLevel }`. No `variant`, no `color`, no sprite images.
- **Growth levels** (1–3): L1 instant (shows emoji, scale-75, saturate 50%). L2 costs `cost×1.4` 💎, grows `growHours×2` hours. L3 costs `cost×2` 💎, grows `growHours×4` hours. During growth: shows 🌱 sprout + progress bar.
- **Inventory max**: 99. Plant cost varies by type (5–100 💎).
- **Refund**: deleting a plant returns base cost + sum of upgrade costs.
- **Re-render ticker**: `setInterval` every 30s for growth progress and daily resets.

### Achievements
- **15 achievements** in `achievements.ts`. Each: emoji, name, condition, progress counter, reward (crystals or plant).
- **Status flow**: `locked` → `unlocked` (auto-detected after state changes) → `claimed` (user clicks button).
- **Plant unlocks**: each plant type is locked behind a specific achievement (e.g. tulip requires `5ticks`, cactus requires `cactus`). Only `grass` is always available.
- **Flower rewards**: some achievements (cherryblossom, bamboo, clover4, cactus) give a plant directly to inventory. Uses achievement `id` as plant `type`.
- **Crystals**: earned only through achievement claims (habit completions give 0 crystals).

### Crystals (💎)
- Earned via achievement claims only.
- Spent on: buying plants, upgrading growth levels.
- Refunded on plant deletion.

## Key conventions

- Path alias `@/*` maps to `./src/*` (tsconfig paths and vitest.config.ts).
- All components and `page.tsx` are `"use client"`. `layout.tsx` is the only server component (runs at build time only).
- `useGameState` is the single state owner. Components receive data/callbacks as props.
- `useGameState` auto-saves to localStorage on state change (guarded by `loaded` flag).
- `migrateIfNeeded()` handles: old sprite-based saves → emoji-based, old variant=`"tree_1"` → type=`"grass"`, old `upgrades` → `growthLevel`, adds missing `achievements` array.
- `next/image` is no longer used anywhere — all plants are emoji-based.

## Data model quirks

- `Habit.id` and `Plant.id` generated via `crypto.randomUUID()`.
- Deleting a plant sets its garden slot to `null` (array stays length 36).
- `levelUp` is a transient timer-based React state flag — triggers Confetti for ~2.5s.
- `floatTexts`/`showFloat` in the hook are unused dead code.
- Mute state persisted separately under `habbittodo_mute` key.
- Haptic feedback: `navigator.vibrate(10)` on complete, `vibrate([15,30,15])` on level-up.

## Mobile UX

- Header: title hidden on mobile, XP bar as full-width strip below header.
- Bottom nav (mobile only): 💎 balance + 🛒 Shop (scrolls to section) + 🏆 Achievements (opens modal). Badge on 🏆 shows count of claimable achievements.
- Habits: swipe right → complete, swipe left → delete prompt. Bigger buttons (32–36px).
- Garden: long-press (500ms) selects cell. Cells 96px tall. Upgrade indicator `⬆cost`. 🏆 button top-right opens achievements modal with claimable-count badge.
- Shop: horizontal carousel grouped by rarity tier.

## ESLint

- Pinned to eslint@8.57.1 + eslint-config-next@14 — do NOT upgrade to eslint 9, Next.js 14 is incompatible.
- Config in `.eslintrc.json`: extends `next/core-web-vitals`.
