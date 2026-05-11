"use client";

import { useState, useCallback, useEffect } from "react";
import { getStoredLoginKey, storeLoginKey, clearLoginKey, buildSession } from "@/lib/auth";
import { supabase, fetchUserByLoginKey, createUser } from "@/lib/supabase";

type AuthStatus = "checking" | "loggedOut" | "loggedIn";

interface AuthState {
  status: AuthStatus;
  uid: string | null;
  loginKey: string | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ status: "checking", uid: null, loginKey: null });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setAuth({ status: "loggedIn", uid: session.user.id, loginKey: getStoredLoginKey() });
        return;
      }

      const stored = getStoredLoginKey();
      if (stored) {
        fetchUserByLoginKey(stored).then((user) => {
          if (!user) {
            clearLoginKey();
            setAuth({ status: "loggedOut", uid: null, loginKey: null });
            return;
          }
          return buildSession(user.uid).then((s) => supabase.auth.setSession(s)).then(() => {
            storeLoginKey(stored);
            setAuth({ status: "loggedIn", uid: user.uid, loginKey: stored });
          });
        }).catch(() => {
          clearLoginKey();
          setAuth({ status: "loggedOut", uid: null, loginKey: null });
        });
      } else {
        setAuth({ status: "loggedOut", uid: null, loginKey: null });
      }
    });
  }, []);

  const login = useCallback(
    async (loginKey: string): Promise<boolean> => {
      if (!loginKey.trim()) return false;
      const trimmed = loginKey.trim();
      try {
        let uid: string;

        const existing = await fetchUserByLoginKey(trimmed);
        if (existing) {
          uid = existing.uid;
        } else {
          uid = crypto.randomUUID();
          const session = await buildSession(uid);
          await supabase.auth.setSession(session);
          await createUser(trimmed, uid);
        }

        const session = await buildSession(uid);
        await supabase.auth.setSession(session);
        storeLoginKey(trimmed);
        setAuth({ status: "loggedIn", uid, loginKey: trimmed });
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearLoginKey();
    setAuth({ status: "loggedOut", uid: null, loginKey: null });
    supabase.auth.signOut();
  }, []);

  return { ...auth, login, logout };
}
