/* --- النادي: ما فعله الجسم، وما صار إليه -------------------------------
 *  الروتين يعرف أنه ذهب إلى النادي؛ لا يعرف ماذا فعل هناك ولا إلى أين وصل
 *  جسمه. هذا الفرق هو سبب وجود هذا الملف: عادة «النادي» تُجاب بنعم أو لا،
 *  والسؤال الذي يبقى بعدها — «هل أتقدّم؟» — لا يُجاب إلا من صفوف مؤرَّخة
 *  تحمل وزناً وقياساً ودقائق.
 *
 *  أربع قوائم، وكل واحدة تجيب سؤالاً مختلفاً:
 *    `sports`   — الرياضات التي يمارسها، وهي ملكه: الجيم والبوكسنج مبدئياً،
 *                 وما بعدهما يضيفه بنفسه. موديول وليس حالة ثابتة.
 *    `workouts` — ما تدرَّبه فعلاً: صف لكل حصة، بدقائقها وشدّتها.
 *    `weighs`   — الوزن، قراءة واحدة لليوم (انظر `logWeigh` أدناه).
 *    `measures` — الشريط: الصدر والخصر وما قيس منهما، وما لم يُقس غائب.
 *
 *  وكل ما يقرأ أي رقم من هذه القوائم يقرأه من الدوال في أسفل هذا الملف، لا
 *  من حسابٍ خاص به — لأن الشاشة والبوت كلاهما يقول «تدرَّبت ٤ حصص هذا
 *  الأسبوع»، ونسختان من هذا الحساب هما إجابتان عن سؤال واحد.
 * --------------------------------------------------------------------- */
import {
  uid,
  obj,
  rows,
  dayKey,
  addDays,
  isKey,
  clampNum,
  daysBetween,
} from "./life-state-util.mjs";

/* --- السقوف ------------------------------------------------------------ *
 *  ثماني رياضات، لأن قائمة أطول من ذلك ليست ممارسة بل قائمة. وبقية السقوف
 *  هي نفس سبب `MONEY_CAP`: هذه القوائم تُغذّى من الهاتف، وقائمة بلا سقف هي
 *  حمولة تنمو حتى يفشل الحفظ. الأحدث أولاً في الثلاث، فالقطع يُسقط الأقدم.
 * ---------------------------------------------------------------------- */
export const SPORT_CAP = 8;
export const WORKOUT_CAP = 1000;
export const WEIGH_CAP = 500;
export const MEASURE_CAP = 500;
export const EXERCISE_LOG_CAP = 3000;
/* صورة كل شهرين، لثلاثين سنة، ما زالت دون هذا — السقف هنا ليس تقييداً
   واقعياً، هو فقط نفس قاعدة بقية القوائم: بلا سقف هي حمولة تنمو حتى
   يفشل الحفظ. */
export const PHOTO_CAP = 500;

/* شدّة الحصة: ثلاث درجات ولا أكثر. مقياس من عشرة يبدو أدقّ وهو ليس كذلك —
   لا أحد يميّز بين ٦ و٧ بعد أسبوع، والفرق الذي يُقرأ فعلاً هو خفيف/متوسط/
   عالٍ. والدرجة رقم لأن المتوسط يُحسب عليها. */
export const HARD_MIN = 1;
export const HARD_MAX = 3;
export const HARD_LABELS = { 1: "خفيف", 2: "متوسط", 3: "عالٍ" };

/* الصبغات المسموحة لرياضة. أسماء مفاتيح لا قيم ست عشرية، لأن هذا الملف لا
   يرى `T` ولا يجوز أن يراه: لون مكتوب هنا هو لون لا تستطيع الواجهة أن
   تعيد صبغه، وهي الجهة الوحيدة التي تعرف كيف تبدو السماء خلفه. */
export const SPORT_TINTS = ["primary", "danger", "accent", "sky", "violet", "ember"];

/* ما يقيسه الشريط. هنا وليس في الشاشة لأن البوت يسأل عنه أيضاً، وجدولان
   بأسماء القياسات هما جدولان يختلفان في أول يوم يُضاف فيه قياس. */
export const MEASURE_FIELDS = [
  { id: "chest", label: "الصدر" },
  { id: "waist", label: "الخصر" },
  { id: "hips", label: "الأرداف" },
  { id: "arm", label: "الذراع" },
  { id: "thigh", label: "الفخذ" },
  { id: "neck", label: "الرقبة" },
];

/* أبعد ما تُقرأ منه النوافذ أدناه. أربعة أشهر هي عمق لقطات القرص اليومية
   نفسه، وما قبلها لا يُقارن عليه أسبوع. */
export const GYM_REACH = 120;

/* كم يوماً بلا حصة يُقرأ غياباً يستحق باباً بدل حكم. نفس `COMEBACK_MIN`
   وبنفس السبب: من غاب أربعة أيام يفتح الشاشة ليعرف من أين يبدأ، لا ليقرأ
   أن أسبوعه صفر. */
export const GYM_AWAY = 4;

const gymStr = (v, max, fallback = "") => {
  const s = typeof v === "string" ? v.trim() : "";
  /* مقصوص ولا يُفرَّغ أبداً: نصّ كتبه بيده لا يُحذف صامتاً في دالة تجري
     على كل تحميل. نفس قاعدة `taskShape` مع `step`. */
  return s ? s.slice(0, max) : fallback;
};

/* مفتاح يوم، لأن كل نافذة أدناه تقارن هذه كنصوص: مفتاح ISO يُرتَّب
   معجمياً، وهو ما يجعل `>=` على تاريخ مقارنة صحيحة بلا `new Date()`. */
const dateOf = (v) => (isKey(v) ? v : dayKey());

/* رقم موجب أو لا شيء. و«لا شيء» هي `null` وليست صفراً، وهذا ليس تفصيلاً:
   خصر لم يُقس ليس خصراً صفر سنتيمتر، وجلسة شريط قاس فيها الخصر وحده يجب
   ألّا تكتب أصفاراً على الصدر — وإلا قرأ المخطّط انهياراً لم يحدث. نفس
   تمييز صفوف الفراغ في الأرشيف، مطبَّقاً على الشريط. */
const gymNum = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
};

export const sportShape = (s) => (
  (s = obj(s)),
  {
    id: s.id || uid(),
    label: gymStr(s.label, 40, "رياضة"),
    tint: SPORT_TINTS.includes(s.tint) ? s.tint : SPORT_TINTS[0],
    /* أصغر نسخة من هذه الرياضة — «عشر دقائق مشي» تحت «ساعة في النادي».
       نفس `habit.min` وبنفس الحجّة: اليوم الذي يموت فيه الانتظام ليس
       اليوم الصعب، بل اليوم المستحيل الذي كان الخيار الوحيد فيه هو
       التخطّي. و`migrate` لا يكتب حدًّا أدنى أبداً: ما يقبله في يوم سيّئ
       سؤال لا يجيبه إلا هو. */
    min: gymStr(s.min, 60),
    /* كم حصة في الأسبوع يريدها. صفر يعني «لم يحدّد»، وهو ليس «لا يريد» —
       ولذلك لا تُحسب عليه نسبة إنجاز. */
    weekly: clampNum(s.weekly, 0, 14, 0),
    off: !!s.off,
  }
);

