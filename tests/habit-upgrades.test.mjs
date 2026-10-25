import test from "node:test";
import assert from "node:assert/strict";
import {
  IDENTITIES,
  identityScores,
  contextualBlock,
  chainedHabits,
  freezeShape,
  habitShape,
  HABIT_LEVEL_POINTS,
} from "../src/state/life-state.mjs";

test("IDENTITIES defines all 5 key persona pillars", () => {
  assert.ok(IDENTITIES.scholar);
  assert.ok(IDENTITIES.athlete);
  assert.ok(IDENTITIES.executor);
  assert.ok(IDENTITIES.mindful);
  assert.ok(IDENTITIES.general);
});

test("habitShape preserves levels, identity, and stackAfter", () => {
  const h = habitShape({
    label: "قراءة 10 صفحات",
    identity: "scholar",
    stackAfter: "habit-123",
    levels: {
      ideal: "قراءة 30 صفحة",
      standard: "قراءة 10 صفحات",
      micro: "قراءة صفحة واحدة",
    },
    durationMins: 15,
  });
  assert.equal(h.identity, "scholar");
  assert.equal(h.stackAfter, "habit-123");
  assert.equal(h.levels.ideal, "قراءة 30 صفحة");
  assert.equal(h.levels.micro, "قراءة صفحة واحدة");
  assert.equal(h.durationMins, 15);
});

test("identityScores calculates points and counts properly", () => {
  const habits = [
    habitShape({ label: "قراءة", identity: "scholar", done: true, levelDone: "ideal" }),
    habitShape({ label: "بحث", identity: "scholar", done: true, levelDone: "standard" }),
    habitShape({ label: "تمرين", identity: "athlete", done: true, levelDone: "micro" }),
    habitShape({ label: "نادي", identity: "athlete", done: false }),
  ];
  const scores = identityScores(habits);
  assert.equal(scores.scholar.total, 2);
  assert.equal(scores.scholar.done, 2);
  assert.equal(scores.scholar.pts, HABIT_LEVEL_POINTS.ideal + HABIT_LEVEL_POINTS.standard); // 15 + 10 = 25
  assert.equal(scores.athlete.total, 2);
  assert.equal(scores.athlete.done, 1);
  assert.equal(scores.athlete.pts, HABIT_LEVEL_POINTS.micro); // 5
});

test("contextualBlock returns period corresponding to time of day", () => {
  const morningDate = new Date("2026-10-26T07:30:00");
  const afternoonDate = new Date("2026-10-26T13:30:00");
  const nightDate = new Date("2026-10-26T22:30:00");

  assert.equal(contextualBlock(morningDate).period, "morning");
  assert.equal(contextualBlock(afternoonDate).period, "afternoon");
  assert.equal(contextualBlock(nightDate).period, "night");
});

test("freezeShape clamps count and keeps valid dates", () => {
  const f1 = freezeShape({ count: 5, usedDates: ["2026-10-20"] });
  assert.equal(f1.count, 5);
  assert.deepEqual(f1.usedDates, ["2026-10-20"]);

  const f2 = freezeShape({});
  assert.equal(f2.count, 2);
  assert.deepEqual(f2.usedDates, []);
});

test("chainedHabits groups stacked habits into chronological chains", () => {
  const h1 = habitShape({ id: "1", label: "صلاة الفجر", group: "morning" });
  const h2 = habitShape({ id: "2", label: "أذكار الصباح", group: "morning", stackAfter: "1" });
  const h3 = habitShape({ id: "3", label: "شرب ماء", group: "morning", stackAfter: "2" });
  const h4 = habitShape({ id: "4", label: "جلسة عمل", group: "morning" });

  const chains = chainedHabits([h1, h2, h3, h4], "morning");
  assert.equal(chains.length, 2);
  assert.equal(chains[0].length, 3);
  assert.equal(chains[0][0].id, "1");
  assert.equal(chains[0][1].id, "2");
  assert.equal(chains[0][2].id, "3");
  assert.equal(chains[1].length, 1);
  assert.equal(chains[1][0].id, "4");
});
