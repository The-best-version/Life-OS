import test from "node:test";
import assert from "node:assert/strict";

import {
  triggerEmergency,
  saveWeeklyReview,
  breakdownTask,
  dayAt,
  daySchedule,
  postponeTask,
  promoteTaskToToday,
  startFocus,
  undo,
} from "../services/telegram-bot/actions.js";
import {
  emergencyCard,
  prayerCard,
  weeklyPlanPrompt,
  scheduleCard,
  shutdownCard,
  savedEmergency,
  savedWeeklyPlan,
  morningKeys,
  savedAbsence,
} from "../services/telegram-bot/views.js";
import { runTool } from "../services/telegram-bot/agent.js";
import { planToday, textFor } from "../services/telegram-bot/reminders.js";
import { parse, askedAbout } from "../services/telegram-bot/parse.js";
import { answer } from "../services/telegram-bot/ask.js";
import { freshState, rows } from "../src/state/life-state.mjs";

test("triggerEmergency enables and disables emergency mode and supports undo", () => {
  const initial = freshState();
  assert.equal(!!initial.emergencyMode, false);

  const res1 = triggerEmergency(initial, { active: true });
  assert.equal(res1.next.emergencyMode, true);
  assert.ok(res1.before);

  const res2 = triggerEmergency(res1.next, { active: false });
  assert.equal(res2.next.emergencyMode, false);

  // Undo restores
  const undone = undo(res1.next, res1.before);
  assert.equal(undone.next.emergencyMode, false);
});

test("triggerEmergency with completeTinyCore rescues open core habits with tiny flag", () => {
  const state = freshState();
  state.habits = [
    { id: "h1", label: "صلاة الفجر", core: true, done: false, min: "ركعتين" },
    { id: "h2", label: "رياضة متقدمة", core: false, done: false },
  ];

  const res = triggerEmergency(state, { active: true, completeTinyCore: true });
  assert.equal(res.next.emergencyMode, true);
  assert.equal(res.rescuedCount, 1);

  const h1 = rows(res.next.habits).find((h) => h.id === "h1");
  assert.equal(h1.done, true);
  assert.equal(h1.tiny, true);

  const h2 = rows(res.next.habits).find((h) => h.id === "h2");
  assert.equal(h2.done, false);
});

test("saveWeeklyReview records weekly win, lesson, keystone habit, and focus goal", () => {
  const state = freshState();
  const res = saveWeeklyReview(state, {
    win: "أنهيت المشروع بالكامل",
    lesson: "التخطيط الاستباقي يمنع التشتت",
    keystoneHabitId: "h-fajr",
    focusGoalId: "g-deep-work",
    priorityTasks: ["المهمة الأولى للأسبوع", "المهمة الثانية"],
  });

  assert.equal(res.kind, "weekly_review");
  assert.ok(res.next.weeklyReviews);
  const keys = Object.keys(res.next.weeklyReviews);
  assert.ok(keys.length > 0);
  const entry = res.next.weeklyReviews[keys[0]];
  assert.equal(entry.weeklyWin, "أنهيت المشروع بالكامل");
  assert.equal(entry.weeklyLesson, "التخطيط الاستباقي يمنع التشتت");
  assert.equal(entry.keystoneHabitId, "h-fajr");
  assert.equal(entry.focusGoalId, "g-deep-work");

  // Priority tasks added
  const tasks = rows(res.next.tasks);
  assert.ok(tasks.some((t) => t.text === "المهمة الأولى للأسبوع"));
});

test("breakdownTask attaches micro step to existing or new task", () => {
  const state = freshState();
  const res = breakdownTask(state, {
    query: "كتابة التقرير النهائي",
    step: "فتح ملف الورد وكتابة العنوان فقط",
    today: true,
  });

  assert.equal(res.kind, "breakdown_task");
  const task = rows(res.next.tasks).find((t) => t.text === "كتابة التقرير النهائي");
  assert.ok(task);
  assert.equal(task.step, "فتح ملف الورد وكتابة العنوان فقط");
  assert.equal(task.today, true);
});

test("dayAt derives goalTitle for tasks and includes emergencyMode", () => {
  const state = freshState();
  state.goals = [{ id: "g1", text: "بناء لياقة بدنية عالية", horizon: "quarter" }];
  state.tasks = [{ id: "t1", text: "تمرين 30 دقيقة", today: true, done: false, linkedGoalId: "g1" }];
  state.emergencyMode = true;

  const day = dayAt(state);
  assert.equal(day.emergencyMode, true);
  assert.equal(day.tasks[0].goalTitle, "بناء لياقة بدنية عالية");
});

