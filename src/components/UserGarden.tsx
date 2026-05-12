"use client";

import { useState, useEffect } from "react";
import PlantComp from "./Plant";
import type { Plant as PlantType } from "@/lib/types";
import { getPlantGrowth, getXPForLevel } from "@/lib/gameLogic";
import { getPlantType } from "@/lib/plants";
import { fetchUserPlants, getSupabase, type UserRow } from "@/lib/supabase";

async function fetchUserProfile(uid: string): Promise<UserRow | null> {
  const { data, error } = await getSupabase()
    .from("users")
    .select("*")
    .eq("uid", uid)
    .maybeSingle();
  if (error) return null;
  return data as UserRow | null;
}

interface UserGardenProps {
  targetUid: string;
  onClose: () => void;
}

export default function UserGarden({ targetUid, onClose }: UserGardenProps) {
  const [plants, setPlants] = useState<(PlantType | null)[]>([]);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchUserPlants(targetUid),
      fetchUserProfile(targetUid),
    ]).then(([p, prof]) => {
      setPlants(p);
      setProfile(prof);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [targetUid, tick]);

  const count = plants.filter((p) => p !== null).length;
  const xpForLevel = profile ? getXPForLevel(profile.level) : 0;
  const xpPercent = profile && profile.xp > 0 ? Math.min(100, Math.round((profile.xp / xpForLevel) * 100)) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#33404d] bg-[#1e2731] shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#33404d] px-4 py-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#dce8ef]">
              {profile ? (profile.username || `Игрок_${targetUid.slice(0, 4)}`) : "Сад игрока"}
            </h2>
            {profile && (
              <div className="mt-1 flex items-center gap-3 text-[10px] font-semibold text-[#657486]">
                <span className="text-[#d5a63d]">Ур. {profile.level}</span>
                <span>{profile.xp} XP</span>
                {profile.streak > 0 && <span>🔥{profile.streak}</span>}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3a4653] bg-[#242f3a] text-sm text-[#8795a4] hover:bg-[#2d3a47] hover:text-[#bcc8d4] transition-colors"
          >
            ✕
          </button>
        </div>

        {profile && (
          <div className="border-b border-[#272f3a] px-4 py-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1b222c]">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#4d9e6d] to-[#6ecf8a] transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5e7284] border-t-transparent" />
            </div>
          ) : (
            <>
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(6, minmax(0, 1fr))` }}
              >
                {Array.from({ length: 36 }).map((_, i) => {
                  const plant = plants[i] || null;
                  const growth = plant ? getPlantGrowth(plant) : null;
                  const isGrowing = growth?.isGrowing ?? false;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-center border-b border-r border-dashed border-[#33404d] bg-[#222b36]/70 ${
                        isGrowing ? "bg-[#222b36]/40" : ""
                      }`}
                      style={{ minHeight: "5rem", height: "5rem" }}
                    >
                      {plant ? (
                        <div className="flex h-[60%] w-[60%] items-center justify-center">
                          <PlantComp plant={plant} highlighted={false} />
                        </div>
                      ) : (
                        <span className="text-[28px] leading-none text-[#3a4d3a]/30 select-none">
                          ·
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-dashed border-[#33404d] px-4 py-2.5 text-center text-[10px] font-semibold text-[#657486]">
                {count}/36 посажено
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
