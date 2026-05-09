"use client";

import { STAGE_NAMES } from "@/lib/gameLogic";

interface PlantProps {
  stage: number;
  color: string;
  name: string;
  highlighted?: boolean;
  variant?: number;
}

export const PLANT_EMOJIS = [
  ["🌱", "🌿", "☘️"],
  ["🌿", "🍀", "🌱"],
  ["🌷", "🌸", "🌺"],
  ["🌴", "🌳", "🥦"],
  ["🌻", "🌹", "🌼"],
  ["🌺", "🌷", "🌸"],
];

export default function Plant({ stage, color, name, highlighted, variant }: PlantProps) {
  const bucket = PLANT_EMOJIS[stage] ?? PLANT_EMOJIS[0];
  const v = (variant ?? 0) % bucket.length;
  const emoji = bucket[v];

  return (
    <div
      className={`relative flex h-full w-full cursor-pointer items-center justify-center transition-transform duration-200 hover:scale-110 ${
        highlighted ? "scale-110" : ""
      }`}
      title={`${name} — ${STAGE_NAMES[stage] || "?"}`}
    >
      <span
        aria-hidden="true"
        className="select-none text-[34px] leading-none sm:text-[44px]"
        style={{
          filter: highlighted
            ? `drop-shadow(0 0 12px ${color}) drop-shadow(0 8px 12px rgba(0,0,0,0.35))`
            : "drop-shadow(0 7px 9px rgba(0,0,0,0.32))",
        }}
      >
        {emoji}
      </span>
      {highlighted && (
        <span className="absolute -bottom-4 max-w-[92px] truncate rounded-md border border-[#526474] bg-[#202833]/95 px-2 py-0.5 text-[10px] font-semibold text-[#dce8f0] shadow-lg shadow-black/30">
          {name}
        </span>
      )}
    </div>
  );
}
