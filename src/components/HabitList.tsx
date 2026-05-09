"use client";

import { Habit } from "@/lib/types";
import { getGrowthStage, STAGE_NAMES } from "@/lib/gameLogic";
import { XP_PER_COMPLETION } from "@/lib/types";

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
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Мои привычки
      </h3>

      {habits.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-6">
          Добавь первую привычку и начни выращивать сад!
        </p>
      )}

      {habits.map((habit) => {
        const stage = getGrowthStage(habit.completions);
        const isSelected = habit.id === selectedId;

        return (
          <div
            key={habit.id}
            onClick={() => onSelect(isSelected ? null : habit.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
              isSelected
                ? "bg-white border-green-400 shadow-md shadow-green-200/50 scale-[1.02]"
                : "bg-white/60 border-transparent hover:bg-white hover:shadow-sm"
            }`}
          >
            {/* Color dot */}
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: habit.color }}
            />

            {/* Name and stage */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {habit.name}
              </div>
              <div className="text-[11px] text-gray-400">
                {STAGE_NAMES[stage]} • {habit.completions} раз
              </div>
            </div>

            {/* Complete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(habit.id);
              }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 hover:bg-green-500 text-green-600 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm hover:shadow-md"
              title="Выполнить"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3,8 7,12 13,4" />
              </svg>
            </button>

            {/* XP label */}
            <span className="text-[11px] font-semibold text-amber-500 flex-shrink-0 w-10 text-right">
              +{XP_PER_COMPLETION} XP
            </span>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(habit.id);
              }}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors"
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
  );
}