export const workoutShape = (w) => (
  (w = obj(w)),
  {
    id: w.id || uid(),
    date: dateOf(w.date),
    /* معرّف الرياضة، لا اسمها: رياضة أعاد تسميتها يجب أن تحمل معها كل
       حصصها، واسم مكتوب في ألف صف هو ألف موضع لتغييره. */
    sport: gymStr(w.sport, 20),
    title: gymStr(w.title, 80, "حصة"),
    minutes: clampNum(w.minutes, 0, 600, 0),
    hard: clampNum(w.hard, HARD_MIN, HARD_MAX, 2),
    /* تفاصيلها الحرّة بكلماته — يبقى حقلاً نصّياً لأي شيء لا يغطّيه
       `rounds`/`roundMin` أدناه: مسافة، وزن الحديد، أي ملاحظة. */
    detail: gymStr(w.detail, 300),
    /* عدد الجولات ومدة الجولة — حقلان مهيكلان لا نصّ حرّ، لأن البوكسنج
       والفترات (HIIT) سؤالهما عدديّ فعلاً: «كم جولة» و«كم دقيقة لكل
       جولة» تحليلان حقيقيان لا تُقرأ من جملة «٦ جولات × ٣ دقائق» بلا
       تفكيكها يدوياً كل مرة. `null` حين لم يُدخَلا — حصة جيم عادية ليس
       لها جولات، وصفر ليس نفس معنى «لا يُقال». اختياريان ومستقلّان عن
       `minutes`: من يعرف مدته الكلية ولا يريد تفكيكها لجولات يملؤها هي
       فقط. */
    rounds: gymNum(w.rounds),
    roundMin: gymNum(w.roundMin),
    /* حصة الحدّ الأدنى تُحتسَب حصة — تماماً كتكّة العادة الصغيرة. تُعلَّم
       ولا تُخصَم، لأن إنجازاً يدفع أقل من الذي بجانبه يُقرأ أقل قيمة، وكل
       قيمة الحدّ الأدنى أن أخذه ليس هزيمة. */
    tiny: !!w.tiny,
  }
);

/* الوزن. `fat` نسبة دهون اختيارية، و`note` سببٌ لقراءة شاذة («بعد سفر») —
   لأن رقماً غريباً بلا سبب يُقرأ خطأً في الميزان بعد شهر. */
export const weighShape = (g) => (
  (g = obj(g)),
  {
    id: g.id || uid(),
    date: dateOf(g.date),
    kg: gymNum(g.kg),
    fat: gymNum(g.fat),
    note: gymStr(g.note, 120),
  }
);

export const measureShape = (m) => (
  (m = obj(m)),
  {
    id: m.id || uid(),
    date: dateOf(m.date),
    /* ما قيس فقط. الحقل الغائب غائب، لا صفر — انظر `num` أعلاه. */
    ...MEASURE_FIELDS.reduce((o, f) => ((o[f.id] = gymNum(m[f.id])), o), {}),
    note: gymStr(m.note, 120),
  }
);

/* صورة التقدّم — بيانات وصفية فقط، لا بايتات. البايتات في `gym-photos/`
   على القرص خارج `lifeos.json` تماماً، وهذا السطر لا يحمل غير اسم الملف
   هناك — انظر التعليق على `GYM_PHOTOS` في `local-sync-server.js` لسبب
   الفصل. `filename` تُرفَض إن لم تُطابق الصيغة التي يكتبها الخادم فعلاً
   (`YYYY-MM-DD-<معرّف>.jpg`)، لأن اسماً لا يطابقها صف يشير إلى صورة لن
   توجد أبداً. */
const PHOTO_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{6,12}\.jpg$/;
export const photoShape = (p) => (
  (p = obj(p)),
  {
    id: p.id || uid(),
    date: dateOf(p.date),
    filename: typeof p.filename === "string" && PHOTO_NAME.test(p.filename) ? p.filename : "",
    note: gymStr(p.note, 120),
  }
);

/* الهدف: وزن وتاريخ وكلمة. التاريخ مفتاح يوم لأن «باقي ١٤٨ يوماً» تُحسب
   منه، و`kg` قد يكون `null` — هدف بلا رقم هدف لم يُحدّد بعد، وليس صفراً. */
export const targetShape = (t) => (
  (t = obj(t)),
  {
    kg: gymNum(t.kg),
    date: isKey(t.date) ? t.date : "",
    note: gymStr(t.note, 120),
  }
);

/* أيام الأسبوع كاملة — سبعة، لا ستة. `UNI_DAYS` في `life-state-uni.mjs`
   تبدو الجدول الجاهز المناسب وهي ليست كذلك: تلك قائمة أيام الجامعة
   وتُسقط الجمعة عمداً لأن الجامعة لا تُدرِّس فيه، والنادي يُمارَس فيه
   كأي يوم آخر. جدول ثانٍ هنا إذن ليس ازدواجاً، بل الفرق الذي يمنع
   برنامج الأسبوع من أن يفقد يوماً كاملاً صامتاً. */
export const GYM_DAYS = [
  { d: 0, label: "الأحد" },
  { d: 1, label: "الإثنين" },
  { d: 2, label: "الثلاثاء" },
  { d: 3, label: "الأربعاء" },
  { d: 4, label: "الخميس" },
  { d: 5, label: "الجمعة" },
  { d: 6, label: "السبت" },
];

/* برنامج الأسبوع: معرّف رياضة لكل يوم، أو `"rest"` لراحة مقصودة، أو فراغ
   ليوم لم يُخطَّط. والفرق بين الثلاثة هو ما يجعل `gymRun` أدناه ممكنة:
   يوم راحة مخطَّط ليس يوماً فائتاً. */
export const REST_DAY = "rest";
const planOf = (p) => {
  p = obj(p);
  const out = {};
  for (let d = 0; d <= 6; d++) {
    const v = p[d];
    out[d] = v === REST_DAY ? REST_DAY : gymStr(v, 20);
  }
  return out;
};

/* الرياضتان التي سمّاهما. والبذرة بذرة: ما بعدهما يضيفه بنفسه، و`migrate`
   لا تخترع رياضة ثالثة — أيّ رياضة يمارسها سؤال لا تجيبه ترقية. */
export const SEED_SPORTS = () => [
  { id: uid(), label: "الجيم", tint: "primary", min: "", weekly: 4, off: false },
  { id: uid(), label: "البوكسنج", tint: "danger", min: "", weekly: 2, off: false },
];

