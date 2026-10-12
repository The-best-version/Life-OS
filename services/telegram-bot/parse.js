/* --- reading a message the way it was actually typed --------------------
 *  «صرفت ٣٥ غداء» and «/add_expense 35 lunch» record the same row, and only
 *  one of them gets sent from a bus. A command the user has to remember is a
 *  command he uses for a week; the point of this file is that there is
 *  nothing to remember.
 *
 *  It is a table of leading words, not a grammar. The trigger has to be the
 *  first word (or the first two, for «كاس ماء» and «مهمة اليوم») — a keyword
 *  hunted for anywhere in the sentence turns «لازم أراجع كم صرفت» into an
 *  expense of nothing, and a quick logger that guesses wrong is worse than
 *  one that asks. Anything that matches no trigger is a task, which is the
 *  right default: an unrecognised thought is exactly what the inbox is for.
 *
 *  Pure. No network, no state, no grammY — which is what lets
 *  tests/bot.test.mjs hold it without installing a thing.
 * --------------------------------------------------------------------- */

/* Arabic-Indic and Persian digits, folded onto ASCII. A phone keyboard set
   to Arabic sends ٣٥ and `Number("٣٥")` is NaN — this is the single most
   likely way the whole feature would appear broken. */
const DIGIT_MAP = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٫": ".", // Arabic decimal separator
  "٬": "",  // Arabic thousands separator
};
export const asciiDigits = (s) =>
  String(s).replace(/[٠-٩۰-۹٫٬]/g, (c) => DIGIT_MAP[c] ?? c);

/* --- the one regex trap in this file ----------------------------------- *
 *  JavaScript's `\b` is defined on ASCII `\w`. `\bريال` therefore asserts a
 *  boundary between a space and an Arabic letter — two characters that are
 *  both non-word — and never matches anything at all. Every Arabic word
 *  fenced with `\b` here would have silently done nothing, which is exactly
 *  how «صرفت ٢٠ ريال قهوة» came to store a label of «ريال قهوة». Lookarounds
 *  on the Unicode letter classes are the fence that actually holds.
 * ---------------------------------------------------------------------- */
const EDGE_L = "(?<![\\p{L}\\p{N}])";
const EDGE_R = "(?![\\p{L}\\p{N}])";

/* The folding used for *matching* only — never for anything that gets
   stored. His own spelling of a habit or an expense is his, and a label
   normalised on the way into the file is a label he did not write. */
