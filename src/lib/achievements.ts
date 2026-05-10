import { AchievementDef, GameState } from "./types";

function maxCompletions(state: GameState): number {
  if (state.habits.length === 0) return 0;
  return Math.max(...state.habits.map((h) => h.completions));
}

function totalCompletions(state: GameState): number {
  return state.habits.reduce((sum, h) => sum + h.completions, 0);
}

function plantedCount(state: GameState): number {
  return state.plants.filter((p) => p !== null).length;
}

function maxGrowthLevel(state: GameState): number {
  let max = 0;
  for (const plant of state.plants) {
    if (plant && plant.growthLevel > max) max = plant.growthLevel;
  }
  return max;
}

function cornersFilled(state: GameState): number {
  const corners = [0, 5, 30, 35];
  let filled = 0;
  for (const idx of corners) {
    if (state.plants[idx] !== null) filled++;
  }
  return filled;
}

function uniqueTypesPlanted(state: GameState): number {
  const types = new Set<string>();
  for (const plant of state.plants) {
    if (plant) types.add(plant.type);
  }
  return types.size;
}

function plantsAtLevel3(state: GameState): number {
  let count = 0;
  for (const plant of state.plants) {
    if (plant && plant.growthLevel >= 3) count++;
  }
  return count;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "firstHabit",
    emoji: "🌱",
    name: "Действие!",
    description: "Создать 1 привычку",
    isUnlocked: (s) => s.habits.length >= 1,
    getProgress: (s) => ({ current: Math.min(s.habits.length, 1), target: 1 }),
    rewardCrystals: 7,
  },
  {
    id: "3streak",
    emoji: "🔥",
    name: "3 дня",
    description: "Стрик 3 дня подряд",
    isUnlocked: (s) => s.streak >= 3,
    getProgress: (s) => ({ current: Math.min(s.streak, 3), target: 3 }),
    rewardCrystals: 15,
  },
  {
    id: "5ticks",
    emoji: "✋",
    name: "Дай пять!",
    description: "Выполнить привычку 5 раз",
    isUnlocked: (s) => maxCompletions(s) >= 5,
    getProgress: (s) => ({ current: Math.min(maxCompletions(s), 5), target: 5 }),
    rewardCrystals: 15,
  },
  {
    id: "9streak",
    emoji: "9️⃣",
    name: "3×3",
    description: "Стрик 9 дней подряд",
    isUnlocked: (s) => s.streak >= 9,
    getProgress: (s) => ({ current: Math.min(s.streak, 9), target: 9 }),
    rewardCrystals: 30,
  },
  {
    id: "10ticks",
    emoji: "🎳",
    name: "Страйк!",
    description: "Выполнить привычку 10 раз",
    isUnlocked: (s) => maxCompletions(s) >= 10,
    getProgress: (s) => ({ current: Math.min(maxCompletions(s), 10), target: 10 }),
    rewardCrystals: 25,
  },
  {
    id: "cherryblossom",
    emoji: "🌸",
    name: "Вишнёво!",
    description: "Выполнить привычку 100 раз",
    isUnlocked: (s) => maxCompletions(s) >= 100,
    getProgress: (s) => ({ current: Math.min(maxCompletions(s), 100), target: 100 }),
    rewardCrystals: 0,
    rewardFlower: true,
  },
  {
    id: "bamboo",
    emoji: "🎍",
    name: "Мастер привычек",
    description: "Выполнить привычку 365 раз",
    isUnlocked: (s) => maxCompletions(s) >= 365,
    getProgress: (s) => ({ current: Math.min(maxCompletions(s), 365), target: 365 }),
    rewardCrystals: 0,
    rewardFlower: true,
  },
  {
    id: "godMode",
    emoji: "👑",
    name: "Режим бога",
    description: "Выполнить 10 000 привычек",
    isUnlocked: (s) => totalCompletions(s) >= 10000,
    getProgress: (s) => ({ current: Math.min(totalCompletions(s), 10000), target: 10000 }),
    rewardCrystals: 10000,
  },
  {
    id: "1flowerLevel2",
    emoji: "🌿",
    name: "Уровень 2!",
    description: "Вырастить цветок до 2 уровня",
    isUnlocked: (s) => maxGrowthLevel(s) >= 2,
    getProgress: (s) => ({ current: Math.min(maxGrowthLevel(s), 2), target: 2 }),
    rewardCrystals: 50,
  },
  {
    id: "1flowerLevel3",
    emoji: "🌺",
    name: "Уровень 3!",
    description: "Вырастить цветок до 3 уровня",
    isUnlocked: (s) => maxGrowthLevel(s) >= 3,
    getProgress: (s) => ({ current: Math.min(maxGrowthLevel(s), 3), target: 3 }),
    rewardCrystals: 100,
  },
  {
    id: "4flowersToPoles",
    emoji: "📍",
    name: "4 точки",
    description: "Посадить цветы по 4 углам сада",
    isUnlocked: (s) => cornersFilled(s) >= 4,
    getProgress: (s) => ({ current: Math.min(cornersFilled(s), 4), target: 4 }),
    rewardCrystals: 25,
  },
  {
    id: "18flowers",
    emoji: "🥑",
    name: "Холи Гуакамоле!",
    description: "Посадить 18 цветов в саду",
    isUnlocked: (s) => plantedCount(s) >= 18,
    getProgress: (s) => ({ current: Math.min(plantedCount(s), 18), target: 18 }),
    rewardCrystals: 75,
  },
  {
    id: "36flowers",
    emoji: "🌻",
    name: "Полный сад",
    description: "Заполнить весь сад (36 цветов)",
    isUnlocked: (s) => plantedCount(s) >= 36,
    getProgress: (s) => ({ current: Math.min(plantedCount(s), 36), target: 36 }),
    rewardCrystals: 250,
  },
  {
    id: "clover4",
    emoji: "🍀",
    name: "Клевер",
    description: "Посадить 4 разных вида растений",
    isUnlocked: (s) => uniqueTypesPlanted(s) >= 4,
    getProgress: (s) => ({ current: Math.min(uniqueTypesPlanted(s), 4), target: 4 }),
    rewardCrystals: 0,
    rewardFlower: true,
  },
  {
    id: "cactus",
    emoji: "🌵",
    name: "Кактус",
    description: "Вырастить 3 растения до 3 уровня",
    isUnlocked: (s) => plantsAtLevel3(s) >= 3,
    getProgress: (s) => ({ current: Math.min(plantsAtLevel3(s), 3), target: 3 }),
    rewardCrystals: 0,
    rewardFlower: true,
  },
];

export function evaluateAchievements(state: GameState): GameState {
  let changed = false;
  const achievements = state.achievements.map((a) => {
    if (a.status !== "locked") return a;
    const def = ACHIEVEMENTS.find((d) => d.id === a.id);
    if (def && def.isUnlocked(state)) {
      changed = true;
      return { ...a, status: "unlocked" as const };
    }
    return a;
  });
  return changed ? { ...state, achievements } : state;
}

export function initAchievementStates(): GameState["achievements"] {
  return ACHIEVEMENTS.map((a) => ({ id: a.id, status: "locked" }));
}
