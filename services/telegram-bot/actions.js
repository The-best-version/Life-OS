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
  
  // الميزة الجوهرية: استيراد دوال الأهداف
  syncHabitToGoals,
  goalPct,
  goalPace,
  horizonOf,
  quarterOf,
  pillarOf,
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

/* --- the tasks --------------------------------------------------------- */

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

  const capped = capToday(appended);
  const kept = capped.find((t) => t.id === row.id);
  if (!kept || !kept.today) {
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

/* --- the water -------------------------------------------------------- */
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
    before: { water: state.water, history: state.history },
  };
}

/* --- the habits ------------------------------------------------------- */
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

export function tickHabit(state, id, tiny = false) {
  const list = rows(state.habits);
  const h = list.find((x) => x.id === id);
  if (!h) return { refused: "هذه العادة لم تعد في روتينك." };
  if (h.done) return { refused: `«${h.label}» مسجّلة أصلاً اليوم ✅` };
  
  // الميزة الجوهرية: تحديث الأهداف المرتبطة بهذه العادة
  const updatedGoals = syncHabitToGoals(state.goals, id, true);
  
  const next = stampToday({
    ...state,
    habits: list.map((x) => (x.id === id ? { ...x, done: true, tiny: !!tiny } : x)),
    goals: updatedGoals, // <--- تحديث الأهداف هنا
  });
  return {
    kind: "habit",
    habit: h,
    tiny: !!tiny,
    pct: disciplineOf(next.habits),
    book: bookForHabit(h, rows(state.books)),
    next,
    before: { habits: state.habits, history: state.history, goals: state.goals }, // <--- إضافة goals للـ undo
  };
}

/* --- the library ------------------------------------------------------- */
export const BOOK_WORD_MIN = 3;

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
  return tied[0].near - tied[1].near >= NEAR_MARGIN
    ? [tied[0].b]
    : tied.map((r) => r.b);
}

export function bookStand(book, state) {
  const pace = readPace(book, state.reading);
  return {
    book,
    at: parseInt(book.page, 10) || 0,
    total: parseInt(book.pages, 10) > 0 ? parseInt(book.pages, 10) : null,
    pct: pctOf(book),
    left: pagesLeft(book),
    perDay: pace.perDay,
    eta: pace.days,
    notes: rows(book.notes).filter((n) => n && n.text).length,
  };
}

export function logReading(state, { pages, habitId = null, bookId = null, back = 0 } = {}) {
  const n = Math.round(Number(pages) || 0);
  if (n < 1) return { refused: "كم صفحة؟ مثال: «قرأت ٢٠ صفحة»." };
  const books = rows(state.books);
  const habit = habitId ? rows(state.habits).find((h) => h.id === habitId) : null;
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
  const next =
    Number.isFinite(total) && total > 0 ? Math.min(total, base + n) : base + n;
  const on = backKey(back);
  const row = { id: uid(), date: on, bookId: book.id, habitId: habit?.id || null, pages: n };
  const goal = Number.isFinite(+state.readGoal) ? +state.readGoal : READ_GOAL_DEFAULT;
  const reading = [...rows(state.reading), row];
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
    kept: rows(book.notes).filter((n) => n && n.text && n.at === on).length,
    next: { ...state, reading, books: after },
    before: { reading: state.reading, books: state.books },
  };
}

export const BOOK_CAP = 120;

export function addBook(state, { title, author = "", status = "planned" } = {}) {
  const name = String(title ?? "").trim();
  if (!name) return { refused: "اكتب عنوان الكتاب. مثال: «أضف كتاب سيكولوجية المال»." };
  const books = rows(state.books);
  if (books.length >= BOOK_CAP) {
    return { refused: `الرف وصل ${BOOK_CAP} كتابًا — احذف واحدًا من المكتبة أولًا.` };
  }
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
    left: dueNotes(books2, on).length,
    total: countNotes(books2),
    next: { ...state, books: books2 },
    before: { books: state.books },
  };
}