export const fold = (s) =>
  asciiDigits(s)
    .replace(/[ً-ْـ]/g, "") // harakat and tatweel
    .replace(/[أإآٱ]/g, "ا") // أ إ آ ٱ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    /* Punctuation becomes whitespace rather than nothing, so «اليوم: راجع»
       splits into two words and the leading trigger is still a leading
       word. Joined on, it would have read «اليوم:» and matched nothing. */
    .replace(/[^\p{L}\p{N}\s.+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/* Currency, in the ways it gets typed. Stripped before the label is read, so
   «صرفت ٣٥ ريال غداء» does not store «ريال غداء». */
const CURRENCY = new RegExp(
  EDGE_L + "(ريالات|ريالا|ريال|ر\\.?س|sar|sr)" + EDGE_R,
  "giu",
);
/* Filler between the verb and the thing — «صرفت على القهوة» should not store
   «على القهوة». Only ever stripped from the *front* of what is left, and the
   longer words come first so «لـ» is tried before «ل». */
const LEAD_FILLER = /^(على|في|لـ|ل|من|عن|بـ|ب|:|-|،|,)\s*/;

/* The minute word, stripped from a focus round's label the way the currency
   word is stripped from an expense's — «ركزت ٤٥ دقيقة على المحاسبة» is
   forty-five minutes on «المحاسبة», not on «دقيقة على المحاسبة».
 *
 *  Deliberately NOT part of `clean`, which every branch uses: a task reading
 *  «اليوم: اقرأ ٢٠ صفحة» goes through the same function, and silently
 *  deleting a word he typed is the one thing none of this is allowed to do.
 *  It is applied in the one branch where the unit is known to be a unit. */
const UNIT_MIN = new RegExp(EDGE_L + "(دقائق|دقيقه|دقيقة|دقايق)" + EDGE_R, "giu");

/* An amount: digits with an optional decimal part. The thousands comma is
   dropped first so «1,500» is one number and not two. */
const NUMBER = /\d+(?:\.\d+)?/;

/* Bounds on the two counts a message can carry that are not money. A page
   count of two thousand is a thumb slip, and a book marked finished by one
   is a book he has to go and un-finish; a focus round of nine hours is the
   same mistake one field over. Both refuse rather than clamp — a clamped
   number is a wrong number stated confidently. */
export const PAGES_MAX = 600;
export const MINUTES_MAX = 300;

/* «١٨ من ٢٠» — a mark is a pair and never one number: the score alone says
   nothing without what it was out of. */
const OUT_OF = /(\d+(?:\.\d+)?)\s*(?:من|\/)\s*(\d+(?:\.\d+)?)/u;
/* Hours, when they were recorded beside the money. «ساعتين» carries its own
   count inside the word, so it is matched without a digit. */
const HOURS = new RegExp("(\\d+(?:\\.\\d+)?)\\s*(?:ساعات|ساعه|ساعة)" + EDGE_R, "u");
const TWO_HOURS = new RegExp(EDGE_L + "ساعتين" + EDGE_R, "u");

/* --- the triggers ------------------------------------------------------ *
 *  `words` are matched against the folded text, longest first, and only at
 *  the start. `amount: true` means the rule does not fire without a number
 *  in the message — which is what keeps «دخل» (he entered) from being read
 *  as «دخل» (income) every time it opens a sentence.
 * ---------------------------------------------------------------------- */
const RULES = [
  {
    kind: "expense",
    amount: true,
    words: [
      "صرفت", "صرف", "دفعت", "ادفع", "اشتريت", "شريت", "مصروف", "مصاريف",
      "فاتورة", "كلفني", "كلفتني", "طلع مني",
    ],
  },
  {
    kind: "income",
    amount: true,
    words: [
      "دخل", "داخل", "كسبت", "ربحت", "قبضت", "استلمت", "وصلني", "جاني",
      "راتب", "أجر", "حولوا لي", "حول لي",
    ],
  },
  {
    kind: "water",
    /* «شربت» on its own is deliberately absent: «شربت قهوة» is not a glass
       of water, and a meter that fills itself on the wrong word is a meter
       he stops trusting. */
    words: [
      "كاس ماء", "كوب ماء", "كاس ماي", "كوب ماي", "شربت ماء", "شربت ماي",
      "كاس", "كوب", "ماء", "ماي",
    ],
  },
  {
    kind: "habit",
    words: ["تمت", "تم", "خلصت", "أنجزت", "أنهيت", "سويت", "صليت", "أديت"],
  },
  {
    /* Pages read, straight onto the active book. `amount: true` because
       «قرأت كتابًا جميلًا» is a thought and not a log — with no number there
       is nothing to add to the counter. */
    kind: "reading",
    amount: true,
    words: ["قرأت", "قريت", "صفحات", "صفحة"],
  },
  /* --- the focus desk, by verb --------------------------------------- *
   *  Five rules and not one with a sub-grammar, because `TRIGGERS` already
   *  sorts every word longest-first across all of them: «ابدأ تركيز» is
   *  therefore tried before «ابدأ», and the rule that matched carries the
   *  verb with it. A second table of verbs inside one rule would be a
   *  second ordering to keep in step with the first.
   * ------------------------------------------------------------------- */
  {
    kind: "focus",
    act: "stop",
    words: ["أوقف التركيز", "وقف التركيز", "أوقف الجولة", "وقف الجولة", "أوقف", "وقف"],
  },
  {
    kind: "focus",
    act: "pause",
    words: ["علّق التركيز", "علق الجولة", "وقفة"],
  },
  {
    kind: "focus",
    act: "resume",
    words: ["أكمل التركيز", "أكمل الجولة", "كمّل", "أكمل"],
  },
  {
    kind: "focus",
    act: "break",
    words: ["استراحة", "راحة قصيرة", "راحة"],
  },
  {
    kind: "focus",
    act: "start",
    words: ["ابدأ تركيز", "ابدأ جولة", "ابدأ بومودورو", "ابدأ التركيز", "بومودورو", "ابدأ"],
  },
  {
    /* Work that happened away from the screen. With a number it is a logged
       round; without one it is a request for where the day stands. */
    kind: "focus",
    act: "log",
    words: ["ركزت", "تركيز", "الجولة"],
  },
  /* --- the breaker ---------------------------------------------------- *
   *  A hold and a fall, and the hold is the one that has to be frictionless:
   *  surviving the urge is the event most likely to go unrecorded, and a
   *  mirror that only ever sees the losses makes him look weaker than he is.
   * ------------------------------------------------------------------- */
  {
    kind: "urge",
    act: "fall",
    words: ["سقطت", "رجعت للعادة", "انهزمت", "ما قدرت", "كسرت الصمود"],
  },
  {
    kind: "urge",
    act: "hold",
    words: ["صمدت", "قاومت", "جاني وسواس", "جاتني رغبة", "راودتني", "رغبة", "وسواس"],
  },
  /* --- the evening reflection ---------------------------------------- *
   *  Two sentences, two triggers, and no pending-question state: a bot that
   *  remembers it asked something is a bot whose memory of the question
   *  outlives the mood that would have answered it.
   * ------------------------------------------------------------------- */
  {
    kind: "reflect",
    field: "distraction",
    words: ["شتتني", "شتتتني", "الذي شتتني"],
  },
  {
    kind: "reflect",
    field: "fix",
    words: ["الحل", "علاجه", "الإصلاح", "أصلحها"],
  },
  /* --- the calendar ---------------------------------------------------- *
   *  An entry with an hour on it. `readWhen` below reads the day and the
   *  time out of what follows; the title is whatever is left, which is why
   *  it is pulled out rather than matched.
   * ------------------------------------------------------------------- */
  {
    kind: "event",
    words: ["موعد", "عندي موعد", "اجتماع", "مقابلة", "ذكّرني يوم", "ذكرني يوم"],
  },
  /* --- the university desk --------------------------------------------- *
   *  The one screen he is least likely to open on a laptop, because he is
   *  inside the lecture while the thing worth recording happens.
   * ------------------------------------------------------------------- */
  {
    kind: "uni",
    act: "absence",
    words: ["غياب", "غبت عن", "غبت"],
  },
  {
    kind: "uni",
    act: "mark",
    words: ["درجة", "درجتي", "علامة"],
  },
  /* --- the goals vault -------------------------------------------------- *
   *  The bot could read the goals and not touch them, and the goals are the
   *  spine of 2027. A bare number sets the meter, `+n` advances it.
   * ------------------------------------------------------------------- */
  {
    kind: "goal",
    amount: true,
    words: ["هدف", "الهدف"],
  },
  {
    kind: "search",
    words: ["ابحث عن", "ابحث", "دوّر على", "دور على", "وين كتبت", "وين ذكرت"],
  },
  /* An untick is a deletion in everything but name — it withdraws the
     evening's reading and rolls the page counter back — so it is its own
     verb rather than a second meaning of «تمت». */
  {
    kind: "untick",
    words: ["ألغِ", "ألغ", "الغ", "تراجع عن", "ما سويت", "شيل تأشير", "شيل"],
  },
  {
    kind: "task",
    today: true,
    words: ["مهمة اليوم", "اليوم", "أهم"],
  },
];

/* --- yesterday, and the day before ------------------------------------- *
 *  Forgetting is the normal case, not the exception: the expense happens at
 *  lunch and the phone comes out at midnight. `expenseShape` has always
 *  accepted a date, so the only thing missing was a way to say one.
 *
 *  Read as a prefix and stripped, after which the rest of the sentence is
 *  parsed exactly as it would have been — so «أمس صرفت ٣٥ غداء» and «صرفت ٣٥
 *  غداء» go through one code path and cannot drift apart.
 * ---------------------------------------------------------------------- */
const BACK_WORDS = [
  [1, ["أمس", "امس", "البارحة", "امبارح", "الأمس"]],
  [2, ["أول أمس", "اول امس", "قبل أمس", "قبل يومين"]],
];

/* How far back a message may reach. Three days is the window in which
   someone actually remembers an amount; past it he is guessing, and a
   guessed row in a ledger is worse than a missing one. */
export const BACK_MAX = 3;

export function readBack(folded) {
  for (const [days, words] of BACK_WORDS) {
    for (const w of words) {
      const f = fold(w);
      if (folded === f || folded.startsWith(f + " ")) {
        return { days, skip: f.split(" ").length };
      }
    }
  }
  /* «قبل ٣ أيام», typed as a count. */
  const m = /^قبل\s+(\d+)\s+(?:يوم|ايام|أيام)(?:\s|$)/u.exec(asciiDigits(folded));
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= BACK_MAX) return { days: n, skip: 3 };
  }
  return null;
}

