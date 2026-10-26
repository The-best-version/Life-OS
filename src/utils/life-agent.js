// src/utils/life-agent.js
// ============================================================================
// 🧠 Life Agent Pro — العقل المدبر التنفيذي لـ 2027 Life OS (Pure JavaScript)
// ============================================================================
// يقرأ هذا المحرك الحالة الحقيقية للنظام بالكامل:
//   - الانضباط والروتين والماء وسلسلة الالتزام
//   - أوقات الصلاة الفعلية (حساب أم القرى) والبلوك الزمني الحالي
//   - مهام اليوم الثلاث ومصفوفة أيزنهاور وتجهيز الغد
//   - أهداف 2030 وأهداف الربع وسرعة التقدم (Goal Velocity)
//   - المالية (الدخل، المصاريف، الرصيد، معدل الساعة)
//   - المكتبة والفوائد المستحقة للمراجعة (التكرار المتباعد)
//   - الجامعة (المواد، الغيابات وسقف الحرمان، الدرجات، التكليفات)
//   - العمل العميق وكاسر العادات ومرآة المساء
// ============================================================================

import {
  AGENT_TOOLS,
  executeTool,
  mergeUndoSnapshots,
  undoAgentChanges,
} from "../state/agent-tools.js";
import {
  rows,
  dayKey,
  clampGoal,
  disciplineOf,
  scoredOf,
  remainingIn,
  netBalance,
  amountSum,
  activeBook,
  sumPages,
  dueNotes,
  READ_GOAL_DEFAULT,
  goalPct,
  goalPace,
  pillarOf,
  uniShape,
  uniPending,
  focusShape,
  sessionsOn,
  sessionMinutes,
  cleanDays,
  prepShape,
  prepPicks,
} from "../state/life-state.mjs";
import { prayerTimes, clockAt, blockAt } from "./prayer-times.mjs";

const DEFAULT_API_KEY =
  "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";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-5-5";
const CLAUDE_VERSION = "2023-06-01";

const MEMORY_KEY = "lifeOS.agentMemory.v1";
const CONFIG_KEY = "lifeOS.agentConfig.v1";
const BRIEF_CACHE_KEY = "lifeOS.briefingCache.v2";

const MAX_EPISODIC = 50;
const MAX_INSIGHTS = 50;
const MAX_TOOL_ITERATIONS = 8;
const MAX_TOKENS = 2500;

const AR_DAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

// ============================================================================
// 1) تسميات الأدوات والشخصيات (Personas & Tool Labels)
// ============================================================================
export const TOOL_LABELS = {
  add_task: "إضافة مهمة",
  complete_task: "إنجاز مهمة",
  delete_task: "حذف مهمة",
  pick_tomorrow_tasks: "تجهيز مهام الغد",
  complete_habit: "إنجاز عادة",
  uncomplete_habit: "إلغاء تأشير عادة",
  log_water: "تسجيل شرب ماء",
  log_expense: "تسجيل مصروف",
  log_income: "تسجيل دخل",
  log_reading: "تسجيل قراءة",
  add_book: "إضافة كتاب متكامل",
  add_book_note: "حفظ فائدة كتاب",
  start_focus_session: "جلسة عمل عميق",
  schedule_time_block: "جدولة بالتقويم",
  auto_plan_day: "هندسة اليوم بين الصلوات",
  update_goal_progress: "تحديث هدف 2030",
  uni_action: "إجراء جامعي",
  log_urge: "درع كاسر العادات",
  evening_reflection: "مرآة وتقييم المساء",
  trigger_emergency_mode: "وضع الطوارئ (الحد الأدنى)",
  save_weekly_review: "اعتماد خطة الأسبوع",
  breakdown_task: "تفكيك مهمة عالقة",
};

export const AGENT_PERSONAS = [
  {
    id: "executive",
    icon: "⚡",
    label: "مدير تنفيذي",
    desc: "استراتيجي، حازم، يربط يومك بأهداف 2030 وأوقات الصلاة",
    color: "#f59e0b",
  },
  {
    id: "coach",
    icon: "🧠",
    label: "مدرب",
    desc: "دافئ ومحفز، يدعمك بأسئلة عميقة وخطوات عملية",
    color: "#8b5cf6",
  },
  {
    id: "drill",
    icon: "🥊",
    label: "صارم",
    desc: "انضباط عسكري، لا يقبل الأعذار ويحاسبك على التقصير",
    color: "#ef4444",
  },
  {
    id: "therapist",
    icon: "🧘‍♂️",
    label: "معالج",
    desc: "متعاطف وهادئ، يفكك التوتر والضغط النفسي",
    color: "#10b981",
  },
  {
    id: "analyst",
    icon: "📊",
    label: "محلل",
    desc: "رقمي ومنطقي، يتحدث بالنسب المئوية والارتباطات الإحصائية",
    color: "#0ea5e9",
  },
];

