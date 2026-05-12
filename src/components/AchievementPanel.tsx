"use client";

import { ACHIEVEMENTS } from "@/lib/achievements";
import { AchievementState } from "@/lib/types";

interface AchievementPanelProps {
  achievements: AchievementState[];
  onClaim: (id: string) => void;
  getProgressFor: (id: string) => { current: number; target: number };
}

interface ProgressInfo {
  ratio: number;
  progress: { current: number; target: number };
}

const STATUS_CLASSES: Record<string, string> = {
  unlocked: "border-[#d5a63d] bg-[#2a3a2a]/80 shadow-[0_0_8px_rgba(213,166,61,0.15)]",
  claimed: "border-[#304a38] bg-[#1d2b20]/60",
  locked: "border-[#303b47] bg-[#1d2530]/60",
};

const STATUS_SORT_ORDER: Record<string, number> = {
  unlocked: 0,
  locked: 1,
  claimed: 2,
};

export default function AchievementPanel({
  achievements,
  onClaim,
  getProgressFor,
}: AchievementPanelProps) {
  const items = ACHIEVEMENTS.map((def) => {
    const state = achievements.find((a) => a.id === def.id);
    return {
      def,
      status: state?.status ?? "locked",
    };
  });

  const getProgressInfo = (item: (typeof items)[number]): ProgressInfo => {
    if (item.status !== "locked") {
      return { ratio: 1, progress: { current: 1, target: 1 } };
    }
    const progress = getProgressFor(item.def.id);
    const ratio = progress.target > 0 ? Math.min(1, progress.current / progress.target) : 0;
    return { ratio, progress };
  };

  items.sort((a, b) => {
    return (
      STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status] ||
      getProgressInfo(b).ratio - getProgressInfo(a).ratio ||
      a.def.id.localeCompare(b.def.id)
    );
  });

  if (items.length === 0) return null;

  return (
    <div className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <h3 className="px-1 pb-3 text-xs font-black uppercase tracking-[0.18em] text-[#91a0af]">
        Достижения
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const { ratio, progress } = getProgressInfo(item);
          const { def, status } = item;

          return (
            <div
              key={def.id}
              className={`flex flex-col gap-1.5 rounded-lg border p-2.5 transition-all ${STATUS_CLASSES[status]}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lg leading-none">{def.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black uppercase tracking-[0.06em] text-[#e0e9f0]">
                    {def.name}
                  </p>
                  <p className="truncate text-[11px] text-[#6e7d8b]">
                    {def.description}
                  </p>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a3440]">
                <div
                  className={`h-full rounded-full transition-all ${
                    status === "claimed" ? "bg-[#4a8a5e]" : "bg-[#d5a63d]"
                  }`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              {status === "locked" && (
                <span className="text-center text-[11px] text-[#4d5a68]">
                  {progress.current}/{progress.target}
                </span>
              )}
              {status === "unlocked" && (
                <button
                  onClick={() => onClaim(def.id)}
                  className="mt-0.5 w-full rounded-md bg-[#d5a63d] py-1.5 text-[11px] font-black uppercase tracking-widest text-[#1f2630] hover:bg-[#edbe52] active:scale-[0.97] transition-all"
                >
                  Взять
                </button>
              )}
              {status === "claimed" && (
                <span className="mt-0.5 text-center text-[11px] font-bold text-[#5d8a6e]">
                  ✓ Получено
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
