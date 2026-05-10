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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={onClose}>
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
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-widest">Привычки</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Добавь привычку, нажми ✓ чтобы выполнить — получи +10 XP.
              Свайп вправо = выполнить, свайп влево = удалить.
              ↻ делает привычку ежедневной (сбрасывается каждые сутки).
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-widest">XP и уровни</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Уровень растёт каждые <span className="text-[#dce8ef]">уровень × 100 XP</span>.
              При повышении — конфетти 🎉.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-widest">Серия 🔥</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Выполняй хотя бы одну привычку каждый день — серия растёт.
              Пропустил день — сброс.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-widest">Ачивки 🏆</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Выполняй условия — получай ачивки. Награда: 💎 кристаллы или особые растения.
              Ачивки открывают новые виды растений в магазине.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-widest">Кристаллы 💎</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Зарабатываются только через ачивки.
              Трать на покупку и улучшение растений в магазине.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-widest">Магазин 🛒</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              16 видов растений — от обычных до легендарных. Цена: 5–100 💎.
              Новые виды открываются через ачивки.
              Горизонтальный скролл по редкости.
            </p>
          </div>

          <div>
            <h3 className="font-black text-[#d5a63d] text-xs uppercase tracking-widest">Сад 🌿</h3>
            <p className="mt-1 text-[#8795a4] text-xs">
              Сетка 6×6 (36 клеток). Купи растение → нажми в инвентаре → выбери клетку.
              Долгое нажатие — быстрый выбор. Улучшай до 3 уровня за 💎.
              Во время роста показывается 🌱 и прогресс-бар.
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
