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
  activeBook,
  pagesLeft,
  readPace,
  dueNotes,
  countNotes,
  notesSince,
  stalledDays,
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
  avgSleepHours,
  sleepDebtHours,
} from "../../src/state/life-state.mjs";
import { PRAYER_ROWS, clockAt, prayerTimes } from "../../src/utils/prayer-times.mjs";
import { fold } from "./parse.js";
import { scheduleCard } from "./views.js";
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
  pointsWord,
  sparkline,
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
  const book = activeBook(s.books);
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
    /* What is left and what the pace promises — the two figures that answer
       «وين وصلت؟» as a decision rather than as a bookmark. */
    const left = pagesLeft(book);
    const pace = readPace(book, s.reading);
    if (left !== null) {
      out.push(
        line(
          pace.days
            ? `باقي ${pagesWord(left)} — بهذا المعدّل تنهيه بعد ${daysWord(pace.days)}.`
            : `باقي ${pagesWord(left)}.`,
        ),
      );
    }
    const stalled = stalledDays(s.reading, book.id);
    if (stalled !== null && stalled >= 3) {
      out.push(line(`وآخر صفحة سجّلتها فيه قبل ${daysWord(stalled)}.`));
    }
    const notes = rows(book.notes).filter((n) => n && n.text).length;
    if (notes) out.push(line(`وعندك منه ${pointsWord(notes)}.`));
  } else {
    out.push(line("ما فيه كتاب معلّم «أقرأه الآن» على الرف."));
  }
  const due = dueNotes(s.books).length;
  if (due) out.push(line(`🔁 و${pointsWord(due)} تنتظر المراجعة — «راجع».`));
  return out.join("\n");
};

/* --- the points, and what is waiting ----------------------------------- *
 *  A shelf answers «كم صفحة؟» already. This answers the question the pages
 *  were read for: what did they actually leave behind, and how much of it is
 *  due to come back.
 * ---------------------------------------------------------------------- */
export const NOTES_ASK_SHOW = 5;

const askNotes = (s) => {
  const books = rows(s.books);
  const all = [];
  for (const b of books) {
    for (const n of rows(b.notes)) {
      if (n && n.text) all.push({ book: b, note: n });
    }
  }
  if (!all.length) {
    return [
      line("✍️ ما فيه فوائد محفوظة بعد."),
      line("أرسل «فائدة …» بعد أي قراءة — تُحفظ على الكتاب بصفحتها وترجع لك."),
    ].join("\n");
  }
  const due = dueNotes(books);
  const out = [line(`✍️ في المكتبة ${pointsWord(all.length)} · و${pointsWord(due.length)} تنتظر المراجعة.`), ""];
  /* Newest first here, unlike the book desk's own list: the question «وش
     الفوائد؟» asked in a chat is nearly always about what was read lately. */
  for (const { book, note } of all.slice(-NOTES_ASK_SHOW).reverse()) {
    out.push(line(`• ${note.text}`));
    out.push(line(`   ↳ ${book.title}${note.page ? ` — ص ${num(note.page)}` : ""}`));
  }
  if (due.length) out.push("");
  if (due.length) out.push(line("أرسل «راجع» لتبدأ بواحدة."));
  return out.join("\n");
};

/* --- a point, come back around ----------------------------------------- *
 *  The cue first and the point behind a tap, which is the difference between
 *  reading a note again and *recalling* it — and recall is the whole
 *  mechanism. A short point has nothing to hide and is shown whole: a cue
 *  that is the entire sentence is a quiz with the answer printed on it.
 *
 *  Here rather than in `views.js` for the same reason `weekReview` is: the
 *  scheduled reminder builds this card, and `reminders.js` must stay
 *  loadable by `node --test` with nothing installed. The buttons under it
 *  are `views.js`'s.
 * ---------------------------------------------------------------------- */
export const CUE_WORDS = 4;
export const CUE_MIN = 9;

export function noteCue(text) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length < CUE_MIN) return { cue: words.join(" "), hidden: false };
  return { cue: words.slice(0, CUE_WORDS).join(" ") + " …", hidden: true };
}

