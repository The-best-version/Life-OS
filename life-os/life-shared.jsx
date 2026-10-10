import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { X, Check, Star, Minus, Plus } from "lucide-react";
import { uid, STREAK_TARGET, dayKey, keyToDate, hhmm, GRADES } from "./life-state.mjs";

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
  /* 12px, not 22px. The blur is recomputed on every frame a card moves over
     the fixed sky — which is every frame of every scroll — and the cost
     scales with the radius. Behind a veil this dark the two are hard to tell
     apart, so the cheaper one is the honest default. */
  backdropFilter: "blur(12px) saturate(150%)",
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

/* Day keys are calendar squares, not instants, and every helper here parses
   them at LOCAL midnight. `new Date("2027-01-05")` is read as UTC and lands
   on the 4th for anyone east of Greenwich — which is all of the Gulf, every
   day of the year. */
export const daysUntil = (ds, fromKey = dayKey()) => {
  const a = keyToDate(fromKey);
  const b = keyToDate(ds);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
};

/* "HH:MM" or nothing at all. A half-typed time is worse than no time: it
   sorts wrongly and then renders as a lie, so anything that is not a real
   clock reading is dropped on the way into state. */
export const minsOf = (t) => {
  const v = hhmm(t);
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};

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
        const from = minsOf(s.from) ?? 0;
        const to = minsOf(s.to) ?? from;
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