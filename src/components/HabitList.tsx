"use client";

import { Habit } from "@/lib/types";
import { XP_PER_COMPLETION, CRYSTALS_PER_COMPLETION } from "@/lib/types";

interface HabitListProps {
  habits: Habit[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function HabitList({
  habits,
  selectedId,
  onSelect,
  onComplete,
  onDelete,
}: HabitListProps) {
  return (
    <section className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <h3 className="px-1 pb-2 text-xs font-black uppercase tracking-[0.18em] text-[#91a0af]">
        Мои привычки
      </h3>

      {habits.length === 0 && (
        <p className="py-6 text-center text-sm font-semibold text-[#657486]">
          Добавь первую привычку и начни зарабатывать XP!
        </p>
      )}

      <div className="flex max-h-[360px] flex-col gap-2 overflow-auto pr-1">
        {habits.map((habit) => {
          const isSelected = habit.id === selectedId;

          return (
            <div
              key={habit.id}
              onClick={() => onSelect(isSelected ? null : habit.id)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                isSelected
                  ? "scale-[1.01] border-[#55746e] bg-[#2e4442] shadow-md shadow-black/20"
                  : "border-[#303b47] bg-[#1d2530] hover:border-[#3e4c5b] hover:bg-[#242f3a]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-[#e5edf3]">
                  {habit.name}
                </div>
                <div className="text-[11px] font-semibold text-[#697888]">
                  {habit.completions} раз
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(habit.id);
                }}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#31453e] text-[#a8e8bd] shadow-sm transition-all hover:bg-[#3f674d] active:scale-90"
                title="Выполнить"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3,8 7,12 13,4" />
                </svg>
              </button>

              <span className="w-10 flex-shrink-0 text-right text-[11px] font-black text-[#d5a63d]">
                +{XP_PER_COMPLETION} XP
              </span>
              <span className="w-10 flex-shrink-0 text-right text-[11px] font-black text-[#a5d6b8]">
                +{CRYSTALS_PER_COMPLETION} 💎
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(habit.id);
                }}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[#667584] transition-colors hover:bg-[#432d35] hover:text-[#ff8d8d]"
                title="Удалить"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="2" y1="2" x2="10" y2="10" />
                  <line x1="10" y1="2" x2="2" y2="10" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
