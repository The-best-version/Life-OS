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
 *  `life-state-career.mjs`, `life-state-streak.mjs`, and the dependency-free
 *  `life-state-util.mjs` every one of them is built on). What stays here is
 *  only what is inherently cross-cutting — the day boundary, `SCHEMA`, the
 *  nav order, the general cue quotes, and `freshState`/`migrate`/`carryOf`/
 *  `rollDay`, which by nature touch every domain's shape at once.
 *
 *  Every other file in the app still imports from `"./life-state.mjs"`
 *  alone — this file re-exports everything the 9 domain files export, so the
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
} from "./life-state-habits.mjs";
import {
  ADDED_TASKS,
  taskShape,
  capToday,
  applyPrep,
  prepCarry,
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
import { uniShape, SEED_UNI } from "./life-state-uni.mjs";
import { careerShape, SEED_PROMPTS, SEED_PIPELINE } from "./life-state-career.mjs";
import { fillGaps, firstDay, streakBaseFrom } from "./life-state-streak.mjs";

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
  "uni",
  "career",
  "matrix",
  "deep",
  "goals",
  "pipeline",
  "tactical",
  "finance",
  "prompts",
  "vault",
  "analytics",
  "breaker",
  "graph",
];

/* --- the phone bar -----------------------------------------------------
 *  Four tabs fit a 375px bar and keep their labels legible; the rest live
 *  behind «المزيد». The number sits here rather than beside the component
 *  that draws the bar because it is also a floor on the state: the main list
 *  may never be emptied past it. One number, so the two cannot disagree.
 * ---------------------------------------------------------------------- */
export const TAB_BAR = 4;

/* --- the tabs that live behind «المزيد» -------------------------------- *
 *  A tab here still exists, still has a screen and is still reachable — it
 *  simply does not take a row in the main navigation. This is the user's
 *  call and not the app's, exactly like the order is: he pushes a tab back
 *  and pulls it out again from the same editor, and the list is saved with
 *  everything else. `MORE_IDS` is only where that list *starts* — the
 *  knowledge map, which is read occasionally and never on the way through a
 *  day, and which as the fifteenth row was sitting among daily drivers.
 *
 *  A pushed-back tab keeps its place in `navOrder`. That is the whole reason
 *  the two are separate lists: pull it out again and it returns where he put
 *  it rather than at the end, which is where a single list would have left
 *  it after a round trip.
 * ---------------------------------------------------------------------- */
export const MORE_IDS = ["graph"];

/* The saved order, resolved to ids. An id this build no longer has is
   dropped, a tab the saved order has never seen joins the end, and a
   duplicate is taken once — without that last part a hand-edited backup
   could hide a tab outright. Ids rather than tab objects: the definition of
   a tab is not this module's business, only which ones there are and in what
   order the user put them. Every tab is here, the ones behind «المزيد»
   included; splitting them is `navSplit`'s job and not this one's. */