/* --- the focus desk, from a phone -------------------------------------- */
const settled = (state, now) => {
  const focus = focusShape(state.focus);
  const out = settleRun(focus.run, now);
  if (out.run === focus.run) return { focus, state, closed: null };
  if (out.rang && focus.run) {
    const next = closePhase(state, focus.run, { minutes: focus.run.planned, full: true, at: now });
    return {
      focus: next.focus,
      state: { ...state, sessions: next.sessions, focus: next.focus, tasks: next.tasks },
      closed: { phase: focus.run.phase, row: next.row },
    };
  }
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

export function logFocus(state, { minutes, label = "", taskId = null, back = 0 } = {}, now = Date.now()) {
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

/* --- the breaker ------------------------------------------------------- */
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

/* --- tomorrow's three, tonight ----------------------------------------- */
export function pickTomorrow(state, taskId) {
  const task = rows(state.tasks).find((t) => t.id === taskId);
  if (!task) return { refused: "هذي المهمة لم تعد موجودة." };
  const day = tomorrowKey();
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

export const backKey = (back) => {
  const n = Math.round(Number(back) || 0);
  return n >= 1 && n <= BACK_MAX ? addDays(dayKey(), -n) : dayKey();
};

export function whenKey(day, from = dayKey()) {
  if (day === null || day === undefined) return from;
  if (day === "today") return from;
  if (day === "tomorrow") return addDays(from, 1);
  if (day === "after") return addDays(from, 2);
  const want = Number(day);
  if (!Number.isInteger(want) || want < 0 || want > 6) return from;
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

export function markAbsence(state, courseId, on = dayKey()) {
  const uni = uniShape(state.uni);
  const course = rows(uni.courses).find((c) => c.id === courseId);
  if (!course) return { refused: "هذي المادة لم تعد موجودة." };
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

/* --- the goals vault ---------------------------------------------------- */
export function findGoals(goals, query) {
  const q = fold(query);
  if (!q) return [];
  const open = rows(goals).filter((g) => !g.done);
  const hit = (g) => {
    const t = fold(g.text);
    return t === q || t.includes(q) || q.includes(t);
  };
  const found = open.filter(hit);
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

/* --- taking a tick back ------------------------------------------------- */
export function untickHabit(state, id) {
  const list = rows(state.habits);
  const h = list.find((x) => x.id === id);
  if (!h) return { refused: "هذه العادة لم تعد في روتينك." };
  if (!h.done) return { refused: `«${h.label}» غير مؤشّرة أصلاً.` };
  const back = withdrawReading(state.reading, state.books, id, dayKey());
  
  // الميزة الجوهرية: إزالة التحديث من الأهداف
  const updatedGoals = syncHabitToGoals(state.goals, id, false);
  
  const next = stampToday({
    ...state,
    habits: list.map((x) => (x.id === id ? { ...x, done: false, tiny: false } : x)),
    reading: back.reading,
    books: back.books,
    goals: updatedGoals, // <--- تحديث الأهداف هنا
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
      goals: state.goals, // <--- إضافة goals للـ undo
    },
  };
}

/* --- yesterday, corrected from a phone --------------------------------- */
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

/* --- putting one back ------------------------------------------------- */
export function undo(state, before) {
  if (!before || typeof before !== "object") {
    return { refused: "ما فيه شي أرجّعه." };
  }
  return { kind: "undo", next: { ...state, ...before } };
}

/* --- what the day looks like ------------------------------------------ */
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
    book: activeBook(rows(state.books)),
    readToday: sumPages(rows(state.reading).filter((r) => r.date === state.date)),
    readGoal: Number.isFinite(+state.readGoal) ? +state.readGoal : READ_GOAL_DEFAULT,
    notesDue: dueNotes(rows(state.books), state.date).length,
    notesToday: rows(state.books).reduce(
      (n, b) => n + rows(b.notes).filter((x) => x && x.text && x.at === state.date).length,
      0,
    ),
  };
}

function weekAgo(date) {
  const [y, m, d] = String(date || "").split("-").map(Number);
  if (!y) return "0000-00-00";
  const x = new Date(y, m - 1, d - 6);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

/* ==================================================================== *
 *  الميزة الجوهرية: ملخص الأهداف للبوت (بدون اقتطاع)
 * ==================================================================== */
export function goalReport(state, horizon = "quarter") {
  const all = rows(state.goals);
  const habits = rows(state.habits);
  
  const active = all.filter((g) => !g.done && g.horizon === horizon);
  const hLabel = horizon === "quarter" ? "الربع الحالي (٩٠ يومًا)" : horizon === "year" ? "هذه السنة" : "٣ سنوات";
  
  if (!active.length) {
    return {
      text: `✅ ما فيه أهداف نشطة في أفق «${hLabel}».`,
      kb: null
    };
  }

  const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " ");
  
  let text = `<b>🎯 أهدافك في أفق «${hLabel}»:</b>\n\n`;

  active.forEach((g) => {
    const pct = goalPct(g, all, habits);
    const pace = goalPace(g, all);
    const paceIcon = pace.pace?.state === "ahead" ? "🚀" : pace.pace?.state === "behind" ? "⚠️" : "✅";
    const pLabel = `[${pillarOf(g.pillar).label}]`;
    
    // هنا نعرض النص كاملاً (تم إزالة دالة الاقتطاع)
    text += `${paceIcon} ${pLabel} <b>${escapeHtml(g.text)}</b>\n`;
    
    if (g.target > 0) {
      text += `📊 ${pct}% (${g.current || 0}/${g.target} ${escapeHtml(g.unit || "")})\n\n`;
    } else {
      text += `📊 ${pct}%\n\n`;
    }
  });
  
  const kb = {
    inline_keyboard: [
      [
        { text: "🎯 الربع الحالي", callback_data: "grp:quarter" },
        { text: "📅 السنة", callback_data: "grp:year" },
        { text: "🚀 ٣ سنوات", callback_data: "grp:h3" }
      ]
    ]
  };

  return { text, kb };
}