/* البرنامج الافتراضي للتمارين (Push / Pull / Legs) — مأخوذ من سجل التمارين الشخصي */
export const DEFAULT_PROGRAM = [
  { id: "push", title: "Day 1 — Push", focus: "صدر وأكتاف وتراي", exercises: ["Chest Press", "Incline Dumbbell Press", "Shoulder Press", "Lateral Raises", "Cable Tricep Pushdown"] },
  { id: "pull", title: "Day 2 — Pull", focus: "ظهر وباي ومثلثات", exercises: ["Wide Lat Pulldown", "Wide Seated Row", "Dumbbell Row", "Face Pull", "Incline Dumbbell Curl", "Cable Bicep Curl"] },
  { id: "legs1", title: "Day 3 — Legs (Quad Focus)", focus: "أرجل أمامية وبطات", exercises: ["Squat / Leg Press", "Leg Extension", "Standing Calf Raises"] },
  { id: "upper", title: "Day 4 — Upper", focus: "علوي شامل", exercises: ["Incline Chest Press", "Wide Lat Pulldown", "Wide Seated Row", "Shoulder Press", "Lateral Raises"] },
  { id: "legs2", title: "Day 5 — Legs (Posterior Focus)", focus: "أرجل خلفية وهمسترنج", exercises: ["Romanian Deadlift", "Leg Curl", "Leg Press (Light)", "Seated Calf Raises"] },
];

export const routineShape = (r) => {
  r = obj(r);
  const exList = Array.isArray(r.exercises) ? r.exercises : [];
  return {
    id: r.id || uid(),
    title: gymStr(r.title, 80, "يوم تدريبي"),
    focus: gymStr(r.focus, 120),
    exercises: exList.map((e) => gymStr(typeof e === "string" ? e : e?.name, 80)).filter(Boolean),
  };
};

/* أنواع الجلسات: الإحماء لا يدخل في حساب الأرقام القياسية ولا الحجم الفعلي */
export const SET_TYPES = ["working", "warmup", "failure", "dropset"];
export const SET_TYPE_LABELS = {
  working: "أساسي",
  warmup: "إحماء",
  failure: "فشل عضلي",
  dropset: "دروب سيت",
};

/* معادلة Epley لحساب أقصى وزن لعدّة واحدة (Estimated 1RM) */
export const estimate1RM = (weight, reps) => {
  const wt = Number(weight);
  const rp = Number(reps);
  if (!Number.isFinite(wt) || wt <= 0 || !Number.isFinite(rp) || rp <= 0) return 0;
  if (rp === 1) return Math.round(wt * 10) / 10;
  const cappedReps = Math.min(rp, 30);
  return Math.round(wt * (1 + cappedReps / 30) * 10) / 10;
};

export const exerciseLogShape = (l) => {
  l = obj(l);
  const wt = Number(l.weight);
  const cleanWt = Number.isFinite(wt) && wt >= 0 ? Math.round(wt * 10) / 10 : 0;
  const cleanReps = clampNum(l.reps, 1, 999, 10);
  const cleanSets = clampNum(l.sets, 1, 50, 1);
  const setType = SET_TYPES.includes(l.setType) ? l.setType : "working";
  const isWarmup = setType === "warmup";
  return {
    id: l.id || uid(),
    date: dateOf(l.date),
    exercise: gymStr(l.exercise, 80, "تمرين"),
    weight: cleanWt,
    reps: cleanReps,
    sets: cleanSets,
    setType,
    orm: isWarmup ? 0 : estimate1RM(cleanWt, cleanReps),
    volume: isWarmup ? 0 : Math.round(cleanWt * cleanReps * cleanSets * 10) / 10,
    rpe: clampNum(l.rpe, 1, 10, null),
    note: gymStr(l.note, 120),
    isPR: isWarmup ? false : !!l.isPR,
    is1RMPR: isWarmup ? false : !!l.is1RMPR,
  };
};

export const gymShape = (g) => {
  g = obj(g);
  const sports = rows(g.sports).map(sportShape).slice(0, SPORT_CAP);
  const rawRoutines = rows(g.routines);
  const routines = rawRoutines.length ? rawRoutines.map(routineShape) : DEFAULT_PROGRAM.map(routineShape);
  const rawEx = rows(g.exerciseLogs || g.logs);
  const exerciseLogs = rawEx
    .map(exerciseLogShape)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, EXERCISE_LOG_CAP);

  return {
    sports: sports.length ? sports : SEED_SPORTS(),
    /* الأحدث أولاً في الثلاث، فالقطع يُسقط الأقدم لا الأحدث. */
    workouts: rows(g.workouts)
      .map(workoutShape)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, WORKOUT_CAP),
    weighs: rows(g.weighs)
      .map(weighShape)
      .filter((w) => w.kg !== null)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, WEIGH_CAP),
    measures: rows(g.measures)
      .map(measureShape)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, MEASURE_CAP),
    target: targetShape(g.target),
    plan: planOf(g.plan),
    routines,
    exerciseLogs,
    photos: rows(g.photos)
      .map(photoShape)
      .filter((p) => p.filename)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, PHOTO_CAP),
  };
};

/* يَعبُر دوران اليوم كاملاً: كل صف فيه مؤرَّخ بتاريخه، فلا شيء منه ينتمي
   إلى «اليوم» ليُصفَّر — تماماً كأحداث التقويم وقوائم المال. */
export const gymCarry = (g) => gymShape(g);

/* --- الكتابة ----------------------------------------------------------- *
 *  دوال تعيد نادياً جديداً، لأن الشاشة والبوت كلاهما يكتب هذه الصفوف،
 *  وكاتبان لكل منهما نسخته من الترتيب والسقف هما كاتبان يختلفان يوماً ما.
 * ---------------------------------------------------------------------- */

export const logWorkout = (gym, w) => {
  const g = gymShape(gym);
  return { ...g, workouts: [workoutShape(w), ...g.workouts].slice(0, WORKOUT_CAP) };
};

/* الوزن: قراءة واحدة لليوم، تُستبدَل ولا تُضاف. وزن سُجّل مرتين في صباح
   واحد ليس حقيقتين بل حقيقة صُحِّحت، ولو أُضيف صفّان لليوم نفسه لصار
   «متوسط الأسبوع» يعتمد على عدد مرات وقوفه على الميزان. */
export const logWeigh = (gym, w) => {
  const g = gymShape(gym);
  const row = weighShape(w);
  if (row.kg === null) return g;
  const rest = g.weighs.filter((x) => x.date !== row.date);
  return {
    ...g,
    weighs: [row, ...rest]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, WEIGH_CAP),
  };
};

/* القياس: نفس القاعدة، ولسبب أقوى — جلستا شريط في يوم واحد ستختلفان
   بسنتيمتر من مكان وضع الشريط لا من الجسم. والدمج هنا دمج وليس استبدالاً:
   من قاس الخصر صباحاً والصدر مساءً قاس الاثنين اليوم، فحقل غائب في
   الكتابة الثانية لا يمحو حقلاً كُتب في الأولى. */
