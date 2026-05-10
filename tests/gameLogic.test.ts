import { describe, it, expect } from "vitest";
import {
  getXPForLevel,
  addXP,
  getPlantGrowth,
  formatTimeRemaining,
} from "@/lib/gameLogic";
import { Plant } from "@/lib/types";

function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: "test-plant",
    type: "grass",
    plantedAt: Date.now(),
    growthLevel: 1,
    ...overrides,
  };
}

describe("getXPForLevel", () => {
  it("returns level * 100", () => {
    expect(getXPForLevel(1)).toBe(100);
    expect(getXPForLevel(5)).toBe(500);
    expect(getXPForLevel(10)).toBe(1000);
  });
});

describe("addXP", () => {
  it("adds XP without leveling up", () => {
    const result = addXP(0, 1, 50);
    expect(result.xp).toBe(50);
    expect(result.level).toBe(1);
    expect(result.leveledUp).toBe(false);
  });

  it("levels up when XP reaches threshold", () => {
    const result = addXP(90, 1, 20);
    expect(result.level).toBe(2);
    expect(result.leveledUp).toBe(true);
    expect(result.xp).toBe(10);
  });

  it("handles multiple level ups", () => {
    const result = addXP(0, 1, 350);
    expect(result.level).toBe(3);
    expect(result.leveledUp).toBe(true);
    expect(result.xp).toBe(50);
  });

  it("correctly computes threshold at level 2", () => {
    const result = addXP(0, 2, 200);
    expect(result.level).toBe(3);
    expect(result.leveledUp).toBe(true);
    expect(result.xp).toBe(0);
  });
});

describe("getPlantGrowth", () => {
  const growHours = 8;

  it("returns grown for level 1 (instant)", () => {
    const plant = makePlant({ plantedAt: Date.now(), growthLevel: 1 });
    const g = getPlantGrowth(plant);
    expect(g.growthLevel).toBe(1);
    expect(g.isGrowing).toBe(false);
    expect(g.progress).toBe(1);
  });

  it("returns growing for recently upgraded level 2", () => {
    const plant = makePlant({ plantedAt: Date.now(), growthLevel: 2 });
    const g = getPlantGrowth(plant);
    expect(g.growthLevel).toBe(2);
    expect(g.isGrowing).toBe(true);
    expect(g.progress).toBeLessThan(1);
  });

  it("returns grown for level 2 after full duration", () => {
    const totalMs = growHours * 2 * 3600000;
    const plant = makePlant({ plantedAt: Date.now() - totalMs, growthLevel: 2 });
    const g = getPlantGrowth(plant);
    expect(g.isGrowing).toBe(false);
    expect(g.progress).toBe(1);
  });

  it("returns growing for recently upgraded level 3", () => {
    const plant = makePlant({ plantedAt: Date.now(), growthLevel: 3 });
    const g = getPlantGrowth(plant);
    expect(g.growthLevel).toBe(3);
    expect(g.isGrowing).toBe(true);
  });
});

describe("formatTimeRemaining", () => {
  it('returns "Готово" for zero ms', () => {
    expect(formatTimeRemaining(0)).toBe("Готово");
  });

  it("formats minutes only", () => {
    const minMs = 5 * 60 * 1000;
    expect(formatTimeRemaining(minMs)).toBe("5м");
  });

  it("formats hours only", () => {
    const hourMs = 3 * 60 * 60 * 1000;
    expect(formatTimeRemaining(hourMs)).toBe("3ч");
  });

  it("formats hours and minutes", () => {
    const ms = (2 * 60 * 60 * 1000) + (30 * 60 * 1000);
    expect(formatTimeRemaining(ms)).toBe("2ч 30м");
  });

  it("rounds up minutes", () => {
    expect(formatTimeRemaining(90000)).toBe("2м");
  });
});
