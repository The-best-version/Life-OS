import React, { useState, useEffect, useMemo, useCallback, useContext, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, Star, Minus, Plus, Sunrise, Sun, Sunset, Moon, MoonStar, Undo2, RotateCcw, Quote } from "lucide-react";
import { uid, STREAK_TARGET, hhmm, GRADES, daysUntil, minsIn, BLOCK_IDS, daysBetween } from "../state/life-state.mjs";
import { fixHour, prayerTimes, PRAYER_ROWS, clockAt } from "../utils/prayer-times.mjs";
import { T, GLASS, routineBlocks } from "../life-config.js";

/* --- tokens --------------------------------------------------------- *
 *  Both colour tokens now live in `src/life-config.js` — one file to open
 *  from VS Code to retint the whole app. Re-exported here, unchanged (and
 *  bound locally, since this file reads `T.*`/`GLASS.*` itself below), so
 *  every existing `import { T, GLASS } from "./life-shared.jsx"` across the
 *  project keeps working without touching a single call site. */
export { T, GLASS };

/* --- config-driven block safety -------------------------------------- *
 *  Wraps one block rendered off a life-config.js order array (`todayBlocks`,
 *  `routineBlocks`). A typo'd key already renders nothing — `registry[key]`
 *  is simply `undefined` — but a block that *throws* (a prop it expected
 *  renamed, a removed field) must not take the whole screen down with it.
 *  `getDerivedStateFromError` is the one thing a function component cannot
 *  do, so this stays a class. Silent on break: a half-broken screen that
 *  still shows the other nine blocks is the point of config-driven order in
 *  the first place. */
export class ConfigBlockBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { broken: false };
  }
  static getDerivedStateFromError() {
    return { broken: true };
  }
  componentDidCatch(error) {
    if (typeof console !== "undefined") {
      console.error("[life-config] كتلة معطوبة ولم تُعرض:", error);
    }
  }
  render() {
    if (this.state.broken) return null;
    return this.props.children ?? null;
  }
}

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
/* Fires a one-shot reward flag that auto-clears. Deliberately no
   requestAnimationFrame here — it never runs in a hidden tab, which both
   swallowed the reward and replayed it whenever the tab came back. */
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
/* `los-surface` is not decoration — it is what lets the stylesheet find
   every glass card at once and keep the ones nobody is looking at out of
   the frame budget. See the `content-visibility` block in `AppStyles`. */
export function Card({ children, className = "", style, as = "div", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`los-surface rounded-2xl border ${className}`}
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

/* `onDelete` is the one shortcut every desk in the app shares: Ctrl+Delete
   (and Ctrl+Backspace, for the laptops with no dedicated Delete key) removes
   whatever this modal is editing, through the same handler its own trash
   button already calls — so the same eight-second undo (`useUndo`) covers it
   too, with nothing new to wire. It never fires while the caret is in a text
   field: Ctrl+Delete there is the browser's own "delete the next word", and
   stealing it would turn an edit into a deletion. */
export function Modal({ open, onClose, title, children, footer, wide = false, onDelete }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") return onClose();
      if (!onDelete || !e.ctrlKey || (e.key !== "Delete" && e.key !== "Backspace")) return;
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      onDelete();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onDelete]);

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
      {/* Padding in proportion to the ring, not a fixed `px-6`: that was
          24px a side, which is most of a 54px ring and left the figure
          nowhere to sit. */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ paddingInline: size * 0.14 }}
      >
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
        {/* `label={null}` is a ring with no caption — for the small ones
            that already sit beside their own heading, where a second one
            inside the circle is unreadable at that size anyway. */}
        {label !== null && (
          <span
            className="mt-1 font-bold leading-tight"
            style={{
              color: full ? T.primaryLift : T.faint,
              fontSize: Math.max(8, Math.min(10.5, size * 0.07)),
            }}
          >
            {full ? fullLabel : label}
          </span>
        )}
      </div>
    </div>
  );
}


export const DOW_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

