# Monthly Charts + Reset + Weekly Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-habit period chart (Dialog), undo last completion (4s button), weekly day-of-week scheduling (replaces `isDaily`).

**Architecture:** `Habit.completionHistory: string[]` tracks per-day dates; `Habit.activeDays: number[]` replaces `isDaily`. New `HabitChart.tsx` renders pure-CSS bar chart in shadcn Dialog. New `resetHabit`/`setHabitActiveDays` callbacks. AddHabitForm gains 7 day-toggle buttons. HabitRow shows days, chart trigger, undo button.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, shadcn/ui Dialog/Popover, `@tabler/icons-react`.

---

### Task 1: Install @tabler/icons-react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependency**

```bash
bun add @tabler/icons-react
```

- [ ] **Step 2: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add @tabler/icons-react for chart and undo icons"
```

---

### Task 2: Update Habit type and add constants

**Files:**
- Modify: `src/lib/types.ts:1-7`

- [ ] **Step 1: Replace Habit interface**

```ts
export interface Habit {
  id: string;
  name: string;
  completions: number;
  completionHistory: string[];
  createdAt: number;
  activeDays: number[];
}
```

- [ ] **Step 2: Add DAY_LABELS constant at bottom of types.ts**

```ts
export const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
```

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | head -40
```
Expected: type errors in files that still reference `isDaily`. We fix those in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: replace isDaily with activeDays, add completionHistory to Habit"
```

---

### Task 3: Update useDailyReset for activeDays

**Files:**
- Modify: `src/hooks/useDailyReset.ts:8-17`

- [ ] **Step 1: Replace daily reset check**

```ts
import { GameState } from "@/lib/types";

