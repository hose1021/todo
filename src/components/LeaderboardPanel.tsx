"use client";

import { useState, useEffect } from "react";
import { fetchLeaderboard, type UserProfile } from "@/lib/supabase";
import { getXPForLevel } from "@/lib/gameLogic";

interface LeaderboardPanelProps {
  onClose: () => void;
  onViewUser: (uid: string) => void;
}

export default function LeaderboardPanel({ onClose, onViewUser }: LeaderboardPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard(50).then((data) => {
      setUsers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-[#33404d] bg-[#1e2731] shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#33404d] px-4 py-3">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#dce8ef]">
            🏆 Таблица лидеров
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a] text-sm text-[#8795a4] hover:bg-[#2d3a47] hover:text-[#bcc8d4] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5e7284] border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-[#657486]">
              Пока никто не играет
            </div>
          ) : (
            <div>
              {users.map((user, index) => {
                const xpForLevel = getXPForLevel(user.level);
                const xpPercent = user.xp > 0 ? Math.min(100, Math.round((user.xp / xpForLevel) * 100)) : 0;

                return (
                  <button
                    key={user.uid}
                    onClick={() => onViewUser(user.uid)}
                    className="flex w-full items-center gap-3 border-b border-[#272f3a] px-4 py-3 text-left hover:bg-[#252f3a] transition-colors"
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      index === 0 ? "bg-[#d5a63d] text-[#1f2630]" :
                      index === 1 ? "bg-[#95a5b8] text-[#1f2630]" :
                      index === 2 ? "bg-[#b87d4d] text-[#1f2630]" :
                      "bg-[#2d3a47] text-[#657486]"
                    }`}>
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-bold text-[#dce8ef]">
                          {user.username || `Игрок_${user.uid.slice(0, 4)}`}
                        </span>
                        <span className="shrink-0 text-[11px] font-black text-[#d5a63d]">
                          Ур. {user.level}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1b222c]">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-[#4d9e6d] to-[#6ecf8a] transition-all"
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[10px] font-semibold text-[#657486]">
                        <span>{user.xp} XP</span>
                        {user.streak > 0 && (
                          <span>🔥{user.streak}</span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] font-semibold text-[#5c6b7a]">
                      Сад →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
