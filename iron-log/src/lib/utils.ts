import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { IsoDate } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* Ids                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Collision-resistant id. Uses `crypto.randomUUID` where available and falls
 * back to a timestamp + random suffix, so it also works in older Safari and
 * during SSR.
 */
export function createId(prefix = "id"): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (typeof g.crypto?.randomUUID === "function") {
    return `${prefix}_${g.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Coerce untrusted input (form fields, imported JSON) to a finite number.
 * Returns `null` instead of `NaN` so callers must handle the bad case.
 */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    // Accept Arabic-Indic digits and both decimal separators.
    const normalized = trimmed
      .replace(/[٠-٩]/g, (d) =>
        String(d.charCodeAt(0) - 0x0660),
      )
      .replace(/[۰-۹]/g, (d) =>
        String(d.charCodeAt(0) - 0x06f0),
      )
      .replace(/٫|,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Round to `digits` decimals without float dust (`0.1 + 0.2` problems). */
export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return NUMBER_FORMAT.format(round(value, 1));
}

/** Compact form for stat tiles: 940 · 12.4K · 1.2M. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${round(value / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${round(value / 1_000, 1)}K`;
  return formatNumber(value);
}

export function formatWeight(kg: number, unit: "kg" | "lb"): string {
  const value = unit === "lb" ? kg * 2.2046226218 : kg;
  return `${formatNumber(value)} ${unit === "lb" ? "رطل" : "كجم"}`;
}

export function formatSigned(value: number, digits = 1): string {
  const rounded = round(value, digits);
  if (rounded === 0) return "0";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded))}`;
}

/* ------------------------------------------------------------------ */
/* Dates — all local-time, never UTC-shifted                           */
/* ------------------------------------------------------------------ */

/** `YYYY-MM-DD` for a local Date (never `toISOString`, which shifts to UTC). */
export function toIsoDate(date: Date = new Date()): IsoDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const parsed = fromIsoDate(value);
  return parsed !== null && toIsoDate(parsed) === value;
}

/** Parse `YYYY-MM-DD` at local midnight. Returns `null` on anything invalid. */
export function fromIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function shiftIsoDate(value: IsoDate, days: number): IsoDate {
  const date = fromIsoDate(value);
  if (!date) return value;
  return toIsoDate(addDays(date, days));
}

/** Whole days between two ISO dates (`b - a`). `0` if either is unparseable. */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  const start = fromIsoDate(a);
  const end = fromIsoDate(b);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** The training week opens on Saturday, matching the Gulf gym week. */
export const WEEK_START_DAY = 6;

export function startOfWeek(date: Date): Date {
  const diff = (date.getDay() - WEEK_START_DAY + 7) % 7;
  const start = addDays(date, -diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

/*
  `ar-u-nu-latn`, not plain `ar`.

  Every figure in this app is formatted through `NUMBER_FORMAT`, which is pinned
  to `en-US` and therefore always Latin. Plain `ar` leaves the numbering system
  to ICU, and ICU's default for Arabic is `arab` on some builds and `latn` on
  others — so the same bundle can render "١ أكتوبر" beside "53,235 كجم" on one
  machine and agree with itself on the next. The digits are pinned here so the
  screen can never disagree with itself about what a number looks like.
*/
const DATE_LOCALE = "ar-u-nu-latn";

const SHORT_DATE = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "numeric",
  month: "short",
});

const FULL_DATE = new Intl.DateTimeFormat(DATE_LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const WEEKDAY_SHORT = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: "short" });

export function formatShortDate(value: IsoDate): string {
  const date = fromIsoDate(value);
  return date ? SHORT_DATE.format(date) : value;
}

export function formatFullDate(value: IsoDate): string {
  const date = fromIsoDate(value);
  return date ? FULL_DATE.format(date) : value;
}

export function formatWeekday(value: IsoDate): string {
  const date = fromIsoDate(value);
  return date ? WEEKDAY_SHORT.format(date) : value;
}

/** "اليوم" / "أمس" / "قبل 4 أيام" — for history lists. */
export function formatRelativeDay(value: IsoDate): string {
  const delta = daysBetween(value, toIsoDate());
  if (delta === 0) return "اليوم";
  if (delta === 1) return "أمس";
  if (delta > 1 && delta < 30) return `قبل ${delta} يوم`;
  return formatShortDate(value);
}

/* ------------------------------------------------------------------ */
/* Collections                                                         */
/* ------------------------------------------------------------------ */

export function groupBy<T, K extends string>(
  items: readonly T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

export function indexById<T extends { id: string }>(
  items: readonly T[],
): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) if (Number.isFinite(value)) total += value;
  return total;
}

export function maxOf(values: readonly number[]): number | null {
  let best: number | null = null;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (best === null || value > best) best = value;
  }
  return best;
}