/* --- when, in the words people actually use ---------------------------- *
 *  Returns the *day as a word* and the time as a clock reading — never a
 *  date key. Resolving «الأحد» into a square is calendar arithmetic and it
 *  belongs beside the calendar's own helpers in `actions.js`, not in a file
 *  whose whole job is reading strings.
 * ---------------------------------------------------------------------- */
const DAY_WORDS = [
  ["today", ["اليوم"]],
  ["tomorrow", ["بكرة", "غدا", "غدًا", "بكره"]],
  ["after", ["بعد بكرة", "بعد غد", "بعد بكره"]],
  [0, ["الأحد", "الاحد", "احد"]],
  [1, ["الاثنين", "الإثنين", "الإثنين", "اثنين"]],
  [2, ["الثلاثاء", "ثلاثاء"]],
  [3, ["الأربعاء", "الاربعاء", "اربعاء"]],
  [4, ["الخميس", "خميس"]],
  [5, ["الجمعة", "جمعة"]],
  [6, ["السبت", "سبت"]],
];

/* The markers that settle an hour. Without one a bare number is a guess, and
   the guess is stated back in the confirmation rather than hidden — a wrong
   hour the user can see is a wrong hour he fixes in ten seconds. */
const PM_WORDS = ["م", "مساء", "مساءً", "ظهرا", "ظهرًا", "العصر", "عصرا", "الظهر", "المغرب", "العشاء", "الليل"];
const AM_WORDS = ["ص", "صباحا", "صباحًا", "صباح", "الفجر", "فجرا"];

