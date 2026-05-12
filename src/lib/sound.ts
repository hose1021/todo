"use client";

import { useRef, useState, useCallback } from "react";

const MUTE_KEY = "habbittodo_mute";

function useAudioContext(isMuted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  return useCallback((): AudioContext | null => {
    if (isMuted) return null;
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, [isMuted]);
}

function playTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MUTE_KEY) === "true";
  });

  const getCtx = useAudioContext(isMuted);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      return next;
    });
  }, []);

  const playPlantSound = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch {
      // audio not available
    }
  }, [getCtx]);

  const playCompleteSound = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      playTone(ctx, 880, 0.12, "sine", 0.12);
      setTimeout(() => {
        const ctx2 = getCtx();
        if (ctx2) playTone(ctx2, 1100, 0.1, "sine", 0.1);
      }, 60);
    } catch {
      // audio not available
    }
  }, [getCtx]);

  const playDeleteSound = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      playTone(ctx, 330, 0.15, "triangle", 0.15);
      setTimeout(() => {
        const ctx2 = getCtx();
        if (ctx2) playTone(ctx2, 260, 0.2, "triangle", 0.12);
      }, 80);
    } catch {
      // audio not available
    }
  }, [getCtx]);

  const playLevelUpSound = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.13, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
    } catch {
      // audio not available
    }
  }, [getCtx]);

  return {
    isMuted,
    toggleMute,
    playPlantSound,
    playCompleteSound,
    playDeleteSound,
    playLevelUpSound,
  };
}
