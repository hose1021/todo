"use client";

import { getGrowthStage, STAGE_NAMES } from "@/lib/gameLogic";

interface PlantProps {
  completions: number;
  color: string;
  name: string;
  highlighted?: boolean;
}

export default function Plant({ completions, color, name, highlighted }: PlantProps) {
  const stage = getGrowthStage(completions);

  return (
    <div
      className={`relative flex flex-col items-center justify-end w-full h-full cursor-pointer transition-transform hover:scale-105 ${
        highlighted ? "scale-110" : ""
      }`}
      title={`${name} — ${STAGE_NAMES[stage]}`}
    >
      <svg
        viewBox="0 0 60 80"
        className="w-full h-full max-w-[60px] max-h-[80px]"
        style={{ filter: highlighted ? "drop-shadow(0 0 6px rgba(255,255,255,0.7))" : undefined }}
      >
        {stage === 0 && <SeedSVG />}
        {stage === 1 && <SproutSVG />}
        {stage === 2 && <YoungSVG />}
        {stage === 3 && <GrowingSVG color={color} />}
        {stage === 4 && <MatureSVG color={color} />}
        {stage === 5 && <BloomingSVG color={color} />}
      </svg>
      {highlighted && (
        <span className="absolute -bottom-2 text-[10px] bg-white/90 px-2 py-0.5 rounded-full shadow text-gray-700 whitespace-nowrap">
          {name}
        </span>
      )}
    </div>
  );
}

function SeedSVG() {
  return (
    <>
      <ellipse cx="30" cy="62" rx="14" ry="10" fill="#8B6914" opacity="0.3" />
      <ellipse cx="30" cy="58" rx="11" ry="14" fill="#A1887F" />
      <ellipse cx="30" cy="54" rx="7" ry="10" fill="#BCAAA4" />
    </>
  );
}

function SproutSVG() {
  return (
    <>
      <ellipse cx="30" cy="62" rx="14" ry="8" fill="#8B6914" opacity="0.2" />
      <rect x="28" y="33" width="4" height="24" rx="2" fill="#66BB6A" />
      <ellipse cx="22" cy="40" rx="9" ry="5" fill="#4CAF50" transform="rotate(-20 22 40)" />
      <ellipse cx="38" cy="37" rx="9" ry="5" fill="#4CAF50" transform="rotate(20 38 37)" />
    </>
  );
}

function YoungSVG() {
  return (
    <>
      <ellipse cx="30" cy="62" rx="14" ry="8" fill="#8B6914" opacity="0.2" />
      <rect x="27" y="22" width="5" height="36" rx="2" fill="#795548" />
      <ellipse cx="19" cy="32" rx="11" ry="6" fill="#4CAF50" />
      <ellipse cx="41" cy="30" rx="11" ry="6" fill="#4CAF50" />
      <ellipse cx="22" cy="44" rx="10" ry="5" fill="#66BB6A" />
      <ellipse cx="38" cy="42" rx="10" ry="5" fill="#66BB6A" />
    </>
  );
}

function GrowingSVG({ color }: { color: string }) {
  return (
    <>
      <rect x="26" y="18" width="6" height="40" rx="3" fill="#6D4C41" />
      <circle cx="30" cy="22" r="17" fill="#388E3C" />
      <circle cx="16" cy="27" r="11" fill="#2E7D32" />
      <circle cx="42" cy="24" r="10" fill="#2E7D32" />
      <circle cx="22" cy="14" r="8" fill="#4CAF50" />
      <circle cx="38" cy="16" r="9" fill="#4CAF50" />
      <circle cx="30" cy="14" r="10" fill="#43A047" />
      <circle cx="30" cy="5" r="5" fill={color} />
    </>
  );
}

function MatureSVG({ color }: { color: string }) {
  return (
    <>
      <rect x="26" y="12" width="6" height="46" rx="3" fill="#5D4037" />
      <circle cx="30" cy="18" r="21" fill="#2E7D32" />
      <circle cx="13" cy="22" r="13" fill="#1B5E20" />
      <circle cx="45" cy="20" r="12" fill="#1B5E20" />
      <circle cx="20" cy="10" r="10" fill="#388E3C" />
      <circle cx="40" cy="12" r="9" fill="#388E3C" />
      <circle cx="30" cy="12" r="12" fill="#43A047" />
      {/* Flower */}
      <ellipse cx="30" cy="-3" rx="6" ry="10" fill={color} />
      <ellipse cx="22" cy="3" rx="10" ry="6" fill={color} transform="rotate(-15 22 3)" />
      <ellipse cx="38" cy="3" rx="10" ry="6" fill={color} transform="rotate(15 38 3)" />
      <ellipse cx="30" cy="9" rx="6" ry="9" fill={color} />
      <circle cx="30" cy="3" r="5" fill="#FFEB3B" />
    </>
  );
}

function BloomingSVG({ color }: { color: string }) {
  return (
    <>
      <rect x="25" y="8" width="7" height="50" rx="3" fill="#4E342E" />
      <circle cx="30" cy="14" r="25" fill="#1B5E20" />
      <circle cx="10" cy="18" r="15" fill="#0D3B0D" />
      <circle cx="48" cy="16" r="14" fill="#0D3B0D" />
      <circle cx="16" cy="5" r="11" fill="#2E7D32" />
      <circle cx="42" cy="6" r="10" fill="#2E7D32" />
      <circle cx="30" cy="5" r="14" fill="#388E3C" />
      {/* Main flower */}
      <ellipse cx="30" cy="-12" rx="8" ry="13" fill={color} />
      <ellipse cx="20" cy="-4" rx="13" ry="8" fill={color} />
      <ellipse cx="40" cy="-4" rx="13" ry="8" fill={color} />
      <ellipse cx="30" cy="5" rx="8" ry="11" fill={color} />
      <circle cx="30" cy="-4" r="6" fill="#FFEB3B" />
      {/* Side bud */}
      <ellipse cx="18" cy="-18" rx="5" ry="8" fill={color} opacity="0.85" />
      <ellipse cx="12" cy="-12" rx="8" ry="5" fill={color} opacity="0.85" />
      <ellipse cx="24" cy="-12" rx="8" ry="5" fill={color} opacity="0.85" />
      <ellipse cx="18" cy="-6" rx="5" ry="8" fill={color} opacity="0.85" />
      <circle cx="18" cy="-12" r="3.5" fill="#FFEB3B" opacity="0.85" />
    </>
  );
}
