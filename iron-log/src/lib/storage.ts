/**
 * Persistence driver.
 *
 * The only module in the app that knows *where* data lives. It guarantees three
 * things to everything above it:
 *
 *  1. `loadDatabase()` ALWAYS returns a structurally valid `Database`. Corrupt,
 *     partial, hand-edited or older payloads are repaired, never thrown on.
 *  2. `saveDatabase()` never throws. It reports success so the UI can tell the
 *     user "saved" vs "could not save" honestly (private mode, blocked storage,
 *     quota exceeded).
 *  3. Nothing here touches `window` at module scope, so it is import-safe during
 *     server rendering.
 *
 * To move to SQLite later, reimplement `loadDatabase` / `saveDatabase` against
 * `db/schema.sql` — the normalisation below already enforces that schema's
 * constraints, so no caller changes.
 */

import { createSeedDatabase, DB_VERSION, DEFAULT_SETTINGS } from "./seed";
import {
  MUSCLE_GROUPS,
  type BodyMetric,
  type Database,
  type Exercise,
  type IsoDate,
  type MuscleGroup,
  type NutritionLog,
  type ProgramDay,
  type HealthLog,
  type Session,
  type SetEntry,
  type Settings,
  type WeightUnit,
} from "./types";
import { clamp, createId, isIsoDate, round, toFiniteNumber } from "./utils";

export const STORAGE_KEY = "ironlog.db.v1";

export type StorageStatus = "ready" | "unavailable";

export interface LoadResult {
  db: Database;
  status: StorageStatus;
  /** True when nothing was stored yet and a seed database was produced. */
  seeded: boolean;
  /** Human-readable note when the payload had to be repaired. */
  repaired: boolean;
}

/* ------------------------------------------------------------------ */
/* Low-level, exception-proof localStorage access                      */
/* ------------------------------------------------------------------ */

function getStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const probeKey = "__ironlog_probe__";
    window.localStorage.setItem(probeKey, "1");
    const ok = window.localStorage.getItem(probeKey) === "1";
    window.localStorage.removeItem(probeKey);
    return ok ? window.localStorage : null;
  } catch {
    // Private mode, disabled site data, or a sandboxed iframe.
    return null;
  }
}

export function isStorageAvailable(): boolean {
  return getStore() !== null;
}

/* ------------------------------------------------------------------ */
/* Normalisation — the schema guard                                    */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asTrimmedName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0 || trimmed.length > 120) return null;
  return trimmed;
}

function asPositiveInt(value: unknown, fallback: number): number {
  const n = toFiniteNumber(value);
  if (n === null) return fallback;
  return Math.max(0, Math.round(n));
}

function asTimestamp(value: unknown, fallback: number): number {
  const n = toFiniteNumber(value);
  if (n === null || n <= 0) return fallback;
  return Math.round(n);
}

function asMuscleGroup(value: unknown): MuscleGroup {
  return typeof value === "string" &&
    (MUSCLE_GROUPS as readonly string[]).includes(value)
    ? (value as MuscleGroup)
    : "chest";
}

/** Weight is allowed to be 0 (bodyweight work) but never negative or absurd. */
export const MAX_WEIGHT_KG = 750;
export const MAX_REPS = 200;
export const MIN_REST_SECONDS = 15;
export const MAX_REST_SECONDS = 600;

/**
 * A measurement that is allowed to be absent.
 *
 * Returns `null` rather than a default, because every caller here stores a body
 * measurement or a per-machine override: a missing tape reading must stay
 * missing, and a zero substituted for it would drag an average down as if the
 * user had shrunk.
 */
function asNullableNumber(
  value: unknown,
  min: number,
  max: number,
  digits = 1,
): number | null {
  const n = toFiniteNumber(value);
  if (n === null) return null;
  return round(clamp(n, min, max), digits);
}

function normalizeExercise(raw: unknown, now: number): Exercise | null {
  if (!isRecord(raw)) return null;
  const name = asTrimmedName(raw.name);
  if (!name) return null;
  return {
    id: asString(raw.id) || createId("ex"),
    name,
    muscleGroup: asMuscleGroup(raw.muscleGroup),
    equipment: asString(raw.equipment, "other").slice(0, 40),
    createdAt: asTimestamp(raw.createdAt, now),
    archived: raw.archived === true,
    setup: asString(raw.setup).slice(0, 240),
    repMin: asNullableNumber(raw.repMin, 1, MAX_REPS, 0),
    repMax: asNullableNumber(raw.repMax, 1, MAX_REPS, 0),
    incrementKg: asNullableNumber(raw.incrementKg, 0.5, 50, 2),
    restSeconds: asNullableNumber(
      raw.restSeconds,
      MIN_REST_SECONDS,
      MAX_REST_SECONDS,
      0,
    ),
  };
}

