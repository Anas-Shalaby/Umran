import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "var(--surface-base)",
          canvas: "var(--surface-canvas)",
          elevated: "var(--surface-elevated)",
          muted: "var(--surface-muted)",
        },
        space: {
          950: "#020617",
          900: "#07111f",
          800: "#0f172a",
        },
        umran: {
          gold: "#f6c453",
          amber: "#f59e0b",
          emerald: "#10b981",
        },
      },
      boxShadow: {
        "gold-glow": "0 0 48px rgba(245, 158, 11, 0.28)",
        "emerald-glow": "0 0 44px rgba(16, 185, 129, 0.22)",
      },
      fontFamily: {
        sans: ["var(--font-umran)", "system-ui", "sans-serif"],
        arabic: ["var(--font-umran)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "nav-progress": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(380%)" },
        },
        "nav-progress-complete": {
          "0%": { transform: "scaleX(0)", opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "0" },
        },
      },
      animation: {
        "nav-progress": "nav-progress 1.1s ease-in-out infinite",
        "nav-progress-complete":
          "nav-progress-complete 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
