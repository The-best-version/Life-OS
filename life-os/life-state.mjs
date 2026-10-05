/* --- the state, as plain data -----------------------------------------
 *  Everything the saved payload is made of: the day boundary, the seeds, the
 *  shapes, the migration and the two readings of the discipline score. It
 *  lives here rather than in LifeOS.jsx for the same reason prayer-times.mjs
 *  does — esbuild folds it back into the one file the build ships, so the
 *  split is in the source and not in what is served, and `node --test` can
 *  import it without a browser, without React and without installing a thing.
 *
 *  Two rules this module keeps:
 *
 *  - Nothing in here touches window, document, localStorage or a lucide
 *    icon. The moment one of them appears, the tests stop being able to load
 *    the file and the only safety net over 21,000 lines goes with them.
 *  - Everything the app uses is exported. A helper left behind is a
 *    ReferenceError at first render, which is a blank white page.
 * --------------------------------------------------------------------- */


/* --- the tabs --------------------------------------------------------- *
 *  The ids, in the order the sidebar shows them — the one canonical list of
 *  what tabs exist and where they sit. Their labels and their icons live in
 *  LifeOS.jsx keyed by these ids, because a lucide component cannot be
 *  imported here; `NAV` over there is built from this array, so adding a tab
 *  means adding it here first and the screen asks for its label next.
 * ---------------------------------------------------------------------- */
export const NAV_IDS = [
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

/* A phone photo is several megabytes and the whole app state shares one
   localStorage quota, so an oversized image would make every later write
   throw and silently stop persisting *everything*. The photo is therefore
   redrawn through a canvas and stepped down until it fits a hard budget —
   the image gives way, never the user's habits and history. */
export const READING_QUOTES = [
  { text: "الكتاب بلا درس مكتوب لم يُقرأ، بل مُرّ عليه.", author: "قاعدة المكتبة" },
  { text: "من قرأ كتابًا واحدًا وطبّقه، أنفع ممن قرأ مئة ونسيها.", author: "مثل مأثور" },
  { text: "اقرأ ما تحبّ حتى تُحبّ القراءة.", author: "نافال رافيكانت" },
  {
    text: "لو لم يكن في الكتب إلا أنها تقطع عنك وساوس الفراغ لكفى.",
    author: "ابن الجوزي",
  },
  { text: "الكتب هي المرآة التي نرى فيها أنفسنا قبل أن نرى غيرنا.", author: "عباس العقاد" },
  {
    text: "قراءة عشر صفحات كل يوم تصنع ١٥ كتابًا في السنة. البطء ليس العدوّ، الانقطاع هو.",
    author: "قاعدة التراكم",
  },
  { text: "خير جليس في الزمان كتاب.", author: "المتنبّي" },
  {
    text: "لا تقرأ لتردّ، ولا لتصدّق؛ اقرأ لتزن وتفكّر.",
    author: "فرانسيس بيكون",
  },
  { text: "الفصل الذي لم تلخّصه، ستنساه قبل نهاية الشهر.", author: "قاعدة التلخيص" },
  {
    text: "قيمة الكتاب في ما غيّره فيك، لا في عدد صفحاته.",
    author: "قاعدة المكتبة",
  },
  { text: "من لم يذق مرّ التعلّم ساعة، تجرّع ذلّ الجهل طول حياته.", author: "الإمام الشافعي" },
  {
    text: "كتاب تقرؤه مرّتين خير من كتابين تقرأ كلًّا منهما مرّة.",
    author: "قاعدة العمق",
  },
];

export const SEED_READS = () => READING_QUOTES.map((q) => ({ id: uid(), ...q }));

export const SCHEMA = 21;
/* How many archive rows are kept, and the discipline a day has to reach to
   bank the streak. */
export const HISTORY_CAP = 500;
export const STREAK_TARGET = 80;
/* 80/20: three real tasks a day beat a list of twenty. Hard cap, on purpose. */
export const TOP_TASK_CAP = 3;

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

/* The day ends when you sleep, not at midnight. Ticking «أذكار النوم» at
   01:00 is finishing yesterday, not starting today — and a sheet that wiped
   itself at 00:00 is why a night of work kept landing on the wrong row and
   then being zeroed by the next morning's reload. Anything written between
   midnight and this hour belongs to the previous day. */
export const DAY_START_HOUR = 4;

/* "Now", shifted onto the logical day it belongs to. */
export const logicalNow = (d = new Date()) => {
  const x = new Date(d.getTime());
  x.setHours(x.getHours() - DAY_START_HOUR);
  return x;
};

/* A calendar date, formatted as a key. The no-argument call means *now* and
   gets the logical day; a call that passes a date means that exact calendar
   square — the month grid and the streak walkers depend on the difference,
   so the shift must not hide inside a default parameter. */
export const fmtDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
export const dayKey = (d) => fmtDay(d === undefined ? logicalNow() : d);

export const yesterdayKey = () => {
  const d = logicalNow();
  d.setDate(d.getDate() - 1);
  return fmtDay(d);
};
export const uid = () => Math.random().toString(36).slice(2, 9);

/* --- the two guards every stored shape is built on -------------------- *
 *  A default parameter fires for `undefined` and for nothing else, so
 *  `shape(null)` sailed straight past `(x = {})` and threw on the first
 *  property read. That is not a theoretical payload: a hand-edited backup,
 *  a half-written download and another app's JSON all produce exactly it,
 *  and `[null]` passes the import check because it is still an array.
 *
 *  `obj` makes a shape total — anything that is not an object becomes an
 *  empty one and every field falls back to its default. `rows` does the
 *  same for a list: the holes are dropped rather than carried forward to
 *  throw later, somewhere with no try/catch around it.
 * ---------------------------------------------------------------------- */
export const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
export const rows = (v) =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) : [];

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

