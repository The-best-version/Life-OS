/* --- النوم: ليلة واحدة لليوم، تُقرأ من مكان واحد ---------------------------
 *  كان هذا الملف غائباً، والنوم كان مكتوباً في مكانين لا يرى أحدهما
 *  الآخر: بوت تيليجرام الرئيسي يكتب `state.sleepLogs` فعلاً (مزامَن مع
 *  القرص، يقرأه `ask.js` في مراجعته الأسبوعية) — لكن `state.sleepLogs` لم
 *  يكن في `freshState`/`carryOf`/`SCHEMA`، فكل ليلة كتبها البوت كانت
 *  تُمحى في أول دوران يوم. وشاشة «مختبر النوم» كانت تكتب نسخة ثالثة في
 *  `localStorage` خاص بها وحده، لا يراها البوت ولا القرص ولا النسخ
 *  الاحتياطية. نسختان من نوم الليلة الواحدة لا تتفقان، وهذا الملف هو
 *  المكان الوحيد الذي يُكتب فيه سطر نوم من الآن.
 *
 *  سطر واحد لليوم، كالوزن بالضبط — ليلتان في يوم واحد ستختلفان بدقيقة لا
 *  بجسد، والدمج هنا كتابة ثانية تصحّح الأولى، لا سطراً يُضاف بجانبها.
 * --------------------------------------------------------------------- */
import {
  uid,
  obj,
  rows,
  dayKey,
  addDays,
  isKey,
  hhmm,
  minsIn,
  clampNum,
} from "./life-state-util.mjs";

export const SLEEP_CAP = 500;

const dateOf = (v) => (isKey(v) ? v : dayKey());

const sleepStr = (v, max, fallback = "") => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : fallback;
};

/* الساعات من وقتي النوم والاستيقاظ، عابرة منتصف الليل — نفس حساب شاشة
   النوم القديمة بالحرف. `null` بلا الوقتين معاً، لا صفر: لم يُسجَّل وقت
   ليس نوماً بصفر ساعة. */
const durationHours = (bedTime, wakeTime) => {
  const start = minsIn(bedTime);
  const end = minsIn(wakeTime);
  if (start === null || end === null) return null;
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 10) / 10;
};

/* السطر: من الشاشة (وقت نوم واستيقاظ وجودة) أو من البوت (ساعات مباشرة،
   «نمت ٧ ساعات» بلا وقتين) — كلاهما يصل هنا سطراً واحداً بالشكل نفسه.
   الوقتان يفوزان حين يردان معاً، لأنهما أدق مما قد يكون أُدخِل تقريباً. */
export const sleepShape = (s) => {
  s = obj(s);
  const bedTime = hhmm(s.bedTime);
  const wakeTime = hhmm(s.wakeTime);
  const derived = durationHours(bedTime, wakeTime);
  const hours = derived !== null ? derived : clampNum(s.hours, 0, 24, null);
  return {
    id: s.id || uid(),
    date: dateOf(s.date),
    bedTime,
    wakeTime,
    hours,
    cycles: hours !== null ? Math.round((hours / 1.5) * 10) / 10 : null,
    quality: s.quality === null || s.quality === undefined ? null : clampNum(s.quality, 1, 5, null),
    notes: sleepStr(s.notes, 160),
    source: s.source === "telegram" ? "telegram" : "app",
  };
};

/* القائمة كاملة، مُشكَّلة ومسقوفة ومرتَّبة — الأحدث أولاً كبقية قوائم
   النادي، فالقطع عند السقف يُسقط الأقدم لا الأحدث. سطر بلا ساعات (لا
   وقتين ولا رقم) لا يدخل القائمة: لا يجيب شيئاً. */
export const sleepLogsOf = (list) =>
  rows(list)
    .map(sleepShape)
    .filter((s) => s.hours !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, SLEEP_CAP);

/* الكتابة: نفس قاعدة `logWeigh` بالحرف — سطر اليوم يصحّح سطر اليوم، لا
   يُضاف بجانبه. */
export const logSleep = (list, row) => {
  const shaped = sleepShape(row);
  const current = sleepLogsOf(list);
  if (shaped.hours === null) return current;
  const rest = current.filter((x) => x.date !== shaped.date);
  return [shaped, ...rest]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, SLEEP_CAP);
};

export const deleteSleep = (list, id) => sleepLogsOf(list).filter((x) => x.id !== id);

export const latestSleep = (list) => sleepLogsOf(list)[0] || null;

export const sleepOn = (list, date) => sleepLogsOf(list).find((x) => x.date === date) || null;

/* الليالي الفعلية المسجَّلة داخل نافذة، لا أيام التقويم — ليلة لم
   تُسجَّل غائبة عن المعدّل، لا صفر ساعة يُخفّضه. */
export const sleepIn = (list, days, today = dayKey()) => {
  const from = addDays(today, -(Math.max(1, Math.round(days)) - 1));
  return sleepLogsOf(list).filter((x) => x.date >= from && x.date <= today);
};

/* `null` بلا ليلة واحدة مسجَّلة في النافذة — معدّل محسوب على فراغ ليس
   معدّلاً. */
export const avgSleepHours = (list, days = 7, today = dayKey()) => {
  const win = sleepIn(list, days, today);
  if (!win.length) return null;
  return Math.round((win.reduce((n, x) => n + x.hours, 0) / win.length) * 10) / 10;
};

export const SLEEP_GOAL_HOURS = 7.5;

export const sleepDebtHours = (list, days = 7, today = dayKey(), goal = SLEEP_GOAL_HOURS) => {
  const win = sleepIn(list, days, today);
  if (!win.length) return null;
  return Math.round((win.length * goal - win.reduce((n, x) => n + x.hours, 0)) * 10) / 10;
};
