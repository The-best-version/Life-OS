/* النادي: ما تحمله الصفوف، وما تقوله القراءات عنها.
 *
 *  هذا الملف يختبر طبقة الحالة وحدها — `life-state-gym.mjs` — لا شاشة.
 *  الواجهة التي تقرأ هذه الدوال تعيش في موقع مستقل يتكلّم مع
 *  `local-sync-server` كما يتكلّم بوت تيليجرام؛ وLife OS نفسه لا يعرض
 *  تبويب نادٍ، لكنه يحمل هذا الحقل عبر `migrate`/`carryOf`/`rollDay` حتى
 *  لا يمحو حفظه العادي ما كتبه الموقع المستقل في الملف المشترك.
 *
 *  كل ساعة هنا مبنيّة على مفتاح يوم صريح ولا واحدة تقرأ ساعة الجهاز، لأن
 *  التحليل أدناه مليء بقواعد «منذ كم يوم» — وسويتة تنجح اليوم وتفشل بعد
 *  أسبوع هي سويتة لا يثق بها أحد. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA,
  SPORT_CAP,
  MEASURE_FIELDS,
  REST_DAY,
  migrate,
  freshState,
  carryOf,
  rollDay,
  gymShape,
  sportShape,
  workoutShape,
  logWorkout,
  deleteWorkout,
  logPhoto,
  deletePhoto,
  photoShape,
  logWeigh,
  logMeasure,
  liveSports,
  weekLoad,
  gymRun,
  gymDays,
  restDays,
  weighTrend,
  latestWeigh,
  latestFat,
  fatTrend,
  measureDelta,
  targetStand,
  gymAdvise,
  sportLoad,
  DEFAULT_PROGRAM,
  estimate1RM,
  logExercise,
  deleteExerciseLog,
  exercisePRs,
  exerciseAdvice,
  muscleVolume,
  weighMovingAverage,
  renameExerciseInGym,
  exerciseProgressReport,
} from "../src/state/life-state.mjs";

const TODAY = "2026-10-26"; /* الاثنين */
const back = (n) => {
  const d = new Date(TODAY + "T12:00:00");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const gymWith = (over = {}) =>
  gymShape({
    sports: [
      { id: "gym", label: "الجيم", tint: "primary", weekly: 4 },
      { id: "box", label: "البوكسنج", tint: "danger", weekly: 2, min: "عشر دقائق كيس" },
    ],
    ...over,
  });

test("البذرة رياضتان، والشكل لا يخترع ثالثة", () => {
  const g = gymShape({});
  assert.equal(g.sports.length, 2);
  assert.deepEqual(
    g.sports.map((s) => s.label),
    ["الجيم", "البوكسنج"],
  );
  assert.deepEqual(g.workouts, []);
  assert.deepEqual(g.weighs, []);
  assert.equal(g.target.kg, null);
});

test("الرياضات مسقوفة عند SPORT_CAP", () => {
  const many = Array.from({ length: SPORT_CAP + 5 }, (_, i) => ({ id: `s${i}`, label: `ر${i}` }));
  assert.equal(gymShape({ sports: many }).sports.length, SPORT_CAP);
});

test("حقل لم يُقس يبقى null ولا يصير صفراً", () => {
  /* خصر لم يُقس ليس خصراً صفر سنتيمتر: صفر سيُقرأ انهياراً في المخطّط. */
  const m = logMeasure(gymWith(), { date: TODAY, waist: 86 }).measures[0];
  assert.equal(m.waist, 86);
  for (const f of MEASURE_FIELDS.filter((x) => x.id !== "waist")) {
    assert.equal(m[f.id], null, `${f.id} يجب أن يبقى غير مقيس`);
  }
});

test("قياسان في يوم واحد يُدمَجان، والحقل الغائب لا يمحو المكتوب", () => {
  let g = logMeasure(gymWith(), { date: TODAY, waist: 86 });
  g = logMeasure(g, { date: TODAY, chest: 102 });
  assert.equal(g.measures.length, 1, "يوم واحد صفّ واحد");
  assert.equal(g.measures[0].waist, 86, "الخصر المكتوب صباحاً يبقى");
  assert.equal(g.measures[0].chest, 102);
});

test("الوزن قراءة واحدة لليوم: الثانية تصحّح الأولى ولا تُضاف", () => {
  let g = logWeigh(gymWith(), { date: TODAY, kg: 79 });
  g = logWeigh(g, { date: TODAY, kg: 78.4 });
  assert.equal(g.weighs.length, 1);
  assert.equal(g.weighs[0].kg, 78.4);
});

test("وزن بلا رقم لا يُكتب صفّاً", () => {
  assert.equal(logWeigh(gymWith(), { date: TODAY, kg: "" }).weighs.length, 0);
  assert.equal(logWeigh(gymWith(), { date: TODAY, kg: 0 }).weighs.length, 0);
});

test("weekLoad يحسب المخطَّط من الرياضات العاملة وحدها", () => {
  let g = gymWith();
  g = logWorkout(g, { date: TODAY, sport: "gym", title: "صدر", minutes: 55 });
  g = logWorkout(g, { date: back(1), sport: "box", title: "جولات", minutes: 40 });
  const w = weekLoad(g, TODAY);
  assert.equal(w.done, 2);
  assert.equal(w.planned, 6, "٤ جيم + ٢ بوكسنج");
  assert.equal(w.minutes, 95);
  assert.equal(w.days, 2);

  /* رياضة موقوفة تخرج من المخطَّط: لا يُقرأ تقصيراً في شيء أوقفه بنفسه. */
  const off = gymShape({
    ...g,
    sports: g.sports.map((s) => (s.id === "box" ? { ...s, off: true } : s)),
  });
  assert.equal(weekLoad(off, TODAY).planned, 4);
  assert.equal(liveSports(off).length, 1);
});

test("رياضة بلا هدف أسبوعي لا تُرسم عليها نسبة", () => {
  const g = gymShape({ sports: [{ id: "gym", label: "الجيم", weekly: 0 }] });
  assert.equal(weekLoad(g, TODAY).bySport[0].pct, null);
});

test("حصّتان في يوم واحد يوم واحد من الانتظام", () => {
  let g = gymWith();
  g = logWorkout(g, { date: TODAY, sport: "gym", title: "صباح", minutes: 30 });
  g = logWorkout(g, { date: TODAY, sport: "box", title: "مساء", minutes: 30 });
  assert.equal(gymDays(g, 7, TODAY), 1);
  assert.equal(weekLoad(g, TODAY).done, 2);
});

test("يوم الراحة المخطَّط لا يقطع السلسلة، ويوم فائت يقطعها", () => {
  /* ٢٦ أكتوبر ٢٠٢٦ اثنين؛ ٢٥ أحد. الأحد مخطَّط راحة. */
  const plan = { 0: REST_DAY };
  let g = gymShape({ ...gymWith(), plan });
  g = logWorkout(g, { date: TODAY, sport: "gym", title: "اليوم", minutes: 40 });
  g = logWorkout(g, { date: back(2), sport: "gym", title: "السبت", minutes: 40 });
  assert.equal(gymRun(g, TODAY), 2, "الأحد راحة مخطَّطة فلا يقطع");

  /* بلا خطة راحة، الأحد الفارغ ينهي العدّ عند اليوم وحده. */
  const noPlan = gymShape({ ...g, plan: {} });
  assert.equal(gymRun(noPlan, TODAY), 1);
});

test("اليوم الجاري لا ينهي السلسلة", () => {
  let g = gymWith();
  g = logWorkout(g, { date: back(1), sport: "gym", title: "أمس", minutes: 40 });
  g = logWorkout(g, { date: back(2), sport: "gym", title: "قبله", minutes: 40 });
  /* لم يتدرّب اليوم بعد — ومن لم يتدرّب بعد لم يفوّت. */
  assert.equal(gymRun(g, TODAY), 2);
});

test("restDays يعيد null لملف لم يسجّل حصة قط", () => {
  assert.equal(restDays(gymWith(), TODAY), null);
  const g = logWorkout(gymWith(), { date: back(3), sport: "gym", title: "حصة", minutes: 40 });
  assert.equal(restDays(g, TODAY), 3);
});

test("weighTrend يحتاج طرفين، وفرقه من الأقدم إلى الأحدث", () => {
  let g = logWeigh(gymWith(), { date: back(30), kg: 84.5 });
  assert.equal(weighTrend(g, 60, TODAY), null, "قراءة واحدة ليست اتجاهاً");
  g = logWeigh(g, { date: TODAY, kg: 78.4 });
  const t = weighTrend(g, 60, TODAY);
  assert.equal(t.from, 84.5);
  assert.equal(t.to, 78.4);
  assert.equal(t.delta, -6.1);
  assert.equal(latestWeigh(g).kg, 78.4);
});

test("latestFat يتجاوز قراءات الوزن بلا دهون، ولا يخلط «لم يُقس» بالقديم", () => {
  let g = logWeigh(gymWith(), { date: back(10), kg: 85, fat: 20 });
  g = logWeigh(g, { date: TODAY, kg: 82 }); // بلا دهون
  const f = latestFat(g);
  assert.equal(f.fat, 20, "آخر قراءة دهون معروفة، لا آخر قراءة وزن");
  assert.equal(f.date, back(10));
});

test("fatTrend يتجاهل الصفوف بلا دهون، ويحتاج طرفين فعليين", () => {
  let g = logWeigh(gymWith(), { date: back(20), kg: 85, fat: 22 });
  g = logWeigh(g, { date: back(10), kg: 83 }); // بلا دهون، يُتجاهَل
  assert.equal(fatTrend(g, 30, TODAY), null, "قراءة دهون واحدة ليست اتجاهاً");
  g = logWeigh(g, { date: TODAY, kg: 80, fat: 18 });
  const t = fatTrend(g, 30, TODAY);
  assert.equal(t.from, 22);
  assert.equal(t.to, 18);
  assert.equal(t.delta, -4);
});

test("measureDelta يميّز «لم يُقس» عن «لم يتغيّر»", () => {
  let g = logMeasure(gymWith(), { date: back(30), waist: 88, chest: 102 });
  g = logMeasure(g, { date: TODAY, waist: 86 });
  const d = measureDelta(g);
  const waist = d.fields.find((f) => f.id === "waist");
  const chest = d.fields.find((f) => f.id === "chest");
  assert.equal(waist.delta, -2);
  assert.equal(chest.value, null);
  assert.equal(chest.delta, null, "الصدر لم يُقس اليوم، فلا فرق له");
});

test("targetStand يقيس الطريق من أقدم قراءة محفوظة", () => {
  let g = gymShape({ ...gymWith(), target: { kg: 75, date: "2027-03-01", note: "٧٥ كجم" } });
  g = logWeigh(g, { date: back(90), kg: 85 });
  g = logWeigh(g, { date: TODAY, kg: 80 });
  const s = targetStand(g, TODAY);
  assert.equal(s.gap, 5);
  assert.equal(s.pct, 50, "من ٨٥ إلى ٧٥ عشرة، قُطع منها خمسة");
  assert.ok(s.left > 100);
});

test("هدف بلا رقم أو بلا قراءة لا يُحسب نسبة", () => {
  assert.equal(targetStand(gymWith(), TODAY).pct, null);
  const g = gymShape({ ...gymWith(), target: { kg: 75 } });
  assert.equal(targetStand(g, TODAY).pct, null, "بلا قراءة وزن لا نسبة");
});

test("التحليل صامت على أسبوع مكتمل", () => {
  let g = gymShape({ ...gymWith(), target: { kg: 75 } });
  /* ستّ حصص = المخطَّط، ووزن اليوم مسجَّل، وقياس حديث. */
  for (let i = 0; i < 4; i++)
    g = logWorkout(g, { date: back(i), sport: "gym", title: "حصة", minutes: 10 });
  for (let i = 4; i < 6; i++)
    g = logWorkout(g, { date: back(i), sport: "box", title: "جولات", minutes: 10 });
  g = logWeigh(g, { date: TODAY, kg: 78 });
  g = logMeasure(g, { date: back(3), waist: 86 });
  const notes = gymAdvise(g, TODAY).filter((n) => n.id !== "best-week");
  assert.deepEqual(notes, [], `كان يجب أن يصمت: ${JSON.stringify(notes)}`);
});

test("التحليل لا يقول شيئاً لملف فارغ", () => {
  assert.deepEqual(gymAdvise(gymWith(), TODAY), []);
});

test("الغياب باب واحد يُسكت الباقي، ويحمل الحدّ الأدنى", () => {
  let g = gymShape({ sports: [{ id: "box", label: "البوكسنج", weekly: 3, min: "عشر دقائق كيس" }] });
  g = logWorkout(g, { date: back(9), sport: "box", title: "جولات", minutes: 40 });
  const notes = gymAdvise(g, TODAY);
  assert.equal(notes.length, 1, "باب واحد فقط");
  assert.equal(notes[0].id, "away");
  assert.ok(notes[0].text.includes("عشر دقائق كيس"), "الباب يحمل أصغر نسخة");
});

test("رياضة توقّفت تُذكَر باسمها وبعدد أيام غيابها", () => {
  let g = gymWith();
  for (let i = 0; i < 3; i++)
    g = logWorkout(g, { date: back(i), sport: "gym", title: "حصة", minutes: 40 });
  g = logWorkout(g, { date: back(20), sport: "box", title: "جولات", minutes: 40 });
  const note = gymAdvise(g, TODAY).find((n) => n.id === "cold:box");
  assert.ok(note, "البوكسنج كان يُمارَس وتوقّف");
  assert.ok(note.text.includes("البوكسنج"));
  assert.equal(sportLoad(g, "box", 10, TODAY).count, 0);
});

test("اتجاه الوزن يُقرأ نحو الهدف لا نزولاً دائماً", () => {
  /* من يستهدف وزناً أعلى فالصعود تقدُّمه. */
  let g = gymShape({ ...gymWith(), target: { kg: 85 } });
  for (let i = 0; i < 6; i++)
    g = logWorkout(g, { date: back(i), sport: "gym", title: "حصة", minutes: 40 });
  g = logWeigh(g, { date: back(20), kg: 78 });
  g = logWeigh(g, { date: TODAY, kg: 80 });
  const ids = gymAdvise(g, TODAY).map((n) => n.id);
  assert.ok(ids.includes("trend-good"), `الصعود نحو ٨٥ تقدُّم: ${ids}`);
  assert.ok(!ids.includes("trend-away"));
});

test("حصة الحدّ الأدنى تُحتسَب حصة كاملة وتُعلَّم فقط", () => {
  const w = workoutShape({ date: TODAY, sport: "box", title: "كيس خفيف", minutes: 10, tiny: true });
  assert.equal(w.tiny, true);
  const g = logWorkout(gymWith(), w);
  assert.equal(weekLoad(g, TODAY).done, 1, "تُحتسَب كأي حصة");
});

test("اسم ملف لا يطابق صيغة الخادم يُرفَض ولا يُكتَب صفّاً أعمى", () => {
  const good = photoShape({ date: TODAY, filename: "2026-10-26-ab12cd.jpg" });
  assert.equal(good.filename, "2026-10-26-ab12cd.jpg");
  const bad = photoShape({ date: TODAY, filename: "../../etc/passwd" });
  assert.equal(bad.filename, "", "اسم لا يطابق الصيغة يُفرَّغ، لا يُكتب كما هو");
});

test("logPhoto يرفض صفاً بلا اسم ملف صالح، ويضيف ولا يستبدل بنفس اليوم", () => {
  const g0 = logPhoto(gymWith(), { date: TODAY, filename: "اسم سيّئ" });
  assert.deepEqual(g0.photos, [], "بلا اسم ملف صالح، لا شيء يُكتب");

  let g = logPhoto(gymWith(), { date: TODAY, filename: "2026-10-26-ab12cd.jpg", note: "أمامي" });
  g = logPhoto(g, { date: TODAY, filename: "2026-10-26-ef34gh.jpg", note: "جانبي" });
  assert.equal(g.photos.length, 2, "صورتان بنفس اليوم تُضافان، لا تستبدل إحداهما الأخرى");
});

test("deletePhoto يحذف سطر الحالة بمعرّفه فقط، لا بايتات القرص", () => {
  let g = logPhoto(gymWith(), { date: TODAY, filename: "2026-10-26-ab12cd.jpg" });
  const victim = g.photos[0];
  g = deletePhoto(g, victim.id);
  assert.deepEqual(g.photos, []);
});

test("حذف حصة يحذفها بمعرّفها دون المساس بالباقي", () => {
  let g = gymWith();
  g = logWorkout(g, { date: TODAY, sport: "gym", title: "صدر", minutes: 55 });
  g = logWorkout(g, { date: back(1), sport: "box", title: "جولات", minutes: 40 });
  const victim = g.workouts.find((w) => w.title === "صدر");
  const after = deleteWorkout(g, victim.id);
  assert.equal(after.workouts.length, 1);
  assert.equal(after.workouts[0].title, "جولات");
});

test("الجولات ومدتها اختياريان ومستقلّان، وغيابهما null لا صفر", () => {
  const w = workoutShape({ date: TODAY, sport: "box", title: "كيس", minutes: 18, rounds: 6, roundMin: 3 });
  assert.equal(w.rounds, 6);
  assert.equal(w.roundMin, 3);
  const plain = workoutShape({ date: TODAY, sport: "gym", title: "صدر", minutes: 55 });
  assert.equal(plain.rounds, null);
  assert.equal(plain.roundMin, null);
});

test("الشدّة محصورة، والاسم لا يُفرَّغ", () => {
  /* رقم خارج المدى يُحصَر عند أقرب طرف، وما ليس رقماً وحده يعود للوسط:
     «٩٩» من تعديل يدوي تعني الأعلى، و«عالٍ» ليست تخميناً بل أقرب معنى. */
  assert.equal(workoutShape({ hard: 99 }).hard, 3);
  assert.equal(workoutShape({ hard: 0 }).hard, 1);
  assert.equal(workoutShape({ hard: "شديد" }).hard, 2);
  assert.equal(workoutShape({}).hard, 2);
  assert.equal(workoutShape({ title: "   " }).title, "حصة");
  assert.equal(sportShape({ label: "" }).label, "رياضة");
  assert.equal(sportShape({ tint: "neon" }).tint, "primary", "صبغة غير معروفة تعود للأولى");
});

test("الترقية لا تكتب حدًّا أدنى ولا تخترع رياضة", () => {
  const out = migrate({ schema: 31, habits: [], history: [] });
  assert.equal(out.schema, SCHEMA);
  assert.equal(out.gym.sports.length, 2);
  for (const s of out.gym.sports) assert.equal(s.min, "", "الحدّ الأدنى سؤال لا تجيبه ترقية");
  assert.deepEqual(out.gym.workouts, []);
});

test("الترقية تحفظ ما سُجّل وتُنظّف ما لا يُصلَح", () => {
  const out = migrate({
    schema: 31,
    gym: {
      sports: [{ id: "gym", label: "الجيم", weekly: 4 }],
      workouts: [{ date: TODAY, sport: "gym", title: "صدر", minutes: 55 }, null, 7],
      weighs: [{ date: TODAY, kg: 78.4 }],
    },
  });
  assert.equal(out.gym.workouts.length, 1, "الصفوف التالفة تُطرح");
  assert.equal(out.gym.workouts[0].title, "صدر");
  assert.equal(out.gym.weighs[0].kg, 78.4);
});

test("النادي في carryOf، فلا يختفي عند دوران اليوم ولا يمحوه حفظ Life OS", () => {
  assert.ok("gym" in carryOf(freshState()));
  let g = logWeigh(gymWith(), { date: back(1), kg: 78.4 });
  g = logWorkout(g, { date: back(1), sport: "gym", title: "أمس", minutes: 40 });
  const rolled = rollDay({ ...freshState(), gym: g, date: back(1), history: [] });
  assert.equal(rolled.gym.workouts.length, 1, "الحصص تَعبُر");
  assert.equal(rolled.gym.weighs[0].kg, 78.4, "والوزن كذلك");
});

test("البرنامج الافتراضي يحمل الخمسة أيام بتمارينها", () => {
  const g = gymShape({});
  assert.equal(g.routines.length, 5);
  assert.equal(g.routines[0].id, "push");
  assert.ok(g.routines[0].exercises.includes("Chest Press"));
  assert.ok(g.routines[1].exercises.includes("Wide Lat Pulldown"));
});

test("logExercise يسجل التمرين ويرصد PR عند كسر أعلى وزن سابق", () => {
  let g = gymShape({});
  g = logExercise(g, { date: back(7), exercise: "Chest Press", weight: 60, reps: 10, sets: 3 });
  assert.equal(g.exerciseLogs.length, 1);
  assert.equal(g.exerciseLogs[0].isPR, false, "أول تسجيل ليس كسراً لرقم سابق");

  // تسجيل وزن أعلى -> PR!
  g = logExercise(g, { date: TODAY, exercise: "Chest Press", weight: 65, reps: 8, sets: 3 });
  assert.equal(g.exerciseLogs.length, 2);
  assert.equal(g.exerciseLogs[0].isPR, true, "٦٥ كجم أعلى من ٦٠ كجم -> PR");

  // تسجيل وزن أقل -> ليس PR
  g = logExercise(g, { date: TODAY, exercise: "Chest Press", weight: 62.5, reps: 8, sets: 3 });
  assert.equal(g.exerciseLogs[0].isPR, false);

  const prs = exercisePRs(g);
  const cp = prs.find((p) => p.exercise === "Chest Press");
  assert.equal(cp.weight, 65);

  // حذف تسجيل
  const idToDelete = g.exerciseLogs[0].id;
  g = deleteExerciseLog(g, idToDelete);
  assert.equal(g.exerciseLogs.length, 2);
});

test("exerciseProgressReport يحسب الفرق لآخر 30 يوم بدقة", () => {
  let g = gymShape({});
  g = logExercise(g, { date: back(20), exercise: "Shoulder Press", weight: 20, reps: 10 });
  g = logExercise(g, { date: TODAY, exercise: "Shoulder Press", weight: 25, reps: 10 });
  const report = exerciseProgressReport(g, 30, TODAY);
  assert.equal(report.length, 1);
  assert.equal(report[0].exercise, "Shoulder Press");
  assert.equal(report[0].delta, 5);
  assert.equal(report[0].count, 2);
});

test("estimate1RM و setType: الإحماء لا يُحتسب PR، وزيادة التكرارات بنفس الوزن تكسر 1RM PR", () => {
  assert.equal(estimate1RM(100, 1), 100);
  assert.equal(estimate1RM(60, 10), 80);

  let g = gymShape({});
  // جلسة إحماء لا تحسب 1RM ولا PR
  g = logExercise(g, { date: back(5), exercise: "Chest Press", weight: 40, reps: 12, setType: "warmup" });
  assert.equal(g.exerciseLogs[0].orm, 0);
  assert.equal(g.exerciseLogs[0].volume, 0);

  // أول جلسة أساسية: 60 كجم × 8 (1RM = 76)
  g = logExercise(g, { date: back(4), exercise: "Chest Press", weight: 60, reps: 8, setType: "working" });
  assert.equal(g.exerciseLogs[0].orm, 76);
  assert.equal(g.exerciseLogs[0].isPR, false);

  // نفس الوزن 60 كجم ولكن 11 تكراراً (1RM = 82) -> يكسر 1RM PR!
  g = logExercise(g, { date: TODAY, exercise: "Chest Press", weight: 60, reps: 11, setType: "working" });
  assert.equal(g.exerciseLogs[0].isPR, false, "الوزن لم يزد");
  assert.equal(g.exerciseLogs[0].is1RMPR, true, "الـ 1RM زاد من 76 إلى 82");
});

test("exerciseAdvice يقترح رفع الوزن عند إتمام 12 عدة وتثبيته عند أقل من ذلك", () => {
  let g = gymShape({});
  assert.equal(exerciseAdvice(g, "Chest Press").action, "start");

  g = logExercise(g, { date: back(3), exercise: "Chest Press", weight: 60, reps: 10 });
  const adv1 = exerciseAdvice(g, "Chest Press");
  assert.equal(adv1.action, "reps");
  assert.equal(adv1.targetWeight, 60);
  assert.equal(adv1.targetReps, 11);

  g = logExercise(g, { date: TODAY, exercise: "Chest Press", weight: 60, reps: 12 });
  const adv2 = exerciseAdvice(g, "Chest Press");
  assert.equal(adv2.action, "up");
  assert.equal(adv2.targetWeight, 62.5);
  assert.equal(adv2.targetReps, 8);
});

test("muscleVolume يحسب الجلسات الأساسية لكل عضلة ويستثني الإحماء", () => {
  let g = gymShape({});
  g = logExercise(g, { date: TODAY, exercise: "Chest Press", weight: 60, reps: 10, sets: 3, setType: "working" });
  g = logExercise(g, { date: TODAY, exercise: "Chest Press", weight: 30, reps: 12, sets: 2, setType: "warmup" });
  g = logExercise(g, { date: TODAY, exercise: "Wide Lat Pulldown", weight: 55, reps: 10, sets: 4, setType: "working" });

  const mv = muscleVolume(g, 7, TODAY);
  const chest = mv.find((m) => m.id === "chest");
  const backMuscle = mv.find((m) => m.id === "back");
  assert.equal(chest.sets, 3, "الإحماء مستثنى");
  assert.equal(chest.volume, 1800);
  assert.equal(backMuscle.sets, 4);
});

test("weighMovingAverage يحسب خط الاتجاه الحقيقي (7-Day EMA)", () => {
  let g = gymWith();
  g = logWeigh(g, { date: back(4), kg: 80 });
  g = logWeigh(g, { date: back(2), kg: 81.2 }); // قفزة سوائل مؤقتة
  g = logWeigh(g, { date: TODAY, kg: 79.6 });

  const ema = weighMovingAverage(g, 30, TODAY);
  assert.equal(ema.points.length, 3);
  assert.equal(ema.latestRaw, 79.6);
  assert.ok(ema.latestEma > 79.6 && ema.latestEma < 81.2, "المتوسط المتحرك يمتص التذبذب");
});

test("renameExerciseInGym يعدل اسم التمرين في البرنامج وينقل كافة السجلات والأرقام القياسية للاسم الجديد", () => {
  let g = gymShape({});
  g = logExercise(g, { date: back(2), exercise: "Chest Press", weight: 65, reps: 8 });
  assert.equal(g.routines[0].exercises[0], "Chest Press");
  assert.equal(exercisePRs(g)[0].exercise, "Chest Press");

  // تعديل اسم التمرين إلى "بنش مسطح بار"
  g = renameExerciseInGym(g, "push", "Chest Press", "بنش مسطح بار");
  assert.equal(g.routines[0].exercises[0], "بنش مسطح بار");
  assert.equal(g.exerciseLogs[0].exercise, "بنش مسطح بار");
  assert.equal(exercisePRs(g)[0].exercise, "بنش مسطح بار");
});
