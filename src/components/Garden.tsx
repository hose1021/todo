"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PlantComp from "./Plant";
import { Plant as PlantType } from "@/lib/types";
import { getPlantGrowth, formatTimeRemaining } from "@/lib/gameLogic";
import { getPlantType, GROWTH_LEVELS } from "@/lib/plants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface GardenProps {
  plants: (PlantType | null)[];
  selectedSlot: number | null;
  onSelect: (index: number | null) => void;
  onUpgrade?: (index: number) => void;
  onRemove?: (index: number) => void;
  onRequestPlant: (slotIndex: number) => void;
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
  onUpgrade,
  onRemove,
  onRequestPlant,
  onAchievements,
  claimableCount,
  crystals,
}: GardenProps) {
  const count = plants.filter((p) => p !== null).length;
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
            {`${count}/${TOTAL_SLOTS}  посажено`}
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
          const def = plant ? getPlantType(plant.type) : undefined;

          let canUpgrade = false;
          let upgradeCost = 0;
          if (plant && def && plant.growthLevel < 3 && !isGrowing) {
            const nextLevel = plant.growthLevel + 1;
            const costMult = GROWTH_LEVELS[nextLevel]?.multiplier.cost ?? 1;
            upgradeCost = Math.round(def.cost * costMult);
            canUpgrade = crystals >= upgradeCost;
          }

          const onCellTap = () => {
            if (plant) {
              onSelect(isSelected ? null : i);
            } else {
              onRequestPlant(i);
            }
          };
          const onLongTap = () => {
            if (plant) {
              onSelect(isSelected ? null : i);
            }
          };

          if (!plant) {
            return (
              <GardenCell
                key={i}
                plant={null}
                isSelected={false}
                isGrowing={false}
                growth={null}
                canUpgrade={false}
                upgradeCost={0}
                onSelect={onCellTap}
                onLongPress={onLongTap}
              />
            );
          }

          if (isMobile) {
            return (
              <GardenCell
                key={i}
                plant={plant}
                isSelected={isSelected}
                isGrowing={isGrowing}
                growth={growth}
                canUpgrade={canUpgrade}
                upgradeCost={upgradeCost}
                onSelect={onCellTap}
                onLongPress={onLongTap}
              />
            );
          }

          return (
            <Popover
              key={i}
              open={isSelected}
              onOpenChange={(open) => {
                if (!open) onSelect(null);
              }}
            >
              <PopoverTrigger>
                <GardenCell
                  plant={plant}
                  isSelected={isSelected}
                  isGrowing={isGrowing}
                  growth={growth}
                  canUpgrade={canUpgrade}
                  upgradeCost={upgradeCost}
                  onSelect={onCellTap}
                  onLongPress={onLongTap}
                />
              </PopoverTrigger>
              {isSelected && (
                <PopoverContent className="w-60 p-3">
                  <PlantDetailPanel
                    plant={plant}
                    def={def}
                    growth={growth!}
                    crystals={crystals}
                    confirmRemove={confirmRemove}
                    onUpgradeNow={() => {
                      onUpgrade?.(i);
                      onSelect(null);
                    }}
                    onRemoveNow={() => {
                      onRemove?.(i);
                      onSelect(null);
                      setConfirmRemove(false);
                    }}
                    onConfirmRemove={() => setConfirmRemove(true)}
                    onCancelRemove={() => setConfirmRemove(false)}
                  />
                </PopoverContent>
              )}
            </Popover>
          );
        })}
      </div>

      {isMobile &&
        selectedSlot !== null &&
        plants[selectedSlot] &&
        (() => {
          const plant = plants[selectedSlot]!;
          const growth = getPlantGrowth(plant);
          const def = getPlantType(plant.type);

          return (
            <Sheet
              open={true}
              onOpenChange={(v) => {
                if (!v) onSelect(null);
              }}
            >
              <SheetContent
                side="bottom"
                className="border-0"
                style={{ backgroundColor: "#1e2731" }}
                showCloseButton={false}
              >
                <SheetHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{def?.emoji ?? "🌱"}</span>
                    <div>
                      <SheetTitle>{def?.name ?? plant.type}</SheetTitle>
                      <p className="mt-0.5 text-xs font-semibold text-[#657486]">
                        Уровень {growth.growthLevel}/3
                      </p>
                    </div>
                  </div>
                </SheetHeader>
                <div className="flex flex-col gap-3 px-4 pb-4">
                  <PlantDetailPanel
                    plant={plant}
                    def={def}
                    growth={growth}
                    crystals={crystals}
                    confirmRemove={confirmRemove}
                    onUpgradeNow={() => {
                      onUpgrade?.(selectedSlot!);
                      onSelect(null);
                    }}
                    onRemoveNow={() => {
                      onRemove?.(selectedSlot!);
                      onSelect(null);
                      setConfirmRemove(false);
                    }}
                    onConfirmRemove={() => setConfirmRemove(true)}
                    onCancelRemove={() => setConfirmRemove(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          );
        })()}
    </section>
  );
}

