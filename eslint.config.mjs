import nextPlugin from "@next/eslint-plugin-next";

export default [
  { ignores: [".next/", "out/"] },
  nextPlugin.configs["core-web-vitals"],
];
