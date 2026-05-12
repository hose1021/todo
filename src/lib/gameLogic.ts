import { Plant, MS_PER_HOUR, MS_PER_MINUTE } from "./types";
import { getPlantType, GROWTH_LEVELS } from "./plants";

export function getXPForLevel(level: number): number {
  return level * 100;
}

export function addXP(currentXP: number, currentLevel: number, amount: number): {
  xp: number;
  level: number;
  leveledUp: boolean;
} {
  let xp = currentXP + amount;
  let level = currentLevel;
  let leveledUp = false;

  while (xp >= getXPForLevel(level)) {
    xp -= getXPForLevel(level);
    level++;
    leveledUp = true;
  }

  return { xp, level, leveledUp };
}

export interface PlantGrowth {
  isGrowing: boolean;
  progress: number;
  remainingMs: number;
  totalMs: number;
  growthLevel: number;
}

export function getPlantGrowth(plant: Plant): PlantGrowth {
  const def = getPlantType(plant.type);
  if (!def) {
    return { isGrowing: false, progress: 1, remainingMs: 0, totalMs: 0, growthLevel: plant.growthLevel };
  }

  const growMult = GROWTH_LEVELS[plant.growthLevel]?.multiplier.grow ?? 0;
  const totalMs = growMult === 0 ? 0 : def.growHours * growMult * MS_PER_HOUR;

  if (totalMs === 0) {
    return { isGrowing: false, progress: 1, remainingMs: 0, totalMs: 0, growthLevel: plant.growthLevel };
  }

  const elapsed = Date.now() - plant.plantedAt;
  const progress = Math.min(1, elapsed / totalMs);
  const remainingMs = Math.max(0, totalMs - elapsed);

  return {
    isGrowing: progress < 1,
    progress,
    remainingMs,
    totalMs,
    growthLevel: plant.growthLevel,
  };
}

export function getPlantScaleSaturate(plant: Plant): string {
  const level = GROWTH_LEVELS[plant.growthLevel];
  const DEFAULT_SCALE_SATURATE = "scale-75 saturate-[0.5]";
  if (!level) return DEFAULT_SCALE_SATURATE;
  return `${level.scale} ${level.saturate}`.trim() || DEFAULT_SCALE_SATURATE;
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Готово";
  const totalMinutes = Math.ceil(ms / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}ч ${minutes}м`;
  if (hours > 0) return `${hours}ч`;
  return `${minutes}м`;
}
