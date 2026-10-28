/* --- the state, as plain data -----------------------------------------
 *  Everything the saved payload is made of: the day boundary, the seeds, the
 *  shapes, the migration and the two readings of the discipline score. It
 *  lives here rather than in LifeOS.jsx for the same reason prayer-times.mjs
 *  does — esbuild folds it back into the one file the build ships, so the
 *  split is in the source and not in what is served, and `node --test` can
 *  import it without a browser, without React and without installing a thing.
 *
 *  This file is itself split by domain now: the habit list, the goals vault,
 *  the book shelf and the rest each have their own file
 *  (`life-state-habits.mjs`, `life-state-goals.mjs`, `life-state-books.mjs`,
 *  `life-state-tasks.mjs`, `life-state-calendar.mjs`, `life-state-uni.mjs`,
 *  `life-state-finance.mjs`, `life-state-bot.mjs`, `life-state-streak.mjs`,
 *  and the dependency-free `life-state-util.mjs` every one of them is built
 *  on).
 *  What stays here is
 *  only what is inherently cross-cutting — the day boundary, `SCHEMA`, the
 *  nav order, the general cue quotes, and `freshState`/`migrate`/`carryOf`/
 *  `rollDay`, which by nature touch every domain's shape at once.
 *
 *  Every other file in the app still imports from `"./life-state.mjs"`
 *  alone — this file re-exports everything the 10 domain files export, so the
 *  split below is invisible to every consumer. Add a field to a domain file
 *  and it is already exported from here; nothing else needs to change.
 *
 *  Two rules this module (and every file beneath it) keeps:
 *
 *  - Nothing in here touches window, document, localStorage or a lucide
 *    icon. The moment one of them appears, the tests stop being able to load
 *    the file and the only safety net over 21,000 lines goes with them.
 *  - Everything the app uses is exported. A helper left behind is a
 *    ReferenceError at first render, which is a blank white page.
 * --------------------------------------------------------------------- */

import {
  dayKey,
  uid,
  obj,
  rows,
  isKey,
  addDays,
  monthDays,
  yesterdayKey,
} from "./life-state-util.mjs";
import {
  LEGACY_POSTISHA,
  POSTISHA_LABELS,
  ADDED_HABITS,
  ASR_HABITS,
  MAGHRIB_HABITS,
  badHabitShape,
  habitShape,
  clampGoal,
  SEED_HABITS,
  freezeShape,
} from "./life-state-habits.mjs";
import {
  ADDED_TASKS,
  taskShape,
  capToday,
  applyPrep,
  prepCarry,
  PRIORITIES,
  sortTasks,
  prepShape,
  SEED_TASKS,
} from "./life-state-tasks.mjs";
import {
  currentQuarter,
  goalShape,
  ADDED_GOALS,
  SEED_LINKS,
  parentHorizon,
  northStarShape,
  SEED_GOALS,
} from "./life-state-goals.mjs";
import {
  bookShape,
  READ_ACTIVE,
  READ_GOAL_DEFAULT,
  SEED_BOOKS,
  SEED_READS,
} from "./life-state-books.mjs";
import { eventShape, placeShape } from "./life-state-calendar.mjs";
import { incomeShape, expenseShape, MONEY_CAP } from "./life-state-finance.mjs";
import { botShape } from "./life-state-bot.mjs";
import {
  focusShape,
  focusCarry,
  sessionShape,
  SESSION_CAP,
} from "./life-state-focus.mjs";
import { uniShape, SEED_UNI } from "./life-state-uni.mjs";
import { gymShape, gymCarry } from "./life-state-gym.mjs";
import { fillGaps, firstDay, streakBaseFrom } from "./life-state-streak.mjs";
import { sleepLogsOf } from "./life-state-sleep.mjs";

/* --- the tabs --------------------------------------------------------- *
 *  The ids, in the order the sidebar shows them — the one canonical list of
 *  what tabs exist and where they sit. Their labels and their icons live in
 *  LifeOS.jsx keyed by these ids, because a lucide component cannot be
 *  imported here; `NAV` over there is built from this array, so adding a tab
 *  means adding it here first and the screen asks for its label next.
 * ---------------------------------------------------------------------- */
export const NAV_IDS = [
  "today",
  "routine",
  "agenda",
  "review",
  "uni",
  "matrix",
  "deep",
  "goals",
  "finance",
  "vault",
  "analytics",
  "breaker",
  "bot",
  "graph",
];

/* --- what the sidebar is divided into --------------------------------- *
 *  Twelve tabs in one column is a wall you read top to bottom every time,
 *  because nothing in it says which of them you are even looking for. The
 *  groups are the answer to that and nothing more: a heading and a gap, so
 *  the eye lands on a third of the list instead of all of it.
 *
 *  They are a *view*, not a second ordering. Which tabs exist, their order,
 *  and whether they show at all now live in one place — `sidebarNav` in
 *  src/life-config.js — and a group here just lists whichever of its own
 *  ids that array still shows, in the order that array puts them. There is
 *  no second order to disagree with it any more.
 *
 *  A tab with no group would silently vanish from the sidebar, so a test
 *  holds these ids against `NAV_IDS`.
 * ---------------------------------------------------------------------- */
export const NAV_GROUPS = [
  { id: "daily", label: "التركيز اليومي", ids: ["today", "routine", "agenda", "review", "deep"] },
  { id: "growth", label: "النمو والتطوير", ids: ["goals", "uni", "finance"] },
  { id: "tools", label: "الأدوات", ids: ["matrix", "breaker", "vault", "analytics", "bot", "graph"] },
];
export const GROUP_OF_TAB = new Map(
  NAV_GROUPS.flatMap((g) => g.ids.map((id) => [id, g.id])),
);