/* A bare hour with no marker. One to seven is an evening, eight to twelve a
   morning — which is how an appointment is actually said out loud. */
const bareHour = (h) => (h >= 1 && h <= 7 ? h + 12 : h === 12 ? 12 : h);

export function readWhen(raw) {
  let text = asciiDigits(String(raw ?? ""));
  let day = null;
  let time = "";

  /* The day word, taken out wherever it sits: «موعد الدكتور الأحد» and
     «موعد الأحد الدكتور» are the same appointment. */
  for (const [id, words] of DAY_WORDS) {
    if (day !== null) break;
    for (const w of words) {
      const re = new RegExp(EDGE_L + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + EDGE_R, "u");
      const m = re.exec(text);
      if (m) {
        day = id;
        text = text.slice(0, m.index) + " " + text.slice(m.index + m[0].length);
        break;
      }
    }
  }

  /* HH:MM wins outright — it is the one form that cannot be misread. */
  let m = /(?<![\d:])([01]?\d|2[0-3])\s*[:٫]\s*([0-5]\d)(?![\d:])/u.exec(text);
  if (m) {
    let h = Number(m[1]);
    const rest = text.slice(m.index + m[0].length);
    if (new RegExp("^\\s*(" + PM_WORDS.join("|") + ")" + EDGE_R, "u").test(rest) && h < 12) h += 12;
    time = `${String(h).padStart(2, "0")}:${m[2]}`;
    text = text.slice(0, m.index) + " " + rest.replace(new RegExp("^\\s*(" + PM_WORDS.concat(AM_WORDS).join("|") + ")" + EDGE_R, "u"), " ");
  } else {
    /* A bare hour, with or without a marker after it. */
    m = new RegExp("(?<![\\d:])(\\d{1,2})\\s*(" + PM_WORDS.concat(AM_WORDS).join("|") + ")?" + EDGE_R, "u").exec(text);
    if (m) {
      const n = Number(m[1]);
      if (n >= 0 && n <= 23) {
        let h = n;
        if (m[2] && PM_WORDS.includes(m[2])) h = n === 12 ? 12 : n + 12;
        else if (m[2] && AM_WORDS.includes(m[2])) h = n === 12 ? 0 : n;
        else if (n <= 12) h = bareHour(n);
        if (h <= 23) {
          time = `${String(h).padStart(2, "0")}:00`;
          text = text.slice(0, m.index) + " " + text.slice(m.index + m[0].length);
        }
      }
    }
  }

  /* «الساعة» is left behind by both branches above and belongs to neither
     the title nor the time. */
  text = text.replace(new RegExp(EDGE_L + "(الساعه|الساعة|في|عند)" + EDGE_R, "gu"), " ");
  return { day, time, rest: text.replace(/\s+/g, " ").trim() };
}

