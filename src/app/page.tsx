"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import Garden from "@/components/Garden";
import HabitList from "@/components/HabitList";
import AddHabitForm from "@/components/AddHabitForm";
import Shop from "@/components/Shop";
import InventoryStrip from "@/components/InventoryStrip";
import XPBar from "@/components/XPBar";
import Confetti from "@/components/Confetti";

export default function Home() {
  const {
    xp,
    level,
    crystals,
    habits,
    plants,
    inventory,
    loaded,
    levelUp,
    addHabit,
    completeHabit,
    deleteHabit,
    buyPlant,
    plantFromInventory,
    upgradePlant,
    removePlant,
  } = useGameState();

  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [plantingMode, setPlantingMode] = useState(false);
  const [selectedInventoryPlantId, setSelectedInventoryPlantId] = useState<
    string | null
  >(null);

  if (!loaded) {
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

      <header className="sticky top-0 z-40 border-b border-[#33404d] bg-[#202833]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-3 sm:px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a] text-xl shadow-lg shadow-black/20">
            🌿
          </div>
          <div className="mr-auto min-w-0">
            <h1 className="truncate text-lg font-black uppercase tracking-[0.12em] text-[#edf5f8]">
              Habbit Garden
            </h1>
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-[#657486] sm:block">
              тёмная сетка привычек
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#3a4653] bg-[#242f3a]/90 px-3 py-2 text-sm font-black text-[#a5d6b8] shadow-lg shadow-black/20">
              <span>💎</span>
              <span>{crystals}</span>
            </div>
            <div className="w-[180px] sm:w-[240px]">
              <XPBar xp={xp} level={level} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <AddHabitForm onAdd={addHabit} currentCount={habits.length} />
          <HabitList
            habits={habits}
            selectedId={selectedHabitId}
            onSelect={(id) => {
              setSelectedHabitId(id);
              setSelectedSlot(null);
            }}
            onComplete={completeHabit}
            onDelete={deleteHabit}
          />
        </div>

        <Shop crystals={crystals} onBuy={buyPlant} />

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
      </main>

      <footer className="py-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5c6b7a]">
        Выполняй привычки • получай XP • покупай и выращивай сад
      </footer>
    </div>
  );
}
