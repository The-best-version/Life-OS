/* --- the library, from a phone -----------------------------------------
 *  The shelf used to be the one desk the bot could only *count*: pages went
 *  onto whichever book was marked «أقرأه الآن» and nothing else about a book
 *  was reachable from a message. This suite holds the half that was added —
 *  naming the book in the sentence, the point the reading left behind, and
 *  the schedule that brings that point back.
 *
 *  Everything here is pure: the parser, the actions, the shapes and the
 *  reading the scheduled reminder builds. `views.js` is not imported, because
 *  it pulls grammY in for its keyboards and this suite has to run with
 *  nothing installed — the same line `tests/bot.test.mjs` draws.
 * --------------------------------------------------------------------- */
import test from "node:test";
import assert from "node:assert/strict";

import { parse, bookQuery, titleAuthor } from "../services/telegram-bot/parse.js";
import {
  findBooks,
  logReading,
  addBook,
  addAndRead,
  startBook,
  finishBook,
  rateBook,
  addNote,
  setLesson,
  reviewNote,
  dayAt,
  undo,
  BOOK_CAP,
} from "../services/telegram-bot/actions.js";
import { reviewCard, noteCue, answer, weekReview } from "../services/telegram-bot/ask.js";
import { advise } from "../services/telegram-bot/insight.js";
import { textFor, planToday } from "../services/telegram-bot/reminders.js";
import {
  freshState,
  migrate,
  dayKey,
  addDays,
  rows,
  uid,
  bookShape,
  noteShape,
  noteDue,
  dueNotes,
  reviewedNote,
  readPace,
  pagesLeft,
  activeBook,
  stalledDays,
  countNotes,
  notesSince,
  REVIEW_STEPS,
  NOTE_CAP,
  NOTE_MAX,
  SCHEMA,
  botShape,
} from "../src/state/life-state.mjs";

const today = dayKey();
const at = (hour) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
};

/* A shelf with two books that are easy to confuse and one that is not, so
   the matcher is tested against the mistake it exists to refuse. */
const shelf = () => [
  bookShape({ id: "b1", title: "سيكولوجية المال", author: "مورغان هاوسل", status: "reading", page: "80", pages: "250" }),
  bookShape({ id: "b2", title: "العمل العميق", status: "planned", pages: "300" }),
  bookShape({ id: "b3", title: "المال وقوانينه", status: "planned" }),
];

const withShelf = (extra = {}) => ({ ...freshState(), books: shelf(), reading: [], ...extra });

/* ====================================================================== *
 *  THE SENTENCE
 * ====================================================================== */

test("the book is read out of the sentence it was typed in", () => {
  const out = parse("قريت كتاب اليوم سكليوجية المال خلصت 10 صفحات");
  assert.equal(out.kind, "reading");
  assert.equal(out.pages, 10);
  /* The scaffolding goes — «كتاب», «اليوم», the repeated verb, the unit —
     and the title survives exactly as he typed it, typo included. */
  assert.equal(out.query, "سكليوجية المال");
});

test("«من» before the title is stripped, and only at the front", () => {
  assert.equal(parse("قرأت ١٠ صفحات من سيكولوجية المال").query, "سيكولوجية المال");
  /* A «من» inside a title is part of the title: a stripper that took every
     one of them would turn «من الصفر إلى المليون» into two stray words. */
  assert.equal(bookQuery("من الصفر الى المليون"), "الصفر الى المليون");
});

test("a reading with no book named is still a reading", () => {
  const out = parse("قرأت ٢٠ صفحة");
  assert.equal(out.kind, "reading");
  assert.equal(out.pages, 20);
  assert.equal(out.query, "");
});

test("«خلصت كتاب …» is the shelf and «خلصت …» is still a habit", () => {
  const book = parse("خلصت كتاب العمل العميق");
  assert.equal(book.kind, "book");
  assert.equal(book.act, "finish");
  assert.equal(book.query, "العمل العميق");
  /* The two-word trigger must win over the one-word habit verb, which is
     what `TRIGGERS` sorting longest-first buys. */
  const habit = parse("خلصت صلاة العصر");
  assert.equal(habit.kind, "habit");
});

