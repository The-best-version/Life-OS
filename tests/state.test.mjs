/* --- the only safety net over 21,000 lines ----------------------------
 *  `node --test tests/` — nothing installed, nothing fetched. The fixtures
 *  are real backups of a real year, not hand-written objects: a migration
 *  that passes on a fixture someone invented to make it pass has tested
 *  nothing.
 *
 *  What these are actually for. Every change to this app is a change to one
 *  file of twenty-odd thousand lines, and the failures that hurt are the
 *  quiet ones — a list that migrates to empty, a new feature left out of the
 *  carry so its data disappears at four in the morning, a score that two
 *  screens compute differently. None of those throw. All of them are caught
 *  below.
 * --------------------------------------------------------------------- */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  NAV_GROUPS,
  GROUP_OF_TAB,
  SCHEMA,
  CORE_CAP,
  TOP_TASK_CAP,
  DAY_START_HOUR,
  TAB_BAR,
  NAV_IDS,
  dayKey,
  yesterdayKey,
  fmtDay,
  logicalNow,
  freshState,
  carryOf,
  rollDay,
  migrate,
  addDays,
  HISTORY_CAP,
  GAP_REACH,
  isGap,
  fillGaps,
  firstDay,
  pctOfRow,
  setDayDone,
  streakBaseFrom,
  scoredOf,
  disciplineOf,
  coreOf,
  bookShape,
  goalShape,
  ARC,
  RUNWAY,
  GOAL_YEARS,
  YEAR_MIN,
  windowOf,
  yearQuarters,
  goalEnd,
  BLOCK_IDS,
  blockRank,
  remainingIn,
  uniPending,
  minsIn,
  taskShape,
  capToday,
  STEP_MAX,
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
  habitShape,
  HABIT_MIN_MAX,
  streakRunFrom,
  STREAK_FORGIVE,
  comebackFrom,
  COMEBACK_MIN,
  stampToday,
  botShape,
  reminderShape,
  planDay,
  nextInPlan,
  onDay,
  firesOn,
  clampGoal,
  whenOf,
  nextFireOf,
  gateOf,
  monthDays,
  DOM_MIN,
  DOM_MAX,
  REMINDER_IDEAS,
  REMINDER_CAP,
  WATER_EVERY_MAX,
  PRAYER_BEFORE_MAX,
  incomeShape,
  expenseShape,
  MONEY_CAP,
  amountSum,
  hoursSum,
  sinceDays,
  hourRate,
  netBalance,
  SESSION_CAP,
  PRESET_CAP,
  FOCUS_GOAL_DEFAULT,
  RUN_STALE_MS,
  MIN_LOGGED,
  INTERRUPT_MAX,
  ROUND_MAX,
  EVERY_MAX,
  presetShape,
  SEED_PRESETS,
  presetFor,
  runShape,
  armRun,
  startRun,
  pauseRun,
  runLeft,
  runRunning,
  runDone,
  runStale,
  spentMinutes,
  settleRun,
  sessionShape,
  sessionOf,
  manualSession,
  addSession,
  nextBreak,
  breakMinutes,
  tillLong,
  isBreak,
  focusShape,
  focusCarry,
  focusDay,
  focusStreak,
  focusWeek,
  focusSpan,
  focusByTask,
  focusBands,
  bestBand,
  interruptRate,
} from "../src/state/life-state.mjs";
import { BLOCK_ANCHORS, blockAt } from "../src/utils/prayer-times.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => JSON.parse(readFileSync(join(here, "fixtures", name), "utf8"));

const LISTS = [
  "habits",
  "tasks",
  "goals",
  "books",
  "history",
  "quotes",
  "reads",
  "badHabits",
  "events",
  "sessions",
  "income",
  "ventures",
  "reading",
];

const count = (s) =>
  Object.fromEntries(LISTS.map((k) => [k, Array.isArray(s[k]) ? s[k].length : 0]));

const ids = (list) => new Set((list || []).map((r) => r && r.id).filter(Boolean));

/* ===================================================================== *
 *  migrate — the one function that can lose a year
 * ===================================================================== */

for (const name of ["schema-19.json", "schema-20.json"]) {
  test(`migrate(${name}) loses no row`, () => {
    const raw = fixture(name);
    const out = migrate(raw);
    const before = count(raw);
    const after = count(out);
    for (const k of LISTS) {
      assert.ok(
        after[k] >= before[k],
        `${k}: ${before[k]} rows went in, ${after[k]} came out`,
      );
    }
    assert.equal(out.schema, SCHEMA);
  });

  test(`migrate(${name}) keeps every id`, () => {
    const raw = fixture(name);
    const out = migrate(raw);
    for (const k of LISTS) {
      const was = ids(raw[k]);
      const now = ids(out[k]);
      for (const id of was) assert.ok(now.has(id), `${k}: id ${id} vanished`);
    }
  });

  test(`migrate(${name}) is idempotent`, () => {
    const once = migrate(fixture(name));
    const twice = migrate(once);
    assert.deepEqual(twice, once);
  });

  test(`migrate(${name}) guesses nobody's core habits`, () => {
    /* Schema 20's whole point: which five habits carry a day is not a
       question a migration is in any position to answer, so it asks. */
    const out = migrate(fixture(name));
    const core = coreOf(out.habits);
    const raw = fixture(name);
    const wasCore = (raw.habits || []).filter((h) => h.core).length;
    assert.equal(core.length, wasCore);
  });
}

test("migrate survives damage that a hand-edited backup can carry", () => {
  const raw = fixture("schema-20.json");
  const broken = {
    ...raw,
    habits: [null, ...raw.habits, 7, "x"],
    history: [...raw.history, null, { noDate: true }],
    goals: [...raw.goals, null],
    books: null,
  };
  const out = migrate(broken);
  assert.equal(out.habits.length, raw.habits.length);
  assert.ok(out.history.every((h) => typeof h.date === "string"));
  assert.ok(Array.isArray(out.books));
});

test("migrate accepts what is not an object at all", () => {
  for (const junk of [null, undefined, 7, "x", []]) {
    const out = migrate(junk);
    assert.equal(out.schema, SCHEMA);
    assert.ok(Array.isArray(out.habits));
  }
});

test("migrate never lets the revision into the state", () => {
  /* `rev` belongs to the write, not to the day: it counts saves and lives in
     its own storage key. A copy inside the state would be stale the instant
     the next save moved it, and would then be written back as the truth. */
  const out = migrate({ ...fixture("schema-20.json"), rev: 412 });
  assert.equal("rev" in out, false);
});

test("a goal's parent is never a dangling or circular link", () => {
  const raw = fixture("schema-20.json");
  const first = raw.goals[0].id;
  const second = raw.goals[1].id;
  const out = migrate({
    ...raw,
    goals: [
      { ...raw.goals[0], parent: "does-not-exist" },
      { ...raw.goals[1], parent: second }, // pointed at itself
      ...raw.goals.slice(2),
    ],
  });
  const byId = new Map(out.goals.map((g) => [g.id, g]));
  for (const g of out.goals) {
    if (!g.parent) continue;
    assert.notEqual(g.parent, g.id, "a goal is its own parent");
    const seen = new Set([g.id]);
    let at = g.parent;
    while (at) {
      assert.ok(!seen.has(at), "the parent chain closes a loop");
      assert.ok(byId.has(at), "the parent chain leaves the list");
      seen.add(at);
      at = byId.get(at).parent || null;
    }
  }
  assert.equal(byId.get(first).parent, null);
});

/* ===================================================================== *
 *  the carry — the most expensive mistake this app can make
 * ===================================================================== */

/* A key in freshState that is missing from carryOf is data that exists all
   day and is gone by morning, with nothing on screen to say why. It has
   happened; it is the reason this test exists. The exceptions are the keys
   that belong to the day itself and are *meant* to reset. */
const DAY_ONLY = new Set([
  "schema", // the build's, not the day's
  "date", // the day's name
  "water", // yesterday's water is not today's
  "dayBanked", // whether today cleared the bar
  "streakBase", // recomputed at the rollover
  "rev", // belongs to the write, never to the state
]);

test("every key in freshState is carried across the day boundary", () => {
  const fresh = freshState();
  const carried = new Set(Object.keys(carryOf(fresh)));
  const orphans = Object.keys(fresh).filter((k) => !carried.has(k) && !DAY_ONLY.has(k));
  assert.deepEqual(
    orphans,
    [],
    "these keys exist all day and vanish at " +
      DAY_START_HOUR +
      ":00 — add them to carryOf: " +
      orphans.join(", "),
  );
});

test("carryOf invents nothing freshState does not have", () => {
  const fresh = freshState();
  for (const k of Object.keys(carryOf(fresh))) {
    assert.ok(k in fresh, `carryOf carries ${k}, which freshState never makes`);
  }
});

test("a migrated payload has every key freshState makes", () => {
  const out = migrate(fixture("schema-19.json"));
  for (const k of Object.keys(freshState())) {
    if (k === "rev") continue;
    assert.ok(k in out, `migrate drops ${k}`);
  }
});

/* ===================================================================== *
 *  rollDay
 * ===================================================================== */

test("rollDay unchecks and keeps everything else", () => {
  const today = migrate(fixture("schema-20.json"));
  const stale = { ...today, date: "2020-01-01", habits: today.habits.map((h) => ({ ...h, done: true })) };
  const rolled = rollDay(stale);
  assert.equal(rolled.date, dayKey());
  assert.equal(rolled.habits.length, stale.habits.length);
  assert.ok(rolled.habits.every((h) => h.done === false), "a habit stayed ticked");
  assert.ok(rolled.tasks.every((t) => t.done === false), "a task stayed ticked");
  /* The ticks reset; nothing else may. */
  assert.deepEqual(
    rolled.habits.map((h) => h.id),
    stale.habits.map((h) => h.id),
  );
  /* Not an equal count: a rollover now also writes down the days the app
     was never opened. What may never happen is a *recorded* row being lost
     or rewritten, which is what this checks instead. */
  for (const h of stale.history) {
    assert.deepEqual(
      rolled.history.find((x) => x.date === h.date),
      h,
      `${h.date} was lost or rewritten by the rollover`,
    );
  }
  assert.equal(
    rolled.history.filter((h) => !isGap(h)).length,
    stale.history.filter((h) => !isGap(h)).length,
    "the rollover invented a recorded day",
  );
  assert.equal(rolled.goals.length, stale.goals.length);
  assert.equal(rolled.books.length, stale.books.length);
  assert.equal(rolled.water, 0);
  assert.deepEqual(rolled.northStar, stale.northStar);
});

test("rollDay never clears the text a person typed", () => {
  const today = migrate(fixture("schema-20.json"));
  const stale = {
    ...today,
    date: "2020-01-01",
    northStar: { word: "انضباط", vision: "سطر" },
    habits: today.habits.map((h) => ({ ...h, done: true, label: h.label + " ." })),
  };
  const rolled = rollDay(stale);
  assert.equal(rolled.northStar.word, "انضباط");
  assert.deepEqual(
    rolled.habits.map((h) => h.label),
    stale.habits.map((h) => h.label),
  );
});

test("rollDay returns the same object when the day has not turned", () => {
  const today = { ...migrate(fixture("schema-20.json")), date: dayKey() };
  assert.equal(rollDay(today), today);
});