/* --- the phone bar -----------------------------------------------------
 *  Four tabs fit a 375px bar and keep their labels legible; the rest live
 *  behind «المزيد». The number sits here rather than beside the component
 *  that draws the bar because it is also a floor on the state: the main list
 *  may never be emptied past it. One number, so the two cannot disagree.
 * ---------------------------------------------------------------------- */
export const TAB_BAR = 4;


/* --- daily cue -------------------------------------------------------- */
export const QUOTES = [
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
  { text: "العادة هي الفائدة المركّبة لتطوير الذات.", author: "جيمس كلير" },
  {
    text: "من عرف طول الطريق استعدّ له، ومن أيقن بالمنزل هان عليه السفر.",
    author: "ابن القيّم",
  },
  { text: "لا تُصلح عملك لأجل الناس، ولا تُفسده لأجلهم.", author: "الفضيل بن عياض" },
  {
    text: "الانضباط هو اختيار ما تريده أكثر على ما تريده الآن.",
    author: "أبراهام لينكون",
  },
  { text: "أصعب خطوة هي الأولى؛ وما بعدها عادة.", author: "أرسطو" },
  {
    text: "إذا لم تكن لك خطة، فستكون جزءًا من خطة غيرك.",
    author: "تيري ماكميلان",
  },
  { text: "عش يومك كأنه آخر أيامك، واعمل كأنك تعيش أبدًا.", author: "مثل عربي" },
  {
    text: "النجاح مجموع جهود صغيرة تتكرّر يومًا بعد يوم.",
    author: "روبرت كوليير",
  },
  { text: "أفضل وقت لغرس شجرة كان قبل عشرين عامًا، وثانيه اليوم.", author: "مثل صيني" },
  {
    text: "لن تتغيّر حياتك حتى تتغيّر عاداتك اليومية؛ السرّ في جدولك.",
    author: "جون مكسويل",
  },
  {
    text: "من استوى يوماه فهو مغبون، ومن كان غده شرًّا من يومه فهو ملعون.",
    author: "الحسن البصري",
  },
  { text: "التركيز يعني قول «لا» لمئة فكرة جيّدة.", author: "ستيف جوبز" },
  {
    text: "لا يُدرَك العلم براحة الجسم، ولا تُنال المعالي بالتمنّي.",
    author: "الإمام مسلم",
  },
  {
    text: "أنت ما تفعله بتكرار؛ فالتميّز ليس حدثًا بل عادة.",
    author: "ويل ديورانت",
  },
  {
    text: "أعظم ما يملكه المرء وقتٌ فارغ يملؤه بما ينفع.",
    author: "ابن الجوزي",
  },
  { text: "لا تنتظر الإلهام؛ اذهب إليه بعصا غليظة.", author: "جاك لندن" },
  { text: "ما بدأتَه اليوم يصنع من تكون بعد سنة.", author: "سينيكا" },
];

/* The cue list is seed data the user owns from the first load: it is copied
   into state so a quote can be edited, added to or deleted. QUOTES itself
   stays the immutable seed the migration reads from. */
export const SEED_QUOTES = () => QUOTES.map((q) => ({ id: uid(), ...q }));

export const SCHEMA = 34;

/* --- the daily goal ------------------------------------------------ *
 *  One number the user picks and breaks every day. It lives in the state
 *  rather than a per-viewer preference because the Telegram bot reads it
 *  too — the point of the number is that the bot can say «باقي 15 نقطة
 *  للهدف» at eight in the evening, and a value kept in localStorage is a
 *  value only the browser can see.
 *
 *  Bounds are loose on purpose: 30 is not too low and 95 is not too high,
 *  because the number is the user's choice and the point is not for this
 *  file to have an opinion about it.
 * ------------------------------------------------------------------- */
export const DAILY_GOAL_DEFAULT = 60;
export const DAILY_GOAL_MIN = 30;
export const DAILY_GOAL_MAX = 95;
export const clampDailyGoal = (n) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) && v >= DAILY_GOAL_MIN && v <= DAILY_GOAL_MAX
    ? v
    : DAILY_GOAL_DEFAULT;
};

