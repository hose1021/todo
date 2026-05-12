"use client";

import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
  selectedHabitId: string | null;
  onCompleteHabit: (id: string) => void;
  onDismissAll: () => void;
}

export function useKeyboardShortcuts({
  selectedHabitId,
  onCompleteHabit,
  onDismissAll,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Enter" && selectedHabitId) {
        e.preventDefault();
        onCompleteHabit(selectedHabitId);
      }
      if (e.key === "Escape") {
        onDismissAll();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedHabitId, onCompleteHabit, onDismissAll]);
}
