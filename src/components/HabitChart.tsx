"use client";

import { useState } from "react";
import { Habit } from "@/lib/types";
import { DAY_LABELS } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconChartBar } from "@tabler/icons-react";

type Period = "week" | "month" | "year";

const MONTH_LABELS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface HabitChartProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getWeekDates(): { label: string; date: string }[] {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: WEEK_DAYS[i],
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    };
  });
}

function getMonthDates(): { label: string; date: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }).map((_, i) => ({
    label: String(i + 1),
    date: `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
  }));
}

function getYearMonths(): { label: string; months: { label: string; date: string }[] }[] {
  const now = new Date();
  const year = now.getFullYear();

  return Array.from({ length: 12 }).map((_, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const months = Array.from({ length: daysInMonth }).map((_, day) => ({
      label: String(day + 1),
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}`,
    }));
    return {
      label: MONTH_LABELS[month],
      months,
    };
  });
}

export default function HabitChart({ habit, open, onOpenChange }: HabitChartProps) {
  const [period, setPeriod] = useState<Period>("month");

  let segments: { label: string; completed: boolean }[] = [];

  if (period === "week") {
    segments = getWeekDates().map((d) => ({
      label: d.label,
      completed: habit.completionHistory.includes(d.date),
    }));
  } else if (period === "month") {
    segments = getMonthDates().map((d) => ({
      label: d.label,
      completed: habit.completionHistory.includes(d.date),
    }));
  } else {
    segments = getYearMonths().map((m) => ({
      label: m.label,
      completed: m.months.some((d) => habit.completionHistory.includes(d.date)),
    }));
  }

  const hasData = habit.completionHistory.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">{habit.name}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-3">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-black uppercase transition-all ${
                period === p
                  ? "bg-[#d5a63d] text-[#1f2630]"
                  : "bg-[#242f3a] text-[#596675] border border-[#3a4653] hover:text-[#91a0af]"
              }`}
            >
              {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
            </button>
          ))}
        </div>

        {!hasData ? (
          <p className="text-center text-sm text-[#657486] py-8">
            Нет данных за этот период
          </p>
        ) : (
          <div className="flex items-end gap-px h-32 w-full">
            {segments.map((seg, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: seg.completed ? "100%" : "4px",
                    backgroundColor: seg.completed ? "#4CAF50" : "#2a3440",
                    minHeight: seg.completed ? "8px" : "4px",
                  }}
                />
                {segments.length <= 31 && (
                  <span className="text-[9px] text-[#596675] mt-1">
                    {seg.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ChartTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#596675] transition-colors hover:bg-[#2a3540] hover:text-[#8795a4]"
      title="Статистика"
    >
      <IconChartBar size={16} />
    </button>
  );
}
