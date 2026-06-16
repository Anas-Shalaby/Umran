import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#020617",
          900: "#07111f",
          800: "#0f172a"
        },
        umran: {
          gold: "#f6c453",
          amber: "#f59e0b",
          emerald: "#10b981"
        }
      },
      boxShadow: {
        "gold-glow": "0 0 48px rgba(245, 158, 11, 0.28)",
        "emerald-glow": "0 0 44px rgba(16, 185, 129, 0.22)"
      },
      fontFamily: {
        sans: ["var(--font-umran)", "system-ui", "sans-serif"],
        arabic: [
          "var(--font-umran)",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
