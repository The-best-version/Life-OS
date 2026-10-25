/**
 * Cross-sport readings.
 *
 * Pure selectors over the database: no React, no clock of their own, nothing
 * that draws. Everything a multi-sport screen states comes from here, so the
 * radar, the trophy shelf and the HUD cannot disagree about the same week.
 *
 * One asymmetry is deliberate and worth stating. Gym days are NOT
 * `AthleticSession` rows — they live in `sessions` + `setEntries`, where the
 * overload engine and the muscle landmarks can see every individual set. So a
 * week's gym column is counted and scored from those sets, and every other
 * discipline from its own session row. The alternative was flattening a lift
 * into one row with a duration on it, which would have cost the app its best
 * feature to make this file's arithmetic tidier.
 */

import {
  isWorkingSet,
  sessionDurationMin,
  trainedDates,
  type DbIndex,
} from "./metrics";
import {
  SPORTS_CONFIG,
  getSport,
  recordValue,
  type MetricReading,
} from "./sports-config";
import type {
  AthleticRecord,
  AthleticSession,
  Database,
  Id,
  IsoDate,
  SportId,
  SportLoadRow,
} from "./types";
import { addDays, clamp, round, toIsoDate } from "./utils";

/* ------------------------------------------------------------------ */
/* Windows                                                             */
/* ------------------------------------------------------------------ */

/** The first day of a trailing window of `days` days, inclusive of today. */
export function windowStart(days: number, today: IsoDate = toIsoDate()): IsoDate {
  return toIsoDate(addDays(new Date(`${today}T00:00:00`), -(days - 1)));
}

/** Finished sessions of every non-gym discipline inside the window. */
export function athleticIn(
  db: Database,
  days: number,
  today: IsoDate = toIsoDate(),
): AthleticSession[] {
  const from = windowStart(days, today);
  return db.athleticSessions.filter(
    (s) => s.endedAt !== null && s.date >= from && s.date <= today,
  );
}

/**
 * The one session still running, if there is one.
 *
 * `endedAt === null` is what makes a session live, and only the newest such
 * row counts: a session left open on a phone in a pocket must not stop the
 * next one from starting.
 */
export function liveSession(db: Database): AthleticSession | null {
  const open = db.athleticSessions.filter((s) => s.endedAt === null);
  if (open.length === 0) return null;
  return open.reduce((latest, s) => (s.startedAt > latest.startedAt ? s : latest));
}

/* ------------------------------------------------------------------ */
/* Strain                                                             */
/* ------------------------------------------------------------------ */

/** One non-gym session's 0–100 load, through its own sport's function. */
export function sessionStrain(session: AthleticSession): number {
  return getSport(session.sport).strain(session);
}

/**
 * A gym day's 0–100 load, from the sets themselves.
 *
 * Working sets carry the weight of it and average RPE scales it, which is the
 * same shape every other sport's `strain` has: how much, times how hard. An
 * unrated set is read as 7 — the middle of the band people actually log —
 * rather than dropped, because dropping it would score a hard unlogged session
 * as an easy one.
 */
export function gymStrain(index: DbIndex, sessionId: Id): number {
  const sets = (index.setsBySession.get(sessionId) ?? []).filter(isWorkingSet);
  if (sets.length === 0) return 0;
  const avgRpe = sets.reduce((a, s) => a + (s.rpe ?? 7), 0) / sets.length;
  return clamp(Math.round(sets.length * 3 + (avgRpe - 5) * 8), 0, 100);
}

/* ------------------------------------------------------------------ */
/* The week, across every discipline                                   */
/* ------------------------------------------------------------------ */

/**
 * One row per discipline: sessions done, the target, and the load.
 *
 * Each sport is measured against its OWN `weeklyTarget`, so two rides and one
 * run read as a week that happened rather than as a failed gym week. Nothing
 * here sums the rows into a single percentage, and that is the point of the
 * screen: the week was spent across four kinds of training, and one number
 * would erase exactly that.
 */
