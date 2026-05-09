"use client";

import { useEffect, useState } from "react";

interface ConfettiProps {
  show: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  delay: number;
  size: number;
}

const COLORS = ["#FF6B6B", "#FFD93D", "#4CAF50", "#4D96FF", "#FF922B", "#CC5DE8", "#F06595"];

export default function Confetti({ show }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!show) {
      setParticles([]);
      return;
    }

    const items: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -5 - Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      size: 6 + Math.random() * 8,
    }));
    setParticles(items);
  }, [show]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall ${2 + Math.random() * 2}s ease-in ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-bold text-amber-400 animate-bounce-in"
        style={{
          textShadow: "0 4px 8px rgba(0,0,0,0.2)",
          animation: "bounceIn 0.5s ease-out, fadeOut 1s ease-in 1.5s forwards",
        }}
      >
        🎉
      </div>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
