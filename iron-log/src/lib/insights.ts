/**
 * Insights — the analysis layer the new screens read.
 *
 * Everything here is a pure function of the database (plus "now"), built on
 * the selectors in `metrics.ts`. Nothing is stored: a number that is derived
 * cannot drift from the log it describes.
 */

import {
  exerciseProgress,
  isWorkingSet,
  sessionDurationMin,
  sessionVolume,
  stalledLifts,
  trainedDates,
  weeklySetsByMuscle,
  bodySeries,
  type DbIndex,
} from "./metrics";
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  type Database,
  type Id,
  type IsoDate,
  type MuscleGroup,
  type ProgramDay,
} from "./types";
import {
  addDays,
  daysBetween,
  fromIsoDate,
  round,
  startOfWeek,
  sum,
  toIsoDate,
} from "./utils";

/* ------------------------------------------------------------------ */
/* Program                                                             */
/* ------------------------------------------------------------------ */

export function sortedDays(db: Database): ProgramDay[] {
  return [...db.programDays].sort((a, b) => a.order - b.order);
}

/**
 * The day the athlete should train next.
 *
 * 1. If today already has a session tied to a template, that is today's day.
 * 2. Otherwise: the template after the last one actually trained, cycling.
 * 3. With no history at all: the first template.
 */
export function suggestDay(
  db: Database,
  index: DbIndex,
  today: IsoDate = toIsoDate(),
): ProgramDay | null {
  const days = sortedDays(db);
  if (days.length === 0) return null;

  const todaySession = index.sessionByDate.get(today);
  if (todaySession?.programDayId) {
    const match = days.find((day) => day.id === todaySession.programDayId);
    if (match) return match;
  }

  const past = db.sessions
    .filter(
      (session) =>
        session.date < today &&
        session.programDayId !== null &&
        (index.setsBySession.get(session.id)?.length ?? 0) > 0,
    )
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const last = past[0];
  if (!last) return days[0] ?? null;
  const position = days.findIndex((day) => day.id === last.programDayId);
  if (position < 0) return days[0] ?? null;
  return days[(position + 1) % days.length] ?? null;
}

/** The most recent date a template was trained, or `null`. */
export function lastTrainedForDay(
  db: Database,
  index: DbIndex,
  dayId: Id,
): IsoDate | null {
  let latest: IsoDate | null = null;
  for (const session of db.sessions) {
    if (session.programDayId !== dayId) continue;
    if ((index.setsBySession.get(session.id)?.length ?? 0) === 0) continue;
    if (latest === null || session.date > latest) latest = session.date;
  }
  return latest;
}

