"use client";

/**
 * One dial, three jobs.
 *
 * `phase` is the only thing that decides which:
 *   "rest"  amber   — a lift's rest interval, counting down
 *   "work"  crimson — a round running against the sport's work interval
 *   "open"  cyan    — a ride or a run, counting up with no target
 *
 * The hook below counts an ABSOLUTE deadline rather than decrementing a number
 * on a tick: a phone that locks mid-round has to come back on the right
 * second, and the interval exists only to re-render. It is also why pausing
 * banks the elapsed time instead of stopping a counter — a pause is the one
 * moment the amount of work done is actually known.
 */

import { Pause, Play, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/sports-config";
import { cn } from "@/lib/utils";

export type TimerPhase = "rest" | "work" | "open";

export interface AthleticTimer {
  running: boolean;
  /** Seconds counted so far on this leg plus everything banked. */
  elapsed: number;
  /** Seconds left against `total`. 0 for a stopwatch. */
  remaining: number;
  total: number;
  /** True the moment a countdown reaches zero. Fires `onComplete` once. */
  done: boolean;
  toggle(): void;
  /** Add or remove seconds from the target: +30s, +1m. */
  adjust(seconds: number): void;
  /**
   * Re-arm the dial. `banked` pre-loads seconds that have already elapsed,
   * which is what lets an open stopwatch be armed from a session's own
   * `startedAt` — a ride reopened twenty minutes in shows twenty minutes, not
   * zero.
   */
  reset(seconds?: number, autoStart?: boolean, banked?: number): void;
}

export function useAthleticTimer(options: {
  seconds: number;
  countsDown: boolean;
  autoStart?: boolean;
  onComplete?(): void;
}): AthleticTimer {
  const { seconds, countsDown, autoStart = false, onComplete } = options;

  const [total, setTotal] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const [banked, setBanked] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(
    autoStart ? Date.now() : null,
  );
  const [, bump] = useState(0);

  /* The bell must not ring twice for one leg, and it must not ring for a leg
     the user reset past. */
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => bump((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsed =
    banked + (running && startedAt !== null ? (Date.now() - startedAt) / 1000 : 0);
  const remaining = countsDown ? Math.max(0, total - elapsed) : 0;
  const done = countsDown && total > 0 && remaining <= 0;

  useEffect(() => {
    if (!done || firedRef.current) return;
    firedRef.current = true;
    onComplete?.();
  }, [done, onComplete]);

  const toggle = useCallback(() => {
    setRunning((wasRunning) => {
      if (wasRunning) {
        setBanked((b) => b + (startedAt !== null ? (Date.now() - startedAt) / 1000 : 0));
        setStartedAt(null);
        return false;
      }
      setStartedAt(Date.now());
      return true;
    });
  }, [startedAt]);

  const adjust = useCallback((delta: number) => {
    setTotal((t) => Math.max(0, t + delta));
    firedRef.current = false;
  }, []);

  const reset = useCallback(
    (nextSeconds?: number, nextAutoStart = false, nextBanked = 0) => {
      firedRef.current = false;
      setTotal(nextSeconds ?? seconds);
      setBanked(nextBanked);
      setStartedAt(nextAutoStart ? Date.now() : null);
      setRunning(nextAutoStart);
    },
    [seconds],
  );

  return { running, elapsed, remaining, total, done, toggle, adjust, reset };
}

const PHASE_TONE: Record<TimerPhase, { var: string; panel: string; shadow: string }> = {
  rest: { var: "--amber", panel: "bg-amber/[0.08]", shadow: "shadow-plate" },
  work: { var: "--danger", panel: "bg-danger/[0.08]", shadow: "shadow-glowDanger" },
  open: { var: "--steel", panel: "bg-steel/[0.06]", shadow: "shadow-glowSteel" },
};

const DIAL = 224;
const RADIUS = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AdaptiveTimer({
  phase,
  label,
  caption,
  timer,
  onSkip,
  className,
}: {
  phase: TimerPhase;
  label: string;
  caption?: string;
  timer: AthleticTimer;
  onSkip?(): void;
  className?: string;
}) {
  const tone = PHASE_TONE[phase];
  const counting = phase !== "open";
  const value = counting ? timer.remaining : timer.elapsed;
  const progress =
    counting && timer.total > 0
      ? Math.min(1, Math.max(0, 1 - timer.remaining / timer.total))
      : 0;

  return (
    <div
      style={{ "--sport": `hsl(var(${tone.var}))` } as React.CSSProperties}
      className={cn(
        "flex flex-col items-center gap-5 rounded-2xl border border-line p-5",
        tone.panel,
        tone.shadow,
        className,
      )}
    >
      <div className="relative" style={{ width: DIAL, height: DIAL }}>
        <svg
          width={DIAL}
          height={DIAL}
          viewBox={`0 0 ${DIAL} ${DIAL}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={DIAL / 2}
            cy={DIAL / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--viz-grid)"
            strokeWidth={10}
          />
          {counting ? (
            <circle
              cx={DIAL / 2}
              cy={DIAL / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--sport)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              style={{ transition: "stroke-dashoffset 300ms linear" }}
            />
          ) : (
            /* A stopwatch has no end, so it gets a moving mark rather than a
               filled arc — an arc would imply a target that does not exist. */
            <circle
              cx={DIAL / 2}
              cy={DIAL / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--sport)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE * 0.08} ${CIRCUMFERENCE}`}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-3">
            {label}
          </span>
          <span
            role="timer"
            className="score text-[64px] font-bold text-fg sm:text-[72px]"
          >
            {formatClock(value)}
          </span>
          {caption ? (
            <span className="text-[13px] text-fg-2">{caption}</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          onClick={() => timer.adjust(30)}
          disabled={!counting}
          /* There is nothing to extend on a stopwatch, and a button that does
             nothing is worse than one that is visibly unavailable. */
        >
          ثانية ٣٠+
        </Button>
        <Button
          variant={timer.running ? "secondary" : "primary"}
          onClick={timer.toggle}
        >
          {timer.running ? (
            <Pause className="size-[18px]" aria-hidden />
          ) : (
            <Play className="size-[18px]" aria-hidden />
          )}
          {timer.running ? "إيقاف مؤقت" : "ابدأ"}
        </Button>
        {onSkip ? (
          <Button variant="ghost" onClick={onSkip}>
            <SkipForward className="size-[18px]" aria-hidden />
            {counting ? "تخطَّ" : "أوقف"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
