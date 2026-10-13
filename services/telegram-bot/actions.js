/* --- what a message actually does to the day ---------------------------
 *  One function per thing the bot can change, and every one of them pure:
 *  `(state, args) → { next, before, … }` or `{ refused }`. Nothing here
 *  fetches, nothing here replies, nothing here imports grammY — which is
 *  what makes the whole file testable by `node --test tests/` with nothing
 *  installed.
 *
 *  Two rules every action keeps, both of them the app's own:
 *
 *  - **A row is written by its shape, never by hand.** `expenseShape`,
 *    `incomeShape` and `taskShape` are the one place each row's fields are
 *    decided. A second writer with its own idea of the fields is how `date`
 *    becomes a timestamp on one side and a day key on the other.
 *  - **`before` is the whole array, never the row.** An undo that puts one
 *    row back at the end of the list is an undo that moved it, which is its
 *    own small loss — the same reason `UndoBus` in the app arms with the
 *    whole array. It is spread over whatever the state is by then, so a
 *    change made in between is not undone with it.
 * --------------------------------------------------------------------- */
import {
  rows,
  uid,
  dayKey,
  addDays,
  clampNum,
  keyToDate,
  expenseShape,
  incomeShape,
  MONEY_CAP,
  amountSum,
  netBalance,
  taskShape,
  capToday,
  clampGoal,
  stampToday,
  disciplineOf,
  scoredOf,
  bookForHabit,
  bookShape,
  activeBook,
  noteShape,
  dueNotes,
  reviewedNote,
  readPace,
  pagesLeft,
  pctOf,
  countNotes,
  NOTE_CAP,
  READ_GOAL_DEFAULT,
  sumPages,
  readStreak,
  focusShape,
  presetFor,
  armRun,
  startRun,
  pauseRun,
  runRunning,
  runLeft,
  settleRun,
  closePhase,
  spentMinutes,
  manualSession,
  addSession,
  isBreak,
  phaseOf,
  nextBreak,
  breakMinutes,
  urgeShape,
  stamp,
  cleanDays,
  eventShape,
  uniShape,
  markShape,
  goalShape,
  setDayDone,
  streakBaseFrom,
  withdrawReading,
  prepShape,
  prepPickAdd,
  prepPicks,
  tomorrowKey,
  TOP_TASK_CAP,
} from "../../src/state/life-state.mjs";
import { fold, BACK_MAX } from "./parse.js";

/* --- the money -------------------------------------------------------- */

export function addExpense(state, { label, amount, back = 0 }) {
  const row = expenseShape({ label, amount, date: backKey(back) });
  if (!row.amount) {
    return { refused: "ما فهمت المبلغ. مثال: «صرفت ٣٥ غداء»." };
  }
  return {
    kind: "expense",
    row,
    next: {
      ...state,
      expenses: [row, ...rows(state.expenses)].slice(0, MONEY_CAP),
    },
    before: { expenses: state.expenses },
    balance: netBalance(state.income, [row, ...rows(state.expenses)]),
  };
}

export function addIncome(state, { label, amount, hours, back = 0 }) {
  const row = incomeShape({ label, amount, hours, date: backKey(back) });
  if (!row.amount) {
    return { refused: "ما فهمت المبلغ. مثال: «دخل ١٥٠٠ استشارة»." };
  }
  return {
    kind: "income",
    row,
    next: {
      ...state,
      income: [row, ...rows(state.income)].slice(0, MONEY_CAP),
    },
    before: { income: state.income },
    balance: netBalance([row, ...rows(state.income)], state.expenses),
  };
}

/* --- the tasks --------------------------------------------------------- *
 *  There is no separate inbox array and there must not be one: «مهم غير
 *  عاجل» is already the square of the matrix that asks for a decision
 *  instead of making one, which is what an inbox is. A second list would be
 *  a second place to triage from.
 * ---------------------------------------------------------------------- */
export function addTask(state, { label, today }) {
  const text = String(label ?? "").trim();
  if (!text) return { refused: "اكتب المهمة بعد الكلمة." };
  const row = taskShape({ text, today: !!today, quadrant: "q2" });
  const appended = [...rows(state.tasks), row];

  if (!today) {
    return {
      kind: "task",
      row,
      today: false,
      next: { ...state, tasks: appended },
      before: { tasks: state.tasks },
    };
  }

  /* The cap, read off the state layer rather than counted here. `capToday`
     keeps the first three in HIS order and takes the flag off the rest —
     appended last, this one is the one that loses, which is the correct
     answer and not an accident. */
  const capped = capToday(appended);
  const kept = capped.find((t) => t.id === row.id);
  if (!kept || !kept.today) {
    /* Refused as a *today* task and kept as a task: his words are never
       thrown away over a cap. The cap's job is to say no to a fourth
       priority, not to a fourth thought.
     *
     *  `capped` and not `appended` — the list that goes to disk is the one
     *  the cap has already been through, or the refusal would be a message
     *  saying no beside a fourth flagged task on the screen. */
    return {
      kind: "task",
      row: kept || { ...row, today: false },
      today: false,
      capped: true,
      next: { ...state, tasks: capped },
      before: { tasks: state.tasks },
    };
  }
  return {
    kind: "task",
    row,
    today: true,
    next: { ...state, tasks: capped },
    before: { tasks: state.tasks },
  };
}

/* Ticking one of today's three off. */
export function finishTask(state, id) {
  const list = rows(state.tasks);
  const t = list.find((x) => x.id === id);
  if (!t) return { refused: "هذه المهمة لم تعد موجودة." };
  if (t.done) return { refused: `«${t.text}» مُنجزة أصلاً ✅` };
  return {
    kind: "task-done",
    row: t,
    next: { ...state, tasks: list.map((x) => (x.id === id ? { ...x, done: true } : x)) },
    before: { tasks: state.tasks },
  };
}

/* --- the water -------------------------------------------------------- *
 *  `state.water` rides today's archive row like everything else written
 *  per-day, so the stamp is not optional: without it the calendar and the
 *  monthly tracker would read a day that never recorded its water.
 * ---------------------------------------------------------------------- */
export function drinkWater(state, count = 1) {
  const goal = clampGoal(state.waterGoal);
  const was = Math.max(0, Math.round(state.water || 0));
  const now = Math.min(goal, was + Math.max(1, Math.round(count)));
  if (now === was) {
    return { refused: `بلغت هدفك اليوم: ${goal} أكواب ✅` };
  }
  return {
    kind: "water",
    count: now,
    goal,
    next: stampToday({ ...state, water: now }),
    /* The archive row moves with it, so it has to come back with it. */
    before: { water: state.water, history: state.history },
  };
}

