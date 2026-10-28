/* --- بوت النادي، نصفاه النقيّان -----------------------------------------
 *  `parse.js` و`actions.js` لا يستوردان grammY ولا يلمسان الشبكة ولا
 *  القرص — تماماً كـ`tests/bot.test.mjs` لنظيره. القرص والشبكة في
 *  `gym-client.js` وحده، ولا يُختبَر هنا لنفس سبب عدم اختبار
 *  `lifeos-client.js`: اختباره بلا خادم حقيقي اختبار لمحاكاة، لا له.
 * --------------------------------------------------------------------- */
import test from "node:test";
import assert from "node:assert/strict";

import { parseGym, fold } from "../services/telegram-gym-bot/parse.js";
import { route, statusText, dailyCheck, weekReviewText, nutritionStatusText } from "../services/telegram-gym-bot/actions.js";
import { freshState, logWorkout, logWeigh, logExercise, logMeal, saveNutritionTarget } from "../src/state/life-state.mjs";

const SPORTS = () => {
  const s = freshState();
  return s.gym.sports; // الجيم والبوكسنج المبذورتان
};

test("وزن الجسم بكلمة إضافية بعده لا يُقرأ تمريناً مخترَعاً", () => {
  /* باگ حقيقي وُجد هنا: «وزني اليوم 82.5» كانت تُقرَأ تمريناً باسم
     «اليوم»، لأن أي كلمة باقية بعد الرقم كانت تُقبَل اسم تمرين. التسجيل
     بفعل قيادة («تسجيل وزن ...») يبقى يفتح باب التمرين، لكن فقط حين
     يُعرَف اسم التمرين فعلاً — لا لأي كلمة تصادف وجودها. */
  const a = parseGym("وزني اليوم 82.5", SPORTS());
  assert.equal(a.kind, "weight");
  assert.equal(a.kg, 82.5);

  const b = parseGym("وزني امبارح 80", SPORTS());
  assert.equal(b.kind, "weight");

  const c = parseGym("تسجيل وزن 50 شي ما له معنى", SPORTS());
  assert.equal(c.kind, "weight", "اسم غير معروف لا يُخترَع تمريناً له — الوزن يفوز");
});

test("fold يُطبّع الأرقام العربية والهمزات للمطابقة فقط", () => {
  assert.equal(fold("وَزْني ٨٢.٥"), "وزني 82.5");
});

test("الوزن: المحفّز أول كلمة لا كلمة منقّبة في أي مكان", () => {
  assert.equal(parseGym("وزن 82.5", SPORTS()).kind, "weight");
  assert.equal(parseGym("وزني 82.5", SPORTS()).kind, "weight");
  /* «وزن» ليست أول كلمة هنا — سؤال، لا تسجيل. */
  const notTrigger = parseGym("كم وزن الحديد هذا", SPORTS());
  assert.notEqual(notTrigger.kind, "weight");
});

test("الوزن مع نسبة الدهون في جملة واحدة، ودهون لا تُقرَأ وزناً بالخطأ", () => {
  const a = parseGym("وزن 82.5 دهون 18", SPORTS());
  assert.equal(a.kind, "weight");
  assert.equal(a.kg, 82.5, "رقم الدهون ما يسرق رقم الوزن");
  assert.equal(a.fat, 18);

  const b = parseGym("وزن 82.5", SPORTS());
  assert.equal(b.fat, null, "بلا ذكر دهون تبقى null لا صفراً");

  const state = freshState();
  const res = route(state, "وزن 82.5 دهون 18");
  assert.ok(res.next);
  assert.equal(res.next.gym.weighs[0].kg, 82.5);
  assert.equal(res.next.gym.weighs[0].fat, 18);
});

test("حصة: اسم الرياضة أول كلمة، أو بعد فعل قيادة", () => {
  const a = parseGym("جيم 55 دقيقة", SPORTS());
  assert.equal(a.kind, "workout");
  assert.equal(a.minutes, 55);
  const b = parseGym("تدربت بوكسنج 40 دقيقة", SPORTS());
  assert.equal(b.kind, "workout");
  assert.equal(b.minutes, 40);
});

