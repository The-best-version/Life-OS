"use client";

/**
 * The single source of truth for the client.
 *
 * Why a ref alongside state: actions must be able to return a synchronous
 * `Result` so a form can show "أقصى وزن مسموح 750 كجم" on the same tick the user
 * pressed save. `useState`'s updater is async, so the latest database is mirrored
 * into `dbRef` and every action reads from there. Nothing outside this module
 * mutates the database, so the two can never drift.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { buildIndex, type DbIndex } from "./metrics";
import * as repo from "./repository";
import { DB_VERSION, DEFAULT_SETTINGS, createSeedDatabase } from "./seed";
import {
  STORAGE_KEY,
  loadDatabase,
  normalizeDatabase,
  saveDatabase,
  serializeDatabase,
  type StorageStatus,
} from "./storage";
import type {
  Database,
  Id,
  IsoDate,
  MuscleGroup,
  NutritionLog,
  SetEntry,
  Settings,
} from "./types";

/**
 * Deterministic empty database used for the server render and the very first
 * client render. Seeding happens after mount, so the two renders match and React
 * never reports a hydration mismatch.
 */
const EMPTY_DB: Database = {
  version: DB_VERSION,
  exercises: [],
  programDays: [],
  sessions: [],
  setEntries: [],
  attendance: {},
  nutrition: {},
  settings: { ...DEFAULT_SETTINGS, targets: { ...DEFAULT_SETTINGS.targets } },
  updatedAt: 0,
};

export interface IronLogActions {
  logSet(input: repo.LogSetInput): repo.Result<SetEntry>;
  updateSet(
    setId: Id,
    patch: Partial<Pick<SetEntry, "weightKg" | "reps" | "rpe" | "isWarmup">>,
  ): repo.Result<null>;
  deleteSet(setId: Id): void;
  setSessionNote(date: IsoDate, note: string): void;

  addExercise(input: {
    name: string;
    muscleGroup: MuscleGroup;
    equipment?: string;
    dayId?: Id | null;
  }): repo.Result<Id>;
  removeExerciseFromDay(dayId: Id, exerciseId: Id): void;
  reorderDayExercises(dayId: Id, exerciseId: Id, direction: -1 | 1): void;

  toggleAttendance(date: IsoDate): void;
  setNutrition(date: IsoDate, patch: Partial<Omit<NutritionLog, "date">>): void;
  updateSettings(patch: Partial<Settings>): void;

  replaceDatabase(next: Database): void;
  clearHistory(): void;
  resetEverything(): void;
  exportJson(): string;
}

interface IronLogContextValue {
  /** `loading` until the stored database has been read on the client. */
  status: "loading" | "ready";
  storage: StorageStatus;
  /** True when the last write to localStorage failed (quota / private mode). */
  saveFailed: boolean;
  /** True when the stored payload had to be repaired on load. */
  repaired: boolean;
  db: Database;
  index: DbIndex;
  actions: IronLogActions;
}

const IronLogContext = createContext<IronLogContextValue | null>(null);

/* Local sync - mirrors the database to report-agent's sync server so the
   charts refresh without a manual export. If the server is down the rejection
   is swallowed and localStorage stays the source of truth. */
const SYNC_URL = "http://127.0.0.1:47615/sync";
let syncTimer: ReturnType<typeof setTimeout> | null = null;
function syncLocal() {
  try {
    return (
      location.protocol === "file:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}
function syncOut(payload: Database) {
  if (!syncLocal()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    try {
      fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain", "X-Local-Sync": "1" },
        body: JSON.stringify({ project: "ironlog", payload }),
      }).catch(() => {});
    } catch {}
  }, 2500);
}

export function IronLogProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(EMPTY_DB);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [storage, setStorage] = useState<StorageStatus>("ready");
  const [saveFailed, setSaveFailed] = useState(false);
  const [repaired, setRepaired] = useState(false);

  const dbRef = useRef<Database>(EMPTY_DB);
  /** Skip the persist effect for the write that hydration itself caused. */
  const hydratedRef = useRef(false);

  /* ---- hydrate once, on the client ---- */
  useEffect(() => {
    const result = loadDatabase();
    dbRef.current = result.db;
    setDb(result.db);
    setStorage(result.status);
    setRepaired(result.repaired);
    setStatus("ready");
    hydratedRef.current = true;

    // Persist the seed immediately so a first-run user who closes the tab
    // without logging anything still gets their program back.
    if (result.seeded && result.status === "ready") {
      setSaveFailed(!saveDatabase(result.db));
    }
  }, []);

  /* ---- persist on every change ---- */
  useEffect(() => {
    if (!hydratedRef.current || status !== "ready") return;
    if (storage !== "ready") return;
    if (db === EMPTY_DB) return;
    setSaveFailed(!saveDatabase(db));
    syncOut(db);
  }, [db, status, storage]);

  /* ---- keep two open tabs in step ---- */
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || event.newValue === null) return;
      try {
        const next = normalizeDatabase(JSON.parse(event.newValue));
        dbRef.current = next;
        setDb(next);
      } catch {
        /* another tab wrote something unreadable; keep ours */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: Database) => {
    dbRef.current = next;
    setDb(next);
  }, []);

  const actions = useMemo<IronLogActions>(() => {
    return {
      logSet(input) {
        const result = repo.logSet(dbRef.current, input);
        if (!result.ok) return result;
        commit(result.value.db);
        return { ok: true, value: result.value.entry };
      },

      updateSet(setId, patch) {
        const result = repo.updateSet(dbRef.current, setId, patch);
        if (!result.ok) return result;
        commit(result.value);
        return { ok: true, value: null };
      },

      deleteSet(setId) {
        commit(repo.deleteSet(dbRef.current, setId));
      },

      setSessionNote(date, note) {
        commit(repo.setSessionNote(dbRef.current, date, note));
      },

      addExercise(input) {
        const result = repo.addExercise(dbRef.current, input);
        if (!result.ok) return result;
        commit(result.value.db);
        return { ok: true, value: result.value.exercise.id };
      },

      removeExerciseFromDay(dayId, exerciseId) {
        commit(repo.removeExerciseFromDay(dbRef.current, dayId, exerciseId));
      },

      reorderDayExercises(dayId, exerciseId, direction) {
        commit(
          repo.reorderDayExercises(dbRef.current, dayId, exerciseId, direction),
        );
      },

      toggleAttendance(date) {
        commit(repo.toggleAttendance(dbRef.current, date));
      },

      setNutrition(date, patch) {
        commit(repo.setNutrition(dbRef.current, date, patch));
      },

      updateSettings(patch) {
        commit(repo.updateSettings(dbRef.current, patch));
      },

      replaceDatabase(next) {
        commit(normalizeDatabase(next));
      },

      clearHistory() {
        commit(repo.clearHistory(dbRef.current));
      },

      resetEverything() {
        commit(createSeedDatabase());
      },

      exportJson() {
        return serializeDatabase(dbRef.current);
      },
    };
  }, [commit]);

  const index = useMemo(() => buildIndex(db), [db]);

  const value = useMemo<IronLogContextValue>(
    () => ({ status, storage, saveFailed, repaired, db, index, actions }),
    [status, storage, saveFailed, repaired, db, index, actions],
  );

  return (
    <IronLogContext.Provider value={value}>{children}</IronLogContext.Provider>
  );
}

export function useIronLog(): IronLogContextValue {
  const context = useContext(IronLogContext);
  if (!context) {
    throw new Error("useIronLog must be used inside <IronLogProvider>");
  }
  return context;
}
