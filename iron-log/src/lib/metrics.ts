/**
 * Derived data — every number the dashboard shows is computed here, never in a
 * component. Pure functions over a `Database`, so they are trivially testable
 * and cheap to memoise.
 */

import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_LANDMARKS,
  type BodyField,
  type HealthField,
  type BodyPoint,
  type Database,
  type Exercise,
  type ExerciseProgressPoint,
  type Id,
  type IsoDate,
  type MuscleGroup,
  type MuscleGroupVolume,
  type MuscleVolumeRow,
  type OverloadTarget,
  type PersonalRecord,
  type Session,
  type SetEntry,
  type StallRow,
  type VolumePoint,
  type VolumeStatus,
  type WeeklyBucket,
} from "./types";
import {
  addDays,
  daysBetween,
  formatShortDate,
  fromIsoDate,
  indexById,
  round,
  startOfWeek,
  sum,
  toIsoDate,
} from "./utils";

/* ------------------------------------------------------------------ */
/* Single-set maths                                                    */
/* ------------------------------------------------------------------ */

/**
 * Epley estimated one-rep max: `w × (1 + reps/30)`.
 *
 * Why estimate at all: raw top weight hides progress made by adding reps at the
 * same load, which is most of what happens on machines. e1RM turns "80kg × 8"
 * and "80kg × 11" into two different, comparable numbers.
 *
 * The formula degrades past ~12 reps, so anything above that is capped to keep
 * a 30-rep burnout set from inventing a fake record.
 */
export function estimate1rm(weightKg: number, reps: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return 0;
  if (weightKg <= 0 || reps <= 0) return 0;
  const effectiveReps = Math.min(reps, 12);
  return round(weightKg * (1 + effectiveReps / 30), 1);
}

export function setVolume(entry: SetEntry): number {
  return entry.weightKg * entry.reps;
}

/** A set counts toward volume and records only if it is a working set. */
export function isWorkingSet(entry: SetEntry): boolean {
  return !entry.isWarmup && entry.reps > 0;
}

/* ------------------------------------------------------------------ */
/* Indexes                                                            */
/* ------------------------------------------------------------------ */

export interface DbIndex {
  sessionById: Map<Id, Session>;
  sessionByDate: Map<IsoDate, Session>;
  setsBySession: Map<Id, SetEntry[]>;
  setsByExercise: Map<Id, SetEntry[]>;
  exerciseNameById: Map<Id, string>;
  exerciseGroupById: Map<Id, MuscleGroup>;
  /** Session dates, ascending. */
  sessionDates: IsoDate[];
}

/**
 * Build every lookup the selectors need in one pass. Call once per render via
 * `useMemo` and thread it through — the alternative is O(n) scans per chart.
 */
export function buildIndex(db: Database): DbIndex {
  const sessionById = indexById(db.sessions);
  const sessionByDate = new Map<IsoDate, Session>();
  for (const session of db.sessions) sessionByDate.set(session.date, session);

  const setsBySession = new Map<Id, SetEntry[]>();
  const setsByExercise = new Map<Id, SetEntry[]>();

  for (const entry of db.setEntries) {
    const bySession = setsBySession.get(entry.sessionId);
    if (bySession) bySession.push(entry);
    else setsBySession.set(entry.sessionId, [entry]);

    const byExercise = setsByExercise.get(entry.exerciseId);
    if (byExercise) byExercise.push(entry);
    else setsByExercise.set(entry.exerciseId, [entry]);
  }

  const exerciseNameById = new Map<Id, string>();
  const exerciseGroupById = new Map<Id, MuscleGroup>();
  for (const exercise of db.exercises) {
    exerciseNameById.set(exercise.id, exercise.name);
    exerciseGroupById.set(exercise.id, exercise.muscleGroup);
  }

  const sessionDates = db.sessions
    .map((s) => s.date)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return {
    sessionById,
    sessionByDate,
    setsBySession,
    setsByExercise,
    exerciseNameById,
    exerciseGroupById,
    sessionDates,
  };
}

/* ------------------------------------------------------------------ */
/* Per-exercise progression                                            */
/* ------------------------------------------------------------------ */

