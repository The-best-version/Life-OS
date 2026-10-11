/* --- the goals vault: pillars, quarters, horizons, the 2027 tree -------
 *  Every 2027 goal belongs to one of six pillars, lives in a quarter, and
 *  sits on one of three horizons (three years, this year, ninety days).
 *  `goalShape` is the one place a goal row is written — seed, add form and
 *  migration all go through it — and `GOAL_TREE` is the seed the whole vault
 *  starts from.
 * --------------------------------------------------------------------- */
import { uid, obj, rows, fmtDay, daysBetween, daysTo } from "./life-state-util.mjs";

/* --- 90-day chunks ---------------------------------------------------- *
 *  A year is too big to act on. Four 90-day blocks are not, and the vault
 *  opens on the one you are living in.
 * ---------------------------------------------------------------------- */
export const QUARTERS = [
  { id: "q1", label: "الربع الأول", months: "يناير — مارس", tint: "#00C2FF" },
  { id: "q2", label: "الربع الثاني", months: "أبريل — يونيو", tint: "#9D5CFF" },
  { id: "q3", label: "الربع الثالث", months: "يوليو — سبتمبر", tint: "#FFB020" },
  { id: "q4", label: "الربع الرابع", months: "أكتوبر — ديسمبر", tint: "#FF4D8D" },
];
export const currentQuarter = (d = new Date()) => QUARTERS[Math.floor(d.getMonth() / 3)].id;
export const QUARTER_IDS = new Set(QUARTERS.map((q) => q.id));
/* --- the six pillars of 2027 ----------------------------------------- */
export const PILLARS = [
  { id: "faith", label: "الإيماني", tint: "#9D5CFF" },
  { id: "health", label: "الصحي", tint: "#FF7A45" },
  { id: "career", label: "المهني", tint: "#00C2FF" },
  { id: "money", label: "المالي", tint: "#FFB020" },
  { id: "social", label: "الاجتماعي", tint: "#FF4D8D" },
  { id: "self", label: "الشخصي", tint: "#5B8CFF" },
];
export const PILLAR_IDS = new Set(PILLARS.map((p) => p.id));
/* --- the three horizons ---------------------------------------------- *
 *  A 90-day goal that serves nothing is a chore with a deadline. Three
 *  horizons, each answering the one above it: who you intend to be in three
 *  years, what this year has to deliver for that, and what the next ninety
 *  days actually execute. The order matters — `HORIZONS` is read top-down
 *  everywhere, and `parentHorizon` is the only place the chain is written.
 * ---------------------------------------------------------------------- */
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

/* The three-year arc. 2027 is the year this whole app is named for, so it
   anchors the horizon and the two after it complete it. */
export const ARC = [2027, 2028, 2029];
export const GOAL_YEARS = (() => {
  const y = new Date().getFullYear();
  return y < ARC[0] ? [y, ...ARC] : ARC;
})();

/* A stored year is validated against this range, not against GOAL_YEARS —
   GOAL_YEARS shrinks on the first of January once the run-up year is behind
   us, and validating against it would silently move every goal filed in that
   year into the next one. The range is fixed, so a 2026 goal stays a 2026
   goal forever; the screen keeps offering its tab for as long as anything
   lives there. */
export const YEAR_MIN = ARC[0] - 1;
export const YEAR_MAX = ARC[ARC.length - 1];

/* --- the word and the vision ------------------------------------------ *
 *  One word for the arc and a paragraph under it. It sits above every goal
 *  on the screen because it is the thing the goals are for: a list of
 *  eighteen targets with no sentence explaining who they are building is a
 *  list you abandon in March. Capped because it is a motto and a paragraph,
 *  not a journal — and because every byte here shares one storage quota
 *  with the habits and the history, which never give way.
 * ---------------------------------------------------------------------- */
export const WORD_MAX = 24;
export const VISION_MAX = 600;
export const northStarShape = (n) => {
  const o = obj(n);
  const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
  return { word: str(o.word, WORD_MAX), vision: str(o.vision, VISION_MAX) };
};

/* --- the goal, in one place ------------------------------------------- *
 *  Every goal row is written through here — seed, the add form, and the
 *  migration all go through `goalShape`, so the three can never drift apart.
 *  A goal carries more than a label now: the horizon it belongs to, the
 *  goal one horizon up that it serves, the reason it exists, an optional
 *  meter, its own milestones and a deadline.
 *
 *  Nothing here is permissive by accident. `parent` is validated for shape
 *  only; whether it points at a goal that exists, in the right horizon, is
 *  checked in `migrate` where the whole list is in hand — a shape function
 *  that can only see one row has no way to answer it.
 * ---------------------------------------------------------------------- */
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
    /* A quarter is meaningless above the 90-day horizon and a year is
       meaningless below it, but both are stored regardless: changing a
       goal's horizon and changing it back must not lose where it sat. */
    quarter: QUARTER_IDS.has(o.quarter) ? o.quarter : currentQuarter(),
    year:
      Number.isInteger(+o.year) && +o.year >= YEAR_MIN && +o.year <= YEAR_MAX
        ? +o.year
        : GOAL_YEARS[0],
    parent: typeof o.parent === "string" && o.parent ? o.parent : null,
    why: typeof o.why === "string" ? o.why : "",
    /* A target of zero is not a broken meter, it is a goal that has none —
       a yes/no goal, scored by its milestones or its children instead. */
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
    done: !!o.done,
  };
};