export const freshState = (carry = {}) => ({
  schema: SCHEMA,
  date: dayKey(),
  /* `tiny` resets with `done` and for the same reason: it is this day's
     answer about this habit, not a property of the habit. Yesterday's floor
     is not today's. */
  habits: (carry.habits || SEED_HABITS).map((h) => ({
    ...h,
    done: false,
    tiny: false,
  })),
  /* Tomorrow's three, if they were chosen last night. `applyPrep` reads the
     prep that is riding along in the carry and promotes exactly those;
     with nothing prepared it only re-asserts the cap and leaves his flags
     where they were. */
  tasks: applyPrep(
    (carry.tasks || SEED_TASKS).map((t) => ({ ...t, done: false })),
    carry.tomorrow,
    dayKey(),
  ),
  books: carry.books || SEED_BOOKS,
  goals: carry.goals || SEED_GOALS(),
  sessions: carry.sessions || [],
  /* The focus desk: the rhythms, the daily goal, the switches, and the run
     still counting if one is. The cycle count is the one thing `focusCarry`
     resets — four rounds yesterday must not hand this morning's first round
     a long break — and the run itself crosses, because a round begun at
     03:50 is still being worked at 04:01. */
  focus: focusCarry(carry.focus),
  income: carry.income || [],
  /* What the day cost, beside what it paid. Both carry across a rollover
     whole — every row is dated, so neither of them belongs to "today" in the
     first place, exactly like the calendar's events. */
  expenses: carry.expenses || [],
  ventures: carry.ventures || [],
  badHabits: carry.badHabits || [],
  /* The calendar and the university desk. Every row in both is keyed to a
     calendar date of its own, so they cross a day rollover untouched —
     nothing in either of them belongs to "today" in the first place. */
  events: carry.events || [],
  uni: carry.uni || SEED_UNI(),
  /* النادي: الرياضات والحصص والوزن والقياسات. يَعبُر كاملاً مثل التقويم
     والجامعة — كل صف فيه مؤرَّخ بتاريخه، فلا شيء منه ينتمي إلى «اليوم». */
  gym: gymCarry(carry.gym),
  /* المخطَّط 34 يضيف النوم بوصفه حقل حالة حقيقياً لا سطراً محلياً في
     localStorage شاشة النوم وحدها — انظر تعليق أعلى `life-state-sleep.mjs`.
     كل صف مؤرَّخ بتاريخه فيَعبُر كاملاً، مثل النادي والتقويم. */
  sleepLogs: carry.sleepLogs || [],
  quotes: carry.quotes || SEED_QUOTES(),
  reads: carry.reads || SEED_READS(),
  reading: carry.reading || [],
  readGoal: carry.readGoal ?? READ_GOAL_DEFAULT,
  /* The word and the vision outlive every goal underneath them, so they
     carry; the glasses of water do not, and are deliberately absent from
     `carryOf` below — yesterday's water is not today's. */
  northStar: northStarShape(carry.northStar),
  place: placeShape(carry.place),
  waterGoal: clampGoal(carry.waterGoal),
  /* What the Telegram bot sends unprompted, and when. Carried whole — a
     schedule has nothing to do with which day it is. */
  bot: botShape(carry.bot),
  /* The evening's prep, spent or still waiting. It carries — a prep written
     at 22:00 has to survive the rollover that consumes it — but it is spent
     by the line above, so the day it named clears it. */
  tomorrow: prepCarry(carry.tomorrow, dayKey()),
  water: 0,
  cueImage: carry.cueImage ?? null,
  history: carry.history || [],
  streakBase: carry.streakBase || 0,
  bestStreak: carry.bestStreak || 0,
  freezes: freezeShape(carry.freezes),
  dayBanked: false,
  goal: clampDailyGoal(carry.goal),
});