export const logMeasure = (gym, m) => {
  const g = gymShape(gym);
  const row = measureShape(m);
  const prev = g.measures.find((x) => x.date === row.date);
  const merged = prev
    ? measureShape({
        ...prev,
        ...MEASURE_FIELDS.reduce(
          (o, f) => ((o[f.id] = row[f.id] ?? prev[f.id]), o),
          {},
        ),
        note: row.note || prev.note,
        id: prev.id,
        date: prev.date,
      })
    : row;
  const rest = g.measures.filter((x) => x.date !== row.date);
  return {
    ...g,
    measures: [merged, ...rest]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, MEASURE_CAP),
  };
};

/* حصة سُجّلت بالغلط — لا تصحيح يستبدلها كالوزن، لأن حصتين في يوم واحد
   حقيقتان منفصلتان وليستا تصحيحاً لبعضهما. حذف مباشر بالمعرّف. */
export const deleteWorkout = (gym, id) => {
  const g = gymShape(gym);
  return { ...g, workouts: g.workouts.filter((w) => w.id !== id) };
};

/* صورة تقدّم. على خلاف الوزن، أكثر من صورة بنفس اليوم تُضاف ولا تستبدل —
   زاوية أمامية وزاوية جانبية في نفس الجلسة صورتان مختلفتان، لا تصحيح
   لبعضهما. البايتات نفسها رُفعت مسبقاً بطلب منفصل إلى `/gym-photos`
   (انظر `apps/gym/lib/photos.js`)؛ هذه الدالة تكتب السطر الذي يشير إليها
   فقط، بعد أن صار الملف موجوداً فعلاً على القرص. */
export const logPhoto = (gym, row) => {
  const g = gymShape(gym);
  const shaped = photoShape(row);
  if (!shaped.filename) return g;
  return { ...g, photos: [shaped, ...g.photos].slice(0, PHOTO_CAP) };
};

/* حذف سطر الصورة من الحالة. لا تحذف البايتات من القرص — ذاك طلب DELETE
   منفصل إلى `/gym-photos/delete` من الموقع نفسه، لأن هذه الدالة طبقة
   حالة بحتة لا ترى الشبكة ولا القرص. */
export const deletePhoto = (gym, id) => {
  const g = gymShape(gym);
  return { ...g, photos: g.photos.filter((p) => p.id !== id) };
};

/* تسجيل أداء تمرين (الوزن والتكرارات والجلسات) مع رصد الأرقام القياسية (PR) تلقائياً */
export const logExercise = (gym, row) => {
  const g = gymShape(gym);
  const shaped = exerciseLogShape(row);
  if (shaped.setType !== "warmup") {
    const norm = shaped.exercise.toLowerCase();
    const prevLogs = g.exerciseLogs.filter(
      (x) => x.exercise.toLowerCase() === norm && x.setType !== "warmup"
    );
    const maxPrevWeight = prevLogs.reduce((m, x) => Math.max(m, x.weight || 0), 0);
    const maxPrevORM = prevLogs.reduce((m, x) => Math.max(m, x.orm || estimate1RM(x.weight, x.reps)), 0);
    if (shaped.weight > maxPrevWeight && maxPrevWeight > 0) {
      shaped.isPR = true;
    }
    if (shaped.orm > maxPrevORM && maxPrevORM > 0) {
      shaped.is1RMPR = true;
    }
  }
  return {
    ...g,
    exerciseLogs: [shaped, ...g.exerciseLogs].slice(0, EXERCISE_LOG_CAP),
  };
};

export const deleteExerciseLog = (gym, id) => {
  const g = gymShape(gym);
  return {
    ...g,
    exerciseLogs: g.exerciseLogs.filter((x) => x.id !== id),
  };
};

export const saveRoutines = (gym, routines) => {
  const g = gymShape(gym);
  return {
    ...g,
    routines: rows(routines).map(routineShape),
  };
};

/* تعديل اسم تمرين في جدول التمارين وتحديث كافة سجلاته التاريخية وأرقامه القياسية */
export const renameExerciseInGym = (gym, routineId, oldName, newName) => {
  const g = gymShape(gym);
  const cleanOld = (oldName || "").trim();
  const cleanNew = (newName || "").trim();
  if (!cleanNew || cleanOld.toLowerCase() === cleanNew.toLowerCase()) return g;

  const routines = g.routines.map((r) => {
    if (routineId && r.id !== routineId) return r;
    return {
      ...r,
      exercises: r.exercises.map((e) => (e.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : e)),
    };
  });

  const exerciseLogs = g.exerciseLogs.map((log) => {
    if (log.exercise.toLowerCase() === cleanOld.toLowerCase()) {
      return { ...log, exercise: cleanNew };
    }
    return log;
  });

  return { ...g, routines, exerciseLogs };
};

export const lastExerciseLog = (gym, exerciseName) => {
  const g = gymShape(gym);
  const norm = (exerciseName || "").trim().toLowerCase();
  return (
    g.exerciseLogs.find((x) => x.exercise.toLowerCase() === norm && x.setType !== "warmup") ||
    g.exerciseLogs.find((x) => x.exercise.toLowerCase() === norm) ||
    null
  );
};

export const exerciseHistory = (gym, exerciseName, limit = 20) => {
  const g = gymShape(gym);
  const norm = (exerciseName || "").trim().toLowerCase();
  return g.exerciseLogs.filter((x) => x.exercise.toLowerCase() === norm).slice(0, limit);
};

export const exercisePRs = (gym) => {
  const g = gymShape(gym);
  const map = new Map();
  for (const log of g.exerciseLogs) {
    if (log.setType === "warmup") continue;
    const k = log.exercise;
    const cur = map.get(k);
    const logOrm = log.orm || estimate1RM(log.weight, log.reps);
    const curOrm = cur ? cur.orm || estimate1RM(cur.weight, cur.reps) : 0;
    if (!cur || (log.weight || 0) > (cur.weight || 0) || ((log.weight || 0) === (cur.weight || 0) && logOrm > curOrm)) {
      map.set(k, { ...log, orm: logOrm });
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.weight || 0) - (a.weight || 0));
};