/* How far along a goal is, read from whatever evidence it actually has: a
   meter first, then its own milestones, then the goals one horizon down
   that serve it. An explicit «مُحقَّق» wins over all three — declaring a goal
   done is a judgement the owner is allowed to make, and a meter that reads
   94% must not argue with it.
 *
 *  The depth guard is not theoretical. The chain is three deep by design, but
 *  a hand-edited backup can point a goal at its own descendant, and without
 *  a floor the recursion would never return — a white screen that reloading
 *  cannot clear, because the payload on disk is already the bad one. */
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

/* Walks the tree into the flat list the app stores, stamping each level with
   its horizon and each row with the id of the one above it. */
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

/* The rows a profile written before the horizons existed is topped up with:
   everything above the 90-day line, which it has none of. Matched on text so
   a user who already typed one of these never gets a second copy beside it. */
export const ADDED_GOALS = () =>
  SEED_GOALS().filter((g) => g.horizon !== "quarter");

/* Which yearly goal each seeded 90-day goal was written to serve, by text.
   An existing profile's eighteen goals came from this same seed list before
   the horizons existed, so matching on text is what lets the migration wire
   the user's own rows into the tree instead of leaving them orphans beside a
   duplicate set that does have parents. */
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

export function goalPct(goal, all, depth = 0) {
  if (goal.done) return 100;
  if (goal.target > 0)
    return Math.min(100, Math.round((goal.current / goal.target) * 100));
  if (goal.steps.length)
    return Math.round(
      (goal.steps.filter((s) => s.done).length / goal.steps.length) * 100,
    );
  if (depth < HORIZONS.length) {
    const kids = all.filter((g) => g.parent === goal.id);
    if (kids.length)
      return Math.round(
        kids.reduce((n, k) => n + goalPct(k, all, depth + 1), 0) / kids.length,
      );
  }
  return 0;
}

/* The last day a goal has. Its own deadline when it set one, otherwise the
   end of the window it lives in — a 90-day goal expires with its quarter and
   a yearly one with its December, whether or not anyone typed a date. */
export function goalEnd(goal) {
  if (goal.deadline) return goal.deadline;
  if (goal.horizon === "quarter") {
    const qi = QUARTERS.findIndex((q) => q.id === goal.quarter);
    const y = goal.year || GOAL_YEARS[0];
    return fmtDay(new Date(y, (qi < 0 ? 0 : qi) * 3 + 3, 0));
  }
  if (goal.horizon === "year") return `${goal.year}-12-31`;
  return `${GOAL_YEARS[GOAL_YEARS.length - 1]}-12-31`;
}

/* The first and last day of a horizon's window, as date keys. */
export function windowOf(horizon, year = GOAL_YEARS[0], quarter = "q1") {
  /* The arc, not GOAL_YEARS: the run-up year is a place to file goals, not a
     fourth year of a three-year horizon. */
  if (horizon === "h3") return [`${ARC[0]}-01-01`, `${ARC[ARC.length - 1]}-12-31`];
  if (horizon === "year") return [`${year}-01-01`, `${year}-12-31`];
  const qi = Math.max(0, QUARTERS.findIndex((q) => q.id === quarter));
  return [fmtDay(new Date(year, qi * 3, 1)), fmtDay(new Date(year, qi * 3 + 3, 0))];
}

/* Where today stands inside that window. `left` counts the day you are
   standing in — on the last day of a quarter you still have that whole day,
   which is why a live window never reads zero. A window that has not opened
   yet reports its full length rather than a negative one: «لم يبدأ» is a
   different answer from «بقي يوم», and collapsing them is how a planner ends
   up telling you to hurry in a quarter that starts in March. */
export function windowStand(from, to) {
  const total = Math.max(1, daysBetween(from, to) + 1);
  /* `daysTo` counts the day you are standing in, which is what «بقي» wants
     and what «يبدأ بعد» does not: a window opening tomorrow starts in one
     day, not two. The inclusive day comes back off for the start only. */
  const untilStart = daysTo(from) === null ? null : daysTo(from) - 1;
  const left = daysTo(to);
  /* A window that has not opened still reports the days to its *end*, because
     that is what «كم بقي» asks. Reporting its full span instead answered a
     question nobody had and printed «يبدأ بعد ٩٠ يومًا» three times over,
     which is a countdown that counts nothing. The start is said underneath,
     as a note, and the elapsed bar stays empty until the day arrives. */
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

/* Which 90-day window the goals screen should open on: the one you are
   standing in, unless nothing is filed there yet — in which case the earliest
   window that does have goals. A planner that greets you with an empty
   quarter while your whole year is written one tab over has made you do its
   job, and the run-up months before the arc opens are exactly when that
   happens. */
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
