/* --- the goals vault: pillars, quarters, horizons, the 2027 tree -------
 *  Every 2027 goal belongs to one of six pillars, lives in a quarter, and
 *  sits on one of three horizons (three years, this year, ninety days).
 *  `goalShape` is the one place a goal row is written — seed, add form and
 *  migration all go through it — and `GOAL_TREE` is the seed the whole vault
 *  starts from.
 * --------------------------------------------------------------------- */
import { uid, obj, rows, dayKey, fmtDay, daysBetween, daysTo } from "./life-state-util.mjs";

export const QUARTERS = [
  { id: "q1", label: "الربع الأول", months: "يناير — مارس", tint: "#00C2FF" },
  { id: "q2", label: "الربع الثاني", months: "أبريل — يونيو", tint: "#9D5CFF" },
  { id: "q3", label: "الربع الثالث", months: "يوليو — سبتمبر", tint: "#FFB020" },
  { id: "q4", label: "الربع الرابع", months: "أكتوبر — ديسمبر", tint: "#FF4D8D" },
];
export const currentQuarter = (d = new Date()) => QUARTERS[Math.floor(d.getMonth() / 3)].id;
export const QUARTER_IDS = new Set(QUARTERS.map((q) => q.id));

export const PILLARS = [
  { id: "faith", label: "الإيماني", tint: "#9D5CFF" },
  { id: "health", label: "الصحي", tint: "#FF7A45" },
  { id: "career", label: "المهني", tint: "#00C2FF" },
  { id: "money", label: "المالي", tint: "#FFB020" },
  { id: "social", label: "الاجتماعي", tint: "#FF4D8D" },
  { id: "self", label: "الشخصي", tint: "#5B8CFF" },
];
export const PILLAR_IDS = new Set(PILLARS.map((p) => p.id));

export const HORIZONS = [
  {
    id: "h3",
    label: "ثلاث سنوات",
    short: "٣ سنوات",
    hint: "من تريد أن تكون في نهاية ٢٠٢٩ — لا قائمة مهام، بل صورة رجل.",
    tint: "#9D5CFF",
    child: "هدف سنوي",
  },
  {
    id: "year",
    label: "هذه السنة",
    short: "السنة",
    hint: "ما يجب أن يتحقّق هذه السنة كي تصل الثلاث سنوات.",
    tint: "#FFB020",
    child: "هدف ربعي",
  },
  {
    id: "quarter",
    label: "تسعون يومًا",
    short: "٩٠ يومًا",
    hint: "ما تنفّذه الآن. هنا فقط يتحوّل الطموح إلى عمل.",
    tint: "#FF5722",
    child: null,
  },
];
export const HORIZON_IDS = new Set(HORIZONS.map((h) => h.id));
export const parentHorizon = (id) =>
  id === "quarter" ? "year" : id === "year" ? "h3" : null;

/* ── سنوات البرنامج — المكان الوحيد الذي تُعدَّل منه ─────────────────────
 *  مصفوفتان لا واحدة، لأنهما سؤالان مختلفان:
 *
 *  `ARC` هو قوس الرؤية نفسه. أفق «ثلاث سنوات» يُقاس عليه وحده، وعدّاده
 *  التنازلي يبدأ من أول سنة فيه وينتهي بآخرها. لا تضف إليه سنة تمهيدية:
 *  يصير القوس خمس سنوات، ويقفز «مضى %» فجأة لأن بداية النافذة رجعت للوراء.
 *
 *  `RUNWAY` هو المدرج: سنوات يُسمح للهدف أن يسكنها *قبل* أن يفتح القوس،
 *  بلا أي أثر على أفق الثلاث سنوات ولا على عدّاده. ٢٠٢٦ هنا لأن النظام
 *  يُستعمل الآن، وهدف لا تبدأ نافذته إلا في يناير ٢٠٢٧ هدف بلا إيقاع:
 *  `windowStand` يقرؤه «لم يبدأ»، فلا تأخّر ولا تقدّم ولا معدّل مطلوب — 
 *  أي بلا نبض يُقاس ولا شيء يحاسبك عليه اليوم.
 *
 *  لإلغاء المدرج لاحقًا (بعد أن يفتح ٢٠٢٧): اجعل `RUNWAY = []` ولا شيء
 *  آخر يتغيّر — الأهداف المكتوبة فيه تبقى ويبقى ربعها ظاهرًا (راجع
 *  `yearQuarters` أسفل).
 * --------------------------------------------------------------------- */