/* The one place a bad habit's fields are written — add form, migration and
   import all pass through here, so the shape cannot drift between them. */
export const arCount = (n, forms) => {
  const h = Math.abs(n) % 100;
  if (Math.abs(n) === 1) return forms[0];
  if (Math.abs(n) === 2) return forms[1];
  if (h >= 3 && h <= 10) return forms[2];
  return forms[3];
};
export const DAY_FORMS = ["يوم", "يومان", "أيام", "يومًا"];
export const dayWord = (n) => arCount(n, DAY_FORMS);
/* The whole phrase, numeral included — and the numeral is *dropped* for one
   and two, because Arabic's dual already carries it and «٢ يومان» reads as a
   translation rather than a sentence. */
export const daysPhrase = (n) =>
  Math.abs(n) === 1 ? "يوم واحد" : Math.abs(n) === 2 ? "يومان" : null;
export const MIN_FORMS = ["دقيقة", "دقيقتان", "دقائق", "دقيقة"];
export const minWord = (n) => arCount(n, MIN_FORMS);
export const STEP_FORMS = ["خطوة", "خطوتان", "خطوات", "خطوة"];
export const stepWord = (n) => arCount(n, STEP_FORMS);
export const MEET_FORMS = ["مواجهة", "مواجهتان", "مواجهات", "مواجهة"];
export const meetWord = (n) => arCount(n, MEET_FORMS);
export const TIMES_FORMS = ["مرة", "مرتان", "مرات", "مرة"];
export const timesWord = (n) => arCount(n, TIMES_FORMS);
export const FALL_FORMS = ["انتكاسة", "انتكاستان", "انتكاسات", "انتكاسة"];
export const fallWord = (n) => arCount(n, FALL_FORMS);
export const HOUR_FORMS = ["ساعة", "ساعتان", "ساعات", "ساعة"];
export const hourWord = (n) => arCount(n, HOUR_FORMS);
export const COURSE_FORMS = ["مقرّر", "مقرّران", "مقرّرات", "مقرّرًا"];
export const courseWord = (n) => arCount(n, COURSE_FORMS);
export const WEEK_FORMS = ["أسبوع", "أسبوعان", "أسابيع", "أسبوعًا"];
export const weekWord = (n) => arCount(n, WEEK_FORMS);
export const LECTURE_FORMS = ["محاضرة", "محاضرتان", "محاضرات", "محاضرة"];
export const TASK_FORMS = ["مهمة", "مهمتان", "مهام", "مهمة"];
export const taskWord = (n) => arCount(n, TASK_FORMS);
/* A focus round. The focus desk prints this beside a live number in five
   places — the day's meter, the week bars, the end-of-round sheet, the
   per-task totals and the log — and «3 جولة» is exactly the sentence
   `arCount` exists to prevent. */
export const ROUND_FORMS = ["جولة", "جولتان", "جولات", "جولة"];
export const roundWord = (n) => arCount(n, ROUND_FORMS);
/* The whole phrase, numeral included — and the numeral is *dropped* for one
   and two, the same rule `daysPhrase` and `tasksPhrase` follow: Arabic's
   dual already carries the number, so «2 جولتان» reads as a translation and
   not as a sentence. Two forms because the dual inflects: «جولتان» stands
   on its own, «جولتين» follows a preposition or «كل». */
export const roundsPhrase = (n) =>
  Math.abs(n) === 1 ? "جولة واحدة" : Math.abs(n) === 2 ? "جولتان" : `${n} ${roundWord(n)}`;
export const roundsAfter = (n) =>
  Math.abs(n) === 1 ? "جولة" : Math.abs(n) === 2 ? "جولتين" : `${n} ${roundWord(n)}`;
/* Same rule `daysPhrase` follows, and for the same reason: Arabic's dual
   already carries the number, so «٢ مهمتان» reads as a translation rather
   than a sentence. The verb agrees too — one waits, two wait. */
