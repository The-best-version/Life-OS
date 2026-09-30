import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Menu,
  X,
  ListChecks,
  LayoutGrid,
  Library,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Check,
  Star,
  Flame,
  Quote,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Target,
  Clock,
  Zap,
  Trash,
  Sunrise,
  Sun,
  Moon,
  Bed,
  GripVertical,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

/* ==================================================================== *
 *  2027 LIFE OS — modular discipline system
 *  React + Tailwind CSS + lucide-react. Single file, no other deps.
 *  Install: npm i lucide-react
 *
 *  Note on Shadcn UI: shadcn is a set of components you copy into a
 *  project via its CLI (it compiles down to Radix UI + Tailwind), not a
 *  package you can import. The primitives below (Card, Btn, Field,
 *  Modal, Badge) follow shadcn's token model and API shape so this file
 *  stays dependency-free and drops straight into any React app.
 * ==================================================================== */

/* --- tokens --------------------------------------------------------- */
const T = {
  bg: "#0A0A0A",
  card: "rgba(255,255,255,0.05)",
  cardSolid: "#121212",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",
  fg: "#FAFAFA",
  muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.25)",
  primary: "#10B981",
  accent: "#D4AF37",
  ember: "#F97316",
  danger: "#EF4444",
};

const GLASS = {
  background: T.card,
  borderColor: T.border,
  backdropFilter: "blur(12px)",
};

/* --- navigation ------------------------------------------------------ */
const NAV = [
  { id: "routine", label: "الروتين اليومي", icon: ListChecks },
  { id: "matrix", label: "مصفوفة المهام", icon: LayoutGrid },
  { id: "vault", label: "مكتبة الإنجازات", icon: Library },
  { id: "analytics", label: "التتبع الشهري", icon: BarChart3 },
];

/* --- routine groups -------------------------------------------------- */
const GROUPS = [
  { id: "morning", label: "الصباح", icon: Sunrise, tint: "#D4AF37" },
  { id: "afternoon", label: "بعد الظهر", icon: Sun, tint: "#F59E0B" },
  { id: "evening", label: "المساء", icon: Moon, tint: "#A855F7" },
  { id: "night", label: "قبل النوم", icon: Bed, tint: "#10B981" },
];

/* --- Eisenhower quadrants -------------------------------------------- */
const QUADRANTS = [
  {
    id: "q1",
    label: "عاجل ومهم",
    action: "افعلها الآن",
    tint: "#EF4444",
    icon: Zap,
  },
  {
    id: "q2",
    label: "مهم غير عاجل",
    action: "جدولها — هنا يُصنع الـ ٢٠٪",
    tint: "#10B981",
    icon: Target,
  },
  {
    id: "q3",
    label: "عاجل غير مهم",
    action: "فوّضها أو قلّصها",
    tint: "#F59E0B",
    icon: Clock,
  },
  {
    id: "q4",
    label: "غير عاجل وغير مهم",
    action: "احذفها بلا تردد",
    tint: "rgba(255,255,255,0.3)",
    icon: Trash,
  },
];

/* --- daily cue -------------------------------------------------------- */
const QUOTES = [
  {
    text: "أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك.",
    author: "جيمس كلير",
  },
  {
    text: "إضاعة الوقت أشدّ من الموت؛ لأنها تقطعك عن الله والدار الآخرة.",
    author: "ابن القيّم",
  },
  { text: "اقرأ ما تحبّ حتى تُحبّ القراءة.", author: "نافال رافيكانت" },
  {
    text: "التركيز العميق مهارة نادرة وثمينة في اقتصاد اليوم.",
    author: "كال نيوبورت",
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
  { text: "ليست حياتنا قصيرة، بل نحن نُضيّع كثيرًا منها.", author: "سينيكا" },
  {
    text: "أنت تملك سلطانًا على عقلك، لا على الأحداث. أدرك هذا تجد القوة.",
    author: "ماركوس أوريليوس",
  },
  {
    text: "وقتك محدود، فلا تُضيّعه عيشًا في حياة شخص آخر.",
    author: "ستيف جوبز",
  },
  { text: "الناجحون جدًّا يقولون «لا» لكل شيء تقريبًا.", author: "وارن بافيت" },
  { text: "ما يُقاس، يتحسّن.", author: "بيتر دراكر" },
  { text: "ما يصنع أعدائي بي؟ أنا جنّتي وبستاني في صدري.", author: "ابن تيمية" },
  {
    text: "العادة هي الفائدة المركّبة لتطوير الذات.",
    author: "جيمس كلير",
  },
];

/* --- persistence ------------------------------------------------------ */
const STORAGE_KEY = "life-os-2027:v3";
const UI_KEY = "life-os-2027:ui";
const HISTORY_CAP = 500;
const STREAK_TARGET = 80;

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
};
const uid = () => Math.random().toString(36).slice(2, 9);

const SEED_HABITS = [
  { id: uid(), label: "شرب ماء", group: "morning", done: false },
  { id: uid(), label: "صلاة الفجر وأذكار", group: "morning", done: false },
  { id: uid(), label: "نادي", group: "morning", done: false },
  { id: uid(), label: "جلسة STEP — ٩٠ دقيقة", group: "morning", done: false },
  { id: uid(), label: "جلسة إنجليزي — ٤٥ دقيقة", group: "morning", done: false },
  { id: uid(), label: "صلاة الظهر", group: "afternoon", done: false },
  { id: uid(), label: "قراءة", group: "afternoon", done: false },
  { id: uid(), label: "صلاة العصر", group: "afternoon", done: false },
  { id: uid(), label: "صلاة المغرب وأذكار", group: "evening", done: false },
  { id: uid(), label: "صلاة العشاء", group: "evening", done: false },
  { id: uid(), label: "تقييم يومي", group: "evening", done: false },
  { id: uid(), label: "الابتعاد عن الشاشات", group: "night", done: false },
  { id: uid(), label: "تدوين", group: "night", done: false },
  { id: uid(), label: "أذكار النوم", group: "night", done: false },
];

