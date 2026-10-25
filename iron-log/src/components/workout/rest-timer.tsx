"use client";

/**
 * The rest clock.
 *
 * Two decisions carry this component:
 *
 *  1. **The timer is an absolute deadline, not a counter.** State holds
 *     `endsAt`, and the tick only re-reads `Date.now()`. A background tab
 *     throttles `setInterval` to once a minute and `requestAnimationFrame` to
 *     nothing at all — a decremented counter would come back from a locked phone
 *     minutes behind, which is worse than no timer, because the user trusts it.
 *     With a deadline, whatever the tick rate, the number on screen is right.
 *
 *  2. **It lives above the pages, in the shell.** Rest does not stop because you
 *     swiped to the progress screen to look at last week, so the provider is
 *     mounted once in `AppShell` and the floating bar follows you across routes.
 */

import { Pause, Play, RotateCcw, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface RestSession {
  /** What the rest belongs to — the exercise name, shown on the bar. */
  label: string;
  /** Seconds the rest was set to, for the progress track. */
  totalSeconds: number;
  /** Wall-clock milliseconds at which rest is over. */
  endsAt: number;
  /** Set while paused: the milliseconds that were still to run. */
  pausedWith: number | null;
}

interface RestTimerValue {
  /** Seconds left, `null` when no rest is running. Counts down through zero. */
  remaining: number | null;
  totalSeconds: number | null;
  label: string | null;
  paused: boolean;
  start(seconds: number, label: string): void;
  extend(deltaSeconds: number): void;
  restart(): void;
  togglePause(): void;
  stop(): void;
}

const RestTimerContext = createContext<RestTimerValue | null>(null);

export interface RestTimerPrefs {
  sound: boolean;
  vibrate: boolean;
}

/**
 * A two-tone chime built from an oscillator rather than an audio file: no asset
 * to ship, no fetch to fail, and it is created inside the same gesture that
 * saved the set — which is what lets iOS play it at all.
 */
function chime() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;

    for (const [index, frequency] of [880, 1320].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      const at = now + index * 0.16;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.3);
    }

    // Release the hardware; leaving contexts open exhausts them on iOS.
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 900);
  } catch {
    /* Audio is a nicety. A blocked context must never break the timer. */
  }
}

function buzz() {
  try {
    navigator.vibrate?.([120, 80, 120]);
  } catch {
    /* Unsupported on iOS Safari; the chime and the bar still land. */
  }
}

