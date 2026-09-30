/**
 * One-way importer for the original single-file tracker's backup JSON.
 *
 * That version stored history denormalised — `logs[exerciseName] = [{date,
 * weight, reps}]` — which is why the same lift logged under two spellings used
 * to fork into two curves. This maps it onto the normalised schema: names are
 * matched against the existing catalogue first (case- and whitespace-
 * insensitive), and only genuinely new names create a row.
 */

import { addExercise, logSet } from "./repository";
import { createSeedDatabase, guessMuscleGroup } from "./seed";
import { normalizeDatabase } from "./storage";
import type { Database, Id } from "./types";
import { isIsoDate, toFiniteNumber } from "./utils";

const LEGACY_DAY_META: Record<string, { name: string; focus: string }> = {
  push: { name: "Push", focus: "الصدر · الكتف · التراي" },
  pull: { name: "Pull", focus: "الظهر · الباي" },
  legs: { name: "Legs", focus: "الأرجل · البطن" },
  upper: { name: "Upper", focus: "الجزء العلوي (صيانة)" },
  lower: { name: "Lower", focus: "خلفية الفخذ · الجلوت" },
  off: { name: "Off Day", focus: "بطن وراحة نشطة" },
};

export interface ImportReport {
  exercisesCreated: number;
  setsImported: number;
  setsSkipped: number;
  daysImported: number;
  attendanceDays: number;
  nutritionDays: number;
}

export interface ImportOutcome {
  db: Database;
  report: ImportReport;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Detect the legacy shape so the UI can pick the right importer. */
export function looksLikeLegacyBackup(raw: unknown): boolean {
  if (!isRecord(raw)) return false;
  if (Array.isArray(raw.setEntries)) return false; // already the new schema
  return isRecord(raw.logs) || isRecord(raw.program);
}

/**
 * Import a legacy payload into a fresh database.
 *
 * Returns the new database plus a report, so the user is told exactly what came
 * across instead of being left to guess.
 */
export function importLegacyBackup(raw: unknown): ImportOutcome {
  const report: ImportReport = {
    exercisesCreated: 0,
    setsImported: 0,
    setsSkipped: 0,
    daysImported: 0,
    attendanceDays: 0,
    nutritionDays: 0,
  };

  let db = createSeedDatabase();

  if (!isRecord(raw)) return { db, report };

  const byName = new Map<string, Id>();
  for (const exercise of db.exercises) {
    byName.set(normalizeKey(exercise.name), exercise.id);
  }

  const resolveExercise = (rawName: string): Id | null => {
    const name = rawName.trim().replace(/\s+/g, " ");
    if (name === "") return null;
    const key = normalizeKey(name);
    const existing = byName.get(key);
    if (existing) return existing;

    const created = addExercise(db, {
      name,
      muscleGroup: guessMuscleGroup(name),
      equipment: "other",
    });
    if (!created.ok) return null;
    db = created.value.db;
    byName.set(key, created.value.exercise.id);
    report.exercisesCreated += 1;
    return created.value.exercise.id;
  };

  /* ---- program template ---- */
  if (isRecord(raw.program)) {
    const days = Object.entries(raw.program).filter(([, value]) =>
      Array.isArray(value),
    );

    const programDays = days.map(([slug, value], index) => {
      const meta = LEGACY_DAY_META[slug] ?? { name: slug, focus: "" };
      const exerciseIds = (value as unknown[])
        .filter((item): item is string => typeof item === "string")
        .map(resolveExercise)
        .filter((id): id is Id => id !== null);

      return {
        id: `day_legacy_${slug}`,
        slug,
        name: meta.name,
        focus: meta.focus,
        order: index,
        exerciseIds: Array.from(new Set(exerciseIds)),
      };
    });

    if (programDays.length > 0) {
      db = { ...db, programDays };
      report.daysImported = programDays.length;
    }
  }

  /* ---- history: logs[name] = [{date, weight, reps}] ---- */
  if (isRecord(raw.logs)) {
    // Collect first, then write in chronological order so `setIndex` and the PR
    // walk both come out in the order the lifts actually happened.
    const pending: { name: string; date: string; weight: number; reps: number }[] =
      [];

    for (const [name, value] of Object.entries(raw.logs)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) {
        if (!isRecord(item)) {
          report.setsSkipped += 1;
          continue;
        }
        const weight = toFiniteNumber(item.weight);
        const reps = toFiniteNumber(item.reps);
        const date = item.date;
        if (
          typeof date !== "string" ||
          !isIsoDate(date) ||
          weight === null ||
          reps === null ||
          reps < 1
        ) {
          report.setsSkipped += 1;
          continue;
        }
        pending.push({ name, date, weight, reps });
      }
    }

    pending.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    for (const item of pending) {
      const exerciseId = resolveExercise(item.name);
      if (!exerciseId) {
        report.setsSkipped += 1;
        continue;
      }
      const dayId =
        db.programDays.find((day) => day.exerciseIds.includes(exerciseId))?.id ??
        null;

      const result = logSet(db, {
        date: item.date,
        programDayId: dayId,
        exerciseId,
        weightKg: item.weight,
        reps: item.reps,
      });

      if (result.ok) {
        db = result.value.db;
        report.setsImported += 1;
      } else {
        report.setsSkipped += 1;
      }
    }
  }

