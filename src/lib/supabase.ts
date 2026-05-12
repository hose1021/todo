import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Habit, Plant, AchievementState, GameState } from "@/lib/types";
import { MAX_PLANTS } from "@/lib/types";
import { initAchievementStates } from "@/lib/achievements";

let currentJwt: string | null = null;

function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (currentJwt) {
    headers.set("Authorization", `Bearer ${currentJwt}`);
  }
  return fetch(input, { ...init, headers });
}

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    _supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: authFetch,
      },
    });
  }
  return _supabase;
}

export function setCurrentJwt(jwt: string | null) {
  currentJwt = jwt;
}

if (typeof window !== "undefined") {
  localStorage.removeItem("sb-zfyqycjgforbopsvonom-auth-token");
}

export interface UserRow {
  uid: string;
  login_key_hash: string;
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

export async function authUser(
  loginKeyHash: string,
  username: string,
): Promise<string | null> {
  const { data, error } = await getSupabase()
    .rpc("auth_user", {
      p_login_key_hash: loginKeyHash,
      p_username: username,
    });
  if (error || !data) return null;
  return data as string;
}

export async function fetchGameState(uid: string): Promise<GameState | null> {
  const [userRes, habitsRes, plantsRes, achievementsRes] = await Promise.all([
    getSupabase().from("users").select("*").eq("uid", uid).maybeSingle(),
    getSupabase().from("habits").select("*").eq("user_uid", uid),
    getSupabase().from("plants").select("*").eq("user_uid", uid).order("slot_index"),
    getSupabase().from("achievements").select("*").eq("user_uid", uid),
  ]);

  const user = userRes.data as UserRow | null;
  if (!user) return null;

  const habitsRows = (habitsRes.data || []) as HabitRow[];
  const plantsRows = (plantsRes.data || []) as PlantRow[];
  const achievementsRows = (achievementsRes.data || []) as AchievementRow[];

  const plants: (Plant | null)[] = Array(MAX_PLANTS).fill(null);
  for (const p of plantsRows) {
    if (p.slot_index >= 0 && p.slot_index < MAX_PLANTS) {
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
    achievements: achievementsRows.length > 0
    ? achievementsRows.map(rowToAchievement)
    : initAchievementStates(),
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
  await getSupabase()
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

export async function saveHabits(uid: string, habits: Habit[]): Promise<void> {
  const rows: HabitRow[] = habits.map((h) => ({
    id: h.id,
    user_uid: uid,
    name: h.name,
    completions: h.completions,
    is_daily: h.isDaily,
    created_at: h.createdAt,
  }));

  await getSupabase().from("habits").delete().eq("user_uid", uid);

  if (rows.length > 0) {
    await getSupabase().from("habits").insert(rows);
  }
}

export async function savePlantAtSlot(
  uid: string,
  slotIndex: number,
  plant: Plant | null,
): Promise<void> {
  await getSupabase()
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
    await getSupabase().from("plants").insert(row);
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

  await getSupabase().from("achievements").delete().eq("user_uid", uid);

  if (rows.length > 0) {
    await getSupabase().from("achievements").insert(rows);
  }
}

export async function fetchLeaderboard(limit = 100): Promise<UserProfile[]> {
  const { data: users, error } = await getSupabase()
    .from("users")
    .select("uid, username, xp, level, streak")
    .order("level", { ascending: false })
    .order("xp", { ascending: false })
    .limit(limit);

  if (error || !users) return [];

  const userRows = users as Pick<
    UserRow,
    "uid" | "username" | "xp" | "level" | "streak"
  >[];

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
  const { data, error } = await getSupabase()
    .from("users")
    .select("uid, username, xp, level, streak")
    .ilike("username", `%${query}%`)
    .order("level", { ascending: false })
    .order("xp", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = data as Pick<
    UserRow,
    "uid" | "username" | "xp" | "level" | "streak"
  >[];

  return rows.map((u) => ({
    uid: u.uid,
    username: u.username || "Игрок",
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    plantCount: 0,
  }));
}

export async function fetchUserPlants(uid: string): Promise<(Plant | null)[]> {
  const { data, error } = await getSupabase()
    .from("plants")
    .select("*")
    .eq("user_uid", uid)
    .order("slot_index");

  if (error) {
    return Array(MAX_PLANTS).fill(null);
  }

  const plants: (Plant | null)[] = Array(MAX_PLANTS).fill(null);
  if (data) {
    for (const p of data as PlantRow[]) {
      if (p.slot_index >= 0 && p.slot_index < MAX_PLANTS) {
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
  await getSupabase()
    .from("users")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("uid", uid);
}
