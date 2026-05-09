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
      setError("Нет свободных грядок!");
      return;
    }
    setName("");
    setError("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={isFull}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isFull
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
        }`}
      >
        {isFull ? "Сад заполнен (12/12)" : "+ Добавить привычку"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") { setOpen(false); setName(""); setError(""); }
          }}
          placeholder="Например: Полить цветы"
          maxLength={40}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200 transition-all"
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all active:scale-95"
        >
          OK
        </button>
        <button
          onClick={() => { setOpen(false); setName(""); setError(""); }}
          className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm transition-all"
        >
          ✕
        </button>
      </div>
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  );
}