/* --- the habits ------------------------------------------------------- */

/* Which habits a few typed words could mean. Folded on both sides, so
   «صلاة العصر» finds «صلاة العصر وأذكار» and «صلاه العصر» finds it too. The
   ones still open come first: a tick is almost always meant for one of
   those, and the ones already done are only here so the bot can say «مسجّلة
   أصلاً» instead of «ما لقيتها». */
export function findHabits(habits, query) {
  const q = fold(query);
  if (!q) return [];
  const list = rows(habits);
  const hit = (h) => {
    const label = fold(h.label);
    return label === q || label.includes(q) || q.includes(label);
  };
  const found = list.filter(hit);
  return [...found.filter((h) => !h.done), ...found.filter((h) => h.done)];
}

/* A tick, and the same tick a tiny one. `tiny` is a second argument and
   never a second function, exactly as `useHabitTick` takes it in the app:
   a floor taken on a hard day counts for the score, the streak and the
   archive, and is only *marked* differently. */
export function tickHabit(state, id, tiny = false) {
  const list = rows(state.habits);
  const h = list.find((x) => x.id === id);
  if (!h) return { refused: "هذه العادة لم تعد في روتينك." };
  if (h.done) return { refused: `«${h.label}» مسجّلة أصلاً اليوم ✅` };
  const next = stampToday({
    ...state,
    habits: list.map((x) => (x.id === id ? { ...x, done: true, tiny: !!tiny } : x)),
  });
  return {
    kind: "habit",
    habit: h,
    tiny: !!tiny,
    pct: disciplineOf(next.habits),
    /* A habit can feed the library, and the tick is what opens the question.
       Handed back rather than acted on: the reply must land and the reward
       must be paid whether or not pages are then logged, exactly as the
       app's modal is skippable. */
    book: bookForHabit(h, rows(state.books)),
    next,
    before: { habits: state.habits, history: state.history },
  };
}

/* --- the library ------------------------------------------------------- *
 *  The app logs pages from a modal that opens the instant a reading habit is
 *  ticked. The same thing from a phone is one sentence — «قرأت ٢٠ صفحة» — and
 *  it writes exactly what the modal writes: a row on `state.reading` and the
 *  book's page counter moved forward, bounded by the book's own total.
 *
 *  Which book is not a question the bot asks. A reading habit ticked a
 *  moment ago names one; otherwise it is whichever book is marked «أقرأه
 *  الآن», which is the same answer `READ_ACTIVE` gives the app.
 * ---------------------------------------------------------------------- */
/* --- which book a few typed words mean --------------------------------- *
 *  The same folded match `findHabits` and `findCourses` use, plus one thing
 *  neither of them needs: a word-by-word overlap. A habit's label is a
 *  phrase he wrote himself and types back nearly the same way; a book's
 *  title is a phrase a publisher wrote, and «سكليوجية المال» for
 *  «سيكولوجية المال» is the ordinary case rather than the awkward one. A
 *  substring match misses that outright — but «المال» still lands, and one
 *  correct word out of two is enough to name a book on a shelf of twenty.
 *
 *  Ranked, and only the tied best come back: one hit is an answer, two
 *  equally good hits are a question. Guessing between «العمل العميق» and
 *  «العادات الذرية» is how twenty pages land on the wrong book, and the page
 *  counter is the one number here nobody re-checks.
 * ---------------------------------------------------------------------- */
export const BOOK_WORD_MIN = 3;

/* How close two strings are, as the share of two-letter runs they have in
   common. It is the cheap classical measure and the right one for Arabic
   typed in a hurry: a dropped letter or a swapped pair costs two bigrams and
   not the whole word, which is exactly the difference between «سكليوجية» and
   «سيكولوجية». Spaces are dropped so a missing one does not count as a
   mismatch. */
const bigrams = (s) => {
  const t = String(s).replace(/\s+/g, "");
  const out = [];
  for (let i = 0; i < t.length - 1; i += 1) out.push(t.slice(i, i + 2));
  return out;
};

export function nearness(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.length || !B.length) return 0;
  const pool = new Map();
  for (const g of A) pool.set(g, (pool.get(g) || 0) + 1);
  let hit = 0;
  for (const g of B) {
    const n = pool.get(g);
    if (n) {
      hit += 1;
      pool.set(g, n - 1);
    }
  }
  return (2 * hit) / (A.length + B.length);
}

/* How much clearer the best spelling match has to be before it is allowed to
   settle a tie on its own. «المال» is a whole word of two different titles
   and nearly equally close to both — that is a question. «سكليوجية المال» is
   a long way closer to one of them — that is an answer. */
export const NEAR_MARGIN = 0.15;

export function findBooks(books, query) {
  const q = fold(query);
  if (!q) return [];
  const words = q.split(" ").filter((w) => w.length >= BOOK_WORD_MIN);
  const score = (b) => {
    const title = fold(b.title);
    if (!title) return 0;
    if (title === q) return 100;
    if (title.includes(q) || q.includes(title)) return 80;
    /* Counted in both directions: he may type less than the title («المال»)
       or more than it («سيكولوجية المال لمورغان»). */
    const forward = words.filter((w) => title.includes(w)).length;
    const back = title
      .split(" ")
      .filter((w) => w.length >= BOOK_WORD_MIN && q.includes(w)).length;
    const hits = Math.max(forward, back);
    return hits ? 40 + hits : 0;
  };
  const ranked = rows(books)
    .map((b) => ({ b, n: score(b), near: nearness(q, fold(b.title)) }))
    .filter((r) => r.n > 0)
    .sort((a, z) => z.n - a.n || z.near - a.near);
  if (!ranked.length) return [];
  const top = ranked[0].n;
  const tied = ranked.filter((r) => r.n === top);
  if (tied.length < 2) return tied.map((r) => r.b);
  /* A decisively closer spelling wins; a close one stays a question, because
     a page count landing on the wrong book is the one number nobody ever
     re-checks. */
  return tied[0].near - tied[1].near >= NEAR_MARGIN
    ? [tied[0].b]
    : tied.map((r) => r.b);
}

/* How a book's own numbers are read back, once, for every reply that shows
   them. `pctOf`, `pagesLeft` and `readPace` are the state layer's; this only
   gathers them so three confirmations cannot each gather a different three. */