/* Reshapes a saved payload without discarding anything the user typed. */
export function migrate(saved) {
  saved = obj(saved);
  /* The revision rides along with any payload read back off the disk, and it
     is not part of the day: it counts writes, it lives in its own storage
     key, and a copy of it inside the state would be stale the moment the
     next save moved it. Dropped here so there is one place it cannot leak
     in from — the disk recovery, an imported backup, a hand-edited file. */
  if ("rev" in saved) {
    const { rev, ...rest } = saved;
    saved = rest;
  }
  const from = saved.schema || 0;

  /* Every list is cleaned of holes before a single branch below touches it.
     A row that is `null`, a number or a string is not data this app can
     repair — it is damage — and carrying it forward only moves the throw
     somewhere further from a try/catch. The one that mattered was
     `history`: it survived migration untouched and then took the render
     down on `.find(h => h.date === today)`, which is a white screen that
     reloading cannot clear because the payload is already saved. */
  let habits = rows(saved.habits);
  /* Schema 20 gives a habit a `core` flag. Nobody's is set on the way in, and
     that is the point: the fallback keeps the score exactly where it was,
     and the routine screen asks him which five rather than this function
     guessing at them. Which habits carry someone's day is not a question a
     migration is in any position to answer. */
  habits = habits.map((h) => ({ ...h, core: !!h.core }));


  if (from < 4) {
    habits = habits.map((h) =>
      h.group === "evening" && LEGACY_POSTISHA.has(h.label)
        ? { ...h, group: "postisha", label: h.label === "تقييم يومي" ? "تقييم اليوم: التزمت؟" : h.label }
        : h,
    );
    const present = new Set(
      habits.filter((h) => h.group === "postisha").map((h) => h.label),
    );
    const missing = POSTISHA_LABELS.filter((l) => !present.has(l)).map((label) => ({
      id: uid(),
      label,
      group: "postisha",
      done: false,
    }));
    if (missing.length) habits = [...habits, ...missing];
  }

  /* Goals predate quarters. Park every existing one in the quarter the user
     is living in, so nothing they wrote disappears behind a tab. */
  let goals = rows(saved.goals);
  if (from < 5) {
    const here = currentQuarter();
    goals = goals.map((g) => (g.quarter ? g : { ...g, quarter: here }));
  }

  /* Schema 19 stacks the goals into three horizons. Everything a schema-18
     profile holds was a 90-day goal, so that is the horizon it lands in —
     `goalShape` defaults to it, which is why there is no mapping step here. */
  goals = goals.map(goalShape);

  if (from < 19) {
    /* Top up with the two horizons above the 90-day line, which this payload
       has none of. Matched on text so a user who already wrote one of these
       himself never ends up with a second copy beside it, and the seed's own
       ids are kept — the parent links between the added rows are what makes
       them a tree rather than two flat lists.
       The match is per horizon, not across all of them: «قراءة ٢٤ كتابًا» as a
       90-day goal and the same words as a yearly one are two different
       commitments, and treating the first as proof of the second would leave
       the yearly row missing and its children with nothing to serve. */
    const have = new Set(goals.map((g) => `${g.horizon} ${g.text.trim()}`));
    const added = ADDED_GOALS().filter(
      (g) => !have.has(`${g.horizon} ${g.text.trim()}`),
    );
    goals = [...goals, ...added];

    /* Wire the user's own 90-day goals into the tree. They came from this
       same seed list before the horizons existed, so the text is the join —
       and the yearly row matched here may be one just added above or one he
       had already written, which is exactly why the lookup runs over the
       merged list rather than over `added`. */
    const yearByText = new Map(
      goals
        .filter((g) => g.horizon === "year")
        .map((g) => [g.text.trim(), g.id]),
    );
    goals = goals.map((g) => {
      if (g.horizon !== "quarter" || g.parent) return g;
      const wanted = SEED_LINKS.get(g.text.trim());
      const parent = wanted ? yearByText.get(wanted.trim()) : null;
      return parent ? { ...g, parent } : g;
    });
  }

  /* A parent is only a shape to `goalShape`; whether it points anywhere real
     can only be answered with the whole list in hand. Three ways it can be
     wrong — a goal that no longer exists, one in the wrong horizon, and a
     goal pointed at itself — and all three are cut to null rather than
     carried, because `goalPct` would otherwise walk a chain that has no end
     and take the render down with it. */
  {
    const byId = new Map(goals.map((g) => [g.id, g]));
    goals = goals.map((g) => {
      if (!g.parent) return g;
      const up = byId.get(g.parent);
      const want = parentHorizon(g.horizon);
      if (!up || up.id === g.id || !want || up.horizon !== want)
        return { ...g, parent: null };
      return g;
    });
    /* A cycle needs no bad horizon to exist: year→h3 is legal in both
       directions on its own, so a hand-edited backup can close a loop that
       every single row passes. Walk each chain to the top and cut the link
       that comes back round. */
    const live = new Map(goals.map((g) => [g.id, g]));
    goals = goals.map((g) => {
      const seen = new Set([g.id]);
      let at = g.parent;
      while (at) {
        if (seen.has(at)) return { ...g, parent: null };
        seen.add(at);
        at = live.get(at)?.parent || null;
      }
      return g;
    });
  }

  /* Top up with the routines added in schema 6, matching on label so a
     profile that already has one (or renamed it) never gets a duplicate. */
  let tasks = rows(saved.tasks);
  if (from < 6) {
    {
      const have = new Set(habits.map((h) => h.label));
      habits = [
        ...habits,
        ...ADDED_HABITS.filter((h) => !have.has(h.label)).map((h) => ({
          id: uid(),
          done: false,
          ...h,
        })),
      ];
    }
    {
      const have = new Set(tasks.map((t) => t.text));
      tasks = [
        ...tasks,
        ...ADDED_TASKS.filter((t) => !have.has(t.text)).map((t) => ({
          id: uid(),
          today: false,
          done: false,
          ...t,
        })),
      ];
    }
  }

  /* Schema 24 gives a task the first step it starts with, and gives the
     night before it the screen that picks tomorrow's three. Neither needs
     converting: `taskShape` hands every existing task an empty step and
     `prepShape` hands an older payload an empty prep.
   *
   *  The cap does need converting. Until now the only door onto «أهم ٣
   *  مهام» was the matrix's promote button, which has refused a fourth
   *  since the rule existed — so a payload that came by its flags any other
   *  way (an older build, a hand-edited backup, a merge of two profiles)
   *  can be carrying four, and the prep is about to become a second door.
   *  Repaired once here; held at every door from now on by `capToday`. */
  tasks = tasks.map(taskShape);
  if (from < 24) tasks = capToday(tasks);

  /* "المساء" became "بعد المغرب", and "بعد العصر" is new. The old block's
     habits move rather than being recreated, so nothing the user wrote in
     it is lost or duplicated. */
  if (from < 8) {
    habits = habits.map((h) => {
      if (h.group === "evening") return { ...h, group: "maghrib" };
      if (h.group === "afternoon" && h.label === "صلاة العصر")
        return { ...h, group: "asr" };
      return h;
    });
    const have = new Set(habits.map((h) => h.label));
    habits = [
      ...habits,
      ...[...ASR_HABITS, ...MAGHRIB_HABITS]
        .filter((h) => !have.has(h.label))
        .map((h) => ({ id: uid(), done: false, ...h })),
    ];
  }

  /* Schema 9 hands the cue list to the user. An older payload has no
     quotes of its own, so it inherits the seed rather than opening on an
     empty card; one that already has them is left exactly as written. */
  let quotes = rows(saved.quotes);
  if (quotes.length === 0) quotes = SEED_QUOTES();
  else quotes = quotes.map((q) => (q.id ? q : { ...q, id: uid() }));

  let reads = rows(saved.reads);
  if (reads.length === 0) reads = SEED_READS();
  else reads = reads.map((q) => (q.id ? q : { ...q, id: uid() }));

  /* Schema 10 gave every book a workspace. Run the existing rows through
     bookShape so the new fields appear with sane defaults — spread last is
     wrong here, the saved values must win over the defaults.
   *
   *  Schema 31 gives every *point* a schedule, and `bookShape` is where the
   *  notes are shaped now — which is why this no longer reaches past it to
   *  carry `notes` through raw. There is no branch to write: a point with no
   *  `due` is read as waiting, which is what a point nobody has reviewed
   *  actually is, so an older shelf arrives with its whole backlog in the
   *  rotation and nothing was guessed on anybody's behalf. */
  let books = rows(saved.books).map(bookShape);

  /* Schema 11 links habits to books. Existing habits are ordinary unless
     they are the reading one, which is pointed at the active book so the
     feature works on the first open instead of after a settings hunt. */
  if (from < 11) {
    habits = habits.map((h) =>
      h.book === undefined
        ? { ...h, book: h.label === "قراءة" ? READ_ACTIVE : null }
        : h,
    );
  }

  /* Schema 12 adds the habit breaker. An older payload has no list at all;
     one written by a newer build is run through badHabitShape so a row that
     lost a field to a hand-edited backup comes back whole.

     Schema 16 adds the tagged confrontation — a cause, a mood and the clock
     hour on every entry, plus the `urges` list of cravings that were
     resisted. It needs no branch of its own: badHabitShape runs every row
     and every log through urgeShape on the way in, so an older relapse
     simply arrives with an empty tag and is skipped by the breakdowns
     instead of counted as an unknown cause. */
  const badHabits = rows(saved.badHabits).map(badHabitShape);

  /* Schema 17 adds the calendar and the university desk. An older payload
     has neither and starts them empty; one written by a newer build is run
     back through the shapes, so a row that lost a field to a hand-edited
     backup comes back whole instead of crashing a render.

     Schema 18 adds the recorded absence days, the course link, the
     graduation total and the target cumulative. None of them needs a
     branch of its own: every one is a new field with a defined empty
     value, and `uniShape` already runs over the whole payload on the way
     in — so a schema-17 profile simply arrives with an empty absence log
     and the two totals switched off, which is what it means. */
  const events = rows(saved.events).map(eventShape);
  const uni = saved.uni ? uniShape(saved.uni) : SEED_UNI();

  /* Schema 13 through 22 used to migrate a user-ordered tab list here —
     navOrder/navMore, placed by hand per schema as new tabs arrived. That
     whole mechanism moved to a single static array (sidebarNav in
     src/life-config.js) which already lists every tab in its final order,
     so an older payload's navOrder/navMore fields are simply never read
     any more — nothing left here to migrate. */

  /* The archive row the whole app writes to. A hole here is the one that
     reaches the render rather than a shape, so it is cleaned here too — and
     a row whose date is not a date is not a day, it is damage. */
  let history = rows(saved.history).filter((h) => isKey(h.date));

  /* Schema 23 writes the unrecorded days down. Every payload before it has a
     row only for the days the app was opened, so the two days missed in the
     first week of October were indistinguishable from days that went to zero
     — and from days that have not happened yet. Filled once here, from the
     earliest row the archive holds through to yesterday. Today is left alone:
     it is still being lived, and the archive effect stamps it on mount. */
  if (from < 23) history = fillGaps(history, firstDay(history), yesterdayKey());

  /* Schema 25 forgives a day, and `streakBase` is a stored counter: every
     payload before this one holds a number that was computed under the rule
     that a single short day ends everything. Leaving it alone would leave
     the counter and the archive disagreeing about the same run — a second
     opinion, which is the one thing this app does not allow a streak to
     have — and would make the tolerance arrive only for days not yet lived.
     So it is read back off the rows, which is what `setDayDone` has done
     after every correction since the rule existed.
   *
   *  The habit's own floor (`min`) is NOT written here. Which smaller
   *  version of «ساعة في النادي» he would accept on a bad day is a question
   *  only he can answer, exactly as schema 20 refused to guess anybody's
   *  core; `habitShape` hands every habit an empty one and the routine
   *  screen asks. */
  const streakBase = from < 25 ? streakBaseFrom(history) : saved.streakBase;

  const { career: _career, pipeline: _pipeline, prompts: _prompts, reviews: _reviews, navOrder: _navOrder, navMore: _navMore, ...carried } = saved;
  return {
    ...carried,
    schema: SCHEMA,
    streakBase: Number.isFinite(+streakBase) && +streakBase > 0 ? +streakBase : 0,
    habits: habits.map(habitShape),
    goals,
    tasks,
    quotes,
    reads,
    books,
    badHabits,
    events,
    uni,
    /* المخطَّط 32 يضيف النادي. مُشكَّل ولا فرع له، كجدول البوت والمكتب
       قبله: حمولة من قبله تصل بالرياضتين المبذورتين وبلا حصة ولا وزن ولا
       قياس — وهو بالضبط معنى ألّا تكون الشاشة قد فُتحت بعد. و`migrate` لا
       تكتب حدًّا أدنى لرياضة ولا تخترع رياضة ثالثة، نفس امتناعها عن
       تخمين العادات الخمس الأساسية. */
    gym: gymShape(saved.gym),
    /* المخطَّط 34 يضيف `sleepLogs`. كان بوت تيليجرام الرئيسي يكتبه فعلاً
       (ومراجعته الأسبوعية في `ask.js` تقرأه) لكنه غاب عن هذه الدالة
       ومن `carryOf` معاً، فكل ليلة يكتبها البوت كانت تُمحى في أول دوران
       يوم — حمولة من قبله تصل ببساطة بلا ليلة واحدة، وهذا بالضبط معناه. */
    sleepLogs: sleepLogsOf(saved.sleepLogs),
    history,
    /* Schema 29 gives a focus round a shape. Every row written before it
       carried a day and a length and nothing else, so `sessionShape` fills
       the rest with what an older row *means*: `planned` equal to the
       minutes worked, `full: true` because the old timer only ever wrote a
       row on completion, no start time (the hour bands say how many rows
       they had to leave out rather than guessing), and no interruptions.
       Bounded like the money lists, for the same reason — a list with no
       ceiling is a payload that grows until a save throws. */
    sessions: rows(saved.sessions).map(sessionShape).slice(-SESSION_CAP),
    /* Schema 29's focus desk. Shaped rather than branched, like the bot's
       schedule: a payload from before it arrives with the four seeded
       rhythms, the default goal and a run of `null`, which is exactly what
       it means to have never opened the screen. `migrate` does not turn
       `autoDone` on — the old behaviour of a finished round silently
       ticking its task is not something to restore by default, and the
       end-of-round sheet asks instead. */
    focus: focusShape(saved.focus),
    /* Schema 27 gives the money two lists and both of them a shape. No
       branch is needed for either: an older payload simply arrives with no
       expenses, which is what it means, and the income rows it does hold go
       through `incomeShape` on the way in — which is the first time they
       ever have, so a row hand-edited into a bad amount is normalised here
       rather than turning every total on the screen into «NaN». Both are
       bounded: the lists are fed from a phone now, and a list with no
       ceiling is a payload that grows until a save throws. */
    income: rows(saved.income).map(incomeShape).slice(0, MONEY_CAP),
    expenses: rows(saved.expenses).map(expenseShape).slice(0, MONEY_CAP),
    ventures: rows(saved.ventures),
    reading: rows(saved.reading),
    readGoal: Number.isFinite(saved.readGoal)
      ? saved.readGoal
      : READ_GOAL_DEFAULT,
    /* Schema 19 adds the word, the vision, the place the prayer times are
       computed for and the water goal. None needs a branch: each is a new
       field with a defined empty value, and its shape runs over the whole
       payload on the way in — so a schema-18 profile simply arrives with an
       unwritten vision and the default city, which is what it means.
       `water` is the one exception and is clamped rather than shaped: it is
       per-day, and a count above the goal would draw cups that are not
       there. */
    northStar: northStarShape(saved.northStar),
    place: placeShape(saved.place),
    waterGoal: clampGoal(saved.waterGoal),
    /* Schema 28's bot schedule. Shaped rather than branched, like the four
       above: an older payload arrives with the defaults — the two briefs on
       at 07:00 and 20:00, every periodic reminder off — which is exactly
       what it means to have never opened the screen. `migrate` never turns
       a reminder *on*, the same refusal as the core five and the habit
       floor: what the bot may interrupt him for is not a question a
       migration is in any position to answer. */
    bot: botShape(saved.bot),
    /* Schema 30 gives a custom reminder a repeat (daily, weekday, monthly)
       and an optional condition. Shaped and not branched, like the schedule
       it sits in: a row written before either existed is read by what it
       already says — days picked means `week`, no days means `day` — so an
       older payload fires on exactly the evenings it fired on before, and
       `migrate` has not guessed anything. The condition defaults to
       «بلا شرط», which is the behaviour every existing reminder had. */
    /* Schema 24's evening prep. Shaped rather than branched, like the three
       above: an older payload simply arrives with nothing prepared, which is
       exactly what it means. Stale is not this function's problem — a prep
       for a day that has passed is dropped by `prepCarry` on the way through
       the rollover, where the day is known. */
    tomorrow: prepShape(saved.tomorrow),
    water:
      Number.isFinite(+saved.water) && +saved.water > 0
        ? Math.min(clampGoal(saved.waterGoal), Math.round(+saved.water))
        : 0,
    cueImage: typeof saved.cueImage === "string" ? saved.cueImage : null,
    freezes: freezeShape(saved.freezes),
    goal: clampDailyGoal(saved.goal),
  };
}