test("rollDay reads the streak off the archive, never off the counter", () => {
  /* The counter is gone: «+1 if yesterday banked, else 0» cannot forgive
     anything, because it has no idea what the day before yesterday was. */
  const base = migrate(fixture("schema-20.json"));
  const day = (n) => addDays(dayKey(), -n);
  const hit = (n) => ({ date: day(n), pct: 95, done: [], all: ["x"] });
  const miss = (n) => ({ date: day(n), pct: 10, done: [], all: ["x"] });

  const run = rollDay({
    ...base,
    date: yesterdayKey(),
    dayBanked: true,
    streakBase: 0, // deliberately wrong — the rows are the authority
    history: [hit(1), hit(2), hit(3), hit(4)],
  });
  assert.equal(run.streakBase, 4, "a stale counter was trusted over the rows");

  /* Yesterday fell short; the four before it did not. One bad day is
     stepped over and the run survives at the length it actually earned. */
  const forgiven = rollDay({
    ...base,
    date: yesterdayKey(),
    dayBanked: false,
    streakBase: 99,
    history: [miss(1), hit(2), hit(3), hit(4)],
  });
  assert.equal(forgiven.streakBase, 3);

  /* Two in a row is not a bad day, it is a stop. */
  const broken = rollDay({
    ...base,
    date: yesterdayKey(),
    dayBanked: false,
    streakBase: 99,
    history: [miss(1), miss(2), hit(3), hit(4)],
  });
  assert.equal(broken.streakBase, 0);

  /* Months away: fillGaps writes the unrecorded days and two of them in a
     row end the run, however many banked days sit behind them. */
  const skipped = rollDay({ ...base, date: "2020-01-01", dayBanked: true, streakBase: 4 });
  assert.equal(skipped.streakBase, 0, "a gap of months cannot continue a streak");
});

/* ===================================================================== *
 *  the score — one denominator, read through one function
 * ===================================================================== */

test("with no core set the score counts every habit", () => {
  const habits = [
    { id: "a", done: true, core: false },
    { id: "b", done: false, core: false },
    { id: "c", done: false, core: false },
    { id: "d", done: false, core: false },
  ];
  assert.equal(scoredOf(habits).length, 4);
  assert.equal(disciplineOf(habits), 25);
});

test("with a core set the score counts only the core", () => {
  /* The arithmetic that made the case: three real wins out of eighteen
     habits rendered as 17%, which is a screen telling someone who did three
     hard things that he failed. */
  const habits = Array.from({ length: 18 }, (_, i) => ({
    id: String(i),
    done: i < 3,
    core: i < 3,
  }));
  assert.equal(disciplineOf(habits), 100);
  assert.equal(scoredOf(habits).length, 3);
});

test("the score is 0, never NaN, with nothing to score", () => {
  assert.equal(disciplineOf([]), 0);
});

test("the two caps are the numbers the screens are built around", () => {
  assert.equal(CORE_CAP, 5);
  assert.equal(TOP_TASK_CAP, 3);
});

/* ===================================================================== *
 *  the day boundary
 * ===================================================================== */

test("the logical day starts at " + DAY_START_HOUR + ":00", () => {
  const night = new Date(2027, 2, 10, 1, 30);
  const morning = new Date(2027, 2, 10, 5, 0);
  /* logicalNow shifts a moment back onto the day it belongs to; 01:30
     belongs to the 9th, 05:00 to the 10th. */
  assert.equal(fmtDay(logicalNow(night)), "2027-03-09");
  assert.equal(fmtDay(logicalNow(morning)), "2027-03-10");
});

test("dayKey with an argument means that calendar square, not the logical day", () => {
  assert.equal(dayKey(new Date(2027, 2, 10, 1, 30)), "2027-03-10");
});

test("yesterdayKey is the day before dayKey", () => {
  const a = new Date(dayKey() + "T12:00:00");
  const b = new Date(yesterdayKey() + "T12:00:00");
  assert.equal(Math.round((a - b) / 86400000), 1);
});

/* ===================================================================== *
 *  the shapes that everything else is built out of
 * ===================================================================== */

test("bookShape is total", () => {
  /* `obj()` is what makes it total: a default parameter fires for `undefined`
     and for nothing else, so `bookShape(null)` used to sail past `(b = {})`
     and throw on the first property read — and `null` is exactly what a
     hand-edited backup or a half-written download hands it. The id is not
     bookShape's to mint; the seed and the add form carry their own. */
  for (const junk of [null, undefined, 7, "x", []]) {
    const b = bookShape(junk);
    assert.equal(typeof b.title, "string");
    assert.equal(typeof b.status, "string");
    assert.ok(Array.isArray(b.notes));
  }
});

test("bookShape keeps what the user wrote", () => {
  const b = bookShape({ id: "k", title: "الكتاب", page: 40, notes: [{ text: "x", page: 3 }] });
  assert.equal(b.id, "k");
  assert.equal(b.title, "الكتاب");
  assert.equal(b.page, 40);
});

test("goalShape defaults to the 90-day horizon", () => {
  assert.equal(goalShape({ text: "x" }).horizon, "quarter");
});

/* --- the runway year -------------------------------------------------- *
 *  2026 is a year a goal may live in; it is not part of the three-year arc.
 *  The two are separate constants precisely so the vision's window — and the
 *  countdown drawn from it — never stretches backwards to cover a warm-up.
 * ---------------------------------------------------------------------- */
test("the runway widens where a goal may live, never the arc itself", () => {
  assert.ok(RUNWAY.every((y) => !ARC.includes(y)), "the runway is not in the arc");
  assert.deepEqual(GOAL_YEARS, [...RUNWAY, ...ARC]);
  assert.equal(YEAR_MIN, GOAL_YEARS[0]);

  for (const y of RUNWAY) assert.equal(goalShape({ year: y }).year, y, "a runway year is kept");
  /* The three-year window is the arc and only the arc — a runway year in it
     would move the window's start back and make «مضى %» jump overnight. */
  assert.deepEqual(windowOf("h3"), [`${ARC[0]}-01-01`, `${ARC[ARC.length - 1]}-12-31`]);
  assert.equal(goalEnd({ horizon: "h3", year: RUNWAY[0] }), `${ARC[ARC.length - 1]}-12-31`);
  /* A row that lost its year lands in the programme, not in the warm-up. */
  assert.equal(goalShape({ year: 1999 }).year, ARC[0]);
});

test("a runway year shows the quarters that are left, and never strands a goal", () => {
  const year = RUNWAY[0];
  const all = yearQuarters(year, [], `${year}-10-18`);
  assert.deepEqual(all.map((q) => q.id), ["q4"], "three dead tabs are not a chooser");

  /* An arc year is all four: every one of them is still ahead. */
  assert.equal(yearQuarters(ARC[0], [], `${year}-10-18`).length, 4);

  /* A quarter that already ended still shows while it holds a goal — a tab
     that disappears takes what was written in it out of reach. */
  const held = yearQuarters(year, [{ horizon: "quarter", year, quarter: "q1" }], `${year}-10-18`);
  assert.deepEqual(held.map((q) => q.id), ["q1", "q4"]);

  /* And a runway year gone by entirely keeps its last quarter rather than
     collapsing to no tab at all. */
  const past = yearQuarters(year, [], `${year + 1}-06-01`);
  assert.deepEqual(past.map((q) => q.id), ["q4"]);
});

/* ===================================================================== *
 *  «اليوم» — the screen the app opens on
 *
 *  Nothing below touches a render. What is tested is the arithmetic the
 *  screen is a drawing of: which block the day is in, what is still open in
 *  it, what is behind you, and what is owed next — plus the one thing a
 *  migration can get wrong here, which is burying the new tab at the end of
 *  a fifteen-tab order where a phone never shows it.
 * ===================================================================== */

test("the day's blocks run in one order, in both modules", () => {
  /* `BLOCK_IDS` ranks «فاتك»; `BLOCK_ANCHORS` pins each block to a prayer.
     Two lists, one day — if they ever disagree, the screen says a habit is
     behind you while the clock says its block has not opened. */
  assert.deepEqual(
    BLOCK_ANCHORS.map((b) => b.id),
    BLOCK_IDS,
  );
});

test("blockRank puts an unknown block last, not first", () => {
  assert.equal(blockRank("morning"), 0);
  assert.equal(blockRank("night"), BLOCK_IDS.length - 1);
  /* The safe side: a habit from a damaged payload is "still ahead", never
     announced as missed. */
  assert.equal(blockRank("not-a-block"), BLOCK_IDS.length);
  assert.equal(blockRank(undefined), BLOCK_IDS.length);
});

test("blockAt walks the day through its six blocks", () => {
  const place = { lat: 24.7136, lng: 46.6753, tz: 3, asr: 1 };
  const at = (h, m = 30) => blockAt(place, new Date(2026, 9, 6, h, m)).id;
  assert.equal(at(5), "morning");
  assert.equal(at(9), "morning");
  assert.equal(at(13), "afternoon");
  assert.equal(at(16), "asr");
  assert.equal(at(23), "night");
});

test("after midnight the day is still in its last block", () => {
  /* The same mistake the evening prompt made with `getHours() >= 20`: the
     logical day rolls at 04:00 and Fajr can be later still, so 00:30 and
     03:30 are «قبل النوم» of the evening that has not finished. A null there
     would tell someone plainly awake in his day that it has not started. */
  const place = { lat: 24.7136, lng: 46.6753, tz: 3, asr: 1 };
  for (const h of [0, 2, 3]) {
    assert.equal(blockAt(place, new Date(2026, 9, 6, h, 30)).id, "night");
  }
});

test("remainingIn splits what is open by where the day has got to", () => {
  const habits = [
    { id: "a", group: "morning", done: true },
    { id: "b", group: "morning", done: false },
    { id: "c", group: "asr", done: false },
    { id: "d", group: "asr", done: true },
    { id: "e", group: "night", done: false },
  ];
  const { here, missed, later } = remainingIn(habits, "asr");
  assert.deepEqual(
    here.map((h) => h.id),
    ["c"],
  );
  assert.deepEqual(
    missed.map((h) => h.id),
    ["b"],
    "a ticked habit is not missed, and a closed block's open one is",
  );
  assert.deepEqual(
    later.map((h) => h.id),
    ["e"],
  );
});

test("remainingIn keeps his own order and survives junk", () => {
  const habits = [
    { id: "z", group: "morning", done: false },
    { id: "y", group: "morning", done: false },
    null,
    7,
    { id: "x", group: "wiped-block", done: false },
  ];
  const { here, later } = remainingIn(habits, "morning");
  assert.deepEqual(
    here.map((h) => h.id),
    ["z", "y"],
    "the list was re-sorted — the order on this screen is the user's",
  );
  assert.deepEqual(
    later.map((h) => h.id),
    ["x"],
    "a habit from a damaged payload must still render somewhere",
  );
  assert.deepEqual(remainingIn(null, "morning"), { here: [], missed: [], later: [] });
});

test("remainingIn holds a habit that was just ticked", () => {
  /* The reward has to play on a mounted row. Without the hold, the ripple,
     the pop and the emerald glow all fire on a row the same render removes,
     and ticking a habit here pays out nothing. */
  const habits = [
    { id: "a", group: "asr", done: true },
    { id: "b", group: "asr", done: false },
  ];
  assert.deepEqual(
    remainingIn(habits, "asr", new Set(["a"])).here.map((h) => h.id),
    ["a", "b"],
  );
  assert.deepEqual(
    remainingIn(habits, "asr", ["a"]).here.map((h) => h.id),
    ["a", "b"],
    "an array of ids reads the same as a set",
  );
  assert.deepEqual(
    remainingIn(habits, "asr").here.map((h) => h.id),
    ["b"],
    "nothing held, nothing kept",
  );
  assert.deepEqual(remainingIn(habits, "asr", "junk").here.map((h) => h.id), ["b"]);
});

test("uniPending puts the overdue first and drops what is done", () => {
  const uni = {
    tasks: [
      { id: "1", title: "واجب", due: "2026-10-09", time: "" },
      { id: "2", title: "كويز", due: "2026-10-02", time: "10:00" },
      { id: "3", title: "مسلّم", due: "2026-10-01", time: "", done: true },
      { id: "4", title: "عرض", due: "2026-10-02", time: "08:00" },
    ],
  };
  assert.deepEqual(
    uniPending(uni, "2026-10-06").map((t) => t.id),
    ["4", "2", "1"],
    "date then clock, and a finished deliverable is not owed",
  );
});