test("a point, a lesson and an added book each have their own verb", () => {
  const note = parse("فائدة المال حرية لا رفاهية");
  assert.equal(note.kind, "note");
  assert.equal(note.body, "المال حرية لا رفاهية");

  assert.equal(parse("تعلمت أن الصبر عائد مركّب").kind, "note");
  assert.equal(parse("درس الكتاب لا تُقلّد أحدًا").kind, "lesson");

  const add = parse("أضف كتاب الأب الغني تأليف كيوساكي");
  assert.equal(add.kind, "book");
  assert.equal(add.act, "add");
  assert.equal(add.title, "الأب الغني");
  assert.equal(add.author, "كيوساكي");
});

test("an author is only split on a separator that was actually typed", () => {
  /* «لمورغان» is one letter away from a title's own word, so a splitter that
     guessed would be wrong about as often as it was right. */
  assert.equal(titleAuthor("سيكولوجية المال لمورغان هاوسل").author, "");
  assert.equal(titleAuthor("سيكولوجية المال - مورغان").author, "مورغان");
});

test("«فائدة» on its own is not a point", () => {
  /* Nothing to store, so it falls through to the inbox like any other
     thought rather than writing an empty row. */
  assert.equal(parse("فائدة").kind, "task");
});

test("a point can be backdated like an expense", () => {
  const out = parse("أمس فائدة الوقت أغلى من المال");
  assert.equal(out.kind, "note");
  assert.equal(out.back, 1);
});

/* ====================================================================== *
 *  WHICH BOOK
 * ====================================================================== */

test("a mistyped title still finds its book", () => {
  const found = findBooks(shelf(), "سكليوجية المال");
  assert.equal(found.length, 1);
  assert.equal(found[0].id, "b1");
});

test("two books that fit equally well are a question, not a guess", () => {
  /* «المال» is a whole word in both titles, so neither wins — and a page
      count landing on the wrong book is the one number nobody re-checks. */
  const found = findBooks(shelf(), "المال");
  assert.equal(found.length, 2);
});

test("a title nobody added finds nothing", () => {
  assert.deepEqual(findBooks(shelf(), "الجذور"), []);
  assert.deepEqual(findBooks(shelf(), ""), []);
});

/* ====================================================================== *
 *  THE PAGES
 * ====================================================================== */

test("pages land on the named book and move it to the head of the shelf", () => {
  const s = withShelf();
  const out = logReading(s, { pages: 10, bookId: "b2" });
  assert.equal(out.kind, "reading");
  assert.equal(out.book.id, "b2");
  assert.equal(out.at, 10);
  /* Pages on a book he had only planned mean he started it — and the book
     he last read into is the one «فائدة …» will land on, which is why it
     moves to the front. */
  assert.equal(out.started, true);
  assert.equal(out.book.status, "reading");
  assert.equal(out.next.books[0].id, "b2");
  assert.equal(activeBook(out.next.books).id, "b2");
});

test("a page counter never passes the book's own last page", () => {
  const s = withShelf();
  const out = logReading(s, { pages: 500, bookId: "b1" });
  assert.equal(out.at, 250);
});

test("an undo of a reading puts back both lists as they stood", () => {
  const s = withShelf();
  const out = logReading(s, { pages: 10, bookId: "b2" });
  const back = undo(out.next, out.before);
  assert.deepEqual(back.next.books, s.books);
  assert.deepEqual(back.next.reading, s.reading);
});

test("a shelf with nothing marked as being read refuses rather than guesses", () => {
  const s = withShelf({ books: shelf().map((b) => ({ ...b, status: "planned" })) });
  const out = logReading(s, { pages: 10 });
  assert.ok(out.refused);
});

