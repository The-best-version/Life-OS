/* --- التغذية: ماذا دخل الجسم ------------------------------------------- *
 *  نفس سؤال النادي من الاتجاه الآخر: النادي يقول ماذا فعل الجسم، وهذا
 *  الملف يقول ماذا أكل. مُجَزَّأ على `gym` عمداً — `nutrition` مجال
 *  موازٍ، لا رياضة، ولا يتبع «النادي» أكثر مما يتبعه النوم، الذي سبقه
 *  بنفس القرار (انظر `life-state-sleep.mjs`).
 *
 *  سطر واحد لكل وجبة، لا سطر واحد لليوم — خلافاً للوزن: من أكل الفطور
 *  والغداء اليوم أكل وجبتين، لا وجبة واحدة تصحّح الأخرى. المجموع اليومي
 *  مشتقّ دائماً (`dayTotals`)، لا مخزَّن أبداً — نفس قاعدة كل رقم آخر في
 *  هذا المشروع.
 * --------------------------------------------------------------------- */
import {
  uid,
  obj,
  rows,
  dayKey,
  addDays,
  isKey,
  clampNum,
} from "./life-state-util.mjs";

export const MEAL_CAP = 3000;

const nutritionStr = (v, max, fallback = "") => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : fallback;
};

const dateOf = (v) => (isKey(v) ? v : dayKey());

/* السعرات رقم دائماً (صفر بلا إدخال)، لأن وجبة بلا سعرات محسوبة ليست
   سطراً فارغاً بل وجبة قيمتها صفر لم تُقدَّر بعد — تبقى في اليوميّة ولا
   تُسقَط، خلافاً لحقل شريط لم يُقس. الماكروز نفسها `null` حين غائبة، لا
   صفراً، لنفس سبب `gymNum`: بروتين لم يُقدَّر ليس بروتيناً صفراً. */
const calOf = (v) => clampNum(v, 0, 5000, 0);
/* `Number(null)` و`Number(undefined)` تُفسَّران صفراً وغير رقم على
   التوالي — فحص صريح لازم قبل التحويل، وإلا قرأ غيابٌ كـ«صفر غرام»
   بدل «لم يُقدَّر»، وهذا بالضبط الفرق الذي من أجله `null` موجودة هنا. */
const macroOf = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10) / 10;
};

export const MEAL_TYPES = [
  { id: "breakfast", label: "فطور" },
  { id: "lunch", label: "غداء" },
  { id: "dinner", label: "عشاء" },
  { id: "snack", label: "سناك" },
];
const MEAL_IDS = new Set(MEAL_TYPES.map((m) => m.id));
const mealTypeOf = (v) => (MEAL_IDS.has(v) ? v : "snack");

export const mealShape = (m) => {
  m = obj(m);
  return {
    id: m.id || uid(),
    date: dateOf(m.date),
    meal: mealTypeOf(m.meal),
    name: nutritionStr(m.name, 80, "وجبة"),
    calories: calOf(m.calories),
    protein: macroOf(m.protein),
    carbs: macroOf(m.carbs),
    fat: macroOf(m.fat),
  };
};

/* الهدف اليومي — سعرات إلزامية إن وُجد، وماكروز اختيارية. `calories:
   null` يعني لا هدف أصلاً، وهذا ما تبدأ به ملف جديد: `migrate` لا تخترع
   هدفاً، نفس امتناعها عن تخمين الأساسية الخمس وحدّ أدنى العادة. */
export const nutritionTargetShape = (t) => {
  t = obj(t);
  const calories = Number(t.calories);
  return {
    calories: Number.isFinite(calories) && calories > 0 ? Math.round(calories) : null,
    protein: macroOf(t.protein),
    carbs: macroOf(t.carbs),
    fat: macroOf(t.fat),
  };
};

export const nutritionShape = (n) => {
  n = obj(n);
  return {
    meals: rows(n.meals)
      .map(mealShape)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, MEAL_CAP),
    target: nutritionTargetShape(n.target),
  };
};

export const nutritionCarry = (n) => nutritionShape(n);

export const logMeal = (nutrition, row) => {
  const n = nutritionShape(nutrition);
  const shaped = mealShape(row);
  return { ...n, meals: [shaped, ...n.meals].slice(0, MEAL_CAP) };
};

export const deleteMeal = (nutrition, id) => {
  const n = nutritionShape(nutrition);
  return { ...n, meals: n.meals.filter((m) => m.id !== id) };
};

export const saveNutritionTarget = (nutrition, target) => {
  const n = nutritionShape(nutrition);
  return { ...n, target: nutritionTargetShape(target) };
};

/* --- القراءات ------------------------------------------------------------ */

export const mealsOn = (nutrition, date) =>
  nutritionShape(nutrition).meals.filter((m) => m.date === date);

export const mealsIn = (nutrition, days, today = dayKey()) => {
  const from = addDays(today, -(Math.max(1, Math.round(days)) - 1));
  return nutritionShape(nutrition).meals.filter((m) => m.date >= from && m.date <= today);
};