const SEED_TASKS = [
  { id: uid(), text: "تسليم تقرير الجامعة", quadrant: "q1", today: true, done: false },
  { id: uid(), text: "مراجعة مكثفة لاختبار STEP", quadrant: "q2", today: true, done: false },
  { id: uid(), text: "بناء صندوق الطوارئ", quadrant: "q2", today: false, done: false },
  { id: uid(), text: "الرد على الرسائل المتراكمة", quadrant: "q3", today: false, done: false },
  { id: uid(), text: "تصفّح مواقع التواصل بلا هدف", quadrant: "q4", today: false, done: false },
];

const SEED_BOOKS = [
  {
    id: uid(),
    title: "العادات الذرية",
    author: "جيمس كلير",
    status: "finished",
    rating: 5,
    lesson: "لا ترتقي إلى أهدافك، بل تهبط إلى مستوى أنظمتك. ابنِ النظام قبل الحلم.",
  },
  {
    id: uid(),
    title: "العمل العميق",
    author: "كال نيوبورت",
    status: "finished",
    rating: 4,
    lesson: "ساعتان بلا تشتت تهزم يومًا كاملًا مشتتًا. احمِ تركيزك كما تحمي مالك.",
  },
  {
    id: uid(),
    title: "الفوائد",
    author: "ابن القيّم",
    status: "reading",
    rating: 5,
    lesson: "القلب يصدأ كما يصدأ الحديد، وجلاؤه الذكر وتلاوة القرآن.",
  },
];

const freshState = (carry = {}) => ({
  date: dayKey(),
  habits: (carry.habits || SEED_HABITS).map((h) => ({ ...h, done: false })),
  tasks: (carry.tasks || SEED_TASKS).map((t) => ({ ...t, done: false })),
  books: carry.books || SEED_BOOKS,
  history: carry.history || [],
  streakBase: carry.streakBase || 0,
  bestStreak: carry.bestStreak || 0,
  dayBanked: false,
});

function loadState() {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    const carry = {
      habits: saved.habits,
      tasks: saved.tasks,
      books: saved.books,
      history: saved.history,
      bestStreak: saved.bestStreak,
    };
    if (saved.date === dayKey()) return { ...freshState(carry), ...saved };
    const continued = saved.date === yesterdayKey() && saved.dayBanked;
    return freshState({
      ...carry,
      streakBase: continued ? (saved.streakBase || 0) + 1 : 0,
    });
  } catch {
    return freshState();
  }
}

const readUI = () => {
  try {
    return JSON.parse(window.localStorage.getItem(UI_KEY) || "{}");
  } catch {
    return {};
  }
};

/* ==================================================================== *
 *  Primitives (shadcn-shaped, dependency-free)
 * ==================================================================== */

