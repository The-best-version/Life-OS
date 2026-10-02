/**
 * Mutations. Every function is pure: it takes a `Database` and returns a NEW
 * `Database`, never mutating the input. That is what makes the reducer in
 * `store.tsx` predictable and what lets React see a changed reference.
 *
 * Validation lives here too, and it returns a typed failure instead of throwing
 * — the UI needs to show the user a specific Arabic message, not a stack trace.
 */

import {
  MAX_REPS,
  MAX_REST_SECONDS,
  MAX_WEIGHT_KG,
  MIN_REST_SECONDS,
} from "./storage";
import {
  BODY_FIELD_META,
  BODY_FIELDS,
  type BodyMetric,
  type Database,
  type Exercise,
  HEALTH_FIELD_META,
  HEALTH_FIELDS,
  type HealthLog,
  Id,
  IsoDate,
  type MuscleGroup,
  type NutritionLog,
  type Session,
  type SetEntry,
  type Settings,
} from "./types";
import { clamp, createId, isIsoDate, round, toIsoDate } from "./utils";

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

function fail<T>(error: string): Result<T> {
  return { ok: false, error };
}

function touch(db: Database): Database {
  return { ...db, updatedAt: Date.now() };
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export function findSessionByDate(
  db: Database,
  date: IsoDate,
): Session | undefined {
  return db.sessions.find((session) => session.date === date);
}

/**
 * Get the session for `date`, creating it if needed. Returns the (possibly
 * unchanged) database alongside the id, so callers never have to branch.
 */
export function ensureSession(
  db: Database,
  date: IsoDate,
  programDayId: Id | null,
): { db: Database; sessionId: Id } {
  const existing = findSessionByDate(db, date);
  if (existing) {
    // Adopt the day template if the session was created ad hoc.
    if (existing.programDayId === null && programDayId !== null) {
      return {
        db: touch({
          ...db,
          sessions: db.sessions.map((s) =>
            s.id === existing.id
              ? { ...s, programDayId, updatedAt: Date.now() }
              : s,
          ),
        }),
        sessionId: existing.id,
      };
    }
    return { db, sessionId: existing.id };
  }

  const now = Date.now();
  const session: Session = {
    id: createId("ses"),
    date,
    programDayId,
    note: "",
    createdAt: now,
    updatedAt: now,
    readiness: null,
  };

  return {
    db: touch({
      ...db,
      sessions: [...db.sessions, session].sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
      ),
    }),
    sessionId: session.id,
  };
}

export function setSessionNote(
  db: Database,
  date: IsoDate,
  note: string,
): Database {
  const trimmed = note.slice(0, 500);
  const existing = findSessionByDate(db, date);
  if (!existing) {
    if (trimmed.trim() === "") return db;
    const { db: withSession, sessionId } = ensureSession(db, date, null);
    return touch({
      ...withSession,
      sessions: withSession.sessions.map((s) =>
        s.id === sessionId ? { ...s, note: trimmed } : s,
      ),
    });
  }
  return touch({
    ...db,
    sessions: db.sessions.map((s) =>
      s.id === existing.id
        ? { ...s, note: trimmed, updatedAt: Date.now() }
        : s,
    ),
  });
}

/** Drop sessions that hold no sets and no note — they are noise in the history. */
function pruneEmptySessions(db: Database): Database {
  const withSets = new Set(db.setEntries.map((entry) => entry.sessionId));
  const kept = db.sessions.filter(
    (session) =>
      withSets.has(session.id) ||
      session.note.trim() !== "" ||
      db.attendance[session.date] === true,
  );
  if (kept.length === db.sessions.length) return db;
  return { ...db, sessions: kept };
}

/* ------------------------------------------------------------------ */
/* Sets                                                               */
/* ------------------------------------------------------------------ */

export interface LogSetInput {
  date: IsoDate;
  programDayId: Id | null;
  exerciseId: Id;
  weightKg: number;
  reps: number;
  rpe?: number | null;
  isWarmup?: boolean;
}

