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
    <div className="flex items-center gap-3 rounded-lg border border-[#3a4653] bg-[#242f3a]/90 px-3 py-2 shadow-lg shadow-black/20">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#d5a63d] text-sm font-black text-[#1f2630] shadow-sm">
        {level}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex justify-between gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#8795a4]">
          <span>Уровень {level}</span>
          <span>{xp} / {needed} XP</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#161d25] shadow-inner shadow-black/30">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #f3cf57, #de8d35)",
              boxShadow: "0 0 10px rgba(222, 141, 53, 0.35)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