test("uniPending is total", () => {
  for (const junk of [null, undefined, 7, "x", {}, { tasks: [null, 3] }]) {
    assert.deepEqual(uniPending(junk, "2026-10-06"), []);
  }
});

test("minsIn reads a clock and refuses a half-typed one", () => {
  assert.equal(minsIn("08:30"), 510);
  assert.equal(minsIn("00:00"), 0);
  /* Null, never zero: a row with no time sorts after the timed ones, and a
     zero would float every one of them to dawn. */
  assert.equal(minsIn(""), null);
  assert.equal(minsIn("8"), null);
  assert.equal(minsIn(undefined), null);
});

/* ===================================================================== *
 *  Unrecorded days — the difference between a zero and a silence
 * ===================================================================== */

test("fillGaps writes a row for every day nobody recorded", () => {
  const out = fillGaps(
    [
      { date: "2026-09-29", pct: 0, done: [], all: ["a"] },
      { date: "2026-10-02", pct: 40, done: ["a"], all: ["a"] },
    ],
    "2026-09-29",
    "2026-10-03",
  );
  assert.deepEqual(
    out.map((h) => h.date),
    ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"],
    "the archive must come out in date order, with no day skipped",
  );
  assert.deepEqual(
    out.filter(isGap).map((h) => h.date),
    ["2026-09-30", "2026-10-01", "2026-10-03"],
  );
  /* A recorded day is never touched, whatever it scored. */
  assert.deepEqual(out[0], { date: "2026-09-29", pct: 0, done: [], all: ["a"] });
});

test("a gap row is not a zero: no score, no roster", () => {
  const [row] = fillGaps([], "2026-10-01", "2026-10-01");
  assert.deepEqual(row, { date: "2026-10-01", gap: true });
  assert.equal("pct" in row, false, "a day nobody recorded cannot have a score");
  assert.equal("done" in row, false, "and it cannot have a roll call");
  /* Which is what keeps it out of every consumer that reads the archive —
     all of them gate on `Array.isArray(row.done)`. */
  assert.equal(Array.isArray(row.done), false);
});

test("fillGaps refuses a range it cannot walk", () => {
  const h = [{ date: "2026-10-01", pct: 1 }];
  for (const [a, b] of [
    [null, "2026-10-05"],
    ["2026-10-01", "x"],
    ["2026-02-31", "2026-10-05"],
    ["2026-10-05", "2026-10-01"],
  ]) {
    assert.equal(fillGaps(h, a, b), h, `${a} → ${b} should have been refused whole`);
  }
});

test("fillGaps cannot blow the archive open", () => {
  /* A clock that ran away, or a payload whose `date` is years stale. Reach
     is bounded, so the real days are never pushed out of a capped archive by
     invented silences — and the recorded row is still there afterwards. */
  const out = fillGaps([{ date: "2020-01-01", pct: 5 }], "2020-01-01", "2026-10-05");
  assert.ok(out.length <= GAP_REACH + 1, `${out.length} rows came out`);
  assert.ok(out.length <= HISTORY_CAP);
  assert.deepEqual(out[0], { date: "2020-01-01", pct: 5 });
  assert.equal(out.filter(isGap).length, GAP_REACH);
});

test("migrate fills the days the old payload never recorded", () => {
  const raw = fixture("schema-20.json");
  const out = migrate(raw);
  const by = new Map(out.history.map((h) => [h.date, h]));
  /* The two real holes in the first week of October. */
  for (const d of ["2026-10-01", "2026-10-03"]) {
    assert.ok(by.has(d), `${d} is still missing from the archive`);
    assert.ok(isGap(by.get(d)), `${d} came back as something other than a gap`);
  }
  /* And every day he did record is still there, untouched. */
  for (const h of raw.history) {
    assert.deepEqual(by.get(h.date), h, `${h.date} was rewritten by the migration`);
  }
});

test("migrate invents no day before the first one he recorded", () => {
  const out = migrate(fixture("schema-20.json"));
  const first = fixture("schema-20.json")
    .history.map((h) => h.date)
    .sort()[0];
  assert.ok(
    out.history.every((h) => h.date >= first),
    "the archive reaches back before the first day there was an app to open",
  );
});

test("migrate leaves today alone — today is still being lived", () => {
  const out = migrate({ schema: 20, date: dayKey(), history: [{ date: "2026-01-01", pct: 3 }] });
  const today = out.history.find((h) => h.date === dayKey());
  assert.ok(!today || !isGap(today), "today was written down as unrecorded");
});

test("rollDay writes down the days the app was never opened", () => {
  const two = addDays(dayKey(), -3);
  const s = {
    ...freshState(),
    date: two,
    history: [{ date: two, pct: 50, done: [], all: [] }],
  };
  const out = rollDay(s);
  const gaps = out.history.filter(isGap).map((h) => h.date);
  assert.deepEqual(gaps, [addDays(dayKey(), -2), addDays(dayKey(), -1)]);
  /* The day being left behind already had its own row and keeps it. */
  assert.ok(out.history.some((h) => h.date === two && !isGap(h)));
});

test("firstDay ignores what is not a date", () => {
  assert.equal(
    firstDay([{ date: "x" }, { date: "2026-05-04" }, null, { date: "2026-02-30" }]),
    "2026-05-04",
  );
  assert.equal(firstDay([]), null);
  assert.equal(firstDay(null), null);
});

/* ===================================================================== *
 *  A past day's score, and correcting one
 * ===================================================================== */

test("pctOfRow reads the same denominator the ring reads", () => {
  const habits = [
    { id: "a", core: true },
    { id: "b", core: true },
    { id: "c" },
    { id: "d" },
  ];
  /* Two of four ticked is 50% with no core set... */
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["a", "c"] }, habits.map((h) => ({ id: h.id }))), 50);
  /* ...and one of the two core habits is also 50% — but for a different
     reason, and the two must be computed by the same function or the archive
     and the ring will disagree about the same day. */
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["a", "c"] }, habits), 50);
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["a", "b", "c"] }, habits), 100);
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["c", "d"] }, habits), 0);
});

test("pctOfRow scores the day the roster it actually had", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  /* Three were asked that day and one of them has since been deleted. It
     still counts: dropping it would rescore a finished day every time the
     routine is edited, and the roll call lists it as «عادة لم تعد في روتينك»
     rather than forgetting it — so one of three, not one of two. */
  assert.equal(pctOfRow({ all: ["a", "b", "gone"], done: ["a"] }, habits), 33);
  /* And a deleted habit can never be core, because the core is a choice
     about the live routine. */
  assert.equal(
    pctOfRow({ all: ["a", "b", "gone"], done: ["a"] }, [{ id: "a", core: true }, { id: "b" }]),
    100,
  );
});

test("re-opening a day that was never edited previews the score it was lived at", () => {
  /* The bug this rule exists for: the editor showed 21% beside the 35% the
     day was recorded at, because three of that day's habits had been deleted
     since. An untouched row must preview exactly what it stored. */
  const all = ["a", "b", "c", "d", "e", "f"];
  const row = { date: "2026-10-05", all, done: ["a", "b"], pct: 33 };
  assert.equal(pctOfRow(row, [{ id: "a" }, { id: "b" }, { id: "c" }]), row.pct);
});

test("pctOfRow falls back to the live roster for a row that has none", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  assert.equal(pctOfRow({ done: ["a"] }, habits), 50);
  assert.equal(pctOfRow({}, habits), 0);
  assert.equal(pctOfRow(null, []), 0);
});

test("setDayDone rewrites one row and nothing else", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  const history = [
    { date: "2026-10-04", pct: 0, done: [], all: ["a", "b"] },
    { date: "2026-10-05", pct: 0, done: [], all: ["a", "b"], distraction: "النوم" },
  ];
  const out = setDayDone(history, "2026-10-05", ["a"], habits);
  assert.deepEqual(out[0], history[0], "the day before was touched");
  assert.equal(out[1].pct, 50);
  assert.deepEqual(out[1].done, ["a"]);
  /* Merged, never rebuilt: the row also carries the evening reflection. */
  assert.equal(out[1].distraction, "النوم");
});

test("setDayDone turns a gap into an ordinary day", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  const out = setDayDone([{ date: "2026-10-03", gap: true }], "2026-10-03", ["a", "b"], habits);
  assert.equal(out.length, 1);
  assert.equal(isGap(out[0]), false);
  assert.equal("gap" in out[0], false, "`gap: false` is a second shape meaning one thing");
  assert.equal(out[0].pct, 100);
  assert.deepEqual(out[0].all, ["a", "b"], "a gap has no roster, so the live one is used");
});

test("setDayDone cannot tick a habit that day never asked", () => {
  const habits = [{ id: "a" }, { id: "b" }];
  const out = setDayDone(
    [{ date: "2026-10-05", done: [], all: ["a"] }],
    "2026-10-05",
    ["a", "b", "a"],
    habits,
  );
  assert.deepEqual(out[0].done, ["a"], "a habit off that day's roster, or listed twice");
  assert.equal(out[0].pct, 100);
});

test("setDayDone refuses a date that is not one", () => {
  const h = [{ date: "2026-10-05", done: [], all: [] }];
  for (const d of [null, "", "x", "2026-02-31"]) assert.equal(setDayDone(h, d, [], []), h);
});

test("streakBaseFrom counts back from yesterday", () => {
  const day = (n) => addDays(dayKey(), -n);
  const hit = (n) => ({ date: day(n), pct: 90, done: [], all: [] });
  assert.equal(streakBaseFrom([hit(1), hit(2), hit(3)]), 3);
  /* Today is not part of the base — `dayBanked` adds it, and counting it
     twice is how a streak reads one day ahead of itself. */
  assert.equal(streakBaseFrom([{ date: dayKey(), pct: 100, done: [], all: [] }]), 0);
});

test("the archive still carries no gap once it has been filled", () => {
  /* Idempotence where it matters: filling twice must not double the rows. */
  const once = fillGaps([{ date: "2026-10-01", pct: 1 }], "2026-10-01", "2026-10-04");
  const twice = fillGaps(once, "2026-10-01", "2026-10-04");
  assert.deepEqual(twice, once);
});

/* ===================================================================== *
 *  جهّز غدك — the three chosen the night before
 * ===================================================================== */

const T3 = (n) => [...Array(n)].map((_, i) => ({ id: `t${i}`, text: `م${i}`, today: false }));
const prepOf = (day, ...ids) => ({
  for: day,
  picks: ids.map((id) => ({ task: id, event: null })),
});

test("taskShape gives every task a step and invents no quadrant", () => {
  const t = taskShape({ id: "a", text: "x" });
  assert.equal(t.step, "");
  assert.equal(t.quadrant, "q2");
  assert.equal(t.today, false);
  assert.equal(t.done, false);
  /* A damaged payload must not throw on the way in. */
  assert.equal(taskShape(null).text, "");
  assert.equal(taskShape(undefined).step, "");
  /* His own text is bounded, never dropped. */
  assert.equal(taskShape({ step: "ب".repeat(400) }).step.length, STEP_MAX);
});

test("taskShape keeps the step the user typed, every load", () => {
  const once = taskShape({ id: "a", step: "افتح الملزمة على الفصل الثالث" });
  const twice = taskShape(once);
  assert.deepEqual(twice, once);
  assert.equal(twice.step, "افتح الملزمة على الفصل الثالث");
});

test("capToday refuses a fourth and keeps the first three in his order", () => {
  const list = [
    { id: "a", today: true },
    { id: "b", today: false },
    { id: "c", today: true },
    { id: "d", today: true },
    { id: "e", today: true },
  ];
  const out = capToday(list);
  assert.deepEqual(
    out.filter((t) => t.today).map((t) => t.id),
    ["a", "c", "d"],
  );
  /* The flag comes off; the task never does. */
  assert.equal(out.length, list.length);
  assert.equal(out.filter((t) => t.today).length, TOP_TASK_CAP);
  /* A list already inside the rule is handed back unchanged. */
  const fine = [{ id: "a", today: true }, { id: "b", today: false }];
  assert.deepEqual(capToday(fine), fine);
});

