"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Habit } from "@/lib/types";
import { XP_PER_COMPLETION, MAX_HABITS } from "@/lib/types";

type SortMode = "created" | "name" | "completions";

interface HabitListProps {
  habits: Habit[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => boolean;
  onToggleDaily: (id: string) => void;
  onAddHabit?: () => void;
  habitsFull?: boolean;
}

export default function HabitList({
  habits,
  selectedId,
  onSelect,
  onComplete,
  onDelete,
  onRename,
  onToggleDaily,
  onAddHabit,
  habitsFull,
}: HabitListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("created");
  const [floats, setFloats] = useState<Record<string, boolean>>({});
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const sortedHabits = useMemo(() => {
    const list = [...habits];
    switch (sortMode) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
        break;
      case "completions":
        list.sort((a, b) => b.completions - a.completions);
        break;
      default:
        list.sort((a, b) => a.createdAt - b.createdAt);
    }
    return list;
  }, [habits, sortMode]);

  const startEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
    setConfirmDeleteId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const submitRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName);
    }
    setEditingId(null);
    setEditName("");
  };

  return (
    <section className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#91a0af]">
          Мои привычки
        </h3>
        <div className="flex gap-0.5">
          <button
            onClick={onAddHabit}
            disabled={habitsFull}
            className={`rounded px-1.5 py-0.5 mr-0.5 text-[10px] font-black uppercase transition-all ${
              habitsFull
                ? "cursor-not-allowed text-[#596675]"
                : "bg-[#2e4442] text-[#a5d6b8] hover:bg-[#3a564e]"
            }`}
          >
            {habitsFull
              ? `${habits.length}/${MAX_HABITS}`
              : "+ добавить привычку"}
          </button>
          {(["created", "name", "completions"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase transition-all ${
                sortMode === mode
                  ? "bg-[#d5a63d] text-[#1f2630]"
                  : "text-[#596675] hover:text-[#91a0af]"
              }`}
            >
              {mode === "created" ? "Нов." : mode === "name" ? "А-Я" : "Топ"}
            </button>
          ))}
        </div>
      </div>

      {habits.length === 0 && (
        <p className="py-6 text-center text-sm font-semibold text-[#657486]">
          Добавь первую привычку и начни зарабатывать XP!
        </p>
      )}

      <div className="flex max-h-[360px] flex-col gap-2 overflow-auto pr-1">
        {sortedHabits.map((habit) => {
          const isSelected = habit.id === selectedId;
          const isEditing = habit.id === editingId;
          const isConfirming = habit.id === confirmDeleteId;

          return (
            <div
              key={habit.id}
              onClick={() => {
                if (!isEditing && !isConfirming) {
                  onSelect(isSelected ? null : habit.id);
                }
              }}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                isSelected
                  ? "scale-[1.01] border-[#55746e] bg-[#2e4442] shadow-md shadow-black/20"
                  : "border-[#303b47] bg-[#1d2530] hover:border-[#3e4c5b] hover:bg-[#242f3a]"
              }`}
            >
              {isEditing ? (
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={40}
                    className="min-w-0 flex-1 rounded-md border border-[#607d73] bg-[#1b222c] px-2 py-1 text-sm font-black text-[#e5edf3] outline-none"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      submitRename();
                    }}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#4CAF50] text-[#1f2630] text-xs font-black hover:bg-[#66d06a]"
                    title="Сохранить"
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[#667584] hover:bg-[#3a3a3e]"
                    title="Отмена"
                  >
                    ✕
                  </button>
                </div>
              ) : isConfirming ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-xs font-semibold text-[#ff8d8d]">
                    Удалить «{habit.name}»?
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(habit.id);
                      setConfirmDeleteId(null);
                    }}
                    className="flex h-7 flex-shrink-0 items-center rounded-md bg-[#c0392b] px-2 text-[11px] font-black text-white hover:bg-[#e74c3c]"
                  >
                    Да
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(null);
                    }}
                    className="flex h-7 flex-shrink-0 items-center rounded-md border border-[#3a4653] bg-[#242f3a] px-2 text-[11px] font-black text-[#8d9ba8] hover:bg-[#2b3845]"
                  >
                    Нет
                  </button>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-black text-[#e5edf3] hover:text-[#b8d4a8] hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(habit);
                      }}
                      title="Нажми, чтобы переименовать"
                    >
                      {habit.name}
                    </div>
                    <div className="text-[11px] font-semibold text-[#697888]">
                      {habit.completions} раз
                      {habit.isDaily && (
                        <span className="ml-1 inline-block rounded bg-[#3a4a6e] px-1 py-px text-[10px] font-black text-[#8ab4f8]">
                          день
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDaily(habit.id);
                    }}
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs transition-colors ${
                      habit.isDaily
                        ? "bg-[#3a4a6e] text-[#a8c8ff] hover:bg-[#4a5a7e]"
                        : "text-[#3a4653] hover:text-[#8795a4]"
                    }`}
                    title={
                      habit.isDaily ? "Снять ежедневный" : "Сделать ежедневным"
                    }
                  >
                    ↻
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloats((f) => ({ ...f, [habit.id]: true }));
                      setTimeout(
                        () =>
                          setFloats((f) => {
                            const next = { ...f };
                            delete next[habit.id];
                            return next;
                          }),
                        1200,
                      );
                      onComplete(habit.id);
                    }}
                    className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#31453e] text-[#a8e8bd] shadow-sm transition-all hover:bg-[#3f674d] active:scale-90"
                    title="Выполнить"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="3,8 7,12 13,4" />
                    </svg>
                    {floats[habit.id] && (
                      <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-[#a8e8bd] animate-float-up">
                        +{XP_PER_COMPLETION} XP
                      </span>
                    )}
                  </button>

                  <span className="w-10 flex-shrink-0 text-right text-[11px] font-black text-[#d5a63d]">
                    +{XP_PER_COMPLETION} XP
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(habit.id);
                    }}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[#667584] transition-colors hover:bg-[#432d35] hover:text-[#ff8d8d]"
                    title="Удалить"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="2" y1="2" x2="10" y2="10" />
                      <line x1="10" y1="2" x2="2" y2="10" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