export function reviewCard(book, note, left = 0, on = dayKey()) {
  const { cue, hidden } = noteCue(note.text);
  /* `daysUntil(a, b)` counts forward from `b` to `a`, so this is how many
     days ago it was written — positive for every point but today's. */
  const age = note.at ? daysUntil(on, note.at) : null;
  const out = [
    line(`🔁 نقطة من «${book.title}»${note.page ? ` — صفحة ${num(note.page)}` : ""}`),
  ];
  if (Number.isFinite(age) && age > 0) out.push(line(`كتبتها قبل ${daysWord(age)}.`));
  out.push("");
  out.push(line(hidden ? `«${cue}»` : `«${note.text}»`));
  out.push("");
  out.push(
    line(
      hidden
        ? "اذكرها بتمامها، ثم اكشفها."
        : note.box
          ? `مراجعتها رقم ${num(note.box + 1)} — تذكّرتها؟`
          : "أول مراجعة — تذكّرتها؟",
    ),
  );
  if (left > 0) out.push(line(`و${pointsWord(left)} غيرها تنتظر.`));
  return out.join("\n");
}

/* The revealed point, in full and never trimmed — this is the one message
   whose whole content is the thing he is trying to keep. */
export const reviewFull = (book, note) =>
  [
    line(`📖 «${book.title}»${note.page ? ` — صفحة ${num(note.page)}` : ""}`),
    "",
    line(`«${note.text}»`),
    "",
    line("كانت حاضرة؟"),
  ].join("\n");

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
  if (topic === "notes") return askNotes(s);
  if (topic === "focus") return askFocus(s);
  if (topic === "prayer") return askPrayer(s, now);
  if (topic === "tasks") return askTasks(s);
  if (topic === "habits") return askHabits(s);
  if (topic === "water") return askWater(s);
  if (topic === "schedule") return scheduleCard(s, now);
  if (topic === "uni") return askUni(s, now);
  if (topic === "goals") return askGoals(s);
  if (topic === "breaker") return askBreaker(s);
  return null;
}

/* --- finding what he wrote --------------------------------------------- *
 *  A year of this app is a year of sentences: tasks, book notes, lessons,
 *  evening reflections, goals, reminders, money labels. They live on eight
 *  different screens and there has never been one place to ask «وين كتبت
 *  عن…؟» — not in the app either. A chat is the natural place for it,
 *  because a search is a question and this is the half of the system that
 *  answers questions.
 *
 *  Folded on both sides, so «التسويف» finds «تسويف» and a stray hamza does
 *  not hide a note. Nothing is written, and nothing is opened — the answer
 *  says where each hit lives, because the screen is where it gets edited.
 * ---------------------------------------------------------------------- */
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 4; // hits named per section before it starts counting