/* المدرب الذكي للزيادة التدريجية (Double Progression Coach: 8–12 تكرار) */
export const exerciseAdvice = (gym, exerciseName, repMin = 8, repMax = 12) => {
  const last = lastExerciseLog(gym, exerciseName);
  if (!last || !last.weight) {
    return {
      action: "start",
      text: `اختر وزناً مناسباً لـ ${repMin}–${repMax} تكرار بأداء متقن`,
      targetWeight: null,
      targetReps: 10,
    };
  }
  if (last.reps >= repMax) {
    const nextWt = Math.round((last.weight + 2.5) * 10) / 10;
    return {
      action: "up",
      text: `🎯 أتقنت ${last.reps} عدّة المرة الماضية — ارفع الوزن اليوم إلى ${nextWt} كجم`,
      targetWeight: nextWt,
      targetReps: repMin,
    };
  }
  if (last.reps >= repMin) {
    const nextReps = last.reps + 1;
    return {
      action: "reps",
      text: `💪 ثبّت الوزن على ${last.weight} كجم واستهدف ${nextReps} تكرار اليوم`,
      targetWeight: last.weight,
      targetReps: nextReps,
    };
  }
  return {
    action: "hold",
    text: `⚖️ استمر على ${last.weight} كجم حتى تصل إلى ${repMin} تكرارات كاملة`,
    targetWeight: last.weight,
    targetReps: repMin,
  };
};

/* مجموعات العضلات وتوازن الجلسات الأسبوعي (Weekly Muscle Volume Landmarks) */
export const MUSCLE_GROUPS = [
  { id: "chest", label: "الصدر", targetSets: 12, keywords: ["chest", "incline", "bench", "fly", "pec", "صدر", "بنش", "تفتيح"] },
  { id: "back", label: "الظهر", targetSets: 14, keywords: ["lat", "pulldown", "row", "pull-up", "chin", "ظهر", "سحب", "منشار", "تي بار"] },
  { id: "shoulders", label: "الأكتاف", targetSets: 12, keywords: ["shoulder", "lateral", "face pull", "deltoid", "overhead", "military", "كتف", "أكتاف", "رفرفة"] },
  { id: "quads", label: "الأرجل الأمامية", targetSets: 10, keywords: ["squat", "leg press", "leg extension", "lunge", "quad", "سكوات", "دفش", "أمامي", "افخاذ"] },
  { id: "hamstrings", label: "الأرجل الخلفية", targetSets: 8, keywords: ["romanian", "deadlift", "leg curl", "hamstring", "glute", "hip thrust", "ديدليفت", "خلفي", "همسترنج"] },
  { id: "arms", label: "الذراعين (باي وتراي)", targetSets: 10, keywords: ["tricep", "bicep", "curl", "pushdown", "extension", "skull", "hammer", "باي", "تراي", "ذراع"] },
  { id: "calves", label: "البطات", targetSets: 8, keywords: ["calf", "calves", "بطات", "سمانة"] },
];

export const exerciseMuscleOf = (exerciseName) => {
  const low = String(exerciseName || "").toLowerCase();
  if (low.includes("incline chest") || low.includes("incline dumbbell press") || low.includes("chest press")) return "chest";
  if (low.includes("incline dumbbell curl")) return "arms";
  if (low.includes("leg extension")) return "quads";
  for (const m of MUSCLE_GROUPS) {
    if (m.keywords.some((kw) => low.includes(kw))) return m.id;
  }
  return "chest";
};

export const muscleVolume = (gym, days = 7, today = dayKey()) => {
  const g = gymShape(gym);
  const from = addDays(today, -(Math.max(1, Math.round(days)) - 1));
  const recent = g.exerciseLogs.filter((x) => x.date >= from && x.date <= today && x.setType !== "warmup");
  return MUSCLE_GROUPS.map((m) => {
    const matching = recent.filter((x) => exerciseMuscleOf(x.exercise) === m.id);
    const sets = matching.reduce((sum, x) => sum + (Number(x.sets) || 1), 0);
    const volume = Math.round(matching.reduce((sum, x) => sum + (x.volume || (x.weight || 0) * (x.reps || 0) * (x.sets || 1)), 0));
    const pct = Math.min(100, Math.round((sets / m.targetSets) * 100));
    const status = sets === 0 ? "none" : sets < Math.ceil(m.targetSets * 0.5) ? "low" : sets >= m.targetSets ? "optimal" : "building";
    return {
      id: m.id,
      label: m.label,
      sets,
      targetSets: m.targetSets,
      volume,
      pct,
      status,
    };
  });
};

/* المتوسط المتحرك الأسي للوزن (7-Day EMA True Weight Trend) مثل MacroFactor */
export const weighMovingAverage = (gym, days = 30, today = dayKey()) => {
  const g = gymShape(gym);
  if (!g.weighs.length) return { points: [], latestRaw: null, latestEma: null, emaDelta: null };
  const chronological = [...g.weighs].reverse();
  const alpha = 2 / (7 + 1); // 0.25 (7-day EMA)
  let currentEma = chronological[0].kg;
  const allPoints = chronological.map((w, idx) => {
    currentEma = idx === 0 ? w.kg : alpha * w.kg + (1 - alpha) * currentEma;
    const roundedEma = Math.round(currentEma * 10) / 10;
    return {
      date: w.date,
      kg: w.kg,
      ema: roundedEma,
      diff: Math.round((w.kg - roundedEma) * 10) / 10,
    };
  });
  const from = addDays(today, -(Math.max(1, Math.round(days)) - 1));
  const windowPts = allPoints.filter((p) => p.date >= from && p.date <= today);
  const points = windowPts.length ? windowPts : allPoints.slice(-Math.min(allPoints.length, 15));
  const latest = allPoints[allPoints.length - 1];
  const firstInWindow = points[0];
  const emaDelta =
    points.length >= 2 ? Math.round((latest.ema - firstInWindow.ema) * 10) / 10 : null;
  return {
    points,
    latestRaw: latest.kg,
    latestEma: latest.ema,
    emaDelta,
  };
};

export const exerciseProgressReport = (gym, days = 30, today = dayKey()) => {
  const g = gymShape(gym);
  const cutoff = addDays(today, -days);
  const inRange = g.exerciseLogs.filter((x) => x.date >= cutoff && x.setType !== "warmup");
  const groups = new Map();
  for (const log of inRange) {
    if (!groups.has(log.exercise)) groups.set(log.exercise, []);
    groups.get(log.exercise).push(log);
  }
  const report = [];
  for (const [ex, entries] of groups.entries()) {
    if (entries.length < 1) continue;
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const delta = (last.weight || 0) - (first.weight || 0);
    const firstOrm = first.orm || estimate1RM(first.weight, first.reps);
    const lastOrm = last.orm || estimate1RM(last.weight, last.reps);
    const ormDelta = Math.round((lastOrm - firstOrm) * 10) / 10;
    report.push({
      exercise: ex,
      first,
      last,
      delta: Math.round(delta * 10) / 10,
      ormDelta,
      lastOrm,
      count: entries.length,
    });
  }
  return report.sort((a, b) => b.delta - a.delta);
};

/* --- القراءات ---------------------------------------------------------- *
 *  نقية، وهنا لا في الشاشة، لأن الشاشة ليست القارئ الوحيد: البوت يرسل
 *  حصص الأسبوع في ملخّصه، والتحليل أدناه يُبنى على هذه الدوال نفسها. ولا
 *  واحدة منها تخترع رقماً: كل رقم مشتقّ من صف مكتوب.
 * ---------------------------------------------------------------------- */

