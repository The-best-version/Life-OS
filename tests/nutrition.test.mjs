/* التغذية: وجبة لكل سطر، ومجموع اليوم مشتقّ دائماً لا مخزَّن.
 *
 *  مجال موازٍ للنادي — لا تابع له — نفس قرار النوم قبله. راجع التعليق في
 *  أعلى `life-state-nutrition.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  mealShape,
  nutritionShape,
  logMeal,
  deleteMeal,
  saveNutritionTarget,
  mealsOn,
  mealsIn,
  dayTotals,
  calorieStand,
  noLogDays,
  nutritionAdvise,
  nutritionWeekReview,
  MEAL_CAP,
} from "../src/state/life-state.mjs";

const TODAY = "2026-10-26";
const back = (n) => {
  const d = new Date(TODAY + "T12:00:00");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

test("mealShape: السعرات دائماً رقم، والماكروز null لا صفر حين غائبة", () => {
  const m = mealShape({ date: TODAY, name: "أرز ودجاج" });
  assert.equal(m.calories, 0);
  assert.equal(m.protein, null);
  assert.equal(m.carbs, null);
  assert.equal(m.fat, null);
  assert.equal(m.meal, "snack", "النوع الافتراضي حين لا يُعرَف");
});

test("mealShape يقبل صفراً صريحاً لماكرو كقيمة حقيقية، لا يخلطه بالغياب", () => {
  const m = mealShape({ date: TODAY, carbs: 0, protein: 20 });
  assert.equal(m.carbs, 0);
  assert.equal(m.protein, 20);
});

test("nutritionShape يُسقط لا شيء — وجبة بلا سعرات محسوبة تبقى سطراً، خلافاً لحقل شريط لم يُقس", () => {
  const n = nutritionShape({ meals: [{ date: TODAY, name: "لا أعرف السعرات" }] });
  assert.equal(n.meals.length, 1);
  assert.equal(n.meals[0].calories, 0);
});

test("logMeal يضيف ولا يستبدل — خلافاً للوزن، وجبتان في يوم واحد وجبتان فعلاً", () => {
  let n = nutritionShape({});
  n = logMeal(n, { date: TODAY, meal: "breakfast", name: "بيض", calories: 300 });
  n = logMeal(n, { date: TODAY, meal: "lunch", name: "أرز", calories: 600 });
  assert.equal(n.meals.length, 2);
});

test("deleteMeal يحذف بالمعرّف فقط", () => {
  let n = logMeal(nutritionShape({}), { date: TODAY, calories: 300 });
  const id = n.meals[0].id;
  n = deleteMeal(n, id);
  assert.equal(n.meals.length, 0);
});

test("saveNutritionTarget يحفظ هدفاً، وbلا هدف calories يبقى null لا صفراً", () => {
  let n = saveNutritionTarget(nutritionShape({}), { calories: 2200, protein: 150 });
  assert.equal(n.target.calories, 2200);
  assert.equal(n.target.protein, 150);
  assert.equal(n.target.carbs, null);

  n = saveNutritionTarget(n, {});
  assert.equal(n.target.calories, null, "هدف غير محدَّد هو لا هدف، لا صفر سعرة");
});

test("dayTotals يجمع سعرات اليوم فقط، وماكرو لم تُسجَّل في أي وجبة يبقى null", () => {
  let n = nutritionShape({});
  n = logMeal(n, { date: TODAY, calories: 300, protein: 20 });
  n = logMeal(n, { date: TODAY, calories: 200 });
  n = logMeal(n, { date: back(1), calories: 999 });
  const t = dayTotals(n, TODAY);
  assert.equal(t.count, 2);
  assert.equal(t.calories, 500);
  assert.equal(t.protein, 20, "وجبة واحدة سجّلت بروتين — المجموع من المسجَّل فقط");
});

test("calorieStand: null بلا هدف، ونسبة محسوبة حين يوجد", () => {
  let n = logMeal(nutritionShape({}), { date: TODAY, calories: 1800 });
  assert.equal(calorieStand(n, TODAY).pct, null, "بلا هدف لا نسبة");

  n = saveNutritionTarget(n, { calories: 2000 });
  const stand = calorieStand(n, TODAY);
  assert.equal(stand.pct, 90);
  assert.equal(stand.left, 200);
});

test("noLogDays يعدّ الغياب المتتالي من أمس، واليوم الجاري لا ينهيه", () => {
  let n = logMeal(nutritionShape({}), { date: back(5), calories: 500 });
  assert.equal(noLogDays(n, TODAY), 4, "أمس إلى قبل أربعة أيام: أربعة أيام غياب");
});

test("nutritionAdvise يصمت على ملف فارغ ولا يخترع غياباً", () => {
  assert.deepEqual(nutritionAdvise(nutritionShape({}), TODAY), []);
});

test("nutritionAdvise: باب الغياب يُسكت الباقي", () => {
  const n = logMeal(nutritionShape({}), { date: back(5), calories: 500 });
  const notes = nutritionAdvise(n, TODAY);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].id, "away");
});

test("nutritionAdvise يحذّر من تجاوز الهدف بنسبة كبيرة، لا بأي تجاوز", () => {
  let n = logMeal(nutritionShape({}), { date: TODAY, calories: 2600 });
  n = saveNutritionTarget(n, { calories: 2000 });
  const notes = nutritionAdvise(n, TODAY);
  assert.ok(notes.some((x) => x.id === "over"));

  let small = logMeal(nutritionShape({}), { date: TODAY, calories: 2100 });
  small = saveNutritionTarget(small, { calories: 2000 });
  assert.equal(nutritionAdvise(small, TODAY).length, 0, "تجاوز 5% ليس خبراً");
});

test("nutritionWeekReview يقارن متوسط السعرات بالأسبوع الماضي، معدوداً على الأيام المسجَّلة فقط", () => {
  let n = nutritionShape({});
  n = logMeal(n, { date: TODAY, calories: 2000 });
  n = logMeal(n, { date: back(1), calories: 1000 });
  n = logMeal(n, { date: back(1), calories: 1000 });
  const r = nutritionWeekReview(n, TODAY);
  assert.equal(r.thisWeek.loggedDays, 2);
  assert.equal(r.thisWeek.avgCalories, 2000, "(2000 + 2000) / 2 يوم");
});

test("المجموعة مسقوفة عند MEAL_CAP", () => {
  const meals = Array.from({ length: MEAL_CAP + 50 }, (_, i) => ({ date: back(i % 30), calories: 100 }));
  const n = nutritionShape({ meals });
  assert.equal(n.meals.length, MEAL_CAP);
});
