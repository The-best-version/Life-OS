import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Sunrise,
  Sun,
  Moon,
  Bed,
  Flame,
  Check,
  Target,
  BookOpen,
  HeartPulse,
  Briefcase,
  Wallet,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Star,
  RotateCcw,
  Quote,
  CalendarDays,
  Library,
  Zap,
  X,
  MoonStar,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  2027 — وقت حصاد الثمار | Life OS
 *  Behavioral model: cue → action → variable reward → investment
 *  Stack: React + Tailwind CSS + lucide-react
 *  Install: npm i lucide-react
 * ------------------------------------------------------------------ */

const GOLD = "#D4AF37";
const EMERALD = "#10B981";
const EMBER = "#F97316";

/* Discipline weighting: the non-negotiables carry half the day on their own. */
const TOP3_WEIGHT = 50;
const ROUTINE_WEIGHT = 50;
const STREAK_TARGET = 80;

/* --- Routine timeline (compact, 4 stations) -------------------------- */
const TIMELINE = [
  {
    id: "morning",
    label: "الصباح",
    time: "٤:٣٠ — ١١:٠٠",
    icon: Sunrise,
    tint: "#D4AF37",
    items: [
      { id: "m1", label: "شرب ماء" },
      { id: "m2", label: "صلاة وأذكار" },
      { id: "m3", label: "نادي" },
      { id: "m4", label: "فطور" },
      { id: "m5", label: "تطوير مهني" },
    ],
  },
  {
    id: "afternoon",
    label: "بعد الظهر",
    time: "١٢:٠٠ — ٦:٠٠",
    icon: Sun,
    tint: "#F59E0B",
    items: [
      { id: "a1", label: "صلاة الظهر" },
      { id: "a2", label: "قراءة" },
      { id: "a3", label: "صلاة العصر" },
      { id: "a4", label: "كتب ذاتية" },
    ],
  },
  {
    id: "evening",
    label: "المساء",
    time: "٦:٠٠ — ١٠:٠٠",
    icon: Moon,
    tint: "#A855F7",
    items: [
      { id: "e1", label: "صلاة المغرب وأذكار" },
      { id: "e2", label: "صلاة العشاء" },
      { id: "e3", label: "تقييم يومي" },
    ],
  },
  {
    id: "presleep",
    label: "قبل النوم",
    time: "١٠:٠٠ — ١١:٣٠",
    icon: Bed,
    tint: "#10B981",
    items: [
      { id: "s1", label: "مود النوم" },
      { id: "s2", label: "الابتعاد عن الشاشات" },
      { id: "s3", label: "عناية" },
      { id: "s4", label: "تدوين" },
      { id: "s5", label: "أذكار النوم" },
    ],
  },
];

const ALL_ROUTINE_IDS = TIMELINE.flatMap((b) => b.items.map((i) => i.id));
const TOTAL_ROUTINE = ALL_ROUTINE_IDS.length; // 17

/* --- 2027 goal categories ------------------------------------------- */
const CATEGORIES = [
  { id: "deen", label: "الديني", icon: BookOpen, tint: "#D4AF37" },
  { id: "health", label: "صحة", icon: HeartPulse, tint: "#EF4444" },
  { id: "career", label: "مهنة", icon: Briefcase, tint: "#3B82F6" },
  { id: "money", label: "مال", icon: Wallet, tint: "#22D3EE" },
  { id: "social", label: "علاقات", icon: Users, tint: "#A855F7" },
  { id: "self", label: "ذاتية", icon: Sparkles, tint: "#F59E0B" },
];

const QUARTERS = [
  { id: "q1", label: "الربع الأول", months: "يناير — مارس" },
  { id: "q2", label: "الربع الثاني", months: "أبريل — يونيو" },
  { id: "q3", label: "الربع الثالث", months: "يوليو — سبتمبر" },
  { id: "q4", label: "الربع الرابع", months: "أكتوبر — ديسمبر" },
];

/* --- Daily cue: one quote per day ------------------------------------ */
const QUOTES = [
  {
    text: "إضاعة الوقت أشدّ من الموت؛ لأن إضاعة الوقت تقطعك عن الله والدار الآخرة.",
    author: "ابن القيّم",
  },
  { text: "حاسبوا أنفسكم قبل أن تُحاسَبوا.", author: "عمر بن الخطاب" },
  {
    text: "ابن آدم، إنما أنت أيام؛ فإذا ذهب يوم ذهب بعضك.",
    author: "الحسن البصري",
  },
  {
    text: "ومن لم يذق مرّ التعلّم ساعة، تجرّع ذلّ الجهل طول حياته.",
    author: "الإمام الشافعي",
  },
  { text: "ما يصنع أعدائي بي؟ أنا جنّتي وبستاني في صدري.", author: "ابن تيمية" },
  {
    text: "رأيت الاشتغال بالعلم أفضل الأعمال، وأنفع ما يُنفق فيه العمر.",
    author: "ابن الجوزي",
  },
  { text: "ليست حياتنا قصيرة، بل نحن نُضيّع كثيرًا منها.", author: "سينيكا" },
  {
    text: "أنت تملك سلطانًا على عقلك، لا على الأحداث. أدرك هذا تجد القوة.",
    author: "ماركوس أوريليوس",
  },
  {
    text: "وقتك محدود، فلا تُضيّعه عيشًا في حياة شخص آخر.",
    author: "ستيف جوبز",
  },
  {
    text: "حين يكون الأمر مهمًّا بما يكفي، تفعله حتى لو لم تكن الاحتمالات في صالحك.",
    author: "إيلون ماسك",
  },
  {
    text: "أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك.",
    author: "جيمس كلير",
  },
  { text: "الناجحون جدًّا يقولون «لا» لكل شيء تقريبًا.", author: "وارن بافيت" },
  { text: "ما يُقاس، يتحسّن.", author: "بيتر دراكر" },
  { text: "اقرأ ما تحبّ حتى تُحبّ القراءة.", author: "نافال رافيكانت" },
];