test("الجولات تُحسب منها الدقائق الكلية تلقائياً", () => {
  const w = parseGym("بوكسنج 6 جولة 3 دقيقة", SPORTS());
  assert.equal(w.kind, "workout");
  assert.equal(w.rounds, 6);
  assert.equal(w.roundMin, 3);
  assert.equal(w.minutes, 18);
});

test("الشدّة من كلماتها، والافتراض متوسط", () => {
  assert.equal(parseGym("جيم 40 دقيقة خفيف", SPORTS()).hard, 1);
  assert.equal(parseGym("جيم 40 دقيقة عالي", SPORTS()).hard, 3);
  assert.equal(parseGym("جيم 40 دقيقة", SPORTS()).hard, 2);
});

test("قياس: حقل ورقمه، أكثر من حقل في جملة واحدة", () => {
  const m = parseGym("قياس خصر 86 صدر 102", SPORTS());
  assert.equal(m.kind, "measure");
  assert.equal(m.fields.waist, 86);
  assert.equal(m.fields.chest, 102);
});

test("رياضة بلا دقائق تُرفَض بسؤال، لا بتخمين", () => {
  const u = parseGym("جيم", SPORTS());
  assert.equal(u.kind, "unknown");
  assert.ok(u.reply.includes("جيم"));
});

test("جملة بلا محفّز معروف غير مفهومة", () => {
  assert.equal(parseGym("مرحبا شخبارك", SPORTS()).kind, "unknown");
});

test("route يكتب الوزن والحصة عبر نفس دوال الحالة التي تستخدمها الشاشة", () => {
  const state = freshState();
  const w = route(state, "وزن 82.5");
  assert.ok(w.next, "يجب أن يكتب");
  assert.equal(w.next.gym.weighs[0].kg, 82.5);

  const sportId = w.next.gym.sports[0].id;
  const t = route(w.next, `${w.next.gym.sports[0].label} 40 دقيقة`);
  assert.ok(t.next);
  assert.equal(t.next.gym.workouts[0].sport, sportId);
  assert.equal(t.next.gym.workouts[0].minutes, 40);
});

test("route لا يكتب شيئاً على حالة أو مساعدة", () => {
  const state = freshState();
  assert.equal(route(state, "ملخص").status, true);
  assert.equal(route(state, "مساعدة").help, true);
});

test("statusText لا يخترع رقماً — يصمت إن لم يكن هناك هدف أو اتجاه", () => {
  const state = freshState();
  const text = statusText(state);
  assert.ok(text.includes("أسبوعك"));
  assert.ok(!text.includes("الهدف"), "لا هدف محدَّد فلا يُذكر");
});

test("dailyCheck صامت على حالة لا شيء فيها يستحق القول", () => {
  assert.equal(dailyCheck(freshState()), null);
});

test("dailyCheck يتكلّم حين يوجد غياب حقيقي", () => {
  let state = freshState();
  const d = new Date();
  d.setDate(d.getDate() - 9);
  const nineDaysAgo = d.toISOString().slice(0, 10);
  state = { ...state, gym: logWorkout(state.gym, { date: nineDaysAgo, sport: state.gym.sports[0].id, title: "قديم", minutes: 30 }) };
  const text = dailyCheck(state);
  assert.ok(text, "تسع أيام غياب تستحق باباً");
});

test("تسجيل تمرين من شات تيليجرام: تسجيل وزن 50 صدر مستوي أو صدر مستوي 60x10", () => {
  const p1 = parseGym("تسجيل وزن 50 صدر مستوي", SPORTS());
  assert.equal(p1.kind, "exercise");
  assert.equal(p1.weight, 50);
  assert.equal(p1.reps, 10);

  const p2 = parseGym("صدر مستوي 60x10", SPORTS());
  assert.equal(p2.kind, "exercise");
  assert.equal(p2.weight, 60);
  assert.equal(p2.reps, 10);

  const state = freshState();
  const res = route(state, "تسجيل وزن 50 صدر مستوي");
  assert.ok(res.next);
  assert.equal(res.next.gym.exerciseLogs.length, 1);
  assert.equal(res.next.gym.exerciseLogs[0].weight, 50);
  assert.ok(res.reply.includes("صدر مستوي"));
});

