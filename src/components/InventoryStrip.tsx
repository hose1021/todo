"use client";

import Image from "next/image";
import { Plant } from "@/lib/types";

interface InventoryStripProps {
  inventory: Plant[];
  plantingMode: boolean;
  selectedPlantId: string | null;
  onSelect: (id: string | null) => void;
  onRequestPlant: (id: string) => void;
}

export default function InventoryStrip({
  inventory,
  plantingMode,
  selectedPlantId,
  onSelect,
  onRequestPlant,
}: InventoryStripProps) {
  if (inventory.length === 0) return null;

  return (
    <div className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <h3 className="px-1 pb-2 text-xs font-black uppercase tracking-[0.18em] text-[#91a0af]">
        Инвентарь ({inventory.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {inventory.map((plant) => {
          const isSelected = plant.id === selectedPlantId;

          return (
            <button
              key={plant.id}
              onClick={() => {
                if (plantingMode && isSelected) {
                  onSelect(null);
                } else if (!plantingMode) {
                  onRequestPlant(plant.id);
                }
              }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                plantingMode && isSelected
                  ? "border-[#55746e] bg-[#2e4442] shadow-md shadow-black/20"
                  : plantingMode
                    ? "cursor-not-allowed border-[#303b47] bg-[#1d2530] opacity-50"
                    : "border-[#3a4a3e] bg-[#25302d] hover:border-[#4d6150] hover:bg-[#2e3e38] active:scale-[0.97]"
              }`}
            >
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: plant.color, boxShadow: `0 0 8px ${plant.color}66` }}
              />
              <div className="relative h-8 w-8">
                <Image
                  src={`/trees/${plant.variant}/1.png`}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <span className="text-[10px] font-black text-[#a5d6b8]">
                {plantingMode && isSelected ? "Посадка..." : "Посадить"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