test("tomorrowKey is the day after the logical today", () => {
  assert.equal(tomorrowKey(), addDays(dayKey(), 1));
});

test("prepShape cannot hold a fourth pick, a duplicate, or a hole", () => {
  const p = prepShape({
    for: tomorrowKey(),
    picks: [
      { task: "a" },
      { task: "a" },
      null,
      { task: "" },
      { task: "b", event: "e1" },
      { task: "c" },
      { task: "d" },
    ],
  });
  assert.equal(p.picks.length, TOP_TASK_CAP);
  assert.deepEqual(p.picks.map((x) => x.task), ["a", "b", "c"]);
  assert.equal(p.picks[1].event, "e1");
  assert.equal(p.picks[0].event, null);
  /* A damaged or absent prep is an empty one, never a throw. */
  assert.deepEqual(prepShape(null), { for: null, picks: [] });
  assert.equal(prepShape({ for: "2026-02-31" }).for, null);
});

test("prepPickAdd refuses the fourth in the state, not on the screen", () => {
  const day = tomorrowKey();
  let p = prepPickAdd(null, "a", day);
  p = prepPickAdd(p, "b", day);
  p = prepPickAdd(p, "c", day);
  assert.equal(prepFull(p), true);
  assert.deepEqual(prepPickAdd(p, "d", day), p, "a fourth pick was accepted");
  /* And the same task twice is one pick. */
  assert.deepEqual(prepPickAdd(p, "a", day), p);
  assert.equal(prepHas(p, "b"), true);
  assert.equal(prepHas(p, "d"), false);
  assert.equal(p.for, day);
});

test("prepPickDrop and prepPickEvent move one pick and nothing else", () => {
  const day = tomorrowKey();
  const p = prepOf(day, "a", "b", "c");
  assert.deepEqual(prepPickDrop(p, "b").picks.map((x) => x.task), ["a", "c"]);
  assert.equal(prepPickDrop(p, "zz").picks.length, 3);
  const withEv = prepPickEvent(p, "b", "ev9");
  assert.deepEqual(withEv.picks.map((x) => x.event), [null, "ev9", null]);
  /* Clearing the time detaches the entry rather than storing an empty id. */
  assert.equal(prepPickEvent(withEv, "b", "").picks[1].event, null);
  assert.equal(prepPickEvent(withEv, "b", null).picks[1].event, null);
  assert.equal(prepPicks(p).length, 3);
});

test("a prep is only ever applied to the day it was made for", () => {
  const tasks = T3(4);
  const day = "2026-10-08";
  const prep = prepOf(day, "t1", "t3");
  assert.deepEqual(prepReady(prep, tasks, day).map((x) => x.task), ["t1", "t3"]);
  /* The day it was prepared for came and went; the three do not follow it. */
  assert.deepEqual(prepReady(prep, tasks, "2026-10-09"), []);
  assert.deepEqual(prepReady(prep, tasks, "2026-10-07"), []);
  assert.deepEqual(prepReady(prep, tasks, "nope"), []);
});

test("applyPrep promotes exactly the prepared three", () => {
  const day = "2026-10-08";
  const tasks = [
    { id: "t0", today: true },
    { id: "t1", today: false },
    { id: "t2", today: false },
    { id: "t3", today: false },
  ];
  const out = applyPrep(tasks, prepOf(day, "t1", "t3"), day);
  assert.deepEqual(out.filter((t) => t.today).map((t) => t.id), ["t1", "t3"]);
  assert.equal(out.length, tasks.length, "a task was lost on the way through");
});

test("a task deleted after being picked is simply not promoted", () => {
  const day = "2026-10-08";
  const tasks = [{ id: "t1", today: false }, { id: "t2", today: false }];
  const out = applyPrep(tasks, prepOf(day, "t1", "gone"), day);
  assert.deepEqual(out.filter((t) => t.today).map((t) => t.id), ["t1"]);
});

test("nothing prepared leaves the flags exactly where they were", () => {
  const tasks = [
    { id: "a", today: true },
    { id: "b", today: false },
    { id: "c", today: true },
  ];
  /* The behaviour this app had before the screen existed, and the behaviour
     it keeps for every day the screen is never opened. */
  assert.deepEqual(applyPrep(tasks, null, "2026-10-08"), tasks);
  assert.deepEqual(applyPrep(tasks, prepOf("2026-10-20", "b"), "2026-10-08"), tasks);
  /* But the cap is still asserted on the way through. */
  const four = [
    { id: "a", today: true },
    { id: "b", today: true },
    { id: "c", today: true },
    { id: "d", today: true },
  ];
  assert.equal(
    applyPrep(four, null, "2026-10-08").filter((t) => t.today).length,
    TOP_TASK_CAP,
  );
});

test("a spent prep is cleared, a waiting one is kept", () => {
  const prep = prepOf("2026-10-08", "a");
  /* Read by applyPrep on the way into this same state — leaving it there
     would re-promote its three at every rollover after it. */
  assert.deepEqual(prepCarry(prep, "2026-10-08"), { for: null, picks: [] });
  assert.deepEqual(prepCarry(prep, "2026-10-09"), { for: null, picks: [] });
  assert.deepEqual(prepCarry(prep, "2026-10-07"), prep);
  assert.deepEqual(prepCarry(null, "2026-10-07"), { for: null, picks: [] });
});

test("rollDay promotes last night's three and spends the prep", () => {
  const s = {
    ...freshState(),
    date: addDays(dayKey(), -1),
    tasks: [
      { id: "p0", text: "صفر", today: true, done: true },
      { id: "p1", text: "واحد", today: false, done: false, step: "افتح الملف" },
      { id: "p2", text: "اثنان", today: false, done: false },
      { id: "p3", text: "ثلاثة", today: false, done: false },
    ],
    tomorrow: prepOf(dayKey(), "p1", "p3"),
  };
  const next = rollDay(s);
  assert.equal(next.date, dayKey());
  assert.deepEqual(next.tasks.filter((t) => t.today).map((t) => t.id), ["p1", "p3"]);
  /* The step he typed last night is still under the task this morning. */
  assert.equal(next.tasks.find((t) => t.id === "p1").step, "افتح الملف");
  /* Yesterday's done flags are cleared, as they always were. */
  assert.equal(next.tasks.every((t) => !t.done), true);
  /* And the prep is spent, so the day after does not inherit tonight. */
  assert.deepEqual(next.tomorrow, { for: null, picks: [] });
});

test("a prep made for a day he slept through is dropped, not applied late", () => {
  const s = {
    ...freshState(),
    date: addDays(dayKey(), -4),
    tasks: [
      { id: "a", today: true, done: false },
      { id: "b", today: false, done: false },
    ],
    /* Prepared for the morning after the night he wrote it — three days ago. */
    tomorrow: prepOf(addDays(dayKey(), -3), "b"),
  };
  const next = rollDay(s);
  assert.deepEqual(next.tasks.filter((t) => t.today).map((t) => t.id), ["a"]);
  assert.deepEqual(next.tomorrow, { for: null, picks: [] });
});

test("migrate repairs a payload carrying a fourth today-task", () => {
  const raw = fixture("schema-20.json");
  raw.tasks = raw.tasks.map((t) => ({ ...t, today: true }));
  const out = migrate(raw);
  assert.equal(out.tasks.length, raw.tasks.length, "a task was dropped, not demoted");
  assert.equal(out.tasks.filter((t) => t.today).length, TOP_TASK_CAP);
});

test("picking for a new day does not inherit a stale day's three", () => {
  /* A restored backup, or a window left open through the rollover, can hand
     this a prep whose day is gone. Its three were chosen for a morning that
     has passed, and carrying them into tomorrow unasked is the one thing a
     screen called «جهّز غدك» must not do. */
  const stale = prepOf("2026-10-02", "old1", "old2", "old3");
  const out = prepPickAdd(stale, "fresh", "2026-10-09");
  assert.equal(out.for, "2026-10-09");
  assert.deepEqual(out.picks.map((x) => x.task), ["fresh"]);
  /* And a full stale prep does not refuse the first pick of a new day. */
  assert.equal(prepFull(stale), true);
  assert.equal(prepPickAdd(stale, "fresh", "2026-10-09").picks.length, 1);
});

/* ===================================================================== *
 *  السلسلة المتسامحة — one day is forgiven, two in a row are not
 * ===================================================================== */

const dayBack = (n) => addDays(dayKey(), -n);
const hit = (n) => ({ date: dayBack(n), pct: 95, done: [], all: ["x"] });
const miss = (n) => ({ date: dayBack(n), pct: 30, done: [], all: ["x"] });
const gapOn = (n) => ({ date: dayBack(n), gap: true });

test("one day under the target does not break the run", () => {
  /* The day a run dies is never the day something was hard — it is the day
     something was impossible. Ninety days going to zero over one fever is
     what teaches people to stop looking at the number. */
  assert.equal(streakBaseFrom([miss(1), hit(2), hit(3), hit(4)]), 3);
  assert.equal(streakBaseFrom([hit(1), miss(2), hit(3), hit(4)]), 3);
  assert.equal(streakBaseFrom([hit(1), hit(2), miss(3), hit(4)]), 3);
});

test("the forgiven day is not counted in the run either", () => {
  /* Forgiven is not the same as counted. The number still means «days I
     actually cleared the bar», or the softening has inflated it. */
  const run = streakRunFrom([miss(1), hit(2), hit(3), hit(4)]);
  assert.equal(run.days, 3);
  assert.equal(run.forgiven, 1);
  assert.equal(run.since, dayBack(4));
});

test("two days in a row under the target end it", () => {
  /* One is the whole tolerance. Raising it is a decision about what the
     number means, not a tuning knob — so the test names it. */
  assert.equal(STREAK_FORGIVE, 1);
  assert.equal(streakBaseFrom([miss(1), miss(2), hit(3), hit(4)]), 0);
  assert.equal(streakBaseFrom([hit(1), miss(2), miss(3), hit(4)]), 1);
  assert.equal(streakBaseFrom([hit(1), hit(2), miss(3), miss(4), hit(5)]), 2);
});

test("a miss at the near end is forgiven, a miss at the far end is not credited", () => {
  /* Yesterday short, the run behind it intact: the run stands and yesterday
     adds nothing. */
  const near = streakRunFrom([miss(1), hit(2), hit(3)]);
  assert.equal(near.days, 2);
  assert.equal(near.forgiven, 1);
  /* And the miss that ENDS the walk was never stepped over by anything, so
     it is not reported as a tolerance that was used. */
  const far = streakRunFrom([hit(1), hit(2), hit(3)]);
  assert.equal(far.days, 3);
  assert.equal(far.forgiven, 0, "a tolerance was claimed that nothing used");
});

test("a day nobody recorded is forgiven like any other miss, and never counted", () => {
  /* A gap is a day he was away, and being away is exactly what the
     tolerance is for — but it still cannot be claimed as part of a run. */
  const run = streakRunFrom([gapOn(1), hit(2), hit(3)]);
  assert.equal(run.days, 2);
  assert.equal(run.forgiven, 1);
  assert.equal(streakBaseFrom([hit(1), gapOn(2), hit(3)]), 2);
  /* Two unrecorded days in a row are a stop, same as two short ones. */
  assert.equal(streakBaseFrom([gapOn(1), gapOn(2), hit(3), hit(4)]), 0);
  /* And a gap beside a short day is still two in a row. */
  assert.equal(streakBaseFrom([miss(1), gapOn(2), hit(3)]), 0);
});

test("an empty archive is a run of nothing, not a crash", () => {
  assert.equal(streakBaseFrom([]), 0);
  assert.equal(streakBaseFrom(null), 0);
  assert.deepEqual(streakRunFrom([]), { days: 0, forgiven: 0, since: null });
});

