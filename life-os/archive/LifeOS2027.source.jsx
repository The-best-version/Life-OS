import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen,
  HeartPulse,
  Briefcase,
  Wallet,
  Users,
  Sparkles,
  Flame,
  Check,
  Target,
  Activity,
  ChevronDown,
  RotateCcw,
  Trophy,
  CalendarDays,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/* ------------------------------------------------------------------ *
 *  2027 LIFE OS — Zen Dark Discipline Dashboard (RTL)
 *  Stack: React + Tailwind CSS + lucide-react + recharts
 *  Install: npm i lucide-react recharts
 * ------------------------------------------------------------------ */

/* --- Design tokens -------------------------------------------------- */
const GOLD = "#D4AF37";
const EMERALD = "#10B981";
const EMBER = "#F97316";
const GLASS = "rgba(255,255,255,0.03)";
const HAIRLINE = "rgba(255,255,255,0.07)";

/* --- The 6 Pillars of 2027 ------------------------------------------ */
const PILLARS = [
  {
    id: "religious",
    ar: "الدينية",
    en: "Religious",
    icon: BookOpen,
    tint: "#D4AF37",
    habits: [
      { id: "rel-1", ar: "الصلوات الخمس في وقتها", en: "5 prayers on time" },
      { id: "rel-2", ar: "ورد يومي • صفحة قرآن", en: "1 page of Quran" },
    ],
  },
  {
    id: "health",
    ar: "الصحية",
    en: "Health",
    icon: HeartPulse,
    tint: "#EF4444",
    habits: [
      { id: "hea-1", ar: "٣٠ دقيقة حركة أو تمرين", en: "30 min movement" },
      { id: "hea-2", ar: "٧ ساعات نوم + ٢ لتر ماء", en: "7h sleep + 2L water" },
    ],
  },
  {
    id: "professional",
    ar: "المهنية",
    en: "Professional",
    icon: Briefcase,
    tint: "#3B82F6",
    habits: [
      { id: "pro-1", ar: "٩٠ دقيقة عمل عميق بلا هاتف", en: "90 min deep work" },
      { id: "pro-2", ar: "تعلّم مهارة • ٢٠ دقيقة", en: "20 min skill building" },
    ],
  },
  {
    id: "financial",
    ar: "المالية",
    en: "Financial",
    icon: Wallet,
    tint: "#22D3EE",
    habits: [
      { id: "fin-1", ar: "تسجيل كل مصروف اليوم", en: "Log every expense" },
      { id: "fin-2", ar: "ادّخار ١٠٪ قبل الإنفاق", en: "Save 10% first" },
    ],
  },
  {
    id: "social",
    ar: "الاجتماعية",
    en: "Social",
    icon: Users,
    tint: "#A855F7",
    habits: [
      { id: "soc-1", ar: "تواصل صادق مع الأهل", en: "Connect with family" },
      { id: "soc-2", ar: "إحسان واحد بلا مقابل", en: "One act of service" },
    ],
  },
  {
    id: "personal",
    ar: "الذاتية",
    en: "Personal",
    icon: Sparkles,
    tint: "#F59E0B",
    habits: [
      { id: "per-1", ar: "قراءة ١٠ صفحات", en: "Read 10 pages" },
      { id: "per-2", ar: "تدوين وامتنان • ٥ دقائق", en: "5 min journaling" },
    ],
  },
];

const ALL_HABITS = PILLARS.flatMap((p) => p.habits.map((h) => h.id));
const TOTAL_HABITS = ALL_HABITS.length; // 12
const DISCIPLINE_TARGET = 80; // % required to bank a streak day

/* --- Persistence ---------------------------------------------------- */
const STORAGE_KEY = "life-os-2027:v1";

const dayKey = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const blankHabits = () =>
  ALL_HABITS.reduce((acc, id) => ({ ...acc, [id]: false }), {});

