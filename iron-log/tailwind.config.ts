import type { Config } from "tailwindcss";

const withAlpha = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        num: ['"Oswald"', '"IBM Plex Sans Arabic"', "sans-serif"],
        display: ['"Oswald"', "sans-serif"],
      },
      colors: {
        bg: withAlpha("--bg"),
        surface: {
          DEFAULT: withAlpha("--surface"),
          2: withAlpha("--surface-2"),
          3: withAlpha("--surface-3"),
        },
        line: {
          DEFAULT: withAlpha("--line"),
          strong: withAlpha("--line-strong"),
        },
        fg: {
          DEFAULT: withAlpha("--fg"),
          2: withAlpha("--fg-2"),
          3: withAlpha("--fg-3"),
        },
        accent: {
          DEFAULT: withAlpha("--accent"),
          glow: withAlpha("--accent-glow"),
        },
        steel: withAlpha("--steel"),
        success: withAlpha("--success"),
        danger: withAlpha("--danger"),
      },
      borderRadius: {
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
      },
      boxShadow: {
        plate: "inset 0 1px 0 0 hsl(var(--fg) / 0.05), 0 1px 0 0 hsl(0 0% 0% / 0.3)",
        lift: "0 12px 32px -8px hsl(0 0% 0% / 0.55), inset 0 1px 0 0 hsl(var(--fg) / 0.06)",
        glowAccent: "0 0 28px -6px hsl(var(--accent) / 0.45)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease forwards",
        "fade-in-up": "fade-in-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "sheet-up": "sheet-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "rise-in": "rise-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