export function bookStand(book, state) {
  const pace = readPace(book, state.reading);
  return {
    book,
    at: parseInt(book.page, 10) || 0,
    total: parseInt(book.pages, 10) > 0 ? parseInt(book.pages, 10) : null,
    pct: pctOf(book),
    left: pagesLeft(book),
    perDay: pace.perDay,
    /* Days to the last page at the pace of the last fortnight, or null when
       either number does not exist. A promise built on a number that is not
       there is the one kind of encouragement that gets a feature muted. */
    eta: pace.days,
    notes: rows(book.notes).filter((n) => n && n.text).length,
  };
}

export function logReading(state, { pages, habitId = null, bookId = null, back = 0 } = {}) {
  const n = Math.round(Number(pages) || 0);
  if (n < 1) return { refused: "كم صفحة؟ مثال: «قرأت ٢٠ صفحة»." };
  const books = rows(state.books);
  const habit = habitId ? rows(state.habits).find((h) => h.id === habitId) : null;
  /* Named, then the ticked habit's, then the active one. The caller resolves
     a name into an id before this is reached — matching needs the shelf and
     asking «أيّ كتاب؟» needs a keyboard, and neither belongs in a pure
     mutation. */
  const book =
    (bookId && books.find((b) => b.id === bookId)) ||
    (habit && bookForHabit(habit, books)) ||
    activeBook(books) ||
    null;
  if (!book) {
    return {
      refused: "ما فيه كتاب معلّم «أقرأه الآن» على الرف — أرسل «أضف كتاب <العنوان>» أو علّم واحدًا من المكتبة.",
    };
  }
  const total = parseInt(book.pages, 10);
  const at = parseInt(book.page, 10);
  const base = Number.isFinite(at) ? at : 0;
  /* Bounded by the book's own total when it has one, exactly as the modal
     bounds it: a counter past the last page is a book that reads as
     finished and is not. */
  const next =
    Number.isFinite(total) && total > 0 ? Math.min(total, base + n) : base + n;
  const on = backKey(back);
  const row = { id: uid(), date: on, bookId: book.id, habitId: habit?.id || null, pages: n };
  const goal = Number.isFinite(+state.readGoal) ? +state.readGoal : READ_GOAL_DEFAULT;
  const reading = [...rows(state.reading), row];
  /* Pages landing on a book he had only *planned* mean he started it, and
     pages landing on any book mean it is the one he is reading now — so it
     moves to the head of the shelf.
   *
   *  That matters beyond tidiness: «أقرأه الآن» is not exclusive on the
   *  shelf, every reader of it takes the first match (`activeBook`), and the
   *  next sentence is usually «فائدة …» with no book named in it. Without
   *  this, a point from tonight's reading lands on whichever book happens to
   *  sit earlier in the array. Book order carries no other meaning — the
   *  shelf has filters and a desk, and no hand ordering to overwrite. */
  const moved = {
    ...book,
    page: String(next),
    status: book.status === "planned" ? "reading" : book.status,
  };
  const rest = books.filter((b) => b.id !== book.id);
  const after = [moved, ...rest];
  return {
    kind: "reading",
    row,
    book: moved,
    started: book.status === "planned",
    pages: n,
    at: next,
    total: Number.isFinite(total) && total > 0 ? total : null,
    goal,
    on,
    today: sumPages(reading.filter((r) => r.date === dayKey())),
    streak: readStreak(reading, goal),
    stand: bookStand(moved, { ...state, reading }),
    /* Points already written on this book today. The question «وما أكبر
       فائدة؟» is asked once an evening and not after every message: a prompt
       that arrives after the thing was done is the prompt that teaches you
       to stop reading them. */
    kept: rows(book.notes).filter((n) => n && n.text && n.at === on).length,
    next: { ...state, reading, books: after },
    before: { reading: state.reading, books: state.books },
  };
}

/* --- the shelf, from a phone ------------------------------------------- *
 *  A book is added where the reading actually starts — standing in a shop,
 *  halfway through somebody's recommendation — and never at a laptop with
 *  the vault open. `bookShape` writes the row, like every other row here.
 * ---------------------------------------------------------------------- */
/* A bound, because this list is fed from a phone now. The shelf's own add
   form has never had one and does not need one: a hundred and twenty books
   is a decade of reading, and a list with no ceiling is a payload that grows
   until a save throws. */
export const BOOK_CAP = 120;

export function addBook(state, { title, author = "", status = "planned" } = {}) {
  const name = String(title ?? "").trim();
  if (!name) return { refused: "اكتب عنوان الكتاب. مثال: «أضف كتاب سيكولوجية المال»." };
  const books = rows(state.books);
  if (books.length >= BOOK_CAP) {
    return { refused: `الرف وصل ${BOOK_CAP} كتابًا — احذف واحدًا من المكتبة أولًا.` };
  }
  /* An existing title is not an error and not a second row: «أضف كتاب X» for
     a book already on the shelf is almost always him reaching for it, so the
     row he has is handed back and nothing is written. */
  const already = findBooks(books, name);
  if (already.length === 1) return { kind: "book", act: "already", book: already[0] };
  const row = bookShape({ id: uid(), title: name, author: String(author || "").trim(), status });
  return {
    kind: "book",
    act: "add",
    row,
    book: row,
    next: { ...state, books: [row, ...books] },
    before: { books: state.books },
  };
}

/* «أقرأه الآن», and the head of the shelf with it — the same reason a logged
   page moves a book up: the first `reading` row is what every reader of the
   active book takes. */
export function startBook(state, id) {
  const books = rows(state.books);
  const book = books.find((b) => b.id === id);
  if (!book) return { refused: "هذا الكتاب لم يعد على الرف." };
  const moved = { ...book, status: "reading", finishedAt: null };
  return {
    kind: "book",
    act: "start",
    book: moved,
    stand: bookStand(moved, state),
    next: { ...state, books: [moved, ...books.filter((b) => b.id !== id)] },
    before: { books: state.books },
  };
}

/* Finishing stamps the date once, exactly as the shelf does — and hands back
   what the book cost and gave, because that is the one moment the question
   «was it worth it?» is actually live. */