test("migrate recomputes the stored streak under the forgiving rule", () => {
  /* The counter was computed under the old rule, where one short day ended
     everything. Leaving it would leave the counter and the archive
     disagreeing about the same run. */
  const raw = fixture("schema-20.json");
  const out = migrate({
    ...raw,
    schema: 24,
    streakBase: 0,
    history: [miss(1), hit(2), hit(3), hit(4)],
  });
  assert.equal(out.streakBase, 3);
  /* A payload already on this schema keeps the number it brought. */
  const kept = migrate({ ...out, streakBase: 7 });
  assert.equal(kept.streakBase, 7);
});

/* ===================================================================== *
 *  النسخة الصغيرة — the floor under a habit
 * ===================================================================== */

test("habitShape gives every habit a floor and nothing else changes", () => {
  const h = habitShape({ id: "a", label: "نادي", group: "morning" });
  assert.equal(h.min, "");
  assert.equal(h.tiny, false);
  assert.equal(h.core, false);
  assert.equal(h.book, null);
  assert.equal(habitShape(null).label, "");
  assert.equal(habitShape({ min: "ع".repeat(300) }).min.length, HABIT_MIN_MAX);
});

test("a habit's group is kept exactly as written, never re-pointed", () => {
  /* blockRank lands an unknown id last and groupOf renders it in the night
     block; rewriting it here would move his habit on the strength of a
     damaged payload. */
  assert.equal(habitShape({ group: "evening" }).group, "evening");
});

test("tiny without done is not a state this app has", () => {
  assert.equal(habitShape({ done: false, tiny: true }).tiny, false);
  assert.equal(habitShape({ done: true, tiny: true }).tiny, true);
});

test("the floor survives every load, and the tiny mark does not survive the day", () => {
  const raw = fixture("schema-20.json");
  const first = raw.habits[0].id;
  const out = migrate({
    ...raw,
    schema: 24,
    habits: raw.habits.map((h) =>
      h.id === first ? { ...h, min: "عشر دقائق مشي", done: true, tiny: true } : h,
    ),
  });
  assert.equal(out.habits.find((h) => h.id === first).min, "عشر دقائق مشي");
  assert.equal(out.habits.find((h) => h.id === first).tiny, true);
  /* A new day unticks it and takes the mark with it: `tiny` is this day's
     answer about this habit, not a property of the habit. */
  const next = freshState(carryOf(out));
  assert.equal(next.habits.find((h) => h.id === first).min, "عشر دقائق مشي");
  assert.equal(next.habits.find((h) => h.id === first).tiny, false);
  assert.equal(next.habits.find((h) => h.id === first).done, false);
});

test("a tiny tick is a tick as far as the score is concerned", () => {
  /* It counts. A completion that pays out less than it costs is a
     completion nobody takes. */
  const habits = [
    { id: "a", done: true, tiny: true, core: true },
    { id: "b", done: true, tiny: false, core: true },
    { id: "c", done: false, tiny: false, core: true },
    { id: "d", done: false, tiny: false, core: true },
  ];
  assert.equal(disciplineOf(habits), 50);
  assert.equal(pctOfRow({ all: ["a", "b", "c", "d"], done: ["a", "b"] }, habits), 50);
});

/* ===================================================================== *
 *  وضع الرجوع — two days away, and no verdict waiting
 * ===================================================================== */

test("comebackFrom counts the unrecorded days immediately before today", () => {
  const h = [hit(5), hit(4), gapOn(3), gapOn(2), gapOn(1)];
  assert.equal(comebackFrom(h), 3);
  assert.equal(comebackFrom([hit(3), hit(2), gapOn(1)]), 1);
  assert.equal(comebackFrom([hit(3), gapOn(2), hit(1)]), 0);
});

test("a day that went to zero is not a day nobody recorded", () => {
  /* The whole reason gap rows exist: an empty square cannot otherwise say
     whether the day went to zero or was never opened. */
  assert.equal(comebackFrom([hit(3), miss(2), miss(1)]), 0);
  assert.equal(comebackFrom([hit(3), gapOn(2), miss(1)]), 0);
});

test("a missing row counts as unrecorded, a brand-new profile does not", () => {
  /* Nothing written for yesterday at all is the same fact as a gap row. */
  assert.equal(comebackFrom([hit(4), hit(3)]), 2);
  /* But a profile that starts today has not been away — greeting a new user
     with «رجعت» is nonsense, so the walk is floored at the first day he
     ever recorded. */
  assert.equal(comebackFrom([{ date: dayKey(), pct: 40, done: [], all: [] }]), 0);
  assert.equal(comebackFrom([]), 0);
  assert.equal(comebackFrom(null), 0);
});

test("the comeback threshold is two, and the walk is bounded", () => {
  assert.ok(COMEBACK_MIN === 2);
  /* A year of silence cannot walk a year of dates. */
  const long = [{ date: "2020-01-01", pct: 90, done: [], all: [] }];
  assert.ok(comebackFrom(long) <= GAP_REACH);
});

/* --- the sidebar's three groups ---------------------------------------
   A tab that belongs to no group does not throw and does not look wrong in
   any review: it simply stops being listed in the sidebar, because the
   column is built by walking the groups. The only place that is visible is
   on the screen, after it ships. So the grouping is held against the
   canonical tab list from both directions. */
test("every tab belongs to exactly one sidebar group", () => {
  const grouped = NAV_GROUPS.flatMap((g) => g.ids);

  const missing = NAV_IDS.filter((id) => !GROUP_OF_TAB.has(id));
  assert.deepEqual(missing, [], "tabs in no group would vanish from the sidebar");

  const unknown = grouped.filter((id) => !NAV_IDS.includes(id));
  assert.deepEqual(unknown, [], "a group naming a tab this build does not have");

  /* Listed twice, it would be drawn twice — in two different groups. */
  assert.equal(new Set(grouped).size, grouped.length, "a tab in two groups");
  assert.equal(grouped.length, NAV_IDS.length);

  /* Empty groups and nameless ones are both headings over nothing. */
  for (const g of NAV_GROUPS) {
    assert.ok(g.ids.length > 0, g.id + " is an empty group");
    assert.ok(g.label && g.label.trim().length > 0, g.id + " has no label");
  }
});

/* --- today's archive row, written from one place ----------------------
   The row used to be built inside an effect in LifeOS.jsx, which was fine
   while the app was the only writer of it. The Telegram bot ticks a habit
   from a phone, and a second writer with its own copy of this merge is a
   bug waiting for the day they disagree — so it moved down here and both
   call it. These tests are what hold the merge rule in place. */
test("stampToday derives the whole row from the state it is handed", () => {
  const s = freshState();
  const first = s.habits[0].id;
  const next = stampToday({
    ...s,
    habits: s.habits.map((h) => (h.id === first ? { ...h, done: true, tiny: true } : h)),
    water: 3,
  });
  const row = next.history.find((h) => h.date === dayKey());
  assert.ok(row);
  assert.deepEqual(row.done, [first]);
  assert.deepEqual(row.tiny, [first], "a floor is marked, and only marked");
  assert.equal(row.all.length, s.habits.length, "the roster as it stood");
  assert.equal(row.pct, disciplineOf(next.habits), "one reading of the score");
  assert.equal(row.water, 3);
  assert.equal(isGap(row), false);
});

test("today's row is merged, never rebuilt", () => {
  /* The row also carries the evening reflection and the accountability
     mirror. Rebuilding it from scratch on a habit toggle is how a paragraph
     written at ten at night disappears at ten past. */
  const s = freshState();
  const withText = stampToday({
    ...s,
    history: [{ date: dayKey(), distraction: "الجوال", fix: "أتركه بغرفة ثانية", mirror: "صدقت" }],
  });
  const row = withText.history.find((h) => h.date === dayKey());
  assert.equal(row.distraction, "الجوال");
  assert.equal(row.fix, "أتركه بغرفة ثانية");
  assert.equal(row.mirror, "صدقت");
  assert.ok(Array.isArray(row.done));
});

test("stampToday leaves every other day alone", () => {
  const s = freshState();
  const old = { date: addDays(dayKey(), -3), pct: 71, done: ["x"], all: ["x", "y"] };
  const next = stampToday({ ...s, history: [old] });
  assert.deepEqual(next.history.find((h) => h.date === old.date), old);
  assert.equal(next.history.length, 2);
});

test("the archive stays capped however often the row is stamped", () => {
  const s = freshState();
  const many = Array.from({ length: HISTORY_CAP + 20 }, (_, i) => ({
    date: addDays(dayKey(), -(HISTORY_CAP + 20 - i)),
    pct: 50,
    done: [],
    all: [],
  }));
  assert.equal(stampToday({ ...s, history: many }).history.length, HISTORY_CAP);
});

/* --- the money ---------------------------------------------------------
   Schema 27 gives the day two money lists and both of them a shape. The
   income rows predate the shape by a year, so `migrate` is the first thing
   that has ever normalised them — which is the only reason an amount
   hand-edited into a string cannot turn every total on the screen into NaN. */
test("a money row is written by its shape, and never carries a NaN", () => {
  const e = expenseShape({ label: "  غداء  ", amount: "35.456" });
  assert.equal(e.label, "غداء");
  assert.equal(e.amount, 35.46, "rounded to halalas");
  assert.equal(e.date, dayKey());
  assert.ok(e.id);

  /* Anything that is not a positive number becomes a zero, not a NaN: one
     NaN in a list makes every sum downstream unprintable. */
  for (const bad of ["كثير", null, undefined, -5, NaN, {}]) {
    assert.equal(expenseShape({ amount: bad }).amount, 0);
  }
  assert.equal(expenseShape(null).label, "مصروف");
  assert.equal(incomeShape(null).label, "عمل مرن");
  assert.equal(incomeShape({ amount: 10, hours: "ساعتين" }).hours, 0);
});

test("a hand-written date is kept and a broken one becomes today", () => {
  assert.equal(expenseShape({ amount: 1, date: "2027-01-05" }).date, "2027-01-05");
  assert.equal(expenseShape({ amount: 1, date: 1767571200000 }).date, dayKey());
});

test("the windows read day keys as strings, from the logical day", () => {
  const today = "2027-03-10";
  const list = [
    { amount: 10, date: today },
    { amount: 20, date: addDays(today, -6) },
    { amount: 40, date: addDays(today, -7) },
  ];
  /* Seven days means today and the six before it — the seventh is out. */
  assert.equal(amountSum(sinceDays(list, 7, today)), 30);
  assert.equal(amountSum(sinceDays(list, 30, today)), 70);
  assert.equal(amountSum(list), 70);
  assert.equal(amountSum(null), 0);
});

test("an hour with no hours recorded is no rate, never an infinite one", () => {
  const today = "2027-03-10";
  assert.equal(hourRate([{ amount: 300, date: today }], 30, today), 0);
  assert.equal(
    hourRate([{ amount: 300, hours: 4, date: today }], 30, today),
    75,
  );
  assert.equal(hoursSum([{ hours: 2 }, { hours: "3" }, { hours: null }]), 5);
});

test("the balance is signed, because a negative one is the fact worth seeing", () => {
  assert.equal(netBalance([{ amount: 100 }], [{ amount: 250 }]), -150);
  assert.equal(netBalance(null, null), 0);
});

test("schema 27 gives an older payload an empty expense list and keeps its income", () => {
  const before = {
    ...fixture("schema-20.json"),
    income: [{ id: "i1", date: "2027-01-05", label: "توصيل", amount: "300", hours: "4" }],
  };
  delete before.expenses;
  const after = migrate(before);
  assert.equal(after.schema, SCHEMA);
  assert.ok(Array.isArray(after.expenses));
  assert.equal(after.expenses.length, 0);
  assert.equal(after.income.length, 1);
  /* Normalised on the way in — the string amount was survivable only
     because nothing had ever summed it. */
  assert.equal(after.income[0].amount, 300);
  assert.equal(after.income[0].hours, 4);
  assert.equal(after.income[0].label, "توصيل");
  assert.equal(after.income[0].date, "2027-01-05", "a dated row keeps its date");
});