const PERSONA_PROMPTS = {
  executive:
    "شخصيتك الآن: المدير التنفيذي الاستراتيجي لحياة المستخدم (Chief of Staff). تتحدث بوضوح وحسم واحترافية عالية، تربط المهام اليومية بأهداف الربع وإرث 2030، وتستثمر الأوقات بين الصلوات بأعلى عائد ممكن.",
  coach:
    "شخصيتك الآن: مدرب حياة دافئ ومحفز. تستخدم أسئلة عميقة لتحفيز المستخدم، وتشعره بالدعم، وتقدم نصائح عملية بابتسامة.",
  drill:
    "شخصيتك الآن: مدرب عسكري صارم. لا تقبل الأعذار أبداً، تستخدم جملاً قصيرة وحادة، وتحاسب المستخدم على كل مهمة متراكمة أو عادة مهدرة. كن قاسياً لكن عادلاً ومفيداً.",
  therapist:
    "شخصيتك الآن: معالج نفسي متعاطف. تستمع أكثر مما تتكلم، تهدئ المستخدم عند التوتر أو المزاج المنخفض، وتستخدم لغة تفهم مشاعره قبل أن تقترح أي حلول أو أدوات.",
  analyst:
    "شخصيتك الآن: محلل بيانات بارد ومنطقي. تتحدث بالأرقام والنسب المئوية والسرعة (مثل: معدل انضباطك، سرعة تقدم أهدافك، معدل صرفك). لا عواطف في ردودك، فقط حقائق وبيانات وتوجيهات دقيقة.",
};

// ============================================================================
// 2) إدارة الذاكرة والإعدادات (Memory & Config Persistence)
// ============================================================================
function defaultMemory() {
  return {
    profile: {
      name: "",
      goals: [],
      values: [],
      struggles: [],
      preferences: {},
    },
    insights: [],
    episodic: [],
    lastSnapshot: null,
    lastInteraction: null,
  };
}

function loadMemory() {
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(MEMORY_KEY)
        : null;
    if (!raw) return defaultMemory();
    const parsed = JSON.parse(raw);
    return {
      ...defaultMemory(),
      ...parsed,
      profile: { ...defaultMemory().profile, ...(parsed.profile || {}) },
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      episodic: Array.isArray(parsed.episodic) ? parsed.episodic : [],
    };
  } catch {
    return defaultMemory();
  }
}

function saveMemory(mem) {
  try {
    if (typeof localStorage === "undefined") return;
    const safe = {
      ...mem,
      insights: (mem.insights || []).slice(-MAX_INSIGHTS),
      episodic: (mem.episodic || []).slice(-MAX_EPISODIC),
    };
    localStorage.setItem(MEMORY_KEY, JSON.stringify(safe));
  } catch {}
}

export function getAgentMemory() {
  return loadMemory();
}

export function updateAgentProfile(patch = {}) {
  const mem = loadMemory();
  mem.profile = { ...mem.profile, ...patch };
  saveMemory(mem);
  return mem.profile;
}

export function addInsight(text) {
  if (!text || typeof text !== "string") return;
  const mem = loadMemory();
  if (!(mem.insights || []).some((i) => i && i.text === text)) {
    mem.insights.push({ text, at: Date.now() });
  }
  saveMemory(mem);
}

export function clearAgentMemory() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(MEMORY_KEY);
      localStorage.removeItem(BRIEF_CACHE_KEY);
    }
  } catch {}
}

export function getAgentConfig() {
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(CONFIG_KEY)
        : null;
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      apiKey: parsed.apiKey || DEFAULT_API_KEY,
      model: parsed.model || DEFAULT_MODEL,
      defaultPersona: parsed.defaultPersona || "executive",
    };
  } catch {
    return {
      apiKey: DEFAULT_API_KEY,
      model: DEFAULT_MODEL,
      defaultPersona: "executive",
    };
  }
}

export function saveAgentConfig(patch = {}) {
  try {
    if (typeof localStorage === "undefined") return getAgentConfig();
    const next = { ...getAgentConfig(), ...patch };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    return next;
  } catch {
    return getAgentConfig();
  }
}

export { undoAgentChanges };

