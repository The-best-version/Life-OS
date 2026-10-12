/* --- the bot's second half, held -----------------------------------------
 *  `tests/bot.test.mjs` holds the parser and the first five actions — the
 *  seam between a sentence and a row. This file holds everything that came
 *  after: the advice engine, the questions, the weekly review, and the four
 *  desks the bot can now reach (the library, the focus desk, the breaker,
 *  the evening prep).
 *
 *  Same rules as the suite beside it. Every module under test is pure — no
 *  grammY, no fetch, no disk — which is what lets this run under the same
 *  `node --test tests/` the build gates on, with nothing installed. The one
 *  thing deliberately absent is the seam to the sync server, because testing
 *  it without a server would mean testing a mock of one; `tests/server.test.mjs`
 *  holds the revision guard from the other side.
 * --------------------------------------------------------------------- */
import test from "node:test";
import assert from "node:assert/strict";

import { parse, askedAbout } from "../services/telegram-bot/parse.js";
import {
  addExpense,
  tickHabit,
  logReading,
  startFocus,
  stopFocus,
  pauseFocus,
  resumeFocus,
  settleFocus,
  breakFocus,
  logFocus,
  holdUrge,
  fallUrge,
  oneBad,
  pickTomorrow,
  flagToday,
  reflect,
} from "../services/telegram-bot/actions.js";
import { advise, coachNote, coachReply } from "../services/telegram-bot/insight.js";
import { answer, weekReview } from "../services/telegram-bot/ask.js";
import { Bell, planToday, textFor } from "../services/telegram-bot/reminders.js";
import {
  freshState,
  dayKey,
  addDays,
  uid,
  rows,
  runLeft,
  isBreak,
  botShape,
  TOP_TASK_CAP,
  tomorrowKey,
  COACH_MAX,
} from "../src/state/life-state.mjs";

/* A clock at a named hour today, so no test depends on when it is run — the
   advice engine is full of «only in the evening» rules and a suite that
   passes at noon and fails at nine is a suite nobody trusts. */
const at = (hour) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
};

/* --- a question is answered, never filed -------------------------------- */

test("a question is answered, never filed as a task", () => {
  /* The bug this exists to prevent: «كم صرفت هذا الشهر؟» was landing in
     «مهم غير عاجل» as a to-do item, which is a wrong answer *and* a row he
     then has to go and delete. */
  const q = parse("كم صرفت هذا الشهر؟");
  assert.equal(q.kind, "ask");
  assert.equal(q.topic, "spend");
  assert.equal(q.days, 30);
});

test("a question is one that opens with a question word or ends in a mark", () => {
  /* And nothing else — however many subject words it happens to contain.
     «صرفت ٣٥ غداء» names money twice over and is still an expense. */
  assert.equal(parse("صرفت ٣٥ غداء").kind, "expense");
  assert.equal(askedAbout("صرفت ٣٥ غداء"), null);
  assert.equal(askedAbout("وين وصلت في الكتاب").topic, "read");
  assert.equal(askedAbout("الكتاب؟").topic, "read");
});

test("the window is read apart from the subject", () => {
  assert.equal(parse("كم صرفت اليوم؟").days, 1);
  assert.equal(parse("كم دخلي هذا الأسبوع؟").days, 7);
  /* Typed as a bare count, which is how it actually gets asked. */
  assert.equal(parse("كم صرفت آخر ١٠ أيام؟").days, 10);
  /* No window said at all: the answer picks its own default rather than a
     number being invented here. */
  assert.equal(parse("كم رصيدي؟").days, null);
});

test("a question with no subject is not answered with a guess", () => {
  const q = parse("ليش؟");
  assert.equal(q.kind, "ask");
  assert.equal(q.topic, null);
  assert.equal(answer(freshState(), q), null);
});