/* A banked day. The streak used to print «يوم متتالٍ» beside a live counter,
   which is the exact mistake `arCount` exists to prevent — and «متتالٍ» is
   now a second mistake, because one day under the target is stepped over
   and the run is no longer literally consecutive. */
export const COUNTED_FORMS = [
  "يوم مُحتسَب",
  "يومان مُحتسَبان",
  "أيام مُحتسَبة",
  "يومًا مُحتسَبًا",
];
export const countedWord = (n) => arCount(n, COUNTED_FORMS);

/* The tolerance, said out loud. Phrased so the count is the subject and not
   the object — «تجاوزنا يومين» needs the accusative and «يومان لم يكسراها»
   does not, and a dual in the wrong case is the kind of thing that makes a
   screen read as translated. */
export const forgivenPhrase = (n) =>
  n === 1
    ? "ويومٌ واحد تحت الهدف لم يكسرها"
    : n === 2
      ? "ويومان تحت الهدف لم يكسراها"
      : `و${n} ${arCount(n, DAY_FORMS)} تحت الهدف لم تكسرها`;

export const tasksPhrase = (n) =>
  Math.abs(n) === 1
    ? "مهمة واحدة تنتظر"
    : Math.abs(n) === 2
      ? "مهمتان تنتظران"
      : null;
export const lectureWord = (n) => arCount(n, LECTURE_FORMS);

export const nowMins = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

/* 14:30 → «٢:٣٠ م». A 24-hour clock is what gets typed; a 12-hour one is
   what gets read. */