// ============================================================================
// 3) سياق الوقت وأوقات الصلاة (Time & Prayer Context)
// ============================================================================
export function getTimeContext(state) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  let period = "night";
  let greeting = "مساء الخير";
  if (hour >= 4 && hour < 9) {
    period = "morning";
    greeting = "صباح الهمة والبركة";
  } else if (hour >= 9 && hour < 12) {
    period = "late-morning";
    greeting = "صباح الإنجاز";
  } else if (hour >= 12 && hour < 15) {
    period = "noon";
    greeting = "طاب نهارك";
  } else if (hour >= 15 && hour < 18) {
    period = "afternoon";
    greeting = "مساء النشاط";
  } else if (hour >= 18 && hour < 21) {
    period = "evening";
    greeting = "مساء الخير";
  } else if (hour >= 21 || hour < 1) {
    period = "night";
    greeting = "مساء السكينة";
  } else {
    period = "late-night";
    greeting = "سهرة طيبة";
  }

  const place =
    state?.place && Number.isFinite(state.place.lat)
      ? state.place
      : { name: "الرياض", lat: 24.7136, lng: 46.6753, tz: 3, asr: 1 };
  const prayers = prayerTimes(place, now);
  const currentBlock = blockAt(place, now);

  // حساب الصلاة القادمة
  const nowDec = hour + now.getMinutes() / 60;
  const prayerOrder = [
    { id: "fajr", label: "الفجر", at: prayers.fajr },
    { id: "dhuhr", label: "الظهر", at: prayers.dhuhr },
    { id: "asr", label: "العصر", at: prayers.asr },
    { id: "maghrib", label: "المغرب", at: prayers.maghrib },
    { id: "isha", label: "العشاء", at: prayers.isha },
  ];
  let upcomingPrayer = prayerOrder.find(
    (p) => p.at !== null && Number.isFinite(p.at) && p.at > nowDec
  );
  if (!upcomingPrayer && prayerOrder[0].at !== null) {
    upcomingPrayer = { ...prayerOrder[0], tomorrow: true };
  }

  return {
    hour,
    dayName: AR_DAYS[day] || "",
    isWeekend: day === 5 || day === 6,
    period,
    greeting,
    formattedTime: `${String(hour).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`,
    formattedDate: now.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    isoDate: dayKey(now),
    city: place.name || "الرياض",
    prayers: {
      fajr: clockAt(prayers.fajr),
      sunrise: clockAt(prayers.sunrise),
      dhuhr: clockAt(prayers.dhuhr),
      asr: clockAt(prayers.asr),
      maghrib: clockAt(prayers.maghrib),
      isha: clockAt(prayers.isha),
    },
    currentBlock: currentBlock ? currentBlock.label : "الآن",
    currentBlockId: currentBlock ? currentBlock.id : "morning",
    upcomingPrayer: upcomingPrayer
      ? {
          label: upcomingPrayer.label,
          time: clockAt(upcomingPrayer.at),
        }
      : null,
  };
}