test("a title that is not on the shelf is added and read in one write", () => {
  const s = withShelf();
  const out = addAndRead(s, { title: "الجذور", pages: 12 });
  assert.equal(out.kind, "reading");
  assert.equal(out.added.title, "الجذور");
  assert.equal(out.at, 12);
  assert.equal(out.book.status, "reading");
  /* One `before` covering both arrays: an undo that took the pages back and
     left a book nobody chose on the shelf would be half an undo. */
  const back = undo(out.next, out.before);
  assert.deepEqual(back.next.books, s.books);
  assert.deepEqual(back.next.reading, s.reading);
});

test("adding a book that is already on the shelf hands back the row it has", () => {
  const out = addBook(withShelf(), { title: "العمل العميق" });
  assert.equal(out.act, "already");
  assert.equal(out.book.id, "b2");
  assert.equal(out.next, undefined); // nothing written
});

test("the shelf has a ceiling, because a phone can feed it", () => {
  const many = Array.from({ length: BOOK_CAP }, (_, i) =>
    bookShape({ id: `x${i}`, title: `كتاب ${i}` }),
  );
  const out = addBook({ ...freshState(), books: many }, { title: "واحد زيادة" });
  assert.ok(out.refused);
});

test("the pace says how many days are left, and says nothing without a total", () => {
  const log = [
    { id: uid(), date: today, bookId: "b1", pages: 10 },
    { id: uid(), date: addDays(today, -1), bookId: "b1", pages: 10 },
  ];
  const pace = readPace(shelf()[0], log, today);
  assert.equal(pace.pages, 20);
  assert.equal(pagesLeft(shelf()[0]), 170);
  /* Twenty pages over a fortnight is 1.43 a day, so 170 left is 119 days —
     and the floor of the promise is that it is honest rather than kind. */
  assert.equal(pace.days, Math.ceil(170 / (20 / 14)));
  /* No total is no promise. */
  assert.equal(readPace(shelf()[2], log, today).days, null);
});

/* ====================================================================== *
 *  THE POINT
 * ====================================================================== */

test("a point lands on the active book with the page it was read at", () => {
  const s = withShelf();
  const out = addNote(s, { body: "المال حرية لا رفاهية" });
  assert.equal(out.kind, "note");
  assert.equal(out.book.id, "b1");
  assert.equal(out.note.page, "80");
  assert.equal(out.note.at, today);
  /* Tomorrow, never an empty `due`: an empty one means «waiting», and a
     point written tonight has nothing to recall yet. */
  assert.equal(out.note.due, addDays(today, 1));
  assert.equal(out.note.box, 0);
});

test("a point is bounded but never silently emptied", () => {
  const long = "ب".repeat(NOTE_MAX + 50);
  const out = addNote(withShelf(), { body: long });
  assert.equal(out.note.text.length, NOTE_MAX);
});

test("a book that is full of points says so", () => {
  const full = shelf().map((b) =>
    b.id === "b1"
      ? { ...b, notes: Array.from({ length: NOTE_CAP }, (_, i) => noteShape({ text: `ن${i}` })) }
      : b,
  );
  const out = addNote({ ...freshState(), books: full }, { body: "واحدة زيادة" });
  assert.ok(out.refused);
});

test("the lesson is one field and the previous one rides out on the undo", () => {
  const s = withShelf();
  const first = setLesson(s, { body: "الأول" });
  const second = setLesson(first.next, { body: "الثاني" });
  assert.equal(second.book.lesson, "الثاني");
  assert.equal(second.was, "الأول");
  assert.deepEqual(undo(second.next, second.before).next.books, first.next.books);
});

test("the day's reading figures are read once, for both briefs", () => {
  const s = withShelf();
  const read = logReading(s, { pages: 10, bookId: "b1" });
  const noted = addNote(read.next, { body: "نقطة" });
  const day = dayAt(noted.next);
  assert.equal(day.readToday, 10);
  assert.equal(day.notesToday, 1);
  assert.equal(day.book.id, "b1");
});