export const prettyTime = (t) => {
  const v = hhmm(t);
  if (!v) return "";
  const [h, m] = v.split(":").map(Number);
  const suffix = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
export const WEEK_LABELS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

/* "2026-10-01" inside Arabic text renders as "01-10-2026" — the hyphens are
   neutral, so bidi reorders the three numbers right to left. Spelling the
   month out removes the ambiguity instead of fighting it with isolates. */
export const arDate = (ds) => {
  const [y, m, d] = String(ds || "").split("-").map(Number);
  if (!y || !m || !d) return ds || "";
  return `${d} ${AR_MONTHS[m - 1]} ${y}`;
};

/* The Saudi five-point scale with the four-point column beside it. The
   percentage floors are the standard ones, and they are what lets the mark
   sheet name the grade a course is currently earning instead of leaving
   him to look it up. Ordered high to low — `gradeFromPct` depends on that,
   and F sits at zero so the search can never miss. */
export const gradePoints = (g, scale) => (Number(scale) === 4 ? g.p4 : g.p5);
export const gradeFromPct = (pct) =>
  GRADES.find((g) => pct >= g.min) || GRADES[GRADES.length - 1];

export const coursesIn = (uni, termId) =>
  (uni.courses || []).filter((c) => c.term === termId);
export const termOf = (uni, id) => (uni.terms || []).find((t) => t.id === id) || null;
export const courseIn = (uni, id) => (uni.courses || []).find((c) => c.id === id) || null;
export const courseName = (c) =>
  !c ? "" : c.name || c.code || "مقرّر بلا اسم";

/* Today's sections, and the one he is either sitting in or walking to.
   Minutes are passed in rather than read off the clock so the caller owns
   the tick — this runs on every render of a screen that re-renders once a
   minute, and two clocks in one frame can disagree by a minute. */
export function daySections(courses, dow, mins) {
  const rows = [];
  for (const c of courses || [])
    for (const s of c.slots || [])
      if (s.day === dow) {
        const from = minsIn(s.from) ?? 0;
        const to = minsIn(s.to) ?? from;
        rows.push({
          course: c,
          slot: s,
          from,
          to,
          now: mins >= from && mins < to,
        });
      }
  rows.sort((a, b) => a.from - b.from);
  return rows;
}

/* The next section anywhere in the week, walking forward from now. The day
   offset rides along so the card can say «غدًا» instead of a weekday the
   user then has to count to. */
export function nextSection(courses, dow, mins) {
  for (let i = 0; i < 8; i++) {
    const rows = daySections(courses, (dow + i) % 7, i === 0 ? mins : -1).filter(
      (r) => i > 0 || r.to > mins,
    );
    if (rows.length) return { ...rows[0], inDays: i };
  }
  return null;
}

/* The timetable, the next-section card and the "now" line all move with
   the clock, and this screen is left open for hours. One minute is the
   right grain: a second would re-render the module sixty times a minute
   for a line that moves one pixel. */
export function useMinuteClock() {
  const [mins, setMins] = useState(() => nowMins());
  useEffect(() => {
    const check = () => setMins(nowMins());
    const t = setInterval(check, 60000);
    /* A background tab throttles intervals hard, so also re-read the clock
       the moment the tab is looked at again. */
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return mins;
}

/* A link the app is willing to put in an `href`, or nothing.
 *
 *  Only http and https pass. `javascript:` in an href runs as the page when
 *  it is clicked, and this field is reachable through an imported backup —
 *  a file the app already treats as untrusted. A bare «blackboard.ksu.edu.sa»
 *  is what people actually paste, so a missing scheme is filled in rather
 *  than refused. */
export const safeUrl = (v) => {
  const raw = String(v || "").trim();
  if (!raw) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
};

/* The relative day, in words. Arabic counts in threes, so the plural comes
   from `dayWord` rather than from a bare "أيام". */
export const whenWord = (on) => {
  const n = daysUntil(on);
  if (n === null) return "";
  if (n === 0) return "اليوم";
  if (n === 1) return "غدًا";
  if (n === 2) return "بعد غد";
  if (n === -1) return "أمس";
  if (n < 0) {
    const d = -n;
    return `متأخر ${d <= 10 ? `${d} ${dayWord(d)}` : `${d} يومًا`}`;
  }
  return `بعد ${n <= 10 ? `${n} ${dayWord(n)}` : `${n} يومًا`}`;
};

export function NumStep({ value, onChange, min = 0, max = 999, step = 1, unit, tint = T.sky }) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const btn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90 disabled:opacity-30";
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label="أنقص"
        className={btn}
        style={{ borderColor: T.border, color: T.muted }}
      >
        <Minus size={13} strokeWidth={3} />
      </button>
      <p className="min-w-0 flex-1 text-center leading-none">
        <span
          dir="ltr"
          className="text-[19px] font-extrabold tabular-nums"
          style={{ color: tint }}
        >
          {value}
        </span>
        <span className="mr-1.5 text-[11px] font-bold" style={{ color: T.muted }}>
          {unit}
        </span>
      </p>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label="زد"
        className={btn}
        style={{ borderColor: `${tint}4D`, color: tint }}
      >
        <Plus size={13} strokeWidth={3} />
      </button>
    </div>
  );
}

export function DateField({ value, onChange, id, min, ...rest }) {
  return (
    <Field
      id={id}
      type="date"
      dir="ltr"
      value={value || ""}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      style={{ colorScheme: "dark", textAlign: "left" }}
      {...rest}
    />
  );
}

export function TimeField({ value, onChange, id, ...rest }) {
  return (
    <Field
      id={id}
      type="time"
      dir="ltr"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={{ colorScheme: "dark", textAlign: "left" }}
      {...rest}
    />
  );
}

/* --- routine groups -------------------------------------------------- */
/* The six blocks, drawn. `BLOCK_IDS` in life-state.mjs is the canonical
   order — the one the day runs in and the one `remainingIn` ranks «فاتك»
   against, untouched by anything below. The label, the icon and the tint
   for each id now live in `routineBlocks` (src/life-config.js) — the same
   six rows that let the developer move or hide that block's card on the
   routine screen — so this stays unconditional (it reads every block
   regardless of `visible`): a block hidden *on that one screen* must not
   also lose its name on «اليوم»'s header or its roll-call row elsewhere.
   A block missing from `routineBlocks` entirely falls back to its bare id
   and a generic icon/tint rather than crashing — life-config.js already
   warns about that case in the console. */
const ROUTINE_BLOCK_BY_ID = new Map(routineBlocks.map((b) => [b.key, b]));

export const GROUPS = BLOCK_IDS.map((id) => {
  const b = ROUTINE_BLOCK_BY_ID.get(id);
  return {
    id,
    label: b?.label ?? id,
    icon: b?.icon ?? Sunrise,
    tint: b?.tint ?? "#9D5CFF",
  };
});

export const GROUP_BY_ID = new Map(GROUPS.map((g) => [g.id, g]));

/* A habit whose block this build no longer has still has to render. The
   night block is the honest place for it: last in the day, so nothing is
   announced as missed on the strength of a damaged payload. */
export const groupOf = (id) => GROUP_BY_ID.get(id) || GROUPS[GROUPS.length - 1];

export const IMAGE_BUDGET = 900 * 1024; // characters of data URL

export const IMAGE_STEPS = [
  [1400, 0.78],
  [1100, 0.72],
  [900, 0.66],
  [700, 0.6],
  [520, 0.52],
];

/* A book cover is a portrait thumbnail, so its steps bound the height too
   and start far smaller. It is the same walk and the same refusal — the
   shelf used to have a resizer of its own that scaled once at a fixed
   280×400 and had no `onerror` on the reader at all, so a file the browser
   could not read left the promise pending for ever and the upload button
   simply did nothing. One implementation, two step tables. */
export const COVER_STEPS = [
  [280, 0.78, 400],
  [220, 0.7, 320],
  [160, 0.62, 230],
];

export function shrinkImage(file, steps = IMAGE_STEPS) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        let out = null;
        for (const [maxW, quality, maxH] of steps) {
          const scale = Math.min(
            1,
            maxW / img.width,
            maxH ? maxH / img.height : 1,
          );
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            out = canvas.toDataURL("image/jpeg", quality);
          } catch (e) {
            return reject(e);
          }
          if (out.length <= IMAGE_BUDGET) return resolve(out);
        }
        /* Even the smallest step overshot — refuse rather than poison the
           quota with something the next write cannot save alongside. */
        reject(new Error("too-large"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}


export const CUP_FORMS = ["كوب", "كوبان", "أكواب", "كوبًا"];

export const cupWord = (n) => arCount(n, CUP_FORMS);

/* The six rows, in the order of the day. «الشروق» is not a prayer and is
   marked so: it is the end of Fajr's window, which is why it is shown. */
/* The ids, the Arabic and the tints live in prayer-times.mjs, where the
   server and the Telegram bot can read them too. Only the icons are added
   here, and they are fastened onto those same row objects rather than onto
   copies — `nextPrayer` spreads a row and every card reads `.icon` off
   whatever these lookups hand back, so a copy would leave half the app
   holding rows with no icon on them. */
const PRAYER_ICONS = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: Sunset,
  maghrib: Moon,
  isha: MoonStar,
};
export const PRAYERS = PRAYER_ROWS.map((p) =>
  Object.assign(p, { icon: PRAYER_ICONS[p.id] }),
);

