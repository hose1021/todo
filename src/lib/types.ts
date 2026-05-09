export interface Habit {
  id: string;
  name: string;
  completions: number;
  color: string;
  createdAt: number;
}

export interface GameState {
  xp: number;
  level: number;
  habits: Habit[];
}

export const FLOWER_COLORS = [
  "#FF6B6B", "#FFD93D", "#FF922B", "#CC5DE8",
  "#4D96FF", "#F06595", "#20C997", "#FCC419",
  "#FF8787", "#74C0FC", "#DA77F2", "#FFA94D",
];

export const MAX_HABITS = 12;
export const XP_PER_COMPLETION = 10;

export interface GrowthStage {
  name: string;
  minCompletions: number;
}