export function weeklyLoad(
  db: Database,
  index: DbIndex,
  days = 7,
  today: IsoDate = toIsoDate(),
): SportLoadRow[] {
  const from = windowStart(days, today);
  const athletic = athleticIn(db, days, today);

  return SPORTS_CONFIG.map((sport) => {
    let sessions = 0;
    let strain = 0;

    if (sport.id === "gym") {
      for (const session of db.sessions) {
        if (session.date < from || session.date > today) continue;
        const working = (index.setsBySession.get(session.id) ?? []).filter(isWorkingSet);
        if (working.length === 0) continue;
        sessions += 1;
        strain += gymStrain(index, session.id);
      }
    } else {
      for (const session of athletic) {
        if (session.sport !== sport.id) continue;
        sessions += 1;
        strain += sessionStrain(session);
      }
    }

    return {
      sport: sport.id,
      name: sport.name,
      nameAr: sport.nameAr,
      accentVar: sport.accentVar,
      sessions,
      target: sport.weeklyTarget,
      strain,
      progress: clamp(sessions / (sport.weeklyTarget || 1), 0, 1),
    };
  });
}

/** The week's total load. A figure, not a verdict — no target sits under it. */
export function totalStrain(rows: SportLoadRow[]): number {
  return rows.reduce((a, row) => a + row.strain, 0);
}

/**
 * Every day on which ANY discipline was trained.
 *
 * This is what makes the streak sport-agnostic: `trainedDates` already folds
 * gym sessions together with explicit attendance, and every finished athletic
 * session adds its own day. A ride keeps the run alive.
 */
export function activeDates(db: Database, index: DbIndex): Set<IsoDate> {
  const dates = trainedDates(db, index);
  for (const session of db.athleticSessions) {
    if (session.endedAt !== null) dates.add(session.date);
  }
  return dates;
}

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

/**
 * The standing record for every kind every sport defines.
 *
 * `better` decides the comparison, which is why a fastest pace and a heaviest
 * session can share one shelf without a branch anywhere above this function.
 * `freshSince` marks anything set on or after that day, so the session just
 * finished can light its own record up.
 */
export function athleticRecords(
  db: Database,
  freshSince?: IsoDate,
): AthleticRecord[] {
  const out: AthleticRecord[] = [];

  for (const sport of SPORTS_CONFIG) {
    const own = db.athleticSessions.filter(
      (s) => s.sport === sport.id && s.endedAt !== null,
    );
    if (own.length === 0) continue;

    for (const kind of sport.records) {
      let best: { value: number; session: AthleticSession } | null = null;

      for (const session of own) {
        const value = recordValue(session, kind.key);
        // 0 is "not measured" for every record kind here, never a result.
        if (!isFinite(value) || value <= 0) continue;
        if (!best) {
          best = { value, session };
          continue;
        }
        const better = kind.better === "min" ? value < best.value : value > best.value;
        if (better) best = { value, session };
      }

      if (!best) continue;
      out.push({
        sport: sport.id,
        sportName: sport.nameAr,
        accentVar: sport.accentVar,
        key: kind.key,
        label: kind.label,
        unit: kind.unit,
        value: best.value,
        display: kind.format ? kind.format(best.value) : String(round(best.value, 1)),
        date: best.session.date,
        fresh: freshSince !== undefined && best.session.date >= freshSince,
      });
    }
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* One session, summarised                                             */
/* ------------------------------------------------------------------ */

export interface AthleticSummary {
  sport: SportId;
  /** The sport's own readings, already presented. */
  readings: MetricReading[];
  strain: number;
  /** Minutes the session actually ran, from the clock rather than the field. */
  elapsedMin: number | null;
}

export function summarise(session: AthleticSession): AthleticSummary {
  const end = session.endedAt ?? Date.now();
  const elapsed = Math.round((end - session.startedAt) / 60_000);
  return {
    sport: session.sport,
    readings: [],
    strain: sessionStrain(session),
    // A span over eight hours means the row was left open, not trained through.
    elapsedMin: elapsed > 0 && elapsed <= 480 ? elapsed : null,
  };
}

/**
 * The gym's equivalent of `summarise`, for the one screen that shows both.
 *
 * Duration comes from `sessionDurationMin`, which reads the first and last set
 * of the day: a lift has no stopwatch, and a stored duration would depend on
 * the user remembering to stop one.
 */
export function gymSummary(
  index: DbIndex,
  sessionId: Id,
): { sets: number; strain: number; elapsedMin: number | null } {
  const sets = (index.setsBySession.get(sessionId) ?? []).filter(isWorkingSet);
  return {
    sets: sets.length,
    strain: gymStrain(index, sessionId),
    elapsedMin: sessionDurationMin(index, sessionId),
  };
}