/* Schema 8 split the old "المساء" block into "بعد العصر" and "بعد المغرب". */
export const ASR_HABITS = [
  { label: "صلاة العصر", group: "asr" },
  { label: "مراجعة سريعة لمهام اليوم", group: "asr" },
  { label: "مشي أو حركة خفيفة", group: "asr" },
];
export const MAGHRIB_HABITS = [{ label: "صلاة المغرب وأذكار", group: "maghrib" }];

export const ADDED_TASKS = [
  { text: "جلسة مذاكرة PMP — ٩٠ دقيقة", quadrant: "q2" },
  { text: "تحديث LinkedIn: إبراز إدارة المرافق والتدريب التعاوني", quadrant: "q2" },
  { text: "ساعتان عمل توصيل مرن", quadrant: "q3" },
];

export const READ_ACTIVE = "active";
export const READ_GOAL_DEFAULT = 20;

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
export const PLACES = [
  { id: "riyadh", label: "الرياض", lat: 24.7136, lng: 46.6753, tz: 3 },
  { id: "makkah", label: "مكة المكرمة", lat: 21.3891, lng: 39.8579, tz: 3 },
  { id: "madinah", label: "المدينة المنورة", lat: 24.5247, lng: 39.5692, tz: 3 },
  { id: "jeddah", label: "جدة", lat: 21.4858, lng: 39.1925, tz: 3 },
  { id: "dammam", label: "الدمام", lat: 26.4207, lng: 50.0888, tz: 3 },
  { id: "abha", label: "أبها", lat: 18.2164, lng: 42.5053, tz: 3 },
  { id: "buraydah", label: "بريدة", lat: 26.326, lng: 43.975, tz: 3 },
  { id: "tabuk", label: "تبوك", lat: 28.3835, lng: 36.5662, tz: 3 },
  { id: "hail", label: "حائل", lat: 27.5114, lng: 41.7208, tz: 3 },
  { id: "jizan", label: "جازان", lat: 16.8892, lng: 42.5611, tz: 3 },
];
export const PLACE_BY_ID = new Map(PLACES.map((p) => [p.id, p]));

