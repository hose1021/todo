"use client";

import { getXPForLevel } from "@/lib/gameLogic";

interface XPBarProps {
  xp: number;
  level: number;
}

export default function XPBar({ xp, level }: XPBarProps) {
  const needed = getXPForLevel(level);
  const pct = Math.min((xp / needed) * 100, 100);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur rounded-xl shadow-sm border border-green-100">
      {/* Level badge */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-400 text-white flex items-center justify-center text-sm font-bold shadow-sm">
        {level}
      </div>

      {/* Bar */}
      <div className="flex-1">
        <div className="flex justify-between text-[11px] text-gray-500 mb-0.5">
          <span>Уровень {level}</span>
          <span>{xp} / {needed} XP</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #FFD700, #FFA000)",
              boxShadow: "0 0 6px rgba(255, 193, 7, 0.4)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