function normalizeProgramDay(
  raw: unknown,
  index: number,
  validExerciseIds: Set<string>,
): ProgramDay | null {
  if (!isRecord(raw)) return null;
  const name = asTrimmedName(raw.name);
  if (!name) return null;
  const exerciseIds = asArray(raw.exerciseIds)
    .filter((id): id is string => typeof id === "string")
    .filter((id) => validExerciseIds.has(id));
  return {
    id: asString(raw.id) || createId("day"),
    slug: asString(raw.slug) || `day-${index + 1}`,
    name,
    focus: asString(raw.focus).slice(0, 120),
    order: asPositiveInt(raw.order, index),
    // De-duplicate: the same exercise twice in one day breaks set indexing.
    exerciseIds: Array.from(new Set(exerciseIds)),
  };
}

function normalizeSession(
  raw: unknown,
  now: number,
  validDayIds: Set<string>,
): Session | null {
  if (!isRecord(raw)) return null;
  if (!isIsoDate(raw.date)) return null;
  const programDayId = asString(raw.programDayId);
  const createdAt = asTimestamp(raw.createdAt, now);
  return {
    id: asString(raw.id) || createId("ses"),
    date: raw.date,
    programDayId: validDayIds.has(programDayId) ? programDayId : null,
    note: asString(raw.note).slice(0, 500),
    createdAt,
    updatedAt: asTimestamp(raw.updatedAt, createdAt),
    readiness: asNullableNumber(raw.readiness, 1, 5, 0),
  };
}

function normalizeSetEntry(
  raw: unknown,
  now: number,
  validSessionIds: Set<string>,
  validExerciseIds: Set<string>,
): SetEntry | null {
  if (!isRecord(raw)) return null;

  const sessionId = asString(raw.sessionId);
  const exerciseId = asString(raw.exerciseId);
  if (!validSessionIds.has(sessionId)) return null;
  if (!validExerciseIds.has(exerciseId)) return null;

  const weight = toFiniteNumber(raw.weightKg);
  const reps = toFiniteNumber(raw.reps);
  if (weight === null || reps === null) return null;
  if (weight < 0 || reps <= 0) return null;

  const rpeRaw = toFiniteNumber(raw.rpe);

  return {
    id: asString(raw.id) || createId("set"),
    sessionId,
    exerciseId,
    setIndex: Math.max(1, asPositiveInt(raw.setIndex, 1)),
    weightKg: round(clamp(weight, 0, MAX_WEIGHT_KG), 2),
    reps: Math.round(clamp(reps, 1, MAX_REPS)),
    rpe: rpeRaw === null ? null : round(clamp(rpeRaw, 1, 10), 1),
    isWarmup: raw.isWarmup === true,
    createdAt: asTimestamp(raw.createdAt, now),
  };
}

function normalizeAttendance(raw: unknown): Record<IsoDate, boolean> {
  const out: Record<IsoDate, boolean> = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (isIsoDate(key) && value === true) out[key] = true;
  }
  return out;
}

function normalizeNutrition(raw: unknown): Record<IsoDate, NutritionLog> {
  const out: Record<IsoDate, NutritionLog> = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!isIsoDate(key) || !isRecord(value)) continue;
    out[key] = {
      date: key,
      kcal: clamp(asPositiveInt(value.kcal, 0), 0, 20_000),
      protein: clamp(asPositiveInt(value.protein, 0), 0, 1_000),
      carbs: clamp(asPositiveInt(value.carbs, 0), 0, 2_000),
      fat: clamp(asPositiveInt(value.fat, 0), 0, 1_000),
    };
  }
  return out;
}

function normalizeBodyMetrics(raw: unknown): Record<IsoDate, BodyMetric> {
  const out: Record<IsoDate, BodyMetric> = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!isIsoDate(key) || !isRecord(value)) continue;
    const entry: BodyMetric = {
      date: key,
      weightKg: asNullableNumber(value.weightKg, 20, 400),
      waistCm: asNullableNumber(value.waistCm, 40, 200),
      chestCm: asNullableNumber(value.chestCm, 50, 200),
      armCm: asNullableNumber(value.armCm, 15, 80),
      thighCm: asNullableNumber(value.thighCm, 25, 120),
      shoulderCm: asNullableNumber(value.shoulderCm, 60, 250),
      note: asString(value.note).slice(0, 240),
    };
    // A row where every field came back empty is not a check-in.
    const hasValue =
      entry.weightKg !== null ||
      entry.waistCm !== null ||
      entry.chestCm !== null ||
      entry.armCm !== null ||
      entry.thighCm !== null ||
      entry.shoulderCm !== null ||
      entry.note !== "";
    if (hasValue) out[key] = entry;
  }
  return out;
}

