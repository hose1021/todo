import { GameState } from "@/lib/types";

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