export function search(state, query) {
  const s = obj(state);
  const q = fold(query);
  if (q.length < SEARCH_MIN) return line("🔎 اكتب كلمتين على الأقل.");
  const hit = (v) => typeof v === "string" && v && fold(v).includes(q);

  const sections = [];
  const add = (icon, label, items) => {
    if (items.length) sections.push({ icon, label, items });
  };

  add("📥", "المهام", rows(s.tasks).filter((t) => hit(t.text) || hit(t.step)).map((t) => `${t.text}${t.done ? " ✅" : ""}`));
  add("🎯", "الأهداف", rows(s.goals).filter((g) => hit(g.text) || hit(g.why)).map((g) => g.text));
  add(
    "📖",
    "المكتبة",
    rows(s.books)
      .filter((b) => hit(b.title) || hit(b.lesson) || hit(b.summary) || rows(b.notes).some((n) => hit(n.text)))
      .map((b) => b.title),
  );
  /* The evening reflections, which are the hardest thing in this app to
     find again: they live one per archive row, behind a date. */
  add(
    "📝",
    "تقييمات المساء",
    rows(s.history)
      .filter((h) => hit(h.distraction) || hit(h.fix))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((h) => `${h.date} — ${h.distraction || ""}${h.fix ? ` / ${h.fix}` : ""}`),
  );
  add("💸", "المصاريف", rows(s.expenses).filter((e) => hit(e.label)).map((e) => `${e.label} — ${money(e.amount)}`));
  add("💰", "الدخل", rows(s.income).filter((e) => hit(e.label)).map((e) => `${e.label} — ${money(e.amount)}`));
  add("📅", "المواعيد", rows(s.events).filter((e) => hit(e.title) || hit(e.note)).map((e) => `${e.title} — ${e.date}`));
  add("🛡️", "الكاسر", rows(s.badHabits).filter((b) => hit(b.title) || hit(b.replacement)).map((b) => b.title));
  add(
    "🎓",
    "الجامعة",
    uniPending(s.uni).filter((t) => hit(t.title) || hit(t.notes)).map((t) => `${t.title} — ${t.due}`),
  );

  if (!sections.length) return line(`🔎 ما لقيت «${query}» في شي مكتوب.`);
  const out = [line(`🔎 «${query}»:`)];
  for (const sec of sections) {
    out.push("");
    out.push(line(`${sec.icon} ${sec.label}:`));
    for (const row of sec.items.slice(0, SEARCH_MAX)) out.push(line(`• ${row}`));
    const rest = sec.items.length - SEARCH_MAX;
    if (rest > 0) out.push(line(`و${num(rest)} غيرها`));
  }
  return out.join("\n");
}

/* --- the week, once ---------------------------------------------------- *
 *  The one message the bot sends that is not about now. A day is too short
 *  a window to see a slope in, and the evening brief cannot show one: it
 *  reports today against nothing.
 *
 *  **The review counts days, not percentages.** «٥ من ٧ أيام» is a picture
 *  a person can hold in his head; «٦٨٪» is a figure he has to translate
 *  before it means anything, and by the time he has translated it the
 *  review has lost him. Every line below answers one question — *how many
 *  days this week?* — and the questions that are not about days (money,
 *  university, projects) have their own messages and are not repeated here.
 *
 *  The seven days are walked into an array first, with `null` for a day
 *  that was never recorded. A gap and a zero are two different facts and
 *  this array is where they stop being confused: a bar chart cannot draw
 *  them the same, and «٥ من ٧ أيام» cannot count them the same.
 *
 *  The comparison with last week is stated as a change in days for the same
 *  reason: «+٢ أيام» is a week that went better, «+١٨٪» is a spreadsheet.
 * ---------------------------------------------------------------------- */