export const ARC = [2027, 2028, 2029, 2030];
export const RUNWAY = [2026];
export const GOAL_YEARS = [...RUNWAY, ...ARC];
export const YEAR_MIN = GOAL_YEARS[0];
export const YEAR_MAX = GOAL_YEARS[GOAL_YEARS.length - 1];

export const WORD_MAX = 24;
export const VISION_MAX = 600;
export const northStarShape = (n) => {
  const o = obj(n);
  const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
  return { word: str(o.word, WORD_MAX), vision: str(o.vision, VISION_MAX) };
};

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const goalShape = (g) => {
  const o = obj(g);
  const horizon = HORIZON_IDS.has(o.horizon) ? o.horizon : "quarter";
  const num = (v, fb = 0) => (Number.isFinite(+v) && +v >= 0 ? +v : fb);
  const target = num(o.target);
  return {
    id: typeof o.id === "string" && o.id ? o.id : uid(),
    text: typeof o.text === "string" ? o.text : "",
    pillar: PILLAR_IDS.has(o.pillar) ? o.pillar : "self",
    horizon,
    quarter: QUARTER_IDS.has(o.quarter) ? o.quarter : currentQuarter(),
    /* صفٌّ فقد سنته يسقط على أول سنة في القوس لا في المدرج: المدرج تمهيد
       يُختار عمدًا، والهدف الذي لا يعرف سنته ينتمي للبرنامج لا للتمهيد. */
    year:
      Number.isInteger(+o.year) && +o.year >= YEAR_MIN && +o.year <= YEAR_MAX
        ? +o.year
        : ARC[0],
    parent: typeof o.parent === "string" && o.parent ? o.parent : null,
    why: typeof o.why === "string" ? o.why : "",
    target,
    current: target > 0 ? Math.min(target, num(o.current)) : num(o.current),
    unit: typeof o.unit === "string" ? o.unit.slice(0, 16) : "",
    step: num(o.step, 1) > 0 ? num(o.step, 1) : 1,
    deadline: DATE_RE.test(o.deadline) ? o.deadline : "",
    steps: rows(o.steps).map((s) => ({
      id: typeof s.id === "string" && s.id ? s.id : uid(),
      text: typeof s.text === "string" ? s.text : "",
      done: !!s.done,
    })),
    linkedHabits: Array.isArray(o.linkedHabits) ? o.linkedHabits.filter(id => typeof id === "string") : [],
    nextAction: typeof o.nextAction === "string" ? o.nextAction : "",
    obstacles: Array.isArray(o.obstacles) ? o.obstacles.map(x => String(x)) : [],
    reviews: Array.isArray(o.reviews) ? o.reviews.map(r => ({
      id: typeof r.id === "string" ? r.id : uid(),
      date: typeof r.date === "string" ? r.date : "",
      note: typeof r.note === "string" ? r.note : "",
      progress: typeof r.progress === "number" ? r.progress : 0
    })) : [],
    done: !!o.done,
    // 👇 الحقول الجديدة للأولوية وهدف الشهر 👇
    priority: ["critical", "high", "medium", "low"].includes(o.priority) ? o.priority : "medium",
    isMonthlyFocus: !!o.isMonthlyFocus,
  };
};

