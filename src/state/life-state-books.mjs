/* --- the library: the shelf and its reading cues ------------------------
 *  Every book's workspace and the shelf's seed data, plus the second cue
 *  list — one about reading, walked by the same `useDailyQuote` the general
 *  cue card uses, under its own key so the two cursors never fight.
 * --------------------------------------------------------------------- */
import {
  uid,
  obj,
  rows,
  logicalNow,
  dayKey,
  addDays,
  daysUntil,
} from "./life-state-util.mjs";

export const READ_ACTIVE = "active";
export const READ_GOAL_DEFAULT = 20;

/* --- a point, and when it comes back ----------------------------------- *
 *  A note used to be `{ id, text, page }` — written in the book desk, read
 *  nowhere else, and forgotten at exactly the rate the shelf's own cue card
 *  warns about («الفصل الذي لم تلخّصه، ستنساه قبل نهاية الشهر»). A library
 *  that only *stores* what a book taught is a library that costs the hours
 *  and returns the pages.
 *
 *  So a note carries its own schedule: `box` is how many times it came back
 *  and was remembered, and `due` is the day it comes back next. The spacing
 *  is `REVIEW_STEPS`, in days, which is the ordinary expanding interval —
 *  tomorrow, then three days, then a week, three weeks, two months. A note
 *  that survives all five is a note that is his.
 *
 *  **An empty `due` means due now, and that is the migration.** Every note
 *  written before this existed has no schedule, and the honest reading of a
 *  point nobody has reviewed is that it is waiting — exactly as
 *  `reminderShape` reads an older row by what it already says rather than
 *  having a branch guess for it. Nothing is invented: `at` stays empty for
 *  an old note, because the day it was written is not recoverable and a
 *  date filled in here would be a date the desk then displays as fact.
 * ---------------------------------------------------------------------- */
export const REVIEW_STEPS = [1, 3, 7, 21, 60];
/* One point, not an essay — the summary field is where a chapter goes. The
   bound trims rather than clears, like `taskShape`'s step: text the user
   typed is never silently deleted on the way through a shape that runs on
   every load. */
export const NOTE_MAX = 400;
/* A bound, like every other list a phone can feed. Sixty points in one book
   is a book that was read properly; a list with no ceiling is a payload that
   grows until a save throws. */
export const NOTE_CAP = 80;

export const noteShape = (n) => {
  n = obj(n);
  const box = Math.round(Number(n.box) || 0);
  return {
    id: n.id || uid(),
    text: typeof n.text === "string" ? n.text.slice(0, NOTE_MAX) : "",
    /* The page it came from, as the desk writes it: a string, because an
       empty one is «ما سجّلت الصفحة» and `0` is a page. */
    page: typeof n.page === "string" ? n.page : n.page ? String(n.page) : "",
    at: typeof n.at === "string" ? n.at : "",
    box: box >= 0 && box <= REVIEW_STEPS.length ? box : 0,
    due: typeof n.due === "string" ? n.due : "",
  };
};

/* Every book gained a workspace in schema 10: a summary, a list of points
   with the page they came from, and a page counter. `bookShape` is the one
   place that shape is written, so the seed, the add form and the migration
   cannot drift apart.
 *
 *  The notes are shaped **after** the spread and not before it. `...b` is
 *  last so a saved value always wins over a default, which is correct for
 *  every field and wrong for this one: a notes array carried through
 *  untouched is a list of points with no schedule on them, and the review
 *  rotation would then hold only the notes written since the day it shipped.
 */
export const bookShape = (b) => {
  b = obj(b);
  const out = {
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
  };
  out.notes = rows(b.notes).map(noteShape).slice(0, NOTE_CAP);
  return out;
};

/* Whether a point is waiting. No `due` at all is waiting — see above. */
export const noteDue = (n, on = dayKey()) => !n?.due || n.due <= on;

/* Every point waiting, oldest schedule first, each with the book it came
   from. One reading, so the bot's nudge, the weekly review and the coach
   cannot disagree about how many are due.
 *
 *  A finished book's points are in it deliberately: the whole reason to
 *  review is that the book is behind you. */
