import { Plant } from "./types";

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

const STAGE_0_DURATION = 2 * 60 * 60 * 1000;  // 2 hours
const STAGE_1_DURATION = 6 * 60 * 60 * 1000;  // 6 hours

export function getPlantStage(plant: Plant): number {
  const elapsed = Date.now() - plant.plantedAt;
  let stage = 0;
  if (elapsed >= STAGE_0_DURATION) stage = 1;
  if (elapsed >= STAGE_0_DURATION + STAGE_1_DURATION) stage = 2;
  return Math.min(stage + plant.upgrades, 5);
}

export interface PlantProgress {
  stage: number;
  isGrowing: boolean;
  progress: number;
  remainingMs: number;
  totalMs: number;
}

export function getPlantProgress(plant: Plant): PlantProgress {
  const elapsed = Date.now() - plant.plantedAt;
  let timeStage = 0;
  let progress = 0;
  let remainingMs = 0;
  let totalMs = 0;

  if (elapsed < STAGE_0_DURATION) {
    timeStage = 0;
    totalMs = STAGE_0_DURATION;
    remainingMs = STAGE_0_DURATION - elapsed;
    progress = Math.min(1, elapsed / STAGE_0_DURATION);
  } else if (elapsed < STAGE_0_DURATION + STAGE_1_DURATION) {
    timeStage = 1;
    const stageElapsed = elapsed - STAGE_0_DURATION;
    totalMs = STAGE_1_DURATION;
    remainingMs = STAGE_1_DURATION - stageElapsed;
    progress = Math.min(1, stageElapsed / STAGE_1_DURATION);
  } else {
    timeStage = 2;
  }

  const stage = Math.min(timeStage + plant.upgrades, 5);
  const isGrowing = timeStage < 2;

  return { stage, isGrowing, progress, remainingMs, totalMs };
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Готово";
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}ч ${minutes}м`;
  if (hours > 0) return `${hours}ч`;
  return `${minutes}м`;
}

export const STAGE_NAMES = [
  "Семя",
  "Росток",
  "Юный",
  "Растущий",
  "Взрослый",
  "Цветущий",
];

export { STAGE_0_DURATION, STAGE_1_DURATION };
