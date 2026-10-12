/* --- the half of the bot that was not asked anything --------------------
 *  Everything else here is a reply: he sends a sentence and the bot records
 *  it, or a time arrives and the bot reads out what is still open. This file
 *  is the other thing — it reads the whole day and decides whether there is
 *  anything worth *saying*.
 *
 *  Three rules it keeps, and all three exist because an advisor that gets
 *  any of them wrong is an advisor that gets muted:
 *
 *  - **Silence is a legitimate answer, and it is the usual one.** `advise`
 *    returns an empty list on a day that is going fine, and the scheduled
 *    coach sends nothing at all when it does. A message that fires to say
 *    «كل شي تمام» is the message that teaches you to swipe the next one
 *    unread — the same reason the task sweep is silent with nothing to
 *    sweep, applied to a notification whose whole content is a judgement.
 *  - **Every observation carries the action that answers it.** «انتباه،
 *    انتظامك ٤٠٪» is a grade; «باقي عادتان — اضغط إحداها» is a move. So an
 *    advice carries `actions`, which are callback data and nothing else:
 *    this file never imports grammY, and `views.js` turns them into
 *    buttons.
 *  - **It never invents a number.** Every figure comes out of the state
 *    layer's own readings — `disciplineOf`, `streakRunFrom`, `focusDay`,
 *    `weakSpots`, `readStreak` — so the bot and the screens cannot disagree
 *    about the same day. A second reading here would be a second opinion
 *    arriving by notification, which is worse than no notification.
 *
 *  Pure. No network, no grammY, no disk — it takes the state and the moment
 *  and returns data, which is what lets `tests/bot.test.mjs` hold it.
 * --------------------------------------------------------------------- */
import {
  rows,
  obj,
  dayKey,
  addDays,
  daysUntil,
  scoredOf,
  disciplineOf,
  coreOf,
  clampGoal,
  STREAK_TARGET,
  streakRunFrom,
  comebackFrom,
  COMEBACK_MIN,
  historyIndex,
  habitStreak,
  inReflectWindow,
  TOP_TASK_CAP,
  prepPicks,
  tomorrowKey,
  READ_GOAL_DEFAULT,
  readStreak,
  bookForHabit,
  focusShape,
  focusDay,
  focusStreak,
  runRunning,
  runLeft,
  runStale,
  spentMinutes,
  phaseOf,
  cleanDays,
  bandAt,
  dangerWatch,
  uniPending,
  amountSum,
  COACH_MAX,
} from "../../src/state/life-state.mjs";
import {
  num,
  line,
  spanOf,
  daysWord,
  pagesWord,
  habitsWord,
  tasksWord,
} from "./fmt.js";

/* --- ranks ------------------------------------------------------------- *
 *  Lower speaks first. The ordering is not cosmetic: the coach carries at
 *  most `COACH_MAX` observations, so the rank is what decides which three of
 *  a bad day's nine problems he actually reads. It runs roughly: something
 *  irreversible is happening now, then something that ends a run, then
 *  something that is merely behind.
 * ---------------------------------------------------------------------- */
const RANK = {
  comeback: 0, // he has been away; nothing else may speak first
  danger: 10, // the hour he historically falls in is the hour it is now
  due: 20, // a deadline with a date on it
  streak: 30, // a run that ends tonight if nothing happens
  habitRun: 35, // one habit's own long run, still open
  focusRun: 40, // a round left counting, or abandoned
  tasks: 50, // the three not chosen, or not moving
  prep: 55, // tomorrow's three not picked, and the window is open
  reflect: 58, // the day fell short and nothing was written about why
  read: 60,
  focus: 65,
  water: 70,
  money: 80,
};

/* An observation. `actions` is callback data — `kind:arg`, the same strings
   the buttons in `views.js` carry — and never a label with a colon in it,
   because Telegram caps callback data at 64 bytes and splits on the first
   separator. */
const say = (id, rank, text, actions = []) => ({ id, rank, text, actions });

/* --- the day, read once ------------------------------------------------ *
 *  Every check below reads off this rather than off the state, so the state
 *  layer's readings are each called once per sweep and no two checks can
 *  disagree about the same figure.
 * ---------------------------------------------------------------------- */