export const sportOf = (gym, id) =>
  gymShape(gym).sports.find((s) => s.id === id) || null;

export const liveSports = (gym) => gymShape(gym).sports.filter((s) => !s.off);

/* الصفوف المؤرَّخة داخل آخر `days` يوماً، اليوم ضمنها. محسوبة على اليوم
   المنطقي كبقية التطبيق، فحصة الواحدة صباحاً تنتمي إلى الليلة التي
   تُدرَّبت فيها. */
export const workoutsIn = (gym, days, today = dayKey()) => {
  const from = addDays(today, -(Math.max(1, Math.round(days)) - 1));
  return gymShape(gym).workouts.filter((w) => w.date >= from && w.date <= today);
};

export const minutesOf = (list) =>
  rows(list).reduce((n, w) => n + (Number(w.minutes) || 0), 0);

/* حمل رياضة بعينها: كم حصة وكم دقيقة في النافذة. */
export const sportLoad = (gym, sportId, days = 7, today = dayKey()) => {
  const list = workoutsIn(gym, days, today).filter((w) => w.sport === sportId);
  return { count: list.length, minutes: minutesOf(list) };
};

/* الأيام المتميّزة التي فيها حصة. تُحسب بالأيام لا بالصفوف لأن حصّتين في
   يوم واحد يوم واحد من الانتظام، لا يومان. */
export const gymDays = (gym, days = 7, today = dayKey()) =>
  new Set(workoutsIn(gym, days, today).map((w) => w.date)).size;

export const lastWorkoutOn = (gym) => gymShape(gym).workouts[0]?.date || "";

/* كم يوماً مضى بلا حصة. `null` لمن لم يسجّل حصة قط — «غاب ٢٠٠ يوم» في
   ملف جديد ليس غياباً بل ملف جديد. */
export const restDays = (gym, today = dayKey()) => {
  const last = lastWorkoutOn(gym);
  return last ? Math.max(0, daysBetween(last, today)) : null;
};

/* أسبوع واحد: ما أُنجز، وما خطّط له، ودقائقه، وتوزيعه على الرياضات.
   المخطَّط هو مجموع `weekly` للرياضات العاملة — ومن لم يحدّد عدداً لا
   يُحسب عليه، فلا يُقرأ تقصيراً لم يَعِد به أحد. */
export const weekLoad = (gym, today = dayKey()) => {
  const g = gymShape(gym);
  const list = workoutsIn(g, 7, today);
  const live = liveSports(g);
  const planned = live.reduce((n, s) => n + s.weekly, 0);
  return {
    done: list.length,
    planned,
    minutes: minutesOf(list),
    days: new Set(list.map((w) => w.date)).size,
    bySport: live.map((s) => {
      const mine = list.filter((w) => w.sport === s.id);
      return {
        id: s.id,
        label: s.label,
        tint: s.tint,
        count: mine.length,
        minutes: minutesOf(mine),
        weekly: s.weekly,
        /* نسبة لمن حدّد عدداً فقط. بلا عدد تبقى `null`، ولا تُرسم ٠٪
           على رياضة لم يَعِد لها بشيء. */
        pct: s.weekly ? Math.min(100, Math.round((mine.length / s.weekly) * 100)) : null,
      };
    }),
  };
};

/* السلسلة: أيام متتالية إلى الوراء، يقطعها يوم بلا حصة **إلا أن يكون
   البرنامج قد سمّاه راحة**. هذا هو الفرق الذي يجعل العدّاد صادقاً مع
   برنامج فيه أيام راحة: من خطّط الأحد راحة وأخذها لم يفوّت شيئاً، وعدّاد
   يقطع عليه الأحد هو عدّاد يعاقبه على اتّباع برنامجه. يوم بلا حصة وبلا
   خطة راحة هو ما ينهي العدّ. اليوم الجاري لا يقطع: لم ينتهِ بعد. */
export const gymRun = (gym, today = dayKey()) => {
  const g = gymShape(gym);
  if (!g.workouts.length) return 0;
  const has = new Set(g.workouts.map((w) => w.date));
  const first = g.workouts[g.workouts.length - 1].date;
  let run = 0;
  for (let i = 0; i < GYM_REACH; i++) {
    const d = addDays(today, -i);
    if (d < first) break;
    if (has.has(d)) {
      run++;
      continue;
    }
    const weekday = new Date(d + "T12:00:00").getDay();
    if (g.plan[weekday] === REST_DAY) continue;
    /* اليوم الجاري لا يُنهي عدًّا — من لم يتدرّب بعد لم يفوّت. */
    if (i === 0) continue;
    break;
  }
  return run;
};

export const latestWeigh = (gym) => gymShape(gym).weighs[0] || null;

/* فرق الوزن عبر نافذة: الأحدث ناقص أقدم قراءة داخلها. `null` حين لا يوجد
   طرفان للمقارنة — فرق محسوب على قراءة واحدة ليس فرقاً. */
export const weighTrend = (gym, days = 30, today = dayKey()) => {
  const from = addDays(today, -(Math.max(2, Math.round(days)) - 1));
  const list = gymShape(gym).weighs.filter((w) => w.date >= from && w.date <= today);
  if (list.length < 2) return null;
  const now = list[0];
  const then = list[list.length - 1];
  return {
    from: then.kg,
    to: now.kg,
    delta: Math.round((now.kg - then.kg) * 10) / 10,
    days: Math.max(1, daysBetween(then.date, now.date)),
  };
};

/* آخر قراءة حملت نسبة دهون فعلاً — لا آخر قراءة وزن مطلقاً. وزن اليوم قد
   يُسجَّل بلا دهون، وهذا لا يعني أن آخر نسبة دهون معروفة صارت قديمة. */
export const latestFat = (gym) => gymShape(gym).weighs.find((w) => w.fat !== null) || null;

/* نفس `weighTrend` بالحرف، على حقل `fat` بدل `kg` — ومصفّى أولاً لأن
   `weighs` تحمل صفوفاً كثيرة بلا دهون مسجَّلة، خلافاً للوزن الذي لا يدخل
   القائمة أصلاً إلا بقيمة. */
export const fatTrend = (gym, days = 30, today = dayKey()) => {
  const from = addDays(today, -(Math.max(2, Math.round(days)) - 1));
  const list = gymShape(gym)
    .weighs.filter((w) => w.date >= from && w.date <= today && w.fat !== null);
  if (list.length < 2) return null;
  const now = list[0];
  const then = list[list.length - 1];
  return {
    from: then.fat,
    to: now.fat,
    delta: Math.round((now.fat - then.fat) * 10) / 10,
    days: Math.max(1, daysBetween(then.date, now.date)),
  };
};

export const latestMeasure = (gym) => gymShape(gym).measures[0] || null;

