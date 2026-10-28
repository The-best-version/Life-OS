/* --- التحويلات: من رسالة مفهومة إلى حالة جديدة -----------------------------
 *  كل دالة هنا تأخذ `state` (حالة Life OS كاملة، كما يحمّلها `gym-client.js`)
 *  ومعطيات القرار، وتعيد إما `{ next }` — الحالة كاملة لتُكتب — أو
 *  `{ refused }`. لا شيء هنا يكتب مباشرة إلى القرص؛ هذا عمل `gym-client.js`
 *  وحده، ولا شيء هنا يخترع حساباً: كل رقم في الردّ يمرّ عبر دوال
 *  `life-state-gym.mjs` نفسها التي تقرأها الشاشة، فلا يختلف البوت والموقع
 *  عن اليوم نفسه.
 * --------------------------------------------------------------------- */
import {
  gymShape,
  logWorkout,
  logWeigh,
  logMeasure,
  logExercise,
  exerciseAdvice,
  liveSports,
  weekLoad,
  gymRun,
  restDays,
  latestWeigh,
  weighTrend,
  targetStand,
  gymAdvise,
  gymWeekReview,
  HARD_LABELS,
  MEASURE_FIELDS,
  dayKey,
  logMeal,
  MEAL_TYPES,
  dayTotals,
  calorieStand,
  nutritionAdvise,
  nutritionWeekReview,
} from "../../src/state/life-state.mjs";
import { parseGym } from "./parse.js";

const ar = (n) => new Intl.NumberFormat("ar-SA").format(Math.round(Number(n) || 0));

/* المسار الوحيد الذي يحتاج رياضات الحالة الحيّة ليفهم الجملة، فهو ما
   يقرأها ويمرّرها لـ`parseGym` النقية — لا شبكة ولا حالة هناك. */
export function route(state, text) {
  const sports = liveSports(state.gym);
  const routineExercises = (state.gym?.routines || []).flatMap((r) =>
    (r.exercises || []).map((e) => (typeof e === "object" ? e.name : String(e)))
  );
  const parsed = parseGym(text, sports, routineExercises);
  switch (parsed.kind) {
    case "help":
      return { refused: null, help: true };
    case "status":
      return { refused: null, status: true };
    case "week":
      return { refused: null, week: true };
    case "nutrition":
      return { refused: null, nutrition: true };
    case "weight":
      return logWeighMsg(state, parsed);
    case "measure":
      return logMeasureMsg(state, parsed);
    case "workout":
      return logWorkoutMsg(state, parsed);
    case "exercise":
      return logExerciseMsg(state, parsed);
    case "meal":
      return logMealMsg(state, parsed);
    default:
      return { refused: parsed.reply || null, unknown: true };
  }
}

export function logExerciseMsg(state, { exercise, rawName, weight, reps, sets, setType }) {
  if (weight === null || Number.isNaN(Number(weight))) {
    return { refused: "ما لقيت وزن التمرين. مثال: «صدر مستوي 50x10»." };
  }
  const gym = logExercise(state.gym, {
    exercise,
    weight,
    reps: reps || 10,
    sets: sets || 1,
    setType: setType || "working",
  });
  const advice = exerciseAdvice(gym, exercise);
  const adviceLine = advice ? `\n💡 نصيحة الكوتش: ${advice.text}` : "";
  const isPR = gym.exerciseLogs?.[0]?.isPR;
  const is1RMPR = gym.exerciseLogs?.[0]?.is1RMPR;
  const prLine = isPR || is1RMPR ? "\n🔥 كفو! هذا أعلى وزن سجلته في هذا التمرين (PR جديد)!" : "";
  const nameLabel = rawName && rawName !== exercise ? `${rawName} (${exercise})` : exercise;
  return {
    next: { ...state, gym },
    before: { gym: state.gym },
    reply: `✅ تم تسجيل تمرين ${nameLabel}: ${weight} كجم × ${reps || 10} تكرار.${prLine}${adviceLine}`,
  };
}

export function logWeighMsg(state, { kg, fat }) {
  if (!Number(kg) || Number(kg) <= 0) return { refused: "ما فهمت الوزن. مثال: «وزن 82.5»." };
  const gym = logWeigh(state.gym, { date: undefined, kg, fat });
  const fatLine = fat ? ` — دهون ${fat}٪` : "";
  return {
    next: { ...state, gym },
    before: { gym: state.gym },
    reply: `✅ سُجّل وزنك: ${kg} كجم${fatLine}.`,
  };
}

