-- ============================================================================
-- Iron Log — relational schema
-- ============================================================================
-- The MVP persists to localStorage, but the in-memory model in `src/lib/types.ts`
-- is already normalised to this schema, and `src/lib/storage.ts` enforces the
-- same constraints (referential integrity, weight/rep bounds, one session per
-- calendar day). Moving to SQLite is therefore a matter of reimplementing
-- `loadDatabase` / `saveDatabase` — no component or selector changes.
--
-- Target: SQLite 3.37+ (STRICT tables). Run with `PRAGMA foreign_keys = ON`.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS exercises (
  id            TEXT    PRIMARY KEY,
  name          TEXT    NOT NULL,
  muscle_group  TEXT    NOT NULL CHECK (muscle_group IN (
                  'chest','back','shoulders','biceps','triceps',
                  'quads','hamstrings','glutes','calves','core')),
  equipment     TEXT    NOT NULL DEFAULT 'other',
  created_at    INTEGER NOT NULL,
  archived      INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  -- How this machine is set up: seat notch, pin hole, pad height. Free text,
  -- because no two gyms label a machine the same way.
  setup         TEXT    NOT NULL DEFAULT '',
  -- Per-machine overrides for double progression. NULL means "follow settings",
  -- which is a different fact from a number that equals the setting today.
  rep_min       INTEGER          CHECK (rep_min IS NULL OR (rep_min BETWEEN 1 AND 200)),
  rep_max       INTEGER          CHECK (rep_max IS NULL OR (rep_max BETWEEN 1 AND 200)),
  increment_kg  REAL             CHECK (increment_kg IS NULL OR (increment_kg BETWEEN 0.5 AND 50)),
  rest_seconds  INTEGER          CHECK (rest_seconds IS NULL OR (rest_seconds BETWEEN 15 AND 600)),
  CHECK (rep_min IS NULL OR rep_max IS NULL OR rep_min <= rep_max)
) STRICT;

-- One exercise per name: the whole point of the normalised model is that the
-- same lift never forks into two progression curves.
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name
  ON exercises (name COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_exercises_group
  ON exercises (muscle_group);

-- ---------------------------------------------------------------------------
-- Program template (the training split)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS program_days (
  id        TEXT    PRIMARY KEY,
  slug      TEXT    NOT NULL UNIQUE,
  name      TEXT    NOT NULL,
  focus     TEXT    NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE TABLE IF NOT EXISTS program_day_exercises (
  day_id      TEXT    NOT NULL REFERENCES program_days (id) ON DELETE CASCADE,
  exercise_id TEXT    NOT NULL REFERENCES exercises (id)    ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day_id, exercise_id)
) STRICT;

-- ---------------------------------------------------------------------------
-- Training history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT    PRIMARY KEY,
  -- Local calendar day, 'YYYY-MM-DD'. UNIQUE keeps "today's workout" unambiguous.
  session_date    TEXT    NOT NULL UNIQUE
                    CHECK (session_date LIKE '____-__-__'),
  program_day_id  TEXT             REFERENCES program_days (id) ON DELETE SET NULL,
  note            TEXT    NOT NULL DEFAULT '',
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  -- Self-rated readiness on the way in. Session *length* is deliberately not a
  -- column: it is derived from the first and last set in v_session_volume,
  -- because a stored duration depends on someone stopping a stopwatch.
  readiness       INTEGER          CHECK (readiness IS NULL OR (readiness BETWEEN 1 AND 5))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions (session_date DESC);

-- The atomic fact the whole app is built on: one logged set.
CREATE TABLE IF NOT EXISTS set_entries (
  id          TEXT    PRIMARY KEY,
  session_id  TEXT    NOT NULL REFERENCES sessions (id)  ON DELETE CASCADE,
  exercise_id TEXT    NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
  set_index   INTEGER NOT NULL CHECK (set_index >= 1),
  -- Always kilograms. Display units are a presentation concern only.
  weight_kg   REAL    NOT NULL CHECK (weight_kg >= 0 AND weight_kg <= 750),
  reps        INTEGER NOT NULL CHECK (reps >= 1 AND reps <= 200),
  rpe         REAL             CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  is_warmup   INTEGER NOT NULL DEFAULT 0 CHECK (is_warmup IN (0, 1)),
  created_at  INTEGER NOT NULL,
  UNIQUE (session_id, exercise_id, set_index)
) STRICT;

-- The two access patterns that matter: "this session's sets" (the logger) and
-- "this exercise over time" (the progression chart).
CREATE INDEX IF NOT EXISTS idx_sets_session  ON set_entries (session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON set_entries (exercise_id, created_at);

-- ---------------------------------------------------------------------------
-- Consistency & nutrition
-- ---------------------------------------------------------------------------

-- Explicit check-ins, including rest-day cardio that logs no sets.
CREATE TABLE IF NOT EXISTS attendance (
  attend_date TEXT    PRIMARY KEY CHECK (attend_date LIKE '____-__-__'),
  present     INTEGER NOT NULL DEFAULT 1 CHECK (present IN (0, 1))
) STRICT;

CREATE TABLE IF NOT EXISTS nutrition_logs (
  log_date TEXT    PRIMARY KEY CHECK (log_date LIKE '____-__-__'),
  kcal     INTEGER NOT NULL DEFAULT 0 CHECK (kcal    >= 0),
  protein  INTEGER NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs    INTEGER NOT NULL DEFAULT 0 CHECK (carbs   >= 0),
  fat      INTEGER NOT NULL DEFAULT 0 CHECK (fat     >= 0)
) STRICT;

-- Body check-ins. Every measurement is nullable: someone who weighs himself
-- daily but reaches for the tape once a month must not be made to invent the
-- numbers he did not take, and a stored zero would poison every average.
CREATE TABLE IF NOT EXISTS body_metrics (
  metric_date  TEXT PRIMARY KEY CHECK (metric_date LIKE '____-__-__'),
  weight_kg    REAL CHECK (weight_kg    IS NULL OR (weight_kg    BETWEEN 20  AND 400)),
  waist_cm     REAL CHECK (waist_cm     IS NULL OR (waist_cm     BETWEEN 40  AND 200)),
  chest_cm     REAL CHECK (chest_cm     IS NULL OR (chest_cm     BETWEEN 50  AND 200)),
  arm_cm       REAL CHECK (arm_cm       IS NULL OR (arm_cm       BETWEEN 15  AND 80)),
  thigh_cm     REAL CHECK (thigh_cm     IS NULL OR (thigh_cm     BETWEEN 25  AND 120)),
  shoulder_cm  REAL CHECK (shoulder_cm  IS NULL OR (shoulder_cm  BETWEEN 60  AND 250)),
  note         TEXT NOT NULL DEFAULT ''
) STRICT;

-- ---------------------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS settings (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  unit           TEXT    NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'lb')),
  weekly_goal    INTEGER NOT NULL DEFAULT 5 CHECK (weekly_goal BETWEEN 1 AND 7),
  body_weight_kg REAL             CHECK (body_weight_kg IS NULL
                                    OR (body_weight_kg BETWEEN 20 AND 400)),
  target_kcal    INTEGER NOT NULL DEFAULT 2600,
  target_protein INTEGER NOT NULL DEFAULT 160,
  target_carbs   INTEGER NOT NULL DEFAULT 300,
  target_fat     INTEGER NOT NULL DEFAULT 80,
  rest_seconds   INTEGER NOT NULL DEFAULT 120 CHECK (rest_seconds BETWEEN 15 AND 600),
  rep_min        INTEGER NOT NULL DEFAULT 8   CHECK (rep_min BETWEEN 1 AND 30),
  rep_max        INTEGER NOT NULL DEFAULT 12  CHECK (rep_max BETWEEN 1 AND 50),
  increment_kg   REAL    NOT NULL DEFAULT 2.5 CHECK (increment_kg BETWEEN 0.5 AND 50),
  rest_sound     INTEGER NOT NULL DEFAULT 1 CHECK (rest_sound     IN (0, 1)),
  rest_vibrate   INTEGER NOT NULL DEFAULT 1 CHECK (rest_vibrate   IN (0, 1)),
  rest_autostart INTEGER NOT NULL DEFAULT 1 CHECK (rest_autostart IN (0, 1)),
  schema_version INTEGER NOT NULL DEFAULT 2,
  CHECK (rep_min <= rep_max)
) STRICT;

