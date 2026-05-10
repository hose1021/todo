"use client";

import { useState, useRef, useEffect } from "react";
import { MAX_HABITS } from "@/lib/types";

interface AddHabitFormProps {
  onAdd: (name: string) => boolean;
  currentCount: number;
  embedded?: boolean;
  onClose?: () => void;
}

export default function AddHabitForm({
  onAdd,
  currentCount,
  embedded = true,
  onClose,
}: AddHabitFormProps) {
  const [open, setOpen] = useState(!embedded);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isFull = currentCount >= MAX_HABITS;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Введи название");
      return;
    }

    if (trimmed.length > 40) {
      setError("Максимум 40 символов");
      return;
    }

    const ok = onAdd(trimmed);

    if (!ok) {
      setError("Слишком много привычек");
      return;
    }

    setName("");
    setError("");
    setOpen(false);
    onClose?.();
  };

  const handleCancel = () => {
    setOpen(false);
    setName("");
    setError("");
    onClose?.();
  };

  if (!embedded && isFull) return null;

  if (embedded && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isFull}
        className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition-all ${
          isFull
            ? "cursor-not-allowed border-[#323b46] bg-[#242b34] text-[#596675]"
            : "border-[#456052] bg-[#2e4442] text-[#dcf7e7] hover:bg-[#36514d] active:scale-[0.97]"
        }`}
      >
        {isFull ? `${currentCount}/${MAX_HABITS}` : "+ Добавить привычку"}
      </button>
    );
  }

  const form = (
    <div className="rounded-lg border border-[#33404d] bg-[#1b222c] p-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") handleCancel();
          }}
          placeholder="Название привычки"
          maxLength={40}
          className="min-w-0 flex-1 rounded-md border border-[#3a4653] bg-[#141b24] px-3 py-1.5 text-xs font-bold text-[#e5edf3] outline-hidden transition-all placeholder:text-[#657486] focus:border-[#607d73] focus:ring-2 focus:ring-[#2f4a45]"
        />

        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-md bg-[#d5a63d] px-3 py-1.5 text-xs font-black text-[#1f2630] transition-all hover:bg-[#edbe52] active:scale-95"
        >
          Добавить
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md border border-[#3a4653] bg-[#242f3a] px-2.5 py-1.5 text-xs font-black text-[#8d9ba8] transition-all hover:bg-[#2b3845]"
        >
          ✕
        </button>
      </div>

      {error && (
        <p className="mt-1.5 px-1 text-[10px] font-bold text-[#ff8d8d]">
          {error}
        </p>
      )}
    </div>
  );

  if (embedded) return form;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={handleCancel}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {form}
      </div>
    </div>
  );
}