export function finishBook(state, id, on = dayKey()) {
  const books = rows(state.books);
  const book = books.find((b) => b.id === id);
  if (!book) return { refused: "هذا الكتاب لم يعد على الرف." };
  if (book.status === "finished") {
    return { refused: `«${book.title}» مسجّل منتهيًا أصلاً${book.finishedAt ? ` — ${book.finishedAt}` : ""}.` };
  }
  const log = rows(state.reading).filter((r) => r.bookId === id);
  const done = { ...book, status: "finished", finishedAt: book.finishedAt || on };
  return {
    kind: "book",
    act: "finish",
    book: done,
    /* What the log actually holds for it: the pages recorded through this
       system, the days they were spread over, and the points kept. */
    pages: sumPages(log),
    days: new Set(log.map((r) => r.date)).size,
    notes: rows(book.notes).filter((n) => n && n.text).length,
    hasLesson: !!String(book.lesson || "").trim(),
    next: { ...state, books: books.map((b) => (b.id === id ? done : b)) },
    before: { books: state.books },
  };
}

export function rateBook(state, id, stars) {
  const books = rows(state.books);
  const book = books.find((b) => b.id === id);
  if (!book) return { refused: "هذا الكتاب لم يعد على الرف." };
  const n = Math.round(clampNum(stars, 0, 5, 0));
  const rated = { ...book, rating: n };
  return {
    kind: "book",
    act: "rate",
    book: rated,
    next: { ...state, books: books.map((b) => (b.id === id ? rated : b)) },
    before: { books: state.books },
  };
}

/* --- a title that is not on the shelf yet ------------------------------ *
 *  «قرأت ٢٠ صفحة من سيكولوجية المال» for a book nobody has added is the most
 *  likely first sentence this feature will ever meet, and refusing it with
 *  «ما لقيت الكتاب» is a dead end that costs him the log. So the two writes
 *  are one: the book is added, marked as the one being read, and the pages
 *  go straight onto it.
 *
 *  One `before`, holding both arrays as they stood: an undo that put the
 *  pages back and left a book nobody chose on the shelf would be half an
 *  undo, which is worse than none.
 * ---------------------------------------------------------------------- */
export function addAndRead(state, { title, pages = 0, back = 0 } = {}) {
  const added = addBook(state, { title, status: "reading" });
  if (added.refused) return added;
  const book = added.book;
  const base = added.next || state;
  if (!pages) {
    return { ...added, act: "start", before: { books: state.books } };
  }
  const out = logReading(base, { pages, bookId: book.id, back });
  if (out.refused) return out;
  return {
    ...out,
    added: book,
    before: { books: state.books, reading: state.reading },
  };
}

/* --- what the book gave ------------------------------------------------ *
 *  A point, onto the book the pages last went into, carrying the page it was
 *  read at. `noteShape` writes it — the same function the book desk writes
 *  through — so a point typed on a phone enters the review rotation on
 *  exactly the same terms as one typed on the laptop.
 * ---------------------------------------------------------------------- */
export function addNote(state, { body, bookId = null, back = 0 } = {}) {
  const text = String(body ?? "").trim();
  if (!text) return { refused: "اكتب الفائدة بعد الكلمة. مثال: «فائدة المال حرية لا رفاهية»." };
  const books = rows(state.books);
  const book =
    (bookId && books.find((b) => b.id === bookId)) || activeBook(books) || null;
  if (!book) {
    return {
      refused: "ما فيه كتاب معلّم «أقرأه الآن» — الفائدة تحتاج كتابًا تُكتب عليه.",
    };
  }
  const notes = rows(book.notes);
  if (notes.length >= NOTE_CAP) {
    return { refused: `«${book.title}» وصل ${NOTE_CAP} نقطة — احذف واحدة من مكتب الكتاب.` };
  }
  /* Due tomorrow rather than left empty: a point written tonight is one he
     has just read, and the first return is worth something only after a
     night's sleep. An empty `due` would put it in this evening's own nudge. */
  const note = noteShape({
    text,
    page: book.page ? String(book.page) : "",
    at: backKey(back),
    box: 0,
    due: addDays(backKey(back), 1),
  });
  const kept = { ...book, notes: [...notes, note] };
  return {
    kind: "note",
    note,
    book: kept,
    count: notes.length + 1,
    next: { ...state, books: books.map((b) => (b.id === book.id ? kept : b)) },
    before: { books: state.books },
  };
}

/* The one sentence a whole book came down to. One field and not a list, so
   it is set and not appended — and the previous one rides out on `before`
   like every other array this file replaces. */
export function setLesson(state, { body, bookId = null } = {}) {
  const text = String(body ?? "").trim();
  if (!text) return { refused: "اكتب الدرس بعد الكلمة." };
  const books = rows(state.books);
  const book =
    (bookId && books.find((b) => b.id === bookId)) ||
    activeBook(books) ||
    books.find((b) => b.status === "finished") ||
    null;
  if (!book) return { refused: "ما فيه كتاب على الرف يُكتب عليه الدرس." };
  const kept = { ...book, lesson: text };
  return {
    kind: "lesson",
    book: kept,
    was: String(book.lesson || ""),
    next: { ...state, books: books.map((b) => (b.id === book.id ? kept : b)) },
    before: { books: state.books },
  };
}

/* --- a point, come back around ----------------------------------------- *
 *  `kept` is «تذكّرتها»: the gap to the next return widens. Forgotten sends
 *  it back to the bottom of the ladder, which is the whole mechanism —
 *  nothing here decides the spacing, `reviewedNote` in the state layer owns
 *  it, because the book desk shows the same schedule.
 * ---------------------------------------------------------------------- */
export function reviewNote(state, bookId, noteId, kept, on = dayKey()) {
  const books = rows(state.books);
  const book = books.find((b) => b.id === bookId);
  if (!book) return { refused: "هذا الكتاب لم يعد على الرف." };
  const note = rows(book.notes).find((n) => n.id === noteId);
  if (!note) return { refused: "هذي النقطة لم تعد في مكتب الكتاب." };
  const after = reviewedNote(note, kept, on);
  const kept2 = {
    ...book,
    notes: rows(book.notes).map((n) => (n.id === noteId ? after : n)),
  };
  const books2 = books.map((b) => (b.id === bookId ? kept2 : b));
  return {
    kind: "review",
    book: kept2,
    note: after,
    was: note,
    kept: !!kept,
    /* What is still waiting after this one, so the reply can say whether the
       evening's review is over. Read off the new shelf, never the old. */
    left: dueNotes(books2, on).length,
    total: countNotes(books2),
    next: { ...state, books: books2 },
    before: { books: state.books },
  };
}