INSERT OR IGNORE INTO settings (id) VALUES (1);

-- ---------------------------------------------------------------------------
-- Views mirroring the selectors in src/lib/metrics.ts
-- ---------------------------------------------------------------------------

-- Total tonnage per session (working sets only) — the volume trend chart.
CREATE VIEW IF NOT EXISTS v_session_volume AS
SELECT
  s.id                            AS session_id,
  s.session_date                  AS session_date,
  COUNT(e.id)                     AS set_count,
  COALESCE(SUM(e.weight_kg * e.reps), 0) AS volume_kg,
  -- Session length, first set to last, matching sessionDurationMin().
  CAST((MAX(e.created_at) - MIN(e.created_at)) / 60000 AS INTEGER) AS duration_min
FROM sessions s
LEFT JOIN set_entries e
  ON e.session_id = s.id AND e.is_warmup = 0
GROUP BY s.id;

-- One row per (exercise, session): top working set and its Epley 1RM estimate.
-- Reps are capped at 12 in the estimate, exactly as `estimate1rm()` does, so a
-- 30-rep burnout set cannot invent a record.
CREATE VIEW IF NOT EXISTS v_exercise_progress AS
SELECT
  e.exercise_id                                  AS exercise_id,
  s.session_date                                 AS session_date,
  MAX(e.weight_kg)                               AS top_weight_kg,
  SUM(e.weight_kg * e.reps)                      AS volume_kg,
  SUM(e.reps)                                    AS total_reps,
  MAX(e.weight_kg * (1.0 + MIN(e.reps, 12) / 30.0)) AS estimated_1rm
FROM set_entries e
JOIN sessions s ON s.id = e.session_id
WHERE e.is_warmup = 0
GROUP BY e.exercise_id, s.id;

-- Volume share per muscle group — the distribution bar list.
CREATE VIEW IF NOT EXISTS v_muscle_group_volume AS
SELECT
  x.muscle_group                       AS muscle_group,
  s.session_date                       AS session_date,
  COUNT(e.id)                          AS set_count,
  SUM(e.weight_kg * e.reps)            AS volume_kg
FROM set_entries e
JOIN exercises x ON x.id = e.exercise_id
JOIN sessions  s ON s.id = e.session_id
WHERE e.is_warmup = 0
GROUP BY x.muscle_group, s.session_date;
