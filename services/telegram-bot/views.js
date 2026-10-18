/* --- what the bot says, and the buttons it says it with ----------------
 *  Every string in this file is Arabic, because every string in this app is.
 *  The number and time formatters moved to `fmt.js` the moment a second file
 *  needed them: this one imports grammY for its keyboards, and the advice
 *  engine and the question answers have to stay loadable by `node --test`
 *  with nothing installed.
 * --------------------------------------------------------------------- */
import { InlineKeyboard } from "grammy";
import {
  TOP_TASK_CAP,
  DAILY_GOAL_DEFAULT,
  NUDGE_THRESHOLD_DEFAULT,
  scoredOf,
  rows,
  dayKey,
  daysUntil,
  runLeft,
  phaseOf,
  runRunning,
  pctOf,
  pagesLeft,
  countNotes,
  dueNotes,
  botShape,
} from "../../src/state/life-state.mjs";
import { PRAYER_ROWS, clockAt, prayerTimes } from "../../src/utils/prayer-times.mjs";
import {
  num,
  money,
  time,
  line,
  spanOf,
  daysWord,
  pagesWord,
  pointsWord,
  barRow,
} from "./fmt.js";

export { num, money, time } from "./fmt.js";

/* How many rows a list in a chat bubble may name before it starts counting
   instead. Six fits a phone screen without scrolling. */
const NAME_MAX = 6;

/* --- the confirmations ------------------------------------------------- */

export const savedExpense = (row, balance) =>
  [
    line(`✅ مصروف: ${row.label} — ${money(row.amount)}${onDay(row.date)}`),
    line(`الرصيد الآن: ${money(balance)}`),
  ].join("\n");

export const savedIncome = (row, balance) =>
  [
    line(`✅ دخل: ${row.label} — ${money(row.amount)}${onDay(row.date)}`),
    row.hours ? line(`الساعات: ${num(row.hours)}`) : null,
    line(`الرصيد الآن: ${money(balance)}`),
  ]
    .filter(Boolean)
    .join("\n");

export const savedTask = (out) => {
  if (out.capped) {
    return [
      line(`📥 أضفتها للمصفوفة: ${out.row.text}`),
      line(
        `أما اليوم فمكتمل بـ${num(TOP_TASK_CAP)} مهام — والحد مقصود. ارفعها من «جهّز غدك» أو أنجِز واحدة أولًا.`,
      ),
    ].join("\n");
  }
  return out.today
    ? line(`🎯 من مهام اليوم: ${out.row.text}`)
    : line(`📥 في صندوق الوارد: ${out.row.text}`);
};

export const savedWater = (out) =>
  line(`💧 ${num(out.count)} من ${num(out.goal)} أكواب اليوم`);

export const savedHabit = (out) =>
  [
    line(`✅ ${out.habit.label}${out.tiny ? " (الحد الأدنى — ويُحتسب كاملًا)" : ""}`),
    line(`انتظام اليوم: ${num(out.pct)}٪`),
  ].join("\n");

export const savedTaskDone = (out) => line(`✅ أنجزت: ${out.row.text}`);

export const undone = () => line("↩︎ رجّعتها.");

/* --- the keyboards ----------------------------------------------------- */

export const undoKeys = (token) =>
  new InlineKeyboard().text("↩︎ تراجع", `undo:${token}`);

export function openKeys(state, max = 5) {
  const kb = new InlineKeyboard();
  const open = scoredOf(rows(state.habits)).filter((h) => !h.done).slice(0, max);
  for (const h of open) {
    kb.text(`✓ ${h.label}`.slice(0, 40), `tick:${h.id}`);
    if (h.min) kb.text(`◔ ${h.min}`.slice(0, 40), `tiny:${h.id}`);
    kb.row();
  }
  kb.text("💧 + كاس ماء", "water:1");
  return kb;
}