test("every topic answers with a sentence and writes nothing", () => {
  const s = freshState();
  const before = JSON.stringify(s);
  for (const topic of [
    "spend", "earn", "money", "discipline", "month", "read", "focus",
    "prayer", "tasks", "habits", "water", "uni", "goals", "breaker",
  ]) {
    const out = answer(s, { topic });
    assert.equal(typeof out, "string", topic);
    assert.ok(out.length > 4, topic);
  }
  assert.equal(JSON.stringify(s), before, "an answer must not touch the state");
});

test("an answer reads the state layer's own figures", () => {
  let s = freshState();
  s = addExpense(s, { label: "غداء", amount: 35 }).next;
  s = addExpense(s, { label: "بنزين", amount: 120 }).next;
  const out = answer(s, { topic: "spend", days: 7 });
  /* The total, and the biggest rows under it — «على إيش؟» is the next
     question every single time. */
  assert.ok(out.includes("١٥٥"));
  assert.ok(out.includes("بنزين"));
});

/* --- the library, from a phone ----------------------------------------- */

test("pages logged from a message move the book the app would have moved", () => {
  const s = freshState();
  const live = s.books.find((b) => b.status === "reading");
  const out = logReading(s, { pages: 20 });
  assert.equal(out.kind, "reading");
  assert.equal(out.next.reading.length, 1);
  assert.equal(out.next.reading[0].pages, 20);
  assert.equal(out.next.books.find((b) => b.id === live.id).page, "20");
  /* The whole arrays come back, never the rows. */
  assert.ok("reading" in out.before && "books" in out.before);
});

test("the page counter never passes the book's own total", () => {
  let s = freshState();
  const id = s.books.find((b) => b.status === "reading").id;
  s = {
    ...s,
    books: s.books.map((b) => (b.id === id ? { ...b, pages: "300", page: "290" } : b)),
  };
  const out = logReading(s, { pages: 50 });
  /* A counter past the last page is a book that reads as finished and is
     not. */
  assert.equal(out.at, 300);
  assert.equal(out.next.books.find((b) => b.id === id).page, "300");
});

test("pages with no book on the shelf are refused, not invented", () => {
  assert.ok(logReading({ ...freshState(), books: [] }, { pages: 10 }).refused);
  assert.ok(logReading(freshState(), { pages: 0 }).refused);
});

test("a reading habit hands its book back with the tick", () => {
  /* The prompt is opened by the reply, after the tick has landed: the habit
     must stay done whether or not a number follows it. */
  const s = freshState();
  const linked = s.habits.find((h) => h.book);
  assert.ok(linked, "the seeded قراءة habit ships linked to the active book");
  const out = tickHabit(s, linked.id);
  assert.ok(out.book && out.book.title);
  assert.equal(out.next.habits.find((h) => h.id === linked.id).done, true);
  /* An ordinary habit hands back nothing to ask about. */
  assert.equal(tickHabit(s, s.habits.find((h) => !h.book).id).book, null);
});

/* --- the focus desk, from a phone -------------------------------------- */

test("a round started from a message is a round the screen would recognise", () => {
  const out = startFocus(freshState(), { minutes: 50, label: "مراجعة" });
  assert.equal(out.kind, "focus-start");
  assert.equal(out.run.planned, 50);
  assert.equal(out.run.label, "مراجعة");
  /* Counted off an absolute deadline, which is the whole reason either side
     can end it. */
  assert.ok(out.run.endAt > Date.now());
});

test("a second round is refused while the first is counting", () => {
  const s = startFocus(freshState(), { minutes: 25 }).next;
  const again = startFocus(s, {});
  assert.ok(again.refused);
  assert.ok(again.refused.includes("أوقف"));
});