test("a point written today stops the evening from asking for one", () => {
  const s = withShelf();
  const first = logReading(s, { pages: 10, bookId: "b1" });
  assert.equal(first.kept, 0);
  const noted = addNote(first.next, { body: "نقطة" });
  const again = logReading(noted.next, { pages: 5, bookId: "b1" });
  assert.equal(again.kept, 1);
});

/* ====================================================================== *
 *  THE SCHEDULE A POINT CARRIES
 * ====================================================================== */

test("a point written before the rotation existed is read as waiting", () => {
  /* The shape is the migration — the same arrangement the reminders'
     `repeat` arrived under. An old note has `{id, text, page}` and nothing
     else, and the honest reading of a point nobody has reviewed is that it
     is due. */
  const old = noteShape({ id: "n1", text: "قديمة", page: "12" });
  assert.equal(old.due, "");
  assert.equal(old.box, 0);
  assert.equal(noteDue(old, today), true);
});

test("remembered widens the gap; forgotten goes back to tomorrow", () => {
  const n = noteShape({ text: "نقطة" });
  const first = reviewedNote(n, true, today);
  assert.equal(first.box, 1);
  assert.equal(first.due, addDays(today, REVIEW_STEPS[0]));

  const second = reviewedNote(first, true, today);
  assert.equal(second.box, 2);
  assert.equal(second.due, addDays(today, REVIEW_STEPS[1]));

  const forgot = reviewedNote(second, false, today);
  assert.equal(forgot.box, 0);
  assert.equal(forgot.due, addDays(today, 1));
  /* Never back to an empty `due`: a forgotten point and a point nobody has
     ever seen must not read the same. */
  assert.notEqual(forgot.due, "");
});

test("the ladder tops out instead of running off the end of the steps", () => {
  let n = noteShape({ text: "نقطة" });
  for (let i = 0; i < REVIEW_STEPS.length + 3; i += 1) n = reviewedNote(n, true, today);
  assert.equal(n.box, REVIEW_STEPS.length);
  assert.equal(n.due, addDays(today, REVIEW_STEPS[REVIEW_STEPS.length - 1]));
});

test("what is due comes back oldest first, and a point with no text never does", () => {
  const books = [
    bookShape({
      id: "b1",
      title: "كتاب",
      notes: [
        noteShape({ id: "n1", text: "اليوم", due: today }),
        noteShape({ id: "n2", text: "قديمة", due: addDays(today, -5) }),
        noteShape({ id: "n3", text: "بعيدة", due: addDays(today, 9) }),
        noteShape({ id: "n4", text: "", due: today }),
      ],
    }),
  ];
  const due = dueNotes(books, today);
  assert.deepEqual(due.map((r) => r.note.id), ["n2", "n1"]);
});

test("reviewing one says what is left after it, read off the new shelf", () => {
  const books = [
    bookShape({
      id: "b1",
      title: "كتاب",
      notes: [
        noteShape({ id: "n1", text: "واحدة", due: today }),
        noteShape({ id: "n2", text: "ثانية", due: today }),
      ],
    }),
  ];
  const s = { ...freshState(), books };
  const out = reviewNote(s, "b1", "n1", true, today);
  assert.equal(out.kept, true);
  assert.equal(out.note.box, 1);
  assert.equal(out.left, 1);
  assert.equal(out.total, 2);
  /* And the schedule is undoable like every other write here. */
  assert.deepEqual(undo(out.next, out.before).next.books, books);
});

test("a review of a point that is gone is refused rather than written", () => {
  const s = { ...freshState(), books: shelf() };
  assert.ok(reviewNote(s, "b1", "nope", true).refused);
  assert.ok(reviewNote(s, "nope", "n1", true).refused);
});

