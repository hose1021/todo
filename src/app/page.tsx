"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [showAchievements, setShowAchievements] = useState(false);

  const claimableCount = achievements.filter(
    (a) => a.status === "unlocked",
  ).length;

  const shopRef = useRef<HTMLDivElement>(null);

  const scrollToShop = () => {
    shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
        setShowAchievements(false);
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
    <div className="min-h-screen pb-16">
      <Confetti show={levelUp} />
      <HelpModal show={showHelp} onClose={closeHelp} />

      <header className="sticky top-0 z-40 border-b border-[#33404d] bg-[#202833]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a] text-xl shadow-lg shadow-black/20">
            🌿
          </div>
          <button
            onClick={openHelp}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a]/90 text-lg text-[#8795a4] hover:bg-[#2d3a47] hover:text-[#bcc8d4] transition-colors shadow-lg shadow-black/20"
            title="Как играть"
          >
            ?
          </button>
          <h1 className="hidden truncate text-base font-black uppercase tracking-[0.1em] text-[#edf5f8] sm:block sm:text-lg">
            Habbit Garden
          </h1>
          <div className="flex ml-auto items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[#3a4653] bg-[#242f3a]/90 px-2 py-1.5 text-xs font-black text-[#a5d6b8] shadow-lg shadow-black/20 sm:px-3 sm:py-2 sm:text-sm">
              <span>💎</span>
              <span>{crystals}</span>
            </div>
            {streak > 0 && (
              <div
                className="flex items-center gap-0.5 rounded-lg border border-[#4a5a3e] bg-[#2a3a2a]/90 px-1.5 py-1.5 text-[10px] font-black text-[#c5e898] shadow-lg shadow-black/20 sm:px-2 sm:py-2 sm:text-[11px]"
                title="Дней подряд"
              >
                🔥{streak}
              </div>
            )}
            <button
              onClick={toggleMute}
              className={`hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-base transition-all shadow-lg shadow-black/20 sm:flex ${
                isMuted
                  ? "border-[#543a3a] bg-[#3a2a2a]/90 text-[#887777]"
                  : "border-[#3a4653] bg-[#242f3a]/90 text-[#c0c8d0] hover:bg-[#2d3a47]"
              }`}
              title={isMuted ? "Включить звук" : "Выключить звук"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-2 pb-2 sm:hidden">
          <XPBar xp={xp} level={level} />
        </div>
        <div className="hidden sm:block">
          <div className="mx-auto flex max-w-4xl items-center px-4 pb-3">
            <div className="w-full">
              <XPBar xp={xp} level={level} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-3 px-2 py-3 sm:space-y-4 sm:px-4 sm:py-6">
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

        <div ref={shopRef}>
          <Shop
            crystals={crystals}
            achievements={achievements}
            onBuy={buyPlant}
          />
        </div>

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
          claimableCount={claimableCount}
          onAchievements={() => setShowAchievements(true)}
          crystals={crystals}
        />

        {showAddHabit && (
          <AddHabitForm
            onAdd={addHabit}
            currentCount={habits.length}
            embedded={false}
            onClose={() => setShowAddHabit(false)}
          />
        )}

        {showAchievements && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowAchievements(false)}
          >
            <div
              className="max-h-[80vh] w-full max-w-4xl overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <AchievementPanel
                achievements={achievements}
                onClaim={claimAchievement}
                getProgressFor={getProgressFor}
              />
            </div>
          </div>
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#33404d] bg-[#1b222c]/95 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-around px-2 py-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#3a4653] bg-[#242f3a] px-3 py-2 text-sm font-black text-[#a5d6b8]">
            <span>💎</span>
            <span>{crystals}</span>
          </div>
          <button
            onClick={scrollToShop}
            className="flex items-center gap-1 rounded-lg border border-[#4a5a3e] bg-[#2a3a2a] px-3 py-2 text-xs font-black text-[#c5e898] active:scale-95"
          >
            🛒 Магазин
          </button>
          <button
            onClick={() => setShowAchievements(true)}
            className="relative flex items-center gap-1 rounded-lg border border-[#4a5a3e] bg-[#2a3a2a] px-3 py-2 text-xs font-black text-[#c5e898] active:scale-95"
          >
            🏆 Достижения
            {claimableCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d5a63d] px-1 text-[9px] font-black text-[#1f2630]">
                {claimableCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <footer className="hidden py-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5c6b7a] sm:block">
        Выполняй привычки • получай XP • покупай и выращивай сад
      </footer>
    </div>
  );
}
