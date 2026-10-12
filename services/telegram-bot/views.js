/* --- what the bot says, and the buttons it says it with ----------------
 *  Every string in this file is Arabic, because every string in this app is.
 *  Two things about writing Arabic into a Telegram message that HTML in the
 *  browser handles for us and a chat bubble does not:
 *
 *  - **Numbers reverse.** A Latin digit group inside Arabic text is a strong
 *    LTR run, and «صرفت 35 على غداء» renders with the number thrown to the
 *    wrong side of the sentence often enough to look like a bug. There is no
 *    `<span dir="rtl">` to reach for here, so every line that mixes them
 *    opens with a RIGHT-TO-LEFT MARK, which pins the paragraph direction
 *    regardless of what it starts with.
 *  - **Digits are rendered Arabic-Indic** — ٣٥ rather than 35. Native to the
 *    script, and it sidesteps the mixing entirely for the common case.
 * --------------------------------------------------------------------- */
import { InlineKeyboard } from "grammy";
import { TOP_TASK_CAP, scoredOf, rows } from "../../src/state/life-state.mjs";
import { PRAYER_ROWS, clockAt, prayerTimes } from "../../src/utils/prayer-times.mjs";

/* RIGHT-TO-LEFT MARK. First character of any line that carries a number. */
const RLM = "‏";

const AR = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
/* Arabic-Indic digits, with a thousands separator and at most two decimals.
   `toLocaleString` with an Arabic locale would do this and also drag in a
   currency symbol and a locale's own rounding; this is the part we want. */
export const num = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const neg = v < 0;
  const fixed = Math.round(Math.abs(v) * 100) / 100;
  const [whole, frac] = String(fixed).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  const out = (grouped + (frac ? "٫" + frac : "")).replace(
    /\d/g,
    (d) => AR[Number(d)],
  );
  return (neg ? "−" : "") + out;
};

export const money = (n) => `${num(n)} ر.س`;
/* A clock reading stays in Latin digits: «05:12» is read off a screen beside
   «٠٥:١٢» on the app, and the colon between Arabic-Indic digits is the one
   place the bidi algorithm reliably mangles a time. */
export const time = (hhmm) => RLM + "‎" + hhmm + "‎";

const line = (s) => RLM + s;

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
   wrote. */
export function openKeys(state, max = 5) {
  const kb = new InlineKeyboard();
  const open = scoredOf(rows(state.habits)).filter((h) => !h.done).slice(0, max);
  for (const h of open) kb.text(`✓ ${h.label}`, `tick:${h.id}`).row();
  kb.text("💧 + كاس ماء", "water:1");
  return kb;
}

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
  line("📝 أرسل جملة عادية — ما فيه أوامر تُحفظ:"),
  "",
  line("• «صرفت ٣٥ غداء» → مصروف"),
  line("• «دخل ١٥٠٠ استشارة» → دخل"),
  line("• «دخل ٣٠٠ توصيل ٤ ساعات» → دخل مع ساعاته"),
  line("• «كاس ماء» أو «ماء ٣» → عدّاد الماء"),
  line("• «تمت صلاة العصر» → تسجيل عادة"),
  line("• «اليوم: راجع المحاسبة» → من مهام اليوم الثلاث"),
  line("• أي نص آخر → صندوق الوارد في المصفوفة"),
  "",
  /* The slash commands are ASCII because Telegram only marks an ASCII name
     as a command; the Arabic words beside them are read as plain text and
     are written here without a slash so nobody types one that does
     nothing. */
  line("وللباقي كلمة واحدة، أو أمر:"),
  line("«يومي» أو /today — حالة اليوم الآن"),
  line("«باقي» أو /now — ما زال مفتوحًا، بأزرار"),
  line("«صباح» أو /morning — موجز الصباح"),
  line("«مساء» أو /evening — إقفال اليوم"),
].join("\n");