export function RestTimerProvider({
  prefs,
  children,
}: {
  prefs: RestTimerPrefs;
  children: ReactNode;
}) {
  const [session, setSession] = useState<RestSession | null>(null);
  const [now, setNow] = useState(() => Date.now());
  /** Guards the alarm so it fires once per rest, not once per tick. */
  const firedRef = useRef(false);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  /* ---- the tick ---- */
  useEffect(() => {
    if (!session || session.pausedWith !== null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [session]);

  /* ---- catch up after the tab was hidden ---- */
  useEffect(() => {
    function resync() {
      if (document.visibilityState === "visible") setNow(Date.now());
    }
    document.addEventListener("visibilitychange", resync);
    return () => document.removeEventListener("visibilitychange", resync);
  }, []);

  const remainingMs =
    session === null
      ? null
      : session.pausedWith !== null
        ? session.pausedWith
        : session.endsAt - now;

  /* ---- the alarm ---- */
  useEffect(() => {
    if (remainingMs === null || firedRef.current) return;
    if (remainingMs > 0) return;
    firedRef.current = true;
    if (prefsRef.current.sound) chime();
    if (prefsRef.current.vibrate) buzz();
  }, [remainingMs]);

  const start = useCallback((seconds: number, label: string) => {
    const total = Math.max(5, Math.round(seconds));
    firedRef.current = false;
    setNow(Date.now());
    setSession({
      label,
      totalSeconds: total,
      endsAt: Date.now() + total * 1000,
      pausedWith: null,
    });
  }, []);

  const stop = useCallback(() => {
    firedRef.current = false;
    setSession(null);
  }, []);

  const extend = useCallback((deltaSeconds: number) => {
    setSession((current) => {
      if (!current) return current;
      const delta = deltaSeconds * 1000;
      if (current.pausedWith !== null) {
        const nextPaused = Math.max(0, current.pausedWith + delta);
        // Adding time to a finished rest re-arms the alarm; otherwise a "+30"
        // tapped after the chime would sit at zero and never ring again.
        if (nextPaused > 0) firedRef.current = false;
        return { ...current, pausedWith: nextPaused };
      }
      const nextEnd = current.endsAt + delta;
      if (nextEnd > Date.now()) firedRef.current = false;
      return {
        ...current,
        endsAt: nextEnd,
        totalSeconds: Math.max(
          current.totalSeconds,
          Math.ceil((nextEnd - Date.now()) / 1000),
        ),
      };
    });
  }, []);

  const restart = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      firedRef.current = false;
      return {
        ...current,
        endsAt: Date.now() + current.totalSeconds * 1000,
        pausedWith: null,
      };
    });
  }, []);

  const togglePause = useCallback(() => {
    setSession((current) => {
      if (!current) return current;
      if (current.pausedWith !== null) {
        return {
          ...current,
          endsAt: Date.now() + current.pausedWith,
          pausedWith: null,
        };
      }
      return {
        ...current,
        pausedWith: Math.max(0, current.endsAt - Date.now()),
      };
    });
  }, []);

  const value = useMemo<RestTimerValue>(
    () => ({
      remaining:
        remainingMs === null ? null : Math.ceil(remainingMs / 1000),
      totalSeconds: session?.totalSeconds ?? null,
      label: session?.label ?? null,
      paused: session?.pausedWith !== null && session !== null,
      start,
      extend,
      restart,
      togglePause,
      stop,
    }),
    [remainingMs, session, start, extend, restart, togglePause, stop],
  );

  return (
    <RestTimerContext.Provider value={value}>
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer(): RestTimerValue {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error("useRestTimer must be used inside <RestTimerProvider>");
  }
  return context;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * The floating bar.
 *
 * It sits clear of the bottom nav via `env(safe-area-inset-bottom)` plus the
 * nav's own height, so on a phone it never covers the tab you are trying to
 * reach. Once rest is over it stays on screen — turning red and counting *up* —
 * because the useful fact at that point is how long you have been standing
 * around, and a bar that vanishes takes that with it.
 */
export function RestTimerBar() {
  const { remaining, totalSeconds, label, paused, extend, restart, togglePause, stop } =
    useRestTimer();

  if (remaining === null || totalSeconds === null) return null;

  const over = remaining <= 0;
  const progress = over
    ? 100
    : Math.max(0, Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100));
  const nearlyDone = !over && remaining <= 10;

  return (
    <div
      className="fixed inset-x-0 z-40 px-3 animate-sheet-up"
      style={{ bottom: "calc(74px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        role="timer"
        aria-live="off"
        className={cn(
          "plate relative mx-auto flex max-w-[560px] items-center gap-3 overflow-hidden p-3",
          over && "border-accent/60",
        )}
      >
        {/* The fill runs behind the content: the bar itself is the progress. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 start-0 transition-[width] duration-300",
            over ? "bg-accent/25" : "bg-accent/12",
          )}
          style={{ width: `${progress}%` }}
        />

        <div
          className={cn(
            "relative flex size-12 shrink-0 items-center justify-center rounded-full border",
            over ? "border-accent bg-accent/20" : "border-line-strong bg-surface",
            nearlyDone && "animate-pulse border-accent",
          )}
        >
          <span
            className={cn(
              "num text-[15px]",
              over ? "text-accent-glow" : "text-fg",
            )}
            dir="ltr"
          >
            {over ? `+${formatClock(-remaining)}` : formatClock(remaining)}
          </span>
        </div>

        <div className="relative min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-extrabold leading-tight">
            {over ? "انتهت الراحة — ابدأ المجموعة" : "راحة"}
          </p>
          <p className="truncate  text-[11px] text-fg-3">
            {label ?? ""}
          </p>
        </div>

        <div className="relative flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => extend(-15)}
            aria-label="خصم ١٥ ثانية"
            className="h-9 rounded-md border border-line-strong px-2  text-[11px] font-bold text-fg-3 transition-colors hover:text-fg"
          >
            <span dir="ltr">−15</span>
          </button>
          <button
            type="button"
            onClick={() => extend(30)}
            aria-label="إضافة ٣٠ ثانية"
            className="h-9 rounded-md border border-line-strong px-2  text-[11px] font-bold text-fg-3 transition-colors hover:text-fg"
          >
            <span dir="ltr">+30</span>
          </button>
          <button
            type="button"
            onClick={over ? restart : togglePause}
            aria-label={over ? "إعادة الراحة" : paused ? "متابعة" : "إيقاف مؤقت"}
            className="flex size-9 items-center justify-center rounded-md border border-line-strong text-fg-3 transition-colors hover:text-fg"
          >
            {over ? (
              <RotateCcw className="size-4" aria-hidden />
            ) : paused ? (
              <Play className="size-4" aria-hidden />
            ) : (
              <Pause className="size-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label="إنهاء الراحة"
            className="flex size-9 items-center justify-center rounded-md border border-line-strong text-fg-3 transition-colors hover:text-accent-glow"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