export const GOAL_TREE = [
  {
    text: "أكون من أهل القرآن: حفظًا وتدبّرًا وعملًا",
    pillar: "faith",
    why: "لأن كل ما بعده يُسأل عنه، وهذا وحده يبقى.",
    kids: [
      {
        text: "ختم القرآن تدبّرًا ثلاث مرّات",
        year: 2027,
        target: 3,
        unit: "ختمة",
        kids: [
          { text: "ختم القرآن تدبّرًا مرّة", quarter: "q1" },
          { text: "المحافظة على الصلوات في وقتها", quarter: "q4" },
        ],
      },
      {
        text: "حفظ جزأين إتقانًا لا كمًّا",
        year: 2027,
        target: 2,
        unit: "جزء",
        kids: [
          { text: "حفظ جزء عمّ إتقانًا", quarter: "q3" },
          { text: "قيام الليل ٣ مرّات أسبوعيًّا", quarter: "q2" },
        ],
      },
    ],
  },
  {
    text: "جسد قويّ لا يعتذر: وزن صحّي ثابت وقوّة تُرى",
    pillar: "health",
    why: "الانضباط يبدأ من الجسد — ما لا تقدر عليه بدنك لن تقدر عليه بعزمك.",
    kids: [
      {
        text: "الوصول إلى الوزن الصحّي وثباته ثلاثة أشهر",
        year: 2027,
        kids: [
          { text: "الوصول إلى وزن صحّي وثباته", quarter: "q3" },
          { text: "نوم ٧ ساعات ثابتة كل ليلة", quarter: "q2" },
        ],
      },
      {
        text: "مئتا حصّة نادي هذه السنة",
        year: 2027,
        target: 200,
        unit: "حصّة",
        step: 1,
        kids: [{ text: "نادي ٤ مرّات أسبوعيًّا بلا انقطاع", quarter: "q1" }],
      },
    ],
  },
  {
    text: "وظيفة أحبّها بدخل يكفيني ويزيد",
    pillar: "career",
    why: "الشهادة لا تُوظّف، النظام يُوظّف — وثلاث سنوات تكفي لبناء سيرة لا تُرَدّ.",
    kids: [
      {
        text: "التخرّج ثم التوظيف في وظيفة إدارية",
        year: 2027,
        kids: [
          { text: "إنهاء مشروع تخرّج يُفتخر به", quarter: "q4" },
          { text: "إرسال ٦٠ طلب توظيف مدروس", quarter: "q2", target: 60, unit: "طلب", step: 5 },
        ],
      },
      {
        text: "اجتياز STEP بتسعين أو أكثر",
        year: 2027,
        kids: [
          { text: "اجتياز اختبار STEP بدرجة عالية", quarter: "q1" },
          { text: "إتقان الإنجليزية محادثةً", quarter: "q3" },
        ],
      },
    ],
  },
  {
    text: "استقلال مالي: لا دَين، وصندوق يكفي سنة",
    pillar: "money",
    why: "المال لا يشترى به الوقت إلا إذا كان فائضًا — والفائض يُبنى، لا يُنتظر.",
    kids: [
      {
        text: "صندوق طوارئ يغطّي ستة أشهر",
        year: 2027,
        kids: [
          { text: "بناء صندوق طوارئ يغطّي ٦ أشهر", quarter: "q2" },
          { text: "ادّخار ٢٠٪ من كل دخل", quarter: "q3" },
        ],
      },
      {
        text: "مصدر دخل ثانٍ يغطّي مصاريفي الشهرية",
        year: 2027,
        kids: [{ text: "مصدر دخل ثانٍ", quarter: "q4" }],
      },
    ],
  },
  {
    text: "صحبة وأهل يُعينونني على الآخرة",
    pillar: "social",
    why: "المرء على دين خليله — وهذه الدائرة تُختار مرّة وتُحمل عمرًا.",
    kids: [
      {
        text: "صلة الرحم أسبوعيًّا بلا انقطاع",
        year: 2027,
        kids: [
          { text: "صلة الرحم أسبوعيًّا", quarter: "q1" },
          { text: "بناء دائرة صحبة صالحة", quarter: "q3" },
        ],
      },
    ],
  },
  {
    text: "عقل مقروء: مئة كتاب ولغة ثانية أتكلّمها بثقة",
    pillar: "self",
    why: "ما تقرؤه في ثلاث سنوات هو من ستكون عليه في الرابعة.",
    kids: [
      {
        text: "قراءة أربعة وعشرين كتابًا",
        year: 2027,
        target: 24,
        unit: "كتاب",
        kids: [{ text: "قراءة ٦ كتب", quarter: "q3", target: 6, unit: "كتاب" }],
      },
      {
        text: "مهارة واحدة تُتقنها إتقانًا يُدفع فيه",
        year: 2027,
        kids: [
          { text: "تعلّم مهارة جديدة كليًّا", quarter: "q4" },
          { text: "تقليل وقت الشاشات إلى ساعة يوميًّا", quarter: "q2" },
        ],
      },
    ],
  },
];

