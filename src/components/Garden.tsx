"use client";

import Plant from "./Plant";
import { Habit } from "@/lib/types";
import { getGrowthStage, STAGE_NAMES } from "@/lib/gameLogic";

interface GardenProps {
  habits: Habit[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const GRID_COLS = 4;
const TOTAL_SLOTS = 12;

export default function Garden({ habits, selectedId, onSelect }: GardenProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(180deg, #C8E6C9 0%, #A5D6A7 30%, #81C784 100%)" }}>
      {/* Grass texture */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #2E7D32 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Decorative clouds */}
      <Cloud x={15} y={8} scale={0.6} />
      <Cloud x={60} y={5} scale={0.4} />
      <Cloud x={85} y={12} scale={0.5} />

      {/* Soil grid */}
      <div
        className="relative grid gap-y-4 gap-x-2 p-4 sm:p-6"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
      >
        {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
          const habit = habits[i] || null;
          const stage = habit ? getGrowthStage(habit.completions) : -1;
          const isSelected = habit?.id === selectedId;

          return (
            <div
              key={i}
              className="relative flex flex-col items-center"
              style={{ minHeight: "90px" }}
            >
              {/* Soil patch */}
              <div className="absolute bottom-2 w-[80%] h-10 rounded-[50%]"
                style={{
                  background: "linear-gradient(180deg, #8D6E63 0%, #795548 40%, #5D4037 100%)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                }}
              />

              {/* Plant */}
              <div
                className={`relative z-10 flex items-end justify-center w-full transition-all duration-300 ${
                  habit ? "cursor-pointer" : "cursor-default"
                } ${isSelected ? "scale-110" : "hover:scale-105"}`}
                style={{ height: "80px", paddingBottom: "16px" }}
                onClick={() => {
                  if (habit) onSelect(isSelected ? null : habit.id);
                }}
              >
                {habit ? (
                  <Plant
                    completions={habit.completions}
                    color={habit.color}
                    name={habit.name}
                    highlighted={isSelected}
                  />
                ) : (
                  <EmptyPatch />
                )}
              </div>

              {/* Stage label */}
              {habit && (
                <span className="absolute -bottom-1 text-[9px] sm:text-[10px] text-gray-600 font-medium whitespace-nowrap">
                  {STAGE_NAMES[stage]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Fence at bottom */}
      <Fence />
    </div>
  );
}

function EmptyPatch() {
  return (
    <svg viewBox="0 0 60 80" className="w-full h-full max-w-[60px] max-h-[80px] opacity-40">
      <ellipse cx="30" cy="62" rx="10" ry="4" fill="#6D4C41" opacity="0.4" />
    </svg>
  );
}

function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: `scale(${scale})` }}
    >
      <svg width="60" height="30" viewBox="0 0 60 30" className="text-white/70 fill-current">
        <ellipse cx="20" cy="22" rx="16" ry="8" />
        <ellipse cx="35" cy="18" rx="18" ry="10" />
        <ellipse cx="50" cy="22" rx="12" ry="7" />
      </svg>
    </div>
  );
}

function Fence() {
  return (
    <div className="flex justify-around px-3 pb-2 pt-0 opacity-50">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-1.5 h-6 bg-amber-800 rounded-t-sm" />
        </div>
      ))}
    </div>
  );
}
