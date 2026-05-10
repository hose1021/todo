"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PlantComp from "./Plant";
import { Plant as PlantType } from "@/lib/types";
import { getPlantGrowth, formatTimeRemaining } from "@/lib/gameLogic";
import { getPlantType, GROWTH_LEVELS } from "@/lib/plants";

interface GardenProps {
  plants: (PlantType | null)[];
  selectedSlot: number | null;
  onSelect: (index: number | null) => void;
  plantingMode?: boolean;
  onPlantInSlot?: (index: number) => void;
  onUpgrade?: (index: number) => void;
  onRemove?: (index: number) => void;
  crystals: number;
  claimableCount: number;
  onAchievements?: () => void;
}

const GRID_COLS = 6;
const TOTAL_SLOTS = 36;

export default function Garden({
  plants,
  selectedSlot,
  onSelect,
  plantingMode,
  onPlantInSlot,
  onUpgrade,
  onRemove,
  onAchievements,
  claimableCount,
  crystals,
}: GardenProps) {
  const count = plants.filter((p) => p !== null).length;
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    setConfirmRemove(false);
  }, [selectedSlot]);

  return (
    <section className="overflow-hidden rounded-[10px] border border-[#33404d] bg-[#222b36] shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-dashed border-[#33404d] px-4 py-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-[#dce8ef]">
            Мой сад
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#657486]">
            {plantingMode
              ? "Выбери свободную клетку"
              : `${count}/${TOTAL_SLOTS} посажено`}
          </p>
        </div>
        <button
          onClick={onAchievements}
          className="relative flex h-9 items-center gap-1 rounded-lg border border-[#3a4754] bg-[#1b222c] px-2.5 text-sm font-black text-[#91a0af] hover:bg-[#252f3a] transition-colors"
        >
          🏆 Достижения
          {claimableCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d5a63d] px-1 text-[9px] font-black text-[#1f2630]">
              {claimableCount}
            </span>
          )}
        </button>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
          const plant = plants[i] || null;
          const isSelected = selectedSlot === i;
          const growth = plant ? getPlantGrowth(plant) : null;
          const isGrowing = growth?.isGrowing ?? false;
          const def = plant ? getPlantType(plant.type) : null;

          let canUpgrade = false;
          let upgradeCost = 0;
          if (plant && def && plant.growthLevel < 3 && !isGrowing) {
            const nextLevel = plant.growthLevel + 1;
            const costMult = GROWTH_LEVELS[nextLevel]?.multiplier.cost ?? 1;
            upgradeCost = Math.round(def.cost * costMult);
            canUpgrade = crystals >= upgradeCost;
          }

          return (
            <GardenCell
              key={i}
              index={i}
              plant={plant}
              isSelected={isSelected}
              isGrowing={isGrowing}
              growth={growth}
              canUpgrade={canUpgrade}
              upgradeCost={upgradeCost}
              plantingMode={plantingMode}
              onSelect={() => {
                if (plant) {
                  onSelect(isSelected ? null : i);
                } else if (plantingMode && onPlantInSlot) {
                  onPlantInSlot(i);
                }
              }}
              onLongPress={() => {
                if (plant) {
                  onSelect(isSelected ? null : i);
                }
              }}
            />
          );
        })}
      </div>

      {selectedSlot !== null &&
        plants[selectedSlot] &&
        (() => {
          const plant = plants[selectedSlot]!;
          const growth = getPlantGrowth(plant);
          const def = getPlantType(plant.type);
          const name = def?.name ?? plant.type;

          let upgradeCost = 0;
          let canUpgradeNow = false;
          if (def && plant.growthLevel < 3 && !growth.isGrowing) {
            const nextLevel = plant.growthLevel + 1;
            const costMult = GROWTH_LEVELS[nextLevel]?.multiplier.cost ?? 1;
            upgradeCost = Math.round(def.cost * costMult);
            canUpgradeNow = crystals >= upgradeCost;
          }

          let refund = def ? def.cost : 5;
          for (let lv = 2; lv <= plant.growthLevel; lv++) {
            refund += Math.round(
              def ? def.cost * GROWTH_LEVELS[lv].multiplier.cost : 0,
            );
          }

          return (
            <div className="border-t border-dashed border-[#33404d] px-4 py-2.5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#dce8ef]">
                    {name} — уровень {growth.growthLevel}/3
                  </p>
                  <p className="text-[10px] font-semibold text-[#657486]">
                    {growth.isGrowing
                      ? `Растёт — ${formatTimeRemaining(growth.remainingMs)}`
                      : plant.growthLevel < 3
                        ? `${upgradeCost} 💎 — улучшить`
                        : "Максимальный уровень"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {plant.growthLevel < 3 && !growth.isGrowing && (
                    <button
                      onClick={() => onUpgrade?.(selectedSlot!)}
                      disabled={!canUpgradeNow}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-black uppercase transition-all ${
                        canUpgradeNow
                          ? "bg-[#d5a63d] text-[#1f2630] hover:bg-[#edbe52] active:scale-95"
                          : "cursor-not-allowed bg-[#3a3a2e] text-[#6b6348]"
                      }`}
                    >
                      ↑ {upgradeCost} 💎
                    </button>
                  )}
                  {confirmRemove ? (
                    <>
                      <button
                        onClick={() => {
                          onRemove?.(selectedSlot!);
                          setConfirmRemove(false);
                        }}
                        title={`Вернуть ${refund} 💎`}
                        className="rounded-md bg-[#c0392b] px-2 py-1.5 text-[10px] font-black text-white transition-all hover:bg-[#e74c3c]"
                      >
                        Удалить
                      </button>
                      <button
                        onClick={() => setConfirmRemove(false)}
                        className="rounded-md border border-[#3a4653] bg-[#242f3a] px-2 py-1.5 text-[10px] font-black text-[#8d9ba8] transition-all hover:bg-[#2b3845]"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(true)}
                      title={`Удалить (вернуть ${refund} 💎)`}
                      className="rounded-md border border-[#3a4653] bg-[#242f3a] px-2 py-1.5 text-[10px] font-black text-[#8d9ba8] transition-all hover:bg-[#432d35] hover:text-[#ff8d8d]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {growth.isGrowing && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1b222c]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4d9e6d] to-[#6ecf8a] transition-all duration-1000"
                    style={{ width: `${Math.round(growth.progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })()}
    </section>
  );
}

function GardenCell({
  plant,
  isSelected,
  isGrowing,
  growth,
  canUpgrade,
  upgradeCost,
  plantingMode,
  onSelect,
  onLongPress,
}: {
  index: number;
  plant: PlantType | null;
  isSelected: boolean;
  isGrowing: boolean;
  growth: ReturnType<typeof getPlantGrowth> | null;
  canUpgrade: boolean;
  upgradeCost: number;
  plantingMode?: boolean;
  onSelect: () => void;
  onLongPress: () => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touched = useRef(false);

  const handleTouchStart = useCallback(() => {
    touched.current = true;
    longPressTimer.current = setTimeout(() => {
      if (touched.current && plant) {
        onLongPress();
        touched.current = false;
      }
    }, 500);
  }, [plant, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (touched.current) {
      onSelect();
    }
    touched.current = false;
  }, [onSelect]);

  return (
    <button
      type="button"
      disabled={!plant && !plantingMode}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onSelect}
      onContextMenu={(e) => {
        if (plant) {
          e.preventDefault();
          onLongPress();
        }
      }}
      className={`group relative flex flex-col items-center justify-center border-b border-r border-dashed border-[#33404d] transition-colors duration-200 ${
        isSelected
          ? "bg-[#2e4442]"
          : plant
            ? "bg-[#222b36] hover:bg-[#273440]"
            : plantingMode
              ? "cursor-pointer bg-[#28352e] hover:bg-[#2f4440]"
              : "bg-[#222b36]/70"
      }`}
      style={{ minHeight: "6rem", height: "6rem" }}
      aria-label={
        plant ? `Растение` : plantingMode ? `Посадить` : "Пустая клетка"
      }
    >
      {plant ? (
        <>
          <div className="flex h-[62%] w-[62%] items-center justify-center sm:h-[68%] sm:w-[68%]">
            <PlantComp plant={plant} highlighted={isSelected} />
          </div>
          {canUpgrade && (
            <span className="absolute bottom-0.5 rounded bg-[#d5a63d]/20 px-1 py-px text-[9px] font-black text-[#edbe52] leading-none sm:text-[10px]">
              ⬆{upgradeCost}
            </span>
          )}
          {isGrowing && growth && (
            <div className="absolute bottom-0.5 left-2 right-2 h-1.5 overflow-hidden rounded-full bg-[#1b222c]/60 sm:h-1">
              <div
                className="h-full rounded-full bg-[#4d9e6d]/60"
                style={{ width: `${Math.round(growth.progress * 100)}%` }}
              />
            </div>
          )}
        </>
      ) : plantingMode ? (
        <span
          aria-hidden="true"
          className="select-none text-[28px] leading-none text-[#5a8a6a] opacity-70 sm:text-[36px]"
        >
          +
        </span>
      ) : (
        <span className="h-2 w-2 rounded-full bg-[#313b47] opacity-40" />
      )}
    </button>
  );
}
