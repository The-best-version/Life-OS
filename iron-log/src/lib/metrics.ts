/**
 * Derived data — every number the dashboard shows is computed here, never in a
 * component. Pure functions over a `Database`, so they are trivially testable
 * and cheap to memoise.
 */

import {
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS,
  type Database,
  type ExerciseProgressPoint,
  type Id,
  type IsoDate,
  type MuscleGroup,
  type MuscleGroupVolume,
  type PersonalRecord,
  type Session,
  type SetEntry,
  type VolumePoint,
  type WeeklyBucket,
} from "./types";
import {
  addDays,
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
