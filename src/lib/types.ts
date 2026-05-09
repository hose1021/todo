export interface Habit {
  id: string;
  name: string;
  completions: number;
  createdAt: number;
}

export interface Plant {
  id: string;
  variant: string;
  color: string;
  plantedAt: number;
  upgrades: number;
}

export interface GameState {
  xp: number;
  level: number;
  crystals: number;
  habits: Habit[];
  plants: (Plant | null)[];
  inventory: Plant[];
}

export const FLOWER_COLORS = [
  "#FF6B6B", "#FFD93D", "#FF922B", "#CC5DE8",
  "#4D96FF", "#F06595", "#20C997", "#FCC419",
  "#FF8787", "#74C0FC", "#DA77F2", "#FFA94D",
];

export const TREE_VARIANTS = ["tree_1", "tree_2"];

export const MAX_HABITS = 50;
export const MAX_PLANTS = 30;
export const XP_PER_COMPLETION = 10;
export const CRYSTALS_PER_COMPLETION = 10;
export const PLANT_PRICE = 50;
export const UPGRADE_PRICE = 30;