export function logMeasureMsg(state, { fields }) {
  const gym = logMeasure(state.gym, { date: undefined, ...fields });
  const said = MEASURE_FIELDS.filter((f) => fields[f.id] !== undefined)
    .map((f) => `${f.label} ${fields[f.id]}`)
    .join("، ");
  return {
    next: { ...state, gym },
    before: { gym: state.gym },
    reply: `✅ سُجّل القياس: ${said}.`,
  };
}

export function logWorkoutMsg(state, { sportId, sportLabel, minutes, hard, rounds, roundMin }) {
  const gym = logWorkout(state.gym, {
    date: undefined,
    sport: sportId,
    title: sportLabel,
    minutes,
    hard,
    rounds,
    roundMin,
  });
  const roundsNote = rounds !== null && roundMin !== null ? ` (${ar(rounds)} جولات × ${roundMin} دقيقة)` : "";
  return {
    next: { ...state, gym },
    before: { gym: state.gym },
    reply: `✅ ${sportLabel}: ${ar(minutes)} دقيقة${roundsNote} — ${HARD_LABELS[hard]}.`,
  };
}

const MEAL_LABELS = Object.fromEntries(MEAL_TYPES.map((m) => [m.id, m.label]));

export function logMealMsg(state, { meal, name, calories }) {
  const nutrition = logMeal(state.nutrition, { date: undefined, meal, name, calories });
  const totals = dayTotals(nutrition, dayKey());
  return {
    next: { ...state, nutrition },
    before: { nutrition: state.nutrition },
    reply: `✅ ${MEAL_LABELS[meal]} — ${name}: ${ar(calories)} سعرة.\nإجمالي اليوم: ${ar(totals.calories)} سعرة من ${ar(totals.count)} وجبة.`,
  };
}

/* التغذية — قراءة بلا كتابة، مثل «ملخص» للنادي. */
export function nutritionStatusText(state) {
  const n = state.nutrition;
  const totals = dayTotals(n, dayKey());
  const stand = calorieStand(n, dayKey());
  const lines = [];
  lines.push(
    totals.count
      ? `اليوم: ${ar(totals.calories)} سعرة من ${ar(totals.count)} وجبة.`
      : "ما سجّلت وجبة اليوم بعد.",
  );
  if (stand.target !== null) {
    lines.push(`الهدف: ${ar(stand.calories)} من ${ar(stand.target)} سعرة${stand.left >= 0 ? ` — باقي ${ar(stand.left)}` : ` — تجاوزت بـ ${ar(-stand.left)}`}.`);
  }
  if (totals.protein !== null) lines.push(`بروتين: ${ar(totals.protein)} غ.`);
  const notes = nutritionAdvise(n, dayKey());
  if (notes.length) lines.push("", ...notes.map((x) => "• " + x.text));
  return lines.join("\n");
}

/* الحالة — قراءة بلا كتابة. يُبنى من نفس الدوال التي ترسم «الرئيسية». */
export function statusText(state) {
  const gym = state.gym;
  const week = weekLoad(gym);
  const run = gymRun(gym);
  const weigh = latestWeigh(gym);
  const trend = weighTrend(gym, 30);
  const lines = [];
  lines.push(
    week.planned
      ? `أسبوعك: ${ar(week.done)} من ${ar(week.planned)} حصة.`
      : `أسبوعك: ${ar(week.done)} حصة.`,
  );
  if (run) lines.push(`سلسلة: ${ar(run)} يوم متتابع.`);
  if (weigh) {
    const t = trend ? ` (${trend.delta > 0 ? "+" : ""}${trend.delta} كجم / ${ar(trend.days)} يوم)` : "";
    lines.push(`الوزن: ${weigh.kg} كجم${t}.`);
  }
  const stand = targetStand(gym);
  if (stand.kg !== null && stand.pct !== null) {
    lines.push(`الهدف: ${ar(stand.pct)}٪ من الطريق${stand.left !== null ? ` — باقي ${ar(stand.left)} يوم` : ""}.`);
  }
  const notes = gymAdvise(gym, dayKey(), state.sleepLogs);
  if (notes.length) lines.push("", ...notes.map((n) => "• " + n.text));
  return lines.join("\n");
}

