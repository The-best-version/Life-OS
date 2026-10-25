/**
 * The sport contract.
 *
 * One object per discipline. This file is the *only* place that knows what
 * makes boxing boxing — every screen below it reads `engine`, `fields`,
 * `metrics`, `records`, `strain` and `timer` off whichever config is active,
 * so adding a sport is adding an entry here and nothing else.
 *
 * Deliberately free of React and of icon imports: the UI fastens a lucide
 * component onto each `icon` key in `components/session/sport-icon.tsx`, the
 * same way `MUSCLE_GROUP_LABELS` keeps its labels away from the chart that
 * draws them. That keeps this module loadable by a test, a script, or the
 * standalone build with nothing rendered.
 */

import type { AthleticSession, SportConfig, SportId } from "./types";
import { SPORT_IDS } from "./types";
import { clamp, round } from "./utils";

/* ------------------------------------------------------------------ */
/* Presenters shared by more than one sport                            */
/* ------------------------------------------------------------------ */

/** Seconds → "M:SS", or "H:MM:SS" past the hour. Never negative. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const hrs = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return hrs > 0 ? `${hrs}:${pad(min)}:${pad(sec)}` : `${min}:${pad(sec)}`;
}

/** Minutes → "١س ٢٤د" style, but in Latin digits inside a `.num` span. */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes || 0));
  return m >= 60 ? `${Math.floor(m / 60)}:${m % 60 < 10 ? "0" : ""}${m % 60}` : `${m}`;
}

/**
 * Decimal minutes per kilometre → "5:22".
 *
 * A pace is never read as a decimal: 5.37 is not a time anybody recognises,
 * and rounding it to 5.4 min/km hides eight seconds a kilometre.
 */