test("«ملخص الأسبوع» و«اسبوعي» يُقرآن مراجعة أسبوعية، لا حالة عادية", () => {
  /* «ملخص الأسبوع» تبدأ بكلمة «ملخص» أيضاً — يجب أن تسبقها المطابقة
     الأطول، لا أن يبلعها STATUS_TRIGGERS أولاً. */
  assert.equal(parseGym("ملخص الاسبوع").kind, "week");
  assert.equal(parseGym("اسبوعي").kind, "week");
  assert.equal(parseGym("ملخص").kind, "status", "ملخص وحدها تبقى حالة عادية");

  const state = freshState();
  assert.equal(route(state, "ملخص الاسبوع").week, true);
});

test("weekReviewText لا يصمت على أسبوع فارغ — هذا أهم ما تقوله", () => {
  const text = weekReviewText(freshState());
  assert.ok(text.includes("ما سجّلت حصة"));
});

test("weekReviewText يقارن الأسبوع بالماضي ولا يخترع رقماً بلا داعٍ", () => {
  let state = freshState();
  const sportId = state.gym.sports[0].id;
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date();
  d.setDate(d.getDate() - 10);
  const lastWeekDate = d.toISOString().slice(0, 10);

  state = { ...state, gym: logWorkout(state.gym, { date: today, sport: sportId, title: "اليوم", minutes: 40 }) };
  state = { ...state, gym: logWorkout(state.gym, { date: lastWeekDate, sport: sportId, title: "الماضي", minutes: 20 }) };

  const text = weekReviewText(state);
  assert.ok(text.includes("الحصص: ١ "), "حصة هذا الأسبوع");
  assert.ok(text.includes("الماضي: ١"), "وحصة واحدة في الأسبوع الذي قبله، لا صفر ولا اختلاط بينهما");
  assert.ok(!text.includes("أرقام جديدة"), "لا PR هذا الأسبوع فلا يُذكر القسم");
});

test("weekReviewText يسرد الأرقام الجديدة (PR) المسجَّلة هذا الأسبوع فقط", () => {
  /* السجل الأول لتمرين لم يُسجَّل قبله ليس PR — لا طرف سابق يُكسَر —
     فلا بد من سجلّين: الثاني يكسر وزن الأول. */
  let state = freshState();
  state = route(state, "تسجيل وزن 50 صدر مستوي").next;
  state = route(state, "تسجيل وزن 60 صدر مستوي").next;
  const text = weekReviewText(state);
  assert.ok(text.includes("أرقام جديدة"));
  assert.ok(text.includes("Chest Press"), "اسم التمرين المعتمد في البرنامج («صدر مستوي» يُطابَق إليه)");
});

test("weekReviewText يذكر معدّل النوم حين يوجد، ومن نفس state.sleepLogs الذي يكتبه بوت Life OS", () => {
  let state = freshState();
  state = { ...state, sleepLogs: [{ date: state.date, hours: 6.5, source: "telegram" }] };
  const text = weekReviewText(state);
  assert.ok(text.includes("النوم: 6.5 س/ليلة"), text);
});

