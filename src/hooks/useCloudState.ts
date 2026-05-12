"use client";

import { useCallback, useEffect, useState } from "react";
import { GameState, Habit, Plant, MAX_HABITS, MAX_PLANTS, XP_PER_COMPLETION, MS_PER_DAY, TICK_INTERVAL_MS } from "@/lib/types";
import { addXP, getPlantGrowth } from "@/lib/gameLogic";
import { getPlantType, GROWTH_LEVELS } from "@/lib/plants";
import { playPlantSound, playCompleteSound, playDeleteSound, playLevelUpSound, setMuted } from "@/lib/sound";
import { ACHIEVEMENTS, evaluateAchievements, initAchievementStates } from "@/lib/achievements";
import {
  fetchGameState,
  syncUserStats,
  saveHabits,
  savePlantAtSlot,
  saveAchievements,
  updateUsername,
} from "@/lib/supabase";
import { getDailyResetState } from "@/hooks/useDailyReset";

const MUTE_KEY = "habbittodo_mute";

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

function findEmptySlot(plants: (Plant | null)[]): number {
  for (let i = 0; i < plants.length; i++) {
    if (plants[i] === null) return i;
  }
  return -1;
}

function saveStateChanges(uid: string, state: GameState): void {
  Promise.all([
    saveHabits(uid, state.habits),
    syncUserStats(uid, {
      xp: state.xp,
      level: state.level,
      crystals: state.crystals,
      streak: state.streak,
      lastCompletionDate: state.lastCompletionDate,
      lastResetDate: state.lastResetDate,
    }),
    saveAchievements(uid, state.achievements),
  ]).catch(() => {});
}

export function useCloudState(uid: string) {
  const [state, setState] = useState<GameState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fetchVersion, setFetchVersion] = useState(0);

  useEffect(() => {
    const savedMute = localStorage.getItem(MUTE_KEY);
    if (savedMute === "true") {
      setIsMuted(true);
      setMuted(true);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      setMuted(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!uid) return;
    fetchGameState(uid).then((saved) => {
      if (saved) {
        setState(evaluateAchievements(saved));
      }
      setLoaded(true);
    }).catch(() => {
      setLoaded(true);
    });
  }, [uid, fetchVersion]);

  const refreshState = useCallback(() => {
    setLoaded(false);
    setFetchVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => {
        const newState = getDailyResetState(s);
        if (!newState) return { ...s };
        saveStateChanges(uid, newState);
        return newState;
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [uid]);

  const addHabit = useCallback((name: string) => {
    if (state.habits.length >= MAX_HABITS) return false;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      completions: 0,
      createdAt: Date.now(),
      isDaily: false,
    };
    const newState = evaluateAchievements({ ...state, habits: [...state.habits, habit] });
    setState(newState);
    saveStateChanges(uid, newState);
    return true;
  }, [state, uid]);

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
      const newState = evaluateAchievements({ ...s, habits, xp: updated.xp, level: updated.level, streak, lastCompletionDate });
      saveStateChanges(uid, newState);
      return newState;
    });
  }, [uid]);

  const renameHabit = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > 40) return false;
    setState((s) => {
      const habits = s.habits.map((h) =>
        h.id === id ? { ...h, name: trimmed } : h
      );
      saveHabits(uid, habits).catch(() => {});
      return { ...s, habits };
    });
    return true;
  }, [uid]);

  const toggleDailyHabit = useCallback((id: string) => {
    setState((s) => {
      const habits = s.habits.map((h) =>
        h.id === id ? { ...h, isDaily: !h.isDaily } : h
      );
      saveHabits(uid, habits).catch(() => {});
      return { ...s, habits };
    });
  }, [uid]);

  const deleteHabit = useCallback((id: string) => {
    setState((s) => {
      const newState = evaluateAchievements({
        ...s,
        habits: s.habits.filter((h) => h.id !== id),
      });
      saveHabits(uid, newState.habits).catch(() => {});
      saveAchievements(uid, newState.achievements).catch(() => {});
      playDeleteSound();
      return newState;
    });
  }, [uid]);

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
      const newState = evaluateAchievements({ ...s, plants, crystals: s.crystals - def.cost });
      savePlantAtSlot(uid, slotIndex, plant).catch(() => {});
      saveStateChanges(uid, newState);
      return newState;
    });
    return succeeded;
  }, [uid]);

  const upgradePlant = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= MAX_PLANTS) return false;
    let succeeded = false;
    setState((s) => {
      const plant = s.plants[slotIndex];
      if (!plant) return s;
      if (plant.growthLevel >= 3) return s;

      const growth = getPlantGrowth(plant);
      if (growth.isGrowing) return s;

      const def = getPlantType(plant.type);
      if (!def) return s;

      const nextLevel = plant.growthLevel + 1;
      const costMult = GROWTH_LEVELS[nextLevel]?.multiplier.cost ?? 1;
      const cost = Math.round(def.cost * costMult);

      if (s.crystals < cost) return s;

      const upgradedPlant = { ...plant, growthLevel: nextLevel, plantedAt: Date.now() };
      const plants = [...s.plants];
      plants[slotIndex] = upgradedPlant;
      succeeded = true;
      const newState = evaluateAchievements({ ...s, plants, crystals: s.crystals - cost });
      savePlantAtSlot(uid, slotIndex, upgradedPlant).catch(() => {});
      saveStateChanges(uid, newState);
      return newState;
    });
    return succeeded;
  }, [uid]);

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
      const newState = evaluateAchievements({ ...s, plants, crystals: s.crystals + refund });
      savePlantAtSlot(uid, slotIndex, null).catch(() => {});
      saveStateChanges(uid, newState);
      return newState;
    });
    return true;
  }, [uid]);

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

      let plantedSlot = -1;
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
          plantedSlot = slot;
        }
      }

      saveStateChanges(uid, newState);
      if (plantedSlot >= 0) {
        const plant = newState.plants[plantedSlot];
        if (plant) savePlantAtSlot(uid, plantedSlot, plant).catch(() => {});
      }

      return newState;
    });
  }, [uid]);

  const setUsername = useCallback((username: string) => {
    setState((s) => {
      updateUsername(uid, username).catch(() => {});
      return s;
    });
  }, [uid]);

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
    refreshState,
    addHabit,
    completeHabit,
    deleteHabit,
    renameHabit,
    toggleDailyHabit,
    plantDirectly,
    upgradePlant,
    removePlant,
    claimAchievement,
    setUsername,
    toggleMute,
  };
}
