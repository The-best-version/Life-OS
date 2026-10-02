"use client";

/**
 * Motion primitives.
 *
 * Three hooks, one rule: every one of them has a correct still frame. Reduced
 * motion is not a degraded path here — it is the same final state, reached
 * immediately.
 */

import { useEffect, useRef, useState } from "react";

/**
 * Whether the user asked for less motion. Re-checked live, because the setting
 * can change while the app is open (and on a phone it often does, when a battery
 * saver flips it).
 */
export function usePrefersReducedMotion(): boolean {
  // Starts `true` so the very first render is the still frame: if motion turns
  // out to be welcome, one extra frame of stillness is invisible, whereas
  // starting `false` would run one frame of animation at someone who asked for
  // none.
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      setReduced(false);
      return;
    }
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Count a figure up to `value` instead of popping it in.
 *
 * `requestAnimationFrame` is right for this — it is cosmetic, and a dropped
 * frame costs nothing. What it cannot be allowed to do is *strand* the number:
 * rAF does not run in a hidden tab, so a value animating when the tab is
 * backgrounded would sit at its start until the tab returned. The timeout below
 * is the guarantee that the number always arrives, animated or not.
 *
 * Returns the display value, which equals `value` the moment the run ends.
 */
export function useCountUp(value: number, durationMs = 650): number {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;

    if (reduced || from === to || !Number.isFinite(to) || !Number.isFinite(from)) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }

    let frame = 0;
    const start = performance.now();
    // Same ease-out as the CSS token, so a counting figure and the card it sits
    // on decelerate together.
    const ease = (t: number) => 1 - (1 - t) ** 3;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(from + (to - from) * ease(t));
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    frame = requestAnimationFrame(tick);

    // The safety net: whatever happened to the frames, land on the real number.
    const settle = setTimeout(() => {
      cancelAnimationFrame(frame);
      fromRef.current = to;
      setDisplay(to);
    }, durationMs + 120);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, [value, durationMs, reduced]);

  return display;
}

/**
 * True once the element has been scrolled into view, and true forever after —
 * a chart that redraws itself every time it scrolls past is a distraction, not a
 * reveal.
 *
 * Under reduced motion it reports `true` on the first render, so a draw-in
 * animation is simply never armed and the chart is there from the start.
 */
export function useInView<T extends Element>(
  rootMargin = "0px 0px -12% 0px",
): { ref: (node: T | null) => void; inView: boolean } {
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const nodeRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = (node: T | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    nodeRef.current = node;
    if (!node || inView) return;

    // No IntersectionObserver (or a jsdom-style environment): show the content.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
          observerRef.current = null;
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    observer.observe(node);
    observerRef.current = observer;
  };

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { ref, inView: reduced ? true : inView };
}

/**
 * A short-lived flag for a confirm or a celebration.
 *
 * Set synchronously and cleared on a timer — never driven off
 * `requestAnimationFrame`. rAF does not run in a hidden tab, so a reward armed
 * that way is swallowed and then replays when the tab comes back, which reads as
 * a glitch several minutes after the thing it was rewarding.
 */
export function useFlash(durationMs = 900): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fire = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOn(true);
    timerRef.current = setTimeout(() => setOn(false), durationMs);
  };

  return [on, fire];
}

/**
 * A short haptic tap, where the platform offers one.
 *
 * iOS Safari ignores `navigator.vibrate` entirely, so this is a progressive
 * nicety and never the only feedback for an action — every call site also has a
 * visible confirm.
 */
export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported, or blocked without a user gesture */
  }
}
