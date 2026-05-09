import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soil: {
          light: "#8D6E63",
          DEFAULT: "#795548",
          dark: "#5D4037",
        },
        grass: {
          light: "#81C784",
          DEFAULT: "#4CAF50",
          dark: "#2E7D32",
        },
      },
      animation: {
        "bounce-in": "bounceIn 0.5s ease-out",
        "pop": "pop 0.3s ease-out",
        "float-up": "floatUp 1.5s ease-out forwards",
        "wither": "wither 0.4s ease-in forwards",
        "shake": "shake 0.5s ease-in-out",
        "sparkle": "sparkle 0.6s ease-out forwards",
      },
      keyframes: {
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
        floatUp: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-60px)", opacity: "0" },
        },
        wither: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.3) scaleY(0.2)", opacity: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        sparkle: {
          "0%": { transform: "scale(1) translate(0, 0)", opacity: "1" },
          "100%": { transform: "scale(0) translate(var(--tx), var(--ty))", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
