"use client";

import { useEffect, useState } from "react";

const HELP_KEY = "habbittodo_help_seen";

export function useHelpModal() {
  const [showHelp, setShowHelp] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(HELP_KEY);
    if (!seen) {
      setShowHelp(true);
    }
    setReady(true);
  }, []);

  const open = () => setShowHelp(true);
  const close = () => {
    setShowHelp(false);
    localStorage.setItem(HELP_KEY, "true");
  };

  return { showHelp, ready, open, close };
}

interface HelpModalProps {
  show: boolean;
  onClose: () => void;
}

export default function HelpModal({ show, onClose }: HelpModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-[#445566] bg-[#1e2731] p-6 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black uppercase tracking-[0.15em] text-[#edf5f8]">
            🌿 Как играть
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#3a4653] text-sm text-[#8d9ba8] hover:bg-[#2b3845]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-[#c0cbd4]">
          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-[0.1em]">Привычки</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Добавляй привычки, кликай ✓ чтобы выполнить. Каждое выполнение даёт +10 XP и +10 💎.
              Отметь ↻ чтобы привычка сбрасывалась каждый день.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-[0.1em]">XP и уровни</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Уровень повышается каждые level×100 XP (1: 100, 2: 200, 3: 300...).
              При повышении уровня — конфетти! 🎉
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-[0.1em]">Кристаллы 💎</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              За 💎 можно купить растение (50 💎) в магазине и улучшить его (30 💎 за уровень).
              Удаление растения возвращает все потраченные 💎.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-[0.1em]">Рост растений</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Стадии 0→1: 2 часа, 1→2: 6 часов (автоматически).
              Стадии 3→5: только через улучшение за 💎.
              Максимальный уровень — 5 (Цветущий).
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-[0.1em]">Серия 🔥</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Выполняй хотя бы одну привычку каждый день — счётчик дней подряд растёт.
              Пропустил день — серия сбрасывается.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-[0.1em]">Горячие клавиши</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              <kbd className="rounded bg-[#2a3440] px-1 py-px text-[10px]">Enter</kbd> — выполнить выбранную привычку
              <br />
              <kbd className="rounded bg-[#2a3440] px-1 py-px text-[10px]">Escape</kbd> — снять выделение
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#d5a63d] py-2 text-sm font-black text-[#1f2630] hover:bg-[#edbe52] active:scale-[0.98] transition-all"
        >
          Понятно, начнём!
        </button>
      </div>
    </div>
  );
}
