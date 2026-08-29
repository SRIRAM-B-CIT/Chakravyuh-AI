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
        defense: {
          bg: "#090d16",
          surface: "#0f172a",
          card: "#131d33",
          cardHover: "#17233d",
          border: "#1e2c47",
          borderLight: "#2e4166",
          borderGlow: "#3b82f6",
        },
        tactical: {
          emerald: "#10b981",
          emeraldGlow: "#059669",
          crimson: "#ef4444",
          crimsonGlow: "#dc2626",
          amber: "#f59e0b",
          amberGlow: "#d97706",
          violet: "#8b5cf6",
          violetGlow: "#7c3aed",
          teal: "#06b6d4",
          tealGlow: "#0891b2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "radar": "radarSweep 4s linear infinite",
      },
      keyframes: {
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      boxShadow: {
        "tactical-emerald": "0 0 20px -5px rgba(16, 185, 129, 0.4)",
        "tactical-crimson": "0 0 25px -5px rgba(239, 68, 68, 0.5)",
        "tactical-amber": "0 0 20px -5px rgba(245, 158, 11, 0.4)",
        "tactical-violet": "0 0 20px -5px rgba(139, 92, 246, 0.4)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
};
export default config;