/* --- Persistence ----------------------------------------------------- */
const STORAGE_KEY = "harvest-os-2027:v2";
const HISTORY_CAP = 400;

const dayKey = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const blankRoutine = () =>
  ALL_ROUTINE_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {});

const DEFAULT_TOP3 = [
  { id: "n1", text: "مذاكرة STEP", minutes: 90, done: false },
  { id: "n2", text: "جلسة إنجليزي", minutes: 45, done: false },
  { id: "n3", text: "الجامعة", minutes: 0, done: false },
];

const SEED_GOALS = {
  q1: {
    deen: [{ id: uid(), text: "ختم القرآن مرة واحدة", done: false }],
    health: [{ id: uid(), text: "الوصول إلى ٧٥ كجم", done: false }],
    career: [{ id: uid(), text: "اجتياز اختبار STEP بدرجة ٩٠ فأعلى", done: false }],
    money: [{ id: uid(), text: "صندوق طوارئ ٣ أشهر", done: false }],
    social: [{ id: uid(), text: "زيارة عائلية أسبوعية", done: false }],
    self: [{ id: uid(), text: "قراءة ٦ كتب", done: false }],
  },
  q2: { deen: [], health: [], career: [], money: [], social: [], self: [] },
  q3: { deen: [], health: [], career: [], money: [], social: [], self: [] },
  q4: { deen: [], health: [], career: [], money: [], social: [], self: [] },
};

const SEED_BOOKS = [
  {
    id: uid(),
    title: "العادات الذرية",
    author: "جيمس كلير",
    status: "finished",
    rating: 5,
    takeaway: "لا ترتقي إلى أهدافك، بل تهبط إلى مستوى أنظمتك. ابنِ النظام أولًا.",
  },
  {
    id: uid(),
    title: "الفوائد",
    author: "ابن القيّم",
    status: "reading",
    rating: 5,
    takeaway: "القلب يصدأ كما يصدأ الحديد، وجلاؤه الذكر وتلاوة القرآن.",
  },
  {
    id: uid(),
    title: "العمل العميق",
    author: "كال نيوبورت",
    status: "finished",
    rating: 4,
    takeaway: "التركيز العميق مهارة نادرة وثمينة. ساعتان بلا تشتت تهزم يومًا مشتتًا.",
  },
];

const emptyGoals = () =>
  QUARTERS.reduce(
    (acc, q) => ({
      ...acc,
      [q.id]: CATEGORIES.reduce((c, cat) => ({ ...c, [cat.id]: [] }), {}),
    }),
    {}
  );

const freshState = (carry = {}) => ({
  date: dayKey(),
  top3: (carry.top3 || DEFAULT_TOP3).map((t) => ({ ...t, done: false })),
  routine: blankRoutine(),
  goals: carry.goals || SEED_GOALS,
  books: carry.books || SEED_BOOKS,
  history: carry.history || [],
  streakBase: carry.streakBase || 0,
  bestStreak: carry.bestStreak || 0,
  dayBanked: false,
  dayClosed: false,
});

function loadState() {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    const carry = {
      top3: saved.top3,
      goals: { ...emptyGoals(), ...(saved.goals || {}) },
      books: saved.books,
      history: saved.history,
      bestStreak: saved.bestStreak,
    };
    if (saved.date === dayKey()) {
      return {
        ...freshState(carry),
        ...saved,
        routine: { ...blankRoutine(), ...(saved.routine || {}) },
        goals: carry.goals,
      };
    }
    const continued = saved.date === dayKey(-1) && saved.dayBanked;
    return freshState({
      ...carry,
      streakBase: continued ? (saved.streakBase || 0) + 1 : 0,
    });
  } catch {
    return freshState();
  }
}

/* --- Heatmap data ----------------------------------------------------- */
/* Deterministic mock so the grid reads as a real year at first glance.
   Any day you actually save overwrites its mock cell. */
function mockLevel(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const r = (h % 100) / 100;
  if (r < 0.14) return 0;
  if (r < 0.3) return 1;
  if (r < 0.52) return 2;
  if (r < 0.78) return 3;
  return 4;
}
const pctToLevel = (pct) =>
  pct >= 90 ? 4 : pct >= 70 ? 3 : pct >= 45 ? 2 : pct > 0 ? 1 : 0;

const HEAT_COLORS = [
  "rgba(255,255,255,0.045)",
  "rgba(16,185,129,0.28)",
  "rgba(16,185,129,0.5)",
  "rgba(16,185,129,0.75)",
  "#10B981",
];

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function buildYearGrid(year, history) {
  const real = new Map((history || []).map((h) => [h.date, h.pct]));
  const first = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);
  /* Arabic week starts Saturday → row 0 = Saturday */
  const rowOf = (d) => (d.getDay() + 1) % 7;

  const weeks = [];
  let week = new Array(7).fill(null);
  let cursor = new Date(first);

  while (cursor <= last) {
    const row = rowOf(cursor);
    const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const realPct = real.get(ds);
    week[row] = {
      date: ds,
      month: cursor.getMonth(),
      day: cursor.getDate(),
      level: realPct === undefined ? mockLevel(ds) : pctToLevel(realPct),
      real: realPct !== undefined,
      pct: realPct,
    };
    if (row === 6) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
    cursor = new Date(cursor.getTime() + 86400000);
  }
  if (week.some(Boolean)) weeks.push(week);

  /* first week index where each month appears, for the label row */
  const monthStarts = [];
  weeks.forEach((w, wi) => {
    w.forEach((cell) => {
      if (cell && cell.day <= 7 && monthStarts[cell.month] === undefined) {
        monthStarts[cell.month] = wi;
      }
    });
  });

  return { weeks, monthStarts };
}