test("a round stopped short is logged as what it was, not dropped", () => {
  const t0 = Date.now() - 12 * 60 * 1000;
  const s = startFocus(freshState(), { minutes: 50 }, t0).next;
  const out = stopFocus(s, t0 + 12 * 60 * 1000);
  assert.equal(out.minutes, 12);
  assert.equal(out.next.sessions.length, 1);
  /* Marked for what it is: the old timer wrote nothing unless the round
     finished, so eighty minutes of a ninety-minute round never existed. */
  assert.equal(out.next.sessions[0].minutes, 12);
  assert.equal(out.next.sessions[0].full, false);
  /* And a round cut short does not advance the cycle — the long break is
     earned by rounds that were actually sat through. */
  assert.equal(out.next.focus.round, 0);
});

test("a pause keeps the minutes exactly, because it is the one moment they are known", () => {
  const t0 = Date.now();
  const s = startFocus(freshState(), { minutes: 25 }, t0).next;
  const paused = pauseFocus(s, t0 + 10 * 60 * 1000);
  assert.equal(paused.spent, 10);
  assert.equal(paused.run.endAt, null);
  /* Resumed an hour later it hands the remainder back and nothing else: a
     pause of any length costs nothing. */
  const back = resumeFocus(paused.next, t0 + 60 * 60 * 1000);
  assert.equal(Math.round(runLeft(back.run, t0 + 60 * 60 * 1000) / 60), 15);
});

test("a round found finished writes its row and arms the break", () => {
  const t0 = Date.now() - 30 * 60 * 1000;
  const s = startFocus(freshState(), { minutes: 25 }, t0).next;
  /* Thirty minutes later the bell has rung and nobody was there. */
  const out = settleFocus(s, t0 + 30 * 60 * 1000);
  assert.equal(out.minutes, 25);
  assert.equal(out.next.sessions.length, 1);
  assert.equal(out.next.sessions[0].full, true);
  /* The counter advanced and the break is armed, exactly as it would have
     been on screen — one function decides that for both writers. */
  assert.equal(out.next.focus.round, 1);
  assert.ok(isBreak(out.next.focus.run.phase));
});

test("a break never writes a session row", () => {
  /* `state.sessions` has meant «جلسة تركيز» since the day it existed — in
     the data-health panel, in the recovery centre's counts and in every
     total on the desk. */
  const t0 = Date.now();
  const s = breakFocus(freshState(), { minutes: 5 }, t0).next;
  assert.ok(isBreak(s.focus.run.phase));
  const out = stopFocus(s, t0 + 4 * 60 * 1000);
  assert.deepEqual(rows(out.next.sessions), []);
});

test("a round worked away from any screen is logged as full", () => {
  const out = logFocus(freshState(), { minutes: 45, label: "محاسبة" });
  assert.equal(out.row.minutes, 45);
  assert.equal(out.row.full, true, "there was no plan to have fallen short of");
  assert.ok(logFocus(freshState(), { minutes: 0 }).refused);
});

test("the bell arms off the deadline and re-arms only when it moves", () => {
  const t0 = Date.now();
  const bell = new Bell(() => {});
  const s = startFocus(freshState(), { minutes: 25 }, t0).next;
  assert.equal(bell.sync(s, t0), true);
  assert.equal(bell.at, s.focus.run.endAt);
  /* The same run on the next tick arms nothing: the run moves far more often
     than the day's plan does, and re-arming every minute is a timer rebuilt
     sixty times an hour for nothing. */
  assert.equal(bell.sync(s, t0 + 1000), false);
  /* A pause has no deadline to ring at, and that is correct — a pause is a
     round nobody is waiting on. */
  const paused = pauseFocus(s, t0 + 60000).next;
  assert.equal(bell.sync(paused, t0 + 60000), true);
  assert.equal(bell.at, null);
  bell.clear();
});

test("the bell respects the master switch", () => {
  const t0 = Date.now();
  const bell = new Bell(() => {});
  const started = startFocus(freshState(), { minutes: 25 }, t0).next;
  bell.sync({ ...started, bot: botShape({ on: false }) }, t0);
  assert.equal(bell.at, null, "off is mute for everything unprompted");
  bell.clear();
});

