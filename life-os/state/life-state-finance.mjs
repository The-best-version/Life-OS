/* --- the money: what came in, what went out ----------------------------
 *  `state.income` is what the hours paid; `state.expenses` is what the day
 *  cost. They are two lists and not one signed one, because they answer two
 *  different questions — «كم أكسب في الساعة؟» reads only the first, and a
 *  single ledger with negative rows would make every average on the income
 *  screen quietly wrong.
 *
 *  This file exists because an income row had no shape of its own: the
 *  finance screen wrote its five fields inline, which was survivable while
 *  the screen was the only writer. The Telegram bot is a second writer, and
 *  a second writer inventing its own row is exactly how `date` becomes a
 *  timestamp in one place and a day key in the other. So `incomeShape` and
 *  `expenseShape` are the one place a money row's fields are written, like
 *  `taskShape` and `bookShape` are for theirs.
 * --------------------------------------------------------------------- */
import { uid, obj, rows, dayKey, addDays } from "./life-state-util.mjs";

/* How many rows each list keeps. The screen reads the newest twelve and the
   windows below reach back thirty days, so five hundred is years of room —
   and a bound is what keeps a list fed from a phone from growing without
   one. Newest first in both, so the slice drops the oldest. */
export const MONEY_CAP = 500;

/* What a row is called when nothing was typed. A blank label on a money row
   is a row you cannot recognise a week later, and «صرفت ٣٥» with no word
   after it is a perfectly ordinary thing to send from a phone. */
export const INCOME_FALLBACK = "عمل مرن";
export const EXPENSE_FALLBACK = "مصروف";

/* A positive amount, rounded to halalas and never NaN. Everything downstream
   sums these, and one NaN in a list turns every total on the screen into
   «NaN» — so a row that cannot carry a number carries a zero. */
const amountOf = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
};

const labelOf = (v, fallback) => {
  const s = typeof v === "string" ? v.trim() : "";
  /* Trimmed and bounded, never cleared: a long label is still his words. */
  return s ? s.slice(0, 80) : fallback;
};

/* A day key, because every window below compares these as strings. An ISO
   day key sorts lexicographically, which is what makes `>=` on a date a
   correct comparison and a `new Date()` parse unnecessary. */
const dateOf = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : dayKey());

export const incomeShape = (e) => (
  (e = obj(e)),
  {
    id: e.id || uid(),
    date: dateOf(e.date),
    label: labelOf(e.label, INCOME_FALLBACK),
    /* Hours are optional and separate from the amount on purpose: the hourly
       rate is the one number that says whether an hour of flexible work is
       worth the hour, and it can only be read off rows that recorded both. */
    hours: amountOf(e.hours),
    amount: amountOf(e.amount),
  }
);

export const expenseShape = (e) => (
  (e = obj(e)),
  {
    id: e.id || uid(),
    date: dateOf(e.date),
    label: labelOf(e.label, EXPENSE_FALLBACK),
    amount: amountOf(e.amount),
  }
);

/* --- the windows ------------------------------------------------------ *
 *  Pure, and down here rather than in the screen, because the screen is no
 *  longer the only thing that reads them: the bot's morning brief says what
 *  the week cost, and a second copy of this arithmetic is a second answer
 *  to «كم صرفت؟».
 * ---------------------------------------------------------------------- */

export const amountSum = (list) =>
  rows(list).reduce((n, e) => n + amountOf(e.amount), 0);

export const hoursSum = (list) =>
  rows(list).reduce((n, e) => n + amountOf(e.hours), 0);

/* The rows dated inside the last `days` days, today included. Counted off the
   logical day rather than the clock, so a 01:00 expense belongs to the
   evening it was spent in — the same boundary every other part of the app
   uses. */
export const sinceDays = (list, days, today = dayKey()) => {
  const from = addDays(today, -(Math.max(1, Math.round(days)) - 1));
  return rows(list).filter((e) => dateOf(e.date) >= from);
};

/* What an hour of flexible work actually pays, over a window. Zero hours
   gives zero rather than Infinity: a month of income with no hours recorded
   is a month with no rate, not an infinite one. */
export const hourRate = (income, days = 30, today = dayKey()) => {
  const list = sinceDays(income, days, today);
  const h = hoursSum(list);
  return h ? amountSum(list) / h : 0;
};

/* In minus out. Signed deliberately — a negative balance is the fact the
   screen exists to show, and clamping it at zero would hide the only month
   worth reacting to. */
export const netBalance = (income, expenses) =>
  amountSum(income) - amountSum(expenses);