/* Everything that outlives a day, in one place. Both the reload path and the
   live rollover read this list — a key missing from it is data that quietly
   vanishes at the next day boundary, so it must never be written twice. */
export const carryOf = (s) => ({
  habits: s.habits,
  tasks: s.tasks,
  books: s.books,
  goals: s.goals,
  sessions: s.sessions,
  focus: s.focus,
  income: s.income,
  expenses: s.expenses,
  ventures: s.ventures,
  badHabits: s.badHabits,
  events: s.events,
  uni: s.uni,
  gym: s.gym,
  sleepLogs: s.sleepLogs,
  quotes: s.quotes,
  reads: s.reads,
  reading: s.reading,
  readGoal: s.readGoal,
  northStar: s.northStar,
  place: s.place,
  waterGoal: s.waterGoal,
  bot: s.bot,
  tomorrow: s.tomorrow,
  cueImage: s.cueImage,
  history: s.history,
  bestStreak: s.bestStreak,
  freezes: s.freezes,
  goal: s.goal,
});

/* The day turning over, applied to a state already in memory. The reload
   path and the live clock must agree on what a new day means, or a window
   left open overnight ends up on a different footing from one reopened in
   the morning — which is exactly how a night's work got written onto the
   next day's row and then wiped. Returns the same object when nothing has
   changed, so React can bail out of the render. */