/** A realistic session length for a template, in minutes. */
export function estimateDayMinutes(
  day: ProgramDay,
  typicalSessionMin: number | null,
): number {
  if (typicalSessionMin !== null) return typicalSessionMin;
  // ~3 working sets + rest per exercise lands close to 8 minutes each.
  return Math.max(15, day.exerciseIds.length * 8);
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

/** Narrow Arabic weekday letters, indexed by `Date.getDay()`. */
const WEEKDAY_LETTER = ["ح", "ن", "ث", "ر", "خ", "ج", "س"] as const;

export function weekdayLetter(iso: IsoDate): string {
  const date = fromIsoDate(iso);
  return date ? (WEEKDAY_LETTER[date.getDay()] ?? "") : "";
}

export interface CalendarDay {
  date: IsoDate;
  letter: string;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/** The current Saturday-opening week, seven days. */
export function currentWeek(
  db: Database,
  index: DbIndex,
  now: Date = new Date(),
): CalendarDay[] {
  const start = startOfWeek(now);
  const trained = trainedDates(db, index);
  const today = toIsoDate(now);
  return Array.from({ length: 7 }, (_, offset) => {
    const date = toIsoDate(addDays(start, offset));
    return {
      date,
      letter: weekdayLetter(date),
      trained: trained.has(date),
      isToday: date === today,
      isFuture: date > today,
    };
  });
}

export interface HeatCell {
  date: IsoDate;
  /** Working sets logged that day. */
  sets: number;
  /** An explicit check-in without sets still counts as attendance. */
  attended: boolean;
  isFuture: boolean;
}

/** `weeks` columns of seven days (Saturday first), oldest column first. */
export function trainingHeatmap(
  db: Database,
  index: DbIndex,
  weeks = 16,
  now: Date = new Date(),
): HeatCell[][] {
  const setsByDate = new Map<IsoDate, number>();
  for (const session of db.sessions) {
    const count = (index.setsBySession.get(session.id) ?? []).filter(
      isWorkingSet,
    ).length;
    if (count > 0) {
      setsByDate.set(session.date, (setsByDate.get(session.date) ?? 0) + count);
    }
  }
  const today = toIsoDate(now);
  const firstWeek = addDays(startOfWeek(now), -7 * (Math.max(1, weeks) - 1));

  const columns: HeatCell[][] = [];
  for (let w = 0; w < Math.max(1, weeks); w += 1) {
    const column: HeatCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = toIsoDate(addDays(firstWeek, w * 7 + d));
      column.push({
        date,
        sets: setsByDate.get(date) ?? 0,
        attended: db.attendance[date] === true,
        isFuture: date > today,
      });
    }
    columns.push(column);
  }
  return columns;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export interface SessionPr {
  exerciseId: Id;
  name: string;
  weightKg: number;
  reps: number;
}

export interface SessionSummary {
  sessionId: Id;
  date: IsoDate;
  dayName: string | null;
  sets: number;
  volumeKg: number;
  exercises: number;
  durationMin: number | null;
  prs: SessionPr[];
}

export function sessionSummary(
  db: Database,
  index: DbIndex,
  sessionId: Id,
): SessionSummary | null {
  const session = index.sessionById.get(sessionId);
  if (!session) return null;
  const working = (index.setsBySession.get(sessionId) ?? []).filter(isWorkingSet);
  const exerciseIds = Array.from(new Set(working.map((entry) => entry.exerciseId)));

  const prs: SessionPr[] = [];
  for (const exerciseId of exerciseIds) {
    const point = exerciseProgress(index, exerciseId).find(
      (item) => item.sessionId === sessionId,
    );
    if (point?.isPr) {
      prs.push({
        exerciseId,
        name: index.exerciseNameById.get(exerciseId) ?? "",
        weightKg: point.topWeightKg,
        reps: point.topSetReps,
      });
    }
  }

  const day = session.programDayId
    ? db.programDays.find((item) => item.id === session.programDayId)
    : undefined;

  return {
    sessionId,
    date: session.date,
    dayName: day?.name ?? null,
    sets: working.length,
    volumeKg: sessionVolume(index, sessionId),
    exercises: exerciseIds.length,
    durationMin: sessionDurationMin(index, sessionId),
    prs,
  };
}

/** The latest session with at least one working set, optionally before a date. */
export function lastCompletedSession(
  db: Database,
  index: DbIndex,
  before?: IsoDate,
): SessionSummary | null {
  const candidates = db.sessions
    .filter((session) => (before ? session.date < before : true))
    .filter(
      (session) =>
        (index.setsBySession.get(session.id) ?? []).some(isWorkingSet),
    )
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const latest = candidates[0];
  return latest ? sessionSummary(db, index, latest.id) : null;
}

/* ------------------------------------------------------------------ */
/* Muscles                                                             */
/* ------------------------------------------------------------------ */

export type RecoveryState = "fresh" | "ready" | "recovering" | "today";

export interface MuscleRecovery {
  group: MuscleGroup;
  label: string;
  /** `null` when the muscle has never been trained. */
  daysSince: number | null;
  lastDate: IsoDate | null;
  state: RecoveryState;
}

/**
 * Days since each muscle last took a working set.
 *
 * A heuristic, labelled as one: 48–72 hours is the common recovery window for
 * a trained muscle, so 0 days = trained today, 1 = recovering, 2+ = ready.
 */
export function muscleRecovery(
  db: Database,
  index: DbIndex,
  today: IsoDate = toIsoDate(),
): MuscleRecovery[] {
  const lastByGroup = new Map<MuscleGroup, IsoDate>();
  for (const entry of db.setEntries) {
    if (!isWorkingSet(entry)) continue;
    const date = index.sessionById.get(entry.sessionId)?.date;
    const group = index.exerciseGroupById.get(entry.exerciseId);
    if (!date || !group || date > today) continue;
    const current = lastByGroup.get(group);
    if (!current || date > current) lastByGroup.set(group, date);
  }

  return MUSCLE_GROUPS.map((group) => {
    const lastDate = lastByGroup.get(group) ?? null;
    const daysSince = lastDate ? daysBetween(lastDate, today) : null;
    const state: RecoveryState =
      daysSince === null
        ? "fresh"
        : daysSince === 0
          ? "today"
          : daysSince === 1
            ? "recovering"
            : "ready";
    return { group, label: MUSCLE_GROUP_LABELS[group], daysSince, lastDate, state };
  });
}

/* ------------------------------------------------------------------ */
/* Fatigue                                                             */
/* ------------------------------------------------------------------ */

export interface DeloadSignal {
  level: "none" | "watch" | "deload";
  reasons: string[];
  stalledCount: number;
  overCount: number;
}

/**
 * Should this week be lighter?
 *
 * Two independent signals: lifts whose e1RM has stopped moving for three
 * sessions, and muscles pushed past their weekly ceiling (MRV). Low
 * self-rated readiness over the last three sessions tips a "watch" into a
 * "deload".
 */
export function deloadSignal(db: Database, index: DbIndex): DeloadSignal {
  const stalled = stalledLifts(db, index, 3);
  const over = weeklySetsByMuscle(db, index, 7).filter((row) => row.status === "over");

  const recentReadiness = [...db.sessions]
    .filter((session) => session.readiness !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3)
    .map((session) => session.readiness as number);
  const lowReadiness =
    recentReadiness.length === 3 &&
    sum(recentReadiness) / recentReadiness.length <= 2;

  const reasons: string[] = [];
  if (stalled.length > 0) reasons.push(`${stalled.length} تمرين ثابت منذ ٣ حصص`);
  if (over.length > 0) reasons.push(`${over.length} عضلة فوق السقف الأسبوعي`);
  if (lowReadiness) reasons.push("الجاهزية منخفضة آخر ٣ حصص");

  let level: DeloadSignal["level"] = "none";
  if (stalled.length >= 2 || over.length >= 2 || (reasons.length >= 2 && lowReadiness)) {
    level = "deload";
  } else if (reasons.length > 0) {
    level = "watch";
  }

  return { level, reasons, stalledCount: stalled.length, overCount: over.length };
}

/* ------------------------------------------------------------------ */
/* Body                                                                */
/* ------------------------------------------------------------------ */

export interface WeightTrend {
  /** Latest 7-day average, kg. */
  current: number;
  /** Signed kg per week over the measured span. `null` under 7 days of data. */
  weeklyKg: number | null;
  /** Same rate as a share of bodyweight, %/week. */
  weeklyPct: number | null;
  spanDays: number;
}

/**
 * Rate of weight change, from the smoothed line.
 *
 * Reported as %/week because that is how a phase is judged: roughly
 * −0.5 to −1.0 %/week on a cut, +0.25 to +0.5 %/week on a lean bulk.
 */
export function weightTrend(db: Database): WeightTrend | null {
  const points = bodySeries(db, "weightKg", 400);
  const latest = points[points.length - 1];
  if (!latest) return null;

  const target = toIsoDate(addDays(fromIsoDate(latest.date) ?? new Date(), -14));
  const base =
    [...points].reverse().find((point) => point.date <= target) ?? points[0];
  if (!base) return { current: latest.average, weeklyKg: null, weeklyPct: null, spanDays: 0 };

  const spanDays = daysBetween(base.date, latest.date);
  if (spanDays < 7 || base.average <= 0) {
    return { current: latest.average, weeklyKg: null, weeklyPct: null, spanDays };
  }

  const weeklyKg = ((latest.average - base.average) / spanDays) * 7;
  return {
    current: latest.average,
    weeklyKg: round(weeklyKg, 2),
    weeklyPct: round((weeklyKg / base.average) * 100, 2),
    spanDays,
  };
}

/* ------------------------------------------------------------------ */
/* Nutrition                                                           */
/* ------------------------------------------------------------------ */

export interface NutritionDay {
  date: IsoDate;
  kcal: number;
  protein: number;
  logged: boolean;
}

/** The last `days` days of intake, oldest first, ending at `end`. */
export function nutritionWindow(
  db: Database,
  end: IsoDate = toIsoDate(),
  days = 7,
): NutritionDay[] {
  const endDate = fromIsoDate(end) ?? new Date();
  return Array.from({ length: Math.max(1, days) }, (_, offset) => {
    const date = toIsoDate(addDays(endDate, offset - (Math.max(1, days) - 1)));
    const entry = db.nutrition[date];
    return {
      date,
      kcal: entry?.kcal ?? 0,
      protein: entry?.protein ?? 0,
      logged: entry !== undefined,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Plates                                                              */
/* ------------------------------------------------------------------ */

export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const BAR_OPTIONS_KG = [20, 15, 10] as const;

export interface PlateLoad {
  /** Plates for ONE side of the bar, heaviest first. */
  perSide: number[];
  /** What the bar actually weighs with those plates. */
  loadedKg: number;
  /** Target minus loaded — non-zero when the target is not loadable exactly. */
  remainderKg: number;
}

/**
 * Greedy plate loading, computed in grams so 2.5 + 1.25 never turns into
 * 3.7499999. Greedy is optimal for this denomination set.
 */
export function platesPerSide(
  targetKg: number,
  barKg: number,
  plates: readonly number[] = PLATES_KG,
): PlateLoad | null {
  if (!Number.isFinite(targetKg) || !Number.isFinite(barKg)) return null;
  if (targetKg < barKg || barKg < 0) return null;

  let remainingPerSide = Math.round(((targetKg - barKg) / 2) * 1000);
  const sorted = [...plates].sort((a, b) => b - a).map((p) => Math.round(p * 1000));
  const perSide: number[] = [];

  for (const plate of sorted) {
    if (plate <= 0) continue;
    while (remainingPerSide >= plate && perSide.length < 40) {
      perSide.push(plate / 1000);
      remainingPerSide -= plate;
    }
  }

  const loadedKg = round(barKg + sum(perSide) * 2, 2);
  return { perSide, loadedKg, remainderKg: round(targetKg - loadedKg, 2) };
}
