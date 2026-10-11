/* --- habits, water and the weakness mirror -----------------------------
 *  The routine's habit list and the discipline score it feeds, the water
 *  tracker, and the accountability mirror (urges and bad habits) — the three
 *  are kept together because they are all daily discipline tracking, read by
 *  the same routine screen. `READ_ACTIVE` is the one import from the books
 *  domain: the seeded reading habit is wired to the active book from the
 *  moment it is created.
 * --------------------------------------------------------------------- */
import { uid, obj, rows, dayKey, daysBetween } from "./life-state-util.mjs";
import { READ_ACTIVE } from "./life-state-books.mjs";

/* --- the core --------------------------------------------------------- *
 *  The tasks were capped at three because a list of twenty is a list nobody
 *  finishes. The habits had no such cap, and the arithmetic made the case on
 *  its own: three real wins on a Sunday — water, Fajr, the gym — rendered as
 *  17%. A screen that tells someone who did three hard things that he failed
 *  is not measuring discipline, it is manufacturing the feeling of lacking
 *  it, and that is the feeling people close the app to get away from.
 *
 *  So a habit can be core, and the score counts only those. The rest still
 *  tick, still streak, still archive, still show their own run — they are
 *  simply additional rather than the measure. Five, for the same reason the
 *  tasks are three: a core of twelve is the old list wearing a new word.
 *
 *  With nothing marked the score falls back to every habit, which is exactly
 *  what it did before. That fallback is a floor, not the resting state — the
 *  routine screen asks for a core while there is none, because a feature
 *  that waits to be discovered in a settings pane never is.
 * ---------------------------------------------------------------------- */
export const CORE_CAP = 5;
export const coreOf = (habits) => habits.filter((h) => h.core);
/* The one roster the score is read from. Every caller goes through it — the
   ring, the archive row, the streak, the toast the server sends — so they
   cannot end up dividing by three different denominators and disagreeing
   about the same day. */
export const scoredOf = (habits) => {
  const core = coreOf(habits);
  return core.length ? core : habits;
};
export const disciplineOf = (habits) => {
  const list = scoredOf(habits);
  if (!list.length) return 0;
  return Math.round((list.filter((h) => h.done).length / list.length) * 100);
};

/* --- the six blocks --------------------------------------------------- *
 *  The ids, in the order the day runs through them — the one canonical list
 *  of what blocks exist. Their labels, icons and tints live in LifeOS.jsx
 *  keyed by these ids, exactly like `NAV_IDS` and `NAV_META`, because a
 *  lucide component cannot be imported here.
 *
 *  The order is what makes «فاتك» answerable: a habit is behind you when its
 *  block opened before the one you are in, and that question needs a rank,
 *  not a label. `BLOCK_ANCHORS` in prayer-times.mjs pins each of them to a
 *  prayer in this same order — a test holds the two side by side, because
 *  the day cannot run in two different orders.
 * ---------------------------------------------------------------------- */
export const BLOCK_IDS = [
  "morning",
  "afternoon",
  "asr",
  "maghrib",
  "postisha",
  "night",
];
/* Where a block sits in the day. A group id this build no longer has — a
   hand-edited backup, an older seed — ranks last rather than throwing: it
   is still the user's habit and it still has to render somewhere. */
export const blockRank = (id) => {
  const at = BLOCK_IDS.indexOf(id);
  return at < 0 ? BLOCK_IDS.length : at;
};

/* The habits still open, split by where the day has got to: the block he is
   in now, the blocks that have already closed, and the ones still ahead.
 *
 *  His own order is kept inside each group, never re-sorted — the routine
 *  screen lets him drag the list into the order he lives it, and a second
 *  screen quietly showing a different order is a second app. Core habits are
 *  marked, not moved, for the same reason.
 *
 *  An unknown block id lands in `later` by way of `blockRank`, which is the
 *  safe side: a habit announced as missed when it never opened is a screen
 *  manufacturing guilt out of a damaged payload.
 */
export function remainingIn(habits, blockId, keep) {
  const here = [];
  const missed = [];
  const later = [];
  const now = blockRank(blockId);
  /* A habit that was ticked a moment ago is still listed, because the reward
     has to play somewhere. A row that vanishes on the tap animates nothing,
     and «every completion pays out» is not a decoration — it is the whole
     transaction the screen offers. The caller holds the ids for as long as
     the animation runs and then lets them go. */
  const held = keep instanceof Set ? keep : new Set(Array.isArray(keep) ? keep : []);
  for (const h of rows(habits)) {
    if (h.done && !held.has(h.id)) continue;
    const at = blockRank(h.group);
    if (at === now) here.push(h);
    else if (at < now) missed.push(h);
    else later.push(h);
  }
  return { here, missed, later };
}

