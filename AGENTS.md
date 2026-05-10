# AGENTS.md

## Project overview

Next.js 14 App Router + TypeScript strict + Tailwind CSS 3. Static export (`output: "export"`) — no server at runtime.
Single client-side page, no API routes, no database. Russian-language UI. Inter font via `next/font/google`.
shadcn/ui (`Sheet`, `Popover`, `Button`) via `@base-ui/react`. `components.json` is the shadcn config.
Package manager: `bun` (`bun.lock` committed). `npm run <script>` also works.

## Commands

```bash
npm run dev           # dev server on localhost:3000
npm run build         # production build → out/
npm run test          # vitest (single run)
npm run test:watch    # vitest (watch mode)
npm run lint          # ESLint (Next.js built-in config)
npx tsc --noEmit      # typecheck (no separate check script)
```

## Architecture

```
src/
├── app/
│   ├── layout.tsx       # ONLY server component (no "use client"), Inter font + Russian metadata
│   ├── page.tsx          # single page, wires everything, bottom nav on mobile
│   └── globals.css       # @tailwind directives only + dark gradient background
├── components/
│   ├── ui/               # shadcn wrappers: button.tsx, popover.tsx, sheet.tsx
│   ├── Garden.tsx        # 6×6 grid (MAX_PLANTS=36), long-press select, Popover (desktop) / Sheet (mobile) detail
│   ├── Plant.tsx          # emoji-only (🌱 sprout while growing, plant emoji when grown), scale/saturate per level
│   ├── HabitList.tsx      # swipe-right=complete, swipe-left=delete, rename, toggle daily (↻), 3 sort modes
│   ├── AddHabitForm.tsx   # inline/modal (embedded prop), max 40 chars
│   ├── ShopSheet.tsx      # shadcn Sheet side="bottom" on mobile, plant catalog grouped by rarity tier
│   ├── XPBar.tsx          # level badge + XP progress bar
│   ├── Confetti.tsx       # particle overlay on level-up (~2.5s)
│   ├── HelpModal.tsx      # first-visit tutorial (localStorage: "habbittodo_help_seen")
│   └── AchievementPanel.tsx # 15 achievements grid, progress bars, claim button
├── hooks/
│   └── useGameState.ts    # single state owner — habits, plants, XP, crystals, streak, achievements, mute, migrateIfNeeded
├── lib/
│   ├── types.ts           # Habit, Plant, GameState, AchievementDef, constants (MAX_HABITS=50, MAX_PLANTS=36, XP_PER_COMPLETION=10)
│   ├── plants.ts          # 16 PLANT_TYPES, RARITY_LEVELS (1–5), GROWTH_LEVELS (1–3), SPROUT_EMOJI="🌱"
│   ├── gameLogic.ts       # getXPForLevel, addXP, getPlantGrowth, getPlantScaleSaturate, formatTimeRemaining
│   ├── achievements.ts    # 15 ACHIEVEMENTS, evaluateAchievements, initAchievementStates
│   ├── storage.ts         # localStorage under "habbittodo_save"
│   ├── sound.ts           # Web Audio API: plant, complete, delete, levelUp
│   └── utils.ts           # cn() helper (clsx + tailwind-merge)
tests/
└── gameLogic.test.ts      # vitest tests
```

## Build/deploy quirks

- `next.config.mjs`: `basePath` from `NEXT_PUBLIC_BASE_PATH` env (empty by default). Static export to `out/`.
- `vitest.config.ts`: aliases `@` → `./src` matching tsconfig paths.
- shadcn init overwrites `globals.css` — restore to `@tailwind` directives only. Do NOT import `tw-animate-css` or `shadcn/tailwind.css` (Tailwind 3 incompatible), even though `tw-animate-css` is in `package.json` (pulled by shadcn init).
- `package.json` contains `shadcn` CLI. To add shadcn components: `npx shadcn add <name>`.

## Key conventions

- `@/*` → `./src/*` (tsconfig paths + vitest). Import order: `@/lib/*`, `@/hooks/*`, `@/components/*`.
- `layout.tsx` is the ONLY server component. Everything else is `"use client"`.
- `useGameState` is the single state owner. All data flows down as props, callbacks flow up.
- `useGameState` auto-saves to localStorage on state change (guarded by `loaded` flag).
- `next/image` is NOT used — all plants are emoji strings.
- `GardenCell` is a `<div role="button" tabIndex={-1}>` (NOT `<button>`) — avoids nesting inside `PopoverTrigger`'s `<button>`.

## Data model

- `Habit`: `{ id, name, completions, createdAt, isDaily }`. `MAX_HABITS=50`.
- `Plant`: `{ id, type, plantedAt, growthLevel }`. Array of 36 slots (null = empty). No variant/color/sprites.
- `AchievementState`: `{ id, status }` where status = `locked` | `unlocked` | `claimed`.
- `GameState`: `{ xp, level, crystals, habits, plants, streak, lastCompletionDate, lastResetDate, achievements }`.
- IDs via `crypto.randomUUID()`.
- `levelUp` is a transient React state flag — triggers Confetti for ~2.5s, then resets.
- Mute state persisted separately under `habbittodo_mute`.
- Haptic: `navigator.vibrate(10)` on complete, `vibrate([15,30,15])` on level-up.

## Migration

`migrateIfNeeded()` in `useGameState.ts` handles legacy saves:
- Old sprite-based saves → emoji-based
- Old `variant="tree_1"` → `type="grass"`
- Old `upgrades` → `growthLevel`
- Old inventory array → auto-plants into first empty garden slots
- Adds missing `achievements` array, removes `inventory` key

## Game mechanics (high-level)

- **XP**: +10 per habit completion. Level-up at `level × 100` XP. Crystals are NOT earned from completions.
- **Daily habits** (↻): completions reset to 0 each day by 30s ticker.
- **Streak** 🔥: consecutive days → streak++. Missed day → reset to 1.
- **Growth**: L1 instant (scale-75, saturate 50%). L2 costs `cost×1.4`, grows `growHours×2`. L3 costs `cost×2`, grows `growHours×4`. Shows 🌱 + progress bar during growth.
- **Plant unlocks**: each type locked behind a specific achievement. Only `grass` is always available.
- **Crystals**: earned only from achievement claims. Spent on buying plants and upgrading. Refunded on deletion.
- **Flower rewards**: certain achievements auto-plant into first empty slot (uses achievement `id` as plant `type`).
- **Re-render**: `setInterval` every 30s for growth progress and daily habit resets.

## ESLint

- Pinned to eslint@8.57.1 + eslint-config-next@14. Do NOT upgrade to eslint 9 — Next.js 14 is incompatible.
- Config: `.eslintrc.json` extends `next/core-web-vitals`.