/**
 * A day's health markers.
 *
 * `bedtime` is validated as a clock string rather than coerced to a number,
 * because the only thing it has to survive is a round trip through an
 * <input type="time"> — anything that is not "HH:MM" came from a hand-edited
 * payload and is dropped rather than guessed at.
 */
function normalizeHealth(raw: unknown): Record<IsoDate, HealthLog> {
  const out: Record<IsoDate, HealthLog> = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!isIsoDate(key) || !isRecord(value)) continue;
    const bedtimeRaw = asString(value.bedtime);
    const entry: HealthLog = {
      date: key,
      sleepHours: asNullableNumber(value.sleepHours, 0, 16, 1),
      bedtime: /^([01]\d|2[0-3]):[0-5]\d$/.test(bedtimeRaw) ? bedtimeRaw : null,
      steps: asNullableNumber(value.steps, 0, 100_000, 0),
      waterMl: asNullableNumber(value.waterMl, 0, 10_000, 0),
      restingHr: asNullableNumber(value.restingHr, 25, 150, 0),
      note: asString(value.note).slice(0, 240),
    };
    // Same rule as a body check-in: an all-empty row is not a reading.
    const hasValue =
      entry.sleepHours !== null ||
      entry.bedtime !== null ||
      entry.steps !== null ||
      entry.waterMl !== null ||
      entry.restingHr !== null ||
      entry.note !== "";
    if (hasValue) out[key] = entry;
  }
  return out;
}

function normalizeSettings(raw: unknown): Settings {
  const base: Settings = {
    ...DEFAULT_SETTINGS,
    targets: { ...DEFAULT_SETTINGS.targets },
    healthTargets: { ...DEFAULT_SETTINGS.healthTargets },
  };
  if (!isRecord(raw)) return base;

  const unit: WeightUnit = raw.unit === "lb" ? "lb" : "kg";
  const bodyWeight = toFiniteNumber(raw.bodyWeightKg);
  const targets = isRecord(raw.targets) ? raw.targets : {};
  const healthTargets = isRecord(raw.healthTargets) ? raw.healthTargets : {};
  const height = toFiniteNumber(raw.heightCm);

  return {
    unit,
    weeklyGoal: clamp(asPositiveInt(raw.weeklyGoal, base.weeklyGoal), 1, 7),
    bodyWeightKg:
      bodyWeight === null ? null : round(clamp(bodyWeight, 20, 400), 1),
    restSeconds: clamp(
      asPositiveInt(raw.restSeconds, base.restSeconds),
      MIN_REST_SECONDS,
      MAX_REST_SECONDS,
    ),
    repMin: clamp(asPositiveInt(raw.repMin, base.repMin), 1, 30),
    repMax: clamp(
      asPositiveInt(raw.repMax, base.repMax),
      clamp(asPositiveInt(raw.repMin, base.repMin), 1, 30),
      50,
    ),
    incrementKg: round(
      clamp(toFiniteNumber(raw.incrementKg) ?? base.incrementKg, 0.5, 50),
      2,
    ),
    restSound: raw.restSound !== false,
    restVibrate: raw.restVibrate !== false,
    restAutoStart: raw.restAutoStart !== false,
    targets: {
      kcal: clamp(asPositiveInt(targets.kcal, base.targets.kcal), 0, 20_000),
      protein: clamp(
        asPositiveInt(targets.protein, base.targets.protein),
        0,
        1_000,
      ),
      carbs: clamp(asPositiveInt(targets.carbs, base.targets.carbs), 0, 2_000),
      fat: clamp(asPositiveInt(targets.fat, base.targets.fat), 0, 1_000),
    },
    heightCm: height === null ? null : round(clamp(height, 100, 250), 1),
    healthTargets: {
      sleepHours: clamp(
        toFiniteNumber(healthTargets.sleepHours) ?? base.healthTargets.sleepHours,
        4,
        12,
      ),
      steps: clamp(
        asPositiveInt(healthTargets.steps, base.healthTargets.steps),
        1_000,
        50_000,
      ),
      waterMl: clamp(
        asPositiveInt(healthTargets.waterMl, base.healthTargets.waterMl),
        500,
        8_000,
      ),
    },
  };
}

/**
 * Coerce any payload into a valid `Database`, dropping rows that cannot be
 * repaired (a bad set is better lost than crashing the dashboard). Referential
 * integrity is enforced in dependency order: exercises → days → sessions → sets.
 */
