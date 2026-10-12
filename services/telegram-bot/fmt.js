/* --- numbers and times, written the way Arabic writes them -------------
 *  Pulled out of `views.js` the moment a second file needed them. `views.js`
 *  imports grammY for its keyboards, so anything that imports `views.js`
 *  cannot be loaded by `node --test` with nothing installed — and the two
 *  files that most need a formatter, the advice engine and the question
 *  answers, are precisely the two that have to stay testable.
 *
 *  Two things about writing Arabic into a Telegram bubble that HTML in the
 *  browser handles for us and a chat message does not:
 *
 *  - **Numbers reverse.** A Latin digit group inside Arabic text is a strong
 *    LTR run, and «صرفت 35 على غداء» renders with the number thrown to the
 *    wrong side of the sentence often enough to look like a bug. There is no
 *    `<span dir="rtl">` to reach for here, so every line that mixes them
 *    opens with a RIGHT-TO-LEFT MARK, which pins the paragraph's direction
 *    regardless of what it starts with.
 *  - **Digits are rendered Arabic-Indic** — ٣٥ rather than 35. Native to the
 *    script, and it sidesteps the mixing entirely for the common case.
 * --------------------------------------------------------------------- */

/* RIGHT-TO-LEFT MARK. First character of any line that carries a number. */
export const RLM = "‏";

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
   «٠٥:١٢» in the app, and the colon between Arabic-Indic digits is the one
   place the bidi algorithm reliably mangles a time. */
export const time = (hhmm) => RLM + "‎" + hhmm + "‎";

/* Every line that carries a number opens with the mark. Cheap enough to
   apply to all of them, which is why it is one function and not a decision
   each line makes for itself. */
export const line = (s) => RLM + s;

/* --- counting things out loud ------------------------------------------ *
 *  Arabic has a dual, so «٢ أيام» reads as a translation rather than as a
 *  sentence. The numeral is dropped for one and two and the word carries the
 *  count, which is the same rule `arCount` keeps in the app — repeated here
 *  rather than imported because `arCount` lives in `life-shared.jsx`, which
 *  imports React.
 * ---------------------------------------------------------------------- */
const forms = (one, two, few, many) => (n) =>
  n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${num(n)} ${few}` : `${num(n)} ${many}`;

export const daysWord = forms("يوم واحد", "يومان", "أيام", "يومًا");
/* A banked day, never «يوم متتالٍ»: the streak steps over one day under the
   target, so the run is not literally consecutive and the word that says it
   is must not be. The same four forms `countedWord` carries in the app —
   written again rather than imported because `life-shared.jsx` imports
   React, and this file is loaded by tests with nothing installed. */
export const countedWord = forms(
  "يوم مُحتسَب",
  "يومان مُحتسَبان",
  "أيام مُحتسَبة",
  "يومًا مُحتسَبًا",
);
export const minsWord = forms("دقيقة", "دقيقتان", "دقائق", "دقيقة");
export const pagesWord = forms("صفحة", "صفحتان", "صفحات", "صفحة");
export const habitsWord = forms("عادة", "عادتان", "عادات", "عادة");
export const tasksWord = forms("مهمة", "مهمتان", "مهام", "مهمة");
export const roundsWord = forms("جولة", "جولتان", "جولات", "جولة");

/* Minutes as hours and minutes, when there are enough of them to be worth
   saying that way. Ninety minutes is «ساعة ونصف» to a person and «٩٠ دقيقة»
   to a timer, and the screen this mirrors says the first. */
export const spanOf = (mins) => {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  if (m < 60) return minsWord(m);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  const hours = h === 1 ? "ساعة" : h === 2 ? "ساعتان" : `${num(h)} ساعات`;
  if (!rest) return hours;
  if (rest === 30) return `${hours} ونصف`;
  return `${hours} و${minsWord(rest)}`;
};

/* The days of the week in `Date.getDay()` order, so an index is an index on
   both sides of the split — the same order `DOW_AR` is written in. */
export const DOW = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