test("the cue hides the point only when there is enough of it to hide", () => {
  const short = noteCue("المال حرية");
  assert.equal(short.hidden, false);
  const long = noteCue("المال الحقيقي هو القدرة على التحكّم في وقتك وفي من تقابله ومتى");
  assert.equal(long.hidden, true);
  assert.ok(long.cue.endsWith("…"));
  /* The cue is the opening of the point, so there is something to recall
     *from* — a card with no cue is a question about nothing. */
  assert.ok("المال الحقيقي هو القدرة".startsWith(long.cue.slice(0, 10)));
});

test("the card names the book and the page and never leaks the whole point", () => {
  const note = noteShape({
    id: "n1",
    text: "المال الحقيقي هو القدرة على التحكّم في وقتك وفي من تقابله ومتى",
    page: "84",
    at: addDays(today, -21),
  });
  const card = reviewCard(bookShape({ id: "b1", title: "سيكولوجية المال" }), note, 2, today);
  assert.ok(card.includes("سيكولوجية المال"));
  assert.ok(card.includes("٨٤"));
  assert.ok(!card.includes("ومتى"));
});

/* ====================================================================== *
 *  WHAT THE BOT SENDS UNPROMPTED
 * ====================================================================== */

test("the review reminder is armed when it is on and silent when nothing is due", () => {
  const bot = { review: { on: true, at: "21:30" }, morningOn: false, eveningOn: false };
  const plan = planToday({ ...freshState(), bot }, at(9));
  assert.equal(plan.filter((p) => p.kind === "review").length, 1);
  /* Armed unconditionally, like the coach: whether a point is due tonight is
     a question about the evening, and the plan is built in the morning. */
  const quiet = textFor({ kind: "review" }, { ...freshState(), books: shelf() }, at(21));
  assert.equal(quiet, null);
});

test("the review reminder sends one point and counts the rest", () => {
  const books = [
    bookShape({
      id: "b1",
      title: "سيكولوجية المال",
      notes: [
        noteShape({ id: "n1", text: "الأولى", due: addDays(today, -1) }),
        noteShape({ id: "n2", text: "الثانية", due: today }),
      ],
    }),
  ];
  const said = textFor({ kind: "review" }, { ...freshState(), books }, at(21));
  assert.ok(said);
  assert.equal(said.review.bookId, "b1");
  assert.equal(said.review.noteId, "n1");
  assert.equal(said.review.text, "الأولى");
  assert.ok(said.text.includes("سيكولوجية المال"));
});

test("the schedule's default is off, like every other periodic reminder", () => {
  /* What the bot may interrupt him for is never a question a migration
     answers — so an older payload arrives with this one quiet. */
  assert.equal(botShape({}).review.on, false);
  assert.equal(botShape({}).review.at, "21:30");
});

/* ====================================================================== *
 *  WHAT IT SAYS WHEN ASKED
 * ====================================================================== */

test("«كم فائدة؟» is answered out of the shelf and never filed as a task", () => {
  const said = parse("كم فائدة كتبتها من الكتاب؟");
  assert.equal(said.kind, "ask");
  assert.equal(said.topic, "notes");
  const books = [
    bookShape({ id: "b1", title: "كتاب", status: "reading", notes: [noteShape({ text: "نقطة", due: today })] }),
  ];
  const out = answer({ ...freshState(), books }, said);
  assert.ok(out.includes("نقطة"));
});

test("«وين وصلت في الكتاب؟» carries the pace and what is waiting", () => {
  const s = withShelf();
  const read = logReading(s, { pages: 10, bookId: "b1" });
  const noted = addNote(read.next, { body: "نقطة" });
  const out = answer(noted.next, { topic: "read" });
  assert.ok(out.includes("سيكولوجية المال"));
  assert.ok(out.includes("باقي"));
});

test("the weekly review reports the points, not only the pages", () => {
  const s = withShelf();
  const read = logReading(s, { pages: 30, bookId: "b1" });
  const noted = addNote(read.next, { body: "نقطة الأسبوع" });
  const out = weekReview(noted.next, at(20));
  assert.ok(out.includes("القراءة"));
  assert.ok(/فائدة|فوائد/.test(out));
  assert.equal(notesSince(noted.next.books, addDays(today, -6)), 1);
  assert.equal(countNotes(noted.next.books), 1);
});