export function rollDay(s) {
  if (s.date === dayKey()) return s;
  /* The archive, with the missed days written down — built first because
     the streak is now read back off it rather than nudged. A counter that
     said «+1 if yesterday banked, else 0» cannot forgive anything: it has
     no idea whether the day before yesterday was a run or a ruin. Reading
     the rows is also the rule `setDayDone` has followed after every
     correction since the rule existed, so there is one answer and not two. */
  const history = fillGaps(s.history, addDays(s.date, 1), yesterdayKey());
  return freshState({
    ...carryOf(s),
    /* Every day between the one being left behind and yesterday, written
       down as unrecorded. Closing the laptop on Thursday and opening it on
       Monday used to leave three blank squares that read exactly like three
       zeroes; now they say so. The day being left behind already has a row
       of its own — the archive effect stamped it — so the walk starts the
       day after it. */
    history,
    streakBase: streakBaseFrom(history),
  });
}

/* --- the re-export barrel ----------------------------------------------
 *  Every name every domain file exports, re-exported so a consumer can keep
 *  importing from this one file exactly as before the split. One statement
 *  per domain file, listing that file's full public surface — nothing here
 *  is picked and chosen.
 * --------------------------------------------------------------------- */
export {
  DAY_START_HOUR,
  logicalNow,
  fmtDay,
  dayKey,
  yesterdayKey,
  uid,
  obj,
  rows,
  keyToDate,
  isKey,
  addDays,
  monthDays,
  hhmm,
  minsIn,
  clampNum,
  daysBetween,
  stamp,
  daysTo,
  daysUntil,
} from "./life-state-util.mjs";

