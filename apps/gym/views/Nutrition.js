import { h, T, Card, Btn, Field, Pill, Stat, ProgressBar, ar } from "/gym/lib/ui.js";
import {
  dayKey,
  MEAL_TYPES,
  dayTotals,
  calorieStand,
  mealsOn,
  nutritionAdvise,
  nutritionWeekReview,
} from "/src/state/life-state.mjs";

const { useState, useMemo } = React;

function TodayCard({ nutrition }) {
  const today = dayKey();
  const totals = useMemo(() => dayTotals(nutrition, today), [nutrition, today]);
  const stand = useMemo(() => calorieStand(nutrition, today), [nutrition, today]);

  return h(
    Card,
    null,
    h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 12 } }, "اليوم"),
    h(
      "div",
      { style: { display: "flex", gap: 20, flexWrap: "wrap", marginBottom: stand.target !== null ? 12 : 0 } },
      h(Stat, { label: "السعرات", value: ar(totals.calories), tint: T.cta }),
      h(Stat, { label: "الوجبات", value: ar(totals.count) }),
      totals.protein !== null && h(Stat, { label: "بروتين", value: ar(totals.protein), unit: "غ", tint: T.sky }),
    ),
    stand.target !== null &&
      h(
        "div",
        null,
        h(ProgressBar, { pct: Math.min(100, Math.max(0, stand.pct)) }),
        h(
          "div",
          { style: { marginTop: 6, fontSize: 11.5, color: T.muted } },
          stand.left >= 0 ? `باقي ${ar(stand.left)} سعرة من الهدف` : `تجاوزت الهدف بـ ${ar(-stand.left)} سعرة`,
        ),
      ),
  );
}

function AdviceCard({ nutrition }) {
  const notes = useMemo(() => nutritionAdvise(nutrition, dayKey()), [nutrition]);
  if (!notes.length) return null;
  const tones = { door: T.cta, push: T.accent, ask: T.sky };
  return h(
    Card,
    null,
    h("div", { style: { marginBottom: 10, fontSize: 15, fontWeight: 700 } }, "✦ ملاحظة"),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 8 } },
      notes.map((n) =>
        h(
          "div",
          { key: n.id, style: { fontSize: 13, lineHeight: 1.7, color: "rgba(253,248,246,0.85)", paddingRight: 12, borderRight: `2px solid ${tones[n.tone] || T.accent}` } },
          n.text,
        ),
      ),
    ),
  );
}

function AddMealRow({ onAdd }) {
  const [meal, setMeal] = useState("snack");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!name.trim() || !Number(calories)) return;
    onAdd({
      meal,
      name: name.trim(),
      calories: Number(calories),
      protein: protein ? Number(protein) : undefined,
    });
    setName("");
    setCalories("");
    setProtein("");
  };

  return h(
    Card,
    null,
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 12 : 0 } },
      h("div", { style: { fontSize: 17, fontWeight: 700 } }, "تسجيل وجبة"),
      h(Btn, { outline: true, onClick: () => setOpen((v) => !v) }, open ? "إغلاق" : "+ وجبة"),
    ),
    open &&
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 10 } },
        h(
          "div",
          { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
          MEAL_TYPES.map((m) => h(Pill, { key: m.id, active: meal === m.id, tint: T.cta, onClick: () => setMeal(m.id) }, m.label)),
        ),
        h(Field, { value: name, onChange: (e) => setName(e.target.value), placeholder: "اسم الوجبة — أرز ودجاج" }),
        h(
          "div",
          { style: { display: "flex", gap: 8 } },
          h(Field, { type: "number", dir: "ltr", value: calories, onChange: (e) => setCalories(e.target.value), placeholder: "السعرات", style: { flex: 1 } }),
          h(Field, { type: "number", step: "0.1", dir: "ltr", value: protein, onChange: (e) => setProtein(e.target.value), placeholder: "بروتين غ (اختياري)", style: { flex: 1 } }),
        ),
        h(Btn, { disabled: !name.trim() || !Number(calories), onClick: submit }, "سجّل"),
      ),
  );
}

function MealRow({ m, onDelete }) {
  const label = MEAL_TYPES.find((t) => t.id === m.meal)?.label || "وجبة";
  return h(
    "div",
    { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" } },
    h(
      "div",
      null,
      h("span", { style: { fontSize: 11, fontWeight: 700, color: T.faint } }, label + " · "),
      h("span", { style: { fontSize: 13 } }, m.name),
    ),
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 10 } },
      h("span", { style: { fontSize: 13, fontWeight: 700 }, dir: "ltr" }, `${ar(m.calories)} سعرة`),
      h("button", { onClick: () => onDelete(m), "aria-label": `احذف ${m.name}`, style: { background: "none", border: "none", color: T.faint, fontSize: 14 } }, "✕"),
    ),
  );
}

function TodayMeals({ nutrition, onDelete }) {
  const meals = useMemo(() => mealsOn(nutrition, dayKey()), [nutrition]);
  return h(
    Card,
    null,
    h("div", { style: { fontSize: 17, fontWeight: 700, marginBottom: 4 } }, `وجبات اليوم (${meals.length})`),
    !meals.length
      ? h("p", { style: { fontSize: 13, color: T.faint, padding: "16px 0", textAlign: "center" } }, "لا وجبة مسجَّلة اليوم بعد.")
      : h("div", null, meals.map((m) => h(MealRow, { key: m.id, m, onDelete }))),
  );
}

function TargetCard({ nutrition, onSaveTarget }) {
  const t = nutrition.target;
  const [calories, setCalories] = useState(t.calories || "");
  const [protein, setProtein] = useState(t.protein || "");

  return h(
    Card,
    null,
    h("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 10 } }, "هدف السعرات اليومي"),
    h(
      "div",
      { style: { display: "flex", gap: 8 } },
      h(Field, { type: "number", dir: "ltr", value: calories, onChange: (e) => setCalories(e.target.value), placeholder: "سعرات", style: { flex: 1 } }),
      h(Field, { type: "number", step: "0.1", dir: "ltr", value: protein, onChange: (e) => setProtein(e.target.value), placeholder: "بروتين غ (اختياري)", style: { flex: 1 } }),
      h(Btn, { onClick: () => onSaveTarget({ calories: calories || undefined, protein: protein || undefined }) }, "حفظ"),
    ),
  );
}

function WeekCard({ nutrition }) {
  const r = useMemo(() => nutritionWeekReview(nutrition, dayKey()), [nutrition]);
  if (r.thisWeek.avgCalories === null) return null;
  return h(
    Card,
    null,
    h("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 8 } }, "متوسط الأسبوع"),
    h(
      "div",
      { style: { fontSize: 13, color: T.muted } },
      `${ar(r.thisWeek.avgCalories)} سعرة/يوم — ${ar(r.thisWeek.loggedDays)} من 7 أيام مسجَّلة` +
        (r.lastWeek.avgCalories !== null ? ` (الماضي: ${ar(r.lastWeek.avgCalories)})` : ""),
    ),
  );
}

export function NutritionView({ gym, nutrition, onAdd, onDelete, onSaveTarget }) {
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 20 } },
    h(TodayCard, { nutrition }),
    h(AdviceCard, { nutrition }),
    h(AddMealRow, { onAdd }),
    h(TodayMeals, { nutrition, onDelete }),
    h(WeekCard, { nutrition }),
    h(TargetCard, { nutrition, onSaveTarget }),
  );
}