/**
 * Append one set. This is the single write path for training data — the logger,
 * quick-add, and any future import all funnel through it, so the invariants
 * (valid date, known exercise, sane load, contiguous `setIndex`) hold in one place.
 */
export function logSet(
  db: Database,
  input: LogSetInput,
): Result<{ db: Database; entry: SetEntry }> {
  if (!isIsoDate(input.date)) return fail("التاريخ غير صحيح");

  const exercise = db.exercises.find((e) => e.id === input.exerciseId);
  if (!exercise) return fail("التمرين غير موجود");

  if (!Number.isFinite(input.weightKg) || input.weightKg < 0) {
    return fail("اكتب وزناً صحيحاً (صفر أو أكثر)");
  }
  if (input.weightKg > MAX_WEIGHT_KG) {
    return fail(`أقصى وزن مسموح ${MAX_WEIGHT_KG} كجم`);
  }
  if (!Number.isFinite(input.reps) || input.reps < 1) {
    return fail("عدد التكرارات لازم يكون 1 على الأقل");
  }
  if (input.reps > MAX_REPS) {
    return fail(`أقصى عدد تكرارات ${MAX_REPS}`);
  }

  const { db: withSession, sessionId } = ensureSession(
    db,
    input.date,
    input.programDayId,
  );

  const existingCount = withSession.setEntries.filter(
    (entry) =>
      entry.sessionId === sessionId && entry.exerciseId === input.exerciseId,
  ).length;

  const rpe =
    input.rpe === undefined || input.rpe === null
      ? null
      : round(clamp(input.rpe, 1, 10), 1);

  const entry: SetEntry = {
    id: createId("set"),
    sessionId,
    exerciseId: input.exerciseId,
    setIndex: existingCount + 1,
    weightKg: round(input.weightKg, 2),
    reps: Math.round(input.reps),
    rpe,
    isWarmup: input.isWarmup === true,
    createdAt: Date.now(),
  };

  return ok({
    db: touch({ ...withSession, setEntries: [...withSession.setEntries, entry] }),
    entry,
  });
}

export function updateSet(
  db: Database,
  setId: Id,
  patch: Partial<Pick<SetEntry, "weightKg" | "reps" | "rpe" | "isWarmup">>,
): Result<Database> {
  const existing = db.setEntries.find((entry) => entry.id === setId);
  if (!existing) return fail("المجموعة غير موجودة");

  const weightKg =
    patch.weightKg === undefined ? existing.weightKg : patch.weightKg;
  const reps = patch.reps === undefined ? existing.reps : patch.reps;

  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > MAX_WEIGHT_KG) {
    return fail("الوزن غير صحيح");
  }
  if (!Number.isFinite(reps) || reps < 1 || reps > MAX_REPS) {
    return fail("عدد التكرارات غير صحيح");
  }

  return ok(
    touch({
      ...db,
      setEntries: db.setEntries.map((entry) =>
        entry.id === setId
          ? {
              ...entry,
              weightKg: round(weightKg, 2),
              reps: Math.round(reps),
              rpe:
                patch.rpe === undefined
                  ? entry.rpe
                  : patch.rpe === null
                    ? null
                    : round(clamp(patch.rpe, 1, 10), 1),
              isWarmup:
                patch.isWarmup === undefined ? entry.isWarmup : patch.isWarmup,
            }
          : entry,
      ),
    }),
  );
}

/** Remove a set and re-number the remaining sets of that exercise in-session. */
export function deleteSet(db: Database, setId: Id): Database {
  const target = db.setEntries.find((entry) => entry.id === setId);
  if (!target) return db;

  const remaining = db.setEntries.filter((entry) => entry.id !== setId);

  let index = 0;
  const renumbered = remaining.map((entry) => {
    if (
      entry.sessionId === target.sessionId &&
      entry.exerciseId === target.exerciseId
    ) {
      index += 1;
      return { ...entry, setIndex: index };
    }
    return entry;
  });

  return touch(pruneEmptySessions({ ...db, setEntries: renumbered }));
}

/* ------------------------------------------------------------------ */
/* Exercises & program days                                            */
/* ------------------------------------------------------------------ */

