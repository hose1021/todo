"use client";

import { useRef, useState } from "react";

interface UseHabitSwipeOptions {
  isDisabled: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

const SWIPE_THRESHOLD_PX = 40;
const SWIPE_RESET_MS = 300;

export function useHabitSwipe({
  isDisabled,
  onSwipeRight,
  onSwipeLeft,
}: UseHabitSwipeOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [swiped, setSwiped] = useState<"complete" | "delete" | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDisabled) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || isDisabled) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dy) > Math.abs(dx)) return;

    if (dx > SWIPE_THRESHOLD_PX) {
      setSwiped("complete");
      setTimeout(() => setSwiped(null), SWIPE_RESET_MS);
      onSwipeRight();
    } else if (dx < -SWIPE_THRESHOLD_PX) {
      setSwiped("delete");
      onSwipeLeft();
    }
  };

  return { swiped, handleTouchStart, handleTouchEnd };
}