  /* ---- attendance ---- */
  if (isRecord(raw.attendance)) {
    const attendance: Record<string, boolean> = {};
    for (const [date, value] of Object.entries(raw.attendance)) {
      if (isIsoDate(date) && value === true) {
        attendance[date] = true;
        report.attendanceDays += 1;
      }
    }
    db = { ...db, attendance };
  }

  /* ---- calories → nutrition ---- */
  if (isRecord(raw.calories)) {
    const nutrition: Database["nutrition"] = {};
    for (const [date, value] of Object.entries(raw.calories)) {
      if (!isIsoDate(date) || !isRecord(value)) continue;
      nutrition[date] = {
        date,
        kcal: toFiniteNumber(value.kcal) ?? 0,
        protein: toFiniteNumber(value.protein) ?? 0,
        carbs: toFiniteNumber(value.carbs) ?? 0,
        fat: toFiniteNumber(value.fat) ?? 0,
      };
      report.nutritionDays += 1;
    }
    db = { ...db, nutrition };
  }

  /* ---- targets ---- */
  if (isRecord(raw.targets)) {
    db = {
      ...db,
      settings: {
        ...db.settings,
        targets: {
          kcal: toFiniteNumber(raw.targets.kcal) ?? db.settings.targets.kcal,
          protein:
            toFiniteNumber(raw.targets.protein) ?? db.settings.targets.protein,
          carbs: toFiniteNumber(raw.targets.carbs) ?? db.settings.targets.carbs,
          fat: toFiniteNumber(raw.targets.fat) ?? db.settings.targets.fat,
        },
      },
    };
  }

  // Final pass through the schema guard: clamps, de-dupes, enforces integrity.
  return { db: normalizeDatabase(db), report };
}

/** Parse + import a file's text, choosing between the two backup shapes. */
export function importBackupText(text: string): ImportOutcome | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "الملف ليس JSON صالحاً" };
  }

  if (looksLikeLegacyBackup(parsed)) {
    return importLegacyBackup(parsed);
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.exercises)) {
    return { error: "الملف لا يحتوي على نسخة احتياطية معروفة" };
  }

  const db = normalizeDatabase(parsed);
  return {
    db,
    report: {
      exercisesCreated: db.exercises.length,
      setsImported: db.setEntries.length,
      setsSkipped: 0,
      daysImported: db.programDays.length,
      attendanceDays: Object.keys(db.attendance).length,
      nutritionDays: Object.keys(db.nutrition).length,
    },
  };
}
