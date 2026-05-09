"use client";

import { PLANT_VARIANTS, PLANT_PRICE } from "@/lib/types";
import { PLANT_EMOJIS } from "@/components/Plant";

interface ShopProps {
  xp: number;
  onBuy: (variant: number) => boolean;
}

export default function Shop({ xp, onBuy }: ShopProps) {
  const canBuy = xp >= PLANT_PRICE;

  return (
    <div className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <h3 className="px-1 pb-2 text-xs font-black uppercase tracking-[0.18em] text-[#91a0af]">
        Магазин растений
      </h3>
      <div className="flex gap-2">
        {PLANT_VARIANTS.map((v, i) => (
          <button
            key={i}
            onClick={() => onBuy(i)}
            disabled={!canBuy}
            title={!canBuy ? `Нужно ${PLANT_PRICE} XP` : `Купить за ${PLANT_PRICE} XP`}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg border px-3 py-2.5 transition-all ${
              canBuy
                ? "border-[#456052] bg-[#2e4442] text-[#dcf7e7] shadow-sm shadow-black/20 hover:bg-[#3a564e] active:scale-[0.97]"
                : "cursor-not-allowed border-[#303b47] bg-[#1d2530] text-[#596675]"
            }`}
          >
            <span className="text-2xl">{v.emoji}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">
              {PLANT_PRICE} XP
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
