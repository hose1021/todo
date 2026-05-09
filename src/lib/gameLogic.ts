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

export function getGrowthStage(completions: number): number {
  if (completions === 0) return 0;
  if (completions <= 2) return 1;
  if (completions <= 5) return 2;
  if (completions <= 10) return 3;
  if (completions <= 18) return 4;
  return 5;
}

export const STAGE_NAMES = [
  "Семя",
  "Росток",
  "Юный",
  "Растущий",
  "Взрослый",
  "Цветущий",
];
