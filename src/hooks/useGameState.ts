"use client";

import { useCallback, useEffect, useState } from "react";
import { GameState, Habit, Plant, FLOWER_COLORS, MAX_HABITS, MAX_PLANTS, XP_PER_COMPLETION, PLANT_PRICE, UPGRADE_PRICE } from "@/lib/types";
import { saveGame, loadGame } from "@/lib/storage";
import { addXP } from "@/lib/gameLogic";
import { getPlantStage } from "@/lib/gameLogic";
import { playPlantSound, playCompleteSound, playDeleteSound, playLevelUpSound } from "@/lib/sound";

const initialState: GameState = {
  xp: 0,
  level: 1,
  habits: [],
  plants: Array(MAX_PLANTS).fill(null),
  inventory: [],
};

function migrateIfNeeded(state: GameState): GameState {
  const raw = state as unknown as Record<string, unknown>;
  if (Array.isArray(raw.inventory)) return state;

  const oldHabits = state.habits as unknown as (Habit & { plantVariant?: number; color?: string })[];
  const newHabits: Habit[] = [];
  const newPlants: (Plant | null)[] = Array(MAX_PLANTS).fill(null);
  const newInventory: Plant[] = [];

  oldHabits.forEach((h: Habit & { plantVariant?: number; color?: string }, i: number) => {
    if (h !== null && typeof h === "object") {
      newHabits.push({
        id: h.id,
        name: h.name,
        completions: h.completions ?? 0,
        createdAt: h.createdAt ?? Date.now(),
      });
      if (h.plantVariant !== undefined && i < MAX_PLANTS) {
        newPlants[i] = {
          id: h.id,
          variant: h.plantVariant ?? 0,
          color: h.color ?? FLOWER_COLORS[i % FLOWER_COLORS.length],
          plantedAt: Date.now() - (h.completions ?? 0) * 3600000,
          upgrades: Math.max(0, Math.min(3, (h.completions ?? 0) - 1)),
        };
      }
    }
  });

  return { ...state, habits: newHabits, plants: newPlants, inventory: newInventory };
}

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [floatTexts, setFloatTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      const migrated = migrateIfNeeded(saved);
      setState(migrated);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveGame(state);
  }, [state, loaded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => ({ ...s }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const showFloat = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setFloatTexts((p) => [...p, { id, text, x: 50, y: 50 }]);
    setTimeout(() => setFloatTexts((p) => p.filter((f) => f.id !== id)), 1600);
  }, []);

  const addHabit = useCallback((name: string) => {
    if (state.habits.length >= MAX_HABITS) return false;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      completions: 0,
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
        playLevelUpSound();
      } else {
        playCompleteSound();
      }
      return { ...s, habits, xp: updated.xp, level: updated.level };
    });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      habits: s.habits.filter((h) => h.id !== id),
    }));
    playDeleteSound();
  }, []);

  const buyPlant = useCallback((variant: number) => {
    if (state.xp < PLANT_PRICE) return false;
    if (state.inventory.length >= 99) return false;
    const color = FLOWER_COLORS[state.inventory.length % FLOWER_COLORS.length];
    const plant: Plant = {
      id: crypto.randomUUID(),
      variant,
      color,
      plantedAt: 0,
      upgrades: 0,
    };
    setState((s) => ({
      ...s,
      xp: s.xp - PLANT_PRICE,
      inventory: [...s.inventory, plant],
    }));
    return true;
  }, [state.xp, state.inventory.length]);

  const plantFromInventory = useCallback((plantId: string, slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= MAX_PLANTS) return false;
    setState((s) => {
      if (s.plants[slotIndex] !== null) return s;
      const idx = s.inventory.findIndex((p) => p.id === plantId);
      if (idx === -1) return s;
      const plant = { ...s.inventory[idx], plantedAt: Date.now(), upgrades: 0 };
      const inventory = s.inventory.filter((p) => p.id !== plantId);
      const plants = [...s.plants];
      plants[slotIndex] = plant;
      playPlantSound();
      return { ...s, plants, inventory };
    });
    return true;
  }, []);

  const upgradePlant = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= MAX_PLANTS) return false;
    setState((s) => {
      const plant = s.plants[slotIndex];
      if (!plant) return s;
      const stage = getPlantStage(plant);
      if (stage < 2) return s;
      if (plant.upgrades >= 3) return s;
      if (s.xp < UPGRADE_PRICE) return s;
      const plants = [...s.plants];
      plants[slotIndex] = { ...plant, upgrades: plant.upgrades + 1 };
      return { ...s, plants, xp: s.xp - UPGRADE_PRICE };
    });
    return true;
  }, []);

  const removePlant = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= MAX_PLANTS) return false;
    setState((s) => {
      if (!s.plants[slotIndex]) return s;
      const plants = [...s.plants];
      plants[slotIndex] = null;
      playDeleteSound();
      return { ...s, plants };
    });
    return true;
  }, []);

  return {
    xp: state.xp,
    level: state.level,
    habits: state.habits,
    plants: state.plants,
    inventory: state.inventory,
    loaded,
    floatTexts,
    levelUp,
    addHabit,
    completeHabit,
    deleteHabit,
    buyPlant,
    plantFromInventory,
    upgradePlant,
    removePlant,
    showFloat,
  };
}
