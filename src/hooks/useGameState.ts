"use client";

import { useCallback, useEffect, useState } from "react";
import { GameState, Habit, FLOWER_COLORS, MAX_HABITS, XP_PER_COMPLETION } from "@/lib/types";
import { saveGame, loadGame } from "@/lib/storage";
import { addXP } from "@/lib/gameLogic";

const initialState: GameState = {
  xp: 0,
  level: 1,
  habits: [],
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [floatTexts, setFloatTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    const saved = loadGame();
    if (saved) setState(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveGame(state);
  }, [state, loaded]);

  const showFloat = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setFloatTexts((p) => [...p, { id, text, x: 50, y: 50 }]);
    setTimeout(() => setFloatTexts((p) => p.filter((f) => f.id !== id)), 1600);
  }, []);

  const addHabit = useCallback((name: string) => {
    if (state.habits.length >= MAX_HABITS) return false;
    const color = FLOWER_COLORS[state.habits.length % FLOWER_COLORS.length];
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      completions: 0,
      color,
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, habits: [...s.habits, habit] }));
    return true;
  }, [state.habits.length]);

  const completeHabit = useCallback((id: string) => {
    setState((s) => {
      const habits = s.habits.map((h) =>
        h.id === id ? { ...h, completions: h.completions + 1 } : h
      );
      const updated = addXP(s.xp, s.level, XP_PER_COMPLETION);
      if (updated.leveledUp) {
        setTimeout(() => setLevelUp(true), 100);
        setTimeout(() => setLevelUp(false), 2500);
      }
      return { habits, xp: updated.xp, level: updated.level };
    });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      habits: s.habits.filter((h) => h.id !== id),
    }));
  }, []);

  return {
    ...state,
    loaded,
    floatTexts,
    levelUp,
    addHabit,
    completeHabit,
    deleteHabit,
    showFloat,
  };
}
