-- Supabase schema for habbittodo
-- Run this in Supabase SQL Editor

-- Drop existing tables (if any)
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.plants CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Profiles (uid = UUID, login_key = user-chosen text key)
CREATE TABLE public.users (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_key TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL DEFAULT '',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  crystals INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date TEXT NOT NULL DEFAULT '',
  last_reset_date TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habits
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completions INTEGER NOT NULL DEFAULT 0,
  is_daily BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

-- Plants (max 36 slots per user)
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index < 36),
  type TEXT NOT NULL,
  planted_at BIGINT NOT NULL,
  growth_level INTEGER NOT NULL DEFAULT 1 CHECK (growth_level >= 1 AND growth_level <= 3),
  UNIQUE(user_uid, slot_index)
);

-- Achievements
CREATE TABLE public.achievements (
  user_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'claimed')),
  PRIMARY KEY (user_uid, achievement_id)
);

-- Indexes
CREATE INDEX idx_users_login_key ON public.users(login_key);
CREATE INDEX idx_habits_user_uid ON public.habits(user_uid);
CREATE INDEX idx_plants_user_uid ON public.plants(user_uid);
CREATE INDEX idx_achievements_user_uid ON public.achievements(user_uid);
CREATE INDEX idx_users_leaderboard ON public.users(level DESC, xp DESC);
CREATE INDEX idx_users_username ON public.users(username);

-- RLS: enable on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Users: owner can do everything, public can SELECT (leaderboard)
CREATE POLICY users_owner ON public.users
  FOR ALL
  USING (uid = auth.uid())
  WITH CHECK (uid = auth.uid());

CREATE POLICY users_public_read ON public.users
  FOR SELECT
  USING (true);

-- Habits: only owner
CREATE POLICY habits_owner ON public.habits
  FOR ALL
  USING (user_uid = auth.uid())
  WITH CHECK (user_uid = auth.uid());

-- Plants: owner full access, public read-only (other gardens)
CREATE POLICY plants_owner ON public.plants
  FOR ALL
  USING (user_uid = auth.uid())
  WITH CHECK (user_uid = auth.uid());

CREATE POLICY plants_public_read ON public.plants
  FOR SELECT
  USING (true);

-- Achievements: only owner
CREATE POLICY achievements_owner ON public.achievements
  FOR ALL
  USING (user_uid = auth.uid())
  WITH CHECK (user_uid = auth.uid());
