"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import Garden from "@/components/Garden";
import HabitList from "@/components/HabitList";
import AddHabitForm from "@/components/AddHabitForm";
import XPBar from "@/components/XPBar";
import Confetti from "@/components/Confetti";

export default function Home() {
  const {
    xp,
    level,
    habits,
    loaded,
    levelUp,
    addHabit,
    completeHabit,
    deleteHabit,
  } = useGameState();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-green-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Загрузка сада...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Confetti show={levelUp} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-green-50/90 backdrop-blur border-b border-green-100">
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <h1 className="text-lg font-bold text-gray-800 mr-auto">Habbit Garden</h1>
          <div className="flex-1 max-w-xs">
            <XPBar xp={xp} level={level} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-3 py-3 space-y-4">
        {/* Garden */}
        <Garden
          habits={habits}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Controls */}
        <div className="space-y-3">
          <AddHabitForm onAdd={addHabit} currentCount={habits.length} />
          <HabitList
            habits={habits}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onComplete={completeHabit}
            onDelete={deleteHabit}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        Выполняй привычки • получай опыт • выращивай сад 🌺
      </footer>
    </div>
  );
}