export function normalizeDatabase(raw: unknown, now = Date.now()): Database {
  if (!isRecord(raw)) return createSeedDatabase(now);

  const exercises = asArray(raw.exercises)
    .map((item) => normalizeExercise(item, now))
    .filter((item): item is Exercise => item !== null);

  // Nothing usable in there — treat as a first run rather than an empty app.
  if (exercises.length === 0) return createSeedDatabase(now);

  const exerciseIds = new Set(exercises.map((e) => e.id));

  const programDays = asArray(raw.programDays)
    .map((item, index) => normalizeProgramDay(item, index, exerciseIds))
    .filter((item): item is ProgramDay => item !== null)
    .sort((a, b) => a.order - b.order)
    .map((day, index) => ({ ...day, order: index }));

  const dayIds = new Set(programDays.map((d) => d.id));

  const sessions = asArray(raw.sessions)
    .map((item) => normalizeSession(item, now, dayIds))
    .filter((item): item is Session => item !== null);

  // One session per calendar day keeps "today's workout" unambiguous.
  const sessionByDate = new Map<IsoDate, Session>();
  for (const session of sessions) {
    const existing = sessionByDate.get(session.date);
    if (!existing || session.createdAt < existing.createdAt) {
      sessionByDate.set(session.date, session);
    }
  }
  const dedupedSessions = Array.from(sessionByDate.values()).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
  const sessionIds = new Set(dedupedSessions.map((s) => s.id));

  const setEntries = asArray(raw.setEntries)
    .map((item) => normalizeSetEntry(item, now, sessionIds, exerciseIds))
    .filter((item): item is SetEntry => item !== null)
    .sort((a, b) => a.createdAt - b.createdAt);

  return {
    version: DB_VERSION,
    exercises,
    programDays,
    sessions: dedupedSessions,
    setEntries,
    attendance: normalizeAttendance(raw.attendance),
    nutrition: normalizeNutrition(raw.nutrition),
    bodyMetrics: normalizeBodyMetrics(raw.bodyMetrics),
    health: normalizeHealth(raw.health),
    settings: normalizeSettings(raw.settings),
    updatedAt: asTimestamp(raw.updatedAt, now),
  };
}

/* ------------------------------------------------------------------ */
/* Migrations                                                          */
/* ------------------------------------------------------------------ */

/**
 * Bring an older payload up to `DB_VERSION`. Version 1 is the first schema, so
 * there is nothing to do yet; the switch is the seam for the next one.
 */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const version = toFiniteNumber(raw.version) ?? 0;
  let working = raw;
  if (version < 1) {
    working = { ...working, version: 1 };
  }
  if (version < 2) {
    /* v2 added the rest timer, double-progression targets, per-machine setup
       notes and body check-ins. Every new field is either nullable or carries a
       default in `DEFAULT_SETTINGS`, so the normalisers below fill them in —
       the only thing that has to exist here is the container for the new
       collection. Missing it would mean a v1 backup loaded fine today and threw
       on the first body check-in tomorrow. */
    working = {
      ...working,
      version: 2,
      bodyMetrics: isRecord(working.bodyMetrics) ? working.bodyMetrics : {},
    };
  }
  if (version < 3) {
    /* v3 added the daily health log. The container has to be created here and
       not left to the normaliser: `heightCm` and `healthTargets` carry defaults
       from DEFAULT_SETTINGS, but a missing `health` key would mean the first
       sleep entry of the day wrote into a record that did not exist. */
    working = {
      ...working,
      version: 3,
      health: isRecord(working.health) ? working.health : {},
    };
  }
  return working;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function loadDatabase(): LoadResult {
  const store = getStore();
  const now = Date.now();

  if (!store) {
    return {
      db: createSeedDatabase(now),
      status: "unavailable",
      seeded: true,
      repaired: false,
    };
  }

  let rawText: string | null = null;
  try {
    rawText = store.getItem(STORAGE_KEY);
  } catch {
    rawText = null;
  }

  if (rawText === null) {
    return {
      db: createSeedDatabase(now),
      status: "ready",
      seeded: true,
      repaired: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Truncated write or someone edited devtools. Start clean rather than crash,
    // and keep the broken text aside so nothing is silently destroyed.
    try {
      store.setItem(`${STORAGE_KEY}.corrupt.${now}`, rawText);
    } catch {
      /* best effort only */
    }
    return {
      db: createSeedDatabase(now),
      status: "ready",
      seeded: true,
      repaired: true,
    };
  }

  const migrated = isRecord(parsed) ? migrate(parsed) : parsed;
  const db = normalizeDatabase(migrated, now);
  const repaired =
    isRecord(parsed) &&
    (db.setEntries.length !== asArray(parsed.setEntries).length ||
      db.sessions.length !== asArray(parsed.sessions).length);

  return { db, status: "ready", seeded: false, repaired };
}

export function saveDatabase(db: Database): boolean {
  const store = getStore();
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch {
    // QuotaExceededError is the realistic failure here.
    return false;
  }
}

export function clearDatabase(): boolean {
  const store = getStore();
  if (!store) return false;
  try {
    store.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Pretty-printed export payload, ready to hand to a download. */
export function serializeDatabase(db: Database): string {
  return JSON.stringify({ ...db, exportedAt: new Date().toISOString() }, null, 2);
}
