/**
 * Mutations. Every function is pure: it takes a `Database` and returns a NEW
 * `Database`, never mutating the input. That is what makes the reducer in
 * `store.tsx` predictable and what lets React see a changed reference.
 *
 * Validation lives here too, and it returns a typed failure instead of throwing
 * — the UI needs to show the user a specific Arabic message, not a stack trace.
 */

import { MAX_REPS, MAX_WEIGHT_KG } from "./storage";
import type {
  Database,
  Exercise,
  Id,
  IsoDate,
  MuscleGroup,
  NutritionLog,
  Session,
  SetEntry,
  Settings,
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
  });
}

export const TODAY = () => toIsoDate();
