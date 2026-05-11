export interface Habit {
  id: string;
  name: string;
  completions: number;
  createdAt: number;
  isDaily: boolean;
}

export type RarityLevel = 1 | 2 | 3 | 4 | 5;

export interface RarityInfo {
  name: string;
  bgColor: string;
}

export interface PlantType {
  type: string;
  name: string;
  cost: number;
  growHours: number;
  emoji: string;
  size: string;
  rarity: RarityLevel;
  canPlant: (achievements: AchievementState[]) => boolean;
}

export interface GrowthLevelInfo {
  multiplier: { grow: number; cost: number };
  scale: string;
  saturate: string;
}

export interface Plant {
  id: string;
  type: string;
  plantedAt: number;
  growthLevel: number;
}

export type AchievementStatus = "locked" | "unlocked" | "claimed";

export interface AchievementState {
  id: string;
  status: AchievementStatus;
}

export interface AchievementDef {
  id: string;
  emoji: string;
  name: string;
  description: string;
  isUnlocked: (state: GameState) => boolean;
  getProgress: (state: GameState) => { current: number; target: number };
  rewardCrystals: number;
  rewardFlower?: boolean;
}

export interface GameState {
  xp: number;
  level: number;
  crystals: number;
  habits: Habit[];
  plants: (Plant | null)[];
  streak: number;
  lastCompletionDate: string;
  lastResetDate: string;
  achievements: AchievementState[];
}

export interface UserProfile {
  uid: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  plantCount: number;
}

export const MAX_HABITS = 50;
export const MAX_PLANTS = 36;
export const XP_PER_COMPLETION = 10;
export const CRYSTALS_PER_COMPLETION = 10;