/* --- a question is not a task ------------------------------------------ *
 *  Everything unrecognised becomes a task, and that is right for a thought:
 *  an unrecognised sentence is exactly what the inbox is for. It is wrong
 *  for a question — «كم صرفت هذا الشهر؟» was landing in «مهم غير عاجل» as a
 *  to-do item, which is a wrong answer *and* a row he then has to delete.
 *
 *  So a question is read first and answered, and nothing is written. The
 *  subject words are matched anywhere in the sentence rather than only at
 *  the start, which is the opposite of the trigger rule above and correct
 *  for the same reason: a question's leading word is the question word, and
 *  what it is *about* comes after it.
 * ---------------------------------------------------------------------- */
const QUESTION_WORDS = [
  "كم", "وين", "أين", "متى", "ماذا", "ما هو", "ايش", "إيش", "شو",
  "هل", "كيف", "من هو", "أعطني", "اعطني", "وريني", "ورني",
];

/* Priority order, and it is load-bearing: «كم صرفت على الكتب» is a money
   question with a book in it, so the money subjects are consulted before
   the library's. The first list with a hit wins. */
const TOPICS = [
  ["spend", ["صرفت", "مصروف", "مصاريف", "صرف", "مصروفاتي", "دفعت"]],
  ["earn", ["دخلي", "كسبت", "ربحت", "أرباحي", "ارباحي", "قبضت", "دخل"]],
  ["money", ["الرصيد", "رصيدي", "رصيد", "فلوس", "الميزانية", "المال", "مالي"]],
  ["prayer", ["الصلاة", "الصلوات", "صلاة", "الأذان", "أذان", "الفجر", "الظهر", "العصر", "المغرب", "العشاء"]],
  ["read", ["القراءة", "قراءتي", "قراءة", "الكتاب", "كتابي", "كتاب", "صفحات", "وصلت"]],
  ["focus", ["التركيز", "تركيزي", "تركيز", "بومودورو", "الجولات", "العمل العميق"]],
  ["uni", ["الجامعة", "محاضرات", "محاضرة", "الاختبار", "اختبارات", "اختبار", "المواد", "جدولي", "الجدول"]],
  ["goals", ["أهدافي", "اهدافي", "أهداف", "هدفي", "الخزنة", "الربع"]],
  ["breaker", ["الكاسر", "العادات السيئة", "صامد", "نظيف", "الصمود"]],
  ["water", ["الماء", "أكواب", "اكواب", "كاس", "كوب", "ماي"]],
  ["tasks", ["مهامي", "المهام", "مهام", "المهمة"]],
  ["habits", ["عاداتي", "العادات", "عادات", "باقي", "المفتوح"]],
  ["discipline", ["انتظامي", "الانتظام", "انتظام", "نسبتي", "السلسلة", "سلسلتي", "streak"]],
  ["month", ["المتوسط", "متوسطي", "الأرشيف", "السجل", "الشهر الماضي"]],
];

/* How far back the question is asking about. Separate from the subject on
   purpose: «كم صرفت هذا الشهر» is one subject and one window, and folding
   them into a single table would need an entry per pair. */
const WINDOWS = [
  [1, ["اليوم", "اليوم؟"]],
  [7, ["الأسبوع", "أسبوع", "هذا الأسبوع"]],
  [30, ["الشهر", "شهر", "هذا الشهر"]],
  [90, ["الربع", "ثلاثة أشهر"]],
  [365, ["السنة", "سنة", "هذي السنة"]],
];

const holds = (folded, word) => {
  const w = fold(word);
  return folded === w || folded.startsWith(w + " ") || folded.includes(" " + w + " ") || folded.endsWith(" " + w);
};

/* A question, or null. Either it opens with a question word or it ends in a
   question mark — and a sentence doing neither is not one, however many
   subject words it happens to contain. */
