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
        // Added for the multi-sport layer. Not decoration: amber is a
        // countdown running down, violet is the hue held for the fifth
        // discipline. See globals.css.
        amber: withAlpha("--amber"),
        violet: withAlpha("--violet"),
      },
      borderRadius: {
        lg: "12px",
        xl: "18px",
        "2xl": "26px",
      },
      boxShadow: {
        // The names are kept so every existing call site keeps working; the
        // look is the new one — depth from a shadow stack, not a hard offset.
        plate:
          "inset 0 1px 0 0 hsl(0 0% 100% / 0.05), 0 10px 26px -14px hsl(0 0% 0% / 0.85)",
        lift:
          "inset 0 1px 0 0 hsl(0 0% 100% / 0.07), 0 20px 44px -20px hsl(0 0% 0% / 0.95)",
        glowAccent:
          "0 0 0 1px hsl(var(--accent) / 0.45), 0 10px 30px -10px hsl(var(--accent) / 0.4)",
        glowSteel:
          "0 0 0 1px hsl(var(--steel) / 0.4), 0 10px 30px -12px hsl(var(--steel) / 0.32)",
        glowDanger:
          "0 0 0 1px hsl(var(--danger) / 0.45), 0 10px 32px -12px hsl(var(--danger) / 0.38)",
        hud: "0 -14px 50px -18px hsl(0 0% 0% / 0.95)",
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
        // A completion pays out once and settles. Nothing here loops.
        "pop": {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        "ripple": {
          from: { opacity: "0.5", transform: "scale(0.6)" },
          to: { opacity: "0", transform: "scale(1.9)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease forwards",
        "fade-in-up": "fade-in-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "sheet-up": "sheet-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "rise-in": "rise-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pop: "pop 0.34s cubic-bezier(0.22, 1, 0.36, 1)",
        ripple: "ripple 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