test("both money lists are bounded, so a phone cannot grow them forever", () => {
  const many = Array.from({ length: MONEY_CAP + 50 }, (_, i) => ({
    id: "e" + i,
    amount: 1,
    date: dayKey(),
  }));
  const after = migrate({ schema: SCHEMA, expenses: many, income: many });
  assert.equal(after.expenses.length, MONEY_CAP);
  assert.equal(after.income.length, MONEY_CAP);
});

test("a hole in either money list is dropped, not carried forward to throw", () => {
  const after = migrate({ schema: SCHEMA, expenses: [null, 7, "x", { amount: 5 }], income: [null] });
  assert.equal(after.expenses.length, 1);
  assert.equal(after.expenses[0].amount, 5);
  assert.equal(after.income.length, 0);
});

/* --- the Telegram bot's schedule ---------------------------------------
   It lives in the state and not in the bot's own .env for one reason: a
   schedule that can only be changed by editing a file on the machine the bot
   runs on is a schedule that never changes. These tests hold the shape the
   screen writes and the bot reads. */
test("migrate never turns a reminder on", () => {
  /* The same refusal as the core five and the habit floor. What the bot may
     interrupt him for is not a question a migration is in any position to
     answer, so an older payload arrives with every periodic reminder off and
     the screen asks. */
  const after = migrate(fixture("schema-20.json"));
  assert.equal(after.schema, SCHEMA);
  assert.equal(after.bot.water.on, false);
  assert.equal(after.bot.prayer.on, false);
  assert.equal(after.bot.tasks.on, false);
  assert.deepEqual(after.bot.customs, []);
  /* The two briefs are on, because a bot that greets you is the point. */
  assert.equal(after.bot.morningOn, true);
  assert.equal(after.bot.eveningOn, true);
  assert.equal(after.bot.morningAt, "07:00");
});

test("the schedule survives a day rollover whole", () => {
  /* A schedule has nothing to do with which day it is, so it carries — and a
     key missing from `carryOf` is data that exists all day and is gone by
     04:00 with nothing on screen to say why. */
  const s = freshState();
  const mine = botShape({ ...s.bot, morningAt: "06:30", water: { on: true, every: 90 } });
  const rolled = rollDay({ ...s, bot: mine, date: addDays(dayKey(), -1) });
  assert.equal(rolled.bot.morningAt, "06:30");
  assert.equal(rolled.bot.water.on, true);
  assert.equal(rolled.bot.water.every, 90);
});

test("botShape bounds every number and keeps every word", () => {
  const b = botShape({
    morningAt: "99:99",
    water: { every: 9999 },
    prayer: { before: -4 },
    tasks: { at: "7:5" },
  });
  assert.equal(b.morningAt, "07:00", "an unreadable time falls back, never to NaN");
  assert.equal(b.water.every, WATER_EVERY_MAX);
  assert.equal(b.prayer.before, 5, "clamped to the floor, not to zero");
  assert.equal(b.tasks.at, "17:00");
  assert.equal(botShape(null).on, true);
  assert.equal(botShape("nonsense").customs.length, 0);
});

test("a reminder with a long sentence is trimmed, never cleared", () => {
  /* Text the user typed is never silently deleted on the way through a shape
     that runs on every load. */
  const long = "ذ".repeat(400);
  const r = reminderShape({ text: long, at: "bad" });
  assert.equal(r.text.length, 120);
  assert.equal(r.at, "09:00", "a reminder with no hour cannot be armed");
  assert.equal(r.on, true);
  assert.ok(r.id);
});

test("an all-seven day list and an empty one are one shape, not two", () => {
  assert.deepEqual(reminderShape({ days: [0, 1, 2, 3, 4, 5, 6] }).days, []);
  assert.deepEqual(reminderShape({ days: [3, 3, 1, 99, "x"] }).days, [1, 3]);
  assert.equal(onDay({ days: [] }, 4), true);
  assert.equal(onDay({ days: [1] }, 4), false);
  assert.equal(onDay({}, 0), true);
});

test("an older reminder is read by what it already says, never guessed", () => {
  /* The shape is the migration here, so the one thing it must not do is
     change what an existing row did. Days picked meant «هذي الأيام» and no
     days meant «كل يوم» — which is exactly `week` and `day`. */
  assert.equal(reminderShape({ text: "ت", days: [5] }).repeat, "week");
  assert.equal(reminderShape({ text: "ت" }).repeat, "day");
  assert.equal(reminderShape({ text: "ت", days: [0, 1, 2, 3, 4, 5, 6] }).repeat, "day");
  assert.equal(reminderShape({ text: "ت", repeat: "nonsense" }).repeat, "day");
  /* And the condition an existing reminder had is the one it keeps. */
  assert.equal(reminderShape({ text: "ت" }).only, "always");
  assert.equal(reminderShape({ text: "ت", only: "خرابيط" }).only, "always");
  assert.equal(reminderShape({ text: "ت", only: "water" }).only, "water");
  assert.equal(reminderShape({ text: "ت", dom: 99 }).dom, DOM_MAX);
  assert.equal(reminderShape({ text: "ت", dom: 0 }).dom, DOM_MIN);
});

test("a monthly reminder lands on the last day of a month too short for it", () => {
  /* The rule worth stating out loud: «يوم ٣١» must not skip February. A
     month skipped is a bill unpaid, and the last day of a short month is
     what somebody who typed 31 actually meant. */
  const r = reminderShape({ text: "سدّد", repeat: "month", dom: 31 });
  assert.equal(firesOn(r, whenOf(new Date(2027, 1, 28))), true, "28 Feb is February's 31st");
  assert.equal(firesOn(r, whenOf(new Date(2027, 1, 27))), false);
  assert.equal(firesOn(r, whenOf(new Date(2027, 2, 31))), true, "March has a real 31st");
  assert.equal(firesOn(r, whenOf(new Date(2027, 2, 28))), false, "and March's 28th is not it");
  /* A leap February has a 29th, and that is the day it lands on. */
  assert.equal(firesOn(r, whenOf(new Date(2028, 1, 29))), true);
  assert.equal(firesOn(r, whenOf(new Date(2028, 1, 28))), false);
  /* The ordinary case is still the ordinary case. */
  const first = reminderShape({ text: "سدّد", repeat: "month", dom: 1 });
  assert.equal(firesOn(first, whenOf(new Date(2027, 1, 1))), true);
  assert.equal(firesOn(first, whenOf(new Date(2027, 1, 2))), false);
  /* A daily row ignores both of the other two fields. */
  const daily = reminderShape({ text: "ت", repeat: "day", days: [3], dom: 9 });
  assert.equal(firesOn(daily, whenOf(new Date(2027, 1, 2))), true);
});

test("the plan arms a monthly reminder on its day and on no other", () => {
  const bot = botShape({
    morningOn: false,
    eveningOn: false,
    customs: [{ text: "سدّد الفواتير", at: "10:00", repeat: "month", dom: 31 }],
  });
  const on28 = planDay(bot, { date: new Date(2027, 1, 28, 8, 0) });
  assert.deepEqual(on28.filter(p => p.kind === "custom").map((p) => p.kind), ["custom"]);
  assert.equal(on28.find(p => p.kind === "custom").at, 600);
  assert.deepEqual(planDay(bot, { date: new Date(2027, 1, 27, 8, 0) }).filter(p => p.kind === "custom"), []);
  /* A weekly one is the same row with a day list, and it fires on that day
     alone — 5 March 2027 is a Friday and the 4th is a Thursday. */
  const weekly = botShape({
    morningOn: false,
    eveningOn: false,
    customs: [{ text: "خطّط الأسبوع", at: "20:00", repeat: "week", days: [5] }],
  });
  assert.equal(planDay(weekly, { date: new Date(2027, 2, 5) }).filter(p => p.kind === "custom").length, 1);
  assert.equal(planDay(weekly, { date: new Date(2027, 2, 4) }).filter(p => p.kind === "custom").length, 0);
});

test("a conditional reminder is armed anyway, and the gate answers later", () => {
  /* The same arrangement the coach has: whether there is anything worth
     saying is a question about a day that is still hours away when the plan
     is built, so the timer is armed and the sentence is what stays silent. */
  const bot = botShape({
    morningOn: false,
    eveningOn: false,
    customs: [{ text: "اشرب", at: "14:00", only: "water" }],
  });
  const plan = planDay(bot, { date: new Date(2027, 2, 1, 9, 0) });
  assert.deepEqual(plan.filter(p => p.kind === "custom").map((p) => p.kind), ["custom"]);
  assert.equal(plan.find(p => p.kind === "custom").only, "water", "the gate rides out with the entry");
});

test("a gate reads the day as it stands and hands back what it looked at", () => {
  const s = freshState();
  /* Nothing done yet, so every gate has something to be about. */
  assert.equal(gateOf(s, "always").pass, true);
  assert.equal(gateOf(s, "habits").pass, true);
  assert.ok(gateOf(s, "habits").habits.length > 0, "the habits ride back for the tick row");
  assert.equal(gateOf(s, "water").pass, true);
  assert.equal(gateOf(s, "water").left, clampGoal(s.waterGoal));
  assert.equal(gateOf(s, "water").water, true);
  /* An unknown condition is «بلا شرط» and never a reminder that never fires:
     a hand-edited payload must not be able to silence a row for good. */
  assert.equal(gateOf(s, "خرابيط").pass, true);

  const done = {
    ...s,
    habits: s.habits.map((h) => ({ ...h, done: true })),
    tasks: s.tasks.map((t) => ({ ...t, done: true })),
    water: clampGoal(s.waterGoal),
    reading: [{ date: dayKey(), pages: 500, habit: "x" }],
  };
  assert.equal(gateOf(done, "habits").pass, false, "nothing left to ask about");
  assert.equal(gateOf(done, "tasks").pass, false);
  assert.equal(gateOf(done, "water").pass, false);
  assert.equal(gateOf(done, "read").pass, false);
});

test("the next firing is read off the same rule the plan is armed from", () => {
  const noon = new Date(2027, 1, 5, 12, 0, 0);
  /* Today's hour has gone, so the next one is tomorrow's. */
  const daily = { text: "ت", at: "09:00", repeat: "day" };
  assert.equal(nextFireOf(daily, noon).getDate(), 6);
  assert.equal(nextFireOf({ ...daily, at: "20:00" }, noon).getDate(), 5, "still ahead today");
  /* The 31st of a February, which is the 28th. */
  const monthly = { text: "ت", at: "10:00", repeat: "month", dom: 31 };
  const next = nextFireOf(monthly, noon);
  assert.equal(next.getMonth(), 1);
  assert.equal(next.getDate(), 28);
  assert.equal(next.getHours(), 10);
  /* A switched-off reminder has no next firing, and neither has one whose
     day list is a day it never reaches. */
  assert.equal(nextFireOf({ ...daily, on: false }, noon), null);
});

test("every idea offered with one tap is a reminder the shape accepts", () => {
  /* Seeds, and never written by a migration — what the bot may interrupt him
     for is his answer. But an idea that the shape would normalise into
     something else is an idea that lies about what the tap will add. */
  for (const idea of REMINDER_IDEAS) {
    const r = reminderShape(idea);
    assert.equal(r.text, idea.text);
    assert.equal(r.at, idea.at);
    assert.equal(r.repeat, idea.repeat);
    if (idea.repeat === "month") assert.equal(r.dom, idea.dom);
    if (idea.repeat === "week") assert.deepEqual(r.days, idea.days);
    assert.equal(r.only, idea.only || "always");
  }
  assert.ok(REMINDER_IDEAS.length <= REMINDER_CAP, "a row of ideas must fit the list");
});