export const placeShape = (p) => {
  const o = obj(p);
  const seed = PLACE_BY_ID.get(o.id) || PLACES[0];
  /* Unary `+` turns null, [], "" and false into 0, and 0 is a perfectly
     plausible-looking longitude — so a payload that lost a field came back
     sitting on the prime meridian at UTC+0 and the prayer times were three
     hours out without anything looking broken. Only a real number, or a
     string that is entirely one, is allowed to pass. */
  const num = (v, fb, lim) => {
    const n =
      typeof v === "number"
        ? v
        : typeof v === "string" && v.trim() !== ""
          ? Number(v)
          : NaN;
    return Number.isFinite(n) && Math.abs(n) <= lim ? n : fb;
  };
  return {
    id: PLACE_BY_ID.has(o.id) ? o.id : o.id === "custom" ? "custom" : seed.id,
    label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : seed.label,
    lat: num(o.lat, seed.lat, 90),
    lng: num(o.lng, seed.lng, 180),
    tz: num(o.tz, seed.tz, 14),
    /* 1 = Shafii, 2 = Hanafi. Anything else is not a school. */
    asr: +o.asr === 2 ? 2 : 1,
  };
};

/* Decimal hours → "07:18". Named apart from `hhmm`, which validates a time
   the user typed; this one formats one the solar maths produced. Rendered
   LTR by the caller — this only builds the string. */
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

/* Arabic counts the noun, not just the number: ٣ أيام but ٢٥ يومًا. Printing
   one fixed form next to a live counter is wrong most of the time. The four
   forms are [one, two, 3–10, 11+]. */
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

export const SEED_TASKS = [
  { id: uid(), text: "تسليم تقرير الجامعة", quadrant: "q1", today: true, done: false },
  { id: uid(), text: "مراجعة مكثفة لاختبار STEP", quadrant: "q2", today: true, done: false },
  ...ADDED_TASKS.map((t) => ({ id: uid(), today: false, done: false, ...t })),
  { id: uid(), text: "بناء صندوق الطوارئ", quadrant: "q2", today: false, done: false },
  { id: uid(), text: "الرد على الرسائل المتراكمة", quadrant: "q3", today: false, done: false },
  { id: uid(), text: "تصفّح مواقع التواصل بلا هدف", quadrant: "q4", today: false, done: false },
];

/* Every book gained a workspace in schema 10: a summary, a list of points
   with the page they came from, and a page counter. `bookShape` is the one
   place that shape is written, so the seed, the add form and the migration
   cannot drift apart. */
export const bookShape = (b) => (
  (b = obj(b)),
  {
  title: "",
  author: "",
  status: "planned",
  rating: 0,
  lesson: "",
  cover: "",
  summary: "",
  notes: [],
  pages: "",
  page: "",
  finishedAt: null,
  ...b,
});

/* A habit can feed the library. `habit.book` is the link:
     null        — an ordinary habit, nothing to do with reading
     "active"    — follows whichever book is marked «أقرأه الآن»
     "<book id>" — pinned to one book, for a second reading habit
   Ticking such a habit logs a session; unticking removes today's and rolls
   the page counter back, so the log can never claim pages that were undone. */
export const SEED_BOOKS = [
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

export const SEED_PROMPTS = [
  {
    title: "محاكي اختبار PMP",
    body: "تصرّف كمحاكي صارم لاختبار PMP. اطرح عليّ سؤالًا موقفيًّا صعبًا من نمط الاختبار الحقيقي، بأربعة خيارات متقاربة. لا تكشف الإجابة حتى أجيب، ثم اشرح لماذا الخيار الصحيح صحيح ولماذا كل خيار آخر خاطئ، مع ربطه بمجال المعرفة ومجموعة العمليات.",
  },
  {
    title: "بريد إدارة المرافق",
    body: "اكتب بريدًا مهنيًّا موجزًا لمدير المرافق بخصوص [الموضوع]. النبرة: محترمة وحازمة وواضحة. ابدأ بالسياق في سطر، ثم المشكلة بالأرقام، ثم الإجراء المطلوب بتاريخ محدّد. لا تزيد على ١٥٠ كلمة، ولا تستخدم عبارات إنشائية.",
  },
].map((p) => ({ id: uid(), ...p }));

export const SEED_PIPELINE = [
  { title: "إنهاء اختبار PMP التجريبي الأول", lane: "todo" },
  { title: "دراسة جدوى عربة الآيس كريم", lane: "todo" },
  { title: "تحديث LinkedIn بخبرة التدريب التعاوني", lane: "doing" },
].map((c) => ({ id: uid(), ...c }));

export const APP_STAGES = [
  { id: "sent", label: "مُرسَل", tint: "#5B8CFF" },
  { id: "touch", label: "تمت المتابعة", tint: "#00C2FF" },
  { id: "screen", label: "فرز هاتفي", tint: "#9D5CFF" },
  { id: "intv", label: "مقابلة", tint: "#FFB020" },
  { id: "offer", label: "عرض", tint: "#10B981" },
  { id: "closed", label: "مُغلَق", tint: "#FF4D8D" },
];
export const sprintShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  company: typeof s.company === "string" ? s.company : "",
  role: typeof s.role === "string" ? s.role : "",
  startedAt: typeof s.startedAt === "string" ? s.startedAt : dayKey(),
  pain: typeof s.pain === "string" ? s.pain : "",
  solution: typeof s.solution === "string" ? s.solution : "",
  contact: typeof s.contact === "string" ? s.contact : "",
  days: s.days && typeof s.days === "object" ? s.days : {},
  notes: s.notes && typeof s.notes === "object" ? s.notes : {},
});