/* --- the breaker ------------------------------------------------------- */

const withBad = (part) => ({
  ...freshState(),
  badHabits: [
    {
      id: "b1",
      title: "السهر بعد منتصف الليل",
      startDate: addDays(dayKey(), -9),
      replacement: "أغلق الجوّال ٢٣:٠٠",
      ...part,
    },
  ],
});

test("a hold never touches the counter, because surviving is the run continuing", () => {
  const s = withBad({});
  const out = holdUrge(s, "b1", { tag: "bored" });
  assert.equal(out.next.badHabits[0].urges.length, 1);
  assert.equal(out.next.badHabits[0].startDate, s.badHabits[0].startDate);
  assert.equal(out.days, 9);
  /* It rides today's archive row, like everything else written per-day. */
  assert.ok(out.next.history.find((h) => h.date === dayKey()).holds >= 1);
});

test("a fall stamps the run that ended and starts the counter today", () => {
  const out = fallUrge(withBad({}), "b1", { tag: "stress" });
  assert.equal(out.was, 9);
  assert.equal(
    out.next.badHabits[0].logs[0].days,
    9,
    "the record outlives the counter it cost",
  );
  assert.equal(out.next.badHabits[0].startDate, dayKey());
  assert.ok(out.next.history.find((h) => h.date === dayKey()).falls >= 1);
});

test("which habit a word means, and when to ask instead of guess", () => {
  const two = {
    ...freshState(),
    badHabits: [
      { id: "b1", title: "السهر", startDate: dayKey() },
      { id: "b2", title: "السكر", startDate: dayKey() },
    ],
  };
  assert.equal(oneBad(two, "السهر").bad.id, "b1");
  /* Nothing typed and two on the list: asking beats resetting the wrong
     counter. */
  assert.equal(oneBad(two, "").many.length, 2);
  /* One on the list: no question worth asking. */
  assert.equal(oneBad(withBad({}), "").bad.id, "b1");
  assert.ok(oneBad(freshState(), "أي شي").refused);
});

/* --- tomorrow, and the reflection -------------------------------------- */

test("the prep's cap is the state layer's, not the bot's", () => {
  let s = freshState();
  const open = s.tasks.filter((t) => !t.done).slice(0, TOP_TASK_CAP + 1);
  for (const t of open.slice(0, TOP_TASK_CAP)) {
    const out = pickTomorrow(s, t.id);
    assert.equal(out.kind, "prep");
    s = out.next;
  }
  const fourth = pickTomorrow(s, open[TOP_TASK_CAP].id);
  assert.ok(fourth.refused, "the fourth pick is refused and told why");
  assert.ok(fourth.refused.includes("مقصود"));
  /* Picked for tomorrow and stamped with it, which is what makes a prep safe
     to carry: it is only ever promoted onto the day it names. */
  assert.equal(s.prep.for, tomorrowKey());
});

test("the matrix's own task can be promoted to today, under the same cap", () => {
  let s = freshState();
  let flagged = 0;
  for (const t of s.tasks.filter((x) => !x.today && !x.done)) {
    const out = flagToday(s, t.id);
    if (out.refused) break;
    s = out.next;
    flagged += 1;
  }
  assert.ok(flagged >= 1);
  assert.equal(s.tasks.filter((t) => t.today && !t.done).length, TOP_TASK_CAP);
  /* Already flagged is its own refusal, and it says which. */
  assert.ok(flagToday(s, s.tasks.find((t) => t.today).id).refused.includes("أصلاً"));
});

