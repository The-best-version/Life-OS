import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { X, Check, Star } from "lucide-react";
import { uid, STREAK_TARGET } from "./life-state.mjs";

/* --- tokens --------------------------------------------------------- *
 *  "Vibrant Deep Slate" — an energetic canvas, not a void. Emerald is
 *  reserved for success (a done habit, a banked streak); Electric Coral
 *  drives every primary call to action; amber marks achievement.
 * -------------------------------------------------------------------- */
export const T = {
  /* Warm charcoal, not blue slate. A blue-grey ground plus muted accents is
     exactly the palette of a trading terminal — warmth is what makes this
     read as a place to live rather than a dashboard to monitor. */
  bg: "#1C141A",
  bgDeep: "#150E13",
  bgLift: "#241A20",
  /* Any surface that sits on the sky reads this, never a fixed white
     alpha — at noon a 0.07 white fill is a pale blue smear. */
  card: "var(--los-veil, rgba(255,255,255,0.07))",
  cardSolid: "#241A20",
  border: "rgba(255,255,255,0.18)",
  borderStrong: "rgba(255,255,255,0.24)",
  fg: "#FDF8F6",
  muted: "rgba(253,248,246,0.58)",
  faint: "rgba(253,248,246,0.34)",
  primary: "#10B981",
  primaryLift: "#34D399",
  cta: "#FF5722",
  ctaLift: "#FF8A50",
  accent: "#FFB020",
  violet: "#9D5CFF",
  sky: "#00C2FF",
  rose: "#FF4D8D",
  indigo: "#5B8CFF",
  ember: "#FF7A45",
  danger: "#FF3B5C",
};

/* Frosted glass, not a flat tint: a diagonal sheen falling to transparent,
   a brighter rim, and an inset top highlight standing in for the lit edge
   of a real pane of glass. */
