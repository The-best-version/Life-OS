import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Every value here resolves to a CSS variable declared in `globals.css`, so the
 * theme flips by swapping one attribute on <html> and no utility class has to
 * change. Nothing in this file is a literal colour.
 *
 * `darkMode` is driven by `[data-theme="dark"]` rather than a `.dark` class,
 * because the tokens themselves are already scoped to that attribute — one
 * mechanism, not two.
 */
const config: Config = {
  darkMode: ["variant", '&:where([data-theme="dark"], [data-theme="dark"] *)'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },

      /**
       * Type scale: 12 / 14 / 16 / 20 / 24 / 32 / 48.
       *
       * Line heights tighten as the size grows — a 48px hero figure at 1.5
       * leading is a gap, not a number. Arabic needs more leading than Latin at
       * body sizes, hence 1.7 at 14/16px; the display steps are set solid
       * because they are always one line.
       */
      fontSize: {
        xs: ["12px", { lineHeight: "1.6" }],
        sm: ["14px", { lineHeight: "1.7" }],
        base: ["16px", { lineHeight: "1.7" }],
        lg: ["20px", { lineHeight: "1.45" }],
        xl: ["24px", { lineHeight: "1.3" }],
        "2xl": ["32px", { lineHeight: "1.15" }],
        "3xl": ["48px", { lineHeight: "1" }],
      },

      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        /* The brand accent. `ink` is its small-text twin — see the fill/ink rule
           at the top of globals.css. */
        primary: {
          DEFAULT: "hsl(var(--primary))",
          ink: "hsl(var(--primary-ink))",
          foreground: "hsl(var(--primary-foreground))",
        },

        /* shadcn surfaces, not brand colours. */
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        /* Semantic roles. Each carries a `-ink` for use as small text. */
        success: {
          DEFAULT: "hsl(var(--success))",
          ink: "hsl(var(--success-ink))",
          foreground: "hsl(var(--primary-foreground))",
        },
        caution: {
          DEFAULT: "hsl(var(--caution))",
          ink: "hsl(var(--caution-ink))",
          foreground: "hsl(var(--foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          ink: "hsl(var(--danger-ink))",
          foreground: "hsl(var(--primary-foreground))",
        },
        recovery: {
          DEFAULT: "hsl(var(--recovery))",
          ink: "hsl(var(--recovery-ink))",
          foreground: "hsl(var(--primary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        border: {
          DEFAULT: "hsl(var(--border))",
          strong: "hsl(var(--border-strong))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* Muscle groups, for a chart mark or a group chip. Plain hexes in the
           tokens, so they are referenced directly rather than through hsl(). */
        muscle: {
          chest: "var(--muscle-chest)",
          back: "var(--muscle-back)",
          shoulders: "var(--muscle-shoulders)",
          biceps: "var(--muscle-biceps)",
          triceps: "var(--muscle-triceps)",
          quads: "var(--muscle-quads)",
          hamstrings: "var(--muscle-hamstrings)",
          glutes: "var(--muscle-glutes)",
          calves: "var(--muscle-calves)",
          core: "var(--muscle-core)",
        },
      },

      /**
       * Exactly three radii: 12 / 20 / 28.
       *
       * `sm` and `md` both resolve to 12px on purpose. Small controls — chips,
       * inputs, steppers — all want the same corner, and giving them two
       * near-identical values is how a system quietly grows a fourth radius.
       */
      borderRadius: {
        sm: "12px",
        md: "12px",
        lg: "var(--radius)" /* 20px */,
        xl: "28px",
        "2xl": "28px",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--glow-accent)",
        none: "none",
      },

      /* 4px spacing scale: Tailwind's default is already 4px-based, so only the
         odd steps this layout needs are added. */
      spacing: {
        4.5: "18px",
        13: "52px",
        15: "60px",
      },

      transitionTimingFunction: {
        DEFAULT: "var(--ease)",
        out: "var(--ease)",
      },
      transitionDuration: {
        DEFAULT: "var(--dur)",
        fast: "var(--dur-fast)",
        slow: "var(--dur-slow)",
      },

      /** A touch target floor. 44px is the smallest thing a thumb hits. */
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },

      keyframes: {
        "rise-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /* Opacity only. Anything wrapping background-clipped text has to enter
           without a transform — see the note on .ink-gradient. */
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.72)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "sweep-up": {
          from: { transform: "scaleY(0)" },
          to: { transform: "scaleY(1)" },
        },
        "sheet-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "rise-in": "rise-in var(--dur-slow) var(--ease) both",
        "fade-in": "fade-in var(--dur-slow) var(--ease) both",
        "pop-in": "pop-in var(--dur) var(--ease) both",
        "sweep-up": "sweep-up 500ms var(--ease) both",
        "sheet-up": "sheet-up var(--dur-slow) var(--ease) both",
      },
    },
  },
  plugins: [animate],
};

export default config;
