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
  scoredOf,
  rows,
  runLeft,
  phaseOf,
  runRunning,
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
} from "./fmt.js";

export { num, money, time } from "./fmt.js";

/* How many rows a list in a chat bubble may name before it starts counting
   instead. Six fits a phone screen without scrolling. */
const NAME_MAX = 6;

/* --- the confirmations ------------------------------------------------- */

export const savedExpense = (row, balance) =>
  [
    line(`✅ مصروف: ${row.label} — ${money(row.amount)}`),
    line(`الرصيد الآن: ${money(balance)}`),
  ].join("\n");

export const savedIncome = (row, balance) =>
  [
    line(`✅ دخل: ${row.label} — ${money(row.amount)}`),
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

/* --- the keyboards ----------------------------------------------------- *
 *  Callback data is `kind:id`, and Telegram caps it at 64 bytes — which is
 *  why the ids the app generates (seven characters) are passed as they are
 *  and never a label.
 * ---------------------------------------------------------------------- */

/* The undo button, under every write. Eight seconds is the app's own window
   and it is the wrong one here: a message sits in a chat, and the answer to
   «was that the right amount?» often arrives after a glance at the screen.
   So the button stays until the bot restarts — `bot.js` holds the `before`
   in memory and says so plainly when it no longer has it. */
export const undoKeys = (token) =>
  new InlineKeyboard().text("↩︎ تراجع", `undo:${token}`);

/* What is still open right now, as buttons. Built from the live roster and
   never from a hardcoded list of prayers: the five that carry the score are
   his choice, and «تمت صلاة العصر» has to mean whichever habit he actually
   wrote.
 *
 *  **The floor gets a button of its own.** `habit.min` is the smallest
 *  version of a habit he wrote himself, a tiny tick counts for the score,
 *  the streak and the archive, and the whole value of it is that it is
 *  visible at the moment skipping looks reasonable — on a phone, at the end
 *  of a bad day, which is exactly where this keyboard is. Without the button
 *  the `tiny:` callback was reachable from nothing and the feature existed
 *  only in the state layer.
 */
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

/* --- the coach's buttons ---------------------------------------------- *
 *  `insight.js` hands back `{label, data}` and never a keyboard, because it
 *  must stay loadable without grammY. This is the one place that turns them
 *  into one — two per row, so three habits and their floors fit a phone
 *  without a wall of taps.
 * ---------------------------------------------------------------------- */
export function coachKeys(actions) {
  const kb = new InlineKeyboard();
  const list = (actions || []).slice(0, 6);
  list.forEach((a, i) => {
    kb.text(String(a.label).slice(0, 40), a.data);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

/* Pages, as the four counts a person actually reads in one sitting. The
   modal in the app offers the same quick numbers for the same reason: a
   number pad is three taps and a glance away from the thing being
   recorded. */
export const PAGE_STEPS = [5, 10, 20, 30];
export const readKeys = () => {
  const kb = new InlineKeyboard();
  for (const n of PAGE_STEPS) kb.text(`📖 ${n}`, `read:${n}`);
  return kb.row().text("لاحقًا", "read:0");
};

/* --- the focus desk --------------------------------------------------- *
 *  Contextual, because the wrong button is worse than no button: «أكمل»
 *  under a round that is already counting is a tap that answers «هي تعدّ
 *  أصلاً», which is a round trip to learn what the keyboard could have said.
 * ---------------------------------------------------------------------- */
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

/* --- tomorrow's three ------------------------------------------------- */
export function prepKeys(tasks) {
  const kb = new InlineKeyboard();
  for (const t of (tasks || []).slice(0, 6)) {
    kb.text(`🌙 ${t.text}`.slice(0, 40), `prep:${t.id}`).row();
  }
  return kb;
}

/* --- the breaker ------------------------------------------------------- *
 *  Two steps and not one, and the second is skippable. A hold logged with no
 *  trigger is still a hold the mirror counts; a hold never logged because
 *  the bot asked three questions first is a hold that did not happen as far
 *  as the record is concerned.
 * ---------------------------------------------------------------------- */
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

/* --- the menu ---------------------------------------------------------- *
 *  Everything this bot does is a sentence, and that is its whole interface —
 *  but a sentence has to be remembered the first time, and a keyboard is how
 *  the second time happens. One tap to the five things asked for most.
 * ---------------------------------------------------------------------- */
export const menuKeys = () =>
  new InlineKeyboard()
    .text("📅 يومي", "menu:today")
    .text("⏳ الباقي", "menu:open")
    .row()
    .text("🧠 المدرّب", "menu:coach")
    .text("🗓️ الأسبوع", "menu:week")
    .row()
    .text("🎧 التركيز", "menu:focus")
    .text("📝 الشرح", "menu:help");

/* What Telegram shows in its own command menu. ASCII names only — Telegram
   marks a `/name` as a command when the name is ASCII and nothing else, so
   «/صباح» arrives as ordinary text and is matched as a word instead. */
export const COMMANDS = [
  { command: "today", description: "حالة اليوم الآن" },
  { command: "now", description: "ما زال مفتوحًا، بأزرار" },
  { command: "coach", description: "ما يستحق انتباهك الآن" },
  { command: "week", description: "مراجعة الأسبوع" },
  { command: "focus", description: "جولة تركيز — ابدأ أو أوقف" },
  { command: "morning", description: "موجز الصباح" },
  { command: "evening", description: "إقفال اليوم" },
  { command: "menu", description: "القائمة" },
  { command: "help", description: "ماذا يفهم من رسائلك" },
];

/* --- the new confirmations -------------------------------------------- */

export const savedReading = (out) => {
  const got = [
    line(`📖 ${pagesWord(out.pages)} في «${out.book.title}».`),
    line(
      out.total
        ? `عند صفحة ${num(out.at)} من ${num(out.total)}.`
        : `عند صفحة ${num(out.at)}.`,
    ),
  ];
  got.push(
    line(
      out.today >= out.goal
        ? `وبلغت هدف اليوم (${num(out.goal)}) ✅${out.streak ? ` — ${daysWord(out.streak)} متصلة.` : ""}`
        : `اليوم ${num(out.today)} من ${num(out.goal)}.`,
    ),
  );
  return got.join("\n");
};

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

export const savedReflect = (out) =>
  line(
    out.field === "distraction"
      ? `📝 كُتب في تقييم اليوم: شتّتني ${out.note}`
      : `📝 كُتب في تقييم اليوم: الحل ${out.note}`,
  );

/* --- the two briefs --------------------------------------------------- */

export function morning(state, day, quote) {
  const out = [line("☀️ صباح الخير — هذا يومك:"), ""];

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
      /* The step, when it was written: a task is a sentence and the step is
         the thing a body can start. */
      if (t.step) out.push(line(`    ↳ ${t.step}`));
    });
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
  out.push(
    line(`العادات: ${num(day.habitsDone)} من ${num(day.habitsAll)}`),
  );
  out.push(
    line(
      `المهام: ${num(day.tasks.filter((t) => t.done).length)} من ${num(day.tasks.length)}`,
    ),
  );
  out.push(line(`الماء: ${num(day.water)} من ${num(day.waterGoal)}`));
  out.push(
    line(`المال هذا الأسبوع: دخل ${money(day.earnedWeek)} · مصروف ${money(day.spentWeek)}`),
  );
  out.push("");
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
    /* Named up to `NAME_MAX`, and the rest counted. The same choice the
       server's block toast makes, for the same reason: while no core five
       are set, `scoredOf` falls back to every habit — twenty-two of them —
       and a chat bubble listing all of them is a wall he scrolls past
       instead of a glance he reads. */
    day.openScored.slice(0, NAME_MAX).forEach((h) => out.push(line(`• ${h.label}`)));
    const rest = day.openScored.length - NAME_MAX;
    if (rest > 0) out.push(line(`و${num(rest)} غيرها`));
  }
  return out.join("\n");
}

/* Today's three, as buttons to tick off. */
export function taskKeys(day) {
  const kb = new InlineKeyboard();
  for (const t of day.tasksOpen) kb.text(`✓ ${t.text}`.slice(0, 40), `task:${t.id}`).row();
  return kb;
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
  line("• «قرأت ٢٠ صفحة» → يتقدّم الكتاب الذي تقرأه"),
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
  line("❓ واسأل، ولن يُسجَّل شي:"),
  line("• «كم صرفت هذا الشهر؟» · «وين وصلت في الكتاب؟»"),
  line("• «متى الصلاة القادمة؟» · «كم انتظامي؟» · «ايش مهامي؟»"),
  "",
  line("📥 وأي نصّ آخر → صندوق الوارد في المصفوفة."),
  "",
  /* The slash commands are ASCII because Telegram only marks an ASCII name
     as a command; the Arabic words beside them are read as plain text and
     are written here without a slash so nobody types one that does
     nothing. */
  line("وللباقي كلمة واحدة، أو أمر:"),
  line("«يومي» أو /today — حالة اليوم الآن"),
  line("«باقي» أو /now — ما زال مفتوحًا، بأزرار"),
  line("«المدرّب» أو /coach — ما يستحق انتباهك الآن"),
  line("«الأسبوع» أو /week — مراجعة الأسبوع"),
  line("«صباح» أو /morning — موجز الصباح"),
  line("«مساء» أو /evening — إقفال اليوم"),
  line("«القائمة» أو /menu — أزرار"),
].join("\n");