export function coachKeys(actions) {
  const kb = new InlineKeyboard();
  const list = (actions || []).slice(0, 6);
  list.forEach((a, i) => {
    kb.text(String(a.label).slice(0, 40), a.data);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

export const PAGE_STEPS = [5, 10, 20, 30];
export const readKeys = () => {
  const kb = new InlineKeyboard();
  for (const n of PAGE_STEPS) kb.text(`📖 ${n}`, `read:${n}`);
  return kb.row().text("لاحقًا", "read:0");
};

export function focusKeys(run, now = Date.now()) {
  const kb = new InlineKeyboard();
  if (!run) return kb.text("▶️ ابدأ جولة", "focus:start").text("☕ استراحة", "focus:break");
  if (runRunning(run)) {
    return kb
      .text("⏸️ وقفة", "focus:pause")
      .text("⏹️ أوقفها واحسبها", "focus:stop");
  }
  return kb.text("▶️ أكمل", "focus:resume").text("⏹️ أوقفها واحسبها", "focus:stop");
}

export function focusStand(state, now = Date.now()) {
  const run = state.focus?.run || null;
  if (!run) return line("🎧 ما فيه جولة قائمة. أرسل «ابدأ تركيز» أو «ابدأ تركيز ٥٠».");
  const left = Math.ceil(runLeft(run, now) / 60);
  const label = phaseOf(run.phase).label;
  return [
    line(
      runRunning(run)
        ? `🎧 ${label} — باقي ${spanOf(left)}${run.label ? ` · ${run.label}` : ""}`
        : `⏸️ ${label} موقوفة — باقي ${spanOf(left)}${run.label ? ` · ${run.label}` : ""}`,
    ),
  ].join("\n");
}

export function prepKeys(tasks) {
  const kb = new InlineKeyboard();
  for (const t of (tasks || []).slice(0, 6)) {
    kb.text(`🌙 ${t.text}`.slice(0, 40), `prep:${t.id}`).row();
  }
  return kb;
}

export function badKeys(list, act) {
  const kb = new InlineKeyboard();
  for (const b of (list || []).slice(0, 6)) {
    kb.text(`${act === "fall" ? "💔" : "🛡️"} ${b.title}`.slice(0, 40), `${act}:${b.id}`).row();
  }
  return kb;
}

export function tagKeys(act, badId, tags) {
  const kb = new InlineKeyboard();
  (tags || []).slice(0, 8).forEach((t, i) => {
    kb.text(String(t.label).slice(0, 24), `${act}t:${badId}:${t.id}`);
    if (i % 2 === 1) kb.row();
  });
  return kb.row().text("سجّلها بدون محرّك", `${act}t:${badId}:`);
}

export const menuKeys = () =>
  new InlineKeyboard()
    .text("📅 يومي", "menu:today")
    .text("⏳ الباقي", "menu:open")
    .row()
    .text("🧠 المدرّب", "menu:coach")
    .text("🗓️ الأسبوع", "menu:week")
    .row()
    .text("🎧 التركيز", "menu:focus")
    .text("📚 المكتبة", "menu:books")
    .row()
    .text("🔁 راجع فائدة", "rev:now")
    .text("📝 الشرح", "menu:help");

export const COMMANDS = [
  { command: "today", description: "حالة اليوم الآن" },
  { command: "now", description: "ما زال مفتوحًا، بأزرار" },
  { command: "coach", description: "ما يستحق انتباهك الآن" },
  { command: "week", description: "مراجعة الأسبوع" },
  { command: "focus", description: "جولة تركيز — ابدأ أو أوقف" },
  { command: "books", description: "المكتبة — وأين وصل كل كتاب" },
  { command: "review", description: "راجع فائدة من كتاب قرأته" },
  { command: "morning", description: "موجز الصباح" },
  { command: "evening", description: "إقفال اليوم" },
  { command: "menu", description: "القائمة" },
  { command: "find", description: "ابحث في كل ما كتبته" },
  { command: "help", description: "ماذا يفهم من رسائلك" },
];

export const savedReading = (out) => {
  const got = [];
  if (out.added) got.push(line(`➕ أضفته للرف وعلّمته «أقرأه الآن»: «${out.book.title}»`));
  else if (out.started) got.push(line(`📗 بدأت «${out.book.title}» — صار «أقرأه الآن».`));
  got.push(line(`📖 ${pagesWord(out.pages)} في «${out.book.title}».`));
  got.push(
    line(
      out.total
        ? `عند صفحة ${num(out.at)} من ${num(out.total)}${out.stand?.pct !== null && out.stand?.pct !== undefined ? ` (${num(out.stand.pct)}٪)` : ""}.`
        : `عند صفحة ${num(out.at)}.`,
    ),
  );
  if (out.stand?.left !== null && out.stand?.left !== undefined) {
    got.push(
      line(
        out.stand.eta
          ? `باقي ${pagesWord(out.stand.left)} — بهذا المعدّل تنهيه بعد ${daysWord(out.stand.eta)}.`
          : `باقي ${pagesWord(out.stand.left)}.`,
      ),
    );
  }
  got.push(
    line(
      out.today >= out.goal
        ? `وبلغت هدف اليوم (${num(out.goal)}) ✅${out.streak ? ` — ${daysWord(out.streak)} متصلة.` : ""}`
        : `اليوم ${num(out.today)} من ${num(out.goal)}.`,
    ),
  );
  return got.join("\n");
};

export const askNote = (out) =>
  [
    line("✍️ وما أكبر فائدة من قراءة اليوم؟"),
    line(`أرسلها كذا: «فائدة …» — وتُحفظ على «${out.book.title}» عند صفحة ${num(out.at)}،`),
    line("وترجع لك بعد يوم، ثم بعد ثلاثة، ثم بعد أسبوع — حتى تصير لك."),
  ].join("\n");

export const noteAskKeys = (book) =>
  new InlineKeyboard()
    .text("📚 فوائد هذا الكتاب", `nlist:${book.id}`)
    .text("🔁 راجع نقطة", "rev:now");

export const savedNote = (out) =>
  [
    line(`✍️ حُفظت على «${out.book.title}»${out.note.page ? ` — صفحة ${num(out.note.page)}` : ""}:`),
    line(`«${out.note.text}»`),
    line(`المحفوظ من هذا الكتاب: ${pointsWord(out.count)} · وترجع لك غدًا للمراجعة.`),
  ].join("\n");

export const noteActKeys = (token) =>
  new InlineKeyboard().text("📌 اجعلها مهمة", `nact:${token}`);

export const savedLesson = (out) =>
  [
    line(`🪶 درس «${out.book.title}»:`),
    line(`«${out.book.lesson}»`),
    out.was ? line(`(وكان: «${out.was}» — والتراجع يرجّعه.)`) : null,
  ]
    .filter(Boolean)
    .join("\n");

export const savedBookAdd = (out) =>
  out.act === "already"
    ? line(`📚 «${out.book.title}» على الرف أصلاً.`)
    : [
        line(`➕ أضفته للرف: «${out.row.title}»${out.row.author ? ` — ${out.row.author}` : ""}`),
        line("وأرسل «ابدأ كتاب …» لتعليمه «أقرأه الآن»، أو سجّل صفحاتك مباشرة."),
      ].join("\n");

export const savedBookStart = (out) =>
  [
    line(`📗 «${out.book.title}» صار «أقرأه الآن».`),
    out.stand?.at
      ? line(
          out.stand.left !== null
            ? `عند صفحة ${num(out.stand.at)} · باقي ${pagesWord(out.stand.left)}.`
            : `عند صفحة ${num(out.stand.at)}.`,
        )
      : line("وكل «قرأت … صفحة» بعد الآن يتقدّم فيه."),
  ].join("\n");

export const savedBookFinish = (out) =>
  [
    line(`🏁 أنهيت «${out.book.title}»${onDay(out.book.finishedAt) || " اليوم"}.`),
    out.pages
      ? line(`سجّلت فيه ${pagesWord(out.pages)} على ${daysWord(out.days)}.`)
      : line("ما فيه صفحات مسجّلة عليه — والرف يعرف أنك أنهيته."),
    line(
      out.notes
        ? `وعندك منه ${pointsWord(out.notes)} — وترجع لك للمراجعة.`
        : "وما حفظت منه نقطة واحدة — أرسل «فائدة …» الآن قبل أن تبرد.",
    ),
    out.hasLesson ? null : line("وأهم سؤال: «درس الكتاب …» في جملة واحدة؟"),
  ]
    .filter(Boolean)
    .join("\n");

export const RATE_STARS = [5, 4, 3, 2, 1];
export const rateKeys = (bookId) => {
  const kb = new InlineKeyboard();
  for (const n of RATE_STARS) kb.text("★".repeat(n), `rate:${bookId}:${n}`);
  return kb;
};

export const savedBookRate = (out) =>
  line(
    out.book.rating
      ? `${"★".repeat(out.book.rating)} على «${out.book.title}».`
      : `أُزيل التقييم عن «${out.book.title}».`,
  );

export function bookKeys(list, act, token, max = 6) {
  const kb = new InlineKeyboard();
  for (const b of (list || []).slice(0, max)) {
    kb.text(`📖 ${b.title}`.slice(0, 40), `${act}:${token}:${b.id}`).row();
  }
  return kb;
}

export const newBookKeys = (token, title) =>
  new InlineKeyboard().text(`➕ أضف «${title}»`.slice(0, 40), `nbk:${token}`);

export function shelf(state) {
  const books = rows(state.books);
  if (!books.length) {
    return line("📚 الرف فاضي. أرسل «أضف كتاب <العنوان>».");
  }
  const reading = books.filter((b) => b.status === "reading");
  const planned = books.filter((b) => b.status === "planned");
  const done = books.filter((b) => b.status === "finished");
  const out = [line("📚 المكتبة:"), ""];
  if (reading.length) {
    out.push(line("📗 أقرأه الآن:"));
    for (const b of reading.slice(0, NAME_MAX)) {
      const pct = pctOf(b);
      const left = pagesLeft(b);
      out.push(
        line(
          `• ${b.title}${pct === null ? "" : ` — ${barRow("", pct, 100, 8).trim()} ${num(pct)}٪`}`,
        ),
      );
      const bits = [];
      if (b.page) bits.push(`صفحة ${num(b.page)}`);
      if (left !== null) bits.push(`باقي ${pagesWord(left)}`);
      const notes = rows(b.notes).filter((n) => n && n.text).length;
      if (notes) bits.push(pointsWord(notes));
      if (bits.length) out.push(line(`   ${bits.join(" · ")}`));
    }
    out.push("");
  }
  if (planned.length) {
    out.push(line(`📘 أنوي قراءته (${num(planned.length)}):`));
    planned.slice(0, NAME_MAX).forEach((b) => out.push(line(`• ${b.title}`)));
    const rest = planned.length - NAME_MAX;
    if (rest > 0) out.push(line(`و${num(rest)} غيرها`));
    out.push("");
  }
  out.push(
    line(
      done.length
        ? `🏁 أنهيت ${num(done.length)} — وفي المكتبة ${pointsWord(countNotes(books))}.`
        : `🏁 ما أنهيت كتابًا بعد — وفي المكتبة ${pointsWord(countNotes(books))}.`,
    ),
  );
  const due = dueNotes(books).length;
  if (due) out.push(line(`🔁 و${pointsWord(due)} تنتظر المراجعة — أرسل «راجع».`));
  return out.join("\n");
}

export function reviewKeys(book, note, hidden) {
  const kb = new InlineKeyboard();
  if (hidden) return kb.text("👁️ اكشف الفائدة", `rvs:${book.id}:${note.id}`);
  return kb
    .text("✅ تذكّرتها", `rvk:${book.id}:${note.id}`)
    .text("🔁 ما تذكّرتها", `rvf:${book.id}:${note.id}`);
}

export const savedReview = (out) =>
  [
    line(
      out.kept
        ? `✅ تمام — ترجع لك بعد ${daysWord(daysUntil(out.note.due) || 1)}.`
        : "🔁 ترجع لك غدًا — والنسيان ليس فشلًا، هو الجدول.",
    ),
    out.left
      ? line(`وباقي ${pointsWord(out.left)} الليلة — أرسل «راجع».`)
      : line("وما بقي شي للمراجعة الليلة."),
  ].join("\n");

export const NOTE_SHOW = 10;

export function noteList(book) {
  const notes = rows(book.notes).filter((n) => n && n.text);
  if (!notes.length) {
    return line(`📖 «${book.title}» — ما فيه نقاط بعد. أرسل «فائدة …».`);
  }
  const out = [line(`📖 فوائد «${book.title}» (${num(notes.length)}):`), ""];
  for (const n of notes.slice(-NOTE_SHOW)) {
    out.push(line(`• ${n.text}${n.page ? ` — ص ${num(n.page)}` : ""}`));
  }
  const rest = notes.length - NOTE_SHOW;
  if (rest > 0) out.push(line(`و${pointsWord(rest)} أقدم — في مكتب الكتاب.`));
  if (book.lesson) {
    out.push("");
    out.push(line(`🪶 الدرس: «${book.lesson}»`));
  }
  return out.join("\n");
}

export const savedFocusStart = (out) =>
  [
    line(`▶️ ${phaseOf(out.run.phase).label} — ${spanOf(out.run.planned)}${out.run.label ? ` · ${out.run.label}` : ""}`),
    line("أرسل «أوقف» أو «وقفة» في أي لحظة، والجرس عندي."),
  ].join("\n");

export const savedFocusBreak = (out) =>
  line(`☕ ${phaseOf(out.run.phase).label} — ${spanOf(out.run.planned)}. الراحة نصف الطريقة.`);

export const savedFocusPause = (out) =>
  line(`⏸️ موقوفة عند ${spanOf(out.spent)} من ${spanOf(out.run.planned)}.`);

export const savedFocusResume = (out) =>
  line(`▶️ تكملة — باقي ${spanOf(Math.ceil(runLeft(out.run) / 60))}.`);

export const savedFocusStop = (out) =>
  out.logged
    ? [
        line(`⏹️ سُجّلت ${spanOf(out.minutes)} من ${spanOf(out.run.planned)}.`),
        line("ناقصة، ومسجّلة — الدقائق التي عُمِلت لا تُمحى لأن الجولة لم تكمل."),
      ].join("\n")
    : line("⏹️ أوقفتها قبل أن تبلغ دقيقة — ما سُجّل شي.");

export const savedFocusLog = (out) =>
  line(`🎧 سُجّلت ${spanOf(out.row.minutes)}${out.row.label ? ` على «${out.row.label}»` : ""}.`);

export const savedFocusSettle = (out) =>
  line(
    out.minutes
      ? `✅ اعتُمدت ${spanOf(out.minutes)}.`
      : "✅ أُغلقت الجولة — ما فيه دقائق يمكن الجزم بها.",
  );

export const savedFocusDrop = () => line("🗑️ أُسقطت الجولة المعلّقة.");

export const savedHold = (out) =>
  [
    line(`🛡️ صمدت أمام «${out.bad.title}».`),
    line(
      out.days
        ? `والعدّاد ما تحرّك: ${daysWord(out.days)} نظيفة — الصمود استمرار، لا حدث فيه.`
        : "والعدّاد ما تحرّك — الصمود استمرار، لا حدث فيه.",
    ),
  ].join("\n");

export const savedFall = (out) =>
  [
    line(`💔 سُجّلت على «${out.bad.title}» — والعدّاد بدأ من اليوم.`),
    line(
      out.was
        ? `الجولة التي انتهت: ${daysWord(out.was)} — مكتوبة في السجل، فما ضاعت.`
        : "مكتوبة في السجل، فما ضاعت.",
    ),
  ].join("\n");

export const savedPrep = (out) =>
  [
    line(`🌙 لغدٍ: ${out.task.text}`),
    line(`${num(out.picks)} من ${num(TOP_TASK_CAP)} مختارة.`),
  ].join("\n");

export const savedTop = (out) => line(`🎯 من مهام اليوم: ${out.row.text}`);

export const onDay = (date) => (date === dayKey() ? "" : ` · ${date}`);

export const savedEvent = (out) =>
  [
    line(`📅 ${out.row.title} — ${out.row.date}${out.row.time ? ` ${time(out.row.time)}` : ""}`),
    line(out.row.time ? "في التقويم." : "في التقويم، بلا ساعة."),
  ].join("\n");

export const savedAbsence = (out) =>
  [
    line(`🎓 غياب في «${out.course.name || out.course.code}» — المجموع ${num(out.count)}.`),
    out.cap
      ? line(
          out.count >= out.cap
            ? `وبلغت الحدّ المسموح (${num(out.cap)}). ⚠️`
            : `الحدّ ${num(out.cap)} — باقي ${num(out.cap - out.count)}.`,
        )
      : null,
  ]
    .filter(Boolean)
    .join("\n");

export const savedMark = (out) =>
  [
    line(`🎓 ${out.course.name || out.course.code} — ${out.row.label}: ${num(out.row.score)} من ${num(out.row.max)}`),
    line(`أي ${num(Math.round((out.row.score / out.row.max) * 100))}٪.`),
  ].join("\n");

export const savedGoal = (out) =>
  [
    line(`🎯 ${out.goal.text}: ${num(out.now)} من ${num(out.goal.target)}${out.goal.unit ? ` ${out.goal.unit}` : ""}`),
    line(
      out.now >= out.goal.target
        ? "وبلغت الهدف ✅ — علّمه «مُحقَّق» من الخزنة."
        : `تقدّمت ${num(out.now - out.was)} · ${num(Math.round((out.now / out.goal.target) * 100))}٪`,
    ),
  ].join("\n");

export const savedUntick = (out) =>
  [
    line(`↩︎ أُزيل تأشير «${out.habit.label}».`),
    out.pages
      ? line(`وسُحبت ${pagesWord(out.pages)} من سجلّ القراءة ورجع عدّاد الكتاب.`)
      : null,
    line(`انتظام اليوم: ${num(out.pct)}٪`),
  ]
    .filter(Boolean)
    .join("\n");

export const savedDayEdit = (out) =>
  [
    line(
      out.on
        ? `✅ سُجّلت «${out.habit.label}» في ${out.date}.`
        : `↩︎ أُزيلت «${out.habit.label}» من ${out.date}.`,
    ),
    line(`انتظام ذلك اليوم صار ${num(out.pct)}٪ — والسلسلة أُعيد حسابها من السجلّ.`),
  ].join("\n");

export function courseKeys(list, act, token) {
  const kb = new InlineKeyboard();
  for (const c of (list || []).slice(0, 8)) {
    kb.text(`${c.name || c.code}`.slice(0, 40), `${act}:${token}:${c.id}`).row();
  }
  return kb;
}

export function goalKeys(list, token) {
  const kb = new InlineKeyboard();
  for (const g of (list || []).slice(0, 6)) {
    kb.text(`🎯 ${g.text}`.slice(0, 40), `gset:${token}:${g.id}`).row();
  }
  return kb;
}

export function habitKeys(list, act, max = 6) {
  const kb = new InlineKeyboard();
  for (const h of (list || []).slice(0, max)) {
    kb.text(`${act === "untick" ? "↩︎" : "✓"} ${h.label}`.slice(0, 40), `${act === "untick" ? "unt" : "tick"}:${h.id}`).row();
  }
  return kb;
}

export const snoozeKey = (kb, token, minutes) =>
  kb.text(`⏰ بعد ${minutes} دقيقة`, `snz:${token}`);

export const savedReflect = (out) =>
  line(
    out.field === "distraction"
      ? `📝 كُتب في تقييم اليوم: شتّتني ${out.note}`
      : `📝 كُتب في تقييم اليوم: الحل ${out.note}`,
  );

/* --- the two briefs --------------------------------------------------- */

export function morning(state, day, quote) {
  const out = [line("☀️ صباح الخير — هذا يومك:"), ""];

  const goal = Number.isFinite(state.goal) ? state.goal : DAILY_GOAL_DEFAULT;
  out.push(line(`🎯 هدف اليوم: ${num(goal)}٪.`));
  out.push("");

  if (state.place && Number.isFinite(state.place.lat)) {
    const t = prayerTimes(state.place, new Date());
    out.push(line("🕌 الصلوات:"));
    out.push(
      PRAYER_ROWS.filter((p) => !p.mark)
        .map((p) => `${p.label} ${time(clockAt(t[p.id]))}`)
        .join("  ·  "),
    );
    out.push("");
  }

  out.push(line(`🎯 أهم ${num(TOP_TASK_CAP)} مهام:`));
  if (!day.tasksOpen.length) {
    out.push(
      line(
        day.tasks.length
          ? "كلها مُنجزة — نظّف الطاولة أو ارفع السقف."
          : "ما اخترت مهام اليوم بعد. أرسل: «اليوم: …»",
      ),
    );
  } else {
    day.tasksOpen.forEach((t, i) => {
      out.push(line(`${num(i + 1)}. ${t.text}`));
      if (t.step) out.push(line(`    ↳ ${t.step}`));
    });
  }

  if (day.book) {
    out.push("");
    const left = pagesLeft(day.book);
    out.push(
      line(
        `📖 ${day.book.title}${day.book.page ? ` — صفحة ${num(day.book.page)}` : ""}${
          left !== null ? ` · باقي ${pagesWord(left)}` : ""
        }`,
      ),
    );
  }
  if (day.notesDue) {
    out.push(line(`🔁 و${pointsWord(day.notesDue)} تنتظر المراجعة — «راجع».`));
  }

  if (quote) {
    out.push("");
    out.push(line(`💬 ${quote.text}`));
    if (quote.author) out.push(line(`— ${quote.author}`));
  }
  return out.join("\n");
}

export function evening(state, day) {
  const out = [line("🌙 إقفال اليوم:"), ""];
  out.push(line(`الانتظام: ${num(day.pct)}٪`));

  const goal = Number.isFinite(state.goal) ? state.goal : DAILY_GOAL_DEFAULT;
  const remaining = Math.max(0, goal - day.pct);
  if (remaining > 0) {
    out.push(
      line(`🎯 الهدف اليومي: ${num(goal)}٪ — باقي ${num(remaining)} نقطة.`),
    );
    out.push(line("أي عادة تنجزها الآن تقرّبك."));
  } else {
    out.push(line(`🎯 تجاوزت هدفك اليومي (${num(goal)}٪) ✅`));
  }
  out.push("");

  out.push(line(`العادات: ${num(day.habitsDone)} من ${num(day.habitsAll)}`));
  out.push(
    line(
      `المهام: ${num(day.tasks.filter((t) => t.done).length)} من ${num(day.tasks.length)}`,
    ),
  );
  out.push(line(`الماء: ${num(day.water)} من ${num(day.waterGoal)}`));
  out.push(line(`القراءة: ${num(day.readToday)} من ${num(day.readGoal)} صفحة`));
  out.push(
    line(`المال هذا الأسبوع: دخل ${money(day.earnedWeek)} · مصروف ${money(day.spentWeek)}`),
  );
  out.push("");
  if (day.readToday > 0 && day.book && !day.notesToday) {
    out.push(line(`✍️ وما أكبر فائدة من ${pagesWord(day.readToday)} اليوم؟ أرسل «فائدة …».`));
    out.push("");
  } else if (day.notesToday) {
    out.push(line(`✍️ وحفظت ${pointsWord(day.notesToday)} من قراءة اليوم.`));
    out.push("");
  }
  if (day.openScored.length) {
    out.push(line("باقي عليك — اضغط ما أنجزته:"));
  } else {
    out.push(line("كل عاداتك الأساسية مسجّلة ✅"));
  }
  return out.join("\n");
}

export function today(state, day) {
  const out = [line(`📅 ${day.date}`), ""];
  out.push(line(`الانتظام: ${num(day.pct)}٪`));
  out.push(line(`الماء: ${num(day.water)} من ${num(day.waterGoal)}`));
  out.push(line(`الرصيد: ${money(day.balance)}`));
  out.push("");
  if (day.tasksOpen.length) {
    out.push(line("المهام المفتوحة:"));
    day.tasksOpen.forEach((t) => out.push(line(`• ${t.text}`)));
  } else {
    out.push(line("لا مهام مفتوحة اليوم."));
  }
  if (day.openScored.length) {
    out.push("");
    out.push(line("عادات لم تُسجّل:"));
    day.openScored.slice(0, NAME_MAX).forEach((h) => out.push(line(`• ${h.label}`)));
    const rest = day.openScored.length - NAME_MAX;
    if (rest > 0) out.push(line(`و${num(rest)} غيرها`));
  }
  return out.join("\n");
}

export function taskKeys(day) {
  const kb = new InlineKeyboard();
  for (const t of day.tasksOpen) kb.text(`✓ ${t.text}`.slice(0, 40), `task:${t.id}`).row();
  return kb;
}

/* --- the smart nudge, at the hour the day can still change ------------ *
 *  Different from the evening brief in exactly one way and it is the whole
 *  point: this one is *allowed to say nothing*. The evening brief is a
 *  verdict — it says the number whatever the number is — and this one
 *  speaks only when there is a decision left to make.
 *
 *  Three shapes and one silence:
 *
 *  - Past the goal: silent. Nothing to nudge.
 *  - Close to the goal (`remaining <= 5`): «باقي ٥ نقاط» — a run one habit
 *    finishes is a run worth finishing.
 *  - With a live streak: said out loud, by name, with the number. A person
 *    who sees «سلسلة ٤ أيام على المحك» finishes the day; a person who sees
 *    «٤١٪» does not.
 *  - Otherwise, under the threshold: the plain gap, the hours left, and
 *    the count of habits still open. No streak, no drama.
 *
 *  Returns `null` when there is nothing worth sending. `deliver()` in
 *  `bot.js` reads that as its instruction to stay silent, the same way it
 *  reads `textFor`'s `null` for the water sweep and the coach.
 * ---------------------------------------------------------------------- */
export function goalNudge(state, day) {
  const goal = Number.isFinite(state.goal) ? state.goal : DAILY_GOAL_DEFAULT;
  const pct = Number.isFinite(day.pct) ? day.pct : 0;
  const remaining = Math.max(0, goal - pct);

  /* Met — silence. Nothing this message could add to the evening's own. */
  if (remaining === 0) return null;

  /* Close to the goal — the last point is the loudest. A run one habit
     finishes is a run worth finishing. */
  if (remaining <= 5) {
    const open = day.openScored?.length || 0;
    if (!open) return null;
    return {
      text: [
        line(`🎯 باقي ${num(remaining)} نقطة للهدف (${num(goal)}٪).`),
        line(`أي عادة مفتوحة عندك تكفي.`),
      ].join("\n"),
      keys: null,
    };
  }

  const threshold = botShape(state.bot).nudge?.threshold ?? NUDGE_THRESHOLD_DEFAULT;

  /* Under the threshold: the day is going fine enough that a nudge would
     be noise. This is the branch that makes the whole feature usable. */
  if (remaining < threshold) return null;

  /* The hours until the logical day rolls over — 04:00 the next morning,
     which is the boundary every other countdown on this bot uses. */
  const now = new Date();
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const dayEnd = 4 * 60;
  const minsLeft = minsNow < dayEnd ? dayEnd - minsNow : 24 * 60 - minsNow + dayEnd;
  const hoursLeft = Math.max(0, Math.floor(minsLeft / 60));

  const openCount = day.openScored?.length || 0;

  /* A live streak with the goal still out of reach is the one case worth a
     louder message: the number exists and it is about to break. */
  const streak = Number.isFinite(day.streak) ? day.streak : 0;
  if (streak >= 2) {
    return {
      text: [
        line(`⚠️ سلسلة ${num(streak)} أيام على المحك`),
        line(
          `أنت ${num(pct)}٪ والهدف ${num(goal)}٪ — باقي ${num(remaining)} نقطة${hoursLeft ? ` في ${num(hoursLeft)} ساعة` : ""}.`,
        ),
        openCount
          ? line(`${num(openCount)} عادات مفتوحة — كل واحدة ترفعك.`)
          : line("افتح الروتين وأنجز واحدة."),
      ].join("\n"),
      keys: openKeys(state),
    };
  }

  /* The ordinary nudge. Its whole job is to say the two numbers a person
     cannot hold in his head at five in the afternoon. */
  return {
    text: [
      line(`🎯 الهدف اليومي: ${num(goal)}٪ — باقي ${num(remaining)} نقطة.`),
      hoursLeft ? line(`أمامك ${num(hoursLeft)} ساعات حتى إقفال اليوم.`) : null,
      openCount
        ? line(`${num(openCount)} عادات مفتوحة — أي واحدة تقرّبك.`)
        : line("افتح الروتين وأنجز واحدة."),
    ]
      .filter(Boolean)
      .join("\n"),
    keys: openKeys(state),
  };
}

export const HELP = [
  line("📝 أرسل جملة عادية — ما فيه أوامر تُحفظ."),
  "",
  line("💰 المال"),
  line("• «صرفت ٣٥ غداء» · «دخل ١٥٠٠ استشارة»"),
  line("• «دخل ٣٠٠ توصيل ٤ ساعات» → مع ساعاته، فيدخل في معدّل الساعة"),
  "",
  line("✅ اليوم"),
  line("• «تمت صلاة العصر» → تسجيل عادة"),
  line("• «كاس ماء» أو «ماء ٣» → عدّاد الماء"),
  line("• «اليوم: راجع المحاسبة» → من مهام اليوم الثلاث"),
  "",
  line("📚 المكتبة"),
  line("• «قرأت ١٠ صفحات من سيكولوجية المال» → الكتاب بالاسم، ولو ما كان على الرف يُضاف"),
  line("• «قرأت ٢٠ صفحة» → الكتاب الذي تقرأه الآن"),
  line("• «فائدة …» → تُحفظ على الكتاب بصفحتها، وترجع لك للمراجعة"),
  line("• «درس الكتاب …» → الجملة الواحدة التي يُلخّصه"),
  line("• «أضف كتاب …» · «ابدأ كتاب …» · «خلصت كتاب …»"),
  line("• «راجع» أو /review → نقطة واحدة تستحقّ أن تُستدعى الآن"),
  line("• «مكتبتي» أو /books → أين وصل كل كتاب"),
  "",
  line("🎧 التركيز"),
  line("• «ابدأ تركيز» أو «ابدأ تركيز ٥٠ مراجعة»"),
  line("• «وقفة» · «أكمل» · «أوقف» · «استراحة»"),
  line("• «ركزت ٤٥ دقيقة على المحاسبة» → جولة عُمِلت بعيدًا عن الشاشة"),
  "",
  line("🛡️ الكاسر والتقييم"),
  line("• «صمدت» · «سقطت» → أمام عادة تكسرها"),
  line("• «شتتني الجوال» ثم «الحل أتركه في الدرج» → تقييم المساء"),
  "",
  line("📅 التقويم والجامعة والأهداف"),
  line("• «موعد بكرة ٥ م الدكتور» → في التقويم، وينبّهك قبله"),
  line("• «غياب محاسبة» → غياب واحد، ويرفض الثاني في نفس اليوم"),
  line("• «درجة محاسبة الكويز ١٨ من ٢٠» → في كشف المادة"),
  line("• «هدف الحفظ ٣٠» أو «هدف الحفظ +٥» → عدّاد الهدف"),
  "",
  line("↩︎ وما نسيته أو أخطأت فيه"),
  line("• «أمس صرفت ٣٥ غداء» · «قبل يومين دخل ٢٠٠»"),
  line("• «أمس تمت صلاة العصر» → يصحّح ذلك اليوم وحده"),
  line("• «ألغِ قراءة» → يزيل التأشير ويسحب صفحات اليوم معه"),
  line("• «ابحث عن التسويف» → في كل ما كتبته"),
  "",
  line("🎙️ وأرسل مقطعًا صوتيًا — يُفرَّغ ويُقرأ كأنك كتبته."),
  "",
  line("❓ واسأل، ولن يُسجَّل شي:"),
  line("• «كم صرفت هذا الشهر؟» · «وين وصلت في الكتاب؟»"),
  line("• «متى الصلاة القادمة؟» · «كم انتظامي؟» · «ايش مهامي؟»"),
  "",
  line("📥 وأي نصّ آخر → صندوق الوارد في المصفوفة."),
  "",
  line("وللباقي كلمة واحدة، أو أمر:"),
  line("«يومي» أو /today — حالة اليوم الآن"),
  line("«باقي» أو /now — ما زال مفتوحًا، بأزرار"),
  line("«المدرّب» أو /coach — ما يستحق انتباهك الآن"),
  line("«مكتبتي» أو /books — الرف وأين وصل كل كتاب"),
  line("«راجع» أو /review — فائدة ترجع لتبقى"),
  line("«الأسبوع» أو /week — مراجعة الأسبوع"),
  line("«صباح» أو /morning — موجز الصباح"),
  line("«مساء» أو /evening — إقفال اليوم"),
  line("«القائمة» أو /menu — أزرار"),
].join("\n");