/* Saudi first, because that is where this is lived. Coordinates are the city
   centre and the offset is standard time — the Kingdom has no DST, so a
   stored number is safe here in a way it would not be in Europe. */

/* Which prayer is next, and how long until it. Isha is the last row of the
   day, so after it the answer is tomorrow's Fajr — computed from tomorrow's
   own date rather than reused, because a date boundary moves it by minutes.
   «الشروق» is skipped: it is a window's end, not something you wait for. */
export function nextPrayer(place, now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const today = prayerTimes(place, now);
  for (const p of PRAYERS) {
    if (p.mark) continue;
    const t = today[p.id];
    if (t === null || !Number.isFinite(t)) continue;
    const at = fixHour(t) * 60;
    if (at > mins) return { ...p, at, left: Math.round(at - mins) };
  }
  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const t = prayerTimes(place, tomorrow).fajr;
  if (t === null || !Number.isFinite(t)) return null;
  const at = fixHour(t) * 60;
  return { ...PRAYERS[0], at, left: Math.round(at + 1440 - mins), tomorrow: true };
}

/* «قبل ٣ أيام», but «اليوم» at zero — nobody says «قبل ٠ يومًا». */
export function Since({ day }) {
  const n = daysBetween(day);
  if (n === 0) return "اليوم";
  return (
    <>
      قبل{" "}
      <span dir="ltr" className="tabular-nums">
        {n}
      </span>{" "}
      {dayWord(n)}
    </>
  );
}

/* Advances on every open, and again on tap. Keying it to the day of the
   month was the literal spec but meant the card never visibly moved within
   a day — the cue is only motivating if it is actually new. The cursor
   persists so consecutive opens walk the list instead of repeating. */
export const QUOTE_KEY = "life-os-2027:quote";

/* The library has its own cue, about reading rather than about the day.
   Same walk-on-open behaviour as the daily one, its own cursor. */
export const READ_KEY = "life-os-2027:read-quote";

export function useDailyQuote(list, key = QUOTE_KEY) {
  const total = list.length;
  const [i, setI] = useState(() => {
    let prev = -1;
    try {
      prev = parseInt(window.localStorage.getItem(key), 10);
    } catch {
      /* storage blocked — fall back to the day of the month */
    }
    const base = total || 1;
    const next = Number.isFinite(prev)
      ? (prev + 1) % base
      : new Date().getDate() % base;
    try {
      window.localStorage.setItem(key, String(next));
    } catch {
      /* per-viewer convenience only */
    }
    return next;
  });

  const shuffle = useCallback(() => {
    setI((cur) => {
      const next = total ? (cur + 1) % total : 0;
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        /* per-viewer convenience only */
      }
      return next;
    });
  }, [total, key]);

  /* The cursor can outrun the list once the user deletes a quote, so it is
     wrapped at read time rather than trusted. */
  const quote = total ? list[i % total] : null;
  return [quote, shuffle];
}

/* ==================================================================== *
 * بطاقة عبارات الكتب — ReadingCue
 *
 * قابلة للوضع في أي صفحة بسطر واحد:
 *     <ReadingCue list={state.reads} />
 *
 * كانت محصورة داخل شاشة المكتبة، وهي الآن مكوّن مستقل لأن مكانها
 * الطبيعي هو الشاشة التي يفتح عليها اليوم — لا الشاشة التي يزورها
 * مرّة في الأسبوع. لتعيدها إلى المكتبة أو تضعها في الروتين، استورد
 * المكوّن واكتب السطر أعلاه؛ لا حالة تملكها ولا شيء آخر يتغيّر.
 *
 * المؤشّر (cursor) محفوظ في READ_KEY، وهو مستقلّ عن مؤشّر عبارات
 * اليوم — ولهذا يأخذ `useDailyQuote` مفتاحًا: حتى لا تتزاحم قائمتان
 * على عدّاد واحد.
 *
 * ملاحظة بصرية: الهالتان خارج حدود البطاقة، ولهذا تحمل `los-cue`
 * المستثناة من `content-visibility` في ورقة الأنماط.
 * ==================================================================== */
export function ReadingCue({ list, className = "" }) {
  const [read, shuffle] = useDailyQuote(list || [], READ_KEY);

  return (
    <button
      type="button"
      onClick={shuffle}
      title="اضغط لعبارة أخرى"
      aria-label="عبارة من الكتب — اضغط لعبارة أخرى"
      className={`los-cue los-raise group relative w-full overflow-hidden rounded-2xl border p-5 text-center transition-all duration-300 ${className}`}
      style={{
        borderColor: `${T.accent}33`,
        backgroundColor: `${T.accent}0D`,
      }}
    >
      {/* هالتان لا واحدة: الدفء من جهة والبنفسجي من الأخرى، فتبدو
          البطاقة مُضاءة من داخلها بدلًا من أن تكون مساحة ملوّنة. */}
      <div
        className="pointer-events-none absolute -top-20 right-1/4 h-44 w-44 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: T.accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-44 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-30"
        style={{ background: T.cta }}
      />

      <Quote
        size={15}
        className="relative mx-auto mb-2 opacity-40 transition-opacity duration-300 group-hover:opacity-70"
        style={{ color: T.accent }}
      />

      {read ? (
        <>
          <p
            key={read.text}
            className="los-in relative mx-auto max-w-xl text-[13.5px] font-bold leading-loose"
            style={{ color: T.fg }}
          >
            {read.text}
          </p>
          <p className="relative mt-2 text-[10.5px]" style={{ color: T.accent }}>
            — {read.author}
          </p>
        </>
      ) : (
        <p className="relative text-[12px]" style={{ color: T.muted }}>
          لا عبارات في هذه القائمة.
        </p>
      )}

      <span
        className="relative mt-2.5 inline-flex items-center gap-1.5 text-[10px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ color: T.faint }}
      >
        <RotateCcw size={10} /> اضغط لعبارة أخرى
      </span>
    </button>
  );
}


