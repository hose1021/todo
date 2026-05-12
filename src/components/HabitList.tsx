"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Habit } from "@/lib/types";
import { XP_PER_COMPLETION, MAX_HABITS } from "@/lib/types";
import { useHabitSwipe } from "@/hooks/useHabitSwipe";

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

  const completeWithFloat = useCallback(
    (id: string) => {
      setFloats((float) => ({ ...float, [id]: true }));
      setTimeout(
        () =>
          setFloats((f) => {
            const next = { ...f };
            delete next[id];
            return next;
          }),
        1200,
      );
      onComplete(id);
    },
    [onComplete],
  );

  return (
    <section className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#91a0af]">
          Мои привычки
        </h3>
        <div className="flex gap-0.5">
          {habits.length > 0 &&
            (["created", "name", "completions"] as SortMode[]).map((mode) => (
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
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-center text-sm font-semibold text-[#657486]">
            Добавь первую привычку и начни зарабатывать XP!
          </p>
          <button
            onClick={onAddHabit}
            className="rounded-lg border border-[#456052] bg-[#2e4442] px-6 py-3 text-sm font-black tracking-widest text-[#dcf7e7] shadow-lg shadow-black/20 hover:bg-[#36514d] active:scale-[0.98] transition-all"
          >
            + Добавить привычку
          </button>
        </div>
      )}

      <div className="flex max-h-[360px] flex-col gap-2 overflow-auto">
        {sortedHabits.map((habit) => {
          const isSelected = habit.id === selectedId;
          const isEditing = habit.id === editingId;
          const isConfirming = habit.id === confirmDeleteId;

          return (
            <HabitRow
              key={habit.id}
              habit={habit}
              isSelected={isSelected}
              isEditing={isEditing}
              isConfirming={isConfirming}
              editName={editName}
              editInputRef={editInputRef}
              floats={floats}
              onSelect={() => {
                if (!isEditing && !isConfirming) {
                  onSelect(isSelected ? null : habit.id);
                }
              }}
              onStartEdit={() => startEdit(habit)}
              onEditNameChange={setEditName}
              onSubmitRename={submitRename}
              onCancelEdit={cancelEdit}
              onComplete={() => completeWithFloat(habit.id)}
              onToggleDaily={() => onToggleDaily(habit.id)}
              onDelete={() => {
                onDelete(habit.id);
                setConfirmDeleteId(null);
              }}
              onConfirmDelete={() => setConfirmDeleteId(habit.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          );
        })}
      </div>
      {habits.length > 0 && (
        <button
          onClick={onAddHabit}
          disabled={habitsFull}
          className={`mt-3 w-full rounded-lg border px-4 py-3 text-sm font-black tracking-widest transition-all ${
            habitsFull
              ? "cursor-not-allowed border-[#323b46] bg-[#242b34] text-[#596675]"
              : "border-[#456052] bg-[#2e4442] text-[#dcf7e7] shadow-md shadow-black/20 hover:bg-[#36514d] active:scale-[0.98]"
          }`}
        >
          {habitsFull
            ? `Максимум (${habits.length}/${MAX_HABITS})`
            : "+ Добавить привычку"}
        </button>
      )}
    </section>
  );
}

interface HabitRowProps {
  habit: Habit;
  isSelected: boolean;
  isEditing: boolean;
  isConfirming: boolean;
  editName: string;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  floats: Record<string, boolean>;
  onSelect: () => void;
  onStartEdit: () => void;
  onEditNameChange: (value: string) => void;
  onSubmitRename: () => void;
  onCancelEdit: () => void;
  onComplete: () => void;
  onToggleDaily: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function HabitRow({
  habit,
  isSelected,
  isEditing,
  isConfirming,
  editName,
  editInputRef,
  floats,
  onSelect,
  onStartEdit,
  onEditNameChange,
  onSubmitRename,
  onCancelEdit,
  onComplete,
  onToggleDaily,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: HabitRowProps) {
  const { swiped, handleTouchStart, handleTouchEnd } = useHabitSwipe({
    isDisabled: isEditing || isConfirming,
    onSwipeRight: onComplete,
    onSwipeLeft: onConfirmDelete,
  });

  const SWIPE_CLASSES: Record<string, string> = {
    complete: "border-[#4CAF50] bg-[#2a4a3a]",
    delete: "border-[#c0392b] bg-[#3a2a2a]",
    default: "border-[#303b47] bg-[#1d2530] hover:border-[#3e4c5b] hover:bg-[#242f3a]",
  };

  const rowClass = `flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 transition-all ${
    isSelected
      ? "scale-[1.01] border-[#55746e] bg-[#2e4442] shadow-md shadow-black/20"
      : SWIPE_CLASSES[swiped ?? "default"]
  }`;

  return (
    <div
      onClick={onSelect}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={rowClass}
    >
      {isEditing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <input
            ref={editInputRef}
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitRename();
              if (e.key === "Escape") onCancelEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            maxLength={40}
            className="min-w-0 flex-1 rounded-md border border-[#607d73] bg-[#1b222c] px-2 py-1 text-sm font-black text-[#e5edf3] outline-hidden"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSubmitRename();
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#4CAF50] text-[#1f2630] text-xs font-black hover:bg-[#66d06a]"
            title="Сохранить"
          >
            ✓
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancelEdit();
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#667584] hover:bg-[#3a3a3e]"
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
              onDelete();
            }}
            className="flex h-8 shrink-0 items-center rounded-md bg-[#c0392b] px-2 text-[11px] font-black text-white hover:bg-[#e74c3c]"
          >
            Да
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancelDelete();
            }}
            className="flex h-8 shrink-0 items-center rounded-md border border-[#3a4653] bg-[#242f3a] px-2 text-[11px] font-black text-[#8d9ba8] hover:bg-[#2b3845]"
          >
            Нет
          </button>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-sm font-black text-[#e5edf3]"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              title="Нажми, чтобы переименовать"
            >
              {habit.name}
            </div>
            <div className="text-[11px] font-semibold text-[#697888]">
              {habit.completions} раз
              {habit.isDaily && (
                <span className="ml-1 inline-block rounded-sm bg-[#3a4a6e] px-1 py-px text-[10px] font-black text-[#8ab4f8]">
                  день
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDaily();
            }}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm transition-colors ${
              habit.isDaily
                ? "bg-[#3a4a6e] text-[#a8c8ff] hover:bg-[#4a5a7e]"
                : "text-[#3a4653] hover:text-[#8795a4]"
            }`}
            title={habit.isDaily ? "Снять ежедневный" : "Сделать ежедневным"}
          >
            ↻
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#31453e] text-[#a8e8bd] shadow-xs transition-all hover:bg-[#3f674d] active:scale-90"
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

          <span className="hidden w-10 shrink-0 text-right text-[11px] font-black text-[#d5a63d] sm:inline">
            +{XP_PER_COMPLETION} XP
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirmDelete();
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#667584] transition-colors hover:bg-[#432d35] hover:text-[#ff8d8d]"
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
}
