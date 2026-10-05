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
  SCHEMA,
  CORE_CAP,
  TOP_TASK_CAP,
  DAY_START_HOUR,
  MORE_IDS,
  NAV_IDS,
  orderNavIds,
  dayKey,
  yesterdayKey,
  fmtDay,
  logicalNow,
  freshState,
  carryOf,
  rollDay,
  migrate,
  scoredOf,
  disciplineOf,
  coreOf,
  bookShape,
  goalShape,
} from "../life-state.mjs";

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
  "prompts",
  "reviews",
  "pipeline",
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
  assert.equal(rolled.history.length, stale.history.length);
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

test("rollDay banks the streak only on a continued day", () => {
  const base = migrate(fixture("schema-20.json"));
  const banked = rollDay({ ...base, date: yesterdayKey(), dayBanked: true, streakBase: 4 });
  assert.equal(banked.streakBase, 5);
  const dropped = rollDay({ ...base, date: yesterdayKey(), dayBanked: false, streakBase: 4 });
  assert.equal(dropped.streakBase, 0);
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
 *  the tabs
 * ===================================================================== */

const MAIN_IDS = NAV_IDS.filter((id) => !MORE_IDS.includes(id));

test("orderNavIds keeps the saved order, drops the unknown, appends the new", () => {
  const saved = ["vault", "routine", "not-a-tab", "vault"];
  const out = orderNavIds(saved);
  assert.equal(out[0], "vault");
  assert.equal(out[1], "routine");
  assert.equal(out.length, MAIN_IDS.length, "a tab was hidden or doubled");
  assert.equal(new Set(out).size, out.length, "a tab appears twice");
  for (const id of MAIN_IDS) assert.ok(out.includes(id), id + " is unreachable");
});

test("orderNavIds survives junk", () => {
  for (const junk of [null, undefined, 7, "routine", [null, 3]]) {
    assert.deepEqual(orderNavIds(junk), MAIN_IDS);
  }
});

/* The knowledge map moved behind «المزيد» in schema 21. It still exists and
   still has a screen — what it no longer has is a row in the list the user
   orders, and no saved payload may put one back. */
test("a MORE_IDS tab is a tab, and is kept out of the ordered list", () => {
  assert.ok(MORE_IDS.length, "the overflow list is empty");
  for (const id of MORE_IDS) {
    assert.ok(NAV_IDS.includes(id), id + " is not a tab at all");
    assert.ok(!orderNavIds(null).includes(id), id + " is still in the order");
    assert.ok(
      !orderNavIds([id, "routine"]).includes(id),
      id + " came back from a saved order",
    );
  }
});

test("migrate takes an overflow tab out of a schema-20 order without moving the rest", () => {
  const saved = {
    schema: 20,
    navOrder: ["routine", "graph", "agenda", "uni", "career"],
  };
  const out = migrate(saved);
  assert.ok(!out.navOrder.includes("graph"), "graph is still in the sidebar");
  assert.deepEqual(
    out.navOrder.slice(0, 4),
    ["routine", "agenda", "uni", "career"],
    "the tabs around it were reshuffled",
  );
  assert.equal(out.navOrder.length, MAIN_IDS.length);
  assert.equal(new Set(out.navOrder).size, out.navOrder.length);
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
