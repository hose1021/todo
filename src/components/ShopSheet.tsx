"use client";

import { PLANT_TYPES, RARITY_LEVELS } from "@/lib/plants";
import { AchievementState } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ShopSheetProps {
  open: boolean;
  onClose: () => void;
  slotIndex: number;
  crystals: number;
  achievements: AchievementState[];
  onBuy: (type: string) => void;
}

export default function ShopSheet({
  open,
  onClose,
  crystals,
  achievements,
  onBuy,
}: ShopSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[70vh] overflow-auto border-0"
        style={{ backgroundColor: "#1e2731" }}
        showCloseButton={false}
      >
        <SheetHeader>
          <SheetTitle>Магазин растений</SheetTitle>
        </SheetHeader>
        <div className="flex flex-wrap gap-2 px-1 pb-2">
          {PLANT_TYPES.map((def) => {
            const unlocked = def.canPlant(achievements);
            const canAfford = crystals >= def.cost && unlocked;
            const rarity = RARITY_LEVELS[def.rarity];

            return (
              <button
                key={def.type}
                onClick={() => {
                  if (canAfford) {
                    onBuy(def.type);
                    onClose();
                  }
                }}
                disabled={!canAfford}
                title={
                  !unlocked
                    ? `Требуется ачивка ${def.name}`
                    : !canAfford && crystals < def.cost
                      ? `Нужно ${def.cost} 💎`
                      : `Купить за ${def.cost} 💎`
                }
                className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 transition-all ${
                  canAfford
                    ? `${rarity.bgColor} border-current/20 shadow-xs shadow-black/20 hover:brightness-110 active:scale-[0.97]`
                    : `cursor-not-allowed border-[#303b47] ${rarity.bgColor} opacity-50`
                }`}
              >
                <span className="select-none leading-none text-2xl">
                  {def.emoji}
                </span>
                <div className="text-center">
                  <p className="text-[10px] font-black text-[#dce8f0] truncate max-w-[80px]">
                    {def.name}
                  </p>
                  <p className="text-[9px] font-bold text-[#657486]">
                    {rarity.name}
                  </p>
                  <p className="text-[10px] font-bold text-[#a5d6b8]">
                    {def.cost} 💎
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