export const appShape = (a) => (
  (a = obj(a)),
  {
  id: a.id || uid(),
  company: typeof a.company === "string" ? a.company : "",
  role: typeof a.role === "string" ? a.role : "",
  stage: APP_STAGES.some((s) => s.id === a.stage) ? a.stage : "sent",
  sentAt: typeof a.sentAt === "string" ? a.sentAt : dayKey(),
  touchedAt: typeof a.touchedAt === "string" ? a.touchedAt : null,
  note: typeof a.note === "string" ? a.note : "",
});

export const storyShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  title: typeof s.title === "string" ? s.title : "",
  situation: typeof s.situation === "string" ? s.situation : "",
  task: typeof s.task === "string" ? s.task : "",
  action: typeof s.action === "string" ? s.action : "",
  result: typeof s.result === "string" ? s.result : "",
});

export const careerShape = (c) => (
  (c = obj(c)),
  {
  startedAt: typeof c.startedAt === "string" ? c.startedAt : null,
  /* The one-time Saudi registrations. An object keyed by id rather than an
     array of done ids, so adding a row later cannot shift anyone's ticks. */
  setup: c.setup && typeof c.setup === "object" ? c.setup : {},
  missions: c.missions && typeof c.missions === "object" ? c.missions : {},
  sprints: Array.isArray(c.sprints) ? c.sprints.map(sprintShape) : [],
  apps: Array.isArray(c.apps) ? c.apps.map(appShape) : [],
  stories: Array.isArray(c.stories) ? c.stories.map(storyShape) : [],
  log: Array.isArray(c.log) ? c.log : [],
});

export const keyToDate = (ds) => {
  const [y, m, d] = String(ds || "").split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const x = new Date(y, m - 1, d);
  /* Rejects 31 February outright instead of quietly accepting it as the
     3rd of March, which is how an invalid date becomes a wrong one. */
  if (x.getFullYear() !== y || x.getMonth() !== m - 1 || x.getDate() !== d)
    return null;
  return x;
};

export const isKey = (ds) => !!keyToDate(ds);

export const addDays = (ds, n) => {
  const d = keyToDate(ds);
  if (!d) return ds;
  return fmtDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};

/* Signed, unlike `daysBetween`, which floors at zero for the streak
   counters. A calendar needs the sign: «متأخر ٣ أيام» and «بعد ٣ أيام» are
   opposite facts, and clamping collapses them into the same number. */
export const hhmm = (v, fallback = "") => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim());
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return fallback;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