/* The "بعد العشاء" block was split out of "المساء" in schema 4. These labels
   drive both the seed and the migration, so an existing user's صلاة العشاء
   moves into the new block instead of being duplicated beside it. */
export const POSTISHA_LABELS = [
  "صلاة العشاء",
  "تقييم اليوم: التزمت؟",
  "تحضير مهام الغد الثلاث",
];
export const LEGACY_POSTISHA = new Set(["صلاة العشاء", "تقييم يومي", ...POSTISHA_LABELS]);

/* Added in schema 6. Kept in their own list so the migration can top up an
   existing profile with exactly the ones it is missing. */
export const ADDED_HABITS = [
  { label: "تمارين مقاومة (صدر/بطن) أو T-Bar + ١٥ ألف خطوة", group: "morning" },
  { label: "محادثة إنجليزية مع متحدث أصلي", group: "afternoon" },
  { label: "تحضير وجبة الغد: دجاج صيني وأرز", group: "maghrib" },
];

/* Schema 8 split the old "المساء" block into "بعد العصر" و"بعد المغرب". */
export const ASR_HABITS = [
  { label: "صلاة العصر", group: "asr" },
  { label: "مراجعة سريعة لمهام اليوم", group: "asr" },
  { label: "مشي أو حركة خفيفة", group: "asr" },
];
export const MAGHRIB_HABITS = [{ label: "صلاة المغرب وأذكار", group: "maghrib" }];

/* --- water ------------------------------------------------------------ *
 *  Eight cups is the figure everyone already knows, so it is the default.
 *  The count is per-day and deliberately absent from `carryOf`: yesterday's
 *  water is not today's. The cap exists because the cups are rendered one
 *  per glass, and a hand-edited backup asking for four hundred of them
 *  would lock the routine screen up drawing them.
 * ---------------------------------------------------------------------- */
export const WATER_GOAL_DEFAULT = 8;
export const WATER_GOAL_MAX = 20;
export const clampGoal = (n) =>
  Number.isFinite(+n) && +n >= 1
    ? Math.min(WATER_GOAL_MAX, Math.round(+n))
    : WATER_GOAL_DEFAULT;

export const COST_TYPES = [
  {
    id: "money",
    label: "مال",
    unit: "ريال",
    forms: ["ريال", "ريالان", "ريالات", "ريالًا"],
    tint: "#FFB020",
  },
  {
    id: "time",
    label: "وقت",
    unit: "ساعة",
    forms: ["ساعة", "ساعتان", "ساعات", "ساعة"],
    tint: "#00C2FF",
  },
];
export const costType = (id) => COST_TYPES.find((c) => c.id === id) || COST_TYPES[0];

/* --- the weakness mirror ---------------------------------------------- *
 *  A relapse written as prose is a diary: it reads well once and can never
 *  be counted. So every confrontation with the urge — the ones that won and
 *  the ones that lost — carries a cause, a mood and the clock hour beside
 *  the free text. That is the whole point of the screen: to say back to the
 *  user the one sentence he cannot say about himself — *this* is what takes
 *  you down, and *this* is when it comes for you.
 *
 *  Every tag ships with its own counter-move. A diagnosis with no
 *  prescription is just a nicer way of telling someone he is weak.
 * ---------------------------------------------------------------------- */