const DEFAULT_TASKS = [
  { id: "t1", text: "", done: false },
  { id: "t2", text: "", done: false },
  { id: "t3", text: "", done: false },
];

/* Mock weekly audit data — overwritten the moment you save a reflection */
const DEFAULT_SCORES = {
  religious: 8,
  health: 6,
  professional: 9,
  financial: 5,
  social: 6,
  personal: 7,
};
const LAST_WEEK_SCORES = {
  religious: 6,
  health: 4,
  professional: 8,
  financial: 4,
  social: 5,
  personal: 5,
};

const freshState = (carry = {}) => ({
  date: dayKey(),
  habits: blankHabits(),
  tasks: DEFAULT_TASKS.map((t) => ({ ...t })),
  scores: carry.scores || DEFAULT_SCORES,
  streakBase: carry.streakBase || 0,
  dayBanked: false,
});

function loadState() {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    if (saved.date === dayKey()) {
      return {
        ...freshState(),
        ...saved,
        habits: { ...blankHabits(), ...(saved.habits || {}) },
        tasks:
          Array.isArray(saved.tasks) && saved.tasks.length === 3
            ? saved.tasks
            : DEFAULT_TASKS.map((t) => ({ ...t })),
      };
    }
    // New day: the chain survives only if yesterday was banked.
    const continued = saved.date === dayKey(-1) && saved.dayBanked;
    return freshState({
      scores: saved.scores,
      streakBase: continued ? saved.streakBase + 1 : 0,
    });
  } catch {
    return freshState();
  }
}