export function orderNavIds(order) {
  const known = new Set(NAV_IDS);
  const seen = new Set();
  const out = [];
  for (const id of Array.isArray(order) ? order : []) {
    if (known.has(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of NAV_IDS) if (!seen.has(id)) out.push(id);
  return out;
}

/* His order, cut in two: the tabs that take a row in the navigation, and the
   tabs that only answer from «المزيد». Both come back in the order he set,
   because `navOrder` holds every tab and this only decides which side of the
   line each one falls.

   The floor is the point of doing it here. A saved payload — hand-edited, or
   written by a build where one more tab existed — could push every tab
   behind the menu and leave a phone with an empty bar and a desktop with an
   empty sidebar. So tabs are released from the top of his own order until
   `TAB_BAR` of them are out front, whatever the saved list says. A missing
   list means the default; an empty one means he pulled them all back out,
   which is his to do and is not the same thing. */
export function navSplit(order, more) {
  const all = orderNavIds(order);
  const hidden = new Set(
    (Array.isArray(more) ? more : MORE_IDS).filter((id) => all.includes(id)),
  );
  for (const id of all) {
    if (all.length - hidden.size >= TAB_BAR) break;
    hidden.delete(id);
  }
  return {
    main: all.filter((id) => !hidden.has(id)),
    behind: all.filter((id) => hidden.has(id)),
  };
}

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

export const SCHEMA = 25;

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
  income: carry.income || [],
  ventures: carry.ventures || [],
  prompts: carry.prompts || SEED_PROMPTS,
  reviews: carry.reviews || [],
  pipeline: carry.pipeline || SEED_PIPELINE,
  badHabits: carry.badHabits || [],
  /* The calendar and the university desk. Every row in both is keyed to a
     calendar date of its own, so they cross a day rollover untouched —
     nothing in either of them belongs to "today" in the first place. */
  events: carry.events || [],
  uni: carry.uni || SEED_UNI(),
  /* Entirely date-derived inside, so it carries across a rollover whole —
     the two daily checklists empty themselves by reading today's log row. */
  career: careerShape(carry.career),
  navOrder: orderNavIds(carry.navOrder),
  /* Which of them answer only from «المزيد». Normalised through the same
     split the screens read, so the floor holds here too and a carried list
     cannot arrive with the bar emptied. */
  navMore: navSplit(carry.navOrder, carry.navMore).behind,
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
  /* The evening's prep, spent or still waiting. It carries — a prep written
     at 22:00 has to survive the rollover that consumes it — but it is spent
     by the line above, so the day it named clears it. */
  tomorrow: prepCarry(carry.tomorrow, dayKey()),
  water: 0,
  cueImage: carry.cueImage ?? null,
  history: carry.history || [],
  streakBase: carry.streakBase || 0,
  bestStreak: carry.bestStreak || 0,
  dayBanked: false,
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
     wrong here, the saved values must win over the defaults. */
  let books = rows(saved.books).map((b) => ({
    ...bookShape(b),
    notes: rows(b.notes),
  }));

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

  /* Schema 13 lets the user order the tabs. Stored as ids and normalised on
     the way in, so a payload from a build with different tabs still resolves
     to a complete, duplicate-free order.

     Schema 21 keeps every tab in this order and adds a second list beside
     it. Nothing moves here. */
  let navOrder = orderNavIds(saved.navOrder);

  /* Schema 14 adds the employability masterplan. orderNavIds appends a tab
     the saved order has never seen to the *end*, which on a phone buries it
     behind «المزيد» — so this one is placed by hand, once, right after the
     routine. A daily driver that takes two taps to reach is not daily. */
  if (from < 14 && !(saved.navOrder || []).includes("career")) {
    const rest = navOrder.filter((id) => id !== "career");
    const at = rest.indexOf("routine");
    navOrder =
      at < 0
        ? ["career", ...rest]
        : [...rest.slice(0, at + 1), "career", ...rest.slice(at + 1)];
  }

  /* Run through the shape whether or not it is new: a hand-edited backup
     that lost a field comes back whole instead of crashing a render. */
  let career = careerShape(saved.career);

  /* Schema 15 rewrote the morning routine as instructions, and one step's
     id went with it ("keyword" became "polish" when it stopped being about
     keywords alone). Rename it inside the log rather than dropping it: an
     orphan id still counts toward the day's total but can never render as
     ticked, which reads as a checkbox that lies. */
  if (from < 15) {
    career = {
      ...career,
      log: (career.log || []).map((e) =>
        (e.am || []).includes("keyword")
          ? { ...e, am: e.am.map((id) => (id === "keyword" ? "polish" : id)) }
          : e,
      ),
    };
  }

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

  /* Both are daily screens for a student, so — like `career` before them —
     they are placed by hand right after the routine instead of being
     appended to the end, where a phone buries a tab behind «المزيد». A tab
     the user has already positioned himself is left exactly where he put
     it, and becomes the anchor for the next one. */
  if (from < 17) {
    let anchor = "routine";
    for (const id of ["agenda", "uni"]) {
      if ((saved.navOrder || []).includes(id)) {
        anchor = id;
        continue;
      }
      const rest = navOrder.filter((x) => x !== id);
      const at = rest.indexOf(anchor);
      navOrder =
        at < 0
          ? [id, ...rest]
          : [...rest.slice(0, at + 1), id, ...rest.slice(at + 1)];
      anchor = id;
    }
  }

  /* Schema 22 adds «اليوم», and it is placed at the front by hand rather
     than appended by `orderNavIds` — the whole point of the screen is that
     it is the one the app opens on, and a tab appended to the end of a
     fifteen-tab order opens behind «المزيد» on a phone, which is the
     opposite. Same reasoning as «مسار التوظيف» in schema 14 and the two
     tabs in schema 17, and the same guard: a user who has already put it
     somewhere himself keeps where he put it. */
  if (from < 22 && !(saved.navOrder || []).includes("today")) {
    navOrder = ["today", ...navOrder.filter((id) => id !== "today")];
  }

  /* Schema 21 lets a tab answer from «المزيد» instead of taking a row. A
     payload from before it has no list, and `navSplit` hands back the
     default — the knowledge map, which is where this started. A payload that
     has one keeps it, empty included: an empty list is him having pulled
     every tab back out, which is a choice and not a missing key.

     `navOrder` is not touched by any of it. A tab behind the menu keeps its
     place in the order, so pulling it out again puts it back where he had
     it rather than at the end of the list. */
  const navMore = navSplit(navOrder, saved.navMore).behind;

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

  return {
    ...saved,
    schema: SCHEMA,
    streakBase: Number.isFinite(+streakBase) && +streakBase > 0 ? +streakBase : 0,
    habits: habits.map(habitShape),
    goals,
    tasks,
    quotes,
    reads,
    books,
    badHabits,
    career,
    events,
    uni,
    navOrder,
    navMore,
    history,
    sessions: rows(saved.sessions),
    income: rows(saved.income),
    ventures: rows(saved.ventures),
    prompts: rows(saved.prompts),
    reviews: rows(saved.reviews),
    pipeline: rows(saved.pipeline),
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
  income: s.income,
  ventures: s.ventures,
  prompts: s.prompts,
  reviews: s.reviews,
  pipeline: s.pipeline,
  badHabits: s.badHabits,
  events: s.events,
  uni: s.uni,
  career: s.career,
  navOrder: s.navOrder,
  navMore: s.navMore,
  quotes: s.quotes,
  reads: s.reads,
  reading: s.reading,
  readGoal: s.readGoal,
  northStar: s.northStar,
  place: s.place,
  waterGoal: s.waterGoal,
  tomorrow: s.tomorrow,
  cueImage: s.cueImage,
  history: s.history,
  bestStreak: s.bestStreak,
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
  hhmm,
  minsIn,
  clampNum,
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
} from "./life-state-habits.mjs";

export {
  TOP_TASK_CAP,
  ADDED_TASKS,
  SEED_TASKS,
  QUADRANT_IDS,
  STEP_MAX,
  taskShape,
  capToday,
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
} from "./life-state-goals.mjs";

export {
  READ_ACTIVE,
  READ_GOAL_DEFAULT,
  bookShape,
  SEED_BOOKS,
  READING_QUOTES,
  SEED_READS,
} from "./life-state-books.mjs";

export {
  PLACES,
  PLACE_BY_ID,
  placeShape,
  EVENT_KINDS,
  REPEATS,
  WARN_CHOICES,
  eventShape,
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
  SEED_PROMPTS,
  SEED_PIPELINE,
  APP_STAGES,
  sprintShape,
  appShape,
  storyShape,
  careerShape,
} from "./life-state-career.mjs";

export {
  HISTORY_CAP,
  GAP_REACH,
  isGap,
  fillGaps,
  firstDay,
  pctOfRow,
  setDayDone,
  STREAK_TARGET,
  STREAK_FORGIVE,
  streakRunFrom,
  streakBaseFrom,
  COMEBACK_MIN,
  comebackFrom,
} from "./life-state-streak.mjs";