test("views format emergencyCard, prayerCard, and weeklyPlanPrompt in Arabic", () => {
  const state = freshState();
  state.habits = [{ id: "h1", label: "صلاة الفجر", core: true, done: false, min: "ركعتين" }];
  const day = dayAt(state);

  const emgView = emergencyCard(state, day);
  assert.ok(emgView.includes("وضع الطوارئ"));

  const prayerView = prayerCard(state);
  assert.ok(prayerView.includes("الصلوات") || prayerView.includes("أوقات الصلاة"));
  assert.ok(prayerView.includes("الفجر"));

  const planView = weeklyPlanPrompt(state, { win: "نجاح باهر", lesson: "الصبر" });
  assert.ok(planView.includes("نجاح باهر"));
  assert.ok(planView.includes("الصبر"));
});

test("agent.js runTool handles new emergency, weekly review, and breakdown tools", () => {
  const state = freshState();
  state.habits = [{ id: "h1", label: "صلاة الفجر", core: true, done: false }];

  const r1 = runTool(state, "trigger_emergency_mode", { active: true, complete_tiny_core: true });
  assert.equal(r1.next.emergencyMode, true);

  const r2 = runTool(state, "save_weekly_review", {
    win: "فوز كبير",
    lesson: "درس مهم",
  });
  assert.ok(r2.next.weeklyReviews);

  const r3 = runTool(state, "breakdown_task", {
    query: "مهمة معقدة",
    step: "خطوة مادية دقيقة واحدة",
  });
  assert.ok(rows(r3.next.tasks).some((t) => t.step === "خطوة مادية دقيقة واحدة"));
});

test("daySchedule returns today's appointments, upcoming events, and uni lectures", () => {
  const state = freshState();
  const today = state.date;
  const now = new Date(today + "T10:00:00");
  const dow = now.getDay();

  state.events = [
    { id: "e1", title: "موعد الأسنان", date: today, time: "16:30", place: "عيادة المدار", doneOn: [] },
  ];
  state.uni = {
    courses: [
      {
        id: "c1",
        name: "محاسبة تكاليف",
        code: "ACCT201",
        absences: 1,
        absenceCap: 4,
        slots: [{ day: dow, from: "11:00", to: "12:00", room: "B12" }],
      },
    ],
    tasks: [{ id: "ut1", title: "كويز محاسبة", course: "c1", due: today, done: false }],
  };

  const sched = daySchedule(state, now);
  assert.equal(sched.todayEvents.length, 1);
  assert.equal(sched.todayEvents[0].title, "موعد الأسنان");
  assert.equal(sched.lectures.length, 1);
  assert.equal(sched.lectures[0].courseName, "محاسبة تكاليف");
  assert.equal(sched.lectures[0].room, "B12");
  assert.equal(sched.pendingUni.length, 1);
  assert.equal(sched.pendingUni[0].title, "كويز محاسبة");
});

test("views format scheduleCard and shutdownCard properly", () => {
  const state = freshState();
  const today = state.date;
  const now = new Date(today + "T10:00:00");
  state.events = [
    { id: "e1", title: "موعد الأسنان", date: today, time: "16:30", place: "عيادة المدار", doneOn: [] },
  ];

  const card = scheduleCard(state, now);
  assert.ok(card.includes("موعد الأسنان"));
  assert.ok(card.includes("عيادة المدار"));

  const shutCard = shutdownCard(state, dayAt(state), "rate");
  assert.ok(shutCard.includes("إقفال اليوم"));
});

test("reminders planToday arms lecture reminder 30 minutes before start", () => {
  const state = freshState();
  state.bot.on = true;
  const today = state.date;
  const now = new Date(today + "T08:00:00");
  const dow = now.getDay();

  state.uni = {
    courses: [
      {
        id: "c1",
        name: "محاسبة تكاليف",
        code: "ACCT201",
        absences: 2,
        absenceCap: 4,
        slots: [{ day: dow, from: "10:00", to: "11:00", room: "B12" }],
      },
    ],
    tasks: [],
  };

  const plan = planToday(state, now);
  const lecEntry = plan.find((p) => p.kind === "lecture");
  assert.ok(lecEntry);
  assert.equal(lecEntry.courseName, "محاسبة تكاليف");

  const msg = textFor(lecEntry, state, now);
  assert.ok(msg.text.includes("محاسبة تكاليف"));
  assert.ok(msg.text.includes("٣٠ دقيقة"));
  assert.ok(msg.text.includes("B12"));
});

