import type {
  Database,
  Exercise,
  MuscleGroup,
  ProgramDay,
} from "./types";
import { createId } from "./utils";

export const DB_VERSION = 4;

/**
 * The exercise catalogue, keyed by a stable slug.
 *
 * Because days reference slugs rather than repeating names, an exercise that
 * appears in two days (Incline Chest Press is in both Push and Upper; Leg Curl
 * is in both Legs and Lower) resolves to ONE exercise row — so its progression
 * curve is continuous instead of being split across two look-alike entries.
 */
const CATALOG: Record<
  string,
  { name: string; muscleGroup: MuscleGroup; equipment: string }
> = {
  "chest-press-machine": {
    name: "بنش مكينة (Chest Press Machine)",
    muscleGroup: "chest",
    equipment: "machine",
  },
  "incline-chest-press": {
    name: "Incline Chest Press مكينة (صدر علوي)",
    muscleGroup: "chest",
    equipment: "machine",
  },
  "pec-deck": {
    name: "Pec Deck (Butterfly)",
    muscleGroup: "chest",
    equipment: "machine",
  },
  "shoulder-press-machine": {
    name: "Shoulder Press مكينة",
    muscleGroup: "shoulders",
    equipment: "machine",
  },
  "cable-lateral-raise": {
    name: "Cable Lateral Raise",
    muscleGroup: "shoulders",
    equipment: "cable",
  },
  "machine-lateral-raise": {
    name: "Machine Lateral Raise (كتف جانبي)",
    muscleGroup: "shoulders",
    equipment: "machine",
  },
  "face-pull": {
    name: "Face Pull",
    muscleGroup: "shoulders",
    equipment: "cable",
  },
  "triceps-pushdown": {
    name: "Triceps Pushdown",
    muscleGroup: "triceps",
    equipment: "cable",
  },
  "overhead-triceps-extension": {
    name: "Overhead Triceps Extension (تراي - الرأس الطويل)",
    muscleGroup: "triceps",
    equipment: "cable",
  },
  "lat-pulldown": {
    name: "Lat Pulldown",
    muscleGroup: "back",
    equipment: "cable",
  },
  "seated-row": {
    name: "Seated Row (قبضة عادية)",
    muscleGroup: "back",
    equipment: "machine",
  },
  "wide-seated-row": {
    name: "Wide Seated Row (عرض الظهر العلوي)",
    muscleGroup: "back",
    equipment: "machine",
  },
  "pullover-machine": {
    name: "Pullover Machine",
    muscleGroup: "back",
    equipment: "machine",
  },
  shrugs: {
    name: "Shrugs (الترابيس)",
    muscleGroup: "back",
    equipment: "machine",
  },
  superman: {
    name: "Superman (أسفل الظهر)",
    muscleGroup: "back",
    equipment: "bodyweight",
  },
  "cable-curl": {
    name: "Cable Curl",
    muscleGroup: "biceps",
    equipment: "cable",
  },
  "preacher-curl-machine": {
    name: "Preacher Curl Machine",
    muscleGroup: "biceps",
    equipment: "machine",
  },
  "hammer-curl": {
    name: "Hammer Curl (باي - براكياليس)",
    muscleGroup: "biceps",
    equipment: "dumbbell",
  },
  "leg-press": {
    name: "Leg Press",
    muscleGroup: "quads",
    equipment: "machine",
  },
  "hack-squat": {
    name: "Hack Squat / Squat مكينة",
    muscleGroup: "quads",
    equipment: "machine",
  },
  "leg-extension": {
    name: "Leg Extension",
    muscleGroup: "quads",
    equipment: "machine",
  },
  "leg-curl": {
    name: "Leg Curl (خلفية الفخذ)",
    muscleGroup: "hamstrings",
    equipment: "machine",
  },
  "romanian-deadlift": {
    name: "Romanian Deadlift",
    muscleGroup: "hamstrings",
    equipment: "barbell",
  },
  "hip-thrust-machine": {
    name: "Hip Thrust مكينة",
    muscleGroup: "glutes",
    equipment: "machine",
  },
  "calf-raise": {
    name: "Calf Raise (البطة)",
    muscleGroup: "calves",
    equipment: "machine",
  },
  "cable-crunch": {
    name: "Cable Crunch (بطن علوي)",
    muscleGroup: "core",
    equipment: "cable",
  },
  "hanging-leg-raise": {
    name: "Hanging Leg Raise (بطن سفلي)",
    muscleGroup: "core",
    equipment: "bodyweight",
  },
  "cable-woodchopper": {
    name: "Cable Woodchopper (أوبليكس)",
    muscleGroup: "core",
    equipment: "cable",
  },
  crunch: {
    name: "Crunch عادي (بطن علوي)",
    muscleGroup: "core",
    equipment: "bodyweight",
  },
  "russian-twist": {
    name: "Russian Twist (جوانب البطن)",
    muscleGroup: "core",
    equipment: "bodyweight",
  },
  "floor-leg-raise": {
    name: "Leg Raise أرضي (بطن سفلي)",
    muscleGroup: "core",
    equipment: "bodyweight",
  },
};