export function dueNotes(books, on = dayKey(), cap = 200) {
  const out = [];
  for (const b of rows(books)) {
    for (const n of rows(b.notes).map(noteShape)) {
      if (!n.text || !noteDue(n, on)) continue;
      out.push({ book: b, note: n });
    }
  }
  /* An empty `due` sorts first — it has been waiting longest, by definition
     — and `""` is below every day key, so the ordinary comparison already
     says so. The box breaks a tie: a point seen once comes back before one
     that has survived four rounds. */
  out.sort(
    (a, z) =>
      (a.note.due || "").localeCompare(z.note.due || "") || a.note.box - z.note.box,
  );
  return out.slice(0, cap);
}

/* The same point, rescheduled. `kept` is «تذكّرتها»: the box advances and the
   next gap is the longer one. Forgotten sends it back to the start of the
   ladder with an explicit tomorrow — never to an empty `due`, which would
   read as «waiting» for ever and make a forgotten point indistinguishable
   from one that was never seen. */
export function reviewedNote(n, kept, on = dayKey()) {
  const note = noteShape(n);
  if (!kept) return { ...note, box: 0, due: addDays(on, 1) };
  const box = Math.min(REVIEW_STEPS.length, note.box + 1);
  return { ...note, box, due: addDays(on, REVIEW_STEPS[box - 1]) };
}

/* How many points a shelf holds, and how many of them were written since a
   day — the weekly review's figure, and the one that says whether the
   reading is turning into anything. */
export const countNotes = (books) =>
  rows(books).reduce((n, b) => n + rows(b.notes).filter((x) => x && x.text).length, 0);

export const notesSince = (books, from) =>
  rows(books).reduce(
    (n, b) => n + rows(b.notes).filter((x) => x && x.text && x.at && x.at >= from).length,
    0,
  );

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

/* The book a reading habit points at right now, or null. */
export function bookForHabit(habit, books) {
  if (!habit?.book) return null;
  if (habit.book === READ_ACTIVE)
    return books.find((b) => b.status === "reading") || null;
  return books.find((b) => b.id === habit.book) || null;
}

/* --- pages taken back ---------------------------------------------------
 *  Unticking a reading habit is a deletion in everything but name: today's
 *  sessions for that habit are removed and the books they advanced are
 *  rolled back, because a log that keeps pages the user undid is worse than
 *  no log at all.
 *
 *  It lived inside `useHabitTick` while the routine screen was the only
 *  place a habit could be unticked. The Telegram bot unticks one from a
 *  phone now, and two copies of this arithmetic is a shelf that disagrees
 *  with itself about where a book has reached.
 *
 *  Both lists come back **by identity** when nothing was dropped: a fresh
 *  array for an unchanged list is a re-render of every screen reading it,
 *  and this runs on every single untick.
 * --------------------------------------------------------------------- */
export function withdrawReading(reading, books, habitId, date = dayKey()) {
  const log = rows(reading);
  const dropped = log.filter((r) => r.habitId === habitId && r.date === date);
  if (!dropped.length) return { reading, books, pages: 0 };
  const back = new Map();
  for (const r of dropped) back.set(r.bookId, (back.get(r.bookId) || 0) + (r.pages || 0));
  return {
    reading: log.filter((r) => !(r.habitId === habitId && r.date === date)),
    books: rows(books).map((b) => {
      const n = back.get(b.id);
      if (!n) return b;
      const at = parseInt(b.page, 10);
      /* A book with no page counter has nothing to roll back, and writing a
         number onto it here would be inventing a position it never had. */
      if (!Number.isFinite(at)) return b;
      return { ...b, page: String(Math.max(0, at - n)) };
    }),
    pages: dropped.reduce((n, r) => n + (r.pages || 0), 0),
  };
}

/* `(log || [])` like every other list reader here. These two were the only
   ones that assumed an array outright, which made them the only two that
   could take the render down over a field the data layer had not filled. */
export const sumPages = (log) =>
  rows(log).reduce((n, r) => n + (Number.isFinite(r.pages) ? r.pages : 0), 0);

/* Days in a row, counting back from today, on which the goal was met. A
   streak that ended yesterday still counts today — the day is not over. */