/**
 * One point per session in which the exercise was trained, ascending by date,
 * with `isPr` flagged the first time each new top weight is reached.
 */
export function exerciseProgress(
  index: DbIndex,
  exerciseId: Id,
): ExerciseProgressPoint[] {
  const entries = (index.setsByExercise.get(exerciseId) ?? []).filter(
    isWorkingSet,
  );
  if (entries.length === 0) return [];

  const bySession = new Map<Id, SetEntry[]>();
  for (const entry of entries) {
    const bucket = bySession.get(entry.sessionId);
    if (bucket) bucket.push(entry);
    else bySession.set(entry.sessionId, [entry]);
  }

  const points: ExerciseProgressPoint[] = [];

  for (const [sessionId, sets] of bySession) {
    const session = index.sessionById.get(sessionId);
    if (!session) continue;

    let topSet = sets[0];
    if (!topSet) continue;
    for (const candidate of sets) {
      if (
        candidate.weightKg > topSet.weightKg ||
        (candidate.weightKg === topSet.weightKg &&
          candidate.reps > topSet.reps)
      ) {
        topSet = candidate;
      }
    }

    const best1rm = sets.reduce(
      (best, s) => Math.max(best, estimate1rm(s.weightKg, s.reps)),
      0,
    );

    points.push({
      date: session.date,
      sessionId,
      topWeightKg: topSet.weightKg,
      topSetReps: topSet.reps,
      estimated1rm: round(best1rm, 1),
      volumeKg: round(sum(sets.map(setVolume)), 1),
      totalReps: sum(sets.map((s) => s.reps)),
      isPr: false,
    });
  }

  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let best = 0;
  for (const point of points) {
    if (point.topWeightKg > best) {
      // The very first session is a baseline, not a record to celebrate.
      point.isPr = best > 0;
      best = point.topWeightKg;
    }
  }

  return points;
}

/** The heaviest working set ever recorded for an exercise. */
export function bestSetFor(
  index: DbIndex,
  exerciseId: Id,
): { set: SetEntry; date: IsoDate } | null {
  const entries = (index.setsByExercise.get(exerciseId) ?? []).filter(
    isWorkingSet,
  );
  let best: SetEntry | null = null;
  for (const entry of entries) {
    if (
      !best ||
      entry.weightKg > best.weightKg ||
      (entry.weightKg === best.weightKg && entry.reps > best.reps)
    ) {
      best = entry;
    }
  }
  if (!best) return null;
  const date = index.sessionById.get(best.sessionId)?.date;
  return date ? { set: best, date } : null;
}

/** The sets from the most recent *previous* session, for the "last time" hint. */
export function previousSessionSets(
  index: DbIndex,
  exerciseId: Id,
  excludeSessionId: Id | null,
): { date: IsoDate; sets: SetEntry[] } | null {
  const entries = index.setsByExercise.get(exerciseId) ?? [];
  const grouped = new Map<IsoDate, SetEntry[]>();

  for (const entry of entries) {
    if (entry.sessionId === excludeSessionId) continue;
    const date = index.sessionById.get(entry.sessionId)?.date;
    if (!date) continue;
    const bucket = grouped.get(date);
    if (bucket) bucket.push(entry);
    else grouped.set(date, [entry]);
  }

  const dates = Array.from(grouped.keys()).sort((a, b) => (a < b ? 1 : -1));
  const latest = dates[0];
  if (!latest) return null;
  const sets = grouped.get(latest);
  if (!sets || sets.length === 0) return null;
  return {
    date: latest,
    sets: [...sets].sort((a, b) => a.setIndex - b.setIndex),
  };
}

/* ------------------------------------------------------------------ */
/* Volume                                                             */
/* ------------------------------------------------------------------ */