export function askedAbout(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const folded = fold(text);
  const marked = /[?؟]\s*$/.test(text);
  const opens = QUESTION_WORDS.some((w) => holds(folded, w) && folded.startsWith(fold(w)));
  if (!marked && !opens) return null;
  let topic = null;
  for (const [id, words] of TOPICS) {
    if (words.some((w) => holds(folded, w))) {
      topic = id;
      break;
    }
  }
  let days = null;
  for (const [n, words] of WINDOWS) {
    if (words.some((w) => holds(folded, w))) {
      days = n;
      break;
    }
  }
  /* A bare number in a question is a window in days, which is how «كم صرفت
     آخر ١٠ أيام» is actually typed. */
  if (days === null) {
    const m = /(\d+)\s*(?:يوم|أيام|ايام)/u.exec(asciiDigits(folded));
    if (m) days = Math.min(365, Math.max(1, Number(m[1])));
  }
  return { kind: "ask", topic, days, text };
}

/* Every trigger, longest first, so «كاس ماء» is tried before «كاس» would
   have been and «مهمة اليوم» before «اليوم». */
const TRIGGERS = RULES.flatMap((r) =>
  r.words.map((w) => ({ rule: r, word: fold(w) })),
).sort((a, b) => b.word.length - a.word.length);

/* A trigger only counts at the start of the message, and only as whole
   words — «تمت» must not fire on «تمتع». */
const leads = (folded, word) =>
  folded === word || folded.startsWith(word + " ");

/* The number, and the text with it taken out. Hours are pulled first and
   separately: «دخل ٣٠٠ توصيل ٤ ساعات» is three hundred riyals for four
   hours, and reading the first number found as the amount would be right
   only by luck. */
function amounts(text) {
  let rest = asciiDigits(text).replace(/(\d),(\d{3})(?![\d])/g, "$1$2");
  let hours = 0;
  const h = HOURS.exec(rest);
  if (h) {
    hours = Number(h[1]);
    rest = rest.slice(0, h.index) + " " + rest.slice(h.index + h[0].length);
  } else {
    const two = TWO_HOURS.exec(rest);
    if (two) {
      hours = 2;
      rest = rest.slice(0, two.index) + " " + rest.slice(two.index + two[0].length);
    }
  }
  let amount = 0;
  const m = NUMBER.exec(rest);
  if (m) {
    amount = Number(m[0]);
    rest = rest.slice(0, m.index) + " " + rest.slice(m.index + m[0].length);
  }
  return { amount, hours, rest };
}