/* مجموع يوم: سعرات دائماً رقماً، وكل ماكرو `null` إن لم تُسجَّل وجبة
   واحدة فيه ماكرو — نفس تمييز الحقل الغائب في كل قراءات النادي. */
export const dayTotals = (nutrition, date = dayKey()) => {
  const meals = mealsOn(nutrition, date);
  const sum = (key) => {
    const known = meals.filter((m) => m[key] !== null);
    if (!known.length) return null;
    return Math.round(known.reduce((n, m) => n + m[key], 0) * 10) / 10;
  };
  return {
    count: meals.length,
    calories: meals.reduce((n, m) => n + m.calories, 0),
    protein: sum("protein"),
    carbs: sum("carbs"),
    fat: sum("fat"),
  };
};

/* الهدف مقروءاً: أين وقف اليوم منه. `null` بلا هدف محدَّد — نسبة من لا
   هدف له ليست صفراً، هي لا شيء. */
export const calorieStand = (nutrition, date = dayKey()) => {
  const n = nutritionShape(nutrition);
  const target = n.target.calories;
  const totals = dayTotals(n, date);
  if (target === null) return { calories: totals.calories, target: null, pct: null, left: null };
  return {
    calories: totals.calories,
    target,
    pct: Math.round((totals.calories / target) * 100),
    left: target - totals.calories,
  };
};

/* أيام غياب التسجيل، متتالية إلى الوراء من أمس — نفس `restDays` في
   النادي: اليوم الجاري لا يُحتسَب غياباً، لم ينتهِ بعد. والوقوف عند أول
   وجبة سُجّلت فعلاً (`first`) كـ`gymRun`: من بدأ يسجّل اليوم فقط لم
   يغب ستين يوماً، لم يكن يسجّل أصلاً. */
export const noLogDays = (nutrition, today = dayKey()) => {
  const n = nutritionShape(nutrition);
  if (!n.meals.length) return 0;
  const logged = new Set(n.meals.map((m) => m.date));
  const first = n.meals[n.meals.length - 1].date;
  let days = 0;
  for (let i = 1; i <= 60; i++) {
    const d = addDays(today, -i);
    if (d < first || logged.has(d)) break;
    days++;
  }
  return days;
};

/* --- التحليل -------------------------------------------------------------- *
 *  صامت افتراضياً، نفس قاعدة `gymAdvise`: من يسجّل كل يوم ضمن هدفه لا
 *  يحتاج رسالة، واليوم الوحيد الذي عنده ما يُقال هو اليوم الذي يُقال فيه
 *  أيضاً.
 * ---------------------------------------------------------------------- */
export const NUTRITION_AWAY = 3;
export const NUTRITION_OVER_PCT = 20;

export const nutritionAdvise = (nutrition, today = dayKey()) => {
  const n = nutritionShape(nutrition);
  const out = [];
  if (!n.meals.length) return out;

  const away = noLogDays(n, today);
  if (away >= NUTRITION_AWAY) {
    out.push({
      id: "away",
      tone: "door",
      text: `${away} يوم بلا تسجيل وجبة — سجّل ولو وجبة واحدة اليوم.`,
    });
    return out;
  }

  const stand = calorieStand(n, today);
  if (stand.target !== null && stand.calories > 0) {
    const over = stand.pct - 100;
    if (over >= NUTRITION_OVER_PCT) {
      out.push({
        id: "over",
        tone: "ask",
        text: `تجاوزت هدف السعرات اليوم بـ ${over}٪ (${stand.calories} من ${stand.target}).`,
      });
    }
  }

  return out;
};

/* --- المراجعة الأسبوعية --------------------------------------------------- *
 *  نفس بنية `gymWeekReview`: متوسط السعرات والماكروز هذا الأسبوع مقابل
 *  الأسبوع الماضي، وأيام بلا تسجيل — معدودة لا بالنسبة، نفس قاعدة فجوات
 *  الأرشيف في بقية المشروع.
 * ---------------------------------------------------------------------- */
const weekAvg = (nutrition, today) => {
  const n = nutritionShape(nutrition);
  const from = addDays(today, -6);
  const days = new Map();
  for (let i = 0; i < 7; i++) days.set(addDays(today, -i), []);
  for (const m of n.meals) {
    if (m.date >= from && m.date <= today && days.has(m.date)) days.get(m.date).push(m);
  }
  const loggedDays = [...days.values()].filter((list) => list.length);
  if (!loggedDays.length) return { avgCalories: null, loggedDays: 0 };
  const totalCal = loggedDays.reduce((n2, list) => n2 + list.reduce((s, m) => s + m.calories, 0), 0);
  return {
    avgCalories: Math.round(totalCal / loggedDays.length),
    loggedDays: loggedDays.length,
  };
};

export const nutritionWeekReview = (nutrition, today = dayKey()) => {
  const n = nutritionShape(nutrition);
  const thisWeek = weekAvg(n, today);
  const lastWeek = weekAvg(n, addDays(today, -7));
  return { thisWeek, lastWeek, target: n.target };
};
