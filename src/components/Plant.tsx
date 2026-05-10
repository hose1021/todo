"use client";

import { memo } from "react";
import { Plant as PlantType } from "@/lib/types";
import { getPlantType, SPROUT_EMOJI } from "@/lib/plants";
import { getPlantGrowth, getPlantScaleSaturate } from "@/lib/gameLogic";

interface PlantProps {
  plant: PlantType;
  highlighted?: boolean;
}

export default memo(function Plant({ plant, highlighted }: PlantProps) {
  const def = getPlantType(plant.type);
  const growth = getPlantGrowth(plant);
  const scaleSaturate = getPlantScaleSaturate(plant);
  const emoji = growth.isGrowing ? SPROUT_EMOJI : (def?.emoji ?? SPROUT_EMOJI);
  const name = def?.name ?? plant.type;
  const levelName = growth.growthLevel === 1 ? "" : ` Lv${growth.growthLevel}`;

  return (
    <div
      className={`relative flex h-full w-full cursor-pointer items-center justify-center transition-transform duration-200 hover:scale-110 ${
        highlighted ? "scale-110" : ""
      }`}
      title={`${name} — уровень ${growth.growthLevel}${growth.isGrowing ? " (растёт)" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`select-none leading-none ${def?.size ?? "text-3xl"} ${scaleSaturate} ${
          growth.isGrowing ? "opacity-70" : ""
        }`}
        style={{
          filter: highlighted
            ? "drop-shadow(0 0 12px rgba(213,166,61,0.7)) drop-shadow(0 8px 12px rgba(0,0,0,0.35))"
            : "drop-shadow(0 7px 9px rgba(0,0,0,0.32))",
        }}
      >
        {emoji}
      </span>
    </div>
  );
});