test("the reflection is merged onto today's row and survives a later tick", () => {
  let s = freshState();
  s = reflect(s, { field: "distraction", note: "الجوال" }).next;
  s = reflect(s, { field: "fix", note: "أتركه في الدرج" }).next;
  const row = () => s.history.find((h) => h.date === dayKey());
  assert.equal(row().distraction, "الجوال");
  assert.equal(row().fix, "أتركه في الدرج");
  /* `stampToday` spreads the previous entry precisely so this survives — a
     habit toggle erasing the evening's reflection is the bug that rule
     exists for. */
  s = tickHabit(s, s.habits[0].id).next;
  assert.equal(row().distraction, "الجوال");
  assert.ok(row().done.length >= 1);
  assert.ok(reflect(s, { field: "distraction", note: "  " }).refused);
});

/* --- the coach --------------------------------------------------------- */

/* A day with nothing wrong with it. Built rather than asserted into
   existence, because that is the day the whole design rests on: if `advise`
   cannot come back empty, the coach is a daily notification. */
const perfectDay = () => {
  let s = freshState();
  for (const h of s.habits) s = tickHabit(s, h.id).next;
  s = {
    ...s,
    water: 8,
    waterGoal: 8,
    tasks: s.tasks.map((t) => ({ ...t, done: true })),
  };
  s = logReading(s, { pages: 30 }).next;
  s = logFocus(s, { minutes: 180 }).next;
  return s;
};

test("a day with nothing wrong sends nothing", () => {
  const s = perfectDay();
  assert.deepEqual(advise(s, at(12)), []);
  assert.equal(coachNote(s, at(12)), null);
  /* Asked for by hand it still answers: a button pressed that replies with
     silence reads as a dead bot. */
  assert.ok(coachReply(s, at(12)).text.length > 4);
});

test("the coach's timer can fire and send nothing", () => {
  /* `planDay` arms it unconditionally — whether there is anything to say is
     a question about the day at the moment it fires, and the plan was built
     hours earlier. */
  const s = perfectDay();
  assert.equal(textFor({ kind: "coach" }, s, at(12)), null);
  /* The weekly always has something to report: it is a summary, not a
     judgement. */
  assert.ok(textFor({ kind: "weekly" }, s, at(20)).text.includes("مراجعة الأسبوع"));
});

test("two days away silences every other observation", () => {
  /* Somebody opening this after a week away is opening it for a verdict, and
     «انتظامك ٠٪» is the verdict that closes the app for a month. */
  const s = {
    ...freshState(),
    history: [
      { date: addDays(dayKey(), -30), pct: 90, done: [], all: [] },
      ...[6, 5, 4, 3, 2, 1].map((i) => ({ date: addDays(dayKey(), -i), gap: true })),
    ],
  };
  const out = advise(s, at(21));
  assert.equal(out.length, 1, "nothing else may speak first");
  assert.equal(out[0].id, "comeback");
  /* And it offers the smallest surface there is, not a report. */
  assert.ok(out[0].actions.length <= 2);
  assert.ok(out[0].actions.every((a) => a.data.startsWith("tick:")));
});

test("the coach never speaks about a streak at noon", () => {
  /* At noon there is most of a day left and nothing has gone wrong yet. */
  assert.ok(!advise(freshState(), at(12)).some((a) => a.id === "streak"));
});

test("a streak at risk offers the floor beside the whole thing", () => {
  let s = freshState();
  const core = s.habits.slice(0, 5).map((h) => h.id);
  s = {
    ...s,
    /* Four days over the target: a run there is something to lose. */
    history: [4, 3, 2, 1].map((i) => ({
      date: addDays(dayKey(), -i),
      pct: 95,
      done: ["x"],
      all: ["x"],
    })),
    habits: s.habits.map((h) =>
      core.includes(h.id)
        ? { ...h, core: true, min: h.id === core[0] ? "عشر دقائق" : "" }
        : h,
    ),
  };
  const hit = advise(s, at(21)).find((a) => a.id === "streak");
  assert.ok(hit, "an evening under the target with a run to lose");
  assert.ok(hit.text.includes("٤"));
  /* The floor is a button and not a sentence: the whole value of it is being
     visible at the moment skipping looks reasonable. */
  assert.ok(hit.actions.some((a) => a.data === `tick:${core[0]}`));
  assert.ok(hit.actions.some((a) => a.data === `tiny:${core[0]}`));
});