export const clampNum = (v, min, max, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export const EVENT_KINDS = [
  { id: "exam", label: "اختبار", tint: "#FF3B5C" },
  { id: "deadline", label: "موعد تسليم", tint: "#FF7A45" },
  { id: "class", label: "محاضرة أو دورة", tint: "#00C2FF" },
  { id: "meet", label: "مقابلة أو اجتماع", tint: "#5B8CFF" },
  { id: "money", label: "استحقاق مالي", tint: "#FFB020" },
  { id: "social", label: "مناسبة", tint: "#FF4D8D" },
  { id: "travel", label: "سفر", tint: "#9D5CFF" },
  { id: "note", label: "تذكير", tint: "#10B981" },
];
export const REPEATS = [
  { id: "none", label: "مرّة واحدة", short: "" },
  { id: "weekly", label: "كل أسبوع", short: "أسبوعي" },
  { id: "monthly", label: "كل شهر", short: "شهري" },
  { id: "yearly", label: "كل سنة", short: "سنوي" },
];
export const WARN_CHOICES = [0, 1, 3, 7, 14, 30];

export const eventShape = (e) => (
  (e = obj(e)),
  {
  id: e.id || uid(),
  title: typeof e.title === "string" ? e.title : "",
  date: isKey(e.date) ? e.date : dayKey(),
  time: hhmm(e.time),
  kind: EVENT_KINDS.some((k) => k.id === e.kind) ? e.kind : "note",
  repeat: REPEATS.some((r) => r.id === e.repeat) ? e.repeat : "none",
  /* An open-ended weekly entry is a legitimate thing to want, so `null`
     here is a real value and not a missing one. */
  until: isKey(e.until) ? e.until : null,
  place: typeof e.place === "string" ? e.place : "",
  note: typeof e.note === "string" ? e.note : "",
  warn: WARN_CHOICES.includes(Number(e.warn)) ? Number(e.warn) : 0,
  /* Per occurrence, not one flag: a weekly entry ticked this Sunday must
     still be waiting next Sunday, and a boolean cannot say that. */
  doneOn: Array.isArray(e.doneOn)
    ? e.doneOn.filter((d) => typeof d === "string" && isKey(d))
    : [],
});

/* Every square an entry lands on inside a window — the only real
   arithmetic on this screen, so it is written once and read everywhere.
 *
 *  Bounded by the window at BOTH ends on purpose: walking forward from the
 *  start date would cost a weekly entry from 2019 three hundred iterations
 *  to draw one month, and the year view asks for twelve months at a time.
 *
 *  A monthly entry on the 31st is SKIPPED in a thirty-day month rather than
 *  pulled back onto the 30th, and 29 February exists only in a leap year.
 *  Moving a due date silently is the one thing a calendar must never do.
 */
export const GRADES = [
  { id: "A+", ar: "ممتاز مرتفع", p5: 5, p4: 4, min: 95 },
  { id: "A", ar: "ممتاز", p5: 4.75, p4: 3.75, min: 90 },
  { id: "B+", ar: "جيد جدًا مرتفع", p5: 4.5, p4: 3.5, min: 85 },
  { id: "B", ar: "جيد جدًا", p5: 4, p4: 3, min: 80 },
  { id: "C+", ar: "جيد مرتفع", p5: 3.5, p4: 2.5, min: 75 },
  { id: "C", ar: "جيد", p5: 3, p4: 2, min: 70 },
  { id: "D+", ar: "مقبول مرتفع", p5: 2.5, p4: 1.5, min: 65 },
  { id: "D", ar: "مقبول", p5: 2, p4: 1, min: 60 },
  { id: "F", ar: "راسب", p5: 1, p4: 0, min: 0 },
];
export const gradeOf = (id) => GRADES.find((g) => g.id === id) || null;
export const UNI_DAYS = [
  { d: 0, label: "الأحد", short: "ح" },
  { d: 1, label: "الإثنين", short: "ن" },
  { d: 2, label: "الثلاثاء", short: "ث" },
  { d: 3, label: "الأربعاء", short: "ر" },
  { d: 4, label: "الخميس", short: "خ" },
  { d: 6, label: "السبت", short: "س" },
];
export const uniDayOf = (d) => UNI_DAYS.find((x) => x.d === Number(d)) || null;

/* Vivid, never pastel — the tint is how a block is found on the timetable
   at a glance, and a washed-out one finds nothing. */
export const COURSE_TINTS = [
  "#00C2FF",
  "#FFB020",
  "#FF4D8D",
  "#9D5CFF",
  "#5B8CFF",
  "#FF7A45",
  "#10B981",
  "#FF5722",
];

/* A quarter of the meetings is the usual bar for being barred from the
   final. Derived from how often the course actually meets rather than
   asked for — but still editable, because it is a regulation and
   regulations differ between universities. */
export const TERM_WEEKS_DEFAULT = 15;

export const UNI_TASK_KINDS = [
  { id: "assign", label: "واجب", tint: "#FF7A45" },
  { id: "quiz", label: "كويز", tint: "#FFB020" },
  { id: "mid", label: "اختبار فصلي", tint: "#FF4D8D" },
  { id: "final", label: "اختبار نهائي", tint: "#FF3B5C" },
  { id: "project", label: "مشروع", tint: "#9D5CFF" },
  { id: "present", label: "عرض تقديمي", tint: "#00C2FF" },
];
export const slotShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  day: uniDayOf(s.day) ? Number(s.day) : 0,
  from: hhmm(s.from, "08:00"),
  to: hhmm(s.to, "09:50"),
  room: typeof s.room === "string" ? s.room : "",
});

