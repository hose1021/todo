import { createClient } from "@supabase/supabase-js";
import type { Habit, Plant, AchievementState, GameState } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserRow {
  uid: string;
  login_key: string;
  username: string;
  xp: number;
  level: number;
  crystals: number;
  streak: number;
  last_completion_date: string;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  plantCount: number;
}

interface HabitRow {
  id: string;
  user_uid: string;
  name: string;
  completions: number;
  is_daily: boolean;
  created_at: number;
}

interface PlantRow {
  id: string;
  user_uid: string;
  slot_index: number;
  type: string;
  planted_at: number;
  growth_level: number;
}

interface AchievementRow {
  user_uid: string;
  achievement_id: string;
  status: string;
}

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    completions: row.completions,
    createdAt: row.created_at,
    isDaily: row.is_daily,
  };
}

function rowToPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    type: row.type,
    plantedAt: row.planted_at,
    growthLevel: row.growth_level,
  };
}

function rowToAchievement(row: AchievementRow): AchievementState {
  return {
    id: row.achievement_id,
    status: row.status as AchievementState["status"],
  };
}

export async function fetchUserByLoginKey(
  loginKey: string,
): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("login_key", loginKey)
    .maybeSingle();
  if (error) return null;
  return data as UserRow | null;
}

export async function createUser(loginKey: string, uid: string): Promise<UserRow> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("users")
    .insert({
      uid,
      login_key: loginKey,
      username: "",
      xp: 0,
      level: 1,
      crystals: 0,
      streak: 0,
      last_completion_date: "",
      last_reset_date: dateStr,
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserRow;
}

export async function fetchGameState(uid: string): Promise<GameState | null> {
  const [userRes, habitsRes, plantsRes, achievementsRes] = await Promise.all([
    supabase.from("users").select("*").eq("uid", uid).maybeSingle(),
    supabase.from("habits").select("*").eq("user_uid", uid),
    supabase.from("plants").select("*").eq("user_uid", uid).order("slot_index"),
    supabase.from("achievements").select("*").eq("user_uid", uid),
  ]);

  const user = userRes.data as UserRow | null;
  if (!user) return null;

  const habitsRows = (habitsRes.data || []) as HabitRow[];
  const plantsRows = (plantsRes.data || []) as PlantRow[];
  const achievementsRows = (achievementsRes.data || []) as AchievementRow[];

  const plants: (Plant | null)[] = Array(36).fill(null);
  for (const p of plantsRows) {
    if (p.slot_index >= 0 && p.slot_index < 36) {
      plants[p.slot_index] = rowToPlant(p);
    }
  }

  return {
    xp: user.xp,
    level: user.level,
    crystals: user.crystals,
    habits: habitsRows.map(rowToHabit),
    plants,
    streak: user.streak,
    lastCompletionDate: user.last_completion_date,
    lastResetDate: user.last_reset_date,
    achievements: achievementsRows.map(rowToAchievement),
  };
}

export async function syncUserStats(
  uid: string,
  stats: {
    xp: number;
    level: number;
    crystals: number;
    streak: number;
    lastCompletionDate: string;
    lastResetDate: string;
  },
): Promise<void> {
  await supabase
    .from("users")
    .update({
      xp: stats.xp,
      level: stats.level,
      crystals: stats.crystals,
      streak: stats.streak,
      last_completion_date: stats.lastCompletionDate,
      last_reset_date: stats.lastResetDate,
      updated_at: new Date().toISOString(),
    })
    .eq("uid", uid);
}

export async function saveHabits(
  uid: string,
  habits: Habit[],
): Promise<void> {
  const rows: HabitRow[] = habits.map((h) => ({
    id: h.id,
    user_uid: uid,
    name: h.name,
    completions: h.completions,
    is_daily: h.isDaily,
    created_at: h.createdAt,
  }));

  await supabase.from("habits").delete().eq("user_uid", uid);

  if (rows.length > 0) {
    await supabase.from("habits").insert(rows);
  }
}

export async function savePlantAtSlot(
  uid: string,
  slotIndex: number,
  plant: Plant | null,
): Promise<void> {
  await supabase
    .from("plants")
    .delete()
    .eq("user_uid", uid)
    .eq("slot_index", slotIndex);

  if (plant) {
    const row: PlantRow = {
      id: plant.id,
      user_uid: uid,
      slot_index: slotIndex,
      type: plant.type,
      planted_at: plant.plantedAt,
      growth_level: plant.growthLevel,
    };
    await supabase.from("plants").insert(row);
  }
}

export async function saveAchievements(
  uid: string,
  achievements: AchievementState[],
): Promise<void> {
  const rows: AchievementRow[] = achievements.map((a) => ({
    user_uid: uid,
    achievement_id: a.id,
    status: a.status,
  }));

  await supabase.from("achievements").delete().eq("user_uid", uid);

  if (rows.length > 0) {
    await supabase.from("achievements").insert(rows);
  }
}

export async function fetchLeaderboard(
  limit = 100,
): Promise<UserProfile[]> {
  const { data: users, error } = await supabase
    .from("users")
    .select("uid, username, xp, level, streak")
    .order("level", { ascending: false })
    .order("xp", { ascending: false })
    .limit(limit);

  if (error || !users) return [];

  const userRows = users as Pick<UserRow, "uid" | "username" | "xp" | "level" | "streak">[];

  return userRows.map((u) => ({
    uid: u.uid,
    username: u.username || "Игрок",
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    plantCount: 0,
  }));
}

export async function searchUsers(
  query: string,
  limit = 20,
): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("users")
    .select("uid, username, xp, level, streak")
    .ilike("username", `%${query}%`)
    .order("level", { ascending: false })
    .order("xp", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = data as Pick<UserRow, "uid" | "username" | "xp" | "level" | "streak">[];

  return rows.map((u) => ({
    uid: u.uid,
    username: u.username || "Игрок",
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    plantCount: 0,
  }));
}

export async function fetchUserPlants(
  uid: string,
): Promise<(Plant | null)[]> {
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("user_uid", uid)
    .order("slot_index");

  if (error) {
    return Array(36).fill(null);
  }

  const plants: (Plant | null)[] = Array(36).fill(null);
  if (data) {
    for (const p of data as PlantRow[]) {
      if (p.slot_index >= 0 && p.slot_index < 36) {
        plants[p.slot_index] = rowToPlant(p);
      }
    }
  }
  return plants;
}

export async function updateUsername(
  uid: string,
  username: string,
): Promise<void> {
  await supabase
    .from("users")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("uid", uid);
}