/* قياس اليوم مقابل القياس الذي قبله، حقلاً بحقل. الحقل الذي لم يُقس في
   أحدهما لا فرق له — `null` لا صفر، لأن «لم يُقس» و«لم يتغيّر» حقيقتان
   مختلفتان ولا يجوز أن تُرسما بالشكل نفسه. */
export const measureDelta = (gym) => {
  const g = gymShape(gym);
  const [now, prev] = g.measures;
  if (!now) return null;
  return {
    date: now.date,
    prev: prev?.date || "",
    fields: MEASURE_FIELDS.map((f) => ({
      id: f.id,
      label: f.label,
      value: now[f.id],
      delta:
        prev && now[f.id] !== null && prev[f.id] !== null
          ? Math.round((now[f.id] - prev[f.id]) * 10) / 10
          : null,
    })),
  };
};

/* الهدف، مقروءاً: أين هو الآن منه، وكم بقي من يوم. بلا وزن مستهدف أو بلا
   قراءة وزن واحدة لا تُحسب نسبة — نسبة من لا شيء ليست صفراً. */
export const targetStand = (gym, today = dayKey()) => {
  const g = gymShape(gym);
  const t = g.target;
  const now = latestWeigh(g);
  const left = t.date ? daysBetween(today, t.date) : null;
  if (t.kg === null || !now) {
    return { kg: t.kg, note: t.note, date: t.date, left, pct: null, gap: null };
  }
  /* نقطة البداية هي أقدم قراءة محفوظة: النسبة تقيس الطريق الذي قُطع
     فعلاً، ولا تُخترع نقطة انطلاق لم تُسجَّل. */
  const start = g.weighs[g.weighs.length - 1].kg;
  const span = start - t.kg;
  const walked = start - now.kg;
  const pct = span === 0 ? null : clampNum(Math.round((walked / span) * 100), 0, 100, 0);
  return {
    kg: t.kg,
    note: t.note,
    date: t.date,
    left,
    pct,
    gap: Math.round((now.kg - t.kg) * 10) / 10,
  };
};

/* --- التحليل ----------------------------------------------------------- *
 *  يقرّر بنفسه هل يتكلّم، وفي الأسبوع الذي يسير فيه كل شيء لا يقول شيئاً.
 *  هذا الصمت هو الميزة لا النقص: تحليل يصدر تقريراً كل يوم هو إشعار
 *  تتعلّم تمريره بلا قراءة، واليوم الوحيد الذي يكون فيه عنده ما يقال هو
 *  اليوم الذي تمرّره فيه أيضاً. نفس قاعدة `advise()` في البوت.
 *
 *  وثلاث قواعد تحكمه:
 *    • الغياب يُسكت الباقي. من غاب أسبوعاً لا يحتاج ثماني ملاحظات، يحتاج
 *      باباً واحداً.
 *    • لا رقم مخترع. كل رقم يخرج من الدوال أعلاه، أو لاختلف التحليل
 *      والشاشة عن اليوم نفسه.
 *    • الملاحظة تحمل فعلاً، لا درجة. «انتظامك ٤٠٪» حكم، و«باقي حصتان —
 *      الأدنى يكفي» حركة.
 * ---------------------------------------------------------------------- */
export const gymAdvise = (gym, today = dayKey()) => {
  const g = gymShape(gym);
  const out = [];
  if (!g.workouts.length && !g.weighs.length) return out;

  const away = restDays(g, today);
  if (away !== null && away >= GYM_AWAY) {
    const sport = liveSports(g)[0];
    out.push({
      id: "away",
      tone: "door",
      text: `آخر حصة قبل ${away} يوم. ابدأ بأقل شيء${sport?.min ? ` — ${sport.min}` : ""}.`,
    });
    /* باب واحد ولا شيء بعده. */
    return out;
  }

  const week = weekLoad(g, today);
  if (week.planned && week.done < week.planned) {
    const left = week.planned - week.done;
    out.push({
      id: "behind",
      tone: "push",
      text: `باقي ${left} من ${week.planned} حصة هذا الأسبوع.`,
    });
  }

  /* رياضة كانت تُمارَس وتوقّفت. الشهر الماضي هو ما يثبت أنها ممارسته، و
     عشرة أيام هي ما يجعل التوقّف واقعاً لا جدولاً مزدحماً. */
  for (const s of liveSports(g)) {
    const recent = sportLoad(g, s.id, 10, today).count;
    const month = sportLoad(g, s.id, 30, today).count;
    if (!recent && month) {
      const last = g.workouts.find((w) => w.sport === s.id);
      out.push({
        id: `cold:${s.id}`,
        tone: "push",
        text: `${s.label} لم يُسجَّل منذ ${daysBetween(last.date, today)} يوم.`,
      });
    }
  }

  const w = latestWeigh(g);
  if (w) {
    const old = daysBetween(w.date, today);
    if (old >= 10) {
      out.push({
        id: "weigh-stale",
        tone: "ask",
        text: `آخر وزن سُجّل قبل ${old} يوم — رقم لا يُقاس عليه اليوم.`,
      });
    }
    const trend = weighTrend(g, 30, today);
    const t = g.target;
    if (trend && trend.delta !== 0 && t.kg !== null) {
      /* الاتجاه الصحيح هو الاتجاه نحو هدفه، لا الهبوط دائماً: من يستهدف
         وزناً أعلى من وزنه الآن فالصعود تقدُّمه. */
      const want = t.kg < trend.to ? -1 : 1;
      const going = trend.delta < 0 ? -1 : 1;
      out.push(
        going === want
          ? {
              id: "trend-good",
              tone: "keep",
              text: `الوزن يتحرّك نحو هدفك: ${Math.abs(trend.delta)} كجم في ${trend.days} يوم.`,
            }
          : {
              id: "trend-away",
              tone: "ask",
              text: `الوزن يتحرّك بعيداً عن هدفك: ${Math.abs(trend.delta)} كجم في ${trend.days} يوم.`,
            },
      );
    }
  } else if (g.workouts.length) {
    out.push({
      id: "weigh-none",
      tone: "ask",
      text: "لا يوجد وزن مسجَّل — بلا قراءة واحدة لا يُقاس تقدّم.",
    });
  }

  const m = latestMeasure(g);
  if (m) {
    const old = daysBetween(m.date, today);
    if (old >= 30) {
      out.push({
        id: "measure-stale",
        tone: "ask",
        text: `آخر قياس بالشريط قبل ${old} يوم — الميزان وحده لا يرى شكل الجسم.`,
      });
    }
  }

  /* الإفراط والركود — قبل الخبر الجيّد، لأنهما تحذيران لا تهنئة. */
  const spike = tonnageSpike(g, today);
  if (spike && spike.spike) {
    out.push({
      id: "spike",
      tone: "ask",
      text: `حمل هذا الأسبوع ×${spike.ratio} من معتادك — فكّر بأسبوع أخفّ قبل إصابة إفراط.`,
    });
  }
  const stalls = stalledExercises(g, today);
  if (stalls.length) {
    const s = stalls[0];
    out.push({
      id: `stall:${s.exercise}`,
      tone: "push",
      text: `${s.exercise}: ${s.sessions} حصص بلا تقدّم على ${s.best} كجم — جرّب ديلود (خفّف الوزن ١٠٪ أسبوعاً) أو غيّر نطاق التكرار.`,
    });
  }

  /* أفضل أسبوع في شهرين. يُقال بعد الباقي لأنه خبر جيّد، والخبر الجيّد
     الذي يُقال أولاً يُقرأ تهنئة على أسبوع ناقص. */
  const mins = week.minutes;
  if (mins) {
    let best = true;
    for (let k = 1; k <= 7; k++) {
      const end = addDays(today, -7 * k);
      const prev = minutesOf(workoutsIn(g, 7, end));
      if (prev >= mins) {
        best = false;
        break;
      }
    }
    if (best && week.done >= 2) {
      out.push({
        id: "best-week",
        tone: "keep",
        text: `أعلى أسبوع لك منذ شهرين: ${mins} دقيقة.`,
      });
    }
  }

  return out;
};