export const markShape = (m) => (
  (m = obj(m)),
  {
  id: m.id || uid(),
  label: typeof m.label === "string" ? m.label : "",
  /* `null` is "not returned yet" and has to survive as null. A zero is a
     zero he actually scored, and folding the two together is exactly how a
     mark sheet starts lying about where he stands. */
  score:
    m.score === null || m.score === undefined || m.score === ""
      ? null
      : Number.isFinite(Number(m.score))
        ? Math.max(0, Number(m.score))
        : null,
  max: clampNum(m.max, 0.01, 1000, 100),
  weight: clampNum(m.weight, 0, 100, 0),
});

export const courseShape = (c) => (
  (c = obj(c)),
  {
  id: c.id || uid(),
  code: typeof c.code === "string" ? c.code : "",
  name: typeof c.name === "string" ? c.name : "",
  credits: clampNum(c.credits, 1, 12, 3),
  instructor: typeof c.instructor === "string" ? c.instructor : "",
  term: typeof c.term === "string" ? c.term : "",
  tint: COURSE_TINTS.includes(c.tint) ? c.tint : COURSE_TINTS[0],
  slots: Array.isArray(c.slots) ? c.slots.map(slotShape) : [],
  marks: Array.isArray(c.marks) ? c.marks.map(markShape) : [],
  /* Set by hand once the final grade is published. Until then the mark
     sheet projects one and the GPA leaves the course out entirely. */
  grade: gradeOf(c.grade) ? c.grade : null,
  absences: clampNum(c.absences, 0, 200, 0),
  /* The days the quick button recorded. `absences` stays the authoritative
     count — it has to, because a term usually starts with absences taken
     before the app did — and this is what lets the button refuse a second
     tap on a day it already recorded. Tapping «غياب» twice after one
     lecture is the easiest mistake on this screen and the hardest to
     notice: the number is simply wrong from then on. */
  absentOn: Array.isArray(c.absentOn)
    ? c.absentOn.filter((d) => typeof d === "string" && isKey(d))
    : [],
  absenceCap: clampNum(c.absenceCap, 0, 200, 0), // 0 → derive from the slots
  target: clampNum(c.target, 0, 100, 90),
  /* Blackboard, Teams, a shared drive — whatever the course actually lives
     in. Stored exactly as typed: running it through `safeUrl` here would
     rewrite the field between keystrokes, so «b» became «https://b/» before
     the second letter arrived. It is sanitised where it is used as an
     `href` instead, which is the only place it can do harm. */
  link: typeof c.link === "string" ? c.link : "",
  notes: typeof c.notes === "string" ? c.notes : "",
});

export const termShape = (t) => (
  (t = obj(t)),
  {
  id: t.id || uid(),
  label: typeof t.label === "string" ? t.label : "",
  start: isKey(t.start) ? t.start : dayKey(),
  end: isKey(t.end) ? t.end : addDays(dayKey(), 7 * TERM_WEEKS_DEFAULT),
  weeks: clampNum(t.weeks, 1, 40, TERM_WEEKS_DEFAULT),
});