/* --- Discipline ring --------------------------------------------------- */
function ProgressRing({ value, size = 200, stroke = 13 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const hue = value >= STREAK_TARGET ? EMERALD : value >= 50 ? GOLD : "#8A7B3F";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="pointer-events-none absolute inset-3 rounded-full blur-2xl transition-opacity duration-700"
        style={{ background: hue, opacity: value >= STREAK_TARGET ? 0.22 : 0.1 }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id="hvRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={hue} />
            <stop
              offset="100%"
              stopColor={value >= STREAK_TARGET ? "#34D399" : "#F5D97A"}
            />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#hvRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)",
            filter: `drop-shadow(0 0 12px ${hue}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <span
          className="font-extrabold leading-none tabular-nums"
          style={{ fontSize: size * 0.27, color: hue }}
        >
          {value}
          <span className="align-super text-[0.45em] font-bold">%</span>
        </span>
        <span className="mt-1.5 text-[11px] leading-tight text-white/55">
          مؤشر الانضباط اليومي
        </span>
      </div>
    </div>
  );
}

/* --- Reward burst ------------------------------------------------------ */
function Burst({ seed }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 12 + (seed % 10) * 0.1;
        const d = 26 + ((seed + i * 7) % 22);
        return {
          dx: `${Math.cos(a) * d}px`,
          dy: `${Math.sin(a) * d}px`,
          delay: `${(i % 4) * 25}ms`,
          color: i % 3 === 0 ? GOLD : EMERALD,
        };
      }),
    [seed]
  );
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0">
      {sparks.map((s, i) => (
        <span
          key={i}
          className="hv-spark"
          style={{
            "--dx": s.dx,
            "--dy": s.dy,
            animationDelay: s.delay,
            background: s.color,
          }}
        />
      ))}
    </span>
  );
}

/* --- Non-negotiable row ------------------------------------------------ */
function DeepWorkRow({ task, index, onToggle, onText, onMinutes }) {
  const [burst, setBurst] = useState(0);
  const wasDone = useRef(task.done);

  useEffect(() => {
    if (task.done && !wasDone.current) setBurst((b) => b + 1);
    wasDone.current = task.done;
  }, [task.done]);

  return (
    <div
      key={burst}
      className={`group relative overflow-visible rounded-2xl border p-4 transition-all duration-500 ${
        task.done ? "hv-pulse" : ""
      }`}
      style={{
        background: task.done ? "rgba(16,185,129,0.09)" : "rgba(255,255,255,0.05)",
        borderColor: task.done ? `${EMERALD}66` : "rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
        boxShadow: task.done ? `0 0 26px -6px ${EMERALD}66` : "none",
      }}
    >
      {burst > 0 && task.done && <Burst seed={burst * 13 + index} />}

      <div className="flex items-center gap-3">
        <span
          className="w-5 shrink-0 text-center text-sm font-black tabular-nums"
          style={{ color: task.done ? `${EMERALD}99` : `${GOLD}99` }}
        >
          {index + 1}
        </span>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={task.done}
          aria-label={`إنجاز: ${task.text}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 active:scale-90"
          style={{
            borderColor: task.done ? EMERALD : "rgba(255,255,255,0.2)",
            background: task.done ? EMERALD : "transparent",
            boxShadow: task.done ? `0 0 22px ${EMERALD}80` : "none",
          }}
        >
          <Check
            size={19}
            strokeWidth={3.5}
            className="text-black transition-all duration-200"
            style={{
              opacity: task.done ? 1 : 0,
              transform: task.done ? "scale(1)" : "scale(0.4)",
            }}
          />
        </button>

        <input
          id={`hv-top3-${index}`}
          value={task.text}
          onChange={(e) => onText(e.target.value)}
          placeholder={`المهمة غير القابلة للتفاوض رقم ${index + 1}`}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-bold outline-none transition-all duration-300 placeholder:font-normal placeholder:text-white/20"
          style={{
            color: task.done ? EMERALD : "rgba(255,255,255,0.92)",
            textDecoration: task.done ? "line-through" : "none",
            textDecorationColor: `${EMERALD}80`,
          }}
        />

        <div
          className="flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1"
          style={{
            borderColor: task.done ? `${EMERALD}33` : "rgba(255,255,255,0.10)",
          }}
        >
          <input
            id={`hv-top3-min-${index}`}
            type="number"
            min="0"
            max="600"
            step="5"
            value={task.minutes}
            onChange={(e) => onMinutes(Number(e.target.value) || 0)}
            aria-label="عدد الدقائق"
            className="w-10 bg-transparent text-center text-xs tabular-nums outline-none"
            style={{ color: task.done ? EMERALD : "rgba(255,255,255,0.6)" }}
          />
          <span className="text-[10px] text-white/30">د</span>
        </div>
      </div>
    </div>
  );
}

/* --- Compact timeline row ---------------------------------------------- */
function TimelineItem({ label, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="group/i flex items-center gap-2 rounded-lg px-2 py-1.5 text-right transition-colors hover:bg-white/[0.05]"
    >
      <span
        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-all duration-300"
        style={{
          borderColor: checked ? EMERALD : "rgba(255,255,255,0.2)",
          background: checked ? EMERALD : "transparent",
          boxShadow: checked ? `0 0 10px ${EMERALD}66` : "none",
        }}
      >
        <Check
          size={11}
          strokeWidth={4}
          className="text-black transition-opacity duration-200"
          style={{ opacity: checked ? 1 : 0 }}
        />
      </span>
      <span
        className="truncate text-[12.5px] transition-all duration-300"
        style={{
          color: checked ? EMERALD : "rgba(255,255,255,0.72)",
          textDecoration: checked ? "line-through" : "none",
          textDecorationColor: `${EMERALD}80`,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* --- Consistency heatmap ------------------------------------------------ */
function Heatmap({ history }) {
  const { weeks, monthStarts } = useMemo(
    () => buildYearGrid(2027, history),
    [history]
  );
  const template = `repeat(${weeks.length}, 13px)`;
  const dayLabels = ["السبت", "", "الاثنين", "", "الأربعاء", "", "الجمعة"];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-2">
        {/* weekday rail */}
        <div className="grid shrink-0 gap-[3px] pt-[18px]">
          {dayLabels.map((d, i) => (
            <span
              key={i}
              className="flex h-[10px] items-center text-[9px] leading-none text-white/25"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="shrink-0">
          {/* month labels */}
          <div
            className="mb-1 grid h-[14px] gap-[3px]"
            style={{ gridTemplateColumns: template }}
          >
            {AR_MONTHS.map((m, i) =>
              monthStarts[i] === undefined ? null : (
                <span
                  key={m}
                  className="whitespace-nowrap text-[9.5px] text-white/35"
                  style={{ gridColumnStart: monthStarts[i] + 1 }}
                >
                  {m}
                </span>
              )
            )}
          </div>

          {/* cells */}
          <div
            className="grid grid-flow-col gap-[3px]"
            style={{ gridTemplateColumns: template, gridTemplateRows: "repeat(7, 10px)" }}
          >
            {weeks.map((week, wi) =>
              week.map((cell, di) => (
                <span
                  key={`${wi}-${di}`}
                  title={
                    cell
                      ? `${cell.date}${cell.real ? ` — ${cell.pct}٪ (مسجّل)` : " — تجريبي"}`
                      : ""
                  }
                  className="h-[10px] w-[10px] rounded-[2px] transition-transform duration-150 hover:scale-150"
                  style={{
                    background: cell ? HEAT_COLORS[cell.level] : "transparent",
                    outline: cell?.real ? `1px solid ${GOLD}` : "none",
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
        <span>المربّع المحاط بالذهبي = يوم سجّلتَه فعلًا</span>
        <span className="flex items-center gap-1.5">
          أقل
          {HEAT_COLORS.map((c, i) => (
            <span
              key={i}
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{ background: c }}
            />
          ))}
          أكثر
        </span>
      </div>
    </div>
  );
}

/* --- Star rating --------------------------------------------------------- */
function StarRating({ value, onChange, size = 15 }) {
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
              color: n <= value ? GOLD : "rgba(255,255,255,0.2)",
              fill: n <= value ? GOLD : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}

/* --- Book card ----------------------------------------------------------- */
const BOOK_STATUS = {
  planned: { label: "أنوي قراءته", tint: "#A855F7" },
  reading: { label: "أقرأه الآن", tint: "#3B82F6" },
  finished: { label: "أنهيته", tint: EMERALD },
};

function BookCard({ book, onChange, onDelete }) {
  const meta = BOOK_STATUS[book.status] || BOOK_STATUS.planned;
  return (
    <article
      className="group flex gap-4 rounded-2xl border p-4 transition-all duration-500 hover:-translate-y-1"
      style={{
        background: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}59`;
        e.currentTarget.style.boxShadow = `0 18px 50px -22px ${GOLD}77`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* cover placeholder */}
      <div
        className="relative flex h-[104px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg border"
        style={{
          borderColor: `${meta.tint}33`,
          background: `linear-gradient(145deg, ${meta.tint}22, rgba(0,0,0,.6))`,
        }}
      >
        <span
          className="absolute inset-y-0 right-0 w-[5px]"
          style={{ background: `${meta.tint}55` }}
        />
        <span
          className="text-2xl font-black"
          style={{ color: `${meta.tint}CC` }}
        >
          {book.title.trim().charAt(0) || "؟"}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[14.5px] font-bold text-white/90">
              {book.title}
            </h3>
            <p className="truncate text-[11px] text-white/35">{book.author}</p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`حذف ${book.title}`}
            className="shrink-0 rounded-md p-1 text-white/15 transition-colors hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={book.status}
            onChange={(e) => onChange({ ...book, status: e.target.value })}
            aria-label={`حالة ${book.title}`}
            className="rounded-md border bg-transparent px-2 py-0.5 text-[10.5px] outline-none"
            style={{
              borderColor: `${meta.tint}40`,
              color: meta.tint,
              background: `${meta.tint}12`,
            }}
          >
            {Object.entries(BOOK_STATUS).map(([k, v]) => (
              <option key={k} value={k} style={{ background: "#121212" }}>
                {v.label}
              </option>
            ))}
          </select>
          <StarRating
            value={book.rating}
            onChange={(rating) => onChange({ ...book, rating })}
          />
        </div>

        <textarea
          id={`hv-take-${book.id}`}
          value={book.takeaway}
          onChange={(e) => onChange({ ...book, takeaway: e.target.value })}
          rows={2}
          placeholder="الفكرة الجوهرية…"
          aria-label={`الفكرة الجوهرية من ${book.title}`}
          className="mt-2 w-full resize-none rounded-lg border bg-transparent px-2.5 py-1.5 text-[11.5px] leading-relaxed text-white/65 outline-none transition-colors placeholder:text-white/20 focus:border-white/25"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        />
      </div>
    </article>
  );
}

/* --- Evening reflection modal -------------------------------------------- */
const MOODS = [
  { id: "weak", emoji: "😔", label: "متذبذب", tint: "#EF4444" },
  { id: "ok", emoji: "🙂", label: "مقبول", tint: GOLD },
  { id: "strong", emoji: "🔥", label: "منضبط", tint: EMERALD },
];

function EndDayModal({ open, score, onClose, onSave }) {
  const [mood, setMood] = useState(null);

  useEffect(() => {
    if (open) setMood(null);
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="إنهاء اليوم"
        className="hv-in relative w-full max-w-md rounded-t-3xl border p-7 sm:rounded-3xl"
        style={{
          background: "linear-gradient(160deg, #151515, #0B0B0B)",
          borderColor: `${GOLD}33`,
          boxShadow: `0 40px 90px -30px ${GOLD}44`,
        }}
      >
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-5 top-5 rounded-lg border border-white/10 p-1.5 text-white/40 transition-colors hover:border-white/25 hover:text-white"
        >
          <X size={15} />
        </button>

        <div className="flex items-center gap-2">
          <MoonStar size={18} style={{ color: GOLD }} />
          <h3 className="text-lg font-bold" style={{ color: GOLD }}>
            إنهاء اليوم
          </h3>
        </div>
        <p className="mt-2 text-sm text-white/55">
          كم كنت منضبطًا اليوم؟ اختر بصدق — الرقم أعلاه يقيس الفعل، وهذا يقيس
          شعورك عنه.
        </p>

        <div
          className="mt-5 rounded-2xl border px-4 py-3 text-center"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <span className="text-[11px] text-white/40">مؤشر اليوم المسجَّل</span>
          <p
            className="text-3xl font-extrabold tabular-nums"
            style={{ color: score >= STREAK_TARGET ? EMERALD : GOLD }}
          >
            {score}%
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {MOODS.map((m) => {
            const active = mood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                aria-pressed={active}
                className="flex flex-col items-center gap-2 rounded-2xl border py-4 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  borderColor: active ? `${m.tint}AA` : "rgba(255,255,255,0.09)",
                  background: active ? `${m.tint}1A` : "rgba(255,255,255,0.03)",
                  boxShadow: active ? `0 0 26px -8px ${m.tint}` : "none",
                  transform: active ? "scale(1.04)" : "scale(1)",
                }}
              >
                <span className="text-2xl leading-none">{m.emoji}</span>
                <span
                  className="text-[11.5px] font-bold"
                  style={{ color: active ? m.tint : "rgba(255,255,255,0.5)" }}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          disabled={!mood}
          onClick={() => onSave(mood)}
          className="mt-6 w-full rounded-xl py-3.5 text-sm font-bold text-black transition-all disabled:cursor-not-allowed disabled:opacity-30"
          style={{
            background: `linear-gradient(135deg, ${GOLD}, #F0DC8A)`,
            boxShadow: mood ? `0 14px 36px -14px ${GOLD}AA` : "none",
          }}
        >
          حفظ وإغلاق اليوم
        </button>
      </div>
    </div>
  );
}

/* --- Root ---------------------------------------------------------------- */
export default function Harvest2027() {
  const [state, setState] = useState(loadState);
  const [quarter, setQuarter] = useState("q1");
  const [bookDraft, setBookDraft] = useState("");
  const [goalDrafts, setGoalDrafts] = useState({});
  const [endOpen, setEndOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage blocked — the UI still works for this session */
    }
  }, [state]);

  const top3Done = state.top3.filter((t) => t.done).length;
  const routineDone = ALL_ROUTINE_IDS.filter((id) => state.routine[id]).length;
  const discipline = Math.round(
    (top3Done / state.top3.length) * TOP3_WEIGHT +
      (routineDone / TOTAL_ROUTINE) * ROUTINE_WEIGHT
  );

  useEffect(() => {
    if (discipline >= STREAK_TARGET && !state.dayBanked) {
      setState((s) => {
        const next = s.streakBase + 1;
        return {
          ...s,
          dayBanked: true,
          bestStreak: Math.max(s.bestStreak || 0, next),
        };
      });
    }
  }, [discipline, state.dayBanked]);

  const streak = state.streakBase + (state.dayBanked ? 1 : 0);

  /* flame intensity is a readout of today's score, not decoration */
  const flame =
    discipline >= STREAK_TARGET
      ? { color: EMBER, glow: `drop-shadow(0 0 14px ${EMBER})`, animate: true, opacity: 1 }
      : discipline >= 50
      ? { color: "#B45309", glow: `drop-shadow(0 0 6px #B4530988)`, animate: false, opacity: 0.9 }
      : { color: "rgba(255,255,255,0.22)", glow: "none", animate: false, opacity: 0.55 };

  /* --- actions --- */
  const toggleTop3 = useCallback((id) => {
    setState((s) => ({
      ...s,
      top3: s.top3.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const patchTop3 = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      top3: s.top3.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const toggleRoutine = useCallback((id) => {
    setState((s) => ({ ...s, routine: { ...s.routine, [id]: !s.routine[id] } }));
  }, []);

  const resetDay = useCallback(() => {
    setState((s) => ({
      ...s,
      routine: blankRoutine(),
      top3: s.top3.map((t) => ({ ...t, done: false })),
      dayClosed: false,
    }));
  }, []);

  const endDay = useCallback(
    (mood) => {
      setState((s) => {
        const today = dayKey();
        const pct = Math.round(
          (s.top3.filter((t) => t.done).length / s.top3.length) * TOP3_WEIGHT +
            (ALL_ROUTINE_IDS.filter((id) => s.routine[id]).length /
              TOTAL_ROUTINE) *
              ROUTINE_WEIGHT
        );
        const rest = (s.history || []).filter((h) => h.date !== today);
        return {
          ...s,
          dayClosed: true,
          history: [...rest, { date: today, pct, mood }].slice(-HISTORY_CAP),
        };
      });
      setEndOpen(false);
    },
    []
  );

  const addGoal = useCallback(
    (catId) => {
      const text = (goalDrafts[`${quarter}:${catId}`] || "").trim();
      if (!text) return;
      setState((s) => ({
        ...s,
        goals: {
          ...s.goals,
          [quarter]: {
            ...s.goals[quarter],
            [catId]: [
              ...(s.goals[quarter]?.[catId] || []),
              { id: uid(), text, done: false },
            ],
          },
        },
      }));
      setGoalDrafts((d) => ({ ...d, [`${quarter}:${catId}`]: "" }));
    },
    [goalDrafts, quarter]
  );

  const updateGoals = useCallback(
    (catId, next) => {
      setState((s) => ({
        ...s,
        goals: { ...s.goals, [quarter]: { ...s.goals[quarter], [catId]: next } },
      }));
    },
    [quarter]
  );

  const addBook = useCallback(() => {
    const title = bookDraft.trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      books: [
        {
          id: uid(),
          title,
          author: "",
          status: "planned",
          rating: 0,
          takeaway: "",
        },
        ...s.books,
      ],
    }));
    setBookDraft("");
  }, [bookDraft]);

  const updateBook = useCallback((next) => {
    setState((s) => ({
      ...s,
      books: s.books.map((b) => (b.id === next.id ? next : b)),
    }));
  }, []);

  const removeBook = useCallback((id) => {
    setState((s) => ({ ...s, books: s.books.filter((b) => b.id !== id) }));
  }, []);

  /* --- derived --- */
  const { dateLabel, quote, daysTo2027 } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    return {
      dateLabel: now.toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      quote: QUOTES[dayOfYear % QUOTES.length],
      daysTo2027: Math.max(0, Math.ceil((new Date(2027, 0, 1) - now) / 86400000)),
    };
  }, []);

  const savedDays = (state.history || []).length;
  const goalsThisQuarter = CATEGORIES.reduce(
    (a, c) => a + (state.goals[quarter]?.[c.id]?.length || 0),
    0
  );
  const goalsDone = CATEGORIES.reduce(
    (a, c) => a + (state.goals[quarter]?.[c.id] || []).filter((g) => g.done).length,
    0
  );
  const booksFinished = state.books.filter((b) => b.status === "finished").length;
  const allTop3 = top3Done === state.top3.length;

  const glass = {
    background: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.10)",
    backdropFilter: "blur(12px)",
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full text-white antialiased"
      style={{
        background:
          "radial-gradient(1100px 560px at 50% -8%, #18181C 0%, #0A0A0A 58%, #0A0A0A 100%)",
        fontFamily:
          "'Tajawal', 'Cairo', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700&display=swap');
        @keyframes hvFlame { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.16) rotate(3deg); } }
        .hv-flame { animation: hvFlame 1.6s ease-in-out infinite; }
        @keyframes hvIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .hv-in { animation: hvIn .35s cubic-bezier(.22,1,.36,1) both; }
        @keyframes hvPulseRing { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,.5); } 100% { box-shadow: 0 0 0 20px rgba(16,185,129,0); } }
        .hv-pulse { animation: hvPulseRing .8s ease-out 1; }
        .hv-spark { position: absolute; width: 5px; height: 5px; border-radius: 9999px; animation: hvSpark .75s cubic-bezier(.2,.8,.3,1) forwards; }
        @keyframes hvSpark { from { opacity: 1; transform: translate(0,0) scale(1); } to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(.25); } }
        @media (prefers-reduced-motion: reduce) {
          .hv-flame, .hv-in, .hv-pulse, .hv-spark { animation: none !important; }
          .hv-spark { display: none; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {/* ============ 1. DOPAMINE HEADER ============ */}
        <header
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={glass}
        >
          <div
            className="pointer-events-none absolute -top-28 right-1/3 h-72 w-72 rounded-full opacity-[0.13] blur-3xl"
            style={{ background: GOLD }}
          />

          {/* daily cue */}
          <div
            className="relative mx-auto mb-8 max-w-3xl rounded-2xl border p-5 text-center"
            style={{
              borderColor: `${GOLD}2B`,
              background:
                "linear-gradient(135deg, rgba(212,175,55,0.09), rgba(255,255,255,0.02))",
            }}
          >
            <Quote
              size={22}
              className="mx-auto mb-2 opacity-25"
              style={{ color: GOLD }}
            />
            <p className="text-[15px] font-bold leading-relaxed text-white/85 sm:text-lg">
              {quote.text}
            </p>
            <p className="mt-2 text-xs" style={{ color: GOLD }}>
              — {quote.author}
            </p>
          </div>

          <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            <div className="text-center lg:text-right">
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-[0.2em]"
                style={{
                  borderColor: `${GOLD}33`,
                  color: GOLD,
                  background: `${GOLD}0D`,
                }}
              >
                <Target size={11} /> 2027 LIFE OS
              </div>
              <h1 className="text-2xl font-extrabold leading-tight sm:text-4xl">
                2027 — <span style={{ color: GOLD }}>وقت حصاد الثمار</span>
              </h1>
              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-white/45 lg:justify-start">
                <CalendarDays size={14} /> {dateLabel}
              </p>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-white/35">
                باقٍ{" "}
                <strong className="tabular-nums text-white/70">{daysTo2027}</strong>{" "}
                يومًا حتى الحصاد. ما تزرعه اليوم في الروتين هو بعينه ما تحصده
                هناك — لا نيّةٌ ولا أمنية.
              </p>
            </div>

            <ProgressRing value={discipline} size={200} />

            <div className="flex w-full max-w-xs flex-col gap-3 lg:w-auto">
              <div
                className="flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-500"
                style={{
                  borderColor:
                    discipline >= STREAK_TARGET
                      ? `${EMBER}59`
                      : "rgba(255,255,255,0.10)",
                  background:
                    discipline >= STREAK_TARGET
                      ? "linear-gradient(135deg, rgba(249,115,22,.14), rgba(255,255,255,.02))"
                      : "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                    Current Streak
                  </p>
                  <p className="text-sm text-white/60">سلسلة الانضباط</p>
                </div>
                <div className="flex items-center gap-2">
                  <Flame
                    size={32}
                    className={flame.animate ? "hv-flame" : ""}
                    style={{
                      color: flame.color,
                      filter: flame.glow,
                      opacity: flame.opacity,
                      transition: "all .5s ease",
                    }}
                  />
                  <span className="text-3xl font-extrabold tabular-nums">
                    {streak}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: "الأساسيات", v: `${top3Done}/3`, c: EMERALD },
                  { k: "الروتين", v: `${routineDone}/${TOTAL_ROUTINE}`, c: GOLD },
                  {
                    k: "أطول سلسلة",
                    v: String(Math.max(state.bestStreak || 0, streak)),
                    c: EMBER,
                  },
                ].map((s) => (
                  <div
                    key={s.k}
                    className="rounded-2xl border px-2 py-3 text-center"
                    style={glass}
                  >
                    <p className="text-[9.5px] leading-tight text-white/35">
                      {s.k}
                    </p>
                    <p
                      className="mt-1 text-base font-bold tabular-nums"
                      style={{ color: s.c }}
                    >
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={resetDay}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-[11px] text-white/40 transition-colors hover:border-white/25 hover:text-white/80"
              >
                <RotateCcw size={12} /> تصفير اليوم
              </button>
            </div>
          </div>
        </header>

        {/* ============ 2. NON-NEGOTIABLE TOP 3 ============ */}
        <section className="mt-10">
          <div
            className="relative overflow-hidden rounded-3xl border p-6 transition-all duration-700 sm:p-7"
            style={{
              background: allTop3
                ? "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(255,255,255,0.03))"
                : "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,255,255,0.03))",
              borderColor: allTop3 ? `${EMERALD}66` : `${GOLD}38`,
              backdropFilter: "blur(12px)",
              boxShadow: allTop3 ? `0 0 60px -24px ${EMERALD}` : "none",
            }}
          >
            <div
              className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-[0.12] blur-3xl"
              style={{ background: allTop3 ? EMERALD : GOLD }}
            />

            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: allTop3 ? `${EMERALD}59` : `${GOLD}45`,
                    background: allTop3 ? `${EMERALD}18` : `${GOLD}16`,
                    color: allTop3 ? EMERALD : GOLD,
                  }}
                >
                  <Zap size={20} strokeWidth={2} />
                </span>
                <div>
                  <h2
                    className="text-base font-bold sm:text-lg"
                    style={{ color: allTop3 ? EMERALD : GOLD }}
                  >
                    الثلاثة غير القابلة للتفاوض
                  </h2>
                  <p className="text-xs text-white/45">
                    منطقة العمل العميق. نصف مؤشر يومك كلّه هنا.
                  </p>
                </div>
              </div>
              <span
                className="rounded-full border px-3 py-1 text-xs font-bold tabular-nums"
                style={{
                  borderColor: allTop3 ? `${EMERALD}59` : `${GOLD}40`,
                  color: allTop3 ? EMERALD : GOLD,
                  background: allTop3 ? `${EMERALD}14` : `${GOLD}0D`,
                }}
              >
                {top3Done}/3 منجزة
              </span>
            </div>

            <div className="relative mt-5 space-y-3">
              {state.top3.map((t, i) => (
                <DeepWorkRow
                  key={t.id}
                  task={t}
                  index={i}
                  onToggle={() => toggleTop3(t.id)}
                  onText={(text) => patchTop3(t.id, { text })}
                  onMinutes={(minutes) => patchTop3(t.id, { minutes })}
                />
              ))}
            </div>

            <p
              className="relative mt-4 text-[11.5px] leading-relaxed transition-colors duration-500"
              style={{ color: allTop3 ? `${EMERALD}CC` : "rgba(255,255,255,0.3)" }}
            >
              {allTop3
                ? "الثلاثة كلها سقطت. هذا يوم لا يُمحى — أغلقه بشرف من الأسفل."
                : "لا رابعة. إن ظهر ما هو أهم، استبدل واحدة — فالتركيز قرار حذف لا إضافة."}
            </p>
          </div>
        </section>

        {/* ============ 3. ROUTINE TIMELINE ============ */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">خط الروتين</h2>
              <p className="mt-1 text-xs text-white/35">
                عادات مجهرية بلا احتكاك. اضغط واعبر — لا تفكّر.
              </p>
            </div>
            <span className="text-xs tabular-nums text-white/30">
              {routineDone}/{TOTAL_ROUTINE}
            </span>
          </div>

          <div
            className="rounded-3xl border p-6 sm:p-7"
            style={glass}
          >
            <div className="relative">
              {/* the spine — RTL, so it hugs the right edge */}
              <div
                className="absolute bottom-3 right-[19px] top-3 w-px"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(212,175,55,.5), rgba(16,185,129,.45))",
                }}
              />

              <div className="space-y-7">
                {TIMELINE.map((station) => {
                  const Icon = station.icon;
                  const done = station.items.filter(
                    (i) => state.routine[i.id]
                  ).length;
                  const complete = done === station.items.length;
                  return (
                    <div key={station.id} className="relative pr-12">
                      {/* node */}
                      <span
                        className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500"
                        style={{
                          borderColor: complete
                            ? `${EMERALD}80`
                            : `${station.tint}40`,
                          background: complete
                            ? `${EMERALD}1F`
                            : "rgba(10,10,10,0.95)",
                          color: complete ? EMERALD : station.tint,
                          boxShadow: complete ? `0 0 18px -4px ${EMERALD}` : "none",
                        }}
                      >
                        <Icon size={17} strokeWidth={1.9} />
                      </span>

                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-[15px] font-bold text-white/90">
                          {station.label}
                        </h3>
                        <span className="text-[11px] tabular-nums text-white/25">
                          {station.time}
                        </span>
                        <span
                          className="mr-auto text-[11px] font-bold tabular-nums"
                          style={{
                            color: complete ? EMERALD : "rgba(255,255,255,0.3)",
                          }}
                        >
                          {done}/{station.items.length}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                        {station.items.map((item) => (
                          <TimelineItem
                            key={item.id}
                            label={item.label}
                            checked={!!state.routine[item.id]}
                            onToggle={() => toggleRoutine(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ============ 4. CONSISTENCY HEATMAP ============ */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">خريطة الثبات 2027</h2>
              <p className="mt-1 text-xs text-white/35">
                كل مربّع يوم من عمرك. الفراغات هي ما ستندم عليه — لا الأخطاء.
              </p>
            </div>
            <span className="text-xs tabular-nums text-white/30">
              {savedDays} يوم مسجّل
            </span>
          </div>

          <div className="rounded-3xl border p-5 sm:p-6" style={glass}>
            <Heatmap history={state.history} />
          </div>
        </section>

        {/* ============ 5. QUARTERLY GOALS ============ */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">أهداف السنة</h2>
              <p className="mt-1 text-xs text-white/35">
                الربع وحدة قياس أصدق من السنة.
              </p>
            </div>
            <span className="text-xs tabular-nums text-white/30">
              {goalsDone}/{goalsThisQuarter} في هذا الربع
            </span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {QUARTERS.map((q) => {
              const active = q.id === quarter;
              return (
                <button
                  key={q.id}
                  onClick={() => setQuarter(q.id)}
                  aria-pressed={active}
                  className="rounded-xl border px-4 py-2 text-right transition-all"
                  style={{
                    borderColor: active ? `${GOLD}59` : "rgba(255,255,255,0.10)",
                    background: active ? `${GOLD}14` : "rgba(255,255,255,0.05)",
                    color: active ? GOLD : "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <span className="block text-[13px] font-bold">{q.label}</span>
                  <span className="block text-[10px] opacity-60">{q.months}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const list = state.goals[quarter]?.[cat.id] || [];
              const draftKey = `${quarter}:${cat.id}`;
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="flex flex-col rounded-2xl border p-5"
                  style={glass}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl border"
                      style={{
                        borderColor: `${cat.tint}33`,
                        background: `${cat.tint}14`,
                        color: cat.tint,
                      }}
                    >
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    <h3 className="text-[15px] font-bold text-white/90">
                      {cat.label}
                    </h3>
                    <span className="mr-auto text-[11px] tabular-nums text-white/30">
                      {list.filter((g) => g.done).length}/{list.length}
                    </span>
                  </div>

                  <div className="mt-3 flex-1 space-y-0.5">
                    {list.length === 0 ? (
                      <p className="py-3 text-center text-[11px] text-white/25">
                        لا هدف بعد
                      </p>
                    ) : (
                      list.map((g) => (
                        <div
                          key={g.id}
                          className="group flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-white/[0.04]"
                        >
                          <div className="flex-1">
                            <TimelineItem
                              label={g.text}
                              checked={g.done}
                              onToggle={() =>
                                updateGoals(
                                  cat.id,
                                  list.map((x) =>
                                    x.id === g.id ? { ...x, done: !x.done } : x
                                  )
                                )
                              }
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateGoals(
                                cat.id,
                                list.filter((x) => x.id !== g.id)
                              )
                            }
                            aria-label={`حذف ${g.text}`}
                            className="shrink-0 rounded p-1 text-white/15 opacity-0 transition-all hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      id={`hv-goal-${draftKey}`}
                      value={goalDrafts[draftKey] || ""}
                      onChange={(e) =>
                        setGoalDrafts((d) => ({
                          ...d,
                          [draftKey]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addGoal(cat.id)}
                      placeholder="أضف هدفًا…"
                      className="w-full rounded-lg border bg-transparent px-3 py-2 text-[12.5px] outline-none transition-colors placeholder:text-white/20 focus:border-white/25"
                      style={{ borderColor: "rgba(255,255,255,0.08)" }}
                    />
                    <button
                      onClick={() => addGoal(cat.id)}
                      aria-label={`إضافة هدف في ${cat.label}`}
                      className="shrink-0 rounded-lg border px-2.5 transition-colors"
                      style={{
                        borderColor: `${cat.tint}40`,
                        color: cat.tint,
                        background: `${cat.tint}12`,
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============ 6. READING VAULT ============ */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
                <Library size={19} style={{ color: GOLD }} />
                خزانة القراءة والرؤى
              </h2>
              <p className="mt-1 text-xs text-white/35">
                الكتاب الذي لا تكتب ما استفدته منه، قرأتَه ولم تقرأه.
              </p>
            </div>
            <span className="text-xs tabular-nums text-white/30">
              {booksFinished} مُنهَى من {state.books.length}
            </span>
          </div>

          <div className="mb-4 flex gap-2">
            <input
              id="hv-book-new"
              value={bookDraft}
              onChange={(e) => setBookDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBook()}
              placeholder="عنوان كتاب جديد…"
              className="w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-white/20 focus:border-white/25"
              style={glass}
            />
            <button
              onClick={addBook}
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-5 text-sm font-bold text-black transition-transform active:scale-95"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #F0DC8A)` }}
            >
              <Plus size={16} strokeWidth={2.5} /> أضف
            </button>
          </div>

          {state.books.length === 0 ? (
            <p
              className="rounded-2xl border py-10 text-center text-xs text-white/25"
              style={glass}
            >
              الخزانة فارغة. أضف أول كتاب أعلاه.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {state.books.map((b) => (
                <BookCard
                  key={b.id}
                  book={b}
                  onChange={updateBook}
                  onDelete={() => removeBook(b.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ============ 7. END DAY ============ */}
        <section className="mt-12">
          <button
            onClick={() => setEndOpen(true)}
            className="group flex w-full items-center justify-center gap-3 rounded-3xl border py-6 text-lg font-extrabold transition-all duration-500 hover:-translate-y-0.5"
            style={{
              borderColor: state.dayClosed ? `${EMERALD}59` : `${GOLD}45`,
              background: state.dayClosed
                ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(255,255,255,0.03))"
                : "linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))",
              color: state.dayClosed ? EMERALD : GOLD,
              backdropFilter: "blur(12px)",
              boxShadow: `0 20px 60px -30px ${state.dayClosed ? EMERALD : GOLD}`,
            }}
          >
            <MoonStar
              size={22}
              className="transition-transform duration-500 group-hover:rotate-12"
            />
            {state.dayClosed ? "اليوم مُغلَق — افتح للمراجعة" : "إنهاء اليوم"}
          </button>
          <p className="mt-3 text-center text-[11px] text-white/25">
            الإغلاق يثبّت نسبة اليوم في خريطة الثبات. يوم بلا إغلاق يبقى مربّعًا
            فارغًا.
          </p>
        </section>

        <footer className="mt-12 text-center text-[11px] text-white/20">
          2027 · وقت حصاد الثمار — الانضباط حرية مؤجّلة
        </footer>
      </div>

      <EndDayModal
        open={endOpen}
        score={discipline}
        onClose={() => setEndOpen(false)}
        onSave={endDay}
      />
    </div>
  );
}
