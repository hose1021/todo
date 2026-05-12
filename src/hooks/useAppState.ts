"use client";

import { useGameState } from "@/hooks/useGameState";
import { useCloudState } from "@/hooks/useCloudState";
import { useAuth } from "@/hooks/useAuth";

const IS_DEV = process.env.NEXT_PUBLIC_ENV === "development";

export function useAppState() {
  const gameState = useGameState();
  const auth = useAuth();
  const cloudState = useCloudState(auth.uid || "");

  if (IS_DEV) {
    return {
      ...gameState,
      status: "loggedIn" as const,
      uid: "",
      login: () => {},
      logout: () => {},
      setUsername: () => {},
      refreshState: () => {},
      isOnline: false,
    };
  }

  return {
    ...cloudState,
    status: auth.status,
    uid: auth.uid,
    login: auth.login,
    logout: auth.logout,
    isOnline: true,
  };
}