/* --- the eight seconds after a delete --------------------------------- *
 *  Every destructive button in this app was immediate and final, and three
 *  of them sit a few pixels from a button that is not. A habit deleted by a
 *  slip took its whole run with it, and the only route back was the import
 *  box and whatever the disk happened to hold.
 *
 *  So a delete keeps the list it replaced for eight seconds. Not a diff and
 *  not a reverse-patch: the whole array as it stood, put back wholesale,
 *  which is the only way the row returns *in its own place* rather than at
 *  the end. Eight seconds because that is long enough to read a toast and
 *  reach it, and short enough that the snapshot is not quietly holding a
 *  deleted book alive for the rest of the session.
 *
 *  A context rather than a prop, because the delete buttons are scattered
 *  across sixteen modules and threading a callback to all of them is how a
 *  new one quietly ships without an undo.
 * ---------------------------------------------------------------------- */
export const UNDO_MS = 8000;

export const UndoBus = React.createContext(null);

/* `arm(label, before)` — `before` is the slice of state to restore, e.g.
   `{ habits: s.habits }`. Spread back over whatever the state is by then, so
   an unrelated change made in those eight seconds is not undone with it.

   It may also be a function `(s) => slice`, for the one case a plain slice
   cannot express: a row that lives *inside* an object rather than in a
   top-level array. `{ bot: wholeBotObject }` would revert every other field
   of `state.bot` along with the reminder being put back; `(s) => ({ bot:
   { ...s.bot, customs: kept } })` puts back only what was deleted. */
export function useUndo() {
  return useContext(UndoBus) || noUndo;
}

export const noUndo = () => {};

export function UndoToast({ undo, onUndo, onDismiss }) {
  /* The countdown is the toast's own, restarted whenever a new delete arms
     it — keyed on the stamp so a second delete gets its own eight seconds
     rather than inheriting the tail of the first. */
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(onDismiss, UNDO_MS);
    return () => clearTimeout(t);
  }, [undo, onDismiss]);

  if (!undo) return null;
  return (
    <div
      /* Above `BottomTabs` on a phone, and clear of the stray-copy and
         disk-stopped bars that live at the same edge. Centred with
         `inset-x`/`mx-auto`, never a translate: `.los-in` owns `transform`
         on this element and a Tailwind translate utility would be discarded. */
      className="los-in fixed inset-x-3 z-[88] flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-4 py-2.5 text-center shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[min(420px,92vw)]"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
        backgroundColor: T.cardSolid,
        backgroundImage: `linear-gradient(135deg, ${T.bgLift}, ${T.bgDeep})`,
        borderColor: `${T.accent}73`,
        boxShadow: `0 0 50px -14px ${T.accent}`,
      }}
      role="status"
    >
      <p className="text-[12px] font-bold" style={{ color: T.fg }}>
        {undo.label}
      </p>
      <Btn size="sm" className="shrink-0" onClick={onUndo}>
        <Undo2 size={13} /> تراجع
      </Btn>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="إخفاء"
        className="shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
        style={{ color: T.faint }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
