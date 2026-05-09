"use client";

import { useState, useRef, useEffect } from "react";
import { MAX_HABITS } from "@/lib/types";

interface AddHabitFormProps {
  onAdd: (name: string) => boolean;
  currentCount: number;
}

export default function AddHabitForm({ onAdd, currentCount }: AddHabitFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const isFull = currentCount >= MAX_HABITS;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введи название");
      return;
    }
    if (trimmed.length > 40) {
      setError("Слишком длинное (макс 40)");
      return;
    }
    const ok = onAdd(trimmed);
    if (!ok) {
      setError("Слишком много привычек!");
      return;
    }
    setName("");
    setError("");
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setName("");
    setError("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={isFull}
        className={`w-full rounded-[10px] border px-4 py-3 text-sm font-black uppercase tracking-[0.12em] transition-all ${
          isFull
            ? "cursor-not-allowed border-[#323b46] bg-[#242b34] text-[#596675]"
            : "border-[#456052] bg-[#2e4442] text-[#dcf7e7] shadow-lg shadow-black/20 hover:bg-[#36514d] active:scale-[0.98]"
        }`}
      >
        {isFull ? `Максимум привычек (${currentCount}/${MAX_HABITS})` : "+ Добавить привычку"}
      </button>
    );
  }

  return (
    <div className="rounded-[10px] border border-[#33404d] bg-[#222b36] p-3 shadow-lg shadow-black/20">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") handleCancel();
          }}
          placeholder="Например: Полить цветы"
          maxLength={40}
          className="min-w-0 flex-1 rounded-lg border border-[#3a4653] bg-[#1b222c] px-3 py-2 text-sm font-semibold text-[#e5edf3] outline-none transition-all placeholder:text-[#657486] focus:border-[#607d73] focus:ring-2 focus:ring-[#2f4a45]"
        />
        <button
          onClick={handleSubmit}
          className="rounded-lg bg-[#d5a63d] px-4 py-2 text-sm font-black text-[#1f2630] transition-all hover:bg-[#edbe52] active:scale-95"
        >
          OK
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg border border-[#3a4653] bg-[#242f3a] px-3 py-2 text-sm font-black text-[#8d9ba8] transition-all hover:bg-[#2b3845]"
        >
          ✕
        </button>
      </div>
      {error && <p className="mt-2 px-1 text-xs font-semibold text-[#ff8d8d]">{error}</p>}
    </div>
  );
}
