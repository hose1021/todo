# AGENTS.md

## Project overview

Next.js 16 (Turbopack default) + React 19 + TypeScript 6 + Tailwind CSS 4. Static export (`output: "export"`) — no server at runtime.
Single client-side page with auth gate. Supabase for cloud persistence, auth, and leaderboard (4 tables, RLS). Russian-language UI. Inter font via `next/font/google`.
shadcn/ui (`Sheet`, `Popover`, `Button`) via `@base-ui/react`. `components.json` is the shadcn config.
Package manager: `bun` (`bun.lock` committed). `npm run <script>` also works.

## Commands

```bash
npm run dev           # dev server on localhost:3000
npm run build         # production build → out/
npm run test          # vitest (single run)
npm run test:watch    # vitest (watch mode)
npm run lint          # ESLint (flat config: eslint.config.mjs)
npx tsc --noEmit      # typecheck (no separate check script)
```

## Environment variables

All three are `NEXT_PUBLIC_*` (bundled into the static export at build time). `.env` and `.env.local` are gitignored.

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key
- `NEXT_PUBLIC_SUPABASE_JWT_SECRET` — HS256 secret for custom JWT signing (client-side; used for RLS)

Database schema: `sql/schema.sql` — run once in Supabase SQL Editor to create tables, indexes, and RLS policies.

## Architecture

```
src/
├── app/
│   ├── layout.tsx       # ONLY server component (no "use client"), Inter font + Russian metadata
│   ├── page.tsx          # single page, wires everything, bottom nav on mobile
│   └── globals.css       # @import 'tailwindcss' + @theme (custom keyframes) + @layer base (dark theme, scrollbar, body)
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
│   ├── AchievementPanel.tsx # 15 achievements grid, progress bars, claim button
│   ├── LoginScreen.tsx    # login key entry, local data migration prompt
│   ├── LeaderboardPanel.tsx # leaderboard from Supabase, view other players
│   └── UserGarden.tsx     # view another player's garden (read-only 6×6 grid)
├── hooks/
│   ├── useCloudState.ts  # primary state hook (Supabase-backed), same API as useGameState
│   ├── useAuth.ts        # login key auth, JWT session management
│   └── useGameState.ts    # kept for migrateIfNeeded() — converts old local saves to current format
├── lib/
│   ├── types.ts           # Habit, Plant, GameState, AchievementDef, constants (MAX_HABITS=50, MAX_PLANTS=36, XP_PER_COMPLETION=10)
│   ├── plants.ts          # 16 PLANT_TYPES, RARITY_LEVELS (1–5), GROWTH_LEVELS (1–3), SPROUT_EMOJI="🌱"
│   ├── gameLogic.ts       # getXPForLevel, addXP, getPlantGrowth, getPlantScaleSaturate, formatTimeRemaining
│   ├── achievements.ts    # 15 ACHIEVEMENTS, evaluateAchievements, initAchievementStates
│   ├── storage.ts         # localStorage under "habbittodo_save"
│   ├── supabase.ts        # Supabase client + CRUD: fetchGameState, syncUserStats, saveHabits, savePlantAtSlot, saveAchievements, fetchLeaderboard, updateUsername
│   ├── auth.ts            # JWT signing (HS256 via Web Crypto), login key localStorage management
│   ├── sound.ts           # Web Audio API: plant, complete, delete, levelUp
│   └── utils.ts           # cn() helper (clsx + tailwind-merge)
tests/
└── gameLogic.test.ts      # vitest tests
sql/
└── schema.sql            # Supabase schema: users, habits, plants, achievements + RLS policies + indexes
```

## Build/deploy quirks

- `next.config.mjs`: `basePath` from `NEXT_PUBLIC_BASE_PATH` env (empty by default). Static export to `out/`.
- `turbopack.root` should be set to `import.meta.dirname` in `next.config.mjs` to avoid lockfile detection warnings when `package-lock.json` exists in a parent directory.
- `vitest.config.ts`: aliases `@` → `./src` matching tsconfig paths.
- Tailwind 4 uses `@tailwindcss/postcss` in `postcss.config.mjs` (not `tailwindcss`). No `autoprefixer` needed.
- shadcn init overwrites `globals.css` — restore to `@import "tailwindcss"` + `@theme` block. Do NOT import `tw-animate-css` or `shadcn/tailwind.css` (Tailwind 4 incompatible), even though `tw-animate-css` is in `package.json` (pulled by shadcn init).
- `package.json` contains `shadcn` CLI. To add shadcn components: `npx shadcn add <name>`.
- `next-env.d.ts` is auto-generated — it flips between `.next/dev/types/routes.d.ts` (after `dev`) and `.next/types/routes.d.ts` (after `build`). Ignore the churn; both are correct.

## Key conventions

- `@/*` → `./src/*` (tsconfig paths + vitest). Import order: `@/lib/*`, `@/hooks/*`, `@/components/*`.
- `layout.tsx` is the ONLY server component. Everything else is `"use client"`.
- `useCloudState` is the primary state owner for logged-in users — same API as `useGameState` but persists to Supabase. `useGameState` only used for `migrateIfNeeded()` (local→cloud migration).
- `next/image` is NOT used — all plants are emoji strings.
- `GardenCell` is a `<div role="button" tabIndex={-1}>` (NOT `<button>`) — avoids nesting inside `PopoverTrigger`'s `<button>`.

## Auth

Custom JWT-based auth (no Supabase Auth service):

1. User enters a **login key** (freeform text password).
2. Client signs a **JWT** (HS256 via Web Crypto) using `NEXT_PUBLIC_SUPABASE_JWT_SECRET` — the JWT `sub` is a UUID, `role` = `authenticated`.
3. JWT is passed as `Authorization: Bearer <token>` via a custom `authFetch` wrapper in `supabase.ts`.
4. Supabase **RLS policies** use `auth.uid()` to enforce per-user row access.
5. Login key stored in localStorage under `habbittodo_login_key`.
6. First login **creates** a new user row (`createUser`). Subsequent logins **fetch** existing state (`fetchGameState`).
7. `page.tsx` gates rendering: `"checking"` → spinner, `"loggedOut"` → `LoginScreen`, `"loggedIn"` → main app.

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

- ESLint 10 flat config (`eslint.config.mjs`). `next lint` was removed in Next.js 16 — run `eslint .` directly.
- Config imports `@next/eslint-plugin-next` and uses `nextPlugin.configs["core-web-vitals"]` (flat config object).
- `eslint-config-next` is no longer needed — the plugin is a direct dev dependency.
- Ignores: `.next/` and `out/` are excluded in the config.