test("the danger hour speaks inside the band and nowhere else", () => {
  /* `dangerWatch` refuses to claim a band off a coincidence; this holds the
     other half — that the warning arrives before the hour rather than on a
     screen he visits afterwards. */
  const ev = (hour, kind) => ({
    id: uid(), at: dayKey(), kind, hour, dow: 2, tag: "bored", days: 3,
  });
  const s = withBad({
    startDate: addDays(dayKey(), -4),
    logs: [ev(23, "fall"), ev(23, "fall"), ev(1, "fall")],
    urges: [ev(23, "hold"), ev(22, "hold")],
  });
  const hit = advise(s, at(23)).find((a) => a.id === "danger");
  assert.ok(hit, "inside the band it has something to say");
  assert.ok(hit.text.includes("أغلق الجوّال"), "his own plan, read back to him");
  assert.ok(hit.actions.some((a) => a.data === "hold:b1"));
  /* Nine in the morning is a different band entirely. */
  assert.ok(!advise(s, at(9)).some((a) => a.id === "danger"));
});

test("a stale round is offered to be settled or dropped, never claimed", () => {
  /* A round left counting a day ago: nobody can say when he got up from it,
     so the minutes are not claimed — they are offered, named, and refused by
     default. */
  const t0 = Date.now();
  const s = startFocus(freshState(), { minutes: 25 }, t0 - 26 * 60 * 60 * 1000).next;
  const hit = advise(s, new Date(t0)).find((a) => a.id === "focusRun");
  assert.ok(hit);
  assert.ok(hit.text.includes("تُحتسب"));
  assert.deepEqual(hit.actions.map((a) => a.data), ["focus:settle", "focus:drop"]);
});

test("the coach carries three observations and says how many it left", () => {
  const s = freshState();
  const all = advise(s, at(21));
  assert.ok(all.length > COACH_MAX, "a fresh evening has plenty wrong with it");
  const note = coachNote(s, at(21));
  assert.equal(note.ids.length, COACH_MAX);
  assert.equal(note.more, all.length - COACH_MAX);
  /* One observation's buttons, never three — and the first that actually
     has any. Several checks carry none by design (a deadline with a date on
     it has no one-tap answer), and taking the first blindly meant a day
     whose most urgent fact was an exam sent every other button away with
     it. */
  const first = all.slice(0, COACH_MAX).find((a) => a.actions.length);
  assert.deepEqual(note.actions, first.actions);
  assert.ok(note.actions.length, "a fresh evening has something to offer");
  /* Ranked, so the order is a decision rather than the order the checks
     happen to be written in. */
  assert.deepEqual(
    [...all].sort((a, b) => a.rank - b.rank).map((a) => a.id),
    all.map((a) => a.id),
  );
});

test("a water nudge is measured against the hour, not against the goal", () => {
  const s = { ...freshState(), water: 4, waterGoal: 8 };
  /* Four of eight at ten in the morning is ahead of pace, not behind — and a
     reminder that treats it as behind is one he mutes. */
  assert.ok(!advise(s, at(10)).some((a) => a.id === "water"));
  assert.ok(advise(s, at(21)).some((a) => a.id === "water"));
});

test("a spending spike is this week against the four before it, with a floor", () => {
  const spend = (days, amount) => ({
    id: uid(), date: addDays(dayKey(), -days), label: "x", amount,
  });
  /* A quiet month and one ordinary purchase is not a spike: a ratio on top
     of small numbers is arithmetic, not information. */
  assert.ok(
    !advise({ ...freshState(), expenses: [spend(1, 150)] }, at(12)).some(
      (a) => a.id === "money",
    ),
  );
  const loud = {
    ...freshState(),
    expenses: [
      spend(1, 900),
      spend(9, 200), spend(16, 200), spend(23, 200), spend(27, 200),
    ],
  };
  assert.ok(advise(loud, at(12)).some((a) => a.id === "money"));
});