export function buildGoals(tree) {
  const out = [];
  const walk = (node, depth, parent, pillar) => {
    const horizon = HORIZONS[Math.min(depth, HORIZONS.length - 1)].id;
    const row = goalShape({ ...node, horizon, parent, pillar });
    out.push(row);
    for (const kid of node.kids || []) walk(kid, depth + 1, row.id, pillar);
  };
  for (const root of tree) walk(root, 0, null, root.pillar);
  return out;
}

export const SEED_GOALS = () => buildGoals(GOAL_TREE);

export const ADDED_GOALS = () =>
  SEED_GOALS().filter((g) => g.horizon !== "quarter");

export const SEED_LINKS = (() => {
  const map = new Map();
  for (const root of GOAL_TREE)
    for (const year of root.kids || [])
      for (const q of year.kids || []) map.set(q.text, year.text);
  return map;
})();

export const quarterOf = (id) => QUARTERS.find((q) => q.id === id) || QUARTERS[0];
export const pillarOf = (id) => PILLARS.find((p) => p.id === id) || PILLARS[5];
export const horizonOf = (id) => HORIZONS.find((h) => h.id === id) || HORIZONS[2];

export function goalPct(goal, all, habits = [], depth = 0) {
  if (goal.done) return 100;
  if (goal.target > 0)
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
  if (goal.steps.length)
    return Math.round(
      (goal.steps.filter((s) => s.done).length / goal.steps.length) * 100,
    );

  if (goal.linkedHabits && goal.linkedHabits.length > 0 && habits.length > 0) {
    const linked = habits.filter(h => goal.linkedHabits.includes(h.id));
    if (linked.length > 0) {
      return Math.round((linked.filter(h => h.done).length / linked.length) * 100);
    }
  }

  if (depth < HORIZONS.length) {
    const kids = all.filter((g) => g.parent === goal.id);
    if (kids.length)
      return Math.round(
        kids.reduce((n, k) => n + goalPct(k, all, habits, depth + 1), 0) / kids.length,
      );
  }
  return 0;
}

export function goalEnd(goal) {
  if (goal.deadline) return goal.deadline;
  if (goal.horizon === "quarter") {
    const qi = QUARTERS.findIndex((q) => q.id === goal.quarter);
    const y = goal.year || ARC[0];
    return fmtDay(new Date(y, (qi < 0 ? 0 : qi) * 3 + 3, 0));
  }
  if (goal.horizon === "year") return `${goal.year}-12-31`;
  /* أفق الثلاث سنوات ينتهي بنهاية القوس لا بنهاية قائمة السنوات المسموحة:
     سنة المدرج تسبق القوس ولا تمدّه. */
  return `${ARC[ARC.length - 1]}-12-31`;
}

export function windowOf(horizon, year = ARC[0], quarter = "q1") {
  if (horizon === "h3") return [`${ARC[0]}-01-01`, `${ARC[ARC.length - 1]}-12-31`];
  if (horizon === "year") return [`${year}-01-01`, `${year}-12-31`];
  const qi = Math.max(0, QUARTERS.findIndex((q) => q.id === quarter));
  return [fmtDay(new Date(year, qi * 3, 1)), fmtDay(new Date(year, qi * 3 + 3, 0))];
}