export const GLASS = {
  /* Set by the sky phase on the root: cards darken as the sky brightens,
     or white type loses its contrast against a noon horizon. */
  backgroundColor: "var(--los-veil, rgba(255,255,255,0.055))",
  /* The sheen is warm, not neutral white: a trace of coral at the lit
     corner and violet at the shaded one, so a card picks up the ground's
     colour instead of sitting on it as a grey pane. */
  backgroundImage:
    "linear-gradient(135deg, rgba(255,150,110,0.11) 0%, rgba(255,255,255,0.045) 42%, rgba(157,92,255,0.05) 100%)",
  borderColor: "rgba(255,225,210,0.18)",
  backdropFilter: "blur(22px) saturate(180%)",
  boxShadow:
    "inset 0 1px 0 0 rgba(255,235,225,0.14), 0 22px 52px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,87,34,0.04)",
};

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}
export function useBurst(ms = 640) {
  const [on, setOn] = useState(false);
  const timer = useRef(null);
  const fire = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [on, fire];
}
export function Card({ children, className = "", style, as = "div", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl border ${className}`}
      style={{ ...GLASS, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Btn({
  children,
  variant = "default",
  size = "md",
  className = "",
  style,
  /* Same escape hatch `Card` and `Field` already carry: a control that
     navigates has to be an anchor, or it loses middle-click, "open in new
     tab" and the status bar — and a button with an `href` simply does
     nothing. The styling is identical either way. */
  as = "button",
  ...rest
}) {
  const Tag = as;
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-[15px] gap-2",
    icon: "p-2",
  };
  const variants = {
    default: {
      background: `linear-gradient(135deg, ${T.cta}, ${T.ctaLift})`,
      color: "#1A0600",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.cta}CC`,
    },
    success: {
      background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLift})`,
      color: "#04140E",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.primary}CC`,
    },
    gold: {
      background: `linear-gradient(135deg, ${T.accent}, #FDE68A)`,
      color: "#1C1203",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.accent}AA`,
    },
    outline: {
      background: "transparent",
      color: T.muted,
      borderColor: T.border,
    },
    ghost: {
      background: "transparent",
      color: T.muted,
      borderColor: "transparent",
    },
    danger: {
      background: `${T.danger}1F`,
      color: T.danger,
      borderColor: `${T.danger}4D`,
    },
  };
  return (
    <Tag
      className={`los-btn inline-flex items-center justify-center rounded-xl border font-bold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Field({ className = "", style, as = "input", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/30 ${className}`}
      style={{ borderColor: T.border, ...style }}
      {...rest}
    />
  );
}

export function Badge({ children, tint = T.accent, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${className}`}
      style={{
        borderColor: `${tint}44`,
        color: tint,
        background: `${tint}14`,
      }}
    >
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  /* --- why this is a portal ------------------------------------------- *
   *  A modal is `position: fixed`, which normally resolves against the
   *  viewport — except that a transformed ancestor becomes the containing
   *  block for every fixed descendant, and `.los-in`, the wrapper that
   *  slides each screen in, animates `transform`. Every modal in this app
   *  is rendered from inside a module, so every one of them was being laid
   *  out against the module's content box instead of the window: on a
   *  screen with little content the tallest form (the habit-breaker's) was
   *  positioned so its header sat above the top edge, unreachable, because
   *  there is nothing above a fixed element to scroll.
   *
   *  Capping the height or changing the easing would both be treatments of
   *  the symptom. Rendering outside the transformed subtree is the fix:
   *  `document.body` has no transformed ancestor, so `inset-0` means the
   *  window again — for this modal and the twenty others that share it.
   *  React still routes events through the tree the modal is written in,
   *  so every `onClose` and every handler keeps working unchanged.
   * -------------------------------------------------------------------- */
  const tree = (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        /* A desk needs room for a table; a form does not. One prop, so
           every existing call site keeps the narrow sheet it was built for. */
        className={`los-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border p-6 sm:rounded-3xl ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
        style={{
          background: `linear-gradient(160deg, ${T.bgLift}, ${T.bgDeep})`,
          borderColor: `${T.cta}40`,
          boxShadow: `0 40px 90px -30px ${T.cta}55`,
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold" style={{ color: T.accent }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg border p-1.5 text-white/45 transition-colors hover:text-white"
            style={{ borderColor: T.border }}
          >
            <X size={15} />
          </button>
        </div>
        {children}
        {footer ? <div className="mt-6 flex gap-3">{footer}</div> : null}
      </div>
    </div>
  );

  /* `document.body` is read at render, so the guard is for the server pass
     and for a test host that mounts without one. */
  return typeof document === "undefined" ? tree : createPortal(tree, document.body);
}

export function StarRating({ value, onChange, size = 15 }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} من ٥`}
          className="rounded p-0.5 transition-transform hover:scale-125 active:scale-95"
        >
          <Star
            size={size}
            strokeWidth={1.8}
            style={{
              color: n <= value ? T.accent : "rgba(255,255,255,0.2)",
              fill: n <= value ? T.accent : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}

export function Checkbox({ checked, onToggle, label, tint = T.primary, size = "md" }) {
  const box = size === "sm" ? 18 : 22;
  const [pop, firePop] = useBurst(640);

  const handle = () => {
    if (!checked) firePop();
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={checked}
      className="group/c flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1.5 text-right transition-colors hover:bg-white/[0.06]"
    >
      <span
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: box, height: box }}
      >
        {pop && (
          <span
            aria-hidden="true"
            className="los-ripple pointer-events-none absolute inset-0 rounded-md border-2"
            style={{ borderColor: tint }}
          />
        )}
        <span
          className={`flex h-full w-full items-center justify-center rounded-md border transition-all duration-300${
            pop ? " los-pop" : ""
          }`}
          style={{
            borderColor: checked ? tint : T.borderStrong,
            background: checked ? tint : "transparent",
            boxShadow: checked ? `0 0 16px ${tint}80` : "none",
            transform: checked && !pop ? "scale(1.06)" : "scale(1)",
          }}
        >
          <Check
            size={size === "sm" ? 11 : 14}
            strokeWidth={4}
            className="transition-all duration-200"
            style={{
              color: T.bgDeep,
              opacity: checked ? 1 : 0,
              transform: checked ? "scale(1)" : "scale(0.4)",
            }}
          />
        </span>
      </span>
      <span
        className="min-w-0 flex-1 truncate text-[13.5px] transition-all duration-300"
        style={{
          color: checked ? tint : "rgba(248,250,252,0.86)",
          /* Longhands, not the `textDecoration` shorthand beside its own
             colour. React applies the two in object order and warns that
             a re-render can have the shorthand wipe the longhand — the
             same trap as `background` erasing `backgroundImage`, which
             already cost this project the sheen on its cards once. */
          textDecorationLine: checked ? "line-through" : "none",
          textDecorationColor: `${tint}80`,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* --- discipline ring -------------------------------------------------- *
 *  The gradient ramps cool→hot as the day fills and keeps rotating, so a
 *  glance at the ring reads as momentum rather than a static gauge.
 * ---------------------------------------------------------------------- */
export function ProgressRing({
  value,
  size = 168,
  stroke = 12,
  label = "مؤشر الانضباط",
  fullLabel = "يوم مكتمل 🔥",
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const full = pct >= 100;
  const hit = pct >= STREAK_TARGET;
  const still = usePrefersReducedMotion();
  const gid = useMemo(() => `los-ring-${uid()}`, []);

  const ramp = full
    ? [T.primaryLift, T.primary, T.sky]
    : hit
    ? [T.primary, T.primaryLift, T.accent]
    : pct >= 50
    ? [T.accent, T.ember, T.cta]
    : [T.cta, T.ctaLift, T.accent];

  const lead = full ? T.primaryLift : hit ? T.primary : pct >= 50 ? T.accent : T.cta;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`pointer-events-none absolute inset-3 rounded-full blur-2xl transition-all duration-700${
          full && !still ? " los-halo" : ""
        }`}
        style={{
          background: `radial-gradient(circle, ${ramp[0]} 0%, ${ramp[2]} 70%, transparent 100%)`,
          opacity: full ? 0.45 : hit ? 0.28 : 0.14,
        }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ramp[0]} />
            <stop offset="50%" stopColor={ramp[1]} />
            <stop offset="100%" stopColor={ramp[2]} />
            {!still && (
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="7s"
                repeatCount="indefinite"
              />
            )}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)",
            filter: `drop-shadow(0 0 ${full ? 18 : 12}px ${lead}AA)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {/* The throb lives on a wrapper: a transform on the same element as
            background-clip:text collapses the clip in Chrome and the number
            paints as a solid block. */}
        <span className={full && !still ? "los-throb" : undefined}>
          <span
            className="block font-extrabold leading-none tabular-nums"
            style={{
              fontSize: size * 0.27,
              backgroundImage: `linear-gradient(135deg, ${ramp[0]}, ${ramp[1]}, ${ramp[2]})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: lead,
            }}
          >
            {pct}
            <span className="align-super text-[0.45em] font-bold">%</span>
          </span>
        </span>
        <span
          className="mt-1 text-[10.5px] font-bold leading-tight"
          style={{ color: full ? T.primaryLift : T.faint }}
        >
          {full ? fullLabel : label}
        </span>
      </div>
    </div>
  );
}