test("a book that stopped moving is named, and only after it really stopped", () => {
  const s = withShelf({
    reading: [{ id: uid(), date: addDays(today, -12), bookId: "b1", pages: 10 }],
  });
  assert.equal(stalledDays(s.reading, "b1", today), 12);
  const out = advise(s, at(21));
  assert.ok(out.some((o) => o.id === "stalled"));
  /* And a book read today is not stalled, whatever last fortnight looked
     like. */
  const fresh = logReading(s, { pages: 5, bookId: "b1" });
  assert.ok(!advise(fresh.next, at(21)).some((o) => o.id === "stalled"));
});

test("a pile of waiting points is an evening observation, never a morning one", () => {
  const books = [
    bookShape({
      id: "b1",
      title: "كتاب",
      status: "reading",
      notes: ["a", "b", "c", "d"].map((t) => noteShape({ text: t, due: addDays(today, -1) })),
    }),
  ];
  const s = { ...freshState(), books };
  assert.ok(advise(s, at(21)).some((o) => o.id === "review"));
  assert.ok(!advise(s, at(11)).some((o) => o.id === "review"));
});

/* ====================================================================== *
 *  THE SHELF'S OWN STATUS
 * ====================================================================== */

test("finishing stamps the date once and refuses the second time", () => {
  const s = withShelf();
  const out = finishBook(s, "b1", today);
  assert.equal(out.book.status, "finished");
  assert.equal(out.book.finishedAt, today);
  assert.ok(finishBook(out.next, "b1", today).refused);
});

test("finishing reports what the log actually holds, and asks for the lesson", () => {
  const s = withShelf({
    reading: [
      { id: uid(), date: today, bookId: "b1", pages: 10 },
      { id: uid(), date: addDays(today, -1), bookId: "b1", pages: 20 },
    ],
  });
  const out = finishBook(s, "b1", today);
  assert.equal(out.pages, 30);
  assert.equal(out.days, 2);
  assert.equal(out.hasLesson, false);
});

test("starting a book makes it the active one", () => {
  const s = withShelf();
  const out = startBook(s, "b2");
  assert.equal(activeBook(out.next.books).id, "b2");
  assert.equal(out.book.status, "reading");
});

test("the stars are bounded and clearable", () => {
  const s = withShelf();
  assert.equal(rateBook(s, "b1", 5).book.rating, 5);
  assert.equal(rateBook(s, "b1", 9).book.rating, 5);
  assert.equal(rateBook(s, "b1", 0).book.rating, 0);
});

/* ====================================================================== *
 *  THE MIGRATION
 * ====================================================================== */

test("an older payload's points enter the rotation without a branch", () => {
  const before = {
    schema: 29,
    date: today,
    books: [
      {
        id: "b1",
        title: "كتاب قديم",
        status: "reading",
        notes: [{ id: "n1", text: "نقطة قديمة", page: "12" }],
      },
    ],
  };
  const after = migrate(before);
  assert.equal(after.schema, SCHEMA);
  const note = after.books[0].notes[0];
  assert.equal(note.text, "نقطة قديمة");
  assert.equal(note.page, "12");
  assert.equal(note.box, 0);
  /* No date invented for a point whose day is not recoverable, and due now
     because nobody has reviewed it. */
  assert.equal(note.at, "");
  assert.equal(noteDue(note, today), true);
  assert.equal(dueNotes(after.books, today).length, 1);
});

test("a damaged notes array is cleaned rather than carried", () => {
  const book = bookShape({ title: "كتاب", notes: [null, 7, "نص", { text: "صحيحة" }] });
  assert.equal(book.notes.length, 1);
  assert.equal(book.notes[0].text, "صحيحة");
  assert.ok(book.notes[0].id);
});
