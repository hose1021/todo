"use client";

import { PLANT_TYPES, RARITY_LEVELS } from "@/lib/plants";
import { AchievementState } from "@/lib/types";

interface ShopProps {
  crystals: number;
  achievements: AchievementState[];
  onBuy: (type: string) => boolean;
}

export default function Shop({ crystals, achievements, onBuy }: ShopProps) {
  return (
    <div className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <h3 className="px-1 pb-2 text-xs font-black uppercase tracking-[0.18em] text-[#91a0af]">
        Магазин растений
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {PLANT_TYPES.map((def) => {
          const unlocked = def.canPlant(achievements);
          const canAfford = crystals >= def.cost && unlocked;
          const rarity = RARITY_LEVELS[def.rarity];

          return (
            <button
              key={def.type}
              onClick={() => onBuy(def.type)}
              disabled={!canAfford}
              title={
                !unlocked
                  ? `Требуется ачивка ${def.name}`
                  : !canAfford && crystals < def.cost
                    ? `Нужно ${def.cost} 💎`
                    : `Купить за ${def.cost} 💎`
              }
              className={`flex h-[110px] w-full flex-col items-center justify-between rounded-lg border px-2 py-2 transition-all ${rarity.bgColor} ${
                canAfford
                  ? "border-[#456052] shadow-sm shadow-black/20 hover:brightness-110 active:scale-[0.97]"
                  : "cursor-not-allowed border-[#303b47] opacity-50"
              }`}
            >
              <span className={`select-none leading-none text-4xl`}>
                {def.emoji}
              </span>
              <div className="w-full text-center">
                <p className="text-sm font-black text-[#dce8f0]">{def.name}</p>
                <p className="font-bold text-xs text-[#a5d6b8]">
                  {def.cost} 💎
                </p>
                <p className="text-xs font-semibold text-[#657486]">
                  {rarity.name}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