function PlantDetailPanel({
  plant,
  def,
  growth,
  crystals,
  confirmRemove,
  onUpgradeNow,
  onRemoveNow,
  onConfirmRemove,
  onCancelRemove,
}: {
  plant: PlantType;
  def: ReturnType<typeof getPlantType>;
  growth: ReturnType<typeof getPlantGrowth>;
  crystals: number;
  confirmRemove: boolean;
  onUpgradeNow: () => void;
  onRemoveNow: () => void;
  onConfirmRemove: () => void;
  onCancelRemove: () => void;
}) {
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
    <>
      {growth.isGrowing ? (
        <>
          <p className="text-xs text-[#a5d6b8]">
            Растёт — {formatTimeRemaining(growth.remainingMs)}
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#1b222c]">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#4d9e6d] to-[#6ecf8a] transition-all duration-1000"
              style={{ width: `${Math.round(growth.progress * 100)}%` }}
            />
          </div>
        </>
      ) : plant.growthLevel < 3 ? (
        <p className="text-xs text-[#a5d6b8]">{upgradeCost} 💎 — улучшить</p>
      ) : (
        <p className="text-xs text-[#657486]">Максимальный уровень</p>
      )}

      <div className="flex gap-2 mt-2">
        {plant.growthLevel < 3 && !growth.isGrowing && (
          <button
            onClick={onUpgradeNow}
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
              onClick={onRemoveNow}
              title={`Вернуть ${refund} 💎`}
              className="rounded-md bg-[#c0392b] px-2 py-1.5 text-[11px] font-black text-white transition-all hover:bg-[#e74c3c]"
            >
              Удалить (вернуть {refund} 💎)
            </button>
            <button
              onClick={onCancelRemove}
              className="rounded-md border border-[#3a4653] bg-[#242f3a] px-2 py-1.5 text-[11px] font-black text-[#8d9ba8] transition-all hover:bg-[#2b3845]"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={onConfirmRemove}
            title={`Удалить (вернуть ${refund} 💎)`}
            className="rounded-md border border-[#3a4653] bg-[#242f3a] px-2 py-1.5 text-[11px] font-black text-[#8d9ba8] transition-all hover:bg-[#432d35] hover:text-[#ff8d8d]"
          >
            ✕ Удалить
          </button>
        )}
      </div>
    </>
  );
}

function GardenCell({
  plant,
  isSelected,
  isGrowing,
  growth,
  canUpgrade,
  upgradeCost,
  onSelect,
  onLongPress,
}: {
  plant: PlantType | null;
  isSelected: boolean;
  isGrowing: boolean;
  growth: ReturnType<typeof getPlantGrowth> | null;
  canUpgrade: boolean;
  upgradeCost: number;
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
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onSelect}
      onContextMenu={(e) => {
        if (plant) {
          e.preventDefault();
          onLongPress();
        }
      }}
      className={`group relative w-full flex flex-col items-center justify-center border-b border-r border-dashed border-[#33404d] transition-colors duration-200 ${
        isSelected
          ? "bg-[#2e4442]"
          : plant
            ? "bg-[#222b36] hover:bg-[#273440]"
            : "cursor-pointer bg-[#222b36]/70 hover:bg-[#2a3a2a]"
      }`}
      style={{ minHeight: "6rem", height: "6rem" }}
      aria-label={plant ? `Растение` : "Пустая клетка — купить растение"}
      role="button"
      tabIndex={-1}
    >
      {plant ? (
        <>
          <div className="flex h-[62%] w-[62%] items-center justify-center sm:h-[68%] sm:w-[68%]">
            <PlantComp plant={plant} highlighted={isSelected} />
          </div>
          {canUpgrade && (
            <span className="absolute bottom-0.5 rounded-sm bg-[#d5a63d]/20 px-1 py-px text-[9px] font-black text-[#edbe52] leading-none sm:text-[10px]">
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
      ) : (
        <span
          aria-hidden="true"
          className="select-none text-[28px] leading-none text-[#5a8a6a] opacity-70 sm:text-[36px]"
        >
          +
        </span>
      )}
    </div>
  );
}
