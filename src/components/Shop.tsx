"use client";

import Image from "next/image";
import { TREE_VARIANTS, PLANT_PRICE } from "@/lib/types";

interface ShopProps {
  crystals: number;
  onBuy: (variant: string) => boolean;
}

export default function Shop({ crystals, onBuy }: ShopProps) {
  const canBuy = crystals >= PLANT_PRICE;

  return (
    <div className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <h3 className="px-1 pb-2 text-xs font-black uppercase tracking-[0.18em] text-[#91a0af]">
        Магазин растений
      </h3>
      <div className="flex gap-2">
        {TREE_VARIANTS.map((variant) => (
          <button
            key={variant}
            onClick={() => onBuy(variant)}
            disabled={!canBuy}
            title={
              !canBuy
                ? `Нужно ${PLANT_PRICE} 💎`
                : `Купить за ${PLANT_PRICE} 💎`
            }
            className={`flex items-center gap-1 rounded-lg border px-3 py-2.5 transition-all ${
              canBuy
                ? "border-[#456052] bg-[#2e4442] text-[#dcf7e7] shadow-sm shadow-black/20 hover:bg-[#3a564e] active:scale-[0.97]"
                : "cursor-not-allowed border-[#303b47] bg-[#1d2530] text-[#596675]"
            }`}
          >
            <div className="relative h-14 w-14">
              <Image
                src={`/trees/${variant}/10.png`}
                alt={variant}
                fill
                className="object-contain"
                sizes="56px"
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">
              {PLANT_PRICE} 💎
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