/* --- المراجعة الأسبوعية -------------------------------------------------- *
 *  رسالة واحدة في الأسبوع، لا كل يوم — نفس قاعدة `weekReview` في بوت
 *  Life OS بالحرف: يوم أقصر من أن تُرى فيه سلسلة، والفحص اليومي أعلاه
 *  يقرأ اليوم أمام فراغ لا أمام الأسبوع الذي قبله. كل رقم هنا يمرّ عبر
 *  الدوال نفسها التي تقرأها الرئيسية والتحليل، فلا تختلف المراجعة عنهما
 *  عن الأسبوع نفسه.
 *
 *  لا تصمت — بخلاف `gymAdvise` التي تُسكت نفسها حين لا جديد، فأسبوع لم
 *  يتدرَّب فيه هو أهم ما تقوله المراجعة لا أقله.
 * ---------------------------------------------------------------------- */
export const gymWeekReview = (gym, today = dayKey()) => {
  const g = gymShape(gym);
  const thisWeek = weekLoad(g, today);
  const lastWeek = weekLoad(g, addDays(today, -7));
  const weighT = weighTrend(g, 7, today);
  const fatT = fatTrend(g, 7, today);
  const from = addDays(today, -6);
  const prs = g.exerciseLogs.filter(
    (l) => l.date >= from && l.date <= today && (l.isPR || l.is1RMPR),
  );
  const volume = muscleVolume(g, 7, today);
  const neglected = volume.filter((m) => m.status === "none" || m.status === "low");
  return { thisWeek, lastWeek, weighT, fatT, prs, volume, neglected };
};

/* --- التعب والركود ------------------------------------------------------ *
 *  سؤالان مختلفان عن نفس الخطر — الإفراط في التمرين — ولكل منهما إجابته:
 *    «الحمل ارتفع بسرعة» قرار اليومين الماضيين، و«الوزن لم يتقدَّم» قرار
 *  الأسابيع الماضية. كلتاهما تُقرآن من `exerciseLogs` نفسها التي يقرأها
 *  كل شيء آخر في هذا الملف — لا رقم مخترَع، ولا نسخة ثانية من الحساب بين
 *  الشاشة والبوت.
 * ---------------------------------------------------------------------- */

/* الحمل الأسبوعي: مجموع الحجم (وزن × تكرار × مجموعات) على التمارين
   الفعلية فقط — الإحماء لا يحمل جسداً. */
export const weeklyTonnage = (gym, today = dayKey()) => {
  const g = gymShape(gym);
  const from = addDays(today, -6);
  return Math.round(
    g.exerciseLogs
      .filter((l) => l.date >= from && l.date <= today && l.setType !== "warmup")
      .reduce((n, l) => n + (l.volume || 0), 0),
  );
};

/* كم مرة أعلى من معتاده هذا الأسبوع. `null` بلا أربعة أسابيع سابقة فعلية
   للمقارنة — قفزة محسوبة على فراغ ليست قفزة، هي أول أسبوع. */
export const GYM_SPIKE_WEEKS = 4;
export const GYM_SPIKE_RATIO = 1.4;

export const tonnageSpike = (gym, today = dayKey()) => {
  const g = gymShape(gym);
  const thisWeek = weeklyTonnage(g, today);
  const prior = [];
  for (let k = 1; k <= GYM_SPIKE_WEEKS; k++) prior.push(weeklyTonnage(g, addDays(today, -7 * k)));
  const known = prior.filter((v) => v > 0);
  if (!known.length || !thisWeek) return null;
  const avg = known.reduce((n, v) => n + v, 0) / known.length;
  if (!avg) return null;
  const ratio = Math.round((thisWeek / avg) * 10) / 10;
  return { thisWeek, avg: Math.round(avg), ratio, spike: ratio >= GYM_SPIKE_RATIO };
};

/* ركود الوزن: تمرين وصل أعلى وزنه ولم يكسره منذ `GYM_STALL_SESSIONS` حصص
   متتالية على الأقل، داخل نافذة `GYM_STALL_DAYS`. الحصة هي يوم مميَّز
   لا سطراً — جولتان في يوم واحد تقدُّم واحد، لا اثنان، لنفس سبب `gymDays`
   أعلاه. */
export const GYM_STALL_DAYS = 28;
export const GYM_STALL_SESSIONS = 4;

export const stalledExercises = (gym, today = dayKey(), days = GYM_STALL_DAYS, minSessions = GYM_STALL_SESSIONS) => {
  const g = gymShape(gym);
  const from = addDays(today, -days);
  const byExercise = new Map();
  for (const l of g.exerciseLogs) {
    if (l.setType === "warmup" || l.date < from || l.date > today) continue;
    if (!byExercise.has(l.exercise)) byExercise.set(l.exercise, new Map());
    const byDate = byExercise.get(l.exercise);
    byDate.set(l.date, Math.max(byDate.get(l.date) || 0, l.weight || 0));
  }
  const out = [];
  for (const [exercise, byDate] of byExercise) {
    const sessions = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (sessions.length < minSessions) continue;
    const weights = sessions.map((s) => s[1]);
    const best = Math.max(...weights);
    const peakAt = weights.lastIndexOf(best);
    const sinceBest = weights.length - 1 - peakAt;
    /* الركود يبدأ من آخر مرة تحسّن الوزن فيها، لا من أول حصة في النافذة —
       من كسر رقمه أمس لم يركد اليوم لمجرد أن النافذة تحمل حصصاً أقدم. */
    if (sinceBest >= minSessions - 1) {
      out.push({ exercise, sessions: sinceBest + 1, best, current: weights[weights.length - 1] });
    }
  }
  return out.sort((a, b) => b.sessions - a.sessions);
};