export function readStreak(log, goal) {
  /* Through `rows`, not just `|| []`: it also drops a hole, so one bad
     entry cannot throw on `r.date` halfway through the walk. The local
     name avoids shadowing the helper itself. */
  const list = rows(log);
  if (!list.length || goal <= 0) return 0;
  const byDay = new Map();
  for (const r of list)
    byDay.set(r.date, (byDay.get(r.date) || 0) + (r.pages || 0));

  const d = logicalNow();
  if ((byDay.get(dayKey(d)) || 0) < goal) d.setDate(d.getDate() - 1);

  let n = 0;
  for (;;) {
    if ((byDay.get(dayKey(d)) || 0) < goal) return n;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
}

/* ==================================================================== *
 *  MODULE 3 — Book vault
 * ==================================================================== */
/* Reading progress, or null when either number is missing — the card and
   the desk both ask this rather than each parsing the fields itself. */
export function pctOf(b) {
  const total = parseInt(b.pages, 10);
  const at = parseInt(b.page, 10);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(at)) return null;
  return Math.max(0, Math.min(100, Math.round((at / total) * 100)));
}

/* --- the book the day is about ----------------------------------------- *
 *  «أقرأه الآن» is not exclusive on the shelf — the status is a field he
 *  sets per row — so every reader has always taken the first match, and
 *  three of them wrote that `find` out by hand. One function, so «the active
 *  book» is one answer: the first row marked reading.
 * ---------------------------------------------------------------------- */
export const activeBook = (books) =>
  rows(books).find((b) => b.status === "reading") || null;

/* How many pages are left in a book, or null when either number is missing
   — the same honesty `pctOf` keeps. */
export function pagesLeft(b) {
  const total = parseInt(obj(b).pages, 10);
  const at = parseInt(obj(b).page, 10);
  if (!Number.isFinite(total) || total <= 0) return null;
  return Math.max(0, total - (Number.isFinite(at) ? at : 0));
}

/* The last day pages were logged for a book, or "". What makes «الكتاب
   متوقّف ١٢ يومًا» sayable — a book marked «أقرأه الآن» that nothing has
   moved is the most common way reading stops without anyone noticing. */
export function lastReadOn(reading, bookId) {
  let last = "";
  for (const r of rows(reading)) {
    if (r.bookId !== bookId || !r.date) continue;
    if (r.date > last) last = r.date;
  }
  return last;
}

export const stalledDays = (reading, bookId, on = dayKey()) => {
  const last = lastReadOn(reading, bookId);
  if (!last) return null; // never opened: not a stall, an unstarted book
  const n = daysUntil(on, last);
  return Number.isFinite(n) ? Math.max(0, n) : null;
};

/* --- what the pace actually promises ----------------------------------- *
 *  «باقي ١٨٠ صفحة» is a fact and a wall. «بهذا المعدّل تنهيه بعد ٩ أيام» is
 *  the same fact turned into something a person can decide about, and it is
 *  the one figure that makes twenty pages tonight feel like it bought
 *  something.
 *
 *  Measured over a window of real days rather than over the book's whole
 *  history: a book picked up again after a month off has an average that
 *  describes a reader who no longer exists. The divisor is the window, not
 *  the days he actually read — the honest pace of «٣٠ صفحة في أسبوع» is four
 *  a day, not thirty.
 * ---------------------------------------------------------------------- */
export const PACE_WINDOW = 14;

export function readPace(book, reading, on = dayKey(), window = PACE_WINDOW) {
  const left = pagesLeft(book);
  const from = addDays(on, -(window - 1));
  const pages = rows(reading)
    .filter((r) => r.bookId === obj(book).id && r.date && r.date >= from && r.date <= on)
    .reduce((n, r) => n + (Number(r.pages) || 0), 0);
  const perDay = pages / window;
  return {
    pages,
    left,
    perDay,
    /* Null rather than Infinity when nothing moved, and null when the book
       has no total: a promise built on a number that does not exist is the
       one kind of encouragement that gets a feature switched off. */
    days: left !== null && perDay > 0 ? Math.max(1, Math.ceil(left / perDay)) : null,
  };
}