/* --- the focus desk, from a phone -------------------------------------- *
 *  The run is state and is counted off an absolute `endAt`, which is the
 *  whole reason this is possible at all: a round started from a message and
 *  a round started from the screen are the same row, and either side can end
 *  it. Nothing here re-decides the rhythm — `closePhase` in the state layer
 *  owns the cycle counter, the row and the next phase, and both writers call
 *  it.
 * ---------------------------------------------------------------------- */

/* A run found already over is settled before anything else is decided.
   Otherwise a round that finished three hours ago would still be «counting»
   when the next message arrives, and the minutes it earned would be lost
   the moment it was replaced. */
const settled = (state, now) => {
  const focus = focusShape(state.focus);
  const out = settleRun(focus.run, now);
  if (out.run === focus.run) return { focus, state, closed: null };
  /* A finished round goes through `closePhase` so the counter advances and
     the break is armed exactly as it would have been on screen. */
  if (out.rang && focus.run) {
    const next = closePhase(state, focus.run, { minutes: focus.run.planned, full: true, at: now });
    return {
      focus: next.focus,
      state: { ...state, sessions: next.sessions, focus: next.focus, tasks: next.tasks },
      closed: { phase: focus.run.phase, row: next.row },
    };
  }
  /* Stale: the minutes of a paused round are kept, a round still counting
     when it went stale writes nothing. `settleRun` already drew that line. */
  const sessions = out.log ? addSession(state.sessions, out.log) : state.sessions;
  const focusNext = { ...focus, run: null };
  return {
    focus: focusNext,
    state: { ...state, sessions, focus: focusNext },
    closed: { phase: focus.run?.phase, row: out.log, dropped: true },
  };
};

export function startFocus(state, { minutes = 0, label = "", taskId = null } = {}, now = Date.now()) {
  const base = settled(state, now);
  const focus = base.focus;
  if (runRunning(focus.run)) {
    return {
      refused: `${phaseOf(focus.run.phase).label} تعدّ الآن — باقي ${Math.ceil(
        runLeft(focus.run, now) / 60,
      )} دقيقة. أرسل «أوقف» أولًا.`,
    };
  }
  const preset = presetFor(focus, focus.pick);
  const planned = minutes >= 1 ? minutes : preset.min;
  const run = startRun(
    armRun({
      phase: "focus",
      planned,
      presetId: preset.id,
      taskId,
      label,
      round: focus.round,
      now,
    }),
    now,
  );
  return {
    kind: "focus-start",
    run,
    preset,
    next: { ...base.state, focus: { ...focus, run } },
    before: { focus: state.focus, sessions: state.sessions },
  };
}

/* The break, armed and started on purpose. A break that has to be asked for
   is still better than one that never comes, which is what a timer with no
   break at all guarantees. */
export function breakFocus(state, { minutes = 0 } = {}, now = Date.now()) {
  const base = settled(state, now);
  const focus = base.focus;
  if (runRunning(focus.run) && !isBreak(focus.run.phase)) {
    return { refused: "جولة تركيز تعدّ الآن. أرسل «أوقف» ثم «استراحة»." };
  }
  const preset = presetFor(focus, focus.pick);
  const phase = nextBreak(preset, focus.round);
  const planned = minutes >= 1 ? minutes : breakMinutes(preset, phase);
  const run = startRun(
    armRun({ phase, planned, presetId: preset.id, round: focus.round, now }),
    now,
  );
  return {
    kind: "focus-break",
    run,
    next: { ...base.state, focus: { ...focus, run } },
    before: { focus: state.focus, sessions: state.sessions },
  };
}

export function pauseFocus(state, now = Date.now()) {
  const focus = focusShape(state.focus);
  if (!runRunning(focus.run)) return { refused: "ما فيه شي يعدّ الآن." };
  const run = pauseRun(focus.run, now);
  return {
    kind: "focus-pause",
    run,
    spent: spentMinutes(run, now),
    next: { ...state, focus: { ...focus, run } },
    before: { focus: state.focus },
  };
}

export function resumeFocus(state, now = Date.now()) {
  const base = settled(state, now);
  const focus = base.focus;
  if (!focus.run) return { refused: "ما فيه جولة موقوفة. أرسل «ابدأ تركيز»." };
  if (runRunning(focus.run)) return { refused: "هي تعدّ أصلاً." };
  const run = startRun(focus.run, now);
  return {
    kind: "focus-resume",
    run,
    next: { ...base.state, focus: { ...focus, run } },
    before: { focus: state.focus, sessions: state.sessions },
  };
}

/* Stopped, and logged as the minutes it actually was. The old timer wrote
   nothing unless the round finished, so eighty minutes of a ninety-minute
   round simply never existed — `full: false` is what makes the row honest
   instead of absent. A round cut short does not advance the cycle counter:
   the long break is earned by rounds that were sat through. */
export function stopFocus(state, now = Date.now()) {
  const base = settled(state, now);
  const focus = base.focus;
  if (!focus.run) return { refused: "ما فيه جولة قائمة." };
  const run = focus.run;
  const mins = spentMinutes(run, now);
  const out = closePhase(base.state, run, {
    minutes: mins,
    full: false,
    advance: false,
    nextRun: null,
    at: now,
  });
  return {
    kind: "focus-stop",
    run,
    minutes: mins,
    logged: !!out.row,
    next: { ...base.state, sessions: out.sessions, focus: { ...out.focus, run: null }, tasks: out.tasks },
    before: { focus: state.focus, sessions: state.sessions },
  };
}

/* A stale run, accepted or thrown away by hand — the two buttons the coach
   offers when it finds one. Accepting is what `settleRun` would have done
   on its own; dropping is the one case the user overrules it. */
export function settleFocus(state, now = Date.now()) {
  const focus = focusShape(state.focus);
  if (!focus.run) return { refused: "ما فيه جولة معلّقة." };
  const base = settled(state, now);
  if (!base.closed) return { refused: "الجولة ما زالت قائمة — ما فيه شي يُعتمد." };
  return {
    kind: "focus-settle",
    minutes: base.closed.row ? base.closed.row.minutes : 0,
    next: base.state,
    before: { focus: state.focus, sessions: state.sessions },
  };
}

export function dropFocus(state) {
  const focus = focusShape(state.focus);
  if (!focus.run) return { refused: "ما فيه جولة معلّقة." };
  return {
    kind: "focus-drop",
    next: { ...state, focus: { ...focus, run: null } },
    before: { focus: state.focus },
  };
}