/** Total tonnage per session, ascending, limited to the most recent `limit`. */
export function volumeSeries(
  db: Database,
  index: DbIndex,
  limit = 14,
): VolumePoint[] {
  const points: VolumePoint[] = [];

  for (const session of db.sessions) {
    const sets = (index.setsBySession.get(session.id) ?? []).filter(
      isWorkingSet,
    );
    if (sets.length === 0) continue;
    points.push({
      date: session.date,
      sessionId: session.id,
      volumeKg: round(sum(sets.map(setVolume)), 0),
      setCount: sets.length,
      label: formatShortDate(session.date),
    });
  }

  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return points.slice(-Math.max(1, limit));
}

export function sessionVolume(index: DbIndex, sessionId: Id): number {
  const sets = (index.setsBySession.get(sessionId) ?? []).filter(isWorkingSet);
  return round(sum(sets.map(setVolume)), 0);
}

/** Volume share per muscle group over the last `days` days. */
export function muscleGroupVolume(
  db: Database,
  index: DbIndex,
  days = 28,
): MuscleGroupVolume[] {
  const cutoff = toIsoDate(addDays(new Date(), -Math.max(1, days) + 1));

  const volumeByGroup = new Map<MuscleGroup, { volume: number; sets: number }>();

  for (const entry of db.setEntries) {
    if (!isWorkingSet(entry)) continue;
    const date = index.sessionById.get(entry.sessionId)?.date;
    if (!date || date < cutoff) continue;
    const group = index.exerciseGroupById.get(entry.exerciseId);
    if (!group) continue;
    const bucket = volumeByGroup.get(group) ?? { volume: 0, sets: 0 };
    bucket.volume += setVolume(entry);
    bucket.sets += 1;
    volumeByGroup.set(group, bucket);
  }

  const total = sum(Array.from(volumeByGroup.values(), (b) => b.volume));

  return MUSCLE_GROUPS.map((group) => {
    const bucket = volumeByGroup.get(group) ?? { volume: 0, sets: 0 };
    return {
      group,
      label: MUSCLE_GROUP_LABELS[group],
      volumeKg: round(bucket.volume, 0),
      setCount: bucket.sets,
      share: total > 0 ? bucket.volume / total : 0,
    };
  })
    .filter((row) => row.volumeKg > 0)
    .sort((a, b) => b.volumeKg - a.volumeKg);
}

/* ------------------------------------------------------------------ */
/* Records                                                            */
/* ------------------------------------------------------------------ */

/** Every personal record across every exercise, newest first. */
export function personalRecords(
  db: Database,
  index: DbIndex,
  limit = 8,
): PersonalRecord[] {
  const records: PersonalRecord[] = [];

  for (const exercise of db.exercises) {
    const points = exerciseProgress(index, exercise.id);
    let previousBest: number | null = null;

    for (const point of points) {
      if (point.isPr && previousBest !== null) {
        records.push({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          date: point.date,
          weightKg: point.topWeightKg,
          reps: point.topSetReps,
          estimated1rm: point.estimated1rm,
          gainKg: round(point.topWeightKg - previousBest, 1),
        });
      }
      if (previousBest === null || point.topWeightKg > previousBest) {
        previousBest = point.topWeightKg;
      }
    }
  }

  records.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return records.slice(0, Math.max(1, limit));
}

/* ------------------------------------------------------------------ */
/* Consistency                                                        */
/* ------------------------------------------------------------------ */

/** Dates that count as "trained": an explicit check-in or a session with sets. */
export function trainedDates(db: Database, index: DbIndex): Set<IsoDate> {
  const dates = new Set<IsoDate>();
  for (const [date, present] of Object.entries(db.attendance)) {
    if (present) dates.add(date);
  }
  for (const session of db.sessions) {
    const sets = index.setsBySession.get(session.id);
    if (sets && sets.length > 0) dates.add(session.date);
  }
  return dates;
}

/**
 * Consecutive trained days ending today (or yesterday, so the streak does not
 * appear broken before the user has trained today).
 */