function Card({ children, className = "", style, ...rest }) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{ ...GLASS, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

function Btn({
  children,
  variant = "default",
  size = "md",
  className = "",
  style,
  ...rest
}) {
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-[15px] gap-2",
    icon: "p-2",
  };
  const variants = {
    default: {
      background: `linear-gradient(135deg, ${T.primary}, #34D399)`,
      color: "#04140E",
      borderColor: "transparent",
    },
    gold: {
      background: `linear-gradient(135deg, ${T.accent}, #F0DC8A)`,
      color: "#141003",
      borderColor: "transparent",
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
      background: "rgba(239,68,68,0.12)",
      color: T.danger,
      borderColor: "rgba(239,68,68,0.3)",
    },
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl border font-bold transition-all duration-200 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

function Field({ className = "", style, as = "input", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/30 ${className}`}
      style={{ borderColor: T.border, ...style }}
      {...rest}
    />
  );
}

function Badge({ children, tint = T.accent, className = "" }) {
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

function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="los-in relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border p-6 sm:rounded-3xl"
        style={{
          background: "linear-gradient(160deg, #151515, #0B0B0B)",
          borderColor: `${T.accent}30`,
          boxShadow: `0 40px 90px -30px ${T.accent}40`,
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
}

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
              color: n <= value ? T.accent : "rgba(255,255,255,0.2)",
              fill: n <= value ? T.accent : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}

function Checkbox({ checked, onToggle, label, tint = T.primary, size = "md" }) {
  const box = size === "sm" ? 18 : 22;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="group/c flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1.5 text-right transition-colors hover:bg-white/[0.05]"
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-md border transition-all duration-300"
        style={{
          width: box,
          height: box,
          borderColor: checked ? tint : T.borderStrong,
          background: checked ? tint : "transparent",
          boxShadow: checked ? `0 0 12px ${tint}66` : "none",
          transform: checked ? "scale(1.05)" : "scale(1)",
        }}
      >
        <Check
          size={size === "sm" ? 11 : 14}
          strokeWidth={4}
          className="text-black transition-all duration-200"
          style={{
            opacity: checked ? 1 : 0,
            transform: checked ? "scale(1)" : "scale(0.4)",
          }}
        />
      </span>
      <span
        className="min-w-0 flex-1 truncate text-[13.5px] transition-all duration-300"
        style={{
          color: checked ? tint : "rgba(255,255,255,0.82)",
          textDecoration: checked ? "line-through" : "none",
          textDecorationColor: `${tint}80`,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* --- discipline ring -------------------------------------------------- */
function ProgressRing({ value, size = 168, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const hue = value >= STREAK_TARGET ? T.primary : value >= 50 ? T.accent : "#8A7B3F";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="pointer-events-none absolute inset-4 rounded-full blur-2xl transition-opacity duration-700"
        style={{ background: hue, opacity: value >= STREAK_TARGET ? 0.25 : 0.1 }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
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
          stroke={hue}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, Math.max(0, value)) / 100) * c}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1), stroke 500ms",
            filter: `drop-shadow(0 0 12px ${hue}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span
          className="font-extrabold leading-none tabular-nums"
          style={{ fontSize: size * 0.27, color: hue }}
        >
          {value}
          <span className="align-super text-[0.45em] font-bold">%</span>
        </span>
        <span className="mt-1 text-[10.5px] leading-tight text-white/50">
          مؤشر الانضباط
        </span>
      </div>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 1 — Daily routine
 * ==================================================================== */
function RoutineModule({ state, setState, discipline, streak, quote }) {
  const [editing, setEditing] = useState(null); // {id?, label, group}
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const toggle = (id) =>
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
    }));

  const save = () => {
    const label = editing.label.trim();
    if (!label) return;
    setState((s) => ({
      ...s,
      habits: editing.id
        ? s.habits.map((h) =>
            h.id === editing.id ? { ...h, label, group: editing.group } : h
          )
        : [
            ...s.habits,
            { id: uid(), label, group: editing.group, done: false },
          ],
    }));
    setEditing(null);
  };

  const remove = (id) =>
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));

  const done = state.habits.filter((h) => h.done).length;
  const flame =
    discipline >= STREAK_TARGET
      ? { color: T.ember, glow: `drop-shadow(0 0 14px ${T.ember})`, animate: true }
      : discipline >= 50
      ? { color: "#B45309", glow: "none", animate: false }
      : { color: "rgba(255,255,255,0.22)", glow: "none", animate: false };

  return (
    <div className="space-y-6">
      {/* daily cue */}
      <Card className="relative overflow-hidden p-6 text-center sm:p-7">
        <div
          className="pointer-events-none absolute -top-24 right-1/3 h-56 w-56 rounded-full opacity-[0.13] blur-3xl"
          style={{ background: T.accent }}
        />
        <Quote
          size={20}
          className="relative mx-auto mb-2 opacity-25"
          style={{ color: T.accent }}
        />
        <p className="relative mx-auto max-w-2xl text-[15px] font-bold leading-relaxed text-white/85 sm:text-lg">
          {quote.text}
        </p>
        <p className="relative mt-2 text-xs" style={{ color: T.accent }}>
          — {quote.author}
        </p>
      </Card>

      {/* score */}
      <Card className="flex flex-col items-center gap-7 p-6 sm:p-7 lg:flex-row lg:justify-between">
        <div className="text-center lg:text-right">
          <h2 className="text-xl font-extrabold sm:text-2xl">الروتين اليومي</h2>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/40 lg:justify-start">
            <CalendarDays size={13} /> {dateLabel}
          </p>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/35">
            {done} من {state.habits.length} عادة. المؤشر يمتلئ مع كل علامة —
            وعند ٨٠٪ يُحتسب اليوم في سلسلتك.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start">
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2"
              style={{ borderColor: T.border }}
            >
              <Flame
                size={22}
                className={flame.animate ? "los-flame" : ""}
                style={{
                  color: flame.color,
                  filter: flame.glow,
                  transition: "all .5s ease",
                }}
              />
              <span className="text-xl font-extrabold tabular-nums">{streak}</span>
              <span className="text-[11px] text-white/35">يوم متتالٍ</span>
            </div>
            <Btn
              variant="gold"
              size="sm"
              onClick={() => setEditing({ label: "", group: "morning" })}
            >
              <Plus size={14} strokeWidth={3} /> عادة جديدة
            </Btn>
          </div>
        </div>
        <ProgressRing value={discipline} size={176} />
      </Card>

      {/* habit groups */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {GROUPS.map((g) => {
          const list = state.habits.filter((h) => h.group === g.id);
          const gDone = list.filter((h) => h.done).length;
          const Icon = g.icon;
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${g.tint}33`,
                    background: `${g.tint}14`,
                    color: g.tint,
                  }}
                >
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <h3 className="text-[15px] font-bold">{g.label}</h3>
                <span className="mr-auto text-[11px] tabular-nums text-white/30">
                  {gDone}/{list.length}
                </span>
              </div>

              <div
                className="mt-3.5 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: list.length ? `${(gDone / list.length) * 100}%` : "0%",
                    background:
                      gDone === list.length && list.length
                        ? T.primary
                        : g.tint,
                    boxShadow: `0 0 10px ${
                      gDone === list.length && list.length ? T.primary : g.tint
                    }80`,
                  }}
                />
              </div>

              <div className="mt-2 space-y-0.5">
                {list.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-white/25">
                    لا عادات في هذه الفترة بعد
                  </p>
                ) : (
                  list.map((h) => (
                    <div
                      key={h.id}
                      className="group flex items-center gap-1 rounded-lg"
                    >
                      <Checkbox
                        checked={h.done}
                        onToggle={() => toggle(h.id)}
                        label={h.label}
                        tint={T.primary}
                      />
                      <button
                        onClick={() =>
                          setEditing({ id: h.id, label: h.label, group: h.group })
                        }
                        aria-label={`تعديل ${h.label}`}
                        className="shrink-0 rounded p-1.5 text-white/15 opacity-0 transition-all hover:text-white/70 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(h.id)}
                        aria-label={`حذف ${h.label}`}
                        className="shrink-0 rounded p-1.5 text-white/15 opacity-0 transition-all hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل العادة" : "عادة جديدة"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn
              variant="outline"
              className="flex-1"
              onClick={() => setEditing(null)}
            >
              إلغاء
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="los-habit-label"
                className="mb-1.5 block text-xs text-white/45"
              >
                اسم العادة
              </label>
              <Field
                id="los-habit-label"
                value={editing.label}
                autoFocus
                onChange={(e) =>
                  setEditing((s) => ({ ...s, label: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="مثال: قراءة ١٠ صفحات"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-white/45">الفترة</span>
              <div className="grid grid-cols-2 gap-2">
                {GROUPS.map((g) => {
                  const active = editing.group === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setEditing((s) => ({ ...s, group: g.id }))}
                      aria-pressed={active}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] transition-all"
                      style={{
                        borderColor: active ? `${g.tint}80` : T.border,
                        background: active ? `${g.tint}16` : "transparent",
                        color: active ? g.tint : T.muted,
                      }}
                    >
                      <g.icon size={15} /> {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 2 — Eisenhower matrix
 * ==================================================================== */
function TaskChip({ task, onToggleToday, onToggleDone, onDelete, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-200 hover:border-white/25"
      style={{
        borderColor: task.done ? `${T.primary}40` : T.border,
        background: task.done ? `${T.primary}0D` : "rgba(255,255,255,0.03)",
        cursor: "grab",
      }}
    >
      <GripVertical
        size={13}
        className="shrink-0 text-white/15 transition-colors group-hover:text-white/35"
      />
      <Checkbox
        checked={task.done}
        onToggle={onToggleDone}
        label={task.text}
        size="sm"
      />
      <button
        onClick={onToggleToday}
        aria-pressed={task.today}
        aria-label="إضافة إلى مهام اليوم"
        title="مهام اليوم"
        className="shrink-0 rounded p-1 transition-colors"
        style={{ color: task.today ? T.accent : "rgba(255,255,255,0.15)" }}
      >
        <Target size={14} strokeWidth={task.today ? 2.6 : 2} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`حذف ${task.text}`}
        className="shrink-0 rounded p-1 text-white/15 opacity-0 transition-all hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function MatrixModule({ state, setState }) {
  const [draft, setDraft] = useState("");
  const [draftQ, setDraftQ] = useState("q2");
  const [over, setOver] = useState(null);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        { id: uid(), text, quadrant: draftQ, today: false, done: false },
      ],
    }));
    setDraft("");
  };

  const patch = (id, p) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  const remove = (id) =>
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

  const onDrop = (zone) => (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setOver(null);
    if (!id) return;
    if (zone === "today") patch(id, { today: true });
    else patch(id, { quadrant: zone, today: false });
  };

  const dragProps = (zone) => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== zone) setOver(zone);
    },
    onDragLeave: () => setOver((o) => (o === zone ? null : o)),
    onDrop: onDrop(zone),
  });

  const todayList = state.tasks.filter((t) => t.today);
  const todayDone = todayList.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-extrabold sm:text-2xl">مصفوفة المهام</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-white/40">
          صنّف كل مهمة بصدق، ثم اسحبها إلى «مهام اليوم» — أو اضغط أيقونة الهدف
          <Target size={12} className="mx-1 inline" /> على الجوال.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            id="los-task-new"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="مهمة جديدة…"
          />
          <div className="flex gap-2">
            <select
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              aria-label="الربع"
              className="rounded-xl border bg-transparent px-3 py-2.5 text-xs outline-none"
              style={{ borderColor: T.border, color: T.muted }}
            >
              {QUADRANTS.map((q) => (
                <option key={q.id} value={q.id} style={{ background: T.cardSolid }}>
                  {q.label}
                </option>
              ))}
            </select>
            <Btn variant="gold" onClick={add} className="shrink-0">
              <Plus size={15} strokeWidth={3} /> إضافة
            </Btn>
          </div>
        </div>
      </Card>

      {/* today's focus — the drop target that matters */}
      <Card
        {...dragProps("today")}
        className="p-5 transition-all duration-200 sm:p-6"
        style={{
          ...GLASS,
          borderColor: over === "today" ? T.accent : `${T.accent}38`,
          background:
            over === "today"
              ? `${T.accent}1A`
              : "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,255,255,0.03))",
          boxShadow: over === "today" ? `0 0 40px -12px ${T.accent}` : "none",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{
                borderColor: `${T.accent}45`,
                background: `${T.accent}16`,
                color: T.accent,
              }}
            >
              <Target size={19} />
            </span>
            <div>
              <h3 className="text-base font-bold" style={{ color: T.accent }}>
                مهام اليوم
              </h3>
              <p className="text-[11px] text-white/40">
                أفلت المهام هنا. ثلاث مهام حقيقية تكفي.
              </p>
            </div>
          </div>
          <Badge tint={todayDone === todayList.length && todayList.length ? T.primary : T.accent}>
            {todayDone}/{todayList.length} منجزة
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          {todayList.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-xs text-white/25"
              style={{ borderColor: T.border }}
            >
              اسحب مهمة من أي ربع إلى هنا
            </p>
          ) : (
            todayList.map((t) => (
              <TaskChip
                key={t.id}
                task={t}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                onToggleDone={() => patch(t.id, { done: !t.done })}
                onToggleToday={() => patch(t.id, { today: false })}
                onDelete={() => remove(t.id)}
              />
            ))
          )}
        </div>
      </Card>

      {/* four quadrants */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {QUADRANTS.map((q) => {
          const list = state.tasks.filter((t) => t.quadrant === q.id);
          const Icon = q.icon;
          return (
            <Card
              key={q.id}
              {...dragProps(q.id)}
              className="flex min-h-[200px] flex-col p-5 transition-all duration-200"
              style={{
                ...GLASS,
                borderColor: over === q.id ? q.tint : T.border,
                background:
                  over === q.id ? `${q.tint}14` : T.card,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: `${q.tint}33`,
                    background: `${q.tint}14`,
                    color: q.tint,
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-bold" style={{ color: q.tint }}>
                    {q.label}
                  </h3>
                  <p className="text-[10.5px] text-white/35">{q.action}</p>
                </div>
                <span className="mr-auto shrink-0 text-[11px] tabular-nums text-white/25">
                  {list.length}
                </span>
              </div>

              <div className="mt-4 flex-1 space-y-2">
                {list.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-white/20">
                    فارغ
                  </p>
                ) : (
                  list.map((t) => (
                    <TaskChip
                      key={t.id}
                      task={t}
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", t.id)
                      }
                      onToggleDone={() => patch(t.id, { done: !t.done })}
                      onToggleToday={() => patch(t.id, { today: !t.today })}
                      onDelete={() => remove(t.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 3 — Book vault
 * ==================================================================== */
const BOOK_STATUS = {
  planned: { label: "أنوي قراءته", tint: "#A855F7" },
  reading: { label: "أقرأه الآن", tint: "#3B82F6" },
  finished: { label: "أنهيته", tint: T.primary },
};

function VaultModule({ state, setState }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  const save = () => {
    const title = editing.title.trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      books: editing.id
        ? s.books.map((b) => (b.id === editing.id ? { ...editing, title } : b))
        : [{ ...editing, id: uid(), title }, ...s.books],
    }));
    setEditing(null);
  };

  const patch = (next) =>
    setState((s) => ({
      ...s,
      books: s.books.map((b) => (b.id === next.id ? next : b)),
    }));

  const remove = (id) =>
    setState((s) => ({ ...s, books: s.books.filter((b) => b.id !== id) }));

  const shown =
    filter === "all" ? state.books : state.books.filter((b) => b.status === filter);
  const finished = state.books.filter((b) => b.status === "finished").length;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-extrabold sm:text-2xl">مكتبة الإنجازات</h2>
          <p className="mt-1.5 text-xs text-white/40">
            {finished} كتابًا مُنهًى من {state.books.length}. الكتاب بلا درس
            مكتوب لم يُقرأ.
          </p>
        </div>
        <Btn
          variant="gold"
          onClick={() =>
            setEditing({
              title: "",
              author: "",
              status: "planned",
              rating: 0,
              lesson: "",
            })
          }
        >
          <Plus size={15} strokeWidth={3} /> أضف كتابًا
        </Btn>
      </Card>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "الكل", tint: T.accent },
          ...Object.entries(BOOK_STATUS).map(([id, v]) => ({
            id,
            label: v.label,
            tint: v.tint,
          })),
        ].map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className="rounded-xl border px-4 py-2 text-xs font-bold transition-all"
              style={{
                borderColor: active ? `${f.tint}70` : T.border,
                background: active ? `${f.tint}16` : "rgba(255,255,255,0.03)",
                color: active ? f.tint : T.muted,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <Card className="py-14 text-center text-xs text-white/25">
          لا كتب في هذا التصنيف بعد.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {shown.map((b) => {
            const meta = BOOK_STATUS[b.status] || BOOK_STATUS.planned;
            return (
              <Card
                key={b.id}
                className="group flex gap-4 p-4 transition-all duration-500 hover:-translate-y-1"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${T.accent}59`;
                  e.currentTarget.style.boxShadow = `0 18px 50px -22px ${T.accent}88`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* spine + cover */}
                <div
                  className="relative flex h-[132px] w-[92px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border p-2 text-center"
                  style={{
                    borderColor: `${meta.tint}33`,
                    background: `linear-gradient(145deg, ${meta.tint}26, rgba(0,0,0,.7))`,
                  }}
                >
                  <span
                    className="absolute inset-y-0 right-0 w-[6px]"
                    style={{ background: `${meta.tint}66` }}
                  />
                  <span
                    className="text-3xl font-black leading-none"
                    style={{ color: `${meta.tint}DD` }}
                  >
                    {b.title.trim().charAt(0) || "؟"}
                  </span>
                  <span className="mt-2 line-clamp-2 text-[9px] leading-tight text-white/40">
                    {b.title}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-bold text-white/90">
                        {b.title}
                      </h3>
                      <p className="truncate text-[11px] text-white/35">
                        {b.author || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        onClick={() => setEditing({ ...b })}
                        aria-label={`تعديل ${b.title}`}
                        className="rounded p-1.5 text-white/15 transition-colors hover:text-white/70"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(b.id)}
                        aria-label={`حذف ${b.title}`}
                        className="rounded p-1.5 text-white/15 transition-colors hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={b.status}
                      onChange={(e) => patch({ ...b, status: e.target.value })}
                      aria-label={`حالة ${b.title}`}
                      className="rounded-md border bg-transparent px-2 py-0.5 text-[10.5px] outline-none"
                      style={{
                        borderColor: `${meta.tint}44`,
                        color: meta.tint,
                        background: `${meta.tint}12`,
                      }}
                    >
                      {Object.entries(BOOK_STATUS).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: T.cardSolid }}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <StarRating
                      value={b.rating}
                      onChange={(rating) => patch({ ...b, rating })}
                    />
                  </div>

                  <div className="mt-2.5 flex-1">
                    <label
                      htmlFor={`los-lesson-${b.id}`}
                      className="mb-1 block text-[10px]"
                      style={{ color: `${T.accent}AA` }}
                    >
                      أهم درس يغيّر حياتي
                    </label>
                    <textarea
                      id={`los-lesson-${b.id}`}
                      value={b.lesson}
                      onChange={(e) => patch({ ...b, lesson: e.target.value })}
                      rows={3}
                      placeholder="اكتب الدرس الواحد الذي ستطبّقه…"
                      className="w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-[11.5px] leading-relaxed text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الكتاب" : "كتاب جديد"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label htmlFor="los-b-title" className="mb-1.5 block text-xs text-white/45">
                العنوان
              </label>
              <Field
                id="los-b-title"
                autoFocus
                value={editing.title}
                onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                placeholder="مثال: العادات الذرية"
              />
            </div>
            <div>
              <label htmlFor="los-b-author" className="mb-1.5 block text-xs text-white/45">
                المؤلف
              </label>
              <Field
                id="los-b-author"
                value={editing.author}
                onChange={(e) => setEditing((s) => ({ ...s, author: e.target.value }))}
                placeholder="مثال: جيمس كلير"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/45">التقييم</span>
              <StarRating
                value={editing.rating}
                size={18}
                onChange={(rating) => setEditing((s) => ({ ...s, rating }))}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-white/45">الحالة</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(BOOK_STATUS).map(([k, v]) => {
                  const active = editing.status === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setEditing((s) => ({ ...s, status: k }))}
                      aria-pressed={active}
                      className="rounded-xl border px-2 py-2 text-[11.5px] font-bold transition-all"
                      style={{
                        borderColor: active ? `${v.tint}80` : T.border,
                        background: active ? `${v.tint}16` : "transparent",
                        color: active ? v.tint : T.muted,
                      }}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="los-b-lesson" className="mb-1.5 block text-xs text-white/45">
                أهم درس يغيّر حياتي
              </label>
              <Field
                as="textarea"
                id="los-b-lesson"
                rows={3}
                value={editing.lesson}
                onChange={(e) => setEditing((s) => ({ ...s, lesson: e.target.value }))}
                placeholder="الدرس الواحد الذي ستطبّقه…"
                className="resize-none leading-relaxed"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 4 — Analytics
 * ==================================================================== */
const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const WEEK_LABELS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

const levelOf = (pct) =>
  pct >= 90 ? 4 : pct >= 70 ? 3 : pct >= 45 ? 2 : pct > 0 ? 1 : 0;
const LEVEL_BG = [
  "rgba(255,255,255,0.04)",
  "rgba(16,185,129,0.28)",
  "rgba(16,185,129,0.5)",
  "rgba(16,185,129,0.74)",
  "#10B981",
];

function AnalyticsModule({ state, discipline, streak }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });

  const byDate = useMemo(() => {
    const map = new Map((state.history || []).map((h) => [h.date, h.pct]));
    map.set(dayKey(), discipline); // today is live, not yet archived
    return map;
  }, [state.history, discipline]);

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const lead = (first.getDay() + 1) % 7; // week starts Saturday
    const cells = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dayKey(new Date(cursor.y, cursor.m, d));
      cells.push({ d, ds, pct: byDate.get(ds) });
    }
    return cells;
  }, [cursor, byDate]);

  const monthStats = useMemo(() => {
    const vals = grid.filter((c) => c && c.pct !== undefined).map((c) => c.pct);
    return {
      tracked: vals.length,
      avg: vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0,
      best: vals.length ? Math.max(...vals) : 0,
      hit: vals.filter((v) => v >= STREAK_TARGET).length,
    };
  }, [grid]);

  const yearBars = useMemo(() => {
    return AR_MONTHS.map((label, m) => {
      const vals = (state.history || [])
        .filter((h) => {
          const [y, mm] = h.date.split("-").map(Number);
          return y === cursor.y && mm - 1 === m;
        })
        .map((h) => h.pct);
      return {
        label,
        avg: vals.length
          ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          : 0,
        n: vals.length,
      };
    });
  }, [state.history, cursor.y]);

  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-extrabold sm:text-2xl">التتبع الشهري</h2>
        <p className="mt-1.5 text-xs text-white/40">
          كل مربّع يوم من عمرك. الفراغات هي ما ستندم عليه — لا الأخطاء.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "متوسط الشهر", v: `${monthStats.avg}%`, c: T.accent, icon: TrendingUp },
          { k: "أفضل يوم", v: `${monthStats.best}%`, c: T.primary, icon: Star },
          { k: "أيام فوق ٨٠٪", v: String(monthStats.hit), c: T.primary, icon: Check },
          { k: "السلسلة الحالية", v: String(streak), c: T.ember, icon: Flame },
        ].map((s) => (
          <Card key={s.k} className="p-4">
            <div className="flex items-center gap-2">
              <s.icon size={13} style={{ color: s.c }} />
              <p className="text-[10.5px] text-white/40">{s.k}</p>
            </div>
            <p
              className="mt-1.5 text-2xl font-extrabold tabular-nums"
              style={{ color: s.c }}
            >
              {s.v}
            </p>
          </Card>
        ))}
      </div>

      {/* month grid */}
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <Btn variant="outline" size="icon" onClick={() => shift(1)} aria-label="الشهر التالي">
            <ChevronLeft size={16} />
          </Btn>
          <h3 className="text-base font-bold">
            {AR_MONTHS[cursor.m]}{" "}
            <span className="tabular-nums text-white/40">{cursor.y}</span>
          </h3>
          <Btn variant="outline" size="icon" onClick={() => shift(-1)} aria-label="الشهر السابق">
            <ChevronRight size={16} />
          </Btn>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEK_LABELS.map((w) => (
            <span key={w} className="pb-1 text-[10px] text-white/25">
              {w}
            </span>
          ))}
          {grid.map((cell, i) =>
            cell === null ? (
              <span key={`e${i}`} />
            ) : (
              <div
                key={cell.ds}
                title={
                  cell.pct === undefined
                    ? `${cell.ds} — لا سجلّ`
                    : `${cell.ds} — ${cell.pct}٪`
                }
                className="flex aspect-square items-center justify-center rounded-lg border text-[11px] font-bold tabular-nums transition-transform duration-150 hover:scale-110"
                style={{
                  background: LEVEL_BG[levelOf(cell.pct ?? 0)],
                  borderColor:
                    cell.ds === dayKey() ? T.accent : "rgba(255,255,255,0.06)",
                  color:
                    (cell.pct ?? 0) >= 45
                      ? "#04140E"
                      : "rgba(255,255,255,0.35)",
                }}
              >
                {cell.d}
              </div>
            )
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
          <span>الإطار الذهبي = اليوم</span>
          <span className="flex items-center gap-1.5">
            أقل
            {LEVEL_BG.map((c, i) => (
              <span
                key={i}
                className="h-[11px] w-[11px] rounded-[3px]"
                style={{ background: c }}
              />
            ))}
            أكثر
          </span>
        </div>
      </Card>

      {/* year overview */}
      <Card className="p-5 sm:p-6">
        <h3 className="text-sm font-bold text-white/70">
          متوسط كل شهر في {cursor.y}
        </h3>
        <div className="mt-5 flex h-32 items-end gap-1.5">
          {yearBars.map((b, i) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-full w-full items-end">
                <div
                  title={`${b.label}: ${b.avg}٪ (${b.n} يوم)`}
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(3, b.avg)}%`,
                    background:
                      b.avg >= STREAK_TARGET
                        ? T.primary
                        : b.avg > 0
                        ? T.accent
                        : "rgba(255,255,255,0.06)",
                    opacity: i === cursor.m ? 1 : 0.65,
                  }}
                />
              </div>
              <span className="text-[8.5px] text-white/25">{b.label.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ==================================================================== *
 *  ROOT
 * ==================================================================== */
export default function LifeOS() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState(() => readUI().tab || "routine");
  const [collapsed, setCollapsed] = useState(() => !!readUI().collapsed);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage blocked — the session still works */
    }
  }, [state]);

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_KEY, JSON.stringify({ tab, collapsed }));
    } catch {
      /* per-viewer convenience only */
    }
  }, [tab, collapsed]);

  const habitsDone = state.habits.filter((h) => h.done).length;
  const discipline = state.habits.length
    ? Math.round((habitsDone / state.habits.length) * 100)
    : 0;

  /* archive today's score continuously so analytics never needs a save button */
  useEffect(() => {
    setState((s) => {
      const today = dayKey();
      const rest = (s.history || []).filter((h) => h.date !== today);
      const next = [...rest, { date: today, pct: discipline }].slice(-HISTORY_CAP);
      return { ...s, history: next };
    });
  }, [discipline]);

  useEffect(() => {
    if (discipline >= STREAK_TARGET && !state.dayBanked) {
      setState((s) => {
        const n = s.streakBase + 1;
        return { ...s, dayBanked: true, bestStreak: Math.max(s.bestStreak || 0, n) };
      });
    }
  }, [discipline, state.dayBanked]);

  const streak = state.streakBase + (state.dayBanked ? 1 : 0);

  const quote = useMemo(() => {
    const now = new Date();
    const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    return QUOTES[doy % QUOTES.length];
  }, []);

  const resetDay = useCallback(() => {
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => ({ ...h, done: false })),
      tasks: s.tasks.map((t) => ({ ...t, done: false })),
    }));
  }, []);

  const go = (id) => {
    setTab(id);
    setDrawer(false);
  };

  const active = NAV.find((n) => n.id === tab) || NAV[0];

  const NavList = ({ showLabels }) => (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((n) => {
        const on = n.id === tab;
        const Icon = n.icon;
        return (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            aria-current={on ? "page" : undefined}
            title={showLabels ? undefined : n.label}
            className="group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition-all duration-200"
            style={{
              borderColor: on ? `${T.primary}59` : "transparent",
              background: on ? `${T.primary}16` : "transparent",
              color: on ? T.primary : T.muted,
            }}
            onMouseEnter={(e) => {
              if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseLeave={(e) => {
              if (!on) e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon size={18} strokeWidth={on ? 2.3 : 1.9} className="shrink-0" />
            {showLabels && (
              <span className="truncate text-[13.5px] font-bold">{n.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full text-white antialiased"
      style={{
        background:
          "radial-gradient(1100px 560px at 70% -8%, #18181C 0%, #0A0A0A 58%, #0A0A0A 100%)",
        fontFamily:
          "'Tajawal', 'Cairo', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700&display=swap');
        @keyframes losFlame { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.15) rotate(3deg); } }
        .los-flame { animation: losFlame 1.6s ease-in-out infinite; }
        @keyframes losIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .los-in { animation: losIn .3s cubic-bezier(.22,1,.36,1) both; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media (prefers-reduced-motion: reduce) {
          .los-flame, .los-in { animation: none !important; }
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* ---------- sidebar (desktop) ---------- */}
        <aside
          className="sticky top-0 hidden h-screen shrink-0 flex-col border-l p-4 transition-all duration-300 lg:flex"
          style={{
            width: collapsed ? 80 : 268,
            borderColor: T.border,
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="mb-7 flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "توسيع القائمة" : "طيّ القائمة"}
              aria-expanded={!collapsed}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.accent }}
            >
              <Menu size={18} />
            </button>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold leading-tight">
                  2027 <span style={{ color: T.accent }}>Life OS</span>
                </p>
                <p className="truncate text-[10px] text-white/30">
                  وقت حصاد الثمار
                </p>
              </div>
            )}
          </div>

          <NavList showLabels={!collapsed} />

          <div className="mt-auto space-y-3">
            {!collapsed && (
              <div
                className="rounded-2xl border p-4 text-center"
                style={{ borderColor: T.border, background: T.card }}
              >
                <p className="text-[10px] text-white/35">مؤشر اليوم</p>
                <p
                  className="text-3xl font-extrabold tabular-nums"
                  style={{
                    color: discipline >= STREAK_TARGET ? T.primary : T.accent,
                  }}
                >
                  {discipline}%
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                  <Flame
                    size={13}
                    style={{
                      color: discipline >= STREAK_TARGET ? T.ember : "rgba(255,255,255,.25)",
                    }}
                  />
                  {streak} يوم متتالٍ
                </div>
              </div>
            )}
            <Btn
              variant="ghost"
              size="sm"
              onClick={resetDay}
              className="w-full"
              style={{ borderColor: T.border }}
              title="تصفير اليوم"
            >
              <RotateCcw size={13} />
              {!collapsed && "تصفير اليوم"}
            </Btn>
          </div>
        </aside>

        {/* ---------- drawer (mobile) ---------- */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setDrawer(false)}
            />
            <aside
              className="los-in absolute bottom-0 right-0 top-0 flex w-[76%] max-w-[300px] flex-col border-l p-4"
              style={{
                borderColor: T.border,
                background: "linear-gradient(160deg, #141414, #0A0A0A)",
              }}
            >
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-extrabold leading-tight">
                    2027 <span style={{ color: T.accent }}>Life OS</span>
                  </p>
                  <p className="text-[10px] text-white/30">وقت حصاد الثمار</p>
                </div>
                <button
                  onClick={() => setDrawer(false)}
                  aria-label="إغلاق القائمة"
                  className="rounded-xl border p-2 text-white/50"
                  style={{ borderColor: T.border }}
                >
                  <X size={16} />
                </button>
              </div>
              <NavList showLabels />
              <div className="mt-auto">
                <Btn variant="outline" size="sm" onClick={resetDay} className="w-full">
                  <RotateCcw size={13} /> تصفير اليوم
                </Btn>
              </div>
            </aside>
          </div>
        )}

        {/* ---------- main ---------- */}
        <main className="min-w-0 flex-1">
          {/* mobile topbar */}
          <div
            className="sticky z-40 flex items-center justify-between gap-3 border-b px-4 py-3 lg:hidden"
            style={{
              top: "env(safe-area-inset-top, 0px)",
              borderColor: T.border,
              background: "rgba(10,10,10,0.85)",
              backdropFilter: "blur(14px)",
            }}
          >
            <button
              onClick={() => setDrawer(true)}
              aria-label="فتح القائمة"
              className="flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{ borderColor: T.border, color: T.accent }}
            >
              <Menu size={18} />
            </button>
            <span className="truncate text-sm font-bold">{active.label}</span>
            <span
              className="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums"
              style={{
                borderColor: T.border,
                color: discipline >= STREAK_TARGET ? T.primary : T.accent,
              }}
            >
              {discipline}%
            </span>
          </div>

          <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-10">
            <div key={tab} className="los-in">
              {tab === "routine" && (
                <RoutineModule
                  state={state}
                  setState={setState}
                  discipline={discipline}
                  streak={streak}
                  quote={quote}
                />
              )}
              {tab === "matrix" && (
                <MatrixModule state={state} setState={setState} />
              )}
              {tab === "vault" && <VaultModule state={state} setState={setState} />}
              {tab === "analytics" && (
                <AnalyticsModule
                  state={state}
                  discipline={discipline}
                  streak={streak}
                />
              )}
            </div>

            <footer className="mt-14 text-center text-[11px] text-white/20">
              2027 Life OS · الانضباط حرية مؤجّلة
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