export const URGE_TAGS = [
  {
    id: "big",
    label: "المهمة كبيرة",
    tint: "#FF7A45",
    counter:
      "قصّها إلى خطوة واحدة مدّتها خمس دقائق، واكتبها كفعل لا كهدف: «افتح الملف»، لا «أنجز التقرير».",
  },
  {
    id: "unclear",
    label: "لا أعرف من أين أبدأ",
    tint: "#FFB020",
    counter:
      "لا تبدأ — خطّط فقط. اكتب أول ثلاث خطوات على ورقة ثم نفّذ الأولى وحدها. الغموض هو ما يشلّك، لا الكسل.",
  },
  {
    id: "fear",
    label: "خوف من الفشل",
    tint: "#FF4D8D",
    counter:
      "اصنع نسخة سيئة عمدًا. المسوّدة الرديئة تكسر الرهبة، والجودة تأتي من التعديل لا من البداية.",
  },
  {
    id: "phone",
    label: "الهاتف بيدي",
    tint: "#00C2FF",
    counter:
      "الهاتف في غرفة أخرى قبل أن تجلس، لا في جيبك. إرادتك لا تنافس إشعارًا صُمّم ليخطفها.",
  },
  {
    id: "bored",
    label: "ملل",
    tint: "#9D5CFF",
    counter:
      "املأ الفراغ قبل أن يملأك هو. ضع البديل جاهزًا في متناول يدك قبل أن يأتي الملل بساعة.",
  },
  {
    id: "tired",
    label: "إرهاق",
    tint: "#5B8CFF",
    counter:
      "النوم ليس مكافأة بعد الإنجاز، هو شرطه. نَم بدل أن تقاوم بنصف دماغ — المقاومة المرهقة تخسر دائمًا.",
  },
  {
    id: "stress",
    label: "ضغط أو قلق",
    tint: "#FF3B5C",
    counter:
      "أفرغ ما يضغطك على ورقة دقيقتين، ثم اختر أصغر بند فيها ونفّذه. القلق يتغذّى على القائمة المخفيّة.",
  },
  {
    id: "lonely",
    label: "وحدة",
    tint: "#FF5722",
    counter:
      "اتصل بأحدهم أو انتقل إلى مكان فيه ناس. الوحدة هي الساحة المفضّلة لكل عادة تريد كسرها.",
  },
  {
    id: "people",
    label: "رفقة تجرّني",
    tint: "#10B981",
    counter:
      "جهّز جملة رفض قصيرة تقولها بلا شرح ولا اعتذار. التردّد نصف ثانية هو ما يُستغل.",
  },
  {
    id: "free",
    label: "فراغ مفاجئ",
    tint: "#FFB020",
    counter:
      "الفراغ غير المخطّط يسلّم نفسه للعادة. احجز له بديلًا داخل الروتين بدل أن تتركه مفتوحًا.",
  },
];
export const tagOf = (id) => URGE_TAGS.find((t) => t.id === id) || null;

export const URGE_MOODS = [
  { id: "empty", label: "فارغ" },
  { id: "anxious", label: "قلِق" },
  { id: "angry", label: "غاضب" },
  { id: "low", label: "محبط" },
  { id: "spent", label: "منهك" },
  { id: "restless", label: "مشتّت" },
];
export const moodOf = (id) => URGE_MOODS.find((m) => m.id === id) || null;

/* Bands, not hours. "أكثر ما تسقط الساعة ١١" is a trivia fact; "بعد العشاء
   إلى منتصف الليل" is a window a person can actually defend. The last band
   starts at midnight and ends at four, so nothing wraps and every hour of
   the clock lands in exactly one band. */
export const urgeShape = (u, kind = "hold") => (
  (u = obj(u)),
  {
  id: u.id || uid(),
  at: typeof u.at === "string" ? u.at : dayKey(),
  kind: u.kind === "fall" || kind === "fall" ? "fall" : "hold",
  days: Number.isFinite(Number(u.days)) ? Math.max(0, Number(u.days)) : 0,
  tag: tagOf(u.tag) ? u.tag : "",
  mood: moodOf(u.mood) ? u.mood : "",
  hour: Number.isFinite(Number(u.hour))
    ? Math.min(23, Math.max(0, Math.round(Number(u.hour))))
    : null,
  dow: Number.isFinite(Number(u.dow)) ? Math.min(6, Math.max(0, Number(u.dow))) : null,
  trigger: typeof u.trigger === "string" ? u.trigger : "",
  feeling: typeof u.feeling === "string" ? u.feeling : "",
});

/* Stamped at the moment of logging, not derived later. The hour comes from
   the wall clock and the weekday from the logical day: a craving at one in
   the morning belongs to «بعد منتصف الليل» but to *yesterday's* row, which
   is exactly how the person lived it. */
export const badHabitShape = (b) => (
  (b = obj(b)),
  {
  id: b.id || uid(),
  title: typeof b.title === "string" ? b.title : "",
  startDate: typeof b.startDate === "string" ? b.startDate : dayKey(),
  costType: b.costType === "time" ? "time" : "money",
  costPerDay: Number.isFinite(Number(b.costPerDay))
    ? Math.max(0, Number(b.costPerDay))
    : 0,
  replacement: typeof b.replacement === "string" ? b.replacement : "",
  /* Falls and holds live in two arrays because they are read separately —
     the card counts the falls, the mirror counts both. */
  logs: Array.isArray(b.logs) ? b.logs.map((l) => urgeShape(l, "fall")) : [],
  urges: Array.isArray(b.urges) ? b.urges.map((u) => urgeShape(u, "hold")) : [],
});