export interface AddExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
  /** When given, the new exercise is appended to that day's template. */
  dayId?: Id | null;
}

export function addExercise(
  db: Database,
  input: AddExerciseInput,
): Result<{ db: Database; exercise: Exercise }> {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length === 0) return fail("اكتب اسم التمرين");
  if (name.length > 120) return fail("اسم التمرين طويل جداً");

  const duplicate = db.exercises.find(
    (exercise) => exercise.name.toLowerCase() === name.toLowerCase(),
  );

  // Re-use an existing exercise instead of creating a twin, so history survives.
  const exercise: Exercise =
    duplicate ??
    {
      id: createId("ex"),
      name,
      muscleGroup: input.muscleGroup,
      equipment: (input.equipment ?? "other").slice(0, 40),
      createdAt: Date.now(),
      archived: false,
      setup: "",
      repMin: null,
      repMax: null,
      incrementKg: null,
      restSeconds: null,
    };

  let next: Database = duplicate
    ? { ...db, exercises: db.exercises.map((e) => (e.id === duplicate.id ? { ...e, archived: false } : e)) }
    : { ...db, exercises: [...db.exercises, exercise] };

  if (input.dayId) {
    next = addExerciseToDay(next, input.dayId, exercise.id);
  }

  return ok({ db: touch(next), exercise });
}

export function addExerciseToDay(
  db: Database,
  dayId: Id,
  exerciseId: Id,
): Database {
  return touch({
    ...db,
    programDays: db.programDays.map((day) =>
      day.id === dayId && !day.exerciseIds.includes(exerciseId)
        ? { ...day, exerciseIds: [...day.exerciseIds, exerciseId] }
        : day,
    ),
  });
}

/**
 * Take an exercise out of a day's template. Logged sets are deliberately kept —
 * history is a record of what happened, not of the current plan.
 */
export function removeExerciseFromDay(
  db: Database,
  dayId: Id,
  exerciseId: Id,
): Database {
  return touch({
    ...db,
    programDays: db.programDays.map((day) =>
      day.id === dayId
        ? {
            ...day,
            exerciseIds: day.exerciseIds.filter((id) => id !== exerciseId),
          }
        : day,
    ),
  });
}

export function reorderDayExercises(
  db: Database,
  dayId: Id,
  exerciseId: Id,
  direction: -1 | 1,
): Database {
  const day = db.programDays.find((d) => d.id === dayId);
  if (!day) return db;

  const from = day.exerciseIds.indexOf(exerciseId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= day.exerciseIds.length) return db;

  const next = [...day.exerciseIds];
  const moved = next[from];
  const displaced = next[to];
  if (moved === undefined || displaced === undefined) return db;
  next[from] = displaced;
  next[to] = moved;

  return touch({
    ...db,
    programDays: db.programDays.map((d) =>
      d.id === dayId ? { ...d, exerciseIds: next } : d,
    ),
  });
}

/* ------------------------------------------------------------------ */
/* Attendance & nutrition                                              */
/* ------------------------------------------------------------------ */

export function toggleAttendance(db: Database, date: IsoDate): Database {
  if (!isIsoDate(date)) return db;
  const next = { ...db.attendance };
  if (next[date]) delete next[date];
  else next[date] = true;
  return touch({ ...db, attendance: next });
}