export function formatPace(minPerKm: number): string {
  if (!isFinite(minPerKm) || minPerKm <= 0) return "—";
  let min = Math.floor(minPerKm);
  let sec = Math.round((minPerKm - min) * 60);
  if (sec === 60) {
    min += 1;
    sec = 0;
  }
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

/* ------------------------------------------------------------------ */
/* The disciplines                                                     */
/* ------------------------------------------------------------------ */

const GYM: SportConfig = {
  id: "gym",
  name: "Gym",
  nameAr: "حديد",
  icon: "gym",
  accentVar: "--sport-gym",
  engine: "sets",
  weeklyTarget: 4,
  timer: { mode: "rest", work: 0, rest: 120, rounds: 0, autoStart: true },
  modes: [
    { id: "hypertrophy", label: "تضخيم" },
    { id: "strength", label: "قوة" },
    { id: "pump", label: "ضخ" },
  ],
  /* The gym's own inputs live on `SetEntry` and are logged per set by the
     exercise logger, which knows about warm-ups, per-machine increments and
     double progression. The fields below exist so a gym session can still be
     summarised beside the other disciplines — never to replace that screen. */
  fields: [
    { key: "minutes", label: "المدة", unit: "دقيقة", step: 5, min: 5, max: 300 },
    { key: "intensity", label: "الشدة", unit: "/10", step: 1, min: 1, max: 10 },
  ],
  metrics: [
    { key: "minutes", label: "المدة", unit: "دقيقة", calc: (s) => s.minutes ?? NaN },
    { key: "intensity", label: "الشدة", unit: "/10", calc: (s) => s.intensity ?? NaN },
  ],
  records: [{ key: "minutes", label: "أطول حصة", better: "max", unit: "دقيقة" }],
  strain: (s) =>
    clamp(Math.round((s.minutes ?? 0) * 0.5 + (s.intensity ?? 5) * 4), 0, 100),
};

const BOXING: SportConfig = {
  id: "boxing",
  name: "Boxing",
  nameAr: "ملاكمة",
  icon: "boxing",
  accentVar: "--sport-boxing",
  engine: "rounds",
  weeklyTarget: 2,
  timer: { mode: "round", work: 180, rest: 60, rounds: 10, autoStart: true },
  modes: [
    { id: "bag", label: "كيس" },
    { id: "pads", label: "باد" },
    { id: "sparring", label: "سباررينغ" },
    { id: "shadow", label: "ظل" },
  ],
  fields: [
    { key: "rounds", label: "الجولات", unit: "جولة", step: 1, min: 1, max: 20 },
    { key: "roundSeconds", label: "طول الجولة", unit: "ثانية", step: 30, min: 60, max: 300 },
    { key: "intensity", label: "الشدة", unit: "/10", step: 1, min: 1, max: 10 },
    { key: "avgHr", label: "متوسط النبض", unit: "ن/د", step: 1, min: 60, max: 210 },
  ],
  metrics: [
    { key: "rounds", label: "الجولات", unit: "جولة", calc: (s) => s.rounds ?? 0 },
    {
      key: "workTime",
      label: "وقت العمل",
      unit: "دقيقة",
      calc: (s) => Math.round(((s.rounds ?? 0) * (s.roundSeconds ?? 180)) / 60),
    },
    { key: "intensity", label: "الشدة", unit: "/10", calc: (s) => s.intensity ?? NaN },
  ],
  records: [
    { key: "rounds", label: "أطول سلسلة جولات", better: "max", unit: "جولة" },
    { key: "workTime", label: "أكثر وقت عمل", better: "max", unit: "دقيقة" },
  ],
  strain: (s) => clamp(Math.round((s.rounds ?? 0) * 6 + (s.intensity ?? 5) * 4), 0, 100),
};

const EQUESTRIAN: SportConfig = {
  id: "equestrian",
  name: "Equestrian",
  nameAr: "فروسية",
  icon: "equestrian",
  accentVar: "--sport-equestrian",
  engine: "stopwatch",
  weeklyTarget: 2,
  timer: { mode: "stopwatch", work: 0, rest: 0, rounds: 0, autoStart: false },
  modes: [
    { id: "jumping", label: "قفز حواجز" },
    { id: "dressage", label: "ترويض" },
    { id: "conditioning", label: "تجهيز" },
    { id: "trail", label: "خلوي" },
  ],
  fields: [
    { key: "minutes", label: "مدة الركوب", unit: "دقيقة", step: 5, min: 5, max: 240 },
    { key: "avgHr", label: "متوسط النبض", unit: "ن/د", step: 1, min: 60, max: 210 },
    { key: "intensity", label: "المجهود", unit: "/10", step: 1, min: 1, max: 10 },
  ],
  metrics: [
    { key: "minutes", label: "على السرج", unit: "دقيقة", calc: (s) => s.minutes ?? NaN },
    {
      key: "canterShare",
      label: "قفز وركض",
      unit: "%",
      calc: (s) => {
        const fast = s.gaits.filter((g) => g === "canter" || g === "gallop").length;
        return s.gaits.length ? Math.round((fast / s.gaits.length) * 100) : 0;
      },
    },
    { key: "avgHr", label: "متوسط النبض", unit: "ن/د", calc: (s) => s.avgHr ?? NaN },
  ],
  records: [{ key: "minutes", label: "أطول ركوب", better: "max", unit: "دقيقة" }],
  strain: (s) =>
    clamp(
      Math.round((s.minutes ?? 0) * 0.7 + Math.max(0, (s.avgHr ?? 0) - 90) * 0.4),
      0,
      100,
    ),
};

const RUNNING: SportConfig = {
  id: "running",
  name: "Running",
  nameAr: "جري",
  icon: "running",
  accentVar: "--sport-running",
  engine: "distance",
  weeklyTarget: 3,
  timer: { mode: "stopwatch", work: 0, rest: 0, rounds: 0, autoStart: true },
  modes: [
    { id: "easy", label: "هادئ" },
    { id: "tempo", label: "تيمبو" },
    { id: "intervals", label: "فواصل" },
    { id: "long", label: "طويل" },
  ],
  fields: [
    { key: "km", label: "المسافة", unit: "كم", step: 0.1, min: 0.1, max: 100 },
    { key: "minutes", label: "المدة", unit: "دقيقة", step: 1, min: 1, max: 600 },
    { key: "avgHr", label: "متوسط النبض", unit: "ن/د", step: 1, min: 60, max: 210 },
  ],
  metrics: [
    { key: "km", label: "المسافة", unit: "كم", calc: (s) => s.km ?? NaN },
    {
      key: "pace",
      label: "الإيقاع",
      unit: "/كم",
      format: formatPace,
      calc: (s) => (s.km ? (s.minutes ?? 0) / s.km : 0),
    },
    { key: "minutes", label: "المدة", unit: "دقيقة", calc: (s) => s.minutes ?? NaN },
    { key: "avgHr", label: "متوسط النبض", unit: "ن/د", calc: (s) => s.avgHr ?? NaN },
  ],
  records: [
    { key: "km", label: "أطول مسافة", better: "max", unit: "كم" },
    { key: "pace", label: "أسرع إيقاع", better: "min", unit: "/كم", format: formatPace },
  ],
  strain: (s) =>
    clamp(
      Math.round((s.minutes ?? 0) * 0.9 + Math.max(0, (s.avgHr ?? 0) - 110) * 0.5),
      0,
      100,
    ),
};

/** Declaration order is display order, in the switcher and in the radar. */
export const SPORTS_CONFIG: SportConfig[] = [GYM, BOXING, EQUESTRIAN, RUNNING];

export const SPORTS: Record<SportId, SportConfig> = {
  gym: GYM,
  boxing: BOXING,
  equestrian: EQUESTRIAN,
  running: RUNNING,
};

/**
 * The overview pseudo-sport the switcher offers.
 *
 * Not a discipline: it is `null` rather than a config, so nothing can read an
 * engine off it and start a session from "all sports".
 */
export const ALL_SPORTS = "all" as const;

export type SportFilter = SportId | typeof ALL_SPORTS;

export function isSportId(value: unknown): value is SportId {
  return typeof value === "string" && (SPORT_IDS as readonly string[]).includes(value);
}

/** Falls back to the gym rather than throwing: a stored id can outlive a config. */
export function getSport(id: SportFilter): SportConfig {
  return isSportId(id) ? SPORTS[id] : GYM;
}

/** The sports a filter covers — the whole list for the overview. */
export function sportsIn(filter: SportFilter): SportConfig[] {
  return filter === ALL_SPORTS ? SPORTS_CONFIG : [getSport(filter)];
}

/**
 * One reading, already presented.
 *
 * `display` is what goes on screen and `value` is what gets compared, which is
 * the whole reason both are here: a pace sorts as 5.37 and reads as "5:22".
 */
export interface MetricReading {
  key: string;
  label: string;
  unit: string;
  value: number;
  display: string;
}

/** Every metric a sport defines, read off one session row. */
export function sessionMetrics(session: AthleticSession): MetricReading[] {
  const sport = getSport(session.sport);
  return sport.metrics.map((metric) => {
    const value = metric.calc(session);
    /* A reading that was never taken is NaN here and reads as «—» on screen.
       A zero would be a claim the user never made: "0 bpm" and "I did not
       wear a strap" are different facts, and only one of them belongs in an
       average. The same distinction `BodyMetric` keeps in the database. */
    const measured = Number.isFinite(value);
    return {
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      value,
      display: !measured
        ? "—"
        : metric.format
          ? metric.format(value)
          : String(round(value, 1)),
    };
  });
}

/** The value a record kind compares, for one session. */
export function recordValue(session: AthleticSession, key: string): number {
  const sport = getSport(session.sport);
  const metric = sport.metrics.find((m) => m.key === key);
  if (metric) return metric.calc(session);
  const raw = (session as unknown as Record<string, unknown>)[key];
  return typeof raw === "number" && isFinite(raw) ? raw : 0;
}