/* --- Discipline ring ------------------------------------------------- */
function ProgressRing({ value, size = 200, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const hue = value >= DISCIPLINE_TARGET ? EMERALD : GOLD;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="losRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={hue} />
            <stop
              offset="100%"
              stopColor={value >= DISCIPLINE_TARGET ? "#34D399" : "#F5D97A"}
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
          stroke="url(#losRingGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)",
            filter: `drop-shadow(0 0 10px ${hue}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-extrabold leading-none tabular-nums"
          style={{ fontSize: size * 0.26, color: hue }}
        >
          {value}
          <span className="align-super text-[0.45em] font-bold">%</span>
        </span>
        <span className="mt-1 text-[11px] tracking-[0.22em] text-white/40">
          DISCIPLINE
        </span>
        <span className="text-xs text-white/55">درجة الانضباط</span>
      </div>
    </div>
  );
}

/* --- Micro-habit row ------------------------------------------------- */
function HabitRow({ habit, checked, onToggle, tint }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group/h flex w-full items-center gap-3 rounded-xl px-2 py-2 text-right transition-colors hover:bg-white/[0.04]"
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300"
        style={{
          borderColor: checked ? EMERALD : "rgba(255,255,255,0.18)",
          background: checked ? EMERALD : "transparent",
          boxShadow: checked ? `0 0 12px ${EMERALD}59` : "none",
          transform: checked ? "scale(1.06)" : "scale(1)",
        }}
      >
        <Check
          size={13}
          strokeWidth={3.5}
          className="text-black transition-all duration-200"
          style={{
            opacity: checked ? 1 : 0,
            transform: checked ? "scale(1)" : "scale(0.5)",
          }}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[13px] transition-all duration-300"
          style={{
            color: checked ? EMERALD : "rgba(255,255,255,0.78)",
            textDecoration: checked ? "line-through" : "none",
            textDecorationColor: `${EMERALD}80`,
          }}
        >
          {habit.ar}
        </span>
        <span
          dir="ltr"
          className="block truncate text-right text-[10px] text-white/30"
        >
          {habit.en}
        </span>
      </span>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full opacity-0 transition-opacity group-hover/h:opacity-100"
        style={{ background: tint }}
      />
    </button>
  );
}

/* --- Pillar card ----------------------------------------------------- */
function PillarCard({ pillar, habits, onToggle }) {
  const Icon = pillar.icon;
  const done = pillar.habits.filter((h) => habits[h.id]).length;
  const pct = (done / pillar.habits.length) * 100;
  const complete = done === pillar.habits.length;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1"
      style={{
        background: GLASS,
        borderColor: complete ? `${EMERALD}4D` : HAIRLINE,
        backdropFilter: "blur(14px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = complete
          ? `${EMERALD}99`
          : `${pillar.tint}66`;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${pillar.tint}22, 0 18px 50px -20px ${pillar.tint}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = complete
          ? `${EMERALD}4D`
          : HAIRLINE;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-30"
        style={{ background: pillar.tint }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-500 group-hover:scale-110"
            style={{
              borderColor: `${pillar.tint}33`,
              background: `${pillar.tint}14`,
              color: pillar.tint,
            }}
          >
            <Icon size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h3 className="text-base font-bold text-white/90">{pillar.ar}</h3>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
              {pillar.en}
            </p>
          </div>
        </div>
        {complete ? (
          <Trophy size={16} style={{ color: GOLD }} className="mt-1 animate-pulse" />
        ) : (
          <span className="mt-1 text-[11px] tabular-nums text-white/35">
            {done}/{pillar.habits.length}
          </span>
        )}
      </div>

      {/* micro-habit progress */}
      <div className="relative mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: complete
              ? `linear-gradient(90deg, ${EMERALD}, #34D399)`
              : `linear-gradient(90deg, ${pillar.tint}, ${pillar.tint}99)`,
            boxShadow: `0 0 10px ${complete ? EMERALD : pillar.tint}80`,
          }}
        />
      </div>

      <div className="relative mt-3 space-y-0.5">
        {pillar.habits.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            tint={pillar.tint}
            checked={!!habits[h.id]}
            onToggle={() => onToggle(h.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* --- 80/20 task row -------------------------------------------------- */
function TaskRow({ task, index, onToggle, onText }) {
  return (
    <div
      className="group flex items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-300"
      style={{
        background: task.done ? `${EMERALD}0D` : "rgba(255,255,255,0.02)",
        borderColor: task.done ? `${EMERALD}40` : HAIRLINE,
      }}
    >
      <span
        className="w-5 shrink-0 text-center text-xs font-black tabular-nums"
        style={{ color: task.done ? `${EMERALD}80` : `${GOLD}80` }}
      >
        {index + 1}
      </span>

      <button
        type="button"
        onClick={onToggle}
        aria-label={`إنجاز المهمة ${index + 1}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 active:scale-90"
        style={{
          borderColor: task.done ? EMERALD : "rgba(255,255,255,0.2)",
          background: task.done ? EMERALD : "transparent",
          boxShadow: task.done ? `0 0 18px ${EMERALD}66` : "none",
        }}
      >
        <Check
          size={16}
          strokeWidth={3.5}
          className="text-black transition-all duration-200"
          style={{
            opacity: task.done ? 1 : 0,
            transform: task.done ? "scale(1)" : "scale(0.4)",
          }}
        />
      </button>

      <input
        id={`los-task-${index + 1}`}
        value={task.text}
        onChange={(e) => onText(e.target.value)}
        placeholder={`المهمة المحورية رقم ${index + 1}…`}
        className="w-full bg-transparent text-sm outline-none transition-all duration-300 placeholder:text-white/20"
        style={{
          color: task.done ? EMERALD : "rgba(255,255,255,0.9)",
          textDecoration: task.done ? "line-through" : "none",
          textDecorationColor: `${EMERALD}80`,
        }}
      />
    </div>
  );
}

/* --- Radar tooltip --------------------------------------------------- */
function RadarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      dir="rtl"
      className="rounded-xl border px-3 py-2 text-xs shadow-2xl"
      style={{
        background: "rgba(10,10,10,0.94)",
        borderColor: `${GOLD}40`,
        backdropFilter: "blur(8px)",
      }}
    >
      <p className="mb-1 font-bold text-white/90">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="flex items-center gap-2 text-white/60"
        >
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}:{" "}
          <strong className="tabular-nums text-white/90">{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* --- Balance radar (Recharts) ---------------------------------------- */
function BalanceRadar({ scores, previous }) {
  const data = useMemo(
    () =>
      PILLARS.map((p) => ({
        pillar: p.ar,
        current: scores[p.id],
        previous: previous[p.id],
      })),
    [scores, previous]
  );

  return (
    <div className="h-[340px] w-full sm:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="pillar"
            tick={{
              fill: "rgba(255,255,255,0.6)",
              fontSize: 12,
              fontWeight: 600,
            }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tickCount={6}
            angle={90}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.22)", fontSize: 9 }}
          />
          <Radar
            name="الأسبوع الماضي"
            dataKey="previous"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="none"
            isAnimationActive={false}
          />
          <Radar
            name="هذا الأسبوع"
            dataKey="current"
            stroke={GOLD}
            strokeWidth={2}
            fill={GOLD}
            fillOpacity={0.26}
            dot={{ r: 3, fill: GOLD, stroke: "none" }}
            animationDuration={700}
          />
          <Tooltip content={<RadarTooltip />} cursor={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --- Weekly reflection (inline section) ------------------------------ */
function ReflectionSection({ open, initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  if (!open) return null;

  const avg = (
    PILLARS.reduce((s, p) => s + draft[p.id], 0) / PILLARS.length
  ).toFixed(1);
  const weakest = PILLARS.reduce((min, p) =>
    draft[p.id] < draft[min.id] ? p : min
  );

  return (
    <div
      className="los-reveal mt-4 rounded-3xl border p-6 sm:p-7"
      style={{
        background:
          "linear-gradient(135deg, rgba(212,175,55,0.06), rgba(255,255,255,0.02))",
        borderColor: `${GOLD}33`,
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-bold sm:text-lg" style={{ color: GOLD }}>
            قيّم أسبوعك
          </h3>
          <p className="mt-1 text-xs text-white/40">
            من ١ إلى ١٠ في كل ركيزة. الصدق هنا رأس مال التغيير.
          </p>
        </div>
        <span
          dir="ltr"
          className="rounded-full border px-3 py-1 text-sm font-bold tabular-nums"
          style={{
            borderColor: `${GOLD}40`,
            color: GOLD,
            background: `${GOLD}0D`,
          }}
        >
          {avg} / 10
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
        {PILLARS.map((p) => {
          const v = draft[p.id];
          const fill = ((v - 1) / 9) * 100;
          return (
            <div key={p.id}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <label
                  htmlFor={`los-score-${p.id}`}
                  className="flex items-center gap-2 text-white/80"
                >
                  <p.icon size={14} style={{ color: p.tint }} />
                  {p.ar}
                </label>
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
                  style={{
                    background: `${p.tint}1A`,
                    color: p.tint,
                    border: `1px solid ${p.tint}33`,
                  }}
                >
                  {v}
                </span>
              </div>
              <input
                id={`los-score-${p.id}`}
                type="range"
                min="1"
                max="10"
                step="1"
                value={v}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [p.id]: Number(e.target.value) }))
                }
                className="los-range w-full"
                style={{
                  background: `linear-gradient(90deg, ${p.tint} ${fill}%, rgba(255,255,255,0.08) ${fill}%)`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="mt-6 rounded-2xl border p-4"
        style={{ borderColor: HAIRLINE, background: GLASS }}
      >
        <p className="text-xs leading-relaxed text-white/60">
          أضعف ركيزة هذا الأسبوع:{" "}
          <strong style={{ color: weakest.tint }}>{weakest.ar}</strong>. ركّز
          الأسبوع القادم على عادة واحدة فقط فيها — تعديل صغير مستمر أقوى من خطة
          ضخمة تنهار.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => onSave(draft)}
          className="flex-1 rounded-xl py-3 text-sm font-bold text-black transition-transform hover:scale-[1.01] active:scale-95 sm:flex-none sm:px-10"
          style={{
            background: `linear-gradient(135deg, ${GOLD}, #F0DC8A)`,
            boxShadow: `0 12px 32px -12px ${GOLD}AA`,
          }}
        >
          حفظ المراجعة
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 transition-colors hover:border-white/25 hover:text-white sm:flex-none sm:px-8"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

/* --- Root ------------------------------------------------------------ */
export default function LifeOS2027({ userName = "زياد" }) {
  const [state, setState] = useState(loadState);
  const [reflectionOpen, setReflectionOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage blocked — the UI still works for this session */
    }
  }, [state]);

  const habitsDone = ALL_HABITS.filter((id) => state.habits[id]).length;
  const tasksDone = state.tasks.filter((t) => t.done).length;

  /* Micro-habits carry 60% of the score, the 80/20 tasks carry 40%. */
  const discipline = Math.round(
    (habitsDone / TOTAL_HABITS) * 60 + (tasksDone / state.tasks.length) * 40
  );

  /* Bank the day once the threshold is crossed — the streak only grows. */
  useEffect(() => {
    if (discipline >= DISCIPLINE_TARGET && !state.dayBanked) {
      setState((s) => ({ ...s, dayBanked: true }));
    }
  }, [discipline, state.dayBanked]);

  const streak = state.streakBase + (state.dayBanked ? 1 : 0);

  const toggleHabit = useCallback((id) => {
    setState((s) => ({ ...s, habits: { ...s.habits, [id]: !s.habits[id] } }));
  }, []);

  const toggleTask = useCallback((id) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const setTaskText = useCallback((id, text) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, text } : t)),
    }));
  }, []);

  const resetDay = useCallback(() => {
    setState((s) => ({
      ...s,
      habits: blankHabits(),
      tasks: s.tasks.map((t) => ({ ...t, done: false })),
    }));
  }, []);

  const saveReflection = useCallback((scores) => {
    setState((s) => ({ ...s, scores }));
    setReflectionOpen(false);
  }, []);

  const { dateLabel, greeting, daysTo2027 } = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    return {
      dateLabel: now.toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      greeting:
        h < 12 ? "صباح الانضباط" : h < 18 ? "نهارك إنجاز" : "مساء المحاسبة",
      daysTo2027: Math.max(
        0,
        Math.ceil((new Date(2027, 0, 1) - now) / 86400000)
      ),
    };
  }, []);

  const balanceAvg = (
    PILLARS.reduce((s, p) => s + state.scores[p.id], 0) / PILLARS.length
  ).toFixed(1);

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full text-white antialiased"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, #17171A 0%, #0A0A0A 55%, #0A0A0A 100%)",
        fontFamily:
          "'Tajawal', 'Cairo', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700&display=swap');
        .los-range { -webkit-appearance: none; appearance: none; direction: ltr; height: 6px; border-radius: 999px; outline: none; cursor: pointer; }
        .los-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 3px solid #0A0A0A; box-shadow: 0 0 0 1px rgba(255,255,255,.35), 0 0 14px rgba(212,175,55,.55); cursor: grab; }
        .los-range::-moz-range-thumb { width: 18px; height: 18px; border: 3px solid #0A0A0A; border-radius: 50%; background: #fff; box-shadow: 0 0 14px rgba(212,175,55,.55); cursor: grab; }
        .los-reveal { animation: losReveal .4s cubic-bezier(.22,1,.36,1) both; }
        @keyframes losReveal { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        @keyframes losFlame { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.14) rotate(3deg); } }
        .los-flame { animation: losFlame 1.8s ease-in-out infinite; }
        .recharts-surface { overflow: visible; }
        @media (prefers-reduced-motion: reduce) {
          .los-flame, .los-reveal { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {/* ============ 1. COMMAND CENTER ============ */}
        <header
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{
            background: GLASS,
            borderColor: HAIRLINE,
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-28 right-1/4 h-64 w-64 rounded-full opacity-[0.12] blur-3xl"
            style={{ background: GOLD }}
          />
          <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            {/* greeting */}
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
                {greeting}، <span style={{ color: GOLD }}>{userName}</span>
              </h1>
              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-white/45 lg:justify-start">
                <CalendarDays size={14} /> {dateLabel}
              </p>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-white/35">
                باقٍ{" "}
                <strong className="tabular-nums text-white/70">
                  {daysTo2027}
                </strong>{" "}
                يومًا حتى 2027. الرجل الذي ستكون عليه يُبنى بما تفعله في الساعات
                الأربع والعشرين القادمة — لا بما تنويه.
              </p>
            </div>

            {/* discipline ring */}
            <ProgressRing value={discipline} size={196} />

            {/* streak + stats */}
            <div className="flex w-full max-w-xs flex-col gap-3 lg:w-auto">
              <div
                className="flex items-center justify-between rounded-2xl border px-5 py-4"
                style={{
                  borderColor: streak > 0 ? `${EMBER}40` : HAIRLINE,
                  background:
                    streak > 0
                      ? "linear-gradient(135deg, rgba(249,115,22,.10), rgba(255,255,255,.02))"
                      : GLASS,
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
                    size={30}
                    className={streak > 0 ? "los-flame" : ""}
                    style={{
                      color: streak > 0 ? EMBER : "rgba(255,255,255,0.2)",
                    }}
                  />
                  <span className="text-3xl font-extrabold tabular-nums">
                    {streak}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: HAIRLINE, background: GLASS }}
                >
                  <p className="text-[10px] tracking-wider text-white/35">
                    العادات
                  </p>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: EMERALD }}
                  >
                    {habitsDone}
                    <span className="text-xs text-white/30">/{TOTAL_HABITS}</span>
                  </p>
                </div>
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: HAIRLINE, background: GLASS }}
                >
                  <p className="text-[10px] tracking-wider text-white/35">
                    التوازن
                  </p>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: GOLD }}
                  >
                    {balanceAvg}
                    <span className="text-xs text-white/30">/10</span>
                  </p>
                </div>
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

        {/* ============ 2. THE 6 PILLARS ============ */}
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                ركائز 2027 <span className="text-white/30">• The 6 Pillars</span>
              </h2>
              <p className="mt-1 text-xs text-white/35">
                عادتان مجهريتان لكل ركيزة. لا أكثر — الاستمرارية تهزم الحماس.
              </p>
            </div>
            <span className="hidden text-xs tabular-nums text-white/30 sm:block">
              {habitsDone}/{TOTAL_HABITS} مكتملة اليوم
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <PillarCard
                key={p.id}
                pillar={p}
                habits={state.habits}
                onToggle={toggleHabit}
              />
            ))}
          </div>
        </section>

        {/* ============ 3. 80/20 EXECUTION ZONE ============ */}
        <section className="mt-10">
          <div
            className="relative overflow-hidden rounded-3xl border p-6 sm:p-7"
            style={{
              background:
                "linear-gradient(135deg, rgba(212,175,55,0.07), rgba(255,255,255,0.02))",
              borderColor: `${GOLD}33`,
              boxShadow: `inset 0 1px 0 ${GOLD}1A`,
            }}
          >
            <div
              className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-[0.10] blur-3xl"
              style={{ background: GOLD }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${GOLD}40`,
                    background: `${GOLD}14`,
                    color: GOLD,
                  }}
                >
                  <Target size={19} strokeWidth={2} />
                </span>
                <div>
                  <h2
                    className="text-base font-bold sm:text-lg"
                    style={{ color: GOLD }}
                  >
                    المهام المحورية (قاعدة 80/20)
                  </h2>
                  <p className="text-xs text-white/40">
                    ثلاث مهام فقط. لا رابعة. هذه التي تحرّك حياتك فعلًا.
                  </p>
                </div>
              </div>
              <span
                className="rounded-full border px-3 py-1 text-xs font-bold tabular-nums"
                style={{
                  borderColor: tasksDone === 3 ? `${EMERALD}59` : `${GOLD}40`,
                  color: tasksDone === 3 ? EMERALD : GOLD,
                  background: tasksDone === 3 ? `${EMERALD}14` : `${GOLD}0D`,
                }}
              >
                {tasksDone}/3 منجزة
              </span>
            </div>

            <div className="relative mt-5 space-y-3">
              {state.tasks.map((t, i) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  index={i}
                  onToggle={() => toggleTask(t.id)}
                  onText={(text) => setTaskText(t.id, text)}
                />
              ))}
            </div>

            <p className="relative mt-4 text-[11px] leading-relaxed text-white/30">
              قاعدة صارمة: لا تُضف مهمة رابعة. إن ظهرت مهمة أهم، استبدل واحدة —
              فالتركيز قرار حذف، لا قرار إضافة.
            </p>
          </div>
        </section>

        {/* ============ 4. WEEKLY AUDIT & RADAR ============ */}
        <section className="mt-10">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* radar */}
            <div
              className="rounded-3xl border p-4 sm:p-6 lg:col-span-3"
              style={{
                background: GLASS,
                borderColor: HAIRLINE,
                backdropFilter: "blur(14px)",
              }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity size={17} style={{ color: GOLD }} />
                  <h2 className="text-base font-bold sm:text-lg">
                    رادار التوازن
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/40">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: GOLD }}
                    />
                    هذا الأسبوع
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0 w-3 border-t border-dashed border-white/40" />
                    الأسبوع الماضي
                  </span>
                </div>
              </div>
              <BalanceRadar scores={state.scores} previous={LAST_WEEK_SCORES} />
            </div>

            {/* audit panel */}
            <div
              className="flex flex-col justify-between rounded-3xl border p-6 lg:col-span-2"
              style={{
                background: GLASS,
                borderColor: HAIRLINE,
                backdropFilter: "blur(14px)",
              }}
            >
              <div>
                <h2 className="text-base font-bold sm:text-lg">
                  المحاسبة الأسبوعية
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-white/40">
                  الرادار لا يكذب. الشكل المتوازن أهم من الشكل الكبير في اتجاه
                  واحد.
                </p>

                <div className="mt-5 space-y-2.5">
                  {[...PILLARS]
                    .sort((a, b) => state.scores[a.id] - state.scores[b.id])
                    .map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 truncate text-xs text-white/60">
                          {p.ar}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${state.scores[p.id] * 10}%`,
                              background: p.tint,
                              boxShadow: `0 0 8px ${p.tint}80`,
                            }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-white/70">
                          {state.scores[p.id]}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <button
                onClick={() => setReflectionOpen((o) => !o)}
                aria-expanded={reflectionOpen}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-black transition-transform hover:scale-[1.02] active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, #F0DC8A)`,
                  boxShadow: `0 14px 36px -14px ${GOLD}AA`,
                }}
              >
                {reflectionOpen ? "إغلاق المراجعة" : "المراجعة الأسبوعية"}
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className="transition-transform duration-300"
                  style={{
                    transform: reflectionOpen ? "rotate(180deg)" : "none",
                  }}
                />
              </button>
            </div>
          </div>

          {/* inline reflection section */}
          <ReflectionSection
            open={reflectionOpen}
            initial={state.scores}
            onSave={saveReflection}
            onCancel={() => setReflectionOpen(false)}
          />
        </section>

        <footer className="mt-12 text-center text-[11px] text-white/20">
          2027 LIFE OS · الانضباط حرية مؤجّلة
        </footer>
      </div>
    </div>
  );
}