export function setNutrition(
  db: Database,
  date: IsoDate,
  patch: Partial<Omit<NutritionLog, "date">>,
): Database {
  if (!isIsoDate(date)) return db;

  const current: NutritionLog =
    db.nutrition[date] ?? { date, kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const entry: NutritionLog = {
    date,
    kcal: clamp(Math.round(patch.kcal ?? current.kcal), 0, 20_000),
    protein: clamp(Math.round(patch.protein ?? current.protein), 0, 1_000),
    carbs: clamp(Math.round(patch.carbs ?? current.carbs), 0, 2_000),
    fat: clamp(Math.round(patch.fat ?? current.fat), 0, 1_000),
  };

  const nutrition = { ...db.nutrition };
  if (entry.kcal === 0 && entry.protein === 0 && entry.carbs === 0 && entry.fat === 0) {
    delete nutrition[date];
  } else {
    nutrition[date] = entry;
  }

  return touch({ ...db, nutrition });
}

/* ------------------------------------------------------------------ */
/* Exercise configuration                                              */
/* ------------------------------------------------------------------ */

export type ExercisePatch = Partial<
  Pick<Exercise, "setup" | "repMin" | "repMax" | "incrementKg" | "restSeconds">
>;

/**
 * Edit how one machine is configured and progressed.
 *
 * Every field here is nullable and `null` is meaningful: it means "follow the
 * global setting", which is a different fact from a number that happens to equal
 * the global setting today. So `undefined` (absent from the patch) leaves a
 * field alone, while an explicit `null` clears it back to the default.
 */
export function updateExercise(
  db: Database,
  exerciseId: Id,
  patch: ExercisePatch,
): Result<Database> {
  const existing = db.exercises.find((item) => item.id === exerciseId);
  if (!existing) return fail("التمرين غير موجود");

  const repMin = patch.repMin === undefined ? existing.repMin : patch.repMin;
  const repMax = patch.repMax === undefined ? existing.repMax : patch.repMax;

  if (repMin !== null && repMax !== null && repMin > repMax) {
    return fail("أقل عدد تكرارات لازم يكون أصغر من الأكثر");
  }

  const next: Exercise = {
    ...existing,
    setup:
      patch.setup === undefined ? existing.setup : patch.setup.slice(0, 240),
    repMin: repMin === null ? null : Math.round(clamp(repMin, 1, MAX_REPS)),
    repMax: repMax === null ? null : Math.round(clamp(repMax, 1, MAX_REPS)),
    incrementKg:
      patch.incrementKg === undefined
        ? existing.incrementKg
        : patch.incrementKg === null
          ? null
          : round(clamp(patch.incrementKg, 0.5, 50), 2),
    restSeconds:
      patch.restSeconds === undefined
        ? existing.restSeconds
        : patch.restSeconds === null
          ? null
          : Math.round(
              clamp(patch.restSeconds, MIN_REST_SECONDS, MAX_REST_SECONDS),
            ),
  };

  return ok(
    touch({
      ...db,
      exercises: db.exercises.map((item) =>
        item.id === exerciseId ? next : item,
      ),
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Readiness & body check-ins                                          */
/* ------------------------------------------------------------------ */

/** Self-rated readiness, 1–5. Pass `null` to clear it. */
export function setSessionReadiness(
  db: Database,
  date: IsoDate,
  readiness: number | null,
): Database {
  if (!isIsoDate(date)) return db;
  const value = readiness === null ? null : Math.round(clamp(readiness, 1, 5));

  const existing = findSessionByDate(db, date);
  // Rating a day before training it is the normal case — you rate on the way in
  // — so the session row is created for the rating rather than refused.
  if (!existing) {
    if (value === null) return db;
    const { db: withSession, sessionId } = ensureSession(db, date, null);
    return touch({
      ...withSession,
      sessions: withSession.sessions.map((item) =>
        item.id === sessionId ? { ...item, readiness: value } : item,
      ),
    });
  }

  return touch({
    ...db,
    sessions: db.sessions.map((item) =>
      item.id === existing.id
        ? { ...item, readiness: value, updatedAt: Date.now() }
        : item,
    ),
  });
}

export type BodyPatch = Partial<Omit<BodyMetric, "date">>;

/**
 * Write one body check-in. Each measurement is clamped to its own plausible
 * range from `BODY_FIELD_META`, and a row whose every field ends up empty is
 * deleted rather than left behind as a blank date in the chart.
 */
export function setBodyMetric(
  db: Database,
  date: IsoDate,
  patch: BodyPatch,
): Database {
  if (!isIsoDate(date)) return db;

  const current: BodyMetric = db.bodyMetrics[date] ?? {
    date,
    weightKg: null,
    waistCm: null,
    chestCm: null,
    armCm: null,
    thighCm: null,
    shoulderCm: null,
    note: "",
  };

  const entry: BodyMetric = { ...current, date };

  for (const field of BODY_FIELDS) {
    const incoming = patch[field];
    if (incoming === undefined) continue;
    if (incoming === null) {
      entry[field] = null;
      continue;
    }
    const meta = BODY_FIELD_META[field];
    entry[field] = round(clamp(incoming, meta.min, meta.max), 1);
  }

  if (patch.note !== undefined) entry.note = patch.note.slice(0, 240);

  const empty =
    BODY_FIELDS.every((field) => entry[field] === null) &&
    entry.note.trim() === "";

  const bodyMetrics = { ...db.bodyMetrics };
  if (empty) delete bodyMetrics[date];
  else bodyMetrics[date] = entry;

  /* The scale reading is also the body weight the rest of the app quotes, so the
     newest weigh-in keeps `settings.bodyWeightKg` in step — otherwise the
     protein guidance would be computed against a number from three months ago. */
  const latestWeight = latestBodyWeight(bodyMetrics);

  return touch({
    ...db,
    bodyMetrics,
    settings:
      latestWeight === null
        ? db.settings
        : { ...db.settings, bodyWeightKg: latestWeight },
  });
}

export type HealthPatch = Partial<Omit<HealthLog, "date">>;

/**
 * Write one day's health markers.
 *
 * Deliberately the same shape as `setBodyMetric`: every field clamped to its own
 * plausible range, and a row that ends up entirely empty deleted rather than
 * left behind as a blank date that every average would then have to skip.
 */
export function setHealth(
  db: Database,
  date: IsoDate,
  patch: HealthPatch,
): Database {
  if (!isIsoDate(date)) return db;

  const current: HealthLog = db.health[date] ?? {
    date,
    sleepHours: null,
    bedtime: null,
    steps: null,
    waterMl: null,
    restingHr: null,
    note: "",
  };

  const entry: HealthLog = { ...current, date };

  for (const field of HEALTH_FIELDS) {
    const incoming = patch[field];
    if (incoming === undefined) continue;
    if (incoming === null) {
      entry[field] = null;
      continue;
    }
    const meta = HEALTH_FIELD_META[field];
    /* Sleep is the only one of the four that is meaningful in halves; steps,
       millilitres and a pulse are whole numbers, and a "7,431.5 steps" would be
       a tell that the field was never thought about. */
    const digits = field === "sleepHours" ? 1 : 0;
    entry[field] = round(clamp(incoming, meta.min, meta.max), digits);
  }

  if (patch.bedtime !== undefined) {
    entry.bedtime =
      patch.bedtime && /^([01]\d|2[0-3]):[0-5]\d$/.test(patch.bedtime)
        ? patch.bedtime
        : null;
  }

  if (patch.note !== undefined) entry.note = patch.note.slice(0, 240);

  const empty =
    HEALTH_FIELDS.every((field) => entry[field] === null) &&
    entry.bedtime === null &&
    entry.note.trim() === "";

  const health = { ...db.health };
  if (empty) delete health[date];
  else health[date] = entry;

  return touch({ ...db, health });
}

function latestBodyWeight(metrics: Record<IsoDate, BodyMetric>): number | null {
  let bestDate: IsoDate | null = null;
  let bestWeight: number | null = null;
  for (const entry of Object.values(metrics)) {
    if (entry.weightKg === null) continue;
    if (bestDate === null || entry.date > bestDate) {
      bestDate = entry.date;
      bestWeight = entry.weightKg;
    }
  }
  return bestWeight;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function updateSettings(
  db: Database,
  patch: Partial<Settings>,
): Database {
  return touch({
    ...db,
    settings: {
      ...db.settings,
      ...patch,
      targets: { ...db.settings.targets, ...(patch.targets ?? {}) },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Bulk                                                               */
/* ------------------------------------------------------------------ */

/** Wipe all logged history but keep the program template and settings. */
export function clearHistory(db: Database): Database {
  return touch({
    ...db,
    sessions: [],
    setEntries: [],
    attendance: {},
    nutrition: {},
    bodyMetrics: {},
    health: {},
  });
}

export const TODAY = () => toIsoDate();
