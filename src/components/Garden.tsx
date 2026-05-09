"use client";

import Plant from "./Plant";
import { Plant as PlantType } from "@/lib/types";
import { getPlantStage, getPlantProgress, formatTimeRemaining, getPlantSpriteSrc, STAGE_NAMES } from "@/lib/gameLogic";
import { UPGRADE_PRICE, PLANT_PRICE } from "@/lib/types";

interface GardenProps {
  plants: (PlantType | null)[];
  selectedSlot: number | null;
  onSelect: (index: number | null) => void;
  plantingMode?: boolean;
  onPlantInSlot?: (index: number) => void;
  onUpgrade?: (index: number) => void;
  onRemove?: (index: number) => void;
  crystals: number;
}

const GRID_COLS = 6;
const TOTAL_SLOTS = 30;

export default function Garden({
  plants,
  selectedSlot,
  onSelect,
  plantingMode,
  onPlantInSlot,
  onUpgrade,
  onRemove,
  crystals,
}: GardenProps) {
  const count = plants.filter((p) => p !== null).length;

  return (
    <section className="overflow-hidden rounded-[10px] border border-[#33404d] bg-[#222b36] shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-dashed border-[#33404d] px-4 py-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-[#dce8ef]">
            Garden Grid
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#657486]">
            {plantingMode
              ? "Выбери свободную клетку"
              : `${count}/${TOTAL_SLOTS} planted`}
          </p>
        </div>
        <div className="rounded-md border border-[#3a4754] bg-[#1b222c] px-2.5 py-1 text-xs font-black text-[#91a0af]">
          LVL
        </div>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
          const plant = plants[i] || null;
          const isSelected = selectedSlot === i;
          const stage = plant ? getPlantStage(plant) : 0;
          const plantProgress = plant ? getPlantProgress(plant) : null;
          const canUpgrade = plant && stage >= 2 && plant.upgrades < 3 && crystals >= UPGRADE_PRICE;
          const isGrowing = plantProgress?.isGrowing ?? false;

          return (
            <button
              key={i}
              type="button"
              disabled={!plant && !plantingMode}
              onClick={() => {
                if (plant) {
                  onSelect(isSelected ? null : i);
                } else if (plantingMode && onPlantInSlot) {
                  onPlantInSlot(i);
                }
              }}
              className={`group relative flex flex-col h-[78px] items-center justify-center border-b border-r border-dashed border-[#33404d] transition-colors duration-200 sm:h-[108px] ${
                isSelected
                  ? "bg-[#2e4442]"
                  : plant
                    ? "bg-[#222b36] hover:bg-[#273440]"
                    : plantingMode
                      ? "cursor-pointer bg-[#28352e] hover:bg-[#2f4440]"
                      : "bg-[#222b36]/70"
              }`}
              aria-label={plant ? `Растение в клетке ${i + 1}` : plantingMode ? `Посадить в клетку ${i + 1}` : "Пустая клетка сада"}
            >
              <span className="pointer-events-none absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-[#3b4652] opacity-70" />

              {plant ? (
                <>
                  <div className="h-[62%] w-[62%] sm:h-[68%] sm:w-[68%]">
                    <Plant
                      stage={stage}
                      color={plant.color}
                      name={STAGE_NAMES[stage] || "Растение"}
                      highlighted={isSelected}
                      src={getPlantSpriteSrc(plant)}
                    />
                  </div>
                  {canUpgrade && (
                    <span className="absolute bottom-1 text-[9px] font-black text-[#d5a63d] leading-none">
                      ↑
                    </span>
                  )}
                  {isGrowing && plantProgress && (
                    <div className="absolute bottom-1 left-2 right-2 h-1 overflow-hidden rounded-full bg-[#1b222c]/60">
                      <div
                        className="h-full rounded-full bg-[#4d9e6d]/60"
                        style={{ width: `${Math.round(plantProgress.progress * 100)}%` }}
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
        })}
      </div>

      {selectedSlot !== null && plants[selectedSlot] && (() => {
        const plant = plants[selectedSlot]!;
        const stage = getPlantStage(plant);
        const progress = getPlantProgress(plant);
        return (
          <div className="border-t border-dashed border-[#33404d] px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#dce8ef]">
                  {STAGE_NAMES[stage] || "?"} — уровень {stage + 1}/6
                </p>
                <p className="text-[10px] font-semibold text-[#657486]">
                  {progress.isGrowing
                    ? `Растёт — ${formatTimeRemaining(progress.remainingMs)}`
                    : stage < 5 && plant.upgrades < 3
                      ? `${UPGRADE_PRICE} 💎 — улучшить`
                      : "Максимальный уровень"}
                </p>
              </div>
              <div className="flex gap-1.5">
                {stage >= 2 && plant.upgrades < 3 && (
                  <button
                    onClick={() => onUpgrade?.(selectedSlot!)}
                    disabled={crystals < UPGRADE_PRICE}
                    className={`rounded-md px-3 py-1 text-[11px] font-black uppercase transition-all ${
                      crystals >= UPGRADE_PRICE
                        ? "bg-[#d5a63d] text-[#1f2630] hover:bg-[#edbe52] active:scale-95"
                        : "cursor-not-allowed bg-[#3a3a2e] text-[#6b6348]"
                    }`}
                  >
                    ↑ {UPGRADE_PRICE} 💎
                  </button>
                )}
                <button
                  onClick={() => onRemove?.(selectedSlot!)}
                  title={`Удалить (вернуть ${PLANT_PRICE + plant.upgrades * UPGRADE_PRICE} 💎)`}
                  className="rounded-md border border-[#3a4653] bg-[#242f3a] px-2 py-1 text-[10px] font-black text-[#8d9ba8] transition-all hover:bg-[#432d35] hover:text-[#ff8d8d]"
                >
                  ✕
                </button>
              </div>
            </div>
            {progress.isGrowing && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1b222c]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#4d9e6d] to-[#6ecf8a] transition-all duration-1000"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
}
