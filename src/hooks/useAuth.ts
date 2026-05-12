"use client";

import { useState, useCallback, useEffect } from "react";
import { getStoredLoginKey, storeLoginKey, clearLoginKey, buildSession } from "@/lib/auth";
import { fetchUserByLoginKey, createUser, setCurrentJwt } from "@/lib/supabase";

type AuthStatus = "checking" | "loggedOut" | "loggedIn";

interface AuthState {
  status: AuthStatus;
  uid: string | null;
  loginKey: string | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ status: "checking", uid: null, loginKey: null });

  useEffect(() => {
    const stored = getStoredLoginKey();
    if (!stored) {
      setAuth({ status: "loggedOut", uid: null, loginKey: null });
      return;
    }

    fetchUserByLoginKey(stored).then(async (user) => {
      if (!user) {
        clearLoginKey();
        setCurrentJwt(null);
        setAuth({ status: "loggedOut", uid: null, loginKey: null });
        return;
      }
      const session = await buildSession(user.uid);
      setCurrentJwt(session.access_token);
      storeLoginKey(stored);
      setAuth({ status: "loggedIn", uid: user.uid, loginKey: stored });
    }).catch(() => {
      clearLoginKey();
      setCurrentJwt(null);
      setAuth({ status: "loggedOut", uid: null, loginKey: null });
    });
  }, []);

  const login = useCallback(
    async (loginKey: string): Promise<string | false> => {
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
          setCurrentJwt(session.access_token);
          await createUser(trimmed, uid);
        }

        if (existing) {
          const session = await buildSession(uid);
          setCurrentJwt(session.access_token);
        }
        storeLoginKey(trimmed);
        setAuth({ status: "loggedIn", uid, loginKey: trimmed });
        return uid;
      } catch {
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearLoginKey();
    setCurrentJwt(null);
    setAuth({ status: "loggedOut", uid: null, loginKey: null });
  }, []);

  return { ...auth, login, logout };
}
