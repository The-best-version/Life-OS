/* --- the library: the shelf and its reading cues ------------------------
 *  Every book's workspace and the shelf's seed data, plus the second cue
 *  list — one about reading, walked by the same `useDailyQuote` the general
 *  cue card uses, under its own key so the two cursors never fight.
 * --------------------------------------------------------------------- */
import { uid, obj, rows, logicalNow, dayKey } from "./life-state-util.mjs";

export const READ_ACTIVE = "active";
export const READ_GOAL_DEFAULT = 20;

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