// ============================================================================
// 4) بناء الموجز الشامل لحالة الحياة (Full Life OS State Summary)
// ============================================================================
export function buildStateSummary(state) {
  const safe = state || {};
  const today = safe.date || dayKey();
  const time = getTimeContext(safe);

  // 1. العادات والانضباط
  const habits = rows(safe.habits);
  const scored = scoredOf(habits);
  const openScored = scored.filter((h) => !h.done);
  const doneHabits = habits.filter((h) => h.done);
  const pct = disciplineOf(habits);
  const rem = remainingIn(habits, time.currentBlockId);

  const nowHabitLines = (rem.here || rem.now || [])
    .slice(0, 8)
    .map(
      (h) =>
        `  - [${h.id}] ${h.label}${h.min ? ` (الحد الأدنى: ${h.min})` : ""}`
    );
  const missedHabitLines = (rem.missed || [])
    .slice(0, 6)
    .map((h) => `  - [${h.id}] ${h.label} (فاتت من بلوك سابق)`);

  // 2. المهام ومصفوفة أيزنهاور وتجهيز الغد
  const allTasks = rows(safe.tasks);
  const openTasks = allTasks.filter((t) => !t.done);
  const doneTasks = allTasks.filter((t) => t.done);
  const topThree = allTasks.filter((t) => t.today);
  const otherOpen = openTasks.filter((t) => !t.today);
  const prep = prepShape(safe.prep);
  const prepCount = prepPicks(prep).length;

  const topLines = topThree.map(
    (t, i) =>
      `  ${i + 1}. ${t.done ? "✅" : "⏳"} [${t.id}] ${t.text || t.title}${
        t.step ? ` (الخطوة الأولى: ${t.step})` : ""
      }`
  );
  const matrixLines = otherOpen.slice(0, 8).map((t) => {
    const q = (t.quadrant || "q2").toUpperCase();
    return `  - [${q}] ${t.text || t.title}${t.due ? ` (استحقاق: ${t.due})` : ""}`;
  });

  // 3. الماء
  const waterCount =
    typeof safe.water === "number"
      ? Math.max(0, Math.round(safe.water))
      : Number(safe.water?.today ?? 0);
  const waterGoal = clampGoal(safe.waterGoal);

  // 4. المالية
  const expenses = rows(safe.expenses);
  const income = rows(safe.income);
  const balance = netBalance(income, expenses);
  const todaySpent = amountSum(expenses.filter((e) => e.date === today));
  const recentExpLines = expenses
    .slice(0, 5)
    .map((e) => `  - ${e.label}: ${e.amount} ر.س (${e.date})`);

  // 5. أهداف الربع وإرث 2030
  const allGoals = rows(safe.goals);
  const activeGoals = allGoals.filter((g) => !g.done && g.horizon === "quarter");
  const goalLines = activeGoals.slice(0, 6).map((g) => {
    const gPct = goalPct(g, allGoals, habits);
    const gPace = goalPace(g, allGoals);
    const stateTag =
      gPace.pace?.state === "ahead"
        ? "🚀 متقدم"
        : gPace.pace?.state === "behind"
          ? "⚠️ متأخر"
          : "✅ على المسار";
    const pName = pillarOf(g.pillar).label;
    const counter =
      g.target > 0 ? ` (${g.current || 0}/${g.target} ${g.unit || ""})` : "";
    return `  - [${pName}] ${g.text}: ${gPct}%${counter} — ${stateTag}`;
  });

  // 6. المكتبة والقراءة
  const books = rows(safe.books);
  const currentBook = activeBook(books);
  const readToday = sumPages(
    rows(safe.reading).filter((r) => r.date === today)
  );
  const readGoal = Number.isFinite(+safe.readGoal)
    ? +safe.readGoal
    : READ_GOAL_DEFAULT;
  const dueNotesCount = dueNotes(books, today).length;

  // 7. الجامعة
  const uni = uniShape(safe.uni);
  const courses = rows(uni.courses);
  const pendingUni = uniPending(uni).slice(0, 5);
  const courseLines = courses.map(
    (c) =>
      `  - ${c.name}${c.code ? ` (${c.code})` : ""}: غياب ${c.absences || 0}/${
        c.absenceCap || "—"
      }`
  );
  const uniTaskLines = pendingUni.map((t) => {
    const cName = courses.find((c) => c.id === t.course)?.name || "";
    return `  - ${t.title}${cName ? ` [${cName}]` : ""} — موعد: ${t.due}`;
  });

  // 8. العمل العميق وكاسر العادات والتقويم
  const focus = focusShape(safe.focus);
  const todaySessions = sessionsOn(safe.sessions, today);
  const todayFocusMins = sessionMinutes(todaySessions);
  const badHabits = rows(safe.badHabits);
  const breakerLines = badHabits.map(
    (b) => `  - ${b.title}: ${cleanDays(b)} يوم نظيف`
  );
  const todayEvents = rows(safe.events)
    .filter((e) => e.date >= today)
    .slice(0, 6)
    .map((e) => `  - ${e.date} ${e.time || ""}: ${e.title}`);

  return [
    `## 🕌 الوقت وأوقات الصلاة (${time.city})`,
    `- البلوك الزمني الحالي: «${time.currentBlock}» | الصلاة القادمة: ${
      time.upcomingPrayer
        ? `${time.upcomingPrayer.label} (${time.upcomingPrayer.time})`
        : "—"
    }`,
    `- الفجر ${time.prayers.fajr} | الشروق ${time.prayers.sunrise} | الظهر ${time.prayers.dhuhr} | العصر ${time.prayers.asr} | المغرب ${time.prayers.maghrib} | العشاء ${time.prayers.isha}`,
    ``,
    `## 🔥 الانضباط والروتين اليومي`,
    `- مؤشر الانضباط اليوم: ${pct}% (${doneHabits.length} منجزة من ${habits.length} | متبقي من الأساسي: ${openScored.length})`,
    `- الماء اليوم: ${waterCount} / ${waterGoal} أكواب`,
    nowHabitLines.length
      ? `- عادات البلوك الحالي المتبقية:\n${nowHabitLines.join("\n")}`
      : `- عادات البلوك الحالي مكتملة بالكامل ✅`,
    missedHabitLines.length
      ? `- عادات فاتت من بلوكات سابقة اليوم:\n${missedHabitLines.join("\n")}`
      : null,
    ``,
    `## 🎯 مهام اليوم ومصفوفة أيزنهاور`,
    `- أهم 3 مهام لليوم (${topThree.filter((t) => t.done).length}/${topThree.length} منجزة):`,
    topLines.length ? topLines.join("\n") : "  - لم يتم اختيار أهم 3 مهام لليوم بعد.",
    `- بقية المهام المفتوحة (${otherOpen.length} معلقة | إجمالي المنجز: ${doneTasks.length}):`,
    matrixLines.length ? matrixLines.join("\n") : "  - لا مهام أخرى معلقة.",
    `- تجهيز الغد: ${prepCount}/${3} مهام مختارة ليوم الغد.`,
    ``,
    `## 🧭 أهداف الشهر والربع (إرث 2030)`,
    goalLines.length ? goalLines.join("\n") : "  - لا أهداف ربعية نشطة.",
    ``,
    `## 💰 المالية والمشاريع`,
    `- الرصيد الصافي: ${balance} ريال | مصروف اليوم: ${todaySpent} ريال`,
    recentExpLines.length
      ? `- آخر المصاريف:\n${recentExpLines.join("\n")}`
      : "  - لا مصاريف مسجلة مؤخراً.",
    ``,
    `## 📖 المكتبة والعمل العميق`,
    `- يقرأ حالياً: ${
      currentBook
        ? `«${currentBook.title}» (صفحة ${currentBook.page || 0}/${
            currentBook.pages || "؟"
          })`
        : "لا يوجد كتاب نشط"
    } | قراءة اليوم: ${readToday}/${readGoal} صفحة | فوائد مستحقة للمراجعة: ${dueNotesCount}`,
    `- العمل العميق اليوم: ${todayFocusMins} دقيقة (${todaySessions.length} جلسات)${
      focus.run ? ` | ⏱️ مؤقت نشط الآن: ${focus.run.label || "تركيز"}` : ""
    }`,
    ``,
    `## 🎓 الجامعة والتقويم وكاسر العادات`,
    courseLines.length ? `- المواد:\n${courseLines.join("\n")}` : "- لا مواد جامعية.",
    uniTaskLines.length ? `- استحقاقات جامعية قادمة:\n${uniTaskLines.join("\n")}` : null,
    todayEvents.length ? `- مواعيد التقويم:\n${todayEvents.join("\n")}` : null,
    breakerLines.length ? `- كاسر العادات:\n${breakerLines.join("\n")}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

// ============================================================================
// 5) محرك اكتشاف الأنماط والارتباطات الذكية (Cross-Domain Pattern Engine)
// ============================================================================
export function detectPatterns(state, memory) {
  const safe = state || {};
  const patterns = [];
  const today = safe.date || dayKey();

  const habits = rows(safe.habits);
  const pct = disciplineOf(habits);
  const openScored = scoredOf(habits).filter((h) => !h.done);

  if (pct >= 80) {
    patterns.push(`🔥 انضباط اليوم ممتاز (${pct}%) — تجاوزت عتبة السلسلة!`);
  } else if (pct < 40 && new Date().getHours() >= 17) {
    patterns.push(
      `⚠️ انضباط اليوم منخفض (${pct}%) ولديك ${openScored.length} عادات أساسية متبقية قبل نهاية اليوم.`
    );
  }

  // تحليل الماء
  const water =
    typeof safe.water === "number"
      ? safe.water
      : Number(safe.water?.today ?? 0);
  const waterGoal = clampGoal(safe.waterGoal);
  if (water >= waterGoal) {
    patterns.push(`💧 اكتمل هدف شرب الماء اليوم (${water}/${waterGoal}).`);
  } else if (water < waterGoal * 0.4 && new Date().getHours() >= 14) {
    patterns.push(`💧 شرب الماء منخفض (${water}/${waterGoal} أكواب) — اشرب كوبين الآن.`);
  }

  // تحليل سرعة أهداف الربع (Goal Velocity)
  const allGoals = rows(safe.goals);
  const behindGoals = allGoals
    .filter((g) => !g.done && g.horizon === "quarter")
    .filter((g) => goalPace(g, allGoals).pace?.state === "behind");
  if (behindGoals.length > 0) {
    patterns.push(
      `🎯 لديك ${behindGoals.length} أهداف ربعية متأخرة عن المسار الزمني، أبرزها: «${behindGoals[0].text.slice(0, 45)}...»`
    );
  }

  // تحليل الجامعة وسقف الغياب
  const uni = uniShape(safe.uni);
  const riskyCourses = rows(uni.courses).filter(
    (c) => c.absenceCap > 0 && c.absences >= c.absenceCap - 1
  );
  if (riskyCourses.length > 0) {
    patterns.push(
      `🎓 تحذير جامعي: المادة «${riskyCourses[0].name}» وصلت ${riskyCourses[0].absences}/${riskyCourses[0].absenceCap} غيابات!`
    );
  }

  // تحليل الارتباط التاريخي بين العمل العميق والانضباط
  const hist = rows(safe.history).slice(-14);
  const sessions = rows(safe.sessions);
  if (hist.length >= 4) {
    const avgPct = Math.round(
      hist.reduce((sum, r) => sum + (Number(r.pct) || 0), 0) / hist.length
    );
    patterns.push(`📈 متوسط انضباطك في آخر ${hist.length} أيام هو ${avgPct}%.`);
  }
  const todayMins = sessionMinutes(sessionsOn(sessions, today));
  if (todayMins === 0 && new Date().getHours() >= 13) {
    patterns.push(`⏱️ لم تسجل أي جلسة عمل عميق اليوم حتى الآن.`);
  } else if (todayMins >= 90) {
    patterns.push(`⚡ أنجزت ${todayMins} دقيقة عمل عميق اليوم — تركيز عالي!`);
  }

  // تحليل الفوائد المستحقة للمراجعة
  const dueCount = dueNotes(rows(safe.books), today).length;
  if (dueCount > 0) {
    patterns.push(`💡 لديك ${dueCount} فوائد من كتبك مستحقة للمراجعة اليوم.`);
  }

  (memory?.insights || [])
    .filter(Boolean)
    .slice(-4)
    .forEach((i) => {
      if (i.text && !patterns.includes(i.text)) {
        patterns.push(`🧠 ملاحظة مسجلة: ${i.text}`);
      }
    });

  return patterns;
}

function maybeSnapshotPatterns(state, memory) {
  const today = dayKey();
  if (memory.lastSnapshot === today) return;
  const patterns = detectPatterns(state, memory);
  for (const p of patterns) {
    if (p.startsWith("🧠")) continue;
    if (!memory.insights.some((i) => i && i.text === p)) {
      memory.insights.push({ text: p, at: Date.now() });
    }
  }
  memory.lastSnapshot = today;
  saveMemory(memory);
}

// ============================================================================
// 6) بناء تعليمات النظام للوكيل (System Prompt Builder)
// ============================================================================
function buildSystemPrompt({ time, state, memory, mode }) {
  const stateSummary = buildStateSummary(state);
  const patterns = detectPatterns(state, memory);
  const profile = memory?.profile || {};
  const personaText = PERSONA_PROMPTS[mode] || PERSONA_PROMPTS.executive;

  const profileLines =
    [
      profile.name ? `- الاسم: ${profile.name}` : null,
      profile.goals?.length ? `- أهداف عليا: ${profile.goals.join("، ")}` : null,
      profile.values?.length ? `- قيم أساسية: ${profile.values.join("، ")}` : null,
      profile.struggles?.length ? `- تحديات: ${profile.struggles.join("، ")}` : null,
    ]
      .filter(Boolean)
      .join("\n") || "- مستخدم نظام أثر 2030 / 2027 Life OS.";

  return `أنت "الوكيل الذكي" (Life OS Executive Agent) — العقل المدبر ومدير الحياة التنفيذي داخل نظام «أثر 2030 — 2027 Life OS».

# هويتك وقدراتك
- تتحدث العربية بأسلوب طبيعي، ذكي، ومباشر.
- أنت وكيل تنفيذي حقيقي يمتلك 21 أداة متطورة تتحكم في جميع أقسام النظام (المهام، الروتين والعادات، وضع الطوارئ، التخطيط الأسبوعي، تفكيك التسويف، الماء، المالية، الكتب والفوائد، العمل العميق، التقويم، أهداف 2030، الجامعة، كاسر العادات، ومرآة المساء).
- يمكنك استدعاء **عدة أدوات في دور واحد (Multi-Tool Chain)** إذا أرسل المستخدم رسالة مركبة أو تفريغاً لعقله (Brain-Dump).

# شخصيتك الحالية
${personaText}

# قواعد ذهبية صارمة
1. **التنفيذ الفعلي بالأدوات:** عند أي طلب لتسجيل أو تعديل بيانات (مهمة، عادة، ماء، مصروف، دخل، قراءة، فائدة، تركيز، موعد، غياب، درجة، تقييم مساء، طوارئ، تخطيط أسبوعي، تفكيك تسويف...) استدعِ الأداة المناسبة فوراً. لا تقل "سجلت لك" بدون استدعاء الأداة!
2. **وضع الطوارئ عند التعب والإرهاق:** إذا ذكر المستخدم أنه مريض، مصدع، مرهق، أو تحت ضغط اختبارات شديد، تعاطف معه واستدعِ أداة \`trigger_emergency_mode\` فوراً، ومكّن \`complete_tiny_core: true\` لإنقاذ عاداته الأساسية بالنسخة الخفيفة (🪶) وعدم السقوط للصفر، وذكّره أن الاستراحة اليوم انتصار.
3. **تفكيك التسويف للمهام المؤجلة:** إذا اشتكى المستخدم من تسويف أو ثقل مهمة، استخدم أداة \`breakdown_task\` لاستخراج أول خطوة مادية صغيرة جداً (5-10 دقائق) وتثبيتها في أهم مهام اليوم للبدء الفوري بلا مقاومة.
4. **ورشة التخطيط الأسبوعي:** إذا طلب المستخدم التخطيط للأسبوع أو مراجعة الأسبوع، استخرج أبرز انتصار في الأسبوع الماضي، وأكبر عائق، واقترح العادة المحورية (Keystone Habit) وهدف إرث 2030 الذي سيتحرك، واعتمدها بأداة \`save_weekly_review\`.
5. **هندسة اليوم بين الصلوات:** إذا طلب المستخدم "خطط يومي" أو "رتب وقتي"، استخدم أداة \`auto_plan_day\` أو \`schedule_time_block\` لتوزيع مهامه في الفترات الذهبية بين الصلوات (الفجر، الضحى، بعد الظهر، بعد العصر، بعد المغرب، بعد العشاء) دون تعارض مع الصلوات.
6. **تفريغ العقل (Brain-Dump):** إذا ذكر المستخدم عدة أشياء في رسالة واحدة (مثلاً مصروف + مهمة + عادة + قراءة)، نفّذ كل الأدوات اللازمة بالتتابع في نفس الدور، ثم لخّص له ما أنجزته بنقاط واضحة.
7. **الرؤية البصرية (Vision):** إذا أرفق المستخدم صورة (فاتورة، جدول محاضرات، ورقة مهام، لقطة شاشة)، حللها بدقة واستخرج كل البيانات وسجلها بالأدوات المناسبة فوراً.
8. **جلسة إقفال المساء:** إذا طلب المستخدم "إقفال المساء" أو "مراجعة اليوم"، راجع معه العادات المتبقية، اسأله عن مشتت اليوم وحل الغد لتسجيلها بأداة \`evening_reflection\`، وساعده في اختيار مهام الغد الثلاث بأداة \`pick_tomorrow_tasks\`.
9. **الدقة والاختصار:** لا تخترع أرقاماً من عندك؛ اعتمد على "حالة الحياة الآن" أدناه. اجعل ردودك منظمة، مركزة، وملهمة.

# السياق الزمني الآن
- الوقت: ${time.formattedTime} — ${time.dayName} ${time.formattedDate}
- تاريخ اليوم (YYYY-MM-DD): ${time.isoDate}
- البلوك الحالي: ${time.currentBlock}${time.isWeekend ? " (نهاية أسبوع)" : " (يوم عمل/دراسة)"}

# الملف الشخصي
${profileLines}

# الأنماط والتنبيهات الاستباقية المكتشفة الآن
${patterns.length ? patterns.map((p) => `- ${p}`).join("\n") : "- كل المؤشرات متوازنة."}

# حالة الحياة الآن (Live State)
${stateSummary}`;
}

// ============================================================================
// 7) الاتصال بـ Claude API
// ============================================================================
async function callClaude({ system, messages, tools }) {
  const cfg = getAgentConfig();
  const body = {
    model: cfg.model || DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages,
  };
  if (Array.isArray(tools) && tools.length > 0) body.tools = tools;

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey || DEFAULT_API_KEY,
      "anthropic-version": CLAUDE_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {}
    throw new Error(`Claude API ${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

function normalizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(Boolean)
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "agent"))
    .map((m) => ({
      role: m.role === "agent" ? "assistant" : m.role,
      content: typeof m.content === "string" ? m.content : m.text || m.content || "",
    }))
    .filter((m) => m.content && (typeof m.content !== "string" || m.content.trim() !== ""));
}

// ============================================================================
// 8) محرك الإحاطة المحلي الذكي (Zero-Token Proactive Briefing)
// ============================================================================
export function getLocalBriefing(state, forceRefresh = false) {
  if (!forceRefresh) {
    try {
      const raw =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(BRIEF_CACHE_KEY)
          : null;
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.at < 30 * 60 * 1000) {
          return cached;
        }
      }
    } catch {}
  }

  const safeState = state || {};
  const time = getTimeContext(safeState);
  const habits = rows(safeState.habits);
  const pct = disciplineOf(habits);
  const rem = remainingIn(habits, time.currentBlockId);
  const nowHabits = rem.here || rem.now || [];
  const tasks = rows(safeState.tasks).filter((t) => !t.done);
  const topTasks = tasks.filter((t) => t.today);
  const water =
    typeof safeState.water === "number"
      ? safeState.water
      : Number(safeState.water?.today ?? 0);
  const waterGoal = clampGoal(safeState.waterGoal);
  const balance = netBalance(safeState.income, safeState.expenses);

  const lines = [];
  const chips = [];

  lines.push(
    `${time.greeting}! 🕌 نحن الآن في فترة «${time.currentBlock}»${
      time.upcomingPrayer
        ? ` — صلاة ${time.upcomingPrayer.label} عند ${time.upcomingPrayer.time}`
        : ""
    }.`
  );

  lines.push(
    `📊 مؤشر انضباطك اليوم: ${pct}% | الماء: ${water}/${waterGoal} أكواب | الرصيد: ${balance} ر.س`
  );

  if (topTasks.length > 0) {
    lines.push(
      `🎯 أهم مهامك المتبقية لليوم (${topTasks.length}): «${
        topTasks[0].text || topTasks[0].title
      }»${topTasks.length > 1 ? ` و${topTasks.length - 1} أخرى` : ""}.`
    );
    chips.push(`أنجزت مهمة ${topTasks[0].text || topTasks[0].title}`);
  } else if (tasks.length > 0) {
    lines.push(
      `📋 لم تختر أهم 3 مهام لليوم بعد (لديك ${tasks.length} مهام في المصفوفة).`
    );
    chips.push("خطّط يومي بين الصلوات");
  }

  if (nowHabits.length > 0) {
    lines.push(
      `⏳ عادات فترة «${time.currentBlock}» المتبقية (${nowHabits.length}): أبرزها «${nowHabits[0].label}».`
    );
    chips.push(`أنجزت عادة ${nowHabits[0].label}`);
  }

  if (water < waterGoal * 0.5) {
    chips.push("شربت كوبين ماء");
  }

  if (time.period === "evening" || time.period === "night") {
    chips.push("ابدأ جلسة إقفال المساء 🌙");
  } else if (!chips.includes("خطّط يومي بين الصلوات")) {
    chips.push("خطّط يومي بين الصلوات");
  }

  chips.push("حلّل أدائي وأهداف 2030");

  const result = {
    text: lines.join("\n"),
    chips: chips.slice(0, 5),
    at: Date.now(),
  };

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(BRIEF_CACHE_KEY, JSON.stringify(result));
    }
  } catch {}

  return result;
}

// ============================================================================
// 9) الدالة الرئيسية: runLifeAgent (تدعم النصوص والصور وسلاسل الأدوات والـ Undo)
// ============================================================================
export async function runLifeAgent(
  text,
  messagesOrState,
  stateOrSetState,
  maybeSetState,
  maybeOptions = {}
) {
  // دعم الاستدعاء بـ 3 معاملات (text, state, setState) أو 5 معاملات (text, messages, state, setState, options)
  let messages = [];
  let state = {};
  let setState = null;
  let options = {};

  if (Array.isArray(messagesOrState)) {
    messages = messagesOrState;
    state = stateOrSetState || {};
    setState = maybeSetState;
    options = maybeOptions || {};
  } else {
    messages = [];
    state = messagesOrState || {};
    setState = stateOrSetState;
    options = maybeSetState || {};
  }

  if (!text && !options.imageBase64) {
    return {
      text: "لم أفهم — أرسل نصاً أو صورة أو اختر أحد الأوامر السريعة.",
      toolCalls: [],
      before: null,
    };
  }

  const memory = loadMemory();
  const time = getTimeContext(state);
  const cfg = getAgentConfig();
  const mode = options.mode || cfg.defaultPersona || "executive";
  let currentState = state;

  // تجهيز رسالة المستخدم (نص + صورة إن وجدت)
  const userContent = [];
  if (options.imageBase64) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: options.imageMimeType || "image/jpeg",
        data: options.imageBase64,
      },
    });
  }
  userContent.push({
    type: "text",
    text:
      text?.trim() ||
      "حلل هذه الصورة واستخرج المهام أو المصاريف أو المواعيد وسجلها بالأدوات المناسبة.",
  });

  const conversation = [
    ...normalizeHistory(messages),
    { role: "user", content: userContent },
  ];

  const toolCallsLog = [];
  let aggregatedText = "";
  let turnBeforeSnapshot = null;

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const system = buildSystemPrompt({
      time,
      state: currentState,
      memory,
      mode,
    });

    let response;
    try {
      response = await callClaude({
        system,
        messages: conversation,
        tools: AGENT_TOOLS,
      });
    } catch (err) {
      return {
        text: `⚠️ تعذّر الاتصال بالعقل المدبر: ${err.message}`,
        toolCalls: toolCallsLog,
        before: turnBeforeSnapshot,
        error: true,
      };
    }

    const contentBlocks = Array.isArray(response?.content)
      ? response.content
      : [];
    const textBlocks = contentBlocks
      .filter((b) => b && b.type === "text")
      .map((b) => b.text || "");
    if (textBlocks.length) {
      aggregatedText +=
        (aggregatedText ? "\n" : "") + textBlocks.join("\n").trim();
    }

    conversation.push({ role: "assistant", content: contentBlocks });

    const toolUses = contentBlocks.filter((b) => b && b.type === "tool_use");
    if (response?.stop_reason !== "tool_use" || toolUses.length === 0) break;

    const toolResults = [];
    for (const tu of toolUses) {
      try {
        if (typeof options.onStep === "function") {
          try {
            options.onStep({
              type: "tool",
              name: tu.name,
              label: TOOL_LABELS[tu.name] || tu.name,
              input: tu.input,
            });
          } catch {}
        }

        const raw = await Promise.resolve(
          executeTool(tu.name, tu.input || {}, currentState, setState)
        );
        const isOk = Boolean(raw && raw.ok !== false);

        if (isOk && raw.nextState && typeof raw.nextState === "object") {
          currentState = raw.nextState;
        }
        if (isOk && raw.before) {
          turnBeforeSnapshot = mergeUndoSnapshots(turnBeforeSnapshot, raw.before);
        }

        toolCallsLog.push({
          name: tu.name,
          label: TOOL_LABELS[tu.name] || tu.name,
          input: tu.input,
          ok: isOk,
          message: raw?.message || "",
          badge: raw?.badge || "",
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          is_error: !isOk,
          content: JSON.stringify({
            ok: isOk,
            message: raw?.message || (isOk ? "تم التنفيذ" : "تعذر التنفيذ"),
          }),
        });
      } catch (e) {
        toolCallsLog.push({
          name: tu.name,
          label: TOOL_LABELS[tu.name] || tu.name,
          input: tu.input,
          ok: false,
          error: e?.message,
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          is_error: true,
          content: JSON.stringify({
            ok: false,
            error: e?.message || "tool_failed",
          }),
        });
      }
    }
    conversation.push({ role: "user", content: toolResults });
  }

  // تحديث ذاكرة الوكيل وإبطال كاش الإحاطة إذا تغيرت الحالة
  memory.lastInteraction = {
    at: Date.now(),
    text: (text || "صورة").trim().slice(0, 120),
    toolsCount: toolCallsLog.length,
  };
  if (toolCallsLog.length > 0) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(BRIEF_CACHE_KEY);
      }
    } catch {}
  }
  maybeSnapshotPatterns(currentState, memory);
  saveMemory(memory);

  return {
    text: aggregatedText.trim() || "تم تنفيذ طلبك بنجاح ✅",
    toolCalls: toolCallsLog,
    before: turnBeforeSnapshot,
    nextState: currentState,
    memory,
  };
}

export default runLifeAgent;