export function readDay(state, now = new Date()) {
  const s = obj(state);
  const today = dayKey();
  const habits = rows(s.habits);
  const scored = scoredOf(habits);
  const history = rows(s.history);
  const tasks = rows(s.tasks);
  const todayTasks = tasks.filter((t) => t.today);
  const focus = focusShape(s.focus);
  const readGoal = Number.isFinite(+s.readGoal) ? +s.readGoal : READ_GOAL_DEFAULT;
  const readToday = rows(s.reading)
    .filter((r) => r.date === today)
    .reduce((n, r) => n + (Number(r.pages) || 0), 0);

  return {
    now,
    today,
    hour: now.getHours(),
    evening: inReflectWindow(now),
    state: s,
    habits,
    scored,
    open: scored.filter((h) => !h.done),
    pct: disciplineOf(habits),
    core: coreOf(habits),
    history,
    row: history.find((h) => h.date === today) || null,
    run: streakRunFrom(history),
    away: comebackFrom(history, today),
    tasks,
    todayTasks,
    openTasks: todayTasks.filter((t) => !t.done),
    water: Math.max(0, Math.round(s.water || 0)),
    waterGoal: clampGoal(s.waterGoal),
    books: rows(s.books),
    readGoal,
    readToday,
    readRun: readStreak(s.reading, readGoal),
    focus,
    focusToday: focusDay(s.sessions, today),
    focusRun: focusStreak(s.sessions, focus.goal),
    bad: rows(s.badHabits),
    uni: uniPending(s.uni, today),
  };
}

/* --- two days away gets a door, not a verdict -------------------------- *
 *  The app's own rule, said in a chat bubble. Somebody opening this after a
 *  week away is opening it for a verdict, and «انتظامك ٠٪» is the verdict
 *  that closes the app for a month. So the days are stated flatly, with no
 *  number attached to blame, and the only thing offered is the smallest
 *  surface there is.
 * ---------------------------------------------------------------------- */
export const comeback = (d) => {
  if (d.away < COMEBACK_MIN) return null;
  const cheap = d.open.slice(0, 2);
  return say(
    "comeback",
    RANK.comeback,
    [
      line(`👋 ${daysWord(d.away)} بدون تسجيل — والسجلّ ما يلومك، يسجّل فقط.`),
      line("نبدأ بأقل شي: واحدة من هذي تكفي اليوم."),
    ].join("\n"),
    cheap.map((h) => ({ label: `✓ ${h.label}`, data: `tick:${h.id}` })),
  );
};

/* --- the run that ends tonight ----------------------------------------- *
 *  Only in the evening, and only when there is a run to lose. At noon this
 *  sentence is a nag — there is most of a day left and nothing has gone
 *  wrong yet. The tolerance is said out loud when it has already been spent,
 *  because a streak quietly living on its one forgiven day is a number that
 *  means less than it says.
 * ---------------------------------------------------------------------- */
export const streakRisk = (d) => {
  if (!d.evening) return null;
  if (d.pct >= STREAK_TARGET) return null;
  if (d.run.days < 2) return null;
  const need = Math.max(
    1,
    Math.ceil((STREAK_TARGET / 100) * d.scored.length) -
      d.scored.filter((h) => h.done).length,
  );
  const cheap = d.open.slice(0, 3);
  const out = [
    line(`🔥 ${daysWord(d.run.days)} محتسبة، وانتظام اليوم ${num(d.pct)}٪.`),
    line(`${habitsWord(need)} تكفي لتبلغ ${num(STREAK_TARGET)}٪.`),
  ];
  if (d.run.forgiven) {
    out.push(line("وسماح اليوم الواحد مستهلك في هذي السلسلة — ما فيه ثاني."));
  }
  /* The floor, offered beside the whole thing and never instead of it. A
     habit with a smaller version of itself written on it has a third option
     on a day like this, and the whole value of the floor is that it is
     visible at the moment skipping looks reasonable. */
  const actions = [];
  for (const h of cheap) {
    actions.push({ label: `✓ ${h.label}`, data: `tick:${h.id}` });
    if (h.min) actions.push({ label: `◔ ${h.min}`, data: `tiny:${h.id}` });
  }
  return say("streak", RANK.streak, out.join("\n"), actions);
};

/* --- one habit's own long run ------------------------------------------ *
 *  The aggregate score can clear the bar while the one habit carrying a
 *  three-week run quietly goes untouched. That is the loss nobody notices
 *  until the number is gone, so it is named separately and by habit.
 * ---------------------------------------------------------------------- */
export const HABIT_RUN_MIN = 5;
export const habitRunRisk = (d) => {
  if (!d.evening) return null;
  const by = historyIndex(d.history);
  let best = null;
  for (const h of d.open) {
    const run = habitStreak(by, h.id);
    if (run >= HABIT_RUN_MIN && (!best || run > best.run)) best = { h, run };
  }
  if (!best) return null;
  const actions = [{ label: `✓ ${best.h.label}`, data: `tick:${best.h.id}` }];
  if (best.h.min) actions.push({ label: `◔ ${best.h.min}`, data: `tiny:${best.h.id}` });
  return say(
    "habitRun",
    RANK.habitRun,
    line(`⛓️ «${best.h.label}» ${daysWord(best.run)} متصلة — ولم تُسجّل اليوم.`),
    actions,
  );
};

/* --- the hour he falls in ---------------------------------------------- *
 *  `dangerWatch` already knows which band of the day takes him down and
 *  refuses to claim one off a coincidence. This is that diagnosis delivered
 *  *inside* the band rather than on a screen he visits afterwards, which is
 *  the only moment it can change anything. The replacement he wrote himself
 *  is what is offered — not advice, his own plan read back to him.
 * ---------------------------------------------------------------------- */
export const dangerHour = (d) => {
  if (!d.bad.length) return null;
  const watch = dangerWatch(d.bad);
  if (!watch || !watch.band) return null;
  if (bandAt(d.hour).id !== watch.band.id) return null;
  /* Only while something is actually standing. A warning about a run that
     ended this morning is a reminder of the fall, which is the opposite of
     what this is for. */
  const standing = d.bad
    .filter((b) => cleanDays(b) > 0)
    .sort((a, b) => cleanDays(b) - cleanDays(a))[0];
  if (!standing) return null;
  const out = [
    line(`🛡️ ${watch.band.label} — ${num(watch.pct)}٪ من سقطاتك في هذي الساعات.`),
    line(`«${standing.title}» صامد ${daysWord(cleanDays(standing))}.`),
  ];
  if (watch.tag) out.push(line(`والمحرّك الأغلب: ${watch.tag.label}.`));
  if (standing.replacement) out.push(line(`بديلك المكتوب: ${standing.replacement}`));
  return say("danger", RANK.danger, out.join("\n"), [
    { label: "🛡️ صمدت الآن", data: `hold:${standing.id}` },
  ]);
};

/* --- something with a date on it --------------------------------------- *
 *  The university desk's deliverables, which are the one kind of due date in
 *  this app that costs a grade. Overdue speaks first and says so — a list
 *  that sorts an overdue item in with next week's is a list that hides it.
 * ---------------------------------------------------------------------- */
export const DUE_SOON = 3;
export const dueSoon = (d) => {
  const near = d.uni
    .map((t) => ({ t, left: daysUntil(t.due) }))
    .filter((x) => x.left !== null && x.left <= DUE_SOON);
  if (!near.length) return null;
  const late = near.filter((x) => x.left < 0);
  const out = [];
  if (late.length) {
    out.push(line(`⏰ متأخر: ${late.map((x) => x.t.title).join(" · ")}`));
  }
  for (const x of near.filter((x) => x.left >= 0).slice(0, 3)) {
    out.push(
      line(
        x.left === 0
          ? `⏰ اليوم: ${x.t.title}`
          : `⏰ بعد ${daysWord(x.left)}: ${x.t.title}`,
      ),
    );
  }
  return say("due", RANK.due, out.join("\n"));
};

/* --- a round nobody is in --------------------------------------------- *
 *  `settleRun` draws the line between a round that finished and a round that
 *  was abandoned, and this is the one place the bot can say so before the
 *  laptop is opened again. A round still counting when it went stale writes
 *  nothing — minutes nobody can vouch for are worse than no minutes — so the
 *  sentence says what will happen to it rather than claiming the time.
 * ---------------------------------------------------------------------- */
export const focusLeftRunning = (d) => {
  const run = d.focus.run;
  if (!run) return null;
  const nowMs = d.now.getTime();
  if (runStale(run, nowMs)) {
    return say(
      "focusRun",
      RANK.focusRun,
      line(
        run.endAt
          ? `⏹️ ${phaseOf(run.phase).label} تُركت تعدّ منذ أمس — ما أحد يعرف متى قمت عنها، فلن تُحتسب.`
          : `⏸️ ${phaseOf(run.phase).label} موقوفة منذ أمس عند ${spanOf(spentMinutes(run, nowMs))} — تُسجّل كما هي؟`,
      ),
      [
        { label: "✅ اعتمدها", data: "focus:settle" },
        { label: "🗑️ أسقطها", data: "focus:drop" },
      ],
    );
  }
  if (runRunning(run)) {
    const left = Math.ceil(runLeft(run, nowMs) / 60);
    /* Only when it is nearly over: the whole point of a running round is
       that nothing interrupts it. */
    if (left > 2) return null;
    return say(
      "focusRun",
      RANK.focusRun,
      line(`⏳ ${phaseOf(run.phase).label} تنتهي بعد ${spanOf(left)}.`),
    );
  }
  /* Armed and paused for a while inside the same day. */
  const idle = Math.round((nowMs - (run.at || nowMs)) / 60000);
  if (idle < 25) return null;
  return say(
    "focusRun",
    RANK.focusRun,
    line(`⏸️ ${phaseOf(run.phase).label} موقوفة منذ ${spanOf(idle)}.`),
    [
      { label: "▶️ أكمل", data: "focus:resume" },
      { label: "⏹️ أوقفها واحسبها", data: "focus:stop" },
    ],
  );
};

/* --- the three ---------------------------------------------------------- *
 *  Two different silences, and they are not the same problem. Nothing
 *  chosen is a day running on whatever shouts loudest; three chosen and
 *  none moved by the afternoon is a day where the choosing was the whole
 *  of the work.
 * ---------------------------------------------------------------------- */
export const TASK_PUSH_HOUR = 15;
export const tasksAdrift = (d) => {
  if (!d.todayTasks.length) {
    /* Before the day has really begun there is nothing to say about it. */
    if (d.hour < 9) return null;
    const pick = d.tasks.filter((t) => !t.done && !t.today).slice(0, 3);
    return say(
      "tasks",
      RANK.tasks,
      [
        line(`🎯 ما اخترت أهم ${num(TOP_TASK_CAP)} مهام لليوم.`),
        line("اليوم الذي لا تُختار مهامه تختارها الإشعارات."),
      ].join("\n"),
      pick.map((t) => ({ label: `🎯 ${t.text}`, data: `top:${t.id}` })),
    );
  }
  if (!d.openTasks.length) return null;
  if (d.hour < TASK_PUSH_HOUR) return null;
  const first = d.openTasks[0];
  const out = [
    line(`🎯 باقي ${tasksWord(d.openTasks.length)} من مهام اليوم.`),
  ];
  /* The step, when it was written: a task is a sentence and the step is the
     thing a body can start. */
  if (first.step) out.push(line(`أصغر خطوة في «${first.text}»: ${first.step}`));
  return say(
    "tasks",
    RANK.tasks,
    out.join("\n"),
    d.openTasks.slice(0, 3).map((t) => ({
      label: `✓ ${t.text}`.slice(0, 40),
      data: `task:${t.id}`,
    })),
  );
};

/* --- tomorrow's three, tonight ----------------------------------------- *
 *  Inside the evening window only, because that is the hour the question
 *  belongs to. A prep already written is left alone, and a prep written for
 *  another day is treated as nothing — `prep.for` is what makes it safe to
 *  carry at all.
 * ---------------------------------------------------------------------- */
export const prepPending = (d) => {
  if (!d.evening) return null;
  const prep = obj(d.state.prep);
  const picks = prep.for === tomorrowKey() ? prepPicks(prep) : [];
  if (picks.length >= TOP_TASK_CAP) return null;
  const taken = new Set(picks.map((p) => p.task));
  const offer = d.tasks.filter((t) => !t.done && !taken.has(t.id)).slice(0, 3);
  if (!offer.length) return null;
  return say(
    "prep",
    RANK.prep,
    [
      line(
        picks.length
          ? `🌙 اخترت ${tasksWord(picks.length)} لغد — باقي ${num(TOP_TASK_CAP - picks.length)}.`
          : "🌙 مهام الغد تُختار الليلة، أو يختارها الصباح بما يصرخ أعلى.",
      ),
    ].join("\n"),
    offer.map((t) => ({ label: `🌙 ${t.text}`.slice(0, 40), data: `prep:${t.id}` })),
  );
};

/* --- the day that fell short and nothing written about why ------------- */
export const reflectMissing = (d) => {
  if (!d.evening) return null;
  if (d.pct >= STREAK_TARGET) return null;
  if (d.row && (d.row.distraction || d.row.fix)) return null;
  return say(
    "reflect",
    RANK.reflect,
    [
      line(`📝 اليوم ${num(d.pct)}٪. ما الذي شتّتك فعلًا؟`),
      line("أرسل: «شتتني الجوال» — ثم «الحل أتركه في الدرج»."),
    ].join("\n"),
  );
};

/* --- the reading goal -------------------------------------------------- */
export const READ_PUSH_HOUR = 16;
export const readBehind = (d) => {
  if (d.readToday >= d.readGoal) return null;
  /* A run at stake speaks at any hour, because losing one is a real event.
     An open reading habit is not: it is open from the moment the day rolls
     over, so naming it before the afternoon is naming the clock rather than
     a shortfall. */
  const habit = d.open.find((h) => h.book);
  if (d.readRun < 2 && !(habit && d.hour >= READ_PUSH_HOUR)) return null;
  const book = habit ? bookForHabit(habit, d.books) : d.books.find((b) => b.status === "reading");
  const left = Math.max(0, d.readGoal - d.readToday);
  const out = [
    line(
      d.readRun >= 2
        ? `📖 ${daysWord(d.readRun)} قراءة متصلة — وباقي ${pagesWord(left)} اليوم.`
        : `📖 باقي ${pagesWord(left)} على هدف القراءة.`,
    ),
  ];
  if (book) out.push(line(`الكتاب: ${book.title}${book.page ? ` — عند صفحة ${num(book.page)}` : ""}`));
  return say(
    "read",
    RANK.read,
    out.join("\n"),
    [10, 20].map((n) => ({ label: `📖 +${n}`, data: `read:${n}` })),
  );
};

/* --- the focus goal ---------------------------------------------------- */
export const focusBehind = (d) => {
  if (!d.focus.goal) return null;
  if (d.focusToday.minutes >= d.focus.goal) return null;
  if (d.focus.run) return null; // something is already armed; let it run
  /* A run at stake, or the evening closing in on a goal still untouched. */
  if (d.focusRun < 2 && !(d.evening && d.focusToday.minutes === 0)) return null;
  const left = d.focus.goal - d.focusToday.minutes;
  const out = [
    line(
      d.focusRun >= 2
        ? `🎧 ${daysWord(d.focusRun)} بلغت فيها هدف التركيز — وباقي ${spanOf(left)} اليوم.`
        : `🎧 ما سجّلت تركيزًا اليوم. الهدف ${spanOf(d.focus.goal)}.`,
    ),
  ];
  return say("focus", RANK.focus, out.join("\n"), [
    { label: "▶️ ابدأ جولة", data: "focus:start" },
  ]);
};

/* --- the water, against the hour -------------------------------------- *
 *  Pro-rata and not absolute: eight glasses by two in the afternoon is not a
 *  shortfall, and a reminder that treats it as one is one he mutes. The
 *  window is the app's own waking day — the water reminder's own default
 *  hours — so the pace is measured against the part of the day that was
 *  actually available for drinking.
 * ---------------------------------------------------------------------- */
export const WATER_FROM = 7;
export const WATER_TO = 22;
export const waterBehind = (d) => {
  if (d.water >= d.waterGoal) return null;
  if (d.hour < WATER_FROM + 2 || d.hour > WATER_TO) return null;
  const share = (Math.min(d.hour, WATER_TO) - WATER_FROM) / (WATER_TO - WATER_FROM);
  const should = Math.floor(share * d.waterGoal);
  const behind = should - d.water;
  if (behind < 2) return null;
  return say(
    "water",
    RANK.water,
    line(`💧 ${num(d.water)} من ${num(d.waterGoal)} — متأخر ${num(behind)} عن إيقاع اليوم.`),
    [
      { label: "💧 + كاس", data: "water:1" },
      { label: "💧 + كاسين", data: "water:2" },
    ],
  );
};

/* --- the week that is costing more than the four before it ------------- *
 *  A single expensive day is not a signal; a week running well above the
 *  trailing month is. The floor exists so a quiet month followed by one
 *  ordinary purchase does not read as a spike — a ratio on top of small
 *  numbers is arithmetic, not information.
 * ---------------------------------------------------------------------- */
export const SPIKE_RATIO = 1.4;
export const SPIKE_FLOOR = 200;
export const spendSpike = (d) => {
  /* Bounded at both ends, by hand. `sinceDays` has no upper bound — it
     answers «the last N days» and is right for that — so using it for a
     past window would hand back every row from that date onward, this
     week's included, and the baseline would contain the spike it is being
     compared against. */
  const span = (from, to) =>
    amountSum(rows(d.state.expenses).filter((e) => e.date >= from && e.date <= to));
  const week = span(addDays(d.today, -6), d.today);
  if (week < SPIKE_FLOOR) return null;
  /* The four weeks before this one, as four windows and not one average of
     twenty-eight days. */
  const prior = [];
  for (let i = 1; i <= 4; i += 1) {
    const to = addDays(d.today, -7 * i);
    prior.push(span(addDays(to, -6), to));
  }
  const base = prior.reduce((a, b) => a + b, 0) / prior.length;
  if (!base || week < base * SPIKE_RATIO) return null;
  return say(
    "money",
    RANK.money,
    [
      line(`💸 صرف هذا الأسبوع ${num(week)} ر.س — المعتاد ${num(Math.round(base))}.`),
      line(`أعلى بـ${num(Math.round((week / base - 1) * 100))}٪ من متوسط أربعة أسابيع.`),
    ].join("\n"),
  );
};

/* --- the sweep --------------------------------------------------------- *
 *  Every check, ranked, with the empty ones dropped. The order of this list
 *  does not matter — `rank` decides — but keeping it in rough rank order
 *  makes the file readable top to bottom.
 *
 *  `comeback` is the one that silences the rest. A man opening this after a
 *  week away does not need the other eight things that are also behind; he
 *  needs one door. Everything else is still true tomorrow.
 * ---------------------------------------------------------------------- */
const CHECKS = [
  comeback,
  dangerHour,
  dueSoon,
  streakRisk,
  habitRunRisk,
  focusLeftRunning,
  tasksAdrift,
  prepPending,
  reflectMissing,
  readBehind,
  focusBehind,
  waterBehind,
  spendSpike,
];

export function advise(state, now = new Date()) {
  const d = readDay(state, now);
  const out = [];
  for (const check of CHECKS) {
    let got = null;
    try {
      got = check(d);
    } catch {
      /* One check that throws on a damaged row must not take the whole
         sweep down with it — the nudge is the least important thing in this
         process and the one most likely to meet a shape nothing else
         reads. */
      got = null;
    }
    if (got) out.push(got);
  }
  out.sort((a, b) => a.rank - b.rank);
  if (out.length && out[0].id === "comeback") return [out[0]];
  return out;
}

/* --- what the scheduled coach actually sends --------------------------- *
 *  The top `COACH_MAX`, or null. Null is the common case and the whole
 *  reason the coach is worth having switched on: a sweep that finds nothing
 *  sends nothing, so the times it does speak are the times it had something.
 * ---------------------------------------------------------------------- */
export function coachNote(state, now = new Date()) {
  const all = advise(state, now);
  if (!all.length) return null;
  const pick = all.slice(0, COACH_MAX);
  return {
    text: pick.map((a) => a.text).join("\n\n"),
    /* Only the first observation's buttons. Three sets of buttons under one
       message is a wall of taps nobody reads, and the first is the one the
       rank already said mattered most. */
    actions: pick[0].actions,
    ids: pick.map((a) => a.id),
    more: all.length - pick.length,
  };
}

/* --- the same sweep, asked for by hand -------------------------------- *
 *  `/coach` on a day with nothing wrong has to answer something, unlike the
 *  scheduled one: a button pressed that replies with silence reads as a dead
 *  bot. So this one has a floor.
 * ---------------------------------------------------------------------- */
export function coachReply(state, now = new Date()) {
  const note = coachNote(state, now);
  if (note) return note;
  const d = readDay(state, now);
  return {
    text: [
      line(`✅ ما فيه شي ملحّ. الانتظام ${num(d.pct)}٪ و${tasksWord(d.openTasks.length)} مفتوحة.`),
      line("وهذا أفضل جواب يقدر يقوله المدرّب."),
    ].join("\n"),
    actions: [],
    ids: [],
    more: 0,
  };
}
