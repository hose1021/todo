"use client";

import { useState, useEffect, useCallback } from "react";
import { useGameState } from "@/hooks/useGameState";
import Garden from "@/components/Garden";
import HabitList from "@/components/HabitList";
import AddHabitForm from "@/components/AddHabitForm";
import Shop from "@/components/Shop";
import InventoryStrip from "@/components/InventoryStrip";
import XPBar from "@/components/XPBar";
import Confetti from "@/components/Confetti";
import HelpModal, { useHelpModal } from "@/components/HelpModal";
import AchievementPanel from "@/components/AchievementPanel";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { MAX_HABITS } from "@/lib/types";

export default function Home() {
  const {
    state,
    xp,
    level,
    crystals,
    habits,
    plants,
    inventory,
    streak,
    achievements,
    loaded,
    levelUp,
    isMuted,
    addHabit,
    completeHabit,
    deleteHabit,
    renameHabit,
    toggleDailyHabit,
    buyPlant,
    plantFromInventory,
    upgradePlant,
    removePlant,
    claimAchievement,
    toggleMute,
  } = useGameState();

  const { showHelp, ready, open: openHelp, close: closeHelp } = useHelpModal();

  const getProgressFor = useCallback(
    (id: string) => {
      const def = ACHIEVEMENTS.find((d) => d.id === id);
      return def ? def.getProgress(state) : { current: 0, target: 1 };
    },
    [state],
  );

  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [plantingMode, setPlantingMode] = useState(false);
  const [selectedInventoryPlantId, setSelectedInventoryPlantId] = useState<
    string | null
  >(null);
  const [showAddHabit, setShowAddHabit] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Enter" && selectedHabitId) {
        e.preventDefault();
        completeHabit(selectedHabitId);
      }
      if (e.key === "Escape") {
        setSelectedHabitId(null);
        setSelectedSlot(null);
        setPlantingMode(false);
        setSelectedInventoryPlantId(null);
        setShowAddHabit(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedHabitId, completeHabit]);

  if (!loaded || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#202833]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5e7284] border-t-transparent" />
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7d8b99]">
            Загрузка сада...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Confetti show={levelUp} />
      <HelpModal show={showHelp} onClose={closeHelp} />

      <header className="sticky top-0 z-40 border-b border-[#33404d] bg-[#202833]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-3 sm:px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a] text-xl shadow-lg shadow-black/20">
            🌿
          </div>
          <button
            onClick={openHelp}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a]/90 text-lg text-[#8795a4] hover:bg-[#2d3a47] hover:text-[#bcc8d4] transition-colors shadow-lg shadow-black/20"
            title="Как играть"
          >
            ?
          </button>
          <div className="mr-auto min-w-0">
            <h1 className="truncate text-lg font-black uppercase tracking-[0.12em] text-[#edf5f8]">
              Habbit Garden
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#3a4653] bg-[#242f3a]/90 px-3 py-2 text-sm font-black text-[#a5d6b8] shadow-lg shadow-black/20">
              <span>💎</span>
              <span>{crystals}</span>
            </div>
            <button
              onClick={toggleMute}
              className={`flex h-[38px] w-[38px] items-center justify-center rounded-lg border text-base transition-all shadow-lg shadow-black/20 ${
                isMuted
                  ? "border-[#543a3a] bg-[#3a2a2a]/90 text-[#887777]"
                  : "border-[#3a4653] bg-[#242f3a]/90 text-[#c0c8d0] hover:bg-[#2d3a47]"
              }`}
              title={isMuted ? "Включить звук" : "Выключить звук"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            {streak > 0 && (
              <div
                className="flex items-center gap-1 rounded-lg border border-[#4a5a3e] bg-[#2a3a2a]/90 px-2 py-2 text-[11px] font-black text-[#c5e898] shadow-lg shadow-black/20"
                title="Дней подряд"
              >
                🔥{streak}
              </div>
            )}
            <div className="w-[180px] sm:w-[240px]">
              <XPBar xp={xp} level={level} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4 sm:py-6">
        <HabitList
          habits={habits}
          selectedId={selectedHabitId}
          onSelect={(id) => {
            setSelectedHabitId(id);
            setSelectedSlot(null);
          }}
          onComplete={completeHabit}
          onDelete={deleteHabit}
          onRename={renameHabit}
          onToggleDaily={toggleDailyHabit}
          onAddHabit={() => setShowAddHabit(true)}
          habitsFull={habits.length >= MAX_HABITS}
        />

        <Shop
          crystals={crystals}
          achievements={achievements}
          onBuy={buyPlant}
        />

        <Garden
          plants={plants}
          selectedSlot={selectedSlot}
          onSelect={(index) => {
            setSelectedSlot(index);
            setSelectedHabitId(null);
          }}
          plantingMode={plantingMode}
          onPlantInSlot={(index) => {
            if (selectedInventoryPlantId) {
              plantFromInventory(selectedInventoryPlantId, index);
              setSelectedInventoryPlantId(null);
              setPlantingMode(false);
            }
          }}
          onUpgrade={(index) => {
            upgradePlant(index);
            setSelectedSlot(null);
            setSelectedSlot(index);
          }}
          onRemove={removePlant}
          crystals={crystals}
        />

        <InventoryStrip
          inventory={inventory}
          plantingMode={plantingMode}
          selectedPlantId={selectedInventoryPlantId}
          onSelect={setSelectedInventoryPlantId}
          onRequestPlant={(plantId) => {
            setSelectedInventoryPlantId(plantId);
            setPlantingMode(true);
          }}
        />

        <AchievementPanel
          achievements={achievements}
          onClaim={claimAchievement}
          getProgressFor={getProgressFor}
        />

        {showAddHabit && (
          <AddHabitForm
            onAdd={addHabit}
            currentCount={habits.length}
            embedded={false}
            onClose={() => setShowAddHabit(false)}
          />
        )}

        {habits.length > 0 && (
          <div className="rounded-[10px] border border-[#33404d] bg-[#222b36] px-4 py-3 shadow-lg shadow-black/20">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[#8795a4]">
              <span>
                Всего выполнено:{" "}
                <strong className="text-[#dce8ef]">
                  {habits.reduce((sum, h) => sum + h.completions, 0)}
                </strong>
              </span>
              <span>
                Растений в саду:{" "}
                <strong className="text-[#dce8ef]">
                  {plants.filter((p) => p !== null).length}/{plants.length}
                </strong>
              </span>
              <span>
                В инвентаре:{" "}
                <strong className="text-[#dce8ef]">{inventory.length}</strong>
              </span>
              {level > 1 && (
                <span>
                  Уровень: <strong className="text-[#d5a63d]">{level}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5c6b7a]">
        Выполняй привычки • получай XP • покупай и выращивай сад
      </footer>
    </div>
  );
}
