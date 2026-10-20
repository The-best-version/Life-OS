"use client";

/**
 * Theme: light by default, dark on request, and "follow the system" as a third
 * state you have to choose — never a hidden default. The app is a bright studio;
 * a dark OS is not a reason to show someone a different product.
 *
 * Three things have to line up or the switch shows as a flash:
 *
 *  1. `THEME_SCRIPT` runs synchronously in <head>, before the first paint, and
 *     writes `data-theme` onto <html>. The tokens in globals.css are scoped to
 *     that attribute, so the very first painted frame is already correct.
 *  2. Nothing theme-dependent is rendered during the server pass. The provider
 *     starts from `null` and only learns the real choice after mount, so the
 *     server HTML and the first client render are identical and React never
 *     reports a mismatch. A control that needs to know the theme renders its
 *     neutral state until then.
 *  3. The browser-chrome colour is a plain <meta name="theme-color"> managed
 *     here, not the `themeColor` viewport export. The export can only key off a
 *     media query, which would contradict a user who picked light while their OS
 *     is dark.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CHROME_COLOR,
  THEME_KEY,
  type ResolvedTheme,
  type ThemeChoice,
} from "./theme-script";

/* `THEME_SCRIPT` is deliberately NOT re-exported here. Re-exporting it through
   this "use client" module would hand the server layout a client reference
   instead of the script source — the exact failure this split exists to prevent.
   The layout imports it from "./theme-script" directly. */
export { THEME_KEY } from "./theme-script";
export type { ResolvedTheme, ThemeChoice } from "./theme-script";

function readChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* private mode or blocked site data — fall through to the default */
  }
  /* Light, NOT "system", and this must stay in step with `THEME_SCRIPT`. The
     script writes light before first paint; if this returned "system" the
     provider would resolve the OS on mount and flip a dark-OS machine straight
     back to black a frame later — which is how nobody ever saw this identity.
     "system" is now something you pick, never something you land on. */
  return "dark";
}

function systemTheme(): ResolvedTheme {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function apply(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", CHROME_COLOR[resolved]);
}

interface ThemeContextValue {
  /** What the user chose. `system` means "keep following the OS". */
  choice: ThemeChoice;
  /**
   * The theme actually on screen, or `null` before mount.
   *
   * Null is not a placeholder to paper over — it is the honest answer during the
   * server pass, and a control that renders a checkmark has to handle it rather
   * than guess and then correct itself on hydration.
   */
  resolved: ResolvedTheme | null;
  setChoice(next: ThemeChoice): void;
  /** Flip between light and dark, collapsing `system` to its current value. */
  toggle(): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [resolved, setResolved] = useState<ResolvedTheme | null>(null);

  /* ---- adopt whatever the head script already decided ---- */
  useEffect(() => {
    const stored = readChoice();
    setChoiceState(stored);
    setResolved(stored === "system" ? systemTheme() : stored);
  }, []);

  /* ---- follow the OS, but only while the choice is `system` ---- */
  useEffect(() => {
    if (choice !== "system") return;
    let media: MediaQueryList;
    try {
      media = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }
    const onChange = () => {
      const next = systemTheme();
      setResolved(next);
      apply(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    const target = next === "system" ? systemTheme() : next;
    setResolved(target);
    apply(target);
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage is blocked; the theme still applies for this session. Silence is
      // right here — the whole app already warns once about unavailable storage.
    }
  }, []);

  const toggle = useCallback(() => {
    setChoice(
      (resolved ?? systemTheme()) === "dark" ? "light" : "dark",
    );
  }, [resolved, setChoice]);

  const value = useMemo<ThemeContextValue>(
    () => ({ choice, resolved, setChoice, toggle }),
    [choice, resolved, setChoice, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return context;
}