export function currentStreak(dates: Set<IsoDate>): number {
  const cursor = new Date();
  if (!dates.has(toIsoDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  // Bounded loop: a 3650-day streak is not a thing we need to support.
  while (streak < 3650 && dates.has(toIsoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(dates: Set<IsoDate>): number {
  const sorted = Array.from(dates).sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;

  for (const iso of sorted) {
    const date = fromIsoDate(iso);
    if (!date) continue;
    if (
      previous &&
      Math.round((date.getTime() - previous.getTime()) / 86_400_000) === 1
    ) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

/** The last `weeks` training weeks (Saturday-opening), oldest first. */
export function weeklyBuckets(
  db: Database,
  index: DbIndex,
  weeks = 8,
): WeeklyBucket[] {
  const count = Math.max(1, weeks);
  const thisWeekStart = startOfWeek(new Date());
  const trained = trainedDates(db, index);

  const buckets: WeeklyBucket[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const start = addDays(thisWeekStart, -7 * i);
    const startIso = toIsoDate(start);
    const endIso = toIsoDate(addDays(start, 6));

    const sessionsInWeek = db.sessions.filter(
      (s) => s.date >= startIso && s.date <= endIso,
    );

    let attended = 0;
    for (let d = 0; d < 7; d += 1) {
      if (trained.has(toIsoDate(addDays(start, d)))) attended += 1;
    }

    buckets.push({
      weekStart: startIso,
      label: formatShortDate(startIso),
      sessions: sessionsInWeek.length,
      volumeKg: round(
        sum(sessionsInWeek.map((s) => sessionVolume(index, s.id))),
        0,
      ),
      attended,
    });
  }

  return buckets;
}

/* ------------------------------------------------------------------ */
/* Session length                                                      */
/* ------------------------------------------------------------------ */

/**
 * How long a session ran, in minutes, from its first logged set to its last.
 *
 * Derived rather than stored: nobody remembers to stop a stopwatch, and a
 * forgotten one claims a six-hour workout. A single-set session has no span, so
 * it reports `null` instead of a misleading zero.
 */
export function sessionDurationMin(
  index: DbIndex,
  sessionId: Id,
): number | null {
  const sets = index.setsBySession.get(sessionId) ?? [];
  if (sets.length < 2) return null;

  let first = Number.POSITIVE_INFINITY;
  let last = 0;
  for (const entry of sets) {
    if (entry.createdAt < first) first = entry.createdAt;
    if (entry.createdAt > last) last = entry.createdAt;
  }
  if (!Number.isFinite(first) || last <= first) return null;

  const minutes = Math.round((last - first) / 60_000);
  // A span over four hours means the day was edited later, not trained longer.
  if (minutes <= 0 || minutes > 240) return null;
  return minutes;
}

/* ------------------------------------------------------------------ */
/* Weekly set volume against the landmarks                             */
/* ------------------------------------------------------------------ */

function volumeAdvice(
  status: VolumeStatus,
  sets: number,
  landmarks: { mev: number; mav: number; mrv: number },
): string {
  switch (status) {
    case "none":
      return "ما دربتها هذا الأسبوع";
    case "under":
      return `زِد ${landmarks.mev - sets} مجموعة للوصول للحد الأدنى`;
    case "optimal":
      return "داخل النطاق المنتج";
    case "peak":
      return "قريب من السقف — ثبّت ولا تزيد";
    case "over":
      return `فوق السقف بـ ${sets - landmarks.mrv} مجموعة — قلّل أو خذ أسبوع تخفيف`;
  }
}

/**
 * Working sets per muscle group over the trailing `days`, measured against the
 * published weekly landmarks in `MUSCLE_LANDMARKS`.
 *
 * Sets, not tonnage, on purpose: the dose-response research for hypertrophy is
 * expressed in sets per muscle per week, and tonnage is not comparable across
 * muscles anyway — a set of leg press moves four times the weight of a set of
 * lateral raises without being four times the stimulus.
 */
export function weeklySetsByMuscle(
  db: Database,
  index: DbIndex,
  days = 7,
): MuscleVolumeRow[] {
  const cutoff = toIsoDate(addDays(new Date(), -Math.max(1, days) + 1));

  const setsByGroup = new Map<MuscleGroup, number>();
  for (const entry of db.setEntries) {
    if (!isWorkingSet(entry)) continue;
    const date = index.sessionById.get(entry.sessionId)?.date;
    if (!date || date < cutoff) continue;
    const group = index.exerciseGroupById.get(entry.exerciseId);
    if (!group) continue;
    setsByGroup.set(group, (setsByGroup.get(group) ?? 0) + 1);
  }

  return MUSCLE_GROUPS.map((group) => {
    const sets = setsByGroup.get(group) ?? 0;
    const landmarks = MUSCLE_LANDMARKS[group];

    const status: VolumeStatus =
      sets === 0
        ? "none"
        : sets < landmarks.mev
          ? "under"
          : sets <= landmarks.mav
            ? "optimal"
            : sets <= landmarks.mrv
              ? "peak"
              : "over";

    return {
      group,
      label: MUSCLE_GROUP_LABELS[group],
      sets,
      mev: landmarks.mev,
      mav: landmarks.mav,
      mrv: landmarks.mrv,
      status,
      advice: volumeAdvice(status, sets, landmarks),
    };
  }).sort((a, b) => b.sets - a.sets);
}

/* ------------------------------------------------------------------ */
/* Progressive overload                                                */
/* ------------------------------------------------------------------ */

/** The rep window and load step in force for one exercise. */
export function progressionRules(
  db: Database,
  exercise: Exercise,
): { repMin: number; repMax: number; incrementKg: number; restSeconds: number } {
  const repMin = exercise.repMin ?? db.settings.repMin;
  const repMax = Math.max(repMin, exercise.repMax ?? db.settings.repMax);
  return {
    repMin,
    repMax,
    incrementKg: exercise.incrementKg ?? db.settings.incrementKg,
    restSeconds: exercise.restSeconds ?? db.settings.restSeconds,
  };
}

/**
 * Double progression: hold the load until every working set reaches the top of
 * the rep range, then add one increment and drop back to the bottom.
 *
 * It reads the last *completed* session rather than today's, so the target is a
 * fixed thing to chase for the whole session instead of a number that moves
 * every time a set is saved. The binding set is the *weakest* one at the top
 * load — progressing off the best single set is how people end up adding weight
 * they can only lift once.
 */
export function overloadTarget(
  db: Database,
  index: DbIndex,
  exerciseId: Id,
  excludeSessionId: Id | null,
): OverloadTarget | null {
  const exercise = db.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return null;

  const { repMin, repMax, incrementKg } = progressionRules(db, exercise);
  const previous = previousSessionSets(index, exerciseId, excludeSessionId);
  const working = (previous?.sets ?? []).filter(isWorkingSet);

  if (!previous || working.length === 0) {
    return {
      exerciseId,
      weightKg: 0,
      reps: repMin,
      reason: "first",
      basedOn: null,
      repMin,
      repMax,
      incrementKg,
    };
  }

  const topWeight = working.reduce(
    (best, entry) => Math.max(best, entry.weightKg),
    0,
  );
  const atTopWeight = working.filter((entry) => entry.weightKg === topWeight);
  const weakestReps = atTopWeight.reduce(
    (least, entry) => Math.min(least, entry.reps),
    Number.POSITIVE_INFINITY,
  );

  if (!Number.isFinite(weakestReps)) {
    return {
      exerciseId,
      weightKg: topWeight,
      reps: repMin,
      reason: "repeat",
      basedOn: previous.date,
      repMin,
      repMax,
      incrementKg,
    };
  }

  if (weakestReps >= repMax) {
    return {
      exerciseId,
      weightKg: round(topWeight + incrementKg, 2),
      reps: repMin,
      reason: "increase-weight",
      basedOn: previous.date,
      repMin,
      repMax,
      incrementKg,
    };
  }

  if (weakestReps < repMin) {
    return {
      exerciseId,
      weightKg: topWeight,
      reps: repMin,
      reason: "hold",
      basedOn: previous.date,
      repMin,
      repMax,
      incrementKg,
    };
  }

  return {
    exerciseId,
    weightKg: topWeight,
    reps: Math.min(repMax, weakestReps + 1),
    reason: "add-reps",
    basedOn: previous.date,
    repMin,
    repMax,
    incrementKg,
  };
}

/**
 * A warm-up ramp to the day's working load: roughly 50% and 75% of it, snapped
 * to the machine's own increment so the numbers are pin positions that actually
 * exist. Below 20kg there is nothing to ramp and the list comes back empty.
 */
export function warmupRamp(
  workingWeightKg: number,
  incrementKg: number,
): { weightKg: number; reps: number }[] {
  if (!Number.isFinite(workingWeightKg) || workingWeightKg < 20) return [];
  const step = incrementKg > 0 ? incrementKg : 2.5;
  const snap = (value: number) =>
    round(Math.max(step, Math.round(value / step) * step), 2);

  const first = snap(workingWeightKg * 0.5);
  const second = snap(workingWeightKg * 0.75);
  if (second <= first) return [{ weightKg: first, reps: 10 }];
  return [
    { weightKg: first, reps: 10 },
    { weightKg: second, reps: 6 },
  ];
}

/* ------------------------------------------------------------------ */
/* Stalls                                                              */
/* ------------------------------------------------------------------ */

/**
 * Lifts whose estimated 1RM has not improved for `minSessions` sessions.
 *
 * This is the one signal a progress tracker owes its user that a list of numbers
 * will not give him: three sessions with no movement is not bad luck, it is a
 * program that needs a change — more volume, a deload, or a different machine.
 */
export function stalledLifts(
  db: Database,
  index: DbIndex,
  minSessions = 3,
): StallRow[] {
  const today = toIsoDate();
  const rows: StallRow[] = [];

  for (const exercise of db.exercises) {
    if (exercise.archived) continue;
    const points = exerciseProgress(index, exercise.id);
    if (points.length < minSessions + 1) continue;

    let bestIndex = 0;
    let best = 0;
    points.forEach((point, position) => {
      if (point.estimated1rm > best) {
        best = point.estimated1rm;
        bestIndex = position;
      }
    });

    const stalled = points.length - 1 - bestIndex;
    if (stalled < minSessions) continue;

    const bestPoint = points[bestIndex];
    const latest = points[points.length - 1];
    if (!bestPoint || !latest) continue;

    rows.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sessionsStalled: stalled,
      daysSinceBest: daysBetween(bestPoint.date, today),
      best1rm: bestPoint.estimated1rm,
      latest1rm: latest.estimated1rm,
      lastDate: latest.date,
    });
  }

  return rows.sort((a, b) => b.sessionsStalled - a.sessionsStalled);
}

/* ------------------------------------------------------------------ */
/* Body check-ins                                                      */
/* ------------------------------------------------------------------ */

/**
 * One measurement over time, each reading paired with a trailing 7-day mean.
 *
 * Body weight swings a kilo either way on water and food alone, so the raw dots
 * are drawn but the *average* is the line that carries the trend — reading a
 * single weigh-in as progress is the most common way a cut gets abandoned in
 * week two.
 */
export function bodySeries(
  db: Database,
  field: BodyField,
  limit = 60,
): BodyPoint[] {
  const readings = Object.values(db.bodyMetrics)
    .map((entry) => ({ date: entry.date, value: entry[field] }))
    .filter((row): row is { date: IsoDate; value: number } => row.value !== null)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const points: BodyPoint[] = readings.map((row) => {
    const window = readings.filter(
      (other) =>
        other.date <= row.date && daysBetween(other.date, row.date) <= 6,
    );
    const average =
      window.length > 0
        ? sum(window.map((other) => other.value)) / window.length
        : row.value;
    return {
      date: row.date,
      label: formatShortDate(row.date),
      value: round(row.value, 1),
      average: round(average, 1),
    };
  });

  return points.slice(-Math.max(2, limit));
}

/** Change in a measurement over the trailing `days`, using the smoothed line. */
export function bodyChange(
  db: Database,
  field: BodyField,
  days = 30,
): { from: number; to: number; delta: number } | null {
  const points = bodySeries(db, field, 400);
  const latest = points[points.length - 1];
  if (!latest) return null;

  const cutoff = toIsoDate(addDays(new Date(), -Math.max(1, days)));
  const baseline =
    [...points].reverse().find((point) => point.date <= cutoff) ?? points[0];
  if (!baseline || baseline.date === latest.date) return null;

  return {
    from: baseline.average,
    to: latest.average,
    delta: round(latest.average - baseline.average, 1),
  };
}

/* ------------------------------------------------------------------ */
/* Health                                                             */
/* ------------------------------------------------------------------ */

/** Mean of a health field over the trailing `days`, ignoring unlogged days. */
export function healthAverage(
  db: Database,
  field: HealthField,
  days = 14,
): { average: number; logged: number } | null {
  const cutoff = toIsoDate(addDays(new Date(), -Math.max(1, days)));
  const values: number[] = [];
  for (const entry of Object.values(db.health)) {
    if (entry.date < cutoff) continue;
    const value = entry[field];
    if (value !== null) values.push(value);
  }
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    average: round(sum / values.length, field === "sleepHours" ? 1 : 0),
    logged: values.length,
  };
}

/**
 * Waist-to-height — the one body number here with a published threshold.
 *
 * Keep the waist under half your height. It beats BMI for metabolic risk
 * because it reads where the fat actually sits, and unlike a scale weight it
 * cannot be flattered by carrying more muscle.
 */
export function waistToHeight(
  db: Database,
  heightCm: number | null,
): { ratio: number; band: "good" | "watch" | "high" } | null {
  if (heightCm === null || heightCm <= 0) return null;
  const waist = bodySeries(db, "waistCm", 400).at(-1);
  if (!waist) return null;
  const ratio = round(waist.average / heightCm, 3);
  const band = ratio < 0.5 ? "good" : ratio < 0.6 ? "watch" : "high";
  return { ratio, band };
}

/**
 * Does sleeping more actually change how he trains?
 *
 * Splits every session that has a sleep reading for its own date into two
 * groups, above and below the sleep target, and compares mean session volume.
 * Deliberately a plain two-group mean and not a correlation coefficient: an r
 * value is not a sentence anyone acts on, whereas "your volume is 14% higher
 * after 7+ hours" is.
 *
 * `null` until BOTH groups hold at least four sessions. Three good nights and
 * one bad one is noise, and a number this personal has to earn its confidence
 * before it starts telling someone to change their bedtime.
 */
export function sleepVsVolume(
  db: Database,
  index: DbIndex,
  targetHours: number,
): {
  restedVolume: number;
  tiredVolume: number;
  restedCount: number;
  tiredCount: number;
  deltaPct: number;
} | null {
  const rested: number[] = [];
  const tired: number[] = [];

  for (const session of db.sessions) {
    const night = db.health[session.date];
    if (!night || night.sleepHours === null) continue;
    const volume = sessionVolume(index, session.id);
    if (volume <= 0) continue;
    (night.sleepHours >= targetHours ? rested : tired).push(volume);
  }

  const MIN_SESSIONS = 4;
  if (rested.length < MIN_SESSIONS || tired.length < MIN_SESSIONS) return null;

  const mean = (values: number[]) =>
    values.reduce((total, value) => total + value, 0) / values.length;
  const restedVolume = mean(rested);
  const tiredVolume = mean(tired);
  if (tiredVolume <= 0) return null;

  return {
    restedVolume: Math.round(restedVolume),
    tiredVolume: Math.round(tiredVolume),
    restedCount: rested.length,
    tiredCount: tired.length,
    deltaPct: Math.round(((restedVolume - tiredVolume) / tiredVolume) * 100),
  };
}

/** Protein band for a bodybuilding phase: 1.8–2.2 g per kg of bodyweight. */
export function proteinBand(
  bodyWeightKg: number | null,
): { min: number; max: number } | null {
  if (bodyWeightKg === null || bodyWeightKg <= 0) return null;
  return {
    min: Math.round(bodyWeightKg * 1.8),
    max: Math.round(bodyWeightKg * 2.2),
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard headline numbers                                          */
/* ------------------------------------------------------------------ */

export interface DashboardSummary {
  streak: number;
  longestStreak: number;
  /** Trained days inside the current Saturday-opening week. */
  weekAttended: number;
  weeklyGoal: number;
  weekVolumeKg: number;
  previousWeekVolumeKg: number;
  /** Signed percentage change in weekly volume. `null` with no prior week. */
  weekVolumeChange: number | null;
  totalSessions: number;
  totalSetsLogged: number;
  totalVolumeKg: number;
  prsLast30Days: number;
  /** 12-point weekly volume sparkline, oldest first. */
  volumeSparkline: number[];
  /** Tonnage and set count logged today, for the live session header. */
  todayVolumeKg: number;
  todaySets: number;
  /** Median session length over the last 10 sessions. `null` until there is one. */
  typicalSessionMin: number | null;
  /** Muscles below their MEV in the trailing week — the actionable gap. */
  underTrained: MuscleVolumeRow[];
  /** Lifts that have not moved in three sessions or more. */
  stalled: StallRow[];
  bodyWeightKg: number | null;
  /** Smoothed bodyweight change over 30 days. `null` without two weigh-ins. */
  weightChange30d: number | null;
}

export function dashboardSummary(
  db: Database,
  index: DbIndex,
): DashboardSummary {
  const trained = trainedDates(db, index);
  const weeks = weeklyBuckets(db, index, 12);
  const current = weeks[weeks.length - 1];
  const previous = weeks[weeks.length - 2];

  const thirtyDaysAgo = toIsoDate(addDays(new Date(), -30));
  const prs = personalRecords(db, index, 500).filter(
    (r) => r.date >= thirtyDaysAgo,
  );

  const workingSets = db.setEntries.filter(isWorkingSet);
  const previousVolume = previous?.volumeKg ?? 0;
  const currentVolume = current?.volumeKg ?? 0;

  const today = toIsoDate();
  const todaySession = index.sessionByDate.get(today);
  const todaysWorkingSets = todaySession
    ? (index.setsBySession.get(todaySession.id) ?? []).filter(isWorkingSet)
    : [];

  // Median, not mean: one session left open on a phone in a pocket would drag a
  // mean upwards forever, while the middle value ignores it.
  const durations = [...db.sessions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10)
    .map((session) => sessionDurationMin(index, session.id))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  const typicalSessionMin =
    durations.length === 0
      ? null
      : (durations[Math.floor((durations.length - 1) / 2)] ?? null);

  const weightChange = bodyChange(db, "weightKg", 30);

  return {
    streak: currentStreak(trained),
    longestStreak: longestStreak(trained),
    weekAttended: current?.attended ?? 0,
    weeklyGoal: db.settings.weeklyGoal,
    weekVolumeKg: currentVolume,
    previousWeekVolumeKg: previousVolume,
    weekVolumeChange:
      previousVolume > 0
        ? round(((currentVolume - previousVolume) / previousVolume) * 100, 0)
        : null,
    totalSessions: db.sessions.length,
    totalSetsLogged: workingSets.length,
    totalVolumeKg: round(sum(workingSets.map(setVolume)), 0),
    prsLast30Days: prs.length,
    volumeSparkline: weeks.map((w) => w.volumeKg),
    todayVolumeKg: round(sum(todaysWorkingSets.map(setVolume)), 0),
    todaySets: todaysWorkingSets.length,
    typicalSessionMin,
    underTrained: weeklySetsByMuscle(db, index, 7).filter(
      (row) => row.status === "under" || row.status === "none",
    ),
    stalled: stalledLifts(db, index, 3),
    bodyWeightKg: db.settings.bodyWeightKg,
    weightChange30d: weightChange?.delta ?? null,
  };
}

/** Exercises with at least two logged sessions — the only ones worth charting. */
export function chartableExerciseIds(db: Database, index: DbIndex): Id[] {
  return db.exercises
    .filter((exercise) => {
      const sets = (index.setsByExercise.get(exercise.id) ?? []).filter(
        isWorkingSet,
      );
      if (sets.length === 0) return false;
      const sessions = new Set(sets.map((s) => s.sessionId));
      return sessions.size >= 2;
    })
    .map((exercise) => exercise.id);
}