/* الأرباع التي تستحق تبويبًا في سنة ما. سنة من القوس تعرض أربعتها دائمًا —
   كلها قادمة. سنة المدرج تعرض ما لم ينتهِ منها فقط: ربع مضى كاملًا قبل أن
   يبدأ النظام تبويبٌ ميت لا يُكتب فيه شيء، وثلاثة منها ضجيج يخفي الربع
   الوحيد الذي يُعمل فيه فعلًا.
   قيدان يمنعان ضياع هدف خلف تبويب اختفى: ربعٌ يسكنه هدف يظهر مهما مضى
   عليه، وسنة انتهت بالكامل تُبقي ربعها الأخير — فما كُتب يبقى مقروءًا. */
export function yearQuarters(year, goals = [], today = dayKey()) {
  if (!RUNWAY.includes(+year)) return QUARTERS;
  const used = new Set(
    rows(goals)
      .filter((g) => g.horizon === "quarter" && +g.year === +year)
      .map((g) => g.quarter),
  );
  const open = QUARTERS.filter(
    (q) => used.has(q.id) || windowOf("quarter", year, q.id)[1] >= today,
  );
  return open.length ? open : [QUARTERS[QUARTERS.length - 1]];
}

export function windowStand(from, to) {
  const total = Math.max(1, daysBetween(from, to) + 1);
  const untilStart = daysTo(from) === null ? null : daysTo(from) - 1;
  const left = daysTo(to);
  if (untilStart !== null && untilStart > 0)
    return {
      state: "soon",
      total,
      left: left === null ? total : Math.max(0, left),
      gone: 0,
      pct: 0,
      until: untilStart,
    };
  if (left === null || left <= 0)
    return { state: "done", total, left: 0, gone: total, pct: 100 };
  return {
    state: "live",
    total,
    left,
    gone: total - left,
    pct: Math.round(((total - left) / total) * 100),
  };
}

export function openingWindow(goals) {
  const here = new Date().getFullYear();
  const live = GOAL_YEARS.includes(here)
    ? { year: here, quarter: currentQuarter() }
    : { year: GOAL_YEARS[0], quarter: QUARTERS[0].id };
  const list = rows(goals).map(goalShape).filter((g) => g.horizon === "quarter");
  if (!list.length) return live;
  if (list.some((g) => g.year === live.year && g.quarter === live.quarter))
    return live;
  const rank = (g) => g.year * 10 + QUARTERS.findIndex((q) => q.id === g.quarter);
  const first = list.reduce((a, b) => (rank(b) < rank(a) ? b : a));
  return { year: first.year, quarter: first.quarter };
}

export function goalPace(goal, all) {
  const hit = goalPct(goal, all);
  if (goal.done || hit >= 100) {
    return { state: "done", pct: 100, hit: 100, left: 0, drift: 0, pace: { state: "done", label: "مُحقَّق" } };
  }

  const from = windowOf(goal.horizon, goal.year, goal.quarter)[0];
  const end = goalEnd(goal);
  const stand = windowStand(from, end);
  const drift = hit - stand.pct;

  let pace = null;
  if (stand.state === "live") {
    if (drift >= 10) pace = { state: "ahead", label: "متقدّم" };
    else if (drift <= -10) pace = { state: "behind", label: "متأخر" };
    else pace = { state: "on-pace", label: "على المسار" };
  }

  let rate = null;
  let expected = null;
  let behindBy = 0;
  if (goal.target > 0 && stand.left > 0) {
    const remaining = goal.target - goal.current;
    if (remaining > 0) {
      if (stand.left >= 30) {
        rate = { amount: remaining / (stand.left / 30), per: "شهريًا" };
      } else if (stand.left >= 7) {
        rate = { amount: remaining / (stand.left / 7), per: "أسبوعيًا" };
      } else {
        rate = { amount: remaining / stand.left, per: "يوميًا" };
      }
    }
    expected = (goal.target * stand.pct) / 100;
    behindBy = Math.max(0, Math.round(expected - goal.current));
  }

  return { ...stand, hit, drift, pace, rate, expected, behindBy };
}

