"use client";

import { useCallback, useEffect, useState } from "react";
import { GameState, Habit, Plant, MAX_HABITS, MAX_PLANTS, XP_PER_COMPLETION, MS_PER_DAY, MS_PER_HOUR, TICK_INTERVAL_MS, MAX_GROWTH_LEVEL } from "@/lib/types";
import { saveGame, loadGame } from "@/lib/storage";
import { addXP, getPlantGrowth } from "@/lib/gameLogic";
import { getPlantType, GROWTH_LEVELS } from "@/lib/plants";
import { useSound } from "@/lib/sound";
import { ACHIEVEMENTS, evaluateAchievements, initAchievementStates } from "@/lib/achievements";

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getYesterday(): string {
  const d = new Date(Date.now() - MS_PER_DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const initialState: GameState = {
  xp: 0,
  level: 1,
  crystals: 0,
  habits: [],
  plants: Array(MAX_PLANTS).fill(null),
  streak: 0,
  lastCompletionDate: "",
  lastResetDate: getToday(),
  achievements: initAchievementStates(),
};

function migratePlant(rawPlant: Record<string, unknown>): Plant {
  const variant = typeof rawPlant.variant === "string" ? rawPlant.variant : undefined;
  const type = typeof rawPlant.type === "string" ? rawPlant.type
    : variant && (variant === "tree_1" || variant === "tree_2") ? "grass"
    : "grass";
  const upgrades = typeof rawPlant.upgrades === "number" ? rawPlant.upgrades : 0;
  const growthLevel = typeof rawPlant.growthLevel === "number" ? rawPlant.growthLevel
    : Math.max(1, Math.min(3, upgrades + 1));
  return {
    id: rawPlant.id as string,
    type,
    plantedAt: rawPlant.plantedAt as number || Date.now(),
    growthLevel,
  };
}

function findEmptySlot(plants: (Plant | null)[]): number {
  for (let i = 0; i < plants.length; i++) {
    if (plants[i] === null) return i;
  }
  return -1;
}

type RawState = Record<string, unknown>;
type OldHabit = Habit & { plantVariant?: number; color?: string };

function migrateFromInventory(state: GameState, raw: RawState): GameState {
  const inventory = (raw.inventory as RawState[]).map(migratePlant);
  const plants = (state.plants ?? []).map((p) =>
    p ? migratePlant(p as unknown as RawState) : null,
  );

  let result = {
    ...state,
    crystals: state.crystals ?? 0,
    plants,
    streak: typeof raw.streak === "number" ? (raw.streak as number) : 0,
    lastCompletionDate:
      typeof raw.lastCompletionDate === "string"
        ? (raw.lastCompletionDate as string)
        : "",
    lastResetDate:
      typeof raw.lastResetDate === "string"
        ? (raw.lastResetDate as string)
        : getToday(),
  };

  for (const invPlant of inventory) {
    const slot = findEmptySlot(result.plants);
    if (slot >= 0) {
      const plantsCopy = [...result.plants];
      plantsCopy[slot] = { ...invPlant, plantedAt: Date.now(), growthLevel: 1 };
      result = { ...result, plants: plantsCopy };
    }
  }

  return result;
}

function migrateOldHabitFormat(state: GameState): GameState | null {
  const oldHabits = (state.habits ?? []) as unknown as OldHabit[];
  const hasOldFormat = oldHabits.some(
    (h) =>
      h !== null &&
      typeof h === "object" &&
      (h as OldHabit).plantVariant !== undefined,
  );

  if (!hasOldFormat) return null;

  const newHabits: Habit[] = [];
  const newPlants: (Plant | null)[] = Array(MAX_PLANTS).fill(null);

  oldHabits.forEach((h: OldHabit, i: number) => {
    if (h !== null && typeof h === "object") {
      newHabits.push({
        id: h.id,
        name: h.name,
        completions: h.completions ?? 0,
        createdAt: h.createdAt ?? Date.now(),
        isDaily: false,
      });
      if (h.plantVariant !== undefined && i < MAX_PLANTS) {
        newPlants[i] = {
          id: h.id,
          type: "grass",
          plantedAt: Date.now() - (h.completions ?? 0) * MS_PER_HOUR,
          growthLevel: Math.max(1, Math.min(3, h.completions ?? 0)),
        };
      }
    }
  });

  return {
    ...state,
    crystals: state.crystals ?? 0,
    habits: newHabits,
    plants: newPlants,
    streak: 0,
    lastCompletionDate: "",
    lastResetDate: getToday(),
  };
}

function migratePlantsOnly(state: GameState): GameState {
  const plants = (state.plants ?? []).map((p) =>
    p ? migratePlant(p as unknown as RawState) : null,
  );
  return { ...state, plants };
}

function normalizeMigrationResult(result: GameState): GameState {
  const habits = (result.habits ?? []).map((h) => ({
    ...h,
    isDaily: h.isDaily ?? false,
  }));

  let achievements = result.achievements;
  if (!achievements || !Array.isArray(achievements) || achievements.length === 0) {
    achievements = initAchievementStates();
  }

  const { inventory: _inventory, ...cleanResult } = result as unknown as RawState;
  return { ...cleanResult, habits, achievements } as unknown as GameState;
}

export function migrateIfNeeded(state: GameState): GameState {
  const raw = state as unknown as RawState;

  let result: GameState;
  if (Array.isArray(raw.inventory)) {
    result = migrateFromInventory(state, raw);
  } else {
    const oldFormatResult = migrateOldHabitFormat(state);
    result = oldFormatResult ?? migratePlantsOnly(state);
  }

  return normalizeMigrationResult(result);
}

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const {
    isMuted,
    toggleMute,
    playPlantSound,
    playCompleteSound,
    playDeleteSound,
    playLevelUpSound,
  } = useSound();

  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      const migrated = migrateIfNeeded(saved);
      setState(evaluateAchievements(migrated));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveGame(state);
  }, [state, loaded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => {
        const today = getToday();
        if (s.lastResetDate === today) return { ...s };
        return {
          ...s,
          lastResetDate: today,
          habits: s.habits.map((h) =>
            h.isDaily ? { ...h, completions: 0 } : h
          ),
        };
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const addHabit = useCallback((name: string) => {
    if (state.habits.length >= MAX_HABITS) return false;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      completions: 0,
      createdAt: Date.now(),
      isDaily: false,
    };
    setState((s) => evaluateAchievements({ ...s, habits: [...s.habits, habit] }));
    return true;
  }, [state.habits.length]);

  const completeHabit = useCallback((id: string) => {
    setState((s) => {
      const today = getToday();
      const habits = s.habits.map((h) =>
        h.id === id ? { ...h, completions: h.completions + 1 } : h
      );
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

  const renameHabit = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > 40) return false;
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, name: trimmed } : h
      ),
    }));
    return true;
  }, []);

  const toggleDailyHabit = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, isDaily: !h.isDaily } : h
      ),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((s) => evaluateAchievements({
      ...s,
      habits: s.habits.filter((h) => h.id !== id),
    }));
    playDeleteSound();
  }, []);

  const plantDirectly = useCallback((type: string, slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= MAX_PLANTS) return false;
    const def = getPlantType(type);
    if (!def) return false;
    let succeeded = false;
    setState((s) => {
      if (s.plants[slotIndex] !== null) return s;
      if (s.crystals < def.cost) return s;
      const plant: Plant = {
        id: crypto.randomUUID(),
        type,
        plantedAt: Date.now(),
        growthLevel: 1,
      };
      const plants = [...s.plants];
      plants[slotIndex] = plant;
      playPlantSound();
      succeeded = true;
      return evaluateAchievements({ ...s, plants, crystals: s.crystals - def.cost });
    });
    return succeeded;
  }, []);

  const upgradePlant = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= MAX_PLANTS) return false;
    let succeeded = false;
    setState((s) => {
      const plant = s.plants[slotIndex];
      if (!plant) return s;
      if (plant.growthLevel >= MAX_GROWTH_LEVEL) return s;

      const growth = getPlantGrowth(plant);
      if (growth.isGrowing) return s;

      const def = getPlantType(plant.type);
      if (!def) return s;

      const nextLevel = plant.growthLevel + 1;
      const costMult = GROWTH_LEVELS[nextLevel]?.multiplier.cost ?? 1;
      const cost = Math.round(def.cost * costMult);

      if (s.crystals < cost) return s;

      const plants = [...s.plants];
      plants[slotIndex] = { ...plant, growthLevel: nextLevel, plantedAt: Date.now() };
      succeeded = true;
      return evaluateAchievements({ ...s, plants, crystals: s.crystals - cost });
    });
    return succeeded;
  }, []);

  const removePlant = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= MAX_PLANTS) return false;
    setState((s) => {
      const plant = s.plants[slotIndex];
      if (!plant) return s;

      const def = getPlantType(plant.type);
      let refund = def ? def.cost : 5;
      for (let lv = 2; lv <= plant.growthLevel; lv++) {
        refund += Math.round(def ? def.cost * GROWTH_LEVELS[lv].multiplier.cost : 0);
      }

      const plants = [...s.plants];
      plants[slotIndex] = null;
      playDeleteSound();
      return evaluateAchievements({ ...s, plants, crystals: s.crystals + refund });
    });
    return true;
  }, []);

  const claimAchievement = useCallback((id: string) => {
    setState((s) => {
      const def = ACHIEVEMENTS.find((d) => d.id === id);
      if (!def) return s;
      const ach = s.achievements.find((a) => a.id === id);
      if (!ach || ach.status !== "unlocked") return s;

      let newState = {
        ...s,
        crystals: s.crystals + def.rewardCrystals,
        achievements: s.achievements.map((a) =>
          a.id === id ? { ...a, status: "claimed" as const } : a
        ),
      };

      if (def.rewardFlower && getPlantType(id)) {
        const slot = findEmptySlot(s.plants);
        if (slot >= 0) {
          const plant: Plant = {
            id: crypto.randomUUID(),
            type: id,
            plantedAt: Date.now(),
            growthLevel: 1,
          };
          const plants = [...s.plants];
          plants[slot] = plant;
          playPlantSound();
          newState = { ...newState, plants };
        }
      }

      return newState;
    });
  }, []);

  return {
    state,
    xp: state.xp,
    level: state.level,
    crystals: state.crystals,
    habits: state.habits,
    plants: state.plants,
    streak: state.streak,
    achievements: state.achievements,
    loaded,
    levelUp,
    isMuted,
    addHabit,
    completeHabit,
    deleteHabit,
    renameHabit,
    toggleDailyHabit,
    plantDirectly,
    upgradePlant,
    removePlant,
    claimAchievement,
    toggleMute,
  };
}