const clean = (s) =>
  String(s)
    .replace(CURRENCY, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(LEAD_FILLER, "")
    .trim();

/* --- the one entry point ---------------------------------------------- */
/* Which readings can carry a date that is not today. A task has no date of
   its own and a habit's day is the archive's business, not a row's — so
   «أمس» in front of either is simply part of what he wrote. */
const BACKDATABLE = new Set(["expense", "income", "reading", "focus", "habit", "untick"]);

export function parse(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { kind: "empty", text: "" };

  /* Before the triggers, because a question's subject is usually one of
     them: «كم صرفت هذا الشهر؟» has to be answered and not recorded as an
     expense of thirty, and the trigger table would read it as one the
     moment a number appeared in the sentence. */
  const asked = askedAbout(text);
  if (asked) return asked;

  /* «أمس …» is stripped and the rest is parsed exactly as it would have
     been, so the two forms go through one code path and cannot drift. The
     days ride back on the result rather than being resolved here: turning
     them into a date key is calendar arithmetic and belongs with the
     actions. */
  const back = readBack(fold(text));
  if (back) {
    const rest = text.split(/\s+/).slice(back.skip).join(" ").trim();
    if (rest) {
      const out = parse(rest);
      return BACKDATABLE.has(out.kind) ? { ...out, back: back.days, text } : out;
    }
  }

  const folded = fold(text);
  const hit = TRIGGERS.find((t) => leads(folded, t.word));

  if (hit) {
    const rule = hit.rule;
    /* The trigger comes off the *original* text, by word count, so the label
       keeps the user's own harakat and hamzas — folding is for matching and
       never for storing. */
    const skip = hit.word.split(" ").length;
    const tail = text.split(/\s+/).slice(skip).join(" ");

    if (rule.kind === "expense" || rule.kind === "income") {
      const { amount, hours, rest } = amounts(tail);
      /* `amount: true` and no number: this was never a money message. It
         falls through to a task below rather than being refused, because
         «اشتريت هدية لأمي» with no price is a perfectly good thing to drop
         in the inbox. */
      if (amount > 0) {
        return { kind: rule.kind, amount, hours, label: clean(rest), text };
      }
    } else if (rule.kind === "water") {
      const { amount } = amounts(tail);
      /* «ماء ٣» is three glasses, not three riyals. Bounded at six so a
         fat-fingered «ماء 30» does not fill the day's meter in one message. */
      const n = amount >= 1 && amount <= 6 ? Math.round(amount) : 1;
      return { kind: "water", count: n, text };
    } else if (rule.kind === "habit") {
      const q = clean(tail);
      /* «تم» on its own is not a habit — it is an acknowledgement. With
         nothing to match against there is nothing to tick. */
      if (q) return { kind: "habit", query: q, text };
    } else if (rule.kind === "reading") {
      const { amount } = amounts(tail);
      /* Bounded, because «قرأت 2000» is a typo and a page counter that
         accepts it is a book marked finished by a slip of the thumb. */
      if (amount >= 1 && amount <= PAGES_MAX) {
        return { kind: "reading", pages: Math.round(amount), text };
      }
    } else if (rule.kind === "focus") {
      const { amount, rest } = amounts(tail);
      const minutes = amount >= 1 && amount <= MINUTES_MAX ? Math.round(amount) : 0;
      /* «ركزت» with no number is not a logged round — there is nothing to
         log — so it is read as the question it probably was. */
      const act = rule.act === "log" && !minutes ? "status" : rule.act;
      return {
        kind: "focus",
        act,
        minutes,
        label: clean(String(rest).replace(UNIT_MIN, " ")),
        text,
      };
    } else if (rule.kind === "urge") {
      return { kind: "urge", act: rule.act, query: clean(tail), text };
    } else if (rule.kind === "reflect") {
      const body = clean(tail);
      if (body) return { kind: "reflect", field: rule.field, note: body, text };
    } else if (rule.kind === "event") {
      const when = readWhen(tail);
      /* With the day and the hour taken out there may be nothing left, and
         «اجتماع اليوم ٩ ص» is a perfectly complete sentence — the trigger
         word *is* the title there. Falling through to the inbox instead
         would file an appointment as a thought. */
      const title = clean(when.rest) || text.split(/\s+/).slice(0, skip).join(" ");
      if (title) {
        return { kind: "event", title, day: when.day, time: when.time, text };
      }
    } else if (rule.kind === "uni" && rule.act === "absence") {
      const q = clean(tail);
      if (q) return { kind: "uni", act: "absence", query: q, text };
    } else if (rule.kind === "uni" && rule.act === "mark") {
      /* «١٨ من ٢٠» as one reading, because the first number alone is the
         score and the second alone is meaningless — a mark is a pair. */
      const m = OUT_OF.exec(asciiDigits(tail));
      if (m) {
        const rest = asciiDigits(tail).slice(0, m.index) + " " + asciiDigits(tail).slice(m.index + m[0].length);
        return {
          kind: "uni",
          act: "mark",
          score: Number(m[1]),
          max: Number(m[2]),
          query: clean(rest),
          text,
        };
      }
    } else if (rule.kind === "goal") {
      /* `+٥` advances the meter and a bare `٣٠` sets it. Two verbs would be
         two words to remember; the sign is already the word. */
      const plus = /(^|\s)\+\s*\d/.test(asciiDigits(tail));
      const { amount, rest } = amounts(tail);
      if (amount > 0) {
        /* The sign is left behind by `amounts`, which only takes the digits.
           It belongs to neither the number nor the goal's name. */
        const q = clean(String(rest).replace(/\+/g, " "));
        return { kind: "goal", value: amount, add: plus, query: q, text };
      }
    } else if (rule.kind === "search") {
      const q = clean(tail);
      if (q) return { kind: "search", query: q, text };
    } else if (rule.kind === "untick") {
      const q = clean(tail);
      if (q) return { kind: "untick", query: q, text };
    } else if (rule.kind === "task") {
      const body = clean(tail);
      if (body) return { kind: "task", today: true, label: body, text };
    }
  }

  /* Everything else is a thought worth keeping. It lands in «مهم غير عاجل» —
     the one quadrant of the matrix that asks for a decision instead of
     making one, which is what an inbox is. */
  return { kind: "task", today: false, label: text, text };
}