/* Work that happened away from any timer. Marked `full` because there was no
   plan to have fallen short of. */
export function logFocus(state, { minutes, label = "", taskId = null, back = 0 } = {}, now = Date.now()) {
  /* Noon of the day it belongs to, not the current clock: `manualSession`
     dates a row from the epoch it is handed, and midnight would land the
     row on the wrong side of the logical day boundary. */
  const at = back ? (keyToDate(backKey(back))?.getTime() ?? now) + 12 * 3600 * 1000 : now;
  const row = manualSession({ minutes, label, taskId, at });
  if (!row) return { refused: "كم دقيقة؟ مثال: «ركزت ٤٥ دقيقة على المحاسبة»." };
  return {
    kind: "focus-log",
    row,
    next: { ...state, sessions: addSession(state.sessions, row) },
    before: { sessions: state.sessions },
  };
}

/* --- the breaker ------------------------------------------------------- *
 *  A hold never touches `startDate`: surviving the urge is the run
 *  continuing, not an event in it. A fall stamps the run that just ended
 *  onto the log, so the record outlives the counter it cost.
 * ---------------------------------------------------------------------- */
function oneBad(state, query) {
  const list = rows(state.badHabits);
  if (!list.length) return { refused: "ما فيه عادة مسجّلة في كاسر العادات." };
  if (!query) return list.length === 1 ? { bad: list[0] } : { many: list };
  const q = fold(query);
  const hit = list.filter((b) => {
    const t = fold(b.title);
    return t === q || t.includes(q) || q.includes(t);
  });
  if (!hit.length) return list.length === 1 ? { bad: list[0] } : { many: list };
  return hit.length === 1 ? { bad: hit[0] } : { many: hit };
}

export function holdUrge(state, id, { tag = "", mood = "", trigger = "" } = {}) {
  const list = rows(state.badHabits);
  const bad = list.find((b) => b.id === id);
  if (!bad) return { refused: "هذي العادة لم تعد موجودة." };
  const row = urgeShape({ ...stamp(), tag, mood, trigger }, "hold");
  return {
    kind: "hold",
    bad,
    row,
    days: cleanDays(bad),
    next: stampToday({
      ...state,
      badHabits: list.map((b) =>
        b.id === id ? { ...b, urges: [...rows(b.urges), row] } : b,
      ),
    }),
    before: { badHabits: state.badHabits, history: state.history },
  };
}

export function fallUrge(state, id, { tag = "", mood = "", trigger = "" } = {}) {
  const list = rows(state.badHabits);
  const bad = list.find((b) => b.id === id);
  if (!bad) return { refused: "هذي العادة لم تعد موجودة." };
  const was = cleanDays(bad);
  const row = urgeShape(
    { ...stamp(), days: was, tag, mood, trigger },
    "fall",
  );
  return {
    kind: "fall",
    bad,
    row,
    was,
    next: stampToday({
      ...state,
      badHabits: list.map((b) =>
        b.id === id
          ? { ...b, logs: [...rows(b.logs), row], startDate: dayKey() }
          : b,
      ),
    }),
    before: { badHabits: state.badHabits, history: state.history },
  };
}

export { oneBad };

/* --- tomorrow's three, tonight ----------------------------------------- *
 *  `prepPickAdd` holds the cap and refuses the fourth outright, which is one
 *  of its four doors. Nothing here counts picks itself.
 * ---------------------------------------------------------------------- */
export function pickTomorrow(state, taskId) {
  const task = rows(state.tasks).find((t) => t.id === taskId);
  if (!task) return { refused: "هذي المهمة لم تعد موجودة." };
  const day = tomorrowKey();
  /* `prepPickAdd` refuses by handing the prep back unchanged rather than by
     returning nothing — it is written for a screen, where a no-op button is
     the whole of a refusal. In a chat a silent no-op is indistinguishable
     from a write that failed, so the two cases it refuses for are read here
     and each one is said out loud. The cap itself is still the state
     layer's: nothing below counts picks to decide whether to allow one. */
  const was = prepShape(state.prep);
  const already = was.for === day ? was.picks : [];
  if (already.some((x) => x.task === taskId)) {
    return { refused: `«${task.text}» مختارة لغد أصلاً.` };
  }
  if (already.length >= TOP_TASK_CAP) {
    return {
      refused: `مهام الغد مكتملة بـ${TOP_TASK_CAP} — والحد مقصود. اشطب واحدة من «جهّز غدك».`,
    };
  }
  const prep = prepPickAdd(state.prep, taskId, day);
  return {
    kind: "prep",
    task,
    picks: prepPicks(prep).length,
    next: { ...state, prep },
    before: { prep: state.prep },
  };
}

/* --- one of today's three, chosen from the matrix ---------------------- *
 *  The flag, not a new task: the coach offers what is already in the
 *  quadrants rather than asking him to type it twice. `capToday` is the
 *  gate, as it is for every other door.
 * ---------------------------------------------------------------------- */
export function flagToday(state, taskId) {
  const list = rows(state.tasks);
  const task = list.find((t) => t.id === taskId);
  if (!task) return { refused: "هذي المهمة لم تعد موجودة." };
  if (task.done) return { refused: `«${task.text}» مُنجزة أصلاً ✅` };
  if (task.today) return { refused: `«${task.text}» من مهام اليوم أصلاً.` };
  const capped = capToday(list.map((t) => (t.id === taskId ? { ...t, today: true } : t)));
  const kept = capped.find((t) => t.id === taskId);
  if (!kept || !kept.today) {
    return {
      refused: `مهام اليوم مكتملة بـ${TOP_TASK_CAP} — والحد مقصود. أنجِز واحدة أولًا.`,
    };
  }
  return {
    kind: "top",
    row: kept,
    next: { ...state, tasks: capped },
    before: { tasks: state.tasks },
  };
}

/* --- the evening reflection -------------------------------------------- *
 *  Written onto today's archive row, which is where the app writes it. The
 *  row is stamped first so it exists and is current, then the field is
 *  merged — `stampToday` spreads the previous entry precisely so anything
 *  written per-day survives a habit toggle, and this is one of those things.
 * ---------------------------------------------------------------------- */