/* --- a habit, and the smallest version of it -------------------------- *
 *  Every habit can carry a second, smaller version of itself: `min`, one
 *  line, written by the user. «ساعة في النادي» has «عشر دقائق مشي»; «قراءة
 *  عشرين صفحة» has «صفحة واحدة». It exists because the day a run dies is
 *  never the day something was hard — it is the day something was
 *  impossible, and the only move left was to skip it and watch the number
 *  fall. A habit with a floor has a third option.
 *
 *  A tiny tick is a tick: it counts for the score, for the streak and for
 *  the archive, and it animates the same reward, because a completion that
 *  pays out less than it costs is a completion nobody takes. It is only
 *  *marked* differently, so a month read back says which days were carried
 *  on the floor rather than the full thing. `tiny` without `done` is not a
 *  state this app has, so the shape clamps it rather than storing a half
 *  truth.
 *
 *  `habitShape` is the one place a habit's fields are written, like
 *  `taskShape` and `bookShape`.
 * ---------------------------------------------------------------------- */
export const HABIT_MIN_MAX = 70;
export const habitShape = (h) => (
  (h = obj(h)),
  {
  id: h.id || uid(),
  label: typeof h.label === "string" ? h.label : "",
  /* Kept exactly as written, never re-pointed at a block this build knows:
     `blockRank` already lands an unknown id last and `groupOf` renders it
     in the night block, which is the safe side. Rewriting it here would
     move the user's habit on the strength of a damaged payload. */
  group: typeof h.group === "string" && h.group ? h.group : BLOCK_IDS[0],
  done: h.done === true,
  core: h.core === true,
  book: typeof h.book === "string" && h.book ? h.book : null,
  min: typeof h.min === "string" ? h.min.slice(0, HABIT_MIN_MAX) : "",
  tiny: h.done === true && h.tiny === true,
});

export const SEED_HABITS = [
  { id: uid(), label: "شرب ماء", group: "morning", done: false },
  { id: uid(), label: "صلاة الفجر وأذكار", group: "morning", done: false },
  ...ADDED_HABITS.filter((h) => h.group === "morning").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  { id: uid(), label: "جلسة STEP — ٩٠ دقيقة", group: "morning", done: false },
  { id: uid(), label: "صلاة الظهر", group: "afternoon", done: false },
  { id: uid(), label: "قراءة", group: "afternoon", done: false, book: READ_ACTIVE },
  ...ADDED_HABITS.filter((h) => h.group === "afternoon").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  ...ASR_HABITS.map((h) => ({ id: uid(), done: false, ...h })),
  ...MAGHRIB_HABITS.map((h) => ({ id: uid(), done: false, ...h })),
  ...ADDED_HABITS.filter((h) => h.group === "maghrib").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  ...POSTISHA_LABELS.map((label) => ({
    id: uid(),
    label,
    group: "postisha",
    done: false,
  })),
  { id: uid(), label: "الابتعاد عن الشاشات", group: "night", done: false },
  { id: uid(), label: "تدوين", group: "night", done: false },
  { id: uid(), label: "أذكار النوم", group: "night", done: false },
];

export const HOUR_BANDS = [
  { id: "dawn", label: "من الفجر إلى الضحى", from: 4, to: 10 },
  { id: "forenoon", label: "من الضحى إلى الظهر", from: 10, to: 14 },
  { id: "afternoon", label: "من الظهر إلى المغرب", from: 14, to: 18 },
  { id: "evening", label: "من المغرب إلى العشاء", from: 18, to: 21 },
  { id: "night", label: "من العشاء إلى منتصف الليل", from: 21, to: 24 },
  { id: "small", label: "بعد منتصف الليل", from: 0, to: 4 },
];

export const bandAt = (h) =>
  HOUR_BANDS.find((b) => h >= b.from && h < b.to) || HOUR_BANDS[0];

export const bandOf = (id) => HOUR_BANDS.find((b) => b.id === id) || null;

export const cleanDays = (b) => daysBetween(b.startDate);

export const bleedSaved = (b) => cleanDays(b) * (b.costPerDay || 0);

/* The longest run ever, not just the current one — a relapse log carries the
   days it cost, so the record survives the reset that ended it. */
export const bestRun = (b) =>
  Math.max(cleanDays(b), ...(b.logs || []).map((l) => l.days || 0), 0);

/* --- diagnosis -------------------------------------------------------- *
 *  Everything the mirror claims is counted here and nowhere else, so the
 *  card can never drift from the numbers behind it. Each breakdown counts
 *  on its *own* denominator — an entry with a mood but no tag must not
 *  deflate the tag percentages, or the first few logs read as noise.
 * ---------------------------------------------------------------------- */
export const MIRROR_MIN = 4;

