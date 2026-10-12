/* --- answering a question instead of filing it --------------------------
 *  Everything this bot could not recognise used to become a task, and that
 *  is the right default for a *thought*: an unrecognised sentence is exactly
 *  what the inbox is for. It is the wrong default for a question. «كم صرفت
 *  هذا الشهر؟» was landing in «مهم غير عاجل» as a to-do item, which is both
 *  a wrong answer and a row he then has to go and delete.
 *
 *  So a question is its own reading, it is answered, and nothing is written.
 *  `parse.js` recognises one and names the topic; this file turns a topic
 *  into a sentence. Every figure comes out of the state layer's own
 *  readings, so an answer in a chat bubble cannot disagree with the same
 *  number on the screen.
 *
 *  Pure — no grammY, no disk — which is what keeps it under test. The
 *  weekly review lives here for the same reason: it is a reading of the
 *  state turned into Arabic, and the only other candidate was `views.js`,
 *  which imports grammY for its keyboards and therefore cannot be loaded by
 *  `node --test` with nothing installed.
 * --------------------------------------------------------------------- */
import {
  rows,
  obj,
  dayKey,
  addDays,
  daysUntil,
  disciplineOf,
  scoredOf,
  coreOf,
  CORE_CAP,
  clampGoal,
  STREAK_TARGET,
  streakRunFrom,
  isGap,
  TOP_TASK_CAP,
  READ_GOAL_DEFAULT,
  readStreak,
  sumPages,
  sinceDays,
  amountSum,
  hourRate,
  netBalance,
  focusShape,
  focusDay,
  focusStreak,
  sessionMinutes,
  sessionsSince,
  bestBand,
  uniPending,
  cleanDays,
  bleedSaved,
  costType,
  goalPct,
  currentQuarter,
  quarterOf,
  pillarOf,
  uniShape,
  uniDayOf,
} from "../../src/state/life-state.mjs";
import { PRAYER_ROWS, clockAt, prayerTimes } from "../../src/utils/prayer-times.mjs";
import {
  num,
  money,
  time,
  line,
  spanOf,
  daysWord,
  countedWord,
  pagesWord,
  habitsWord,
  tasksWord,
  roundsWord,
  DOW,
} from "./fmt.js";

/* How far back a money question looks when the sentence did not say. A week,
   because that is the window the briefs already report and the one a person
   actually has a feel for. */
export const ASK_DAYS = 7;

const windowWord = (days) =>
  days <= 1 ? "اليوم" : days <= 7 ? "هذا الأسبوع" : days <= 31 ? "آخر شهر" : `آخر ${daysWord(days)}`;

/* --- the money --------------------------------------------------------- */
const askSpend = (s, days) => {
  const list = sinceDays(s.expenses, days);
  const total = amountSum(list);
  const out = [line(`💸 صرفت ${money(total)} ${windowWord(days)}.`)];
  if (!list.length) return line("💸 ما فيه مصاريف مسجّلة في هذي المدة.");
  /* The three biggest, because «على إيش؟» is the next question every time
     and a total with no breakdown invites it. */
  const top = [...list].sort((a, b) => b.amount - a.amount).slice(0, 3);
  for (const e of top) out.push(line(`• ${e.label} — ${money(e.amount)}`));
  if (days > 1) out.push(line(`بمعدّل ${money(total / days)} في اليوم.`));
  return out.join("\n");
};

const askEarn = (s, days) => {
  const list = sinceDays(s.income, days);
  const total = amountSum(list);
  if (!list.length) return line("💰 ما فيه دخل مسجّل في هذي المدة.");
  const out = [line(`💰 دخلك ${money(total)} ${windowWord(days)}.`)];
  const rate = hourRate(s.income, Math.max(days, 30));
  /* Only when the hours were actually recorded. A rate read off rows that
     carry no hours is a rate invented by a division by zero. */
  if (rate) out.push(line(`ومعدّل الساعة ${money(rate)} على آخر شهر.`));
  return out.join("\n");
};

const askMoney = (s, days) =>
  [
    line(`🧾 الرصيد: ${money(netBalance(s.income, s.expenses))}`),
    line(
      `${windowWord(days)}: دخل ${money(amountSum(sinceDays(s.income, days)))} · مصروف ${money(
        amountSum(sinceDays(s.expenses, days)),
      )}`,
    ),
  ].join("\n");

/* --- the discipline ---------------------------------------------------- */
const askDiscipline = (s) => {
  const habits = rows(s.habits);
  const scored = scoredOf(habits);
  const core = coreOf(habits);
  const run = streakRunFrom(rows(s.history));
  const out = [
    line(`📊 الانتظام اليوم ${num(disciplineOf(habits))}٪ — الهدف ${num(STREAK_TARGET)}٪.`),
    line(`${num(scored.filter((h) => h.done).length)} من ${num(scored.length)} من العادات المحتسبة.`),
  ];
  out.push(
    line(
      run.days
        ? `السلسلة: ${countedWord(run.days)}${run.forgiven ? " (ومعها يوم سماح مستهلك)" : ""}.`
        : "ما فيه سلسلة قائمة — تبدأ بيوم واحد فوق الهدف.",
    ),
  );
  /* The fallback to every habit is a floor, not the resting state. Saying so
     here is the one chance a chat bubble gets to send him to set the five. */
  if (!core.length) {
    out.push(
      line(
        `ولا زلت تحسب كل ${habitsWord(habits.length)} — اختر ${num(CORE_CAP)} أساسية من شاشة الروتين وسيصير الرقم عنها وحدها.`,
      ),
    );
  }
  return out.join("\n");
};

/* --- the month, counted and not averaged ------------------------------- *
 *  Gaps are counted out loud and never averaged, which is the whole reason
 *  they are rows at all: an average over «the days that exist» flatters
 *  every stretch where the recording stopped.
 * ---------------------------------------------------------------------- */
const askMonth = (s) => {
  const from = addDays(dayKey(), -29);
  const list = rows(s.history).filter((h) => h.date >= from);
  const real = list.filter((h) => !isGap(h) && Array.isArray(h.done));
  const gaps = list.filter(isGap).length;
  if (!real.length) return line("📅 ما فيه أيام مسجّلة في آخر شهر.");
  const avg = Math.round(real.reduce((n, h) => n + (h.pct || 0), 0) / real.length);
  const hit = real.filter((h) => (h.pct || 0) >= STREAK_TARGET).length;
  const out = [
    line(`📅 آخر ثلاثين يومًا: متوسط ${num(avg)}٪ على ${num(real.length)} يوم مسجّل.`),
    line(`${num(hit)} منها فوق ${num(STREAK_TARGET)}٪.`),
  ];
  if (gaps) out.push(line(`و${daysWord(gaps)} بدون تسجيل — غير محسوبة في المتوسط.`));
  return out.join("\n");
};

/* --- the reading ------------------------------------------------------- */
const askRead = (s) => {
  const goal = Number.isFinite(+s.readGoal) ? +s.readGoal : READ_GOAL_DEFAULT;
  const today = rows(s.reading).filter((r) => r.date === dayKey());
  const pages = sumPages(today);
  const run = readStreak(s.reading, goal);
  const book = rows(s.books).find((b) => b.status === "reading");
  const out = [line(`📖 اليوم ${pagesWord(pages)} من هدف ${num(goal)}.`)];
  if (run) out.push(line(`والسلسلة ${daysWord(run)} بلغت فيها الهدف.`));
  if (book) {
    const at = parseInt(book.page, 10);
    const total = parseInt(book.pages, 10);
    out.push(
      line(
        `«${book.title}»${Number.isFinite(at) ? ` — عند صفحة ${num(at)}` : ""}${
          Number.isFinite(total) && total > 0 ? ` من ${num(total)}` : ""
        }`,
      ),
    );
  } else {
    out.push(line("ما فيه كتاب معلّم «أقرأه الآن» على الرف."));
  }
  return out.join("\n");
};

/* --- the focus --------------------------------------------------------- */
const askFocus = (s) => {
  const focus = focusShape(s.focus);
  const day = focusDay(s.sessions);
  const out = [
    line(
      `🎧 اليوم ${spanOf(day.minutes)} في ${roundsWord(day.rounds)}${
        focus.goal ? ` — الهدف ${spanOf(focus.goal)}` : ""
      }.`,
    ),
  ];
  const run = focusStreak(s.sessions, focus.goal);
  if (run) out.push(line(`والسلسلة ${daysWord(run)} بلغت فيها الهدف.`));
  const week = sessionMinutes(sessionsSince(s.sessions, 7));
  out.push(line(`وهذا الأسبوع ${spanOf(week)}.`));
  /* The band only speaks when enough rows recorded an hour to mean
     anything — `bestBand` has its own floor and returns null below it. */
  const band = bestBand(s.sessions);
  if (band && band.band) out.push(line(`أخصب ساعاتك: ${band.band.label}.`));
  return out.join("\n");
};

/* --- the prayers ------------------------------------------------------- *
 *  The solar maths, off the same file the screens and the reminders read, so
 *  a time in a chat bubble can never disagree with the one on the card.
 * ---------------------------------------------------------------------- */
const askPrayer = (s, now = new Date()) => {
  const place = obj(s.place);
  if (!Number.isFinite(place.lat)) {
    return line("🕌 ما فيه مدينة محدّدة — اختر مكانك من إعدادات الموقع.");
  }
  const t = prayerTimes(place, now);
  const hour = now.getHours() + now.getMinutes() / 60;
  const live = PRAYER_ROWS.filter((p) => !p.mark);
  const next = live.find((p) => Number.isFinite(t[p.id]) && t[p.id] > hour);
  const out = [];
  if (next) {
    const left = Math.round((t[next.id] - hour) * 60);
    out.push(line(`🕌 ${next.label} ${time(clockAt(t[next.id]))} — بعد ${spanOf(left)}.`));
  } else {
    out.push(line("🕌 صلوات اليوم انتهت. الفجر أول القادم."));
  }
  out.push(
    line(live.map((p) => `${p.label} ${time(clockAt(t[p.id]))}`).join("  ·  ")),
  );
  return out.join("\n");
};

/* --- the three, and what is open -------------------------------------- */
const askTasks = (s) => {
  const today = rows(s.tasks).filter((t) => t.today);
  const open = today.filter((t) => !t.done);
  if (!today.length) {
    return [
      line(`🎯 ما اخترت أهم ${num(TOP_TASK_CAP)} مهام لليوم.`),
      line("أرسل: «اليوم: …» لتختار واحدة."),
    ].join("\n");
  }
  const out = [line(`🎯 ${num(today.length - open.length)} من ${num(today.length)} منجزة.`)];
  for (const t of open) {
    out.push(line(`• ${t.text}`));
    if (t.step) out.push(line(`   ↳ ${t.step}`));
  }
  if (!open.length) out.push(line("كلها مُنجزة ✅"));
  return out.join("\n");
};

const askHabits = (s) => {
  const open = scoredOf(rows(s.habits)).filter((h) => !h.done);
  if (!open.length) return line("✅ كل عاداتك المحتسبة مسجّلة اليوم.");
  const out = [line(`⏳ باقي ${habitsWord(open.length)}:`)];
  for (const h of open.slice(0, 8)) {
    out.push(line(`• ${h.label}${h.min ? ` (الحد الأدنى: ${h.min})` : ""}`));
  }
  const rest = open.length - 8;
  if (rest > 0) out.push(line(`و${num(rest)} غيرها`));
  return out.join("\n");
};

const askWater = (s) => {
  const goal = clampGoal(s.waterGoal);
  const had = Math.max(0, Math.round(s.water || 0));
  return line(
    had >= goal
      ? `💧 بلغت الهدف: ${num(had)} من ${num(goal)} ✅`
      : `💧 ${num(had)} من ${num(goal)} — باقي ${num(goal - had)}.`,
  );
};

/* --- the university --------------------------------------------------- */
const askUni = (s, now = new Date()) => {
  const uni = uniShape(s.uni);
  const pending = uniPending(uni);
  const out = [];
  /* Today's lectures, off the week grid — the same rows «اليوم» renders. */
  const dow = now.getDay();
  const todaySlots = [];
  for (const c of rows(uni.courses)) {
    /* `slot.day` is a `Date.getDay()` number, like everything else in this
       app that names a weekday. */
    for (const sl of rows(c.slots)) {
      if (Number(sl.day) === dow) todaySlots.push({ c, sl });
    }
  }
  if (todaySlots.length) {
    out.push(line(`🎓 محاضرات ${uniDayOf(dow)?.label || DOW[dow]}:`));
    todaySlots
      .sort((a, b) => String(a.sl.from).localeCompare(String(b.sl.from)))
      .forEach(({ c, sl }) =>
        out.push(
          line(`• ${c.name || c.code} ${time(sl.from)}${sl.room ? ` — ${sl.room}` : ""}`),
        ),
      );
  } else {
    out.push(line("🎓 ما فيه محاضرات اليوم."));
  }
  if (pending.length) {
    out.push("");
    out.push(line("المستحقّ:"));
    for (const t of pending.slice(0, 5)) {
      const left = daysUntil(t.due);
      out.push(
        line(
          `• ${t.title} — ${
            left === null
              ? t.due
              : left < 0
                ? `متأخر ${daysWord(-left)}`
                : left === 0
                  ? "اليوم"
                  : `بعد ${daysWord(left)}`
          }`,
        ),
      );
    }
  }
  return out.join("\n");
};

/* --- the goals -------------------------------------------------------- */
const askGoals = (s) => {
  const all = rows(s.goals);
  const q = currentQuarter();
  /* The ninety-day horizon only. A year-wide list is what the quarters exist
     to prevent, and the horizons above it are not things this week can move
     — the vault itself opens on the quarter for the same reason. */
  const mine = all.filter((g) => g.horizon === "quarter" && g.quarter === q && !g.done);
  if (!mine.length) {
    return line(`🎯 ما فيه أهداف ربعية مفتوحة في ${quarterOf(q).label}.`);
  }
  const ranked = mine
    .map((g) => ({ g, pct: goalPct(g, all) }))
    .sort((a, b) => b.pct - a.pct);
  const out = [
    line(`🎯 ${quarterOf(q).label} — ${num(mine.length)} هدف مفتوح:`),
  ];
  for (const { g, pct } of ranked.slice(0, 6)) {
    out.push(line(`• ${g.text} — ${num(pct)}٪ · ${pillarOf(g.pillar).label}`));
  }
  const rest = mine.length - 6;
  if (rest > 0) out.push(line(`و${num(rest)} غيرها في الخزنة.`));
  return out.join("\n");
};

/* --- the breaker ------------------------------------------------------ */
const askBreaker = (s) => {
  const list = rows(s.badHabits);
  if (!list.length) return line("🛡️ ما فيه عادة تكسرها الآن.");
  const out = [];
  for (const b of list) {
    const days = cleanDays(b);
    const saved = bleedSaved(b);
    out.push(
      line(
        `🛡️ «${b.title}» — ${daysWord(days)} نظيفة${
          saved ? ` · وفّرت ${costType(b.costType).id === "time" ? spanOf(saved) : money(saved)}` : ""
        }`,
      ),
    );
  }
  return out.join("\n");
};

/* --- the one entry point ---------------------------------------------- *
 *  `topic` comes off `parse.js`, so the table of question words lives with
 *  every other table of trigger words and not here.
 * ---------------------------------------------------------------------- */
export function answer(state, { topic, days = ASK_DAYS } = {}, now = new Date()) {
  const s = obj(state);
  const span = Math.max(1, Math.round(days || ASK_DAYS));
  if (topic === "spend") return askSpend(s, span);
  if (topic === "earn") return askEarn(s, span);
  if (topic === "money") return askMoney(s, span);
  if (topic === "discipline") return askDiscipline(s);
  if (topic === "month") return askMonth(s);
  if (topic === "read") return askRead(s);
  if (topic === "focus") return askFocus(s);
  if (topic === "prayer") return askPrayer(s, now);
  if (topic === "tasks") return askTasks(s);
  if (topic === "habits") return askHabits(s);
  if (topic === "water") return askWater(s);
  if (topic === "uni") return askUni(s, now);
  if (topic === "goals") return askGoals(s);
  if (topic === "breaker") return askBreaker(s);
  return null;
}

/* --- the week, once ---------------------------------------------------- *
 *  The one message the bot sends that is not about now. A day is too short a
 *  window to see a slope in, and the evening brief cannot show one: it
 *  reports today against nothing.
 *
 *  Gaps are named and never folded into the average, the streak is read off
 *  the rows rather than nudged, and every total comes from the same window
 *  function the income screen reads — so this cannot disagree with any
 *  screen it summarises.
 * ---------------------------------------------------------------------- */
export function weekReview(state, now = new Date()) {
  const s = obj(state);
  const today = dayKey();
  const from = addDays(today, -6);
  const history = rows(s.history);
  const span = history.filter((h) => h.date >= from && h.date <= today);
  const real = span.filter((h) => !isGap(h) && Array.isArray(h.done));
  const gaps = span.filter(isGap).length;
  const focus = focusShape(s.focus);
  const goal = Number.isFinite(+s.readGoal) ? +s.readGoal : READ_GOAL_DEFAULT;

  const out = [line(`🗓️ مراجعة الأسبوع — ${DOW[now.getDay()]}`), ""];

  if (real.length) {
    const avg = Math.round(real.reduce((n, h) => n + (h.pct || 0), 0) / real.length);
    const hit = real.filter((h) => (h.pct || 0) >= STREAK_TARGET).length;
    const best = real.reduce((a, b) => ((b.pct || 0) > (a.pct || 0) ? b : a));
    out.push(line(`📊 الانتظام: متوسط ${num(avg)}٪ على ${num(real.length)} يوم مسجّل.`));
    out.push(line(`${num(hit)} ${hit === 1 ? "يوم" : "أيام"} فوق ${num(STREAK_TARGET)}٪ · أفضل يوم ${num(best.pct || 0)}٪.`));
  } else {
    out.push(line("📊 ما سُجّل يوم واحد هذا الأسبوع."));
  }
  /* Counted out loud, never averaged. */
  if (gaps) out.push(line(`🕳️ ${daysWord(gaps)} بدون تسجيل — خارج المتوسط، ومذكورة لأنها حدثت.`));

  const run = streakRunFrom(history);
  out.push(
    line(
      run.days
        ? `🔥 السلسلة: ${countedWord(run.days)}${run.forgiven ? " ومعها يوم سماح مستهلك" : ""}.`
        : "🔥 ما فيه سلسلة قائمة.",
    ),
  );

  /* Which habit carried the week and which one did not. Over the roster each
     row actually recorded, so a habit added on Wednesday is not counted
     against Monday. */
  const tally = new Map();
  for (const h of real) {
    for (const id of h.all || []) {
      const at = tally.get(id) || { asked: 0, kept: 0 };
      at.asked += 1;
      if (h.done.includes(id)) at.kept += 1;
      tally.set(id, at);
    }
  }
  const live = rows(s.habits);
  const scored = scoredOf(live).map((h) => h.id);
  const ranked = [...tally.entries()]
    .filter(([id, v]) => v.asked >= 3 && scored.includes(id))
    .map(([id, v]) => ({
      label: live.find((h) => h.id === id)?.label || "عادة محذوفة",
      pct: Math.round((v.kept / v.asked) * 100),
    }))
    .sort((a, b) => b.pct - a.pct);
  if (ranked.length >= 2) {
    out.push("");
    out.push(line(`🏆 الأثبت: ${ranked[0].label} — ${num(ranked[0].pct)}٪`));
    const worst = ranked[ranked.length - 1];
    out.push(line(`🩹 الأضعف: ${worst.label} — ${num(worst.pct)}٪`));
    /* The floor, offered where it belongs: against the one habit the week
       says is actually hard. */
    const min = live.find((h) => h.label === worst.label)?.min;
    if (min) out.push(line(`وحدّه الأدنى المكتوب: ${min} — وهو تسجيل كامل.`));
    else out.push(line("اكتب لها حدًّا أدنى من شاشة الروتين، فاليوم المستحيل يحتاج بابًا."));
  }

  out.push("");
  const pages = sumPages(rows(s.reading).filter((r) => r.date >= from));
  out.push(line(`📖 القراءة: ${pagesWord(pages)} · هدف اليوم ${num(goal)} · السلسلة ${num(readStreak(s.reading, goal))}`));
  const mins = sessionMinutes(sessionsSince(s.sessions, 7, today));
  out.push(line(`🎧 التركيز: ${spanOf(mins)} في ${roundsWord(rows(sessionsSince(s.sessions, 7, today)).length)}${focus.goal ? ` · الهدف اليومي ${spanOf(focus.goal)}` : ""}`));
  out.push(
    line(
      `💰 المال: دخل ${money(amountSum(sinceDays(s.income, 7, today)))} · مصروف ${money(
        amountSum(sinceDays(s.expenses, 7, today)),
      )}`,
    ),
  );

  const bad = rows(s.badHabits);
  if (bad.length) {
    const standing = bad.filter((b) => cleanDays(b) > 0).length;
    out.push(line(`🛡️ الكاسر: ${num(standing)} من ${num(bad.length)} صامدة — أطولها ${daysWord(bad.reduce((n, b) => Math.max(n, cleanDays(b)), 0))}.`));
  }

  const due = uniPending(s.uni).filter((t) => {
    const left = daysUntil(t.due);
    return left !== null && left <= 7;
  });
  if (due.length) {
    out.push("");
    out.push(line(`🎓 الأسبوع القادم: ${due.slice(0, 4).map((t) => t.title).join(" · ")}`));
  }

  const open = rows(s.tasks).filter((t) => !t.done).length;
  out.push("");
  out.push(line(`📥 في المصفوفة ${tasksWord(open)} مفتوحة.`));
  return out.join("\n");
}