export function syncHabitToGoals(goals, habitId, isDone) {
  return (goals || []).map((g) => {
    if (g.linkedHabits && g.linkedHabits.includes(habitId)) {
      if (g.target > 0) {
        const change = isDone ? g.step : -g.step;
        const newCurrent = Math.max(0, Math.min(g.target, g.current + change));
        return { ...g, current: newCurrent };
      }
    }
    return g;
  });
}
/* ربط المهام بالأهداف: عند إنجاز مهمة، يزيد تقدم الهدف المرتبط */
export function syncTaskToGoal(goals, goalId, isDone) {
  return (goals || []).map((g) => {
    if (g.id === goalId) {
      if (g.target > 0) {
        const change = isDone ? g.step : -g.step;
        const newCurrent = Math.max(0, Math.min(g.target, g.current + change));
        return { ...g, current: newCurrent };
      }
    }
    return g;
  });
}
/* ── نموّ الشجرة ───────────────────────────────────────────────────────
 *  الشجرة لا تملك شيئًا: ارتفاعها وورقها وثمرها كلها مقروءة من الصفوف
 *  التي تملكها الشاشات الأخرى — تقدّم الأهداف، وما سجّله الأرشيف هذا
 *  الأسبوع، والسلسلة. رقمٌ مخزَّن هنا كان سيصير رأيًا ثانيًا في اليوم
 *  نفسه. والسلسلة تصل وسيطًا ولا تُحسب هنا: `streakRunFrom` هي الجواب
 *  الوحيد عنها في هذا المشروع، وحسابها مرّتين حسابان يختلفان يومًا ما.
 * --------------------------------------------------------------------- */
export const GROWTH_STAGES = [
  { id: "seed", label: "بذرة", at: 0, hint: "لم تبدأ بعد — خطوة واحدة تكفي." },
  { id: "sprout", label: "شتلة", at: 0.18, hint: "خرجت من التراب." },
  { id: "sapling", label: "غصون", at: 0.38, hint: "الجذع يشتدّ." },
  { id: "leafy", label: "مورقة", at: 0.62, hint: "الورق يملأ الأغصان." },
  { id: "fruiting", label: "مثمرة", at: 0.84, hint: "الشجرة تُثمر." },
];
export const GROWTH_WEIGHTS = { goals: 0.5, week: 0.3, streak: 0.2 };
export const GROWTH_STREAK_FULL = 21;
export const GROWTH_WEEK = 7;

/* الأسبوع كما سجّله الأرشيف: أيام الفراغ تُعدّ ولا تُعدَّل بها القسمة،
   كما في كل قارئ آخر لهذه الصفوف. */
export function weekPace(history = [], days = GROWTH_WEEK) {
  const tail = rows(history).slice(-Math.max(1, days));
  const kept = tail.filter((r) => Array.isArray(r.done));
  const sum = kept.reduce((n, r) => n + (Number.isFinite(+r.pct) ? +r.pct : 0), 0);
  return {
    pct: kept.length ? Math.round(sum / kept.length) : 0,
    recorded: kept.length,
    gaps: tail.length - kept.length,
  };
}

export function treeGrowth(goals = [], habits = [], history = [], streak = 0) {
  const list = rows(goals).map(goalShape);
  const leaves = list.filter((g) => g.horizon === "quarter");
  /* ما يُمشى عليه فعلًا هو التسعون يومًا؛ الأفقان فوقه مشتقّان منه،
     فجمعهما معه عدٌّ للتقدّم نفسه ثلاث مرّات. */
  const scored = leaves.length ? leaves : list;
  const parts = {
    goals: scored.length
      ? scored.reduce((n, g) => n + goalPct(g, list, habits), 0) / (scored.length * 100)
      : 0,
    week: weekPace(history).pct / 100,
    streak: Math.min(1, Math.max(0, +streak || 0) / GROWTH_STREAK_FULL),
  };
  const growth = Math.min(
    1,
    parts.goals * GROWTH_WEIGHTS.goals +
      parts.week * GROWTH_WEIGHTS.week +
      parts.streak * GROWTH_WEIGHTS.streak,
  );
  let stage = GROWTH_STAGES[0];
  for (const s of GROWTH_STAGES) if (growth >= s.at) stage = s;
  return {
    growth,
    stage,
    parts,
    week: weekPace(history),
    leaves: leaves.length,
    fruit: leaves.filter((g) => g.done).length,
  };
}