export function reflect(state, { field, note }) {
  const text = String(note ?? "").trim();
  if (!text) return { refused: "اكتب الجواب بعد الكلمة." };
  if (field !== "distraction" && field !== "fix") {
    return { refused: "ما فهمت أي جزء من التقييم." };
  }
  const today = dayKey();
  const stamped = stampToday(state);
  return {
    kind: "reflect",
    field,
    note: text.slice(0, 300),
    next: {
      ...stamped,
      history: rows(stamped.history).map((h) =>
        h.date === today ? { ...h, [field]: text.slice(0, 300) } : h,
      ),
    },
    before: { history: state.history },
  };
}

/* --- a day that is not today ------------------------------------------- *
 *  `expenseShape` and the rest have always taken a date; nothing could say
 *  one. The row is written with it and the confirmation says which day it
 *  landed on, because a row filed on the wrong square is only findable if
 *  the message said where it went.
 * ---------------------------------------------------------------------- */
export const backKey = (back) => {
  const n = Math.round(Number(back) || 0);
  return n >= 1 && n <= BACK_MAX ? addDays(dayKey(), -n) : dayKey();
};

/* --- the calendar ------------------------------------------------------ *
 *  `readWhen` in the parser hands back the day as a *word*; turning it into
 *  a square is calendar arithmetic and lives here, beside the shape that
 *  will carry it.
 * ---------------------------------------------------------------------- */
export function whenKey(day, from = dayKey()) {
  if (day === null || day === undefined) return from;
  if (day === "today") return from;
  if (day === "tomorrow") return addDays(from, 1);
  if (day === "after") return addDays(from, 2);
  const want = Number(day);
  if (!Number.isInteger(want) || want < 0 || want > 6) return from;
  /* The next one of that weekday, today included: «موعد الأحد» said on a
     Sunday morning is this Sunday, and pushing it a week out would be the
     app arguing with him about a day he can see. */
  const base = keyToDate(from);
  if (!base) return from;
  const ahead = (want - base.getDay() + 7) % 7;
  return addDays(from, ahead);
}

export function addEvent(state, { title, day, time }) {
  const text = String(title ?? "").trim();
  if (!text) return { refused: "اكتب عنوان الموعد." };
  const row = eventShape({
    title: text,
    date: whenKey(day),
    time: time || "",
    /* «مقابلة» is a meeting and everything else is a note until he says
       otherwise. Guessing further — an exam, a deadline — would put a red
       tint on a dentist's appointment. */
    kind: /مقابل|اجتماع/.test(text) ? "meet" : "note",
  });
  return {
    kind: "event",
    row,
    next: { ...state, events: [...rows(state.events), row] },
    before: { events: state.events },
  };
}

/* --- the university desk ------------------------------------------------ */

/* Which course a few words could mean. The same folded match `findHabits`
   uses, over the name and the code — he says «محاسبة» and the row says
   «مبادئ المحاسبة ١» or «ACCT 101», and either should find it. */
export function findCourses(uni, query) {
  const list = rows(uniShape(uni).courses);
  const q = fold(query);
  if (!q) return list;
  const hit = (c) => {
    const name = fold(c.name);
    const code = fold(c.code);
    return (
      (name && (name === q || name.includes(q) || q.includes(name))) ||
      (code && (code === q || code.includes(q) || q.includes(code)))
    );
  };
  const found = list.filter(hit);
  return found.length ? found : [];
}

/* One absence, with the guard that makes the button safe to press twice.
   `absences` stays the authoritative count — a term usually starts with
   absences taken before the app did — and `absentOn` is only what lets a
   second tap on the same day be refused. */
export function markAbsence(state, courseId, on = dayKey()) {
  const uni = uniShape(state.uni);
  const course = rows(uni.courses).find((c) => c.id === courseId);
  if (!course) return { refused: "هذي المادة لم تعد موجودة." };
  /* The array directly, never through `rows()`: that helper keeps row
     *objects* and drops everything else, and `absentOn` is a list of bare
     day keys — so `rows(absentOn)` is always empty and the guard it was
     written for never fired once. The guard is the whole point here: tapping
     «غياب» twice after one lecture is the easiest mistake on that screen and
     the hardest to notice, because the number is simply wrong from then on. */
  const seen = Array.isArray(course.absentOn) ? course.absentOn : [];
  if (seen.includes(on)) {
    return { refused: `غياب «${course.name || course.code}» مسجّل لهذا اليوم أصلاً.` };
  }
  const courses = uni.courses.map((c) =>
    c.id === courseId
      ? {
          ...c,
          absences: c.absences + 1,
          absentOn: [...(Array.isArray(c.absentOn) ? c.absentOn : []), on],
        }
      : c,
  );
  const after = courses.find((c) => c.id === courseId);
  return {
    kind: "absence",
    course: after,
    count: after.absences,
    cap: after.absenceCap,
    next: { ...state, uni: { ...uni, courses } },
    before: { uni: state.uni },
  };
}

export function addMark(state, courseId, { label, score, max }) {
  const uni = uniShape(state.uni);
  const course = rows(uni.courses).find((c) => c.id === courseId);
  if (!course) return { refused: "هذي المادة لم تعد موجودة." };
  /* Checked on the way *in*, not on the shaped row: `markShape` clamps an
     unusable `max` up to 100, which is right for a damaged payload being
     read off disk and wrong for a sentence being typed — «١٨ من ٠» would
     quietly become eighteen out of a hundred. */
  if (!(Number(max) > 0)) {
    return { refused: "الدرجة لازم تكون «من» رقم أكبر من صفر." };
  }
  const row = markShape({ label: String(label || "درجة").trim(), score, max });
  const courses = uni.courses.map((c) =>
    c.id === courseId ? { ...c, marks: [...rows(c.marks), row] } : c,
  );
  return {
    kind: "mark",
    course,
    row,
    next: { ...state, uni: { ...uni, courses } },
    before: { uni: state.uni },
  };
}

/* --- the goals vault ---------------------------------------------------- *
 *  The meter only. A goal's text, pillar, quarter and parent are decisions
 *  made on a screen with the whole tree visible; `current` is the one field
 *  that changes while you are out of the house.
 * ---------------------------------------------------------------------- */
export function findGoals(goals, query) {
  const q = fold(query);
  if (!q) return [];
  const open = rows(goals).filter((g) => !g.done);
  const hit = (g) => {
    const t = fold(g.text);
    return t === q || t.includes(q) || q.includes(t);
  };
  const found = open.filter(hit);
  /* A goal with a meter first: «هدف الحفظ ٣٠» is about a number, and a
     yes/no goal has nowhere to put one. */
  return [...found.filter((g) => g.target > 0), ...found.filter((g) => !g.target)];
}