const DAY_OF_WEEK = new Date().getDay();

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDailyResetState(state: GameState): GameState | null {
  const today = getToday();
  if (state.lastResetDate === today) return null;
  const dayOfWeek = new Date().getDay();
  return {
    ...state,
    lastResetDate: today,
    habits: state.habits.map((h) =>
      h.activeDays.includes(dayOfWeek) ? { ...h, completions: 0 } : h
    ),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useDailyReset.ts
git commit -m "feat: check activeDays instead of isDaily in daily reset"
```

---

### Task 4: Update supabase.ts for activeDays and completionHistory

**Files:**
- Modify: `src/lib/supabase.ts:64-71,88-96,189-197`

- [ ] **Step 1: Update HabitRow interface**

```ts
interface HabitRow {
  id: string;
  user_uid: string;
  name: string;
  completions: number;
  completion_history: string[];
  active_days: number[];
  created_at: number;
}
```

- [ ] **Step 2: Update rowToHabit**

```ts
function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    completions: row.completions,
    completionHistory: row.completion_history ?? [],
    createdAt: row.created_at,
    activeDays: row.active_days ?? [],
  };
}
```

- [ ] **Step 3: Update saveHabits row mapping**

```ts
export async function saveHabits(uid: string, habits: Habit[]): Promise<void> {
  const rows: HabitRow[] = habits.map((h) => ({
    id: h.id,
    user_uid: uid,
    name: h.name,
    completions: h.completions,
    completion_history: h.completionHistory,
    active_days: h.activeDays,
    created_at: h.createdAt,
  }));

  await getSupabase().from("habits").delete().eq("user_uid", uid);

  if (rows.length > 0) {
    await getSupabase().from("habits").insert(rows);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: wire active_days and completion_history columns in supabase"
```

---

### Task 5: Update useCloudState (addHabit, completeHabit, toggle→setActiveDays, add resetHabit)

**Files:**
- Modify: `src/hooks/useCloudState.ts:107-119,121-150,163-193,318-343`

- [ ] **Step 1: Update addHabit — default activeDays, completionHistory**

Replace `isDaily: false` with `completionHistory: [], activeDays: []`:

```ts
  const addHabit = useCallback((name: string, activeDays?: number[]) => {
    if (state.habits.length >= MAX_HABITS) return false;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      completions: 0,
      completionHistory: [],
      createdAt: Date.now(),
      activeDays: activeDays ?? [],
    };
    const newState = evaluateAchievements({ ...state, habits: [...state.habits, habit] });
    setState(newState);
    saveStateChanges(uid, newState);
    return true;
  }, [state, uid]);
```

- [ ] **Step 2: Update completeHabit — append to completionHistory**

Add `completionHistory` to the habit update:

```ts
  const completeHabit = useCallback((id: string) => {
    setState((s) => {
      const today = getToday();
      const habits = s.habits.map((h) => {
        if (h.id !== id) return h;
        const history = h.completionHistory.includes(today)
          ? h.completionHistory
          : [...h.completionHistory, today];
        return { ...h, completions: h.completions + 1, completionHistory: history };
      });
      const updated = addXP(s.xp, s.level, XP_PER_COMPLETION);
      let { streak, lastCompletionDate } = s;
      if (today !== lastCompletionDate) {
        if (lastCompletionDate === getYesterday()) {
          streak += 1;
        } else {
          streak = 1;
        }
        lastCompletionDate = today;
      }
      if (updated.leveledUp) {
        setTimeout(() => setLevelUp(true), 100);
        setTimeout(() => setLevelUp(false), 2500);
        playLevelUpSound();
        try { navigator.vibrate?.([15, 30, 15]); } catch { /* not supported */ }
      } else {
        playCompleteSound();
        try { navigator.vibrate?.(10); } catch { /* not supported */ }
      }
      const newState = evaluateAchievements({ ...s, habits, xp: updated.xp, level: updated.level, streak, lastCompletionDate });
      saveStateChanges(uid, newState);
      return newState;
    });
  }, [uid]);
```

- [ ] **Step 3: Replace toggleDailyHabit with setHabitActiveDays**

```ts
  const setHabitActiveDays = useCallback((id: string, activeDays: number[]) => {
    setState((s) => {
      const habits = s.habits.map((h) =>
        h.id === id ? { ...h, activeDays } : h
      );
      saveHabits(uid, habits).catch(() => {});
      return { ...s, habits };
    });
  }, [uid]);
```

- [ ] **Step 4: Add resetHabit callback**

```ts
  const resetHabit = useCallback((id: string) => {
    setState((s) => {
      const today = getToday();
      const targetHabit = s.habits.find((h) => h.id === id);
      if (!targetHabit) return s;
      if (!targetHabit.completionHistory.includes(today)) return s;

      const lastIdx = targetHabit.completionHistory.lastIndexOf(today);
      const newHistory = [
        ...targetHabit.completionHistory.slice(0, lastIdx),
        ...targetHabit.completionHistory.slice(lastIdx + 1),
      ];

      const habits = s.habits.map((h) => {
        if (h.id !== id) return h;
        return {
          ...h,
          completions: Math.max(0, h.completions - 1),
          completionHistory: newHistory,
        };
      });

      let { xp, level } = s;
      xp = Math.max(0, xp - XP_PER_COMPLETION);
      while (xp < 0 && level > 1) {
        xp += getXPForLevel(level - 1);
        level--;
      }

      let { streak } = s;
      const hasTodayCompletion = habits.some(
        (h) => h.completionHistory.includes(today),
      );
      if (!hasTodayCompletion && streak > 0) {
        streak = Math.max(1, streak - 1);
      }

      const newState = evaluateAchievements({ ...s, habits, xp, level, streak });
      saveStateChanges(uid, newState);
      return newState;
    });
  }, [uid]);
```

Need to import `getXPForLevel`:

```ts
import { addXP, getPlantGrowth, getXPForLevel } from "@/lib/gameLogic";
```

- [ ] **Step 5: Update return object**

Replace `toggleDailyHabit` with:

```ts
    setHabitActiveDays,
    resetHabit,
```

- [ ] **Step 6: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: errors referencing `isDaily` in other files (useGameState, HabitList, page.tsx). Fix in subsequent tasks.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useCloudState.ts
git commit -m "feat: add resetHabit, setHabitActiveDays, completionHistory tracking in useCloudState"
```

---

### Task 6: Update useGameState (same callbacks for dev mode)

**Files:**
- Modify: `src/hooks/useGameState.ts` (same sections as useCloudState)

- [ ] **Step 1: Update addHabit**

```ts
  const addHabit = useCallback((name: string, activeDays?: number[]) => {
    if (state.habits.length >= MAX_HABITS) return false;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      completions: 0,
      completionHistory: [],
      createdAt: Date.now(),
      activeDays: activeDays ?? [],
    };
    setState((s) => evaluateAchievements({ ...s, habits: [...s.habits, habit] }));
    return true;
  }, [state.habits.length]);
```

- [ ] **Step 2: Update completeHabit — append to completionHistory**

```ts
  const completeHabit = useCallback((id: string) => {
    setState((s) => {
      const today = getToday();
      const habits = s.habits.map((h) => {
        if (h.id !== id) return h;
        const history = h.completionHistory.includes(today)
          ? h.completionHistory
          : [...h.completionHistory, today];
        return { ...h, completions: h.completions + 1, completionHistory: history };
      });
      const updated = addXP(s.xp, s.level, XP_PER_COMPLETION);
      let { streak, lastCompletionDate } = s;
      if (today !== lastCompletionDate) {
        if (lastCompletionDate === getYesterday()) {
          streak += 1;
        } else {
          streak = 1;
        }
        lastCompletionDate = today;
      }
      if (updated.leveledUp) {
        setTimeout(() => setLevelUp(true), 100);
        setTimeout(() => setLevelUp(false), 2500);
        playLevelUpSound();
        try { navigator.vibrate?.([15, 30, 15]); } catch { /* not supported */ }
      } else {
        playCompleteSound();
        try { navigator.vibrate?.(10); } catch { /* not supported */ }
      }
      return evaluateAchievements({ ...s, habits, xp: updated.xp, level: updated.level, streak, lastCompletionDate });
    });
  }, []);
```

- [ ] **Step 3: Replace toggleDailyHabit with setHabitActiveDays**

```ts
  const setHabitActiveDays = useCallback((id: string, activeDays: number[]) => {
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, activeDays } : h
      ),
    }));
  }, []);
```

- [ ] **Step 4: Add resetHabit callback**

```ts
  const resetHabit = useCallback((id: string) => {
    setState((s) => {
      const today = getToday();
      const targetHabit = s.habits.find((h) => h.id === id);
      if (!targetHabit) return s;
      if (!targetHabit.completionHistory.includes(today)) return s;

      const lastIdx = targetHabit.completionHistory.lastIndexOf(today);
      const newHistory = [
        ...targetHabit.completionHistory.slice(0, lastIdx),
        ...targetHabit.completionHistory.slice(lastIdx + 1),
      ];

      const habits = s.habits.map((h) => {
        if (h.id !== id) return h;
        return {
          ...h,
          completions: Math.max(0, h.completions - 1),
          completionHistory: newHistory,
        };
      });

      let { xp, level } = s;
      xp = Math.max(0, xp - XP_PER_COMPLETION);
      while (xp < 0 && level > 1) {
        xp += getXPForLevel(level - 1);
        level--;
      }

      let { streak } = s;
      const hasTodayCompletion = habits.some(
        (h) => h.completionHistory.includes(today),
      );
      if (!hasTodayCompletion && streak > 0) {
        streak = Math.max(1, streak - 1);
      }

      return evaluateAchievements({ ...s, habits, xp, level, streak });
    });
  }, []);
```

Need import: check that `getXPForLevel` is imported in useGameState.ts:

```ts
import { addXP, getPlantGrowth, getXPForLevel } from "@/lib/gameLogic";
```

- [ ] **Step 5: Update return object**

Replace `toggleDailyHabit` with:

```ts
    setHabitActiveDays,
    resetHabit,
```

- [ ] **Step 6: Update migration in migrateIfNeeded**

In `normalizeMigrationResult` (or its callers), replace `isDaily` handling with `activeDays`. In `migrateOldHabitFormat`, change:

```
isDaily: false,
```
to:
```
activeDays: [],
completionHistory: [],
```

And in `normalizeMigrationResult`:

```ts
function normalizeMigrationResult(result: GameState): GameState {
  const habits = (result.habits ?? []).map((h) => ({
    ...h,
    activeDays: (h as unknown as Record<string, unknown>).activeDays ?? ((h as unknown as Record<string, unknown>).isDaily ? [0,1,2,3,4,5,6] : []),
    completionHistory: (h as unknown as Record<string, unknown>).completionHistory ?? [],
  }));
  // remove isDaily property
  const cleanHabits = habits.map(({ isDaily: _, ...rest }: Habit & { isDaily?: boolean }) => rest);

  let achievements = result.achievements;
  if (!achievements || !Array.isArray(achievements) || achievements.length === 0) {
    achievements = initAchievementStates();
  }

  const { inventory: _inventory, ...cleanResult } = result as unknown as Record<string, unknown>;
  return { ...cleanResult, habits: cleanHabits, achievements } as unknown as GameState;
}
```

Actually, simpler: just map in normalizeMigrationResult:

```ts
function normalizeMigrationResult(result: GameState): GameState {
  const habits = (result.habits ?? []).map((h) => {
    const raw = h as unknown as Record<string, unknown>;
    return {
      id: h.id,
      name: h.name,
      completions: h.completions ?? 0,
      completionHistory: (raw.completionHistory ?? []) as string[],
      createdAt: h.createdAt ?? Date.now(),
      activeDays: raw.isDaily ? [0, 1, 2, 3, 4, 5, 6] : ((raw.activeDays ?? []) as number[]),
    };
  });

  let achievements = result.achievements;
  if (!achievements || !Array.isArray(achievements) || achievements.length === 0) {
    achievements = initAchievementStates();
  }

  const { inventory: _inventory, ...cleanResult } = result as unknown as Record<string, unknown>;
  return { ...cleanResult, habits, achievements } as unknown as GameState;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "feat: add resetHabit, setHabitActiveDays, completionHistory, migration in useGameState"
```

---

### Task 7: Build HabitChart component

**Files:**
- Create: `src/components/HabitChart.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import { useState } from "react";
import { Habit } from "@/lib/types";
import { DAY_LABELS } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconChartBar } from "@tabler/icons-react";

type Period = "week" | "month" | "year";

const MONTH_LABELS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface HabitChartProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getWeekDates(): { label: string; date: string }[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: WEEK_DAYS[i],
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    };
  });
}

function getMonthDates(): { label: string; date: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }).map((_, i) => ({
    label: String(i + 1),
    date: `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
  }));
}