test("the custom list is bounded like every list a phone can feed", () => {
  const many = Array.from({ length: REMINDER_CAP + 10 }, (_, i) => ({ text: "ت" + i, at: "09:00" }));
  assert.equal(botShape({ customs: many }).customs.length, REMINDER_CAP);
});

/* 1 March 2027 is a Monday. Every plan test below is asked about one real
   day rather than about a weekday number: a monthly reminder needs the date
   and the length of the month too, and `planDay` reads all three out of the
   one `date` it is handed. */
const MONDAY = new Date(2027, 2, 1, 9, 0, 0);

test("planDay is sorted, bounded to the day, and silent when switched off", () => {
  const bot = botShape({
    morningAt: "07:00",
    eveningAt: "20:00",
    water: { on: true, every: 120, from: "08:00", to: "12:00" },
    prayer: { on: true, before: 15 },
    tasks: { on: true, at: "17:00" },
  });
  const prayers = { fajr: 5, sunrise: 6.2, dhuhr: 12, asr: 15.5, maghrib: 18, isha: 19.5 };
  const plan = planDay(bot, { date: MONDAY, prayers, hasTasks: true });
  const mins = plan.map((p) => p.at);
  assert.deepEqual([...mins].sort((a, b) => a - b), mins, "sorted");
  assert.ok(mins.every((m) => m >= 0 && m < 1440), "inside the day");
  /* 15 minutes before Dhuhr at 12:00. */
  assert.ok(plan.some((p) => p.kind === "prayer" && p.prayer === "dhuhr" && p.at === 11 * 60 + 45));
  /* A prayer the sun never reaches contributes nothing rather than a NaN. */
  const polar = planDay(bot, { date: MONDAY, prayers: { fajr: null, dhuhr: 12 }, hasTasks: true });
  assert.ok(polar.every((p) => Number.isFinite(p.at)));

  assert.deepEqual(planDay(botShape({ on: false }), { date: MONDAY }), []);
});

test("the task sweep is armed only when there is something to sweep", () => {
  const bot = botShape({ morningOn: false, eveningOn: false, tasks: { on: true, at: "17:00" } });
  const withTasks = planDay(bot, { date: MONDAY, hasTasks: true });
  assert.equal(withTasks.filter(p => p.kind === "tasks").length, 1);
  
  const withoutTasks = planDay(bot, { date: MONDAY, hasTasks: false });
  assert.equal(withoutTasks.filter(p => p.kind === "tasks").length, 0);
});

test("nextInPlan reads the day forward and runs out at the end of it", () => {
  const plan = [{ at: 420 }, { at: 1200 }];
  assert.equal(nextInPlan(plan, 0).at, 420);
  assert.equal(nextInPlan(plan, 420).at, 1200, "a moment already passed is not next");
  assert.equal(nextInPlan(plan, 1300), null);
});

/* ===================================================================== *
 *  the focus desk — the rhythm, the run, and the minutes it writes down
 *
 *  Two of these exist because of the bug this file was written to prevent:
 *  a run found already over on load used to be logged unconditionally,
 *  which turns a laptop closed overnight into ninety minutes of work that
 *  never happened — and the *paused* case used to be dropped outright,
 *  which threw away minutes that were known exactly. `settleRun` is the
 *  line between those two and is tested from both sides.
 * ===================================================================== */

test("a preset bounds every number and keeps the name typed", () => {
  const p = presetShape({ label: "  دورة  ", min: 999, brk: 0, long: 1, every: 99 });
  assert.equal(p.label, "دورة", "a label is trimmed, never cleared");
  assert.equal(p.min, 180);
  assert.equal(p.brk, 1);
  assert.equal(p.long, 5);
  assert.equal(p.every, EVERY_MAX);
  assert.ok(p.id, "a preset without an id gets one");

  const bad = presetShape({ min: "خمسة", brk: NaN, long: null, every: undefined });
  for (const k of ["min", "brk", "long", "every"])
    assert.ok(Number.isFinite(bad[k]), k + " is a number, never NaN");
});

test("focusShape seeds a usable desk and never turns a switch on by itself", () => {
  const f = focusShape(null);
  assert.equal(f.presets.length, SEED_PRESETS().length);
  assert.ok(
    f.presets.some((p) => p.id === f.pick),
    "the picked rhythm is one that exists",
  );
  assert.equal(f.goal, FOCUS_GOAL_DEFAULT);
  assert.equal(f.run, null);
  assert.equal(f.round, 0);
  /* The same refusal as the core five and the habit floor: what the screen
     may do without being asked is not a question a shape can answer. */
  assert.equal(f.autoDone, false, "a finished round must not silently tick a task");
  assert.equal(f.autoNext, false, "a round nobody chose is a round nobody committed to");
  /* And the one default that is deliberately on, because the break is the
     half of the technique that gets skipped. */
  assert.equal(f.autoBreak, true);

  /* An empty list is not a choice the editor allows, so it is damage. */
  assert.equal(focusShape({ presets: [] }).presets.length, SEED_PRESETS().length);
  assert.equal(focusShape({ presets: [null, 3, "x"] }).presets.length, SEED_PRESETS().length);
  /* A pick naming a rhythm that is gone falls back rather than dangling. */
  const gone = focusShape({ pick: "nope" });
  assert.ok(gone.presets.some((p) => p.id === gone.pick));
});

test("the preset list is bounded, so the chooser never becomes the decision", () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ label: "أ" + i, min: 25 }));
  assert.equal(focusShape({ presets: many }).presets.length, PRESET_CAP);
});

test("presetFor can always answer, even for a rhythm deleted mid-round", () => {
  const f = focusShape({});
  assert.equal(presetFor(f, f.presets[1].id).id, f.presets[1].id);
  assert.equal(presetFor(f, "deleted").id, f.pick, "falls back to the picked one");
  assert.ok(presetFor({ presets: [] }, "x").min > 0, "and to a shape when there is nothing");
});

/* --- the run ---------------------------------------------------------- */

test("a run is armed paused, starts off an absolute deadline, and pauses without loss", () => {
  const t0 = Date.UTC(2027, 2, 3, 9, 0, 0);
  const armed = armRun({ phase: "focus", planned: 25, now: t0 });
  assert.equal(runRunning(armed), false, "arming does not start the clock");
  assert.equal(runLeft(armed, t0), 25 * 60);

  const going = startRun(armed, t0);
  assert.equal(going.endAt, t0 + 25 * 60 * 1000);
  assert.equal(runRunning(going), true);
  assert.equal(runLeft(going, t0 + 10 * 60 * 1000), 15 * 60, "counted off the deadline");

  const held = pauseRun(going, t0 + 10 * 60 * 1000);
  assert.equal(held.endAt, null);
  assert.equal(runLeft(held, t0 + 99 * 60 * 1000), 15 * 60, "a pause of any length costs nothing");
  assert.equal(spentMinutes(held, t0), 10, "and the minutes worked are known exactly");

  const back = startRun(held, t0 + 60 * 60 * 1000);
  assert.equal(runLeft(back, t0 + 60 * 60 * 1000), 15 * 60, "resuming keeps the remainder");

  /* A clock reading from before the round started must not report more
     time left than the round has. The screen ticks `now` only while
     something counts, so the render in which a round starts holds a stale
     one — and the dial flashed «25:17» on a 25-minute round until this
     bound existed. */
  assert.equal(runLeft(going, t0 - 17 * 1000), 25 * 60, "never more than it was planned for");
});

test("runShape keeps a run across a reload and refuses one that is not a run", () => {
  const t0 = Date.now();
  const going = startRun(armRun({ phase: "long", planned: 30, now: t0 }), t0);
  const back = runShape(JSON.parse(JSON.stringify(going)));
  assert.deepEqual(back, going, "a run survives a round trip through the disk unchanged");

  assert.equal(runShape(null), null);
  assert.equal(runShape({ phase: "nonsense", planned: 25 }), null);
  assert.equal(
    runShape({ phase: "focus", left: 0, endAt: null }),
    null,
    "no deadline and nothing left is not a run",
  );
  /* «خمس دقائق أخرى» raises `planned` past any one preset's ceiling, and a
     reload must not clamp it back down and lose those minutes. */
  const long = runShape({ phase: "focus", planned: 300, left: 300 * 60, endAt: null });
  assert.equal(long.planned, 300);
});

test("settleRun writes down the bell that rang into an empty room", () => {
  const t0 = Date.now() - 20 * 60 * 1000;
  const run = startRun(armRun({ phase: "focus", planned: 15, taskId: "t1", now: t0 }), t0);
  assert.equal(runDone(run), true);
  const out = settleRun(run);
  assert.equal(out.rang, true);
  assert.equal(out.dropped, false);
  assert.equal(out.run, null);
  assert.equal(out.log.minutes, 15);
  assert.equal(out.log.full, true);
  assert.equal(out.log.taskId, "t1");
});

test("settleRun never invents the minutes of a laptop that was shut", () => {
  /* Started long enough ago that the deadline itself is past the staleness
     window — the window is measured from the *deadline*, not from the
     start, so an exactly-boundary case is deliberately not what is tested
     here: `runStale` is strictly greater, and a run that went stale on the
     very millisecond is still a run. */
  const t0 = Date.now() - RUN_STALE_MS - 91 * 60 * 1000;
  const run = startRun(armRun({ phase: "focus", planned: 90, now: t0 }), t0);
  assert.equal(runStale(run), true);
  const out = settleRun(run);
  assert.equal(out.dropped, true);
  assert.equal(out.rang, false);
  assert.equal(out.run, null);
  assert.equal(
    out.log,
    null,
    "a round still counting when it went stale writes nothing — nobody can say when he left it",
  );
});

test("settleRun keeps the minutes a pause recorded exactly, however long ago", () => {
  const t0 = Date.now() - RUN_STALE_MS - 60 * 60 * 1000;
  const held = pauseRun(
    startRun(armRun({ phase: "focus", planned: 50, now: t0 }), t0),
    t0 + 32 * 60 * 1000,
  );
  const out = settleRun(held);
  assert.equal(out.dropped, true);
  assert.ok(out.log, "a paused round is the one case the amount worked is known");
  assert.equal(out.log.minutes, 32);
  assert.equal(out.log.full, false, "and it is marked for what it is");
});

test("settleRun leaves a run that is still going alone", () => {
  const t0 = Date.now();
  const run = startRun(armRun({ phase: "focus", planned: 25, now: t0 }), t0);
  const out = settleRun(run, t0 + 60 * 1000);
  assert.equal(out.run, run);
  assert.equal(out.log, null);
  assert.equal(out.rang, false);
  assert.equal(out.dropped, false);
});

test("a break leaves no row in a list that has always meant «جلسة تركيز»", () => {
  const t0 = Date.now();
  for (const phase of ["short", "long"]) {
    const r = startRun(armRun({ phase, planned: 10, now: t0 }), t0);
    assert.equal(sessionOf(r, { minutes: 10 }), null, phase + " is rest, not work");
    assert.equal(settleRun(r, t0 + 11 * 60 * 1000).log, null);
  }
});

test("a round under a minute is a misclick, not a session", () => {
  const t0 = Date.now();
  const r = startRun(armRun({ phase: "focus", planned: 25, now: t0 }), t0);
  assert.equal(sessionOf(r, { now: t0 + 20 * 1000 }), null);
  assert.ok(sessionOf(r, { now: t0 + 60 * 1000 }), "a whole minute is");
  assert.equal(manualSession({ minutes: 0 }), null);
  assert.equal(manualSession({ minutes: MIN_LOGGED }).minutes, MIN_LOGGED);
});

test("a round is dated by the logical day it was started in", () => {
  /* 03:45 belongs to the night that is still going on, not to the morning
     the bell rings in — the same boundary every other part of the app
     keeps. Built off today so the test cannot rot. */
  const d = new Date();
  const small = new Date(d.getFullYear(), d.getMonth(), d.getDate(), DAY_START_HOUR - 1, 45);
  const row = manualSession({ minutes: 30, at: small.getTime() });
  const before = new Date(small.getFullYear(), small.getMonth(), small.getDate() - 1);
  assert.equal(row.date, fmtDay(before), "a round at 03:45 files under the day before");
});