export {
  CORE_CAP,
  coreOf,
  scoredOf,
  disciplineOf,
  BLOCK_IDS,
  blockRank,
  remainingIn,
  POSTISHA_LABELS,
  LEGACY_POSTISHA,
  ADDED_HABITS,
  ASR_HABITS,
  MAGHRIB_HABITS,
  WATER_GOAL_DEFAULT,
  WATER_GOAL_MAX,
  clampGoal,
  HABIT_MIN_MAX,
  habitShape,
  SEED_HABITS,
  COST_TYPES,
  costType,
  URGE_TAGS,
  tagOf,
  URGE_MOODS,
  moodOf,
  urgeShape,
  badHabitShape,
  HOUR_BANDS,
  bandAt,
  bandOf,
  cleanDays,
  bleedSaved,
  bestRun,
  MIRROR_MIN,
  breakerEvents,
  topShare,
  weakSpots,
  tagFallRate,
  DANGER_MIN_HITS,
  DANGER_MIN_SHARE,
  dangerWatch,
  breakerToday,
  IDENTITIES,
  HABIT_LEVEL_POINTS,
  inferHabitIdentity,
  identityScores,
  freezeShape,
  contextualBlock,
  chainedHabits,
} from "./life-state-habits.mjs";

export {
  TOP_TASK_CAP,
  ADDED_TASKS,
  SEED_TASKS,
  QUADRANT_IDS,
  STEP_MAX,
  ESTIMATE_MAX,
  AGED_DAYS,
  DUE_SOON_DAYS,
  QUADRANT_WIP,
  taskShape,
  capToday,
  taskAge,
  taskOverdue,
  taskDueToday,
  taskDueSoon,
  nextOrder,
  orderedOpen,
  orderedDone,
  estimateTotal,
  wipOf,
  scheduledTasks,
  reorderWithin,
  tomorrowKey,
  prepShape,
  prepPicks,
  prepFull,
  prepHas,
  prepPickAdd,
  prepPickDrop,
  prepPickEvent,
  prepReady,
  applyPrep,
  prepCarry,
  PRIORITIES,
  sortTasks,
} from "./life-state-tasks.mjs";

export {
  QUARTERS,
  currentQuarter,
  QUARTER_IDS,
  PILLARS,
  PILLAR_IDS,
  HORIZONS,
  HORIZON_IDS,
  parentHorizon,
  ARC,
  RUNWAY,
  GOAL_YEARS,
  YEAR_MIN,
  YEAR_MAX,
  WORD_MAX,
  VISION_MAX,
  northStarShape,
  DATE_RE,
  goalShape,
  GOAL_TREE,
  buildGoals,
  SEED_GOALS,
  ADDED_GOALS,
  SEED_LINKS,
  quarterOf,
  pillarOf,
  horizonOf,
  goalPct,
  goalPace,
  goalEnd,
  windowOf,
  yearQuarters,
  windowStand,
  openingWindow,
  syncHabitToGoals,
  syncTaskToGoal,
  GROWTH_STAGES,
  GROWTH_WEIGHTS,
  GROWTH_STREAK_FULL,
  GROWTH_WEEK,
  weekPace,
  treeGrowth,
} from "./life-state-goals.mjs";

/* The library, plus its memory: a point carries the day it comes back on,
   so the shelf is something the reading is kept *in* rather than only
   logged to. (A comment inside the braces below hides the name after it
   from `tests/split.test.mjs`, which reads these blocks as text.) */
export {
  READ_ACTIVE,
  READ_GOAL_DEFAULT,
  bookShape,
  BOOK_CATEGORIES,
  SEED_BOOKS,
  READING_QUOTES,
  SEED_READS,
  bookForHabit,
  withdrawReading,
  sumPages,
  readStreak,
  pctOf,
  noteShape,
  noteDue,
  dueNotes,
  reviewedNote,
  countNotes,
  notesSince,
  REVIEW_STEPS,
  NOTE_MAX,
  NOTE_CAP,
  activeBook,
  pagesLeft,
  lastReadOn,
  stalledDays,
  readPace,
  PACE_WINDOW,
} from "./life-state-books.mjs";

export {
  PLACES,
  PLACE_BY_ID,
  placeShape,
  EVENT_KINDS,
  REPEATS,
  WARN_CHOICES,
  eventShape,
  kindOf,
  repeatOf,
  occurrences,
  isEventDone,
  byClock,
  eventsIn,
  UPCOMING_AHEAD,
  UPCOMING_BACKLOG,
  upcoming,
  upcomingRows,
  alertsOf,
} from "./life-state-calendar.mjs";

export {
  GRADES,
  gradeOf,
  UNI_DAYS,
  uniDayOf,
  COURSE_TINTS,
  TERM_WEEKS_DEFAULT,
  UNI_TASK_KINDS,
  slotShape,
  markShape,
  courseShape,
  termShape,
  uniTaskShape,
  uniShape,
  uniPending,
  SEED_UNI,
} from "./life-state-uni.mjs";

export {
  HISTORY_CAP,
  GAP_REACH,
  isGap,
  fillGaps,
  firstDay,
  pctOfRow,
  setDayDone,
  stampToday,
  STREAK_TARGET,
  STREAK_FORGIVE,
  streakRunFrom,
  streakBaseFrom,
  COMEBACK_MIN,
  comebackFrom,
  REFLECT_FROM_HOUR,
  inReflectWindow,
  REFLECT_SNOOZE_MS,
  REFLECT_MAX_SHOWS,
  historyIndex,
  keptOn,
  habitStreak,
  levelOf,
} from "./life-state-streak.mjs";

