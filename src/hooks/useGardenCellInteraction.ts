"use client";

import { useRef, useCallback } from "react";
import { LONG_PRESS_MS } from "@/lib/types";

interface UseGardenCellInteractionOptions {
  hasPlant: boolean;
  onSelect: () => void;
  onLongPress: () => void;
}

export function useGardenCellInteraction({
  hasPlant,
  onSelect,
  onLongPress,
}: UseGardenCellInteractionOptions) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touched = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      touched.current = true;
      longPressTimer.current = setTimeout(() => {
        if (touched.current && hasPlant) {
          onLongPress();
          touched.current = false;
        }
      }, LONG_PRESS_MS);
    },
    [hasPlant, onLongPress],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (touched.current) {
        onSelect();
      }
      touched.current = false;
    },
    [onSelect],
  );

  return { handleTouchStart, handleTouchEnd };
}