test("statusText وdailyCheck يمرّران sleepLogs إلى gymAdvise — ركود + نوم قليل يصل البوت", () => {
  const dateBack = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  let g = freshState().gym;
  g = logWeigh(g, { date: dateBack(0), kg: 80 });
  g = logExercise(g, { date: dateBack(21), exercise: "Deadlift", weight: 100, reps: 5 });
  g = logExercise(g, { date: dateBack(14), exercise: "Deadlift", weight: 95, reps: 5 });
  g = logExercise(g, { date: dateBack(7), exercise: "Deadlift", weight: 97, reps: 5 });
  g = logExercise(g, { date: dateBack(0), exercise: "Deadlift", weight: 96, reps: 5 });
  const today = dateBack(0);
  const state = { ...freshState(), gym: g, sleepLogs: [{ date: today, hours: 5, source: "telegram" }] };

  const status = statusText(state);
  assert.ok(status.includes("نومك قليل"), status);

  const daily = dailyCheck(state);
  assert.ok(daily.includes("نومك قليل"), daily);
});

test("اكلت: المحفّز أول كلمة، ونوع الوجبة هو الكلمة التالية تحديداً إن وُجدت", () => {
  const a = parseGym("اكلت أرز ودجاج 650 سعرة");
  assert.equal(a.kind, "meal");
  assert.equal(a.meal, "snack", "بلا كلمة نوع وجبة معروفة: الافتراضي سناك");
  assert.equal(a.calories, 650);
  assert.ok(a.name.includes("ارز") || a.name.includes("أرز"));

  const b = parseGym("اكلت فطور بيض وخبز 400 سعرة");
  assert.equal(b.kind, "meal");
  assert.equal(b.meal, "breakfast");
  assert.equal(b.calories, 400);

  const c = parseGym("تناولت غداء كبسة 800");
  assert.equal(c.kind, "meal");
  assert.equal(c.meal, "lunch");
  assert.equal(c.calories, 800);
});

test("اكلت بلا رقم سعرات يُرفَض بسؤال، لا بتخمين", () => {
  const u = parseGym("اكلت أرز ودجاج");
  assert.equal(u.kind, "unknown");
  assert.ok(u.reply.includes("السعرات"));
});

test("«كم وزن» ليست تسجيل أكل، و«اكل» ليست أول كلمة لا تُقرَأ وجبة", () => {
  assert.notEqual(parseGym("هل اكلت اليوم؟").kind, "meal");
});

test("route يكتب الوجبة عبر logMeal، ويضيف ولا يستبدل كالنادي لا كالوزن", () => {
  let state = freshState();
  const a = route(state, "اكلت فطور بيض 400 سعرة");
  assert.ok(a.next);
  assert.equal(a.next.nutrition.meals.length, 1);
  assert.equal(a.next.nutrition.meals[0].meal, "breakfast");
  assert.equal(a.next.nutrition.meals[0].calories, 400);
  assert.ok(a.reply.includes("فطور") && a.reply.includes("سعرة"));

  const b = route(a.next, "اكلت غداء ارز 700 سعرة");
  assert.equal(b.next.nutrition.meals.length, 2, "وجبة ثانية تُضاف، لا تستبدل الأولى");
});

test("«سعراتي»/«تغذيتي» تعرض حالة التغذية بلا كتابة", () => {
  const state = freshState();
  assert.equal(route(state, "سعراتي").nutrition, true);
  assert.equal(route(state, "تغذيتي").nutrition, true);
});

test("nutritionStatusText لا يخترع هدفاً، ويحسب الباقي حين يوجد هدف", () => {
  let state = freshState();
  state = route(state, "اكلت فطور بيض 500 سعرة").next;
  const noTarget = nutritionStatusText(state);
  assert.ok(!noTarget.includes("الهدف"));

  state = { ...state, nutrition: saveNutritionTarget(state.nutrition, { calories: 2000 }) };
  const withTarget = nutritionStatusText(state);
  assert.ok(withTarget.includes("الهدف"));
  assert.ok(withTarget.includes("باقي"));
});

test("weekReviewText يذكر متوسط السعرات حين توجد وجبات مسجَّلة هذا الأسبوع", () => {
  let state = freshState();
  state = route(state, "اكلت فطور بيض 500 سعرة").next;
  const text = weekReviewText(state);
  assert.ok(text.includes("متوسط السعرات"));
});
