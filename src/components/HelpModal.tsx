"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  return (
    <Dialog
      open={show}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🌿 Как играть</DialogTitle>
          <DialogDescription className="sr-only">
            Инструкция по игре HabbitTodo — геймификация привычек
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm leading-relaxed">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Привычки
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Добавь привычку, нажми ✓ чтобы выполнить — получи +10 XP. Свайп
              вправо = выполнить, свайп влево = удалить. ↻ делает привычку
              ежедневной (сбрасывается каждые сутки).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              XP и уровни
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Уровень растёт каждые уровень × 100 XP. При повышении — конфетти
              🎉.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Серия 🔥
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Выполняй хотя бы одну привычку каждый день — серия растёт.
              Пропустил день — сброс.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Ачивки 🏆
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Выполняй условия — получай ачивки. Награда: 💎 кристаллы или
              особые растения. Ачивки открывают новые виды растений в магазине.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Кристаллы 💎
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Зарабатываются только через ачивки. Трать на покупку и улучшение
              растений в магазине.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Магазин 🛒
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              16 видов растений — от обычных до легендарных. Цена: 5–100 💎.
              Новые виды открываются через ачивки. Горизонтальный скролл по
              редкости.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider">
              Сад 🌿
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Сетка 6×6 (36 клеток). Купи растение → нажми в инвентаре → выбери
              клетку. Долгое нажатие — быстрый выбор. Улучшай до 3 уровня за 💎.
              Во время роста показывается 🌱 и прогресс-бар.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