test("water parsing supports Saudi dialect variations and dual cups", () => {
  assert.equal(parse("شربت مويه").kind, "water");
  assert.equal(parse("شربت مويه").count, 1);
  assert.equal(parse("شربت موية").kind, "water");
  assert.equal(parse("شربت موية").count, 1);
  assert.equal(parse("مويه").kind, "water");
  assert.equal(parse("موية").kind, "water");
  assert.equal(parse("كاسين مويه").kind, "water");
  assert.equal(parse("كاسين مويه").count, 2);
  assert.equal(parse("كوبين مويه").kind, "water");
  assert.equal(parse("كوبين مويه").count, 2);
  assert.equal(parse("سجلت اني شربت مويه").kind, "water");
  assert.equal(parse("سجلت مويه").kind, "water");

  // Asking about water
  const askW = askedAbout("كم شربت مويه");
  assert.ok(askW);
  assert.equal(askW.topic, "water");
  const state = freshState();
  state.water = 5;
  state.waterGoal = 8;
  const reply = answer(state, askW);
  assert.ok(reply.includes("٥ من ٨"));
});

test("schedule queries like 'وش علي الفتره الجايه' return scheduleCard", () => {
  const q1 = parse("وش علي الفتره الجايه");
  assert.equal(q1.kind, "ask");
  assert.equal(q1.topic, "schedule");

  const q2 = parse("وش علي الفترة الجاية");
  assert.equal(q2.kind, "ask");
  assert.equal(q2.topic, "schedule");

  const q3 = parse("وش عندي اليوم");
  assert.equal(q3.kind, "ask");
  assert.equal(q3.topic, "schedule");

  const state = freshState();
  state.events = [
    { id: "e-dent", title: "موعد دكتور الأسنان", date: state.date, time: "17:00", place: "المستشفى", doneOn: [] },
  ];
  const now = new Date(state.date + "T10:00:00");
  const ans = answer(state, q1, now);
  assert.ok(ans);
  assert.ok(ans.includes("موعد دكتور الأسنان"));
  assert.ok(ans.includes("المستشفى"));
});

test("postponeTask and promoteTaskToToday manage tasks and support undo", () => {
  const state = freshState();
  state.tasks = [
    { id: "t1", text: "تسليم التقرير", today: true, done: false },
    { id: "t2", text: "قراءة كتاب", today: false, done: false },
  ];

  // Postpone
  const pRes = postponeTask(state, "t1");
  assert.equal(pRes.kind, "task-postpone");
  const t1Post = rows(pRes.next.tasks).find((t) => t.id === "t1");
  assert.equal(t1Post.today, false);
  assert.equal(t1Post.scheduled, true);
  assert.ok(t1Post.due);

  // Undo postpone
  const pUndone = undo(pRes.next, pRes.before);
  assert.equal(rows(pUndone.next.tasks).find((t) => t.id === "t1").today, true);

  // Promote
  const promRes = promoteTaskToToday(state, "t2");
  assert.equal(promRes.kind, "task-promote");
  const t2Prom = rows(promRes.next.tasks).find((t) => t.id === "t2");
  assert.equal(t2Prom.today, true);

  // Undo promote
  const promUndone = undo(promRes.next, promRes.before);
  assert.equal(rows(promUndone.next.tasks).find((t) => t.id === "t2").today, false);
});

test("parsing task postpone and promote commands", () => {
  const p1 = parse("أجل مهمة التقرير");
  assert.equal(p1.kind, "task_postpone");
  assert.equal(p1.query, "التقرير");

  const p2 = parse("ارفع مهمة المذاكرة");
  assert.equal(p2.kind, "task_promote");
  assert.equal(p2.query, "المذاكرة");
});

test("startFocus detects upcoming lecture clash and absence warning triggers", () => {
  const state = freshState();
  const dow = new Date().getDay();
  state.uni = {
    courses: [
      {
        id: "c1",
        name: "إحصاء متقدم",
        code: "STAT201",
        absences: 3,
        absenceCap: 4,
        slots: [{ day: dow, from: "14:00", to: "15:00", room: "A101" }],
      },
    ],
  };

  // Absence warning
  const absView = savedAbsence({
    course: state.uni.courses[0],
    count: 3,
    cap: 4,
  });
  assert.ok(absView.includes("تحذير حرج"));
  assert.ok(absView.includes("غياب واحد فقط"));

  // Focus clash at 13:40 for 45 mins
  const at1340 = new Date();
  at1340.setHours(13, 40, 0, 0);
  const focRes = startFocus(state, { minutes: 45 }, at1340.getTime());
  assert.ok(focRes.clash);
  assert.ok(focRes.clash.includes("إحصاء متقدم"));
});