function getYearMonths(): { label: string; months: { label: string; date: string }[] }[] {
  const now = new Date();
  const year = now.getFullYear();

  return Array.from({ length: 12 }).map((_, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const months = Array.from({ length: daysInMonth }).map((_, day) => ({
      label: String(day + 1),
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}`,
    }));
    return {
      label: MONTH_LABELS[month],
      months,
    };
  });
}

export default function HabitChart({ habit, open, onOpenChange }: HabitChartProps) {
  const [period, setPeriod] = useState<Period>("month");

  let segments: { label: string; completed: boolean }[] = [];

  if (period === "week") {
    segments = getWeekDates().map((d) => ({
      label: d.label,
      completed: habit.completionHistory.includes(d.date),
    }));
  } else if (period === "month") {
    segments = getMonthDates().map((d) => ({
      label: d.label,
      completed: habit.completionHistory.includes(d.date),
    }));
  } else {
    segments = getYearMonths().map((m) => ({
      label: m.label,
      completed: m.months.some((d) => habit.completionHistory.includes(d.date)),
    }));
  }

  const hasData = habit.completionHistory.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">{habit.name}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-3">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-black uppercase transition-all ${
                period === p
                  ? "bg-[#d5a63d] text-[#1f2630]"
                  : "bg-[#242f3a] text-[#596675] border border-[#3a4653] hover:text-[#91a0af]"
              }`}
            >
              {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
            </button>
          ))}
        </div>

        {!hasData ? (
          <p className="text-center text-sm text-[#657486] py-8">
            Нет данных за этот период
          </p>
        ) : (
          <div className="flex items-end gap-px h-32 w-full">
            {segments.map((seg, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: seg.completed ? "100%" : "4px",
                    backgroundColor: seg.completed ? "#4CAF50" : "#2a3440",
                    minHeight: seg.completed ? "8px" : "4px",
                  }}
                />
                {segments.length <= 12 && (
                  <span className="text-[9px] text-[#596675] mt-1">
                    {seg.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ChartTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#596675] transition-colors hover:bg-[#2a3540] hover:text-[#8795a4]"
      title="Статистика"
    >
      <IconChartBar size={16} />
    </button>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/HabitChart.tsx
git commit -m "feat: add HabitChart component with week/month/year bar chart"
```

---

### Task 8: Update AddHabitForm with day-of-week toggles

**Files:**
- Modify: `src/components/AddHabitForm.tsx:1-138`

- [ ] **Step 1: Add activeDays state and day toggle UI**

Change `onAdd` prop to accept `activeDays`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MAX_HABITS, DAY_LABELS } from "@/lib/types";

interface AddHabitFormProps {
  onAdd: (name: string, activeDays: number[]) => boolean;
  currentCount: number;
  embedded?: boolean;
  onClose?: () => void;
}

export default function AddHabitForm({
  onAdd,
  currentCount,
  embedded = true,
  onClose,
}: AddHabitFormProps) {
  const [open, setOpen] = useState(!embedded);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFull = currentCount >= MAX_HABITS;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Введи название");
      return;
    }

    if (trimmed.length > 40) {
      setError("Максимум 40 символов");
      return;
    }

    const ok = onAdd(trimmed, activeDays);

    if (!ok) {
      setError("Слишком много привычек");
      return;
    }

    setName("");
    setActiveDays([]);
    setError("");
    setOpen(false);
    onClose?.();
  };

  const handleCancel = () => {
    setOpen(false);
    setName("");
    setActiveDays([]);
    setError("");
    onClose?.();
  };

  const toggleDay = (dayIndex: number) => {
    setActiveDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  if (!embedded && isFull) return null;

  if (embedded && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isFull}
        className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition-all ${
          isFull
            ? "cursor-not-allowed border-[#323b46] bg-[#242b34] text-[#596675]"
            : "border-[#456052] bg-[#2e4442] text-[#dcf7e7] hover:bg-[#36514d] active:scale-[0.97]"
        }`}
      >
        {isFull ? `${currentCount}/${MAX_HABITS}` : "+ Добавить привычку"}
      </button>
    );
  }

  const form = (
    <div className="rounded-lg border border-[#33404d] bg-[#1b222c] p-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") handleCancel();
          }}
          placeholder="Название привычки"
          maxLength={40}
          className="min-w-0 flex-1 rounded-md border border-[#3a4653] bg-[#141b24] px-3 py-1.5 text-xs font-bold text-[#e5edf3] outline-hidden transition-all placeholder:text-[#657486] focus:border-[#607d73] focus:ring-2 focus:ring-[#2f4a45]"
        />

        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-md bg-[#d5a63d] px-3 py-1.5 text-xs font-black text-[#1f2630] transition-all hover:bg-[#edbe52] active:scale-95"
        >
          Добавить
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md border border-[#3a4653] bg-[#242f3a] px-2.5 py-1.5 text-xs font-black text-[#8d9ba8] transition-all hover:bg-[#2b3845]"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 flex gap-1 flex-wrap">
        {DAY_LABELS.map((label, i) => {
          const isActive = activeDays.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`rounded-md px-2 py-1 text-[10px] font-black transition-all ${
                isActive
                  ? "bg-[#d5a63d] text-[#1f2630]"
                  : "bg-[#242f3a] text-[#596675] border border-[#3a4653]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-1.5 px-1 text-[10px] font-bold text-[#ff8d8d]">
          {error}
        </p>
      )}
    </div>
  );

  if (embedded) return form;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={handleCancel}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {form}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AddHabitForm.tsx
git commit -m "feat: add day-of-week toggle buttons to AddHabitForm"
```

---

### Task 9: Update HabitList — undo button, chart trigger, activeDays display, popover

**Files:**
- Modify: `src/components/HabitList.tsx` (props interface, HabitRowProps, HabitRow render)

- [ ] **Step 1: Update HabitListProps and HabitRowProps**

Replace `onToggleDaily` with `onSetActiveDays`, add `onReset`, `onChartOpen`:

```tsx
interface HabitListProps {
  habits: Habit[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => boolean;
  onSetActiveDays: (id: string, activeDays: number[]) => void;
  onReset: (id: string) => void;
  onChartOpen: (habit: Habit) => void;
  onAddHabit?: () => void;
  habitsFull?: boolean;
}
```

Update HabitRowProps — replace `onToggleDaily` with `onSetActiveDays`, add `onReset`:

```tsx
interface HabitRowProps {
  habit: Habit;
  isSelected: boolean;
  isEditing: boolean;
  isConfirming: boolean;
  editName: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  floats: Record<string, boolean>;
  onSelect: () => void;
  onStartEdit: () => void;
  onEditNameChange: (value: string) => void;
  onSubmitRename: () => void;
  onCancelEdit: () => void;
  onComplete: () => void;
  onSetActiveDays: (days: number[]) => void;
  onReset: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onChartOpen: () => void;
}
```

- [ ] **Step 2: Update HabitList component — wire new props**

Update the destructuring:

```tsx
export default function HabitList({
  habits,
  selectedId,
  onSelect,
  onComplete,
  onDelete,
  onRename,
  onSetActiveDays,
  onReset,
  onChartOpen,
  onAddHabit,
  habitsFull,
}: HabitListProps) {
```

Update `completeWithFloat` to add undo support:

```tsx
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const completeWithFloat = useCallback(
    (id: string) => {
      setFloats((float) => ({ ...float, [id]: true }));
      setTimeout(
        () =>
          setFloats((float) => {
            const next = { ...float };
            delete next[id];
            return next;
          }),
        1200,
      );
      onComplete(id);
      setUndoingId(id);
      setTimeout(() => setUndoingId(null), 4000);
    },
    [onComplete],
  );
```

Update the render of HabitRow to pass new props:

```tsx
            <HabitRow
              key={habit.id}
              habit={habit}
              isSelected={isSelected}
              isEditing={isEditing}
              isConfirming={isConfirming}
              editName={editName}
              editInputRef={editInputRef}
              floats={floats}
              onSelect={() => {
                if (!isEditing && !isConfirming) {
                  onSelect(isSelected ? null : habit.id);
                }
              }}
              onStartEdit={() => startEdit(habit)}
              onEditNameChange={setEditName}
              onSubmitRename={submitRename}
              onCancelEdit={cancelEdit}
              onComplete={() => completeWithFloat(habit.id)}
              onSetActiveDays={(days) => onSetActiveDays(habit.id, days)}
              onReset={() => {
                onReset(habit.id);
                setUndoingId(null);
              }}
              onDelete={() => {
                onDelete(habit.id);
                setConfirmDeleteId(null);
              }}
              onConfirmDelete={() => setConfirmDeleteId(habit.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onChartOpen={() => onChartOpen(habit)}
              isUndoing={undoingId === habit.id}
            />
```

- [ ] **Step 3: Update HabitRow — add undo, chart, activeDays UI**

Add new props to destructuring:

```tsx
function HabitRow({
  habit,
  isSelected,
  isEditing,
  isConfirming,
  editName,
  editInputRef,
  floats,
  onSelect,
  onStartEdit,
  onEditNameChange,
  onSubmitRename,
  onCancelEdit,
  onComplete,
  onSetActiveDays,
  onReset,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onChartOpen,
  isUndoing,
}: HabitRowProps & { isUndoing?: boolean }) {
```

Add activeDays popover state:

```tsx
  const { swiped, handleTouchStart, handleTouchEnd } = useHabitSwipe({
    isDisabled: isEditing || isConfirming,
    onSwipeRight: onComplete,
    onSwipeLeft: onConfirmDelete,
  });

  const [showDaysPopover, setShowDaysPopover] = useState(false);
```

Replace the `isDaily` badge (lines 326-332) with activeDays display:

```tsx
            <div className="text-[11px] font-semibold text-[#697888]">
              {habit.completions} раз
              {habit.activeDays.length > 0 && (
                <span className="ml-1 inline-flex gap-0.5">
                  {DAY_LABELS.map((label, i) => (
                    <span
                      key={i}
                      className={
                        habit.activeDays.includes(i)
                          ? "text-[#8ab4f8]"
                          : "text-[#3a4653]"
                      }
                    >
                      {label}
                    </span>
                  ))}
                </span>
              )}
            </div>
```

Replace the ↻ button (lines 336-349) with Popover for active days:

```tsx
          <Popover open={showDaysPopover} onOpenChange={setShowDaysPopover}>
            <PopoverTrigger>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDaysPopover(true);
                }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm transition-colors ${
                  habit.activeDays.length > 0
                    ? "bg-[#3a4a6e] text-[#a8c8ff] hover:bg-[#4a5a7e]"
                    : "text-[#3a4653] hover:text-[#8795a4]"
                }`}
                title="Расписание"
              >
                ↻
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {DAY_LABELS.map((label, i) => {
                  const isActive = habit.activeDays.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = isActive
                          ? habit.activeDays.filter((d) => d !== i)
                          : [...habit.activeDays, i].sort();
                        onSetActiveDays(next);
                      }}
                      className={`rounded-md px-2 py-1 text-[10px] font-black transition-all ${
                        isActive
                          ? "bg-[#d5a63d] text-[#1f2630]"
                          : "bg-[#242f3a] text-[#596675] border border-[#3a4653]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
```

Add ChartTrigger button before the ↻ button:

```tsx
          <ChartTrigger onClick={onChartOpen} />
```

Replace the complete button (lines 351-374) with undo-aware button:

```tsx
          {isUndoing ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#c0392b] text-white shadow-xs transition-all hover:bg-[#e74c3c] active:scale-90"
              title="Отменить выполнение"
            >
              <IconArrowBackUp size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#31453e] text-[#a8e8bd] shadow-xs transition-all hover:bg-[#3f674d] active:scale-90"
              title="Выполнить"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="3,8 7,12 13,4" />
              </svg>
              {floats[habit.id] && (
                <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-[#a8e8bd] animate-float-up">
                  +{XP_PER_COMPLETION} XP
                </span>
              )}
            </button>
          )}
```

Need imports at top:

```tsx
import { DAY_LABELS } from "@/lib/types";
import { ChartTrigger } from "./HabitChart";
import { IconArrowBackUp } from "@tabler/icons-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
```

- [ ] **Step 4: Commit**

```bash
git add src/components/HabitList.tsx
git commit -m "feat: undo button, chart trigger, activeDays display and popover in HabitRow"
```

---

### Task 10: Update page.tsx — wire new callbacks, remove toggleDailyHabit

**Files:**
- Modify: `src/app/page.tsx:34-63,290-306`

- [ ] **Step 1: Update destructuring from useAppState**

Replace `toggleDailyHabit` with:

```tsx
    setHabitActiveDays,
    resetHabit,
```

- [ ] **Step 2: Add chart state**

```tsx
  const [chartHabit, setChartHabit] = useState<Habit | null>(null);
```

- [ ] **Step 3: Add HabitChart import**

```tsx
import HabitChart from "@/components/HabitChart";
```

- [ ] **Step 4: Render HabitChart**

Add before the closing `</div>` of the main component return:

```tsx
      {chartHabit && (
        <HabitChart
          habit={chartHabit}
          open={chartHabit !== null}
          onOpenChange={(open) => {
            if (!open) setChartHabit(null);
          }}
        />
      )}
```

- [ ] **Step 5: Update HabitList props**

Replace `onToggleDaily={toggleDailyHabit}` with:

```tsx
          onSetActiveDays={setHabitActiveDays}
          onReset={resetHabit}
          onChartOpen={setChartHabit}
```

- [ ] **Step 6: Update dismissAll to include chart**

```tsx
  const dismissAll = useCallback(() => {
    setSelectedHabitId(null);
    setSelectedSlot(null);
    setShowAddHabit(false);
    setShowAchievements(false);
    setShopSheetOpen(false);
    setShowLeaderboard(false);
    setViewUserUid(null);
    setChartHabit(null);
  }, []);
```

- [ ] **Step 7: Run typecheck**

```bash
npx tsc --noEmit 2>&1
```
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire resetHabit, setHabitActiveDays, chart in page.tsx"
```

---

### Task 11: Update useAppState.ts — pass through new callbacks

**Files:**
- Modify: `src/hooks/useAppState.ts`

- [ ] **Step 1: Add new exports from both hooks**

Read `src/hooks/useAppState.ts`, update return to include `setHabitActiveDays`, `resetHabit` from whichever hook is active. Remove `toggleDailyHabit`.

```tsx
    setHabitActiveDays: cloud.setHabitActiveDays ?? game.setHabitActiveDays,
    resetHabit: cloud.resetHabit ?? game.resetHabit,
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAppState.ts
git commit -m "feat: expose setHabitActiveDays and resetHabit through useAppState"
```

---

### Task 12: Update sql/schema.sql

**Files:**
- Modify: `sql/schema.sql`

- [ ] **Step 1: Add new columns to habits table**

```sql
ALTER TABLE habits ADD COLUMN IF NOT EXISTS completion_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS active_days SMALLINT[] DEFAULT '{}'::smallint[];
-- Drop old column (after migration)
-- ALTER TABLE habits DROP COLUMN IF EXISTS is_daily;
```

- [ ] **Step 2: Commit**

```bash
git add sql/schema.sql
git commit -m "feat: add completion_history and active_days columns to habits table"
```

---

### Task 13: Final verification

- [ ] **Step 1: Run all checks**

```bash
npm run lint && npx tsc --noEmit && npm run test
```

Expected: lint 0, typecheck 0, tests 14/14.

- [ ] **Step 2: Run `npm run build`**

```bash
npm run build
```

Expected: successful static export to `out/`.

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final fixes for charts-reset-schedule features"
```