const PROGRAM: {
  slug: string;
  name: string;
  focus: string;
  exercises: string[];
}[] = [
  {
    slug: "push",
    name: "Push",
    focus: "الصدر · الكتف · التراي",
    exercises: [
      "chest-press-machine",
      "incline-chest-press",
      "pec-deck",
      "shoulder-press-machine",
      "cable-lateral-raise",
      "triceps-pushdown",
    ],
  },
  {
    slug: "pull",
    name: "Pull",
    focus: "الظهر · الباي",
    exercises: [
      "lat-pulldown",
      "seated-row",
      "pullover-machine",
      "face-pull",
      "shrugs",
      "cable-curl",
      "preacher-curl-machine",
    ],
  },
  {
    slug: "legs",
    name: "Legs",
    focus: "الأرجل · البطن",
    exercises: [
      "leg-press",
      "hack-squat",
      "leg-extension",
      "leg-curl",
      "calf-raise",
      "cable-crunch",
      "hanging-leg-raise",
      "cable-woodchopper",
    ],
  },
  {
    slug: "upper",
    name: "Upper",
    focus: "الجزء العلوي (صيانة)",
    exercises: [
      "incline-chest-press",
      "wide-seated-row",
      "machine-lateral-raise",
      "hammer-curl",
      "overhead-triceps-extension",
    ],
  },
  {
    slug: "lower",
    name: "Lower",
    focus: "خلفية الفخذ · الجلوت",
    exercises: [
      "romanian-deadlift",
      "hip-thrust-machine",
      "leg-curl",
      "leg-extension",
      "calf-raise",
    ],
  },
  {
    slug: "off",
    name: "Off Day",
    focus: "بطن وراحة نشطة",
    exercises: ["superman", "crunch", "russian-twist", "floor-leg-raise"],
  },
];

export const DEFAULT_SETTINGS = {
  unit: "kg" as const,
  weeklyGoal: 5,
  bodyWeightKg: null,
  targets: { kcal: 2600, protein: 160, carbs: 300, fat: 80 },
  /* Two minutes is the compromise a hypertrophy session actually lives on:
     long enough that the next set is not cut short by residual fatigue, short
     enough that eight exercises still fit in an hour. */
  restSeconds: 120,
  repMin: 8,
  repMax: 12,
  incrementKg: 2.5,
  restSound: true,
  restVibrate: true,
  restAutoStart: true,
  heightCm: null,
  /* 7 hours, 8,000 steps, 2.5 litres.
     Each is the low end of its useful band rather than the ideal: a target you
     clear four days out of seven teaches you to ignore it, and the point of
     these three is that they are met most nights, not that they are impressive
     once. */
  healthTargets: { sleepHours: 7, steps: 8000, waterMl: 2500 },
};

/** A pristine database: the full split, zero history. */
export function createSeedDatabase(now = Date.now()): Database {
  const exercises: Exercise[] = [];
  const idBySlug = new Map<string, string>();

  for (const [slug, meta] of Object.entries(CATALOG)) {
    const id = createId("ex");
    idBySlug.set(slug, id);
    exercises.push({
      id,
      name: meta.name,
      muscleGroup: meta.muscleGroup,
      equipment: meta.equipment,
      createdAt: now,
      archived: false,
      setup: "",
      repMin: null,
      repMax: null,
      incrementKg: null,
      restSeconds: null,
    });
  }

  const programDays: ProgramDay[] = PROGRAM.map((day, index) => ({
    id: createId("day"),
    slug: day.slug,
    name: day.name,
    focus: day.focus,
    order: index,
    exerciseIds: day.exercises
      .map((slug) => idBySlug.get(slug))
      .filter((id): id is string => typeof id === "string"),
  }));

  return {
    version: DB_VERSION,
    exercises,
    programDays,
    sessions: [],
    setEntries: [],
    athleticSessions: [],
    attendance: {},
    nutrition: {},
    bodyMetrics: {},
    health: {},
    settings: {
      ...DEFAULT_SETTINGS,
      targets: { ...DEFAULT_SETTINGS.targets },
      healthTargets: { ...DEFAULT_SETTINGS.healthTargets },
    },
    updatedAt: now,
  };
}

/** Best-effort muscle-group guess for a hand-typed exercise name. */
export function guessMuscleGroup(name: string): MuscleGroup {
  const n = name.toLowerCase();
  const has = (...needles: string[]) => needles.some((x) => n.includes(x));

  if (has("bench", "chest", "pec", "fly", "بنش", "صدر", "تفتيح")) return "chest";
  if (has("pulldown", "row", "pullover", "shrug", "deadlift", "ظهر", "سحب", "ترابيس"))
    return "back";
  if (has("shoulder", "lateral", "press military", "face pull", "كتف", "رفرفة"))
    return "shoulders";
  if (has("curl", "bicep", "باي")) return "biceps";
  if (has("tricep", "pushdown", "dip", "تراي")) return "triceps";
  if (has("squat", "leg press", "extension", "أمامية", "سكوات")) return "quads";
  if (has("leg curl", "hamstring", "rdl", "خلفية")) return "hamstrings";
  if (has("hip thrust", "glute", "جلوت")) return "glutes";
  if (has("calf", "بطة")) return "calves";
  if (has("crunch", "plank", "twist", "leg raise", "abs", "بطن", "أوبليك"))
    return "core";
  return "chest";
}
