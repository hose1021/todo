"use client";

import { useState, useCallback } from "react";
import { useAppState } from "@/hooks/useAppState";
import Garden from "@/components/Garden";
import HabitList from "@/components/HabitList";
import AddHabitForm from "@/components/AddHabitForm";
import ShopSheet from "@/components/ShopSheet";
import XPBar from "@/components/XPBar";
import Confetti from "@/components/Confetti";
import HelpModal, { useHelpModal } from "@/components/HelpModal";
import AchievementPanel from "@/components/AchievementPanel";
import LoginScreen from "@/components/LoginScreen";
import LeaderboardPanel from "@/components/LeaderboardPanel";
import UserGarden from "@/components/UserGarden";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { MAX_HABITS } from "@/lib/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { loadGame, clearGame } from "@/lib/storage";
import { migrateIfNeeded } from "@/hooks/useGameState";
import {
  syncUserStats,
  saveHabits,
  saveAchievements,
  savePlantAtSlot,
} from "@/lib/supabase";

export default function Home() {
  const {
    state,
    xp,
    level,
    crystals,
    habits,
    plants,
    streak,
    achievements,
    loaded,
    levelUp,
    isMuted,
    refreshState,
    addHabit,
    completeHabit,
    deleteHabit,
    renameHabit,
    toggleDailyHabit,
    plantDirectly,
    upgradePlant,
    removePlant,
    claimAchievement,
    setUsername,
    toggleMute,
    status,
    uid,
    login,
    logout,
    isOnline,
  } = useAppState();

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
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [shopSheetOpen, setShopSheetOpen] = useState(false);
  const [shopSheetSlot, setShopSheetSlot] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [viewUserUid, setViewUserUid] = useState<string | null>(null);

  const claimableCount = achievements.filter(
    (a) => a.status === "unlocked",
  ).length;

  const hasLocalData = typeof window !== "undefined" && loadGame() !== null;

  const handleMigrate = useCallback(async (userUid: string) => {
    const localState = loadGame();
    if (!localState) return;
    const migrated = migrateIfNeeded(localState);

    try {
      const uid = userUid;
      await syncUserStats(uid, {
        xp: migrated.xp,
        level: migrated.level,
        crystals: migrated.crystals,
        streak: migrated.streak,
        lastCompletionDate: migrated.lastCompletionDate,
        lastResetDate: migrated.lastResetDate,
      });
      await saveHabits(uid, migrated.habits);
      for (let i = 0; i < migrated.plants.length; i++) {
        if (migrated.plants[i]) {
          await savePlantAtSlot(uid, i, migrated.plants[i]);
        }
      }
      await saveAchievements(uid, migrated.achievements);
      clearGame();
      refreshState();
    } catch (error) {
      console.error("Migration failed:", error);
    }
  }, [refreshState]);

  const dismissAll = useCallback(() => {
    setSelectedHabitId(null);
    setSelectedSlot(null);
    setShowAddHabit(false);
    setShowAchievements(false);
    setShopSheetOpen(false);
    setShowLeaderboard(false);
    setViewUserUid(null);
  }, []);

  useKeyboardShortcuts({
    selectedHabitId,
    onCompleteHabit: completeHabit,
    onDismissAll: dismissAll,
  });

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#202833]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5e7284] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (status === "loggedOut") {
    return (
      <LoginScreen
        onLogin={login}
        hasLocalData={hasLocalData}
        onMigrate={handleMigrate}
      />
    );
  }

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

      <ShopSheet
        open={shopSheetOpen}
        onClose={() => setShopSheetOpen(false)}
        slotIndex={shopSheetSlot}
        crystals={crystals}
        achievements={achievements}
        onBuy={(type) => {
          plantDirectly(type, shopSheetSlot);
          setShopSheetOpen(false);
        }}
      />

      {showAchievements && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowAchievements(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <AchievementPanel
              achievements={achievements}
              onClaim={claimAchievement}
              onClose={() => setShowAchievements(false)}
              getProgressFor={getProgressFor}
            />
          </div>
        </div>
      )}

      {showLeaderboard && (
        <LeaderboardPanel
          onClose={() => setShowLeaderboard(false)}
          onViewUser={(targetUid) => {
            setShowLeaderboard(false);
            setViewUserUid(targetUid);
          }}
        />
      )}

      {viewUserUid && (
        <UserGarden
          targetUid={viewUserUid}
          onClose={() => setViewUserUid(null)}
        />
      )}

      <header className="sticky top-0 z-40 border-b border-[#33404d] bg-[#202833]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a] text-xl shadow-lg shadow-black/20">
            🌿
          </div>
          <button
            onClick={openHelp}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a]/90 text-lg text-[#8795a4] hover:bg-[#2d3a47] hover:text-[#bcc8d4] transition-colors shadow-lg shadow-black/20"
            title="Как играть"
          >
            ?
          </button>
          <h1 className="hidden truncate text-base font-black uppercase tracking-widest text-[#edf5f8] sm:block sm:text-lg">
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
              className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base transition-all shadow-lg shadow-black/20 sm:flex ${
                isMuted
                  ? "border-[#543a3a] bg-[#3a2a2a]/90 text-[#887777]"
                  : "border-[#3a4653] bg-[#242f3a]/90 text-[#c0c8d0] hover:bg-[#2d3a47]"
              }`}
              title={isMuted ? "Включить звук" : "Выключить звук"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            {isOnline && (
              <button
                onClick={() => setShowLeaderboard(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a]/90 text-base text-[#d5a63d] hover:bg-[#2d3a47] transition-colors shadow-lg shadow-black/20"
                title="Таблица лидеров"
              >
                🏆
              </button>
            )}
            {isOnline && (
              <button
                onClick={logout}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#543a3a] bg-[#3a2a2a]/50 text-sm text-[#887777] hover:bg-[#3a2a2a] hover:text-[#ff8d8d] transition-colors shadow-lg shadow-black/20"
                title="Выйти"
              >
                🚪
              </button>
            )}
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

        <Garden
          plants={plants}
          selectedSlot={selectedSlot}
          onSelect={(index) => {
            setSelectedSlot(index);
            setSelectedHabitId(null);
          }}
          onUpgrade={(index) => {
            upgradePlant(index);
            setSelectedSlot(null);
            setSelectedSlot(index);
          }}
          onRemove={removePlant}
          onRequestPlant={(slotIndex) => {
            setShopSheetSlot(slotIndex);
            setShopSheetOpen(true);
          }}
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
              {level > 1 && (
                <span>
                  Уровень: <strong className="text-[#d5a63d]">{level}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