export const uniTaskShape = (t) => (
  (t = obj(t)),
  {
  id: t.id || uid(),
  title: typeof t.title === "string" ? t.title : "",
  kind: UNI_TASK_KINDS.some((k) => k.id === t.kind) ? t.kind : "assign",
  course: typeof t.course === "string" ? t.course : "",
  due: isKey(t.due) ? t.due : dayKey(),
  time: hhmm(t.time),
  place: typeof t.place === "string" ? t.place : "",
  weight: clampNum(t.weight, 0, 100, 0),
  done: !!t.done,
  notes: typeof t.notes === "string" ? t.notes : "",
});

/* The whole desk, reshaped. The active-term pointer is normalised here and
   nowhere else: a dangling id — a term deleted, or a hand-edited backup —
   would otherwise render an empty screen that looks exactly like lost data. */
export const uniShape = (u) => {
  u = obj(u);
  const terms = Array.isArray(u.terms) ? u.terms.map(termShape) : [];
  const ids = new Set(terms.map((t) => t.id));
  let term = typeof u.term === "string" && ids.has(u.term) ? u.term : "";
  if (!term && terms.length) {
    const today = dayKey();
    term = (terms.find((t) => t.start <= today && today <= t.end) || terms[0]).id;
  }
  return {
    scale: Number(u.scale) === 4 ? 4 : 5,
    /* Everything before the terms listed here, as one pair. Asking for
       every past term just to show a cumulative figure is a wall nobody
       climbs; two numbers off a transcript is thirty seconds. */
    priorGpa: clampNum(u.priorGpa, 0, 5, 0),
    priorCredits: clampNum(u.priorCredits, 0, 500, 0),
    /* Which scale that figure was typed on. Without it, flipping the scale
       folds a four-point average into a five-point cumulative — a wrong
       number stated confidently, which is worse than no number at all. */
    priorScale: Number(u.priorScale) === 4 ? 4 : 5,
    /* The degree's total credit hours, for the graduation bar. Zero means
       «not set» and the bar stays hidden — a progress bar against a number
       the user never gave is a progress bar against a guess. */
    gradCredits: clampNum(u.gradCredits, 0, 400, 0),
    /* The cumulative he is aiming at, for the «كم أحتاج هذا الفصل»
       calculator. Zero means «not set», same reasoning. */
    targetGpa: clampNum(u.targetGpa, 0, 5, 0),
    term,
    terms,
    courses: Array.isArray(u.courses) ? u.courses.map(courseShape) : [],
    tasks: Array.isArray(u.tasks) ? u.tasks.map(uniTaskShape) : [],
  };
};

export const SEED_UNI = () => {
  const start = dayKey();
  const t = termShape({
    label: "الفصل الحالي",
    start,
    end: addDays(start, 7 * TERM_WEEKS_DEFAULT),
    weeks: TERM_WEEKS_DEFAULT,
  });
  return uniShape({ terms: [t], term: t.id });
};

export const freshState = (carry = {}) => ({
  schema: SCHEMA,
  date: dayKey(),
  habits: (carry.habits || SEED_HABITS).map((h) => ({ ...h, done: false })),
  tasks: (carry.tasks || SEED_TASKS).map((t) => ({ ...t, done: false })),
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
    const have = new Set(goals.map((g) => `${g.horizon} ${g.text.trim()}`));
    const added = ADDED_GOALS().filter(
      (g) => !have.has(`${g.horizon} ${g.text.trim()}`),
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

  /* Schema 21 lets a tab answer from «المزيد» instead of taking a row. A
     payload from before it has no list, and `navSplit` hands back the
     default — the knowledge map, which is where this started. A payload that
     has one keeps it, empty included: an empty list is him having pulled
     every tab back out, which is a choice and not a missing key.

     `navOrder` is not touched by any of it. A tab behind the menu keeps its
     place in the order, so pulling it out again puts it back where he had
     it rather than at the end of the list. */
  const navMore = navSplit(navOrder, saved.navMore).behind;

  return {
    ...saved,
    schema: SCHEMA,
    habits,
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
    /* The archive row the whole app writes to. A hole here is the one that
       reaches the render rather than a shape, so it is cleaned here too. */
    history: rows(saved.history).filter((h) => typeof h.date === "string"),
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
  const continued = s.date === yesterdayKey() && s.dayBanked;
  return freshState({
    ...carryOf(s),
    streakBase: continued ? (s.streakBase || 0) + 1 : 0,
  });
}

