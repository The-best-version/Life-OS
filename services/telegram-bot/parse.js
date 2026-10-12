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

/* An amount: digits with an optional decimal part. The thousands comma is
   dropped first so «1,500» is one number and not two. */
const NUMBER = /\d+(?:\.\d+)?/;
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
    kind: "task",
    today: true,
    words: ["مهمة اليوم", "اليوم", "أهم"],
  },
];

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
export function parse(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { kind: "empty", text: "" };

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
