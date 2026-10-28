/* النوم: سطر واحد لليوم، وما تقوله القراءات عنه.
 *
 *  هذا الملف يختبر `life-state-sleep.mjs` وحده — الملف الذي حلّ محل
 *  نسختين كانتا تكتبان نوماً مختلفاً: `state.sleepLogs` (يكتبه بوت
 *  تيليجرام، كان يُمحى عند كل دوران يوم لغيابه عن `carryOf`) و
 *  `localStorage` الخاص بشاشة «مختبر النوم» وحده (لا يراه القرص ولا
 *  البوت). انظر التعليق في أعلى `life-state-sleep.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  sleepShape,
  sleepLogsOf,
  logSleep,
  deleteSleep,
  latestSleep,
  sleepOn,
  sleepIn,
  avgSleepHours,
  sleepDebtHours,
} from "../src/state/life-state.mjs";

const TODAY = "2026-10-26";
const back = (n) => {
  const d = new Date(TODAY + "T12:00:00");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

test("sleepShape يشتق الساعات من وقتي النوم والاستيقاظ، عابراً منتصف الليل", () => {
  const s = sleepShape({ date: TODAY, bedTime: "23:30", wakeTime: "07:00" });
  assert.equal(s.hours, 7.5);
  assert.equal(s.cycles, 5);
});

test("sleepShape يقبل ساعات مباشرة بلا وقتين — «نمت ٧ ساعات» من البوت", () => {
  const s = sleepShape({ date: TODAY, hours: 7, source: "telegram" });
  assert.equal(s.hours, 7);
  assert.equal(s.source, "telegram");
});

test("sleepShape: لا وقتين ولا ساعات يعني لا نوم — hours تبقى null لا صفراً", () => {
  const s = sleepShape({ date: TODAY, notes: "نسيت أسجّل" });
  assert.equal(s.hours, null);
});

test("sleepLogsOf يُسقط السطر الذي لا يجيب شيئاً، ويرتّب الأحدث أولاً", () => {
  const list = sleepLogsOf([
    { date: back(2), hours: 6 },
    { date: TODAY, hours: 8 },
    { date: back(1), notes: "بلا ساعات" },
  ]);
  assert.equal(list.length, 2);
  assert.equal(list[0].date, TODAY);
});

test("logSleep: ليلة اليوم تصحّح ليلة اليوم، لا تُضاف بجانبها — نفس قاعدة الوزن", () => {
  let list = logSleep([], { date: TODAY, hours: 6 });
  assert.equal(list.length, 1);
  list = logSleep(list, { date: TODAY, hours: 7.5 });
  assert.equal(list.length, 1);
  assert.equal(list[0].hours, 7.5);
});

test("logSleep يتجاهل سطراً بلا ساعات ولا يكتب صفّاً أعمى", () => {
  const list = logSleep([{ date: TODAY, hours: 7 }], { date: back(1) });
  assert.equal(list.length, 1);
});

test("deleteSleep يحذف بالمعرّف فقط", () => {
  let list = logSleep([], { date: TODAY, hours: 7 });
  const id = list[0].id;
  list = deleteSleep(list, id);
  assert.equal(list.length, 0);
});

test("latestSleep وsleepOn يقرآن الليلة المطلوبة لا الأحدث دائماً", () => {
  const list = [
    { id: "a", date: TODAY, hours: 7 },
    { id: "b", date: back(3), hours: 5 },
  ];
  assert.equal(latestSleep(list).date, TODAY);
  assert.equal(sleepOn(list, back(3)).hours, 5);
  assert.equal(sleepOn(list, back(10)), null);
});

test("avgSleepHours يحسب على الليالي المسجَّلة فعلاً، لا على فراغ النافذة", () => {
  assert.equal(avgSleepHours([], 7, TODAY), null, "بلا ليلة واحدة: null لا صفر");
  const list = [
    { date: TODAY, hours: 6 },
    { date: back(6), hours: 8 },
  ];
  assert.equal(avgSleepHours(list, 7, TODAY), 7);
});

test("sleepIn يتجاهل ما قبل النافذة", () => {
  const list = [
    { date: TODAY, hours: 6 },
    { date: back(20), hours: 9 },
  ];
  assert.equal(sleepIn(list, 7, TODAY).length, 1);
});

test("sleepDebtHours يُحسب على الليالي المسجَّلة فقط، ويُقرأ سالباً حين ينام أكثر من هدفه", () => {
  const list = [
    { date: TODAY, hours: 6 },
    { date: back(1), hours: 6 },
  ];
  const debt = sleepDebtHours(list, 7, TODAY, 7.5);
  assert.equal(debt, 3); // 2 ليالٍ × 7.5 = 15، نام 12 → عجز 3
  assert.equal(sleepDebtHours([{ date: TODAY, hours: 9 }], 7, TODAY, 7.5), -1.5, "نوم أكثر من الهدف عجز سالب");
});
