"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getStoredLoginKey,
  getStoredLoginName,
  storeLoginCreds,
  clearLoginKey,
  buildSession,
  hashLoginKey,
} from "@/lib/auth";
import { authUser, setCurrentJwt } from "@/lib/supabase";

type AuthStatus = "checking" | "loggedOut" | "loggedIn";

interface AuthState {
  status: AuthStatus;
  uid: string | null;
  loginKey: string | null;
  username: string | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    status: "checking",
    uid: null,
    loginKey: null,
    username: null,
  });

  useEffect(() => {
    const storedKey = getStoredLoginKey();
    const storedName = getStoredLoginName();
    if (!storedKey) {
      setAuth({ status: "loggedOut", uid: null, loginKey: null, username: null });
      return;
    }

    hashLoginKey(storedKey)
      .then((hash) => authUser(hash, storedName || ""))
      .then(async (uid) => {
        if (!uid) {
          clearLoginKey();
          setCurrentJwt(null);
          setAuth({ status: "loggedOut", uid: null, loginKey: null, username: null });
          return;
        }
        const session = await buildSession(uid);
        setCurrentJwt(session.access_token);
        setAuth({ status: "loggedIn", uid, loginKey: storedKey, username: storedName });
      })
      .catch(() => {
        clearLoginKey();
        setCurrentJwt(null);
        setAuth({ status: "loggedOut", uid: null, loginKey: null, username: null });
      });
  }, []);

  const login = useCallback(
    async (secret: string, name: string): Promise<string | false> => {
      if (!secret.trim()) return false;
      try {
        const hash = await hashLoginKey(secret.trim());
        const uid = await authUser(hash, name.trim());

        if (!uid) return false;

        const session = await buildSession(uid);
        setCurrentJwt(session.access_token);
        storeLoginCreds(secret.trim(), name.trim());
        setAuth({ status: "loggedIn", uid, loginKey: secret.trim(), username: name.trim() });
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
    setAuth({ status: "loggedOut", uid: null, loginKey: null, username: null });
  }, []);

  return { ...auth, login, logout };
}