test("a damaged row cannot take the whole sweep down", () => {
  /* The nudge is the least important thing in this process and the one most
     likely to meet a shape nothing else reads. */
  const broken = {
    ...freshState(),
    badHabits: [{ id: "b1" }],
    history: [null, { date: "x" }],
    sessions: [null],
    reading: [null],
  };
  assert.doesNotThrow(() => advise(broken, at(21)));
});

/* --- the week, once ---------------------------------------------------- */

test("the weekly review counts the gaps and never averages them", () => {
  const s = {
    ...freshState(),
    history: [
      { date: addDays(dayKey(), -5), pct: 100, done: ["a"], all: ["a"] },
      { date: addDays(dayKey(), -4), gap: true },
      { date: addDays(dayKey(), -3), gap: true },
      { date: addDays(dayKey(), -2), pct: 60, done: ["a"], all: ["a", "b"] },
    ],
  };
  const out = weekReview(s, at(20));
  /* The average is over the two days that recorded, and the two that did not
     are named: an average over «the rows that exist» flatters every stretch
     where the recording stopped. */
  assert.ok(out.includes("٨٠"));
  assert.ok(out.includes("يومان بدون تسجيل"));
});

test("the weekly review names the habit the week says is hard", () => {
  let s = freshState();
  const [strong, weak] = s.habits;
  s = {
    ...s,
    habits: s.habits.map((h) =>
      h.id === weak.id
        ? { ...h, core: true, min: "صفحة واحدة" }
        : h.id === strong.id
          ? { ...h, core: true }
          : h,
    ),
    /* Over the roster each row actually recorded, so a habit added on
       Wednesday is not counted against Monday. */
    history: [1, 2, 3, 4].map((i) => ({
      date: addDays(dayKey(), -i),
      pct: 50,
      done: [strong.id],
      all: [strong.id, weak.id],
    })),
  };
  const out = weekReview(s, at(20));
  assert.ok(out.includes(strong.label));
  assert.ok(out.includes(weak.label));
  /* And the floor is offered where it belongs: against the one habit the
     week says is actually hard. */
  assert.ok(out.includes("صفحة واحدة"));
});

/* --- the schedule's two new entries ------------------------------------ */

const withBot = (part) => {
  const s = freshState();
  return { ...s, bot: botShape({ ...s.bot, ...part }), place: null };
};

test("the coach and the weekly are off until he turns them on", () => {
  /* The same refusal as the core five and the habit floor: what the bot may
     interrupt him for is not a question a migration can answer. */
  const fresh = botShape({});
  assert.equal(fresh.coach.on, false);
  assert.equal(fresh.weekly.on, false);
  /* An older payload arrives with the two briefs on and everything periodic
     off, which is exactly what it had before these existed. */
  const old = botShape({ morningAt: "07:30", water: { on: true } });
  assert.equal(old.coach.on, false);
  assert.equal(old.weekly.on, false);
  assert.equal(old.morningAt, "07:30");
  assert.equal(old.water.on, true);
});

test("the weekly fires on one day of the week and the coach on all of them", () => {
  const friday = new Date(2027, 2, 5, 0, 1, 0);
  const saturday = new Date(2027, 2, 6, 0, 1, 0);
  assert.equal(friday.getDay(), 5);
  const state = withBot({
    morningOn: false,
    eveningOn: false,
    coach: { on: true, at: "11:00" },
    weekly: { on: true, at: "20:30", dow: 5 },
  });
  assert.deepEqual(planToday(state, friday).map((p) => p.kind), ["coach", "weekly"]);
  assert.deepEqual(planToday(state, saturday).map((p) => p.kind), ["coach"]);
});