test("a stopped round is written down as the minutes it actually was", () => {
  const t0 = Date.now();
  const run = startRun(armRun({ phase: "focus", planned: 90, now: t0 }), t0);
  const row = sessionOf(run, { full: false, now: t0 + 80 * 60 * 1000 });
  assert.equal(row.minutes, 80, "eighty minutes of a ninety-minute round still happened");
  assert.equal(row.planned, 90);
  assert.equal(row.full, false, "and the row says it fell short rather than rounding itself up");
});

/* --- the shape an older row arrives in -------------------------------- */

test("a session row written before schema 29 keeps its meaning", () => {
  const old = sessionShape({ id: "s1", date: "2027-01-05", minutes: 25, taskId: "t9" });
  assert.equal(old.minutes, 25);
  assert.equal(old.planned, 25, "an older row planned exactly what it did");
  assert.equal(old.full, true, "the old timer only ever wrote a row on completion");
  assert.equal(old.at, null, "and it never knew the hour");
  assert.equal(old.interrupts, 0);
  assert.equal(old.id, "s1", "its id is kept, so nothing is re-keyed");

  const junk = sessionShape({ minutes: "خمس", interrupts: 9999, note: "x".repeat(400) });
  assert.ok(Number.isFinite(junk.minutes));
  assert.equal(junk.interrupts, INTERRUPT_MAX);
  assert.equal(junk.note.length, 160, "a long note is trimmed, never cleared");
});

test("migrate gives an older payload a focus desk and loses no round", () => {
  const before = {
    schema: 28,
    sessions: [
      { id: "a", date: "2027-01-05", minutes: 25, taskId: null },
      { id: "b", date: "2027-01-06", minutes: 90, taskId: "t1" },
    ],
  };
  const out = migrate(before);
  assert.equal(out.schema, SCHEMA);
  assert.equal(out.sessions.length, 2);
  assert.deepEqual(
    out.sessions.map((s) => s.minutes),
    [25, 90],
  );
  assert.ok(out.sessions.every((s) => s.full === true && s.planned === s.minutes));
  assert.ok(out.focus.presets.length > 0, "and a desk to run them on");
  assert.equal(out.focus.run, null);
  assert.equal(out.focus.autoDone, false, "migrate never restores the silent tick");
});

test("the session list is bounded, because a phone could feed it forever", () => {
  const many = Array.from({ length: SESSION_CAP + 60 }, (_, i) => ({
    id: "s" + i,
    date: "2027-01-05",
    minutes: 25,
  }));
  const out = migrate({ schema: 28, sessions: many });
  assert.equal(out.sessions.length, SESSION_CAP);
  assert.equal(out.sessions[0].id, "s60", "the oldest go, never the newest");

  let list = [];
  for (let i = 0; i < SESSION_CAP + 10; i += 1)
    list = addSession(list, { id: "x" + i, date: dayKey(), minutes: 5 });
  assert.equal(list.length, SESSION_CAP);
  assert.equal(addSession(list, null).length, SESSION_CAP, "nothing to add is not a truncation");
});

test("the focus desk crosses a day rollover, but its cycle count does not", () => {
  const t0 = Date.now();
  const f = focusShape({
    round: 3,
    goal: 180,
    autoNext: true,
    run: startRun(armRun({ phase: "focus", planned: 90, now: t0 }), t0),
  });
  const next = focusCarry(f);
  assert.equal(next.round, 0, "four rounds yesterday must not hand today a long break");
  assert.equal(next.goal, 180);
  assert.equal(next.autoNext, true);
  assert.ok(next.run, "a round begun at 03:50 is still being worked at 04:01");
  assert.equal(next.run.endAt, f.run.endAt);
  /* And the same through the door the app actually uses. */
  const rolled = freshState(carryOf({ ...freshState(), focus: f }));
  assert.equal(rolled.focus.round, 0);
  assert.equal(rolled.focus.goal, 180);
  assert.ok(rolled.focus.run);
});

/* --- the rhythm ------------------------------------------------------- */

test("the long break lands every N rounds and carries its own length", () => {
  const p = presetShape({ min: 25, brk: 5, long: 15, every: 4 });
  assert.equal(nextBreak(p, 1), "short");
  assert.equal(nextBreak(p, 3), "short");
  assert.equal(nextBreak(p, 4), "long", "the fourth round earns the long one, not the fifth");
  assert.equal(nextBreak(p, 8), "long");
  assert.equal(nextBreak(p, 0), "short", "and nothing earns it before the first round");

  assert.equal(breakMinutes(p, "short"), 5);
  assert.equal(breakMinutes(p, "long"), 15);
  /* The pairing is the whole point of a preset: a ninety-minute cycle
     followed by five minutes is not a rhythm. */
  const deep = presetShape({ min: 90, brk: 20, long: 30, every: 2 });
  assert.equal(breakMinutes(deep, "short"), 20);
  assert.equal(nextBreak(deep, 2), "long");

  assert.equal(tillLong(p, 0), 4);
  assert.equal(tillLong(p, 3), 1);
  assert.equal(tillLong(p, 4), 4, "a finished cycle starts the count over");
});

test("isBreak tells rest from work, and nothing else is rest", () => {
  assert.equal(isBreak("focus"), false);
  assert.equal(isBreak("short"), true);
  assert.equal(isBreak("long"), true);
  assert.equal(isBreak(undefined), false);
});

/* --- the readings ----------------------------------------------------- */

const focusRows = (spec) =>
  spec.map(([date, minutes, extra = {}], i) =>
    sessionShape({ id: "f" + i, date, minutes, ...extra }),
  );

test("focusDay counts a day once, and says how many rounds went the distance", () => {
  const today = dayKey();
  const list = focusRows([
    [today, 25, { full: true, interrupts: 1 }],
    [today, 18, { full: false, planned: 25, interrupts: 3 }],
    [addDays(today, -1), 50, { full: true }],
  ]);
  const d = focusDay(list, today);
  assert.equal(d.minutes, 43);
  assert.equal(d.rounds, 2);
  assert.equal(d.full, 1);
  assert.equal(d.interrupts, 4);
  assert.equal(focusDay(list, addDays(today, -1)).minutes, 50);
  assert.equal(focusDay([], today).minutes, 0, "an empty list is a zero, not a throw");
});

test("a focus streak whose last qualifying day was yesterday still counts today", () => {
  const today = dayKey();
  const list = focusRows([
    [addDays(today, -1), 120],
    [addDays(today, -2), 130],
  ]);
  assert.equal(focusStreak(list, 120), 2, "the day is not over, so it is not broken");
  /* Today joining the run extends it rather than restarting it. */
  assert.equal(focusStreak([...list, ...focusRows([[today, 120]])], 120), 3);
  /* A day under the goal ends it — this meter forgives nothing, unlike the
     discipline streak, because it is a dose and not a day's verdict. */
  const broken = focusRows([
    [addDays(today, -1), 10],
    [addDays(today, -2), 200],
  ]);
  assert.equal(focusStreak(broken, 120), 0);
  assert.equal(focusStreak(list, 0), 0, "no goal is no streak, never an infinite one");
});

test("the week is seven rows, and a day with no work is a zero and not a hole", () => {
  const today = dayKey();
  const week = focusWeek(
    focusRows([
      [today, 30],
      [addDays(today, -3), 60],
    ]),
    7,
    today,
  );
  assert.equal(week.length, 7);
  assert.equal(week[6].date, today, "oldest first, today last");
  assert.equal(week[6].minutes, 30);
  assert.equal(week[3].minutes, 60);
  assert.equal(week[0].minutes, 0);
  assert.ok(week.every((d) => typeof d.minutes === "number"));
});

test("the month's average is taken over every day, not only the days that worked", () => {
  const today = dayKey();
  const span = focusSpan(focusRows([[today, 300]]), 30, today);
  assert.equal(span.total, 300);
  assert.equal(span.active, 1);
  assert.equal(
    span.perDay,
    10,
    "an average over «the days with work» improves every time one is missed",
  );
  assert.equal(span.best.minutes, 300);
  assert.equal(span.best.date, today);
  assert.equal(focusSpan([], 30, today).total, 0);
});

test("minutes per task survive the task being deleted", () => {
  const today = dayKey();
  const list = focusRows([
    [today, 50, { taskId: "t1", label: "تقرير" }],
    [today, 25, { taskId: "t1", label: "تقرير" }],
    [today, 40, { taskId: "gone", label: "عرض قديم" }],
    [today, 10, {}],
  ]);
  const out = focusByTask(list, [{ id: "t1", text: "تقرير الفصل" }], 7, today);
  assert.equal(out[0].minutes, 75);
  assert.equal(out[0].label, "تقرير الفصل", "the live task's current name wins");
  const dead = out.find((r) => r.taskId === "gone");
  assert.equal(dead.label, "عرض قديم", "a deleted task does not erase the afternoon it took");
  assert.equal(dead.gone, true);
  assert.ok(out.find((r) => r.label === "بلا مهمة محدّدة"));
  const mins = out.map((r) => r.minutes);
  assert.deepEqual(mins, [...mins].sort((a, b) => b - a), "biggest first");
});

test("the hour bands count only the rows that know their hour, and say what they left out", () => {
  const today = dayKey();
  const at = (h) => {
    const d = new Date();
    d.setHours(h, 30, 0, 0);
    return d.getTime();
  };
  const list = focusRows([
    [today, 60, { at: at(6) }],
    [today, 30, { at: at(7) }],
    [today, 20, { at: at(22) }],
    [today, 90, {}],
  ]);
  const out = focusBands(list, 7, today);
  assert.equal(out.known, 3);
  assert.equal(out.missing, 1, "an older row knows its day and not its hour");
  assert.equal(out.bands.find((b) => b.id === "dawn").minutes, 90);
  assert.equal(out.bands.find((b) => b.id === "night").minutes, 20);
  assert.equal(bestBand(list, 7, today).id, "dawn");
  /* One round is not a pattern. */
  assert.equal(bestBand(focusRows([[today, 60, { at: at(6) }]]), 7, today), null);
  assert.equal(bestBand([], 7, today), null);
});

test("the interruption rate is null with nothing to divide by, never a clean sheet", () => {
  const today = dayKey();
  assert.equal(interruptRate([], 7, today), null);
  assert.equal(interruptRate(focusRows([[today, 25, { interrupts: 0 }]]), 7, today), 0);
  const two = focusRows([
    [today, 25, { interrupts: 3 }],
    [today, 25, { interrupts: 0 }],
  ]);
  assert.equal(interruptRate(two, 7, today), 1.5);
});

test("a whole cycle runs the way the screen draws it", () => {
  /* Four rounds of twenty-five, the fourth earning the long break — the
     bookkeeping the end-of-phase handler performs, stated once here so the
     rhythm cannot drift from what the state layer says it is. */
  const p = presetShape({ min: 25, brk: 5, long: 15, every: 4 });
  let round = 0;
  let minutes = 0;
  const breaks = [];
  for (let i = 0; i < 4; i += 1) {
    const t0 = Date.now() - 60 * 60 * 1000;
    const run = startRun(armRun({ phase: "focus", planned: p.min, presetId: p.id, now: t0 }), t0);
    const out = settleRun(run);
    assert.ok(out.rang);
    minutes += out.log.minutes;
    round += 1;
    const brk = nextBreak(p, round);
    breaks.push(brk);
    if (brk === "long") round = 0;
  }
  assert.deepEqual(breaks, ["short", "short", "short", "long"]);
  assert.equal(minutes, 100);
  assert.equal(round, 0, "and the cycle starts over");
  assert.ok(ROUND_MAX >= p.min);
});