export function weekReview(state, now = new Date()) {
  const s = obj(state);
  const today = dayKey();
  const from = addDays(today, -6);
  const history = rows(s.history);
  const span = history.filter((h) => h.date >= from && h.date <= today);
  const focus = focusShape(s.focus);
  const goal = Number.isFinite(+s.readGoal) ? +s.readGoal : READ_GOAL_DEFAULT;

  /* The seven days, oldest first. `null` for a day that was never recorded
     — a gap and a zeroed day are different facts and this array is where
     they stop being confused. */
  const byDay = new Map(span.map((h) => [h.date, h]));
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const row = byDay.get(addDays(today, -i));
    days.push(row && !isGap(row) && Array.isArray(row.done) ? row : null);
  }
  const logged = days.filter(Boolean).length;
  const unlogged = 7 - logged;
  const complete = days.filter((d) => d && (d.pct || 0) >= STREAK_TARGET).length;
  const partial = logged - complete;

  const out = [line(`🗓️ مراجعة الأسبوع — ${DOW[now.getDay()]}`), ""];

  /* --- the tracker --- */
  out.push(line("📅 المتتبّع:"));
  out.push(
    line(
      `• سجّلت ${num(logged)} من ${num(7)} أيام${unlogged ? ` — و${countDays(unlogged)} بلا تسجيل` : " — بلا انقطاع"}`,
    ),
  );
  if (complete) out.push(line(`• منها ${countDays(complete)} فوق ${num(STREAK_TARGET)}٪`));
  if (partial) out.push(line(`• و${countDays(partial)} دون الهدف`));
  if (logged) {
    const bar = days.map((d) => (d ? sparkline([d.pct || 0], 100) : "◌")).join(" ");
    out.push(line(`${bar}${unlogged ? "   ◌ = بلا تسجيل" : ""}`));
  }
  out.push("");

  /* --- the habits, counted in days --- *
   *  Each habit answers «كم يومًا هذا الأسبوع؟» over the days it was on the
   *  roster — so a habit added on Wednesday is not counted against Sunday.
   *  The floor of `asked >= 3` keeps a habit that arrived yesterday off the
   *  list rather than reporting it as 1/1.
   * ------------------------------------------------------------------- */
  const tally = new Map();
  for (const d of days) {
    if (!d) continue;
    for (const id of d.all || []) {
      const at = tally.get(id) || { asked: 0, kept: 0 };
      at.asked += 1;
      if (d.done.includes(id)) at.kept += 1;
      tally.set(id, at);
    }
  }
  const live = rows(s.habits);
  const scored = new Set(scoredOf(live).map((h) => h.id));
  const ranked = [...tally.entries()]
    .filter(([id, v]) => v.asked >= 3 && scored.has(id))
    .map(([id, v]) => {
      const h = live.find((x) => x.id === id);
      return { label: h?.label || "عادة محذوفة", min: h?.min || "", kept: v.kept, asked: v.asked };
    })
    .sort((a, b) => b.kept - a.kept || a.label.localeCompare(b.label, "ar"));

  if (ranked.length) {
    out.push(line("📊 العادات — كم يومًا في الأسبوع:"));
    for (const r of ranked.slice(0, 6)) {
      const mark = r.kept === r.asked ? " ⭐" : r.kept === 0 ? " ⚠️" : "";
      out.push(line(`• ${num(r.kept)}/${num(r.asked)} — ${r.label}${mark}`));
    }
    if (ranked.length > 6) out.push(line(`و${num(ranked.length - 6)} عادات أخرى`));

    /* الأصعب: أدنى نسبة محافظة لا أدنى عدد — عادة سُئلت ٣ مرات وحُفظت مرة
       واحدة أصعب فعلًا من عادة سُئلت ٧ وحُفظت مرتين، وإن كان عددها أكبر.
       لا تُذكر إن حافظ عليها كل يوم — أسبوع كامل ليس له «أصعب». */
    const hardest = ranked
      .filter((r) => r.kept < r.asked)
      .sort((a, b) => a.kept / a.asked - b.kept / b.asked)[0];
    if (hardest) {
      out.push(
        line(
          `💡 الأصعب هذا الأسبوع: ${hardest.label}${
            hardest.min ? ` — جرّب أقل نسخة منها: ${hardest.min}` : ""
          }`,
        ),
      );
    }
    out.push("");
  }

  /* --- progress vs last week, also in days --- */
  const prevFrom = addDays(from, -7);
  const prevSpan = history.filter((h) => h.date >= prevFrom && h.date < from);
  const prevReal = prevSpan.filter((h) => !isGap(h) && Array.isArray(h.done));
  const prevLogged = prevReal.length;
  const prevComplete = prevReal.filter((h) => (h.pct || 0) >= STREAK_TARGET).length;
  if (prevLogged || logged) {
    out.push(line("📈 مقارنة بالأسبوع الماضي:"));
    out.push(line(`• الأيام المسجّلة: ${num(prevLogged)} ← ${num(logged)} ${delta(prevLogged, logged)}`));
    out.push(line(`• الأيام الكاملة: ${num(prevComplete)} ← ${num(complete)} ${delta(prevComplete, complete)}`));
    out.push("");
  }

  /* --- the streak --- */
  const run = streakRunFrom(history);
  out.push(
    line(
      run.days
        ? `🔥 السلسلة: ${countedWord(run.days)}${run.forgiven ? " (ومعها يوم سماح مستهلك)" : ""}.`
        : "🔥 ما فيه سلسلة قائمة — كل يوم جديد بداية.",
    ),
  );

  /* --- reading and focus, also as days --- */
  const readingInWeek = rows(s.reading).filter((r) => r.date >= from && r.date <= today);
  const readingDays = new Set(readingInWeek.filter((r) => (r.pages || 0) > 0).map((r) => r.date)).size;
  const pages = sumPages(readingInWeek);
  /* الصفحات وحدها رقم؛ الفائدة هي الجملة التي يمكن أن يرددها بعد أسبوع —
     نفس التفريق الذي من أجله وُجد noteShape أصلًا، والمراجعة الأسبوعية
     كانت تذكر الصفحات فقط وتترك ما استُخلص منها غير مذكور. */
  const points = notesSince(s.books, from);
  out.push(
    line(
      `📖 القراءة: ${num(readingDays)} من ${num(7)} أيام · ${pagesWord(pages)}${
        points ? ` · ${pointsWord(points)}` : ""
      }`,
    ),
  );

  const focusInWeek = rows(sessionsSince(s.sessions, 7, today));
  const focusDays = new Set(focusInWeek.map((r) => r.date)).size;
  const mins = sessionMinutes(focusInWeek);
  out.push(
    line(
      `🎧 التركيز: ${num(focusDays)} من ${num(7)} أيام · ${spanOf(mins)}${
        focus.goal ? ` · الهدف اليومي ${spanOf(focus.goal)}` : ""
      }`,
    ),
  );

  /* --- sleep & recovery (مختبر النوم في التقرير الأسبوعي) --- *
   *  تقرأ `avgSleepHours`/`sleepDebtHours` نفسهما اللذين يقرآن تعب النادي
   *  منهما الآن — انظر `gymSleepAdvice` في `life-state-gym.mjs` — فلا
   *  تختلف هذه السطر وذاك التحذير عن الأسبوع نفسه. */
  const avgSleep = avgSleepHours(s.sleepLogs, 7, today);
  if (avgSleep !== null) {
    const debt = sleepDebtHours(s.sleepLogs, 7, today);
    out.push(
      line(
        `🌙 النوم: معدل ${num(avgSleep)} س/ليلة${
          debt > 0 ? ` (عجز ${num(debt)} س ⚠️)` : " (نوم كافٍ ومتوازن ✅)"
        }`,
      ),
    );
  }

  /* --- monthly goals commitment (أهداف الشهر والالتزام) --- */
  const goalsList = Array.isArray(s.goals) ? s.goals : [];
  const monthGoals = goalsList.filter((g) => !g.done && (g.horizon === "quarter" || g.horizon === "month" || g.target > 0));
  if (monthGoals.length) {
    const sumPct = monthGoals.reduce((acc, g) => {
      if (g.target > 0) return acc + Math.min(100, Math.round(((g.current || 0) / g.target) * 100));
      return acc + (g.done ? 100 : 0);
    }, 0);
    const avgCommitment = Math.round(sumPct / monthGoals.length);
    out.push("");
    out.push(line(`🎯 إنجاز أهداف الشهر: <b>${num(avgCommitment)}٪</b> (${num(monthGoals.length)} أهداف نشطة)`));
  }

  /* --- open tasks, kept because they cross the week --- */
  const open = rows(s.tasks).filter((t) => !t.done).length;
  if (open) {
    out.push("");
    out.push(line(`📥 في المصفوفة ${tasksWord(open)} مفتوحة.`));
  }

  return out.join("\n");
}

/* How a day count reads in Arabic. Duals carry their own number, so «٢ أيام»
   would be a translation and not a sentence — the same rule `daysPhrase`
   and `tasksPhrase` in `views.js` already follow. */
const countDays = (n) => {
  if (n === 0) return "";
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومان";
  return `${num(n)} أيام`;
};

/* How a change reads in Arabic: a signed count, so a flat week says
   «بلا تغيير» rather than a bare zero that looks like a loss. */
const delta = (prev, now) => {
  const d = now - prev;
  if (d > 0) return `(+${num(d)})`;
  if (d < 0) return `(-${num(Math.abs(d))})`;
  return "(بلا تغيير)";
};