export {
  BOT_PORT,
  BOT_API,
  BOT_MORNING_DEFAULT,
  BOT_EVENING_DEFAULT,
  REMINDER_CAP,
  REMINDER_MAX,
  WATER_EVERY_MIN,
  WATER_EVERY_MAX,
  WATER_EVERY_DEFAULT,
  PRAYER_BEFORE_MIN,
  PRAYER_BEFORE_MAX,
  PRAYER_BEFORE_DEFAULT,
  BLOCK_AFTER_MIN,
  BLOCK_AFTER_MAX,
  BLOCK_AFTER_DEFAULT,
  EVENT_BEFORE_MIN,
  EVENT_BEFORE_MAX,
  EVENT_BEFORE_DEFAULT,
  SNOOZE_MIN,
  SNOOZE_MAX,
  SNOOZE_DEFAULT,
  COACH_AT_DEFAULT,
  COACH_MAX,
  WEEKLY_AT_DEFAULT,
  WEEKLY_DOW_DEFAULT,
  REVIEW_AT_DEFAULT,
  NUDGE_AT_DEFAULT,
  NUDGE_THRESHOLD_DEFAULT,
  NUDGE_THRESHOLD_MIN,
  NUDGE_THRESHOLD_MAX,
  REMINDER_REPEATS,
  REMINDER_REPEAT_IDS,
  repeatMeta,
  DOM_MIN,
  DOM_MAX,
  DOM_DEFAULT,
  GATES,
  GATE_IDS,
  gateMeta,
  gateOf,
  NEXT_REACH,
  REMINDER_IDEAS,
  reminderShape,
  botShape,
  onDay,
  whenOf,
  firesOn,
  nextFireOf,
  planDay,
  nextInPlan,
} from "./life-state-bot.mjs";

export {
  SESSION_CAP,
  PRESET_CAP,
  FOCUS_GOAL_DEFAULT,
  FOCUS_GOAL_MAX,
  RUN_STALE_MS,
  MIN_LOGGED,
  INTERRUPT_MAX,
  PHASES,
  PHASE_IDS,
  phaseOf,
  isBreak,
  ROUND_MIN,
  ROUND_MAX,
  BREAK_MIN,
  BREAK_MAX,
  LONG_MIN,
  LONG_MAX,
  EVERY_MIN,
  EVERY_MAX,
  presetShape,
  PRESET_SEED,
  SEED_PRESETS,
  presetIn,
  presetFor,
  runShape,
  armRun,
  runLeft,
  runRunning,
  runDone,
  runSpent,
  spentMinutes,
  startRun,
  pauseRun,
  runStale,
  sessionShape,
  sessionOf,
  manualSession,
  addSession,
  nextBreak,
  breakMinutes,
  tillLong,
  settleRun,
  closePhase,
  focusShape,
  focusCarry,
  sessionsOn,
  sessionMinutes,
  focusDay,
  focusStreak,
  focusWeek,
  sessionsSince,
  focusBands,
  bestBand,
  focusByTask,
  focusSpan,
  interruptRate,
} from "./life-state-focus.mjs";

export {
  MONEY_CAP,
  INCOME_FALLBACK,
  EXPENSE_FALLBACK,
  incomeShape,
  expenseShape,
  amountSum,
  hoursSum,
  sinceDays,
  hourRate,
  netBalance,
} from "./life-state-finance.mjs";

export {
  SPORT_CAP,
  WORKOUT_CAP,
  WEIGH_CAP,
  MEASURE_CAP,
  HARD_MIN,
  HARD_MAX,
  HARD_LABELS,
  SPORT_TINTS,
  MEASURE_FIELDS,
  GYM_REACH,
  GYM_AWAY,
  GYM_DAYS,
  REST_DAY,
  sportShape,
  workoutShape,
  weighShape,
  measureShape,
  targetShape,
  SEED_SPORTS,
  gymShape,
  gymCarry,
  logWorkout,
  deleteWorkout,
  PHOTO_CAP,
  photoShape,
  logPhoto,
  deletePhoto,
  logWeigh,
  logMeasure,
  sportOf,
  liveSports,
  workoutsIn,
  minutesOf,
  sportLoad,
  gymDays,
  lastWorkoutOn,
  restDays,
  weekLoad,
  gymRun,
  latestWeigh,
  weighTrend,
  latestFat,
  fatTrend,
  latestMeasure,
  measureDelta,
  targetStand,
  gymAdvise,
  DEFAULT_PROGRAM,
  routineShape,
  SET_TYPES,
  SET_TYPE_LABELS,
  estimate1RM,
  exerciseLogShape,
  logExercise,
  deleteExerciseLog,
  saveRoutines,
  renameExerciseInGym,
  lastExerciseLog,
  exerciseHistory,
  exercisePRs,
  exerciseAdvice,
  MUSCLE_GROUPS,
  exerciseMuscleOf,
  muscleVolume,
  weighMovingAverage,
  exerciseProgressReport,
  gymWeekReview,
  GYM_SPIKE_WEEKS,
  GYM_SPIKE_RATIO,
  weeklyTonnage,
  tonnageSpike,
  GYM_STALL_DAYS,
  GYM_STALL_SESSIONS,
  stalledExercises,
  GYM_SLEEP_LOW_HOURS,
  gymSleepAdvice,
} from "./life-state-gym.mjs";

export {
  SLEEP_CAP,
  sleepShape,
  sleepLogsOf,
  logSleep,
  deleteSleep,
  latestSleep,
  sleepOn,
  sleepIn,
  avgSleepHours,
  SLEEP_GOAL_HOURS,
  sleepDebtHours,
} from "./life-state-sleep.mjs";