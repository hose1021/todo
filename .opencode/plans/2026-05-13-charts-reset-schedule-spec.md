# Spec: Monthly Charts, Reset, Weekly Schedule

Date: 2026-05-13

## Overview

Three features: (1) monthly/weekly/yearly completion chart per habit, (2) undo last completion, (3) weekly day-of-week scheduling replacing the `isDaily` boolean.

---

## 1. Monthly Summary Chart

### Data model

Add `completionHistory: string[]` to `Habit`. Each element is `"YYYY-MM-DD"`. On completion, append today's date. On reset, remove the last occurrence of today's date. On habit deletion, the array is deleted with the habit.

```ts
export interface Habit {
  id: string;
  name: string;
  completions: number;
  completionHistory: string[];   // NEW
  createdAt: number;
  activeDays: number[];          // replaces isDaily (see section 3)
}
```

### Component: `HabitChart.tsx`

- **Trigger**: button in `HabitRow` — Tabler icon `chart-bar` (from `@tabler/icons-react`), placed left of the rename button.
- **Dialog**: shadcn `Dialog` with `DialogContent`. Title: habit name. Close button: built-in `DialogClose` (X icon).
- **Period toggle**: three buttons «Неделя / Месяц / Год». Active button gets accent color.
- **Chart**: pure CSS bar chart — no external library.
  - Week: 7 bars (Пн–Вс), label = day abbreviation. Current week only.
  - Month: up to 31 bars, label = day number. Current month only.
  - Year: 12 bars (Янв–Дек), label = month abbreviation. Current year only.
  - Bar height = `completionHistory` count for that period segment × `(100 / segmentLength)`. Filled bar color: `#4CAF50`, empty segment: subtle grid line at `#2a3440`.
- **No data state**: «Нет данных за этот период» if `completionHistory` is empty.

### Import

`@tabler/icons-react` for `IconChartBar`.

---

## 2. Reset Option

### UI

- After `completeHabit(id)`, the checkmark button (✓) is replaced by undo button (↩, Tabler `arrow-back-up`) for 4 seconds.
- Clicking undo calls `resetHabit(id)`.
- After 4 seconds (or on any other action), the button returns to normal ✓ state.
- A local `undoingId: string | null` state in `HabitList` controls which habit is in undo mode.

### `resetHabit(id)` callback

Mutates state:

1. Decrement `completions` by 1 for the target habit (clamped to ≥0).
2. Remove the last occurrence of today's date from `completionHistory`.
3. Subtract `XP_PER_COMPLETION` (10) from `xp`. Recompute level: `while (xp < 0 && level > 1) { xp += getXPForLevel(level - 1); level--; }`. Level minimum is 1.
4. Streak: if after removing today's entry there are no completions for today, decrement `streak` by 1 (min 1 if was >0).
5. Re-evaluate achievements (some may re-lock if thresholds drop below).
6. Sound: none (silent undo).
7. Save to Supabase/localStorage as usual.

### Constraints

- Can only undo completions made today (check that `completionHistory` contains today's date).
- If today's date is not in `completionHistory`, `resetHabit` is a no-op.

---

## 3. Weekly Scheduling

### Data model

Replace `isDaily: boolean` with `activeDays: number[]` where values are `0..6` (0=Sun, 1=Mon, ..., 6=Sat). Empty array = no schedule (completions never auto-reset).

### Supabase schema

Column `is_daily BOOLEAN` → `active_days SMALLINT[]`. Add `completion_history JSONB DEFAULT '[]'::jsonb`.

### AddHabitForm changes

Below the name input, add a row of 7 toggle buttons:

```
[Пн] [Вт] [Ср] [Чт] [Пт] [Сб] [Вс]
```

- Selected: `bg-[#d5a63d] text-[#1f2630]`
- Unselected: `bg-[#242f3a] text-[#596675] border border-[#3a4653]`
- Default: none selected (empty schedule).

### HabitRow changes

- Replace the «день» badge with day abbreviations: «Пн Вт Ср Чт Пт Сб Вс» where each active day is accent-colored (`text-[#8ab4f8]`), inactive days are muted (`text-[#3a4653]`).
- If `activeDays` is empty, show nothing.
- The `↻` button opens a `Popover` with 7 toggle buttons (same as AddHabitForm) for quick editing.

### Daily reset logic (`useDailyReset.ts`)

Change from:
```
h.isDaily ? { ...h, completions: 0 } : h
```
To:
```
h.activeDays.includes(todayDayOfWeek) ? { ...h, completions: 0 } : h
```

Where `todayDayOfWeek = new Date().getDay()` (0=Sun..6=Sat).

### Migration

Existing habits:
- `isDaily: true` → `activeDays: [0, 1, 2, 3, 4, 5, 6]` (all days)
- `isDaily: false` → `activeDays: []` (empty)
- `completionHistory` → `[]` for all existing habits

### toggleDailyHabit removal

The `toggleDailyHabit` callback is replaced by `setHabitActiveDays(id, activeDays)`.

---

## 4. Files changed

| File | Change |
|---|---|
| `src/lib/types.ts` | Add `completionHistory`, replace `isDaily` with `activeDays` |
| `src/lib/supabase.ts` | Schema mapping: `active_days`, `completion_history` |
| `src/hooks/useCloudState.ts` | Add `resetHabit`, `setHabitActiveDays`; update `completeHabit`, daily reset |
| `src/hooks/useGameState.ts` | Same as above for dev mode |
| `src/hooks/useDailyReset.ts` | Check `activeDays` instead of `isDaily` |
| `src/components/HabitList.tsx` | Undo UI (4s), chart button, day badges, active-days popover |
| `src/components/AddHabitForm.tsx` | 7 day-toggle buttons |
| `src/components/HabitChart.tsx` | **New** — bar chart + Dialog + period toggle |
| `src/app/page.tsx` | Wire `resetHabit`, `setHabitActiveDays`; remove `toggleDailyHabit` |
| `sql/schema.sql` | Add `completion_history`, rename `is_daily` → `active_days` |
| `package.json` | Add `@tabler/icons-react` dependency |

---

## 5. States & edge cases

### Chart
- Empty history: «Нет данных»
- Single completion: one colored bar, rest grey
- Period change: recompute from `completionHistory`
- Habit created mid-period: bars before `createdAt` show as "N/A" (different shade or hidden)

### Reset
- No completions today: button doesn't appear
- Level 1 with 0 XP: XP stays at 0 (clamped)
- Streak reset: if today was the only completion, streak → previous day's streak or 1

### Weekly schedule
- `activeDays: []` → habit never resets
- Today is inactive → completions persist from yesterday
- All 7 days selected → equivalent to old `isDaily: true`
