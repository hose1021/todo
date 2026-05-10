import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      animation: {
        "float-up": "floatUp 1.2s ease-out forwards",
      },
      keyframes: {
        floatUp: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-24px)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