export const breakerEvents = (list) =>
  (list || []).flatMap((h) => [
    ...(h.logs || []).map((l) => ({ ...l, kind: "fall", habit: h.title })),
    ...(h.urges || []).map((u) => ({ ...u, kind: "hold", habit: h.title })),
  ]);

/* The commonest value of one field, with the share it holds. Returns null
   rather than a zeroed row when nothing carries the field — "٠٪ من
   مواجهاتك" is a claim about data that does not exist. */
export const topShare = (rows, pick) => {
  const tally = new Map();
  rows.forEach((r) => {
    const v = pick(r);
    if (v === null || v === undefined || v === "") return;
    tally.set(v, (tally.get(v) || 0) + 1);
  });
  if (!tally.size) return null;
  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((n, [, c]) => n + c, 0);
  return {
    value: sorted[0][0],
    count: sorted[0][1],
    total,
    pct: Math.round((sorted[0][1] / total) * 100),
    rows: sorted.map(([value, count]) => ({
      value,
      count,
      pct: Math.round((count / total) * 100),
    })),
  };
};

export function weakSpots(list) {
  const all = breakerEvents(list);
  const falls = all.filter((e) => e.kind === "fall");
  const holds = all.filter((e) => e.kind === "hold");
  const runs = falls.map((f) => Number(f.days) || 0);

  /* A trend wants two halves to compare, and halves of fewer than four runs
     are one bad week against another. Below that it is simply not claimed —
     an app that tells you you are "تتحسّن" off two data points teaches you
     to distrust it. */
  let trend = null;
  if (runs.length >= 4) {
    const half = Math.floor(runs.length / 2);
    const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
    const early = mean(runs.slice(0, half));
    const late = mean(runs.slice(half));
    if (late - early >= 1) trend = { dir: "up", early, late };
    else if (early - late >= 1) trend = { dir: "down", early, late };
    else trend = { dir: "flat", early, late };
  }

  return {
    total: all.length,
    falls: falls.length,
    holds: holds.length,
    ready: all.length >= MIRROR_MIN,
    hold: all.length ? Math.round((holds.length / all.length) * 100) : 0,
    avgRun: runs.length ? runs.reduce((a, b) => a + b, 0) / runs.length : 0,
    trend,
    tag: topShare(all, (e) => e.tag),
    /* The tag that most often *wins* — separate from the commonest tag on
       purpose. A trigger you meet ten times and survive nine is not your
       weak point; the one you meet three times and lose three is. */
    fatal: topShare(falls, (e) => e.tag),
    band: topShare(all, (e) =>
      Number.isFinite(e.hour) ? bandAt(e.hour).id : null,
    ),
    dow: topShare(all, (e) => (Number.isFinite(e.dow) ? e.dow : null)),
    mood: topShare(all, (e) => e.mood),
  };
}

/* How often a single tag ends in a fall. Printed beside the tag's bar, it
   turns a frequency list into a danger list. */
export const tagFallRate = (rows, id) => {
  const met = rows.filter((e) => e.tag === id);
  if (!met.length) return null;
  const lost = met.filter((e) => e.kind === "fall").length;
  return { met: met.length, lost, pct: Math.round((lost / met.length) * 100) };
};

/* --- the guard -------------------------------------------------------- *
 *  A diagnosis nobody acts on is trivia. The mirror already knows which
 *  band of the day takes the user down; this turns that into a warning that
 *  arrives *before* the hour does, which is the only moment it can help.
 * ---------------------------------------------------------------------- */
export const DANGER_MIN_HITS = 2;

export const DANGER_MIN_SHARE = 35;

/* The band only counts as *the* danger hour when it holds a real share of
   the confrontations. A band that leads by one event out of nine is a
   coincidence, and a warning that fires on a coincidence is a warning the
   user learns to scroll past. */
export function dangerWatch(list) {
  const w = weakSpots(list);
  if (!w.ready || !w.band) return null;
  if (w.band.count < DANGER_MIN_HITS || w.band.pct < DANGER_MIN_SHARE) return null;
  const share = w.fatal || w.tag;
  return {
    band: bandOf(w.band.value),
    pct: w.band.pct,
    tag: share ? tagOf(share.value) : null,
  };
}

/* Today's confrontations, for the archive row. Counted from the one place
   they live, so the calendar can never claim a day the breaker disagrees
   with. */
export const breakerToday = (list, day = dayKey()) => {
  const rows = breakerEvents(list).filter((e) => e.at === day);
  return {
    holds: rows.filter((e) => e.kind === "hold").length,
    falls: rows.filter((e) => e.kind === "fall").length,
  };
};