export const HELP_TEXT = [
  "أرسل جملة عادية لتسجيل تمارينك وأوزانك:",
  "• «صدر مستوي 50x10» أو «تسجيل وزن 50 صدر مستوي» — يسجّل تمرينك بالجلسة والتكرار",
  "• «وزن 82.5» أو «وزن 82.5 دهون 18» — يسجّل وزن اليوم ونسبة الدهون (اختيارية)",
  "• «جيم 55 دقيقة» — يسجّل حصة رياضية كاملة",
  "• «قياس خصر 86» — يسجّل قياس الشريط",
  "• «ملخص» أو «وضعي» — يعرض وضعك الحالي وأسبوعك",
  "• «ملخص الأسبوع» أو «اسبوعي» — يقارن أسبوعك بالأسبوع الماضي",
  "• «اكلت أرز ودجاج 650 سعرة» أو «اكلت فطور بيض 400 سعرة» — يسجّل وجبة",
  "• «سعراتي» أو «تغذيتي» — يعرض سعرات اليوم مقابل هدفك",
].join("\n");

/* المراجعة الأسبوعية — مبنيّة بالحرف على `gymWeekReview` (طبقة الحالة)،
   فلا رقم هنا مخترع. ولا تُسكَت أبداً: أسبوع بلا حصص هو أهم ما تقوله
   المراجعة، لا سبباً لصمتها. */
export function weekReviewText(state) {
  const r = gymWeekReview(state.gym, dayKey(), state.sleepLogs);
  const lines = ["🗓️ ملخص الأسبوع", ""];

  const sign = (n) => (n > 0 ? "+" : "");
  lines.push(
    r.thisWeek.planned
      ? `• الحصص: ${ar(r.thisWeek.done)} من ${ar(r.thisWeek.planned)} (الماضي: ${ar(r.lastWeek.done)})`
      : `• الحصص: ${ar(r.thisWeek.done)} (الماضي: ${ar(r.lastWeek.done)})`,
  );
  lines.push(`• الدقائق: ${ar(r.thisWeek.minutes)} (الماضي: ${ar(r.lastWeek.minutes)})`);

  if (r.weighT && r.weighT.delta !== 0) {
    lines.push(`• الوزن: ${sign(r.weighT.delta)}${r.weighT.delta} كجم هذا الأسبوع.`);
  }
  if (r.fatT && r.fatT.delta !== 0) {
    lines.push(`• الدهون: ${sign(r.fatT.delta)}${r.fatT.delta}٪ هذا الأسبوع.`);
  }
  if (r.sleepAvg !== null) {
    lines.push(`• النوم: ${r.sleepAvg} س/ليلة في المتوسط.`);
  }

  if (r.prs.length) {
    lines.push("", `🔥 أرقام جديدة هذا الأسبوع (${ar(r.prs.length)}):`);
    for (const p of r.prs) lines.push(`  • ${p.exercise}: ${p.weight} كجم × ${p.reps}`);
  }

  if (r.neglected.length) {
    lines.push("", `⚠️ قليل الحجم هذا الأسبوع: ${r.neglected.map((m) => m.label).join("، ")}.`);
  }

  if (!r.thisWeek.done) {
    lines.push("", "ما سجّلت حصة هذا الأسبوع — ابدأ بأقل شيء.");
  }

  const nr = nutritionWeekReview(state.nutrition, dayKey());
  if (nr.thisWeek.avgCalories !== null) {
    const cmp = nr.lastWeek.avgCalories !== null ? ` (الماضي: ${ar(nr.lastWeek.avgCalories)})` : "";
    lines.push("", `🍽️ متوسط السعرات: ${ar(nr.thisWeek.avgCalories)}${cmp} — ${ar(nr.thisWeek.loggedDays)} من 7 أيام مسجَّلة.`);
  }

  return lines.join("\n");
}

/* الركود — تُستدعى من المُجَدوِل اليومي فقط، لا من رسالة. تعيد نصاً أو
   `null` حين لا يوجد ما يُقال، لأن رسالة تصل كل مساء بلا جديد تُعلِّم
   تمريرها بلا قراءة. */
export function dailyCheck(state) {
  const notes = [
    ...gymAdvise(state.gym, dayKey(), state.sleepLogs),
    ...nutritionAdvise(state.nutrition, dayKey()),
  ];
  if (!notes.length) return null;
  return notes.map((n) => "• " + n.text).join("\n");
}