export function moveGoal(state, id, { value, add = false }) {
  const list = rows(state.goals);
  const goal = list.find((g) => g.id === id);
  if (!goal) return { refused: "هذا الهدف لم يعد موجودًا." };
  if (!(goal.target > 0)) {
    return {
      refused: `«${goal.text}» بلا عدّاد — يُقاس بخطواته أو بأهداف تحته، لا برقم.`,
    };
  }
  const was = Number(goal.current) || 0;
  const want = add ? was + Number(value) : Number(value);
  const now = Math.max(0, Math.min(goal.target, want));
  if (now === was) {
    return { refused: `«${goal.text}» عند ${was} أصلاً.` };
  }
  const next = list.map((g) => (g.id === id ? goalShape({ ...g, current: now }) : g));
  return {
    kind: "goal",
    goal: next.find((g) => g.id === id),
    was,
    now,
    next: { ...state, goals: next },
    before: { goals: state.goals },
  };
}

/* --- taking a tick back ------------------------------------------------- *
 *  An untick is a deletion in everything but name: it withdraws today's
 *  reading sessions for the habit and rolls the book's page counter back.
 *  `withdrawReading` is the state layer's, so this and the routine screen
 *  cannot disagree about where a book has reached.
 * ---------------------------------------------------------------------- */
export function untickHabit(state, id) {
  const list = rows(state.habits);
  const h = list.find((x) => x.id === id);
  if (!h) return { refused: "هذه العادة لم تعد في روتينك." };
  if (!h.done) return { refused: `«${h.label}» غير مؤشّرة أصلاً.` };
  const back = withdrawReading(state.reading, state.books, id, dayKey());
  const next = stampToday({
    ...state,
    /* `tiny` leaves with the tick: a habit unticked is not «done the small
       way», it is not done, and a mark left behind would be read back by
       the archive as a day that was carried. */
    habits: list.map((x) => (x.id === id ? { ...x, done: false, tiny: false } : x)),
    reading: back.reading,
    books: back.books,
  });
  return {
    kind: "untick",
    habit: h,
    pages: back.pages,
    pct: disciplineOf(next.habits),
    next,
    before: {
      habits: state.habits,
      history: state.history,
      reading: state.reading,
      books: state.books,
    },
  };
}

/* --- yesterday, corrected from a phone --------------------------------- *
 *  One archive row rewritten and nothing else moved — today's habits do not
 *  shift, because today is a different day and the whole value of a hard
 *  boundary is that it holds. `setDayDone` is the same function «عدّل أمس»
 *  goes through, and the streak is recomputed from the rows rather than
 *  nudged.
 * ---------------------------------------------------------------------- */
export function tickOn(state, id, date, on = true) {
  const habits = rows(state.habits);
  const h = habits.find((x) => x.id === id);
  if (!h) return { refused: "هذه العادة لم تعد في روتينك." };
  const have = rows(state.history);
  const row = have.find((r) => r.date === date) || null;
  const was = Array.isArray(row?.done) ? row.done : [];
  if (on && was.includes(id)) return { refused: `«${h.label}» مسجّلة في ذلك اليوم أصلاً.` };
  if (!on && !was.includes(id)) return { refused: `«${h.label}» غير مسجّلة في ذلك اليوم.` };
  const done = on ? [...was, id] : was.filter((x) => x !== id);
  const history = setDayDone(have, date, done, habits);
  return {
    kind: "day-edit",
    habit: h,
    date,
    on,
    pct: history.find((r) => r.date === date)?.pct ?? 0,
    next: { ...state, history, streakBase: streakBaseFrom(history) },
    before: { history: state.history, streakBase: state.streakBase },
  };
}

/* --- putting one back ------------------------------------------------- *
 *  Spread over whatever the state is by then rather than over the state the
 *  change was made on: an unrelated row added in the meantime is not undone
 *  along with this one.
 * ---------------------------------------------------------------------- */
export function undo(state, before) {
  if (!before || typeof before !== "object") {
    return { refused: "ما فيه شي أرجّعه." };
  }
  return { kind: "undo", next: { ...state, ...before } };
}

/* --- what the day looks like ------------------------------------------ *
 *  Read-only, and every figure derived. Used by the two briefs and by
 *  «/يومي», so there is one reading of the day and not three.
 * ---------------------------------------------------------------------- */
export function dayAt(state) {
  const habits = rows(state.habits);
  const scored = scoredOf(habits);
  const tasks = rows(state.tasks).filter((t) => t.today);
  return {
    date: state.date,
    pct: disciplineOf(habits),
    scored,
    openScored: scored.filter((h) => !h.done),
    habitsDone: habits.filter((h) => h.done).length,
    habitsAll: habits.length,
    tasks,
    tasksOpen: tasks.filter((t) => !t.done),
    water: Math.max(0, Math.round(state.water || 0)),
    waterGoal: clampGoal(state.waterGoal),
    spentWeek: amountSum(rows(state.expenses).filter((e) => e.date >= weekAgo(state.date))),
    earnedWeek: amountSum(rows(state.income).filter((e) => e.date >= weekAgo(state.date))),
    balance: netBalance(state.income, state.expenses),
    /* The library, as the briefs need it. Read here with everything else the
       day is made of, so the two briefs and «يومي» cannot each count the
       day's pages their own way. */
    book: activeBook(rows(state.books)),
    readToday: sumPages(rows(state.reading).filter((r) => r.date === state.date)),
    readGoal: Number.isFinite(+state.readGoal) ? +state.readGoal : READ_GOAL_DEFAULT,
    notesDue: dueNotes(rows(state.books), state.date).length,
    /* Points written today, so the evening asks for one only on an evening
       that has none. A prompt that arrives after the thing was already done
       is the prompt that teaches you to stop reading them. */
    notesToday: rows(state.books).reduce(
      (n, b) => n + rows(b.notes).filter((x) => x && x.text && x.at === state.date).length,
      0,
    ),
  };
}

/* Six days back from the day in hand, as a key. String comparison on day
   keys is what every window in the state layer uses — an ISO key sorts
   lexicographically, and parsing it into a Date only invites a timezone to
   move it. */
function weekAgo(date) {
  const [y, m, d] = String(date || "").split("-").map(Number);
  if (!y) return "0000-00-00";
  const x = new Date(y, m - 1, d - 6);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}
