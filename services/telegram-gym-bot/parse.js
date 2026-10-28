/* --- قراءة رسالة النادي كما كُتبت فعلاً -----------------------------------
 *  نفس قاعدة بوت Life OS بالحرف: المحفّز أول كلمة، لا كلمة مُنقَّبة في أي
 *  مكان من الجملة — «وش رأيك بوزني؟» ليست تسجيل وزن لأن «وزن» لم تكن أول
 *  كلمة، وسؤال يُقرأ تسجيلاً أسوأ من سؤال بلا جواب.
 *
 *  نقية، بلا شبكة ولا حالة ولا grammY — وهذا هو ما يسمح لاختبار الوحدة
 *  أن يحمّلها بلا تثبيت شيء.
 * --------------------------------------------------------------------- */
const DIGIT_MAP = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٫": ".", "٬": "",
};
export const asciiDigits = (s) => String(s).replace(/[٠-٩۰-۹٫٬]/g, (c) => DIGIT_MAP[c] ?? c);

/* نفس `fold` في بوت Life OS: تطبيع للمطابقة فقط، لا يُخزَّن أبداً —
   تهجئته لاسم رياضته هي تهجئته، لا نسخة طُبِّعت على الطريق إلى الملف. */
export const fold = (s) =>
  asciiDigits(s)
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s.+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const EDGE_R = "(?![\\p{L}\\p{N}])";
const NUMBER = /\d+(?:\.\d+)?/;

const WEIGHT_TRIGGERS = ["وزني", "وزن"];
const MEASURE_TRIGGER = "قياس";
const WORKOUT_LEAD = ["تدربت", "سجل", "حصة", "سجلت", "تسجيل", "تمرنت", "تمرين"]; // تُحذف إن كانت أول كلمة قبل اسم الرياضة
const STATUS_TRIGGERS = ["وضعي", "ملخص", "تقرير", "حالتي", "تمريني", "جدولي"];
/* فُحصت قبل `STATUS_TRIGGERS` عمداً — «ملخص الأسبوع» تبدأ بكلمة «ملخص»
   أيضاً، فلا بد أن تُطابَق الجملة الأطول أولاً أو تسبقها. */
const WEEK_TRIGGERS = ["ملخص الاسبوع", "تقرير الاسبوع", "مراجعة الاسبوع", "اسبوعي"];
const HELP_TRIGGERS = ["مساعدة", "اوامر", "أوامر", "help", "start"].map(fold);

/* التغذية — مجال موازٍ للنادي بلا رياضات ولا حصص، فمحفّزاته منفصلة عن
   محفّزات الحصة والوزن تماماً. «اكلت» تُطابِق «أكلت» أيضاً لأن `fold`
   يسقط الهمزة الأولى. */
const FOOD_TRIGGERS = ["اكلت", "تناولت", "وجبة"];
const NUTRITION_STATUS_TRIGGERS = ["سعراتي", "تغذيتي", "سعرات اليوم"];
const MEAL_WORDS = [
  { words: ["فطور", "فطوري"], id: "breakfast" },
  { words: ["غداء", "غدائي", "غدا", "غدائي اليوم"], id: "lunch" },
  { words: ["عشاء", "عشائي", "عشا"], id: "dinner" },
  { words: ["سناك", "سناكي", "وجبة خفيفة"], id: "snack" },
];
const CALORIE_WORD = /سعره|سعرة|سعرات|كالوري|كالوريز/u;

const HARD_WORDS = [
  { words: ["خفيف", "خفيفه", "خفيفة"], v: 1 },
  { words: ["متوسط", "متوسطه", "متوسطة"], v: 2 },
  { words: ["عالي", "عاليه", "عالية", "عال"], v: 3 },
];

const EXERCISE_STOP = new Set([
  "وزن", "وزني", "كجم", "كيلو", "كيلوغرام", "جلسة", "جلسه",
  "جولة", "جوله", "تكرار", "عدات", "عده", "عدة", "تسجيل", "سجل", "سجلت", "تمرنت"
]);

const EXERCISE_MAP = [
  { match: ["صدر مستوي", "بنش مستوي", "بنش بار مستوي", "ضغط صدر", "صدر بار", "بنش بار", "صدر دمبل", "صدر"], target: "Chest Press" },
  { match: ["صدر علوي", "بنش علوي", "انكلين دمبل", "انكلين بار", "انكلين"], target: "Incline Dumbbell Press" },
  { match: ["كتف", "اكتاف", "شولدر", "ضغط كتف"], target: "Shoulder Press" },
  { match: ["رفرفة", "رفرفه", "رفرفة جانبي", "رفرفه جانبي"], target: "Lateral Raises" },
  { match: ["تراي", "ترايسبس", "كيبل تراي", "بوش داون"], target: "Cable Tricep Pushdown" },
  { match: ["سحب ظهر", "سحب عالي", "ظهر عالي", "لات بول داون"], target: "Wide Lat Pulldown" },
  { match: ["سحب ارضي", "سحب جالس", "سيتد رو"], target: "Wide Seated Row" },
  { match: ["دمبل رو", "منشار", "سحب دمبل"], target: "Dumbbell Row" },
  { match: ["فيس بول", "فيس بولز"], target: "Face Pull" },
  { match: ["باي دمبل", "بايسبس دمبل", "باي جالس", "باي"], target: "Incline Dumbbell Curl" },
  { match: ["باي كيبل", "بايسبس كيبل"], target: "Cable Bicep Curl" },
  { match: ["سكوات", "ليج بريس", "ارجل جهاز", "ضغط ارجل"], target: "Squat / Leg Press" },
  { match: ["رفرفة ارجل", "امامي ارجل", "ارجل امامي", "ليج اكستنشن"], target: "Leg Extension" },
  { match: ["سمانة", "سمانه", "بطات", "كالف"], target: "Standing Calf Raises" },
  { match: ["ديدليفت", "ديد لفت", "روماني", "ديدليفت روماني"], target: "Romanian Deadlift" },
  { match: ["خلفي ارجل", "ارجل خلفي", "ليج كيرل"], target: "Leg Curl" },
];

const ROUNDS = new RegExp("(" + NUMBER.source + ")\\s*(?:جوله|جولات|جولة)", "u");
const MINUTES = new RegExp("(" + NUMBER.source + ")\\s*(?:دقيقه|دقائق|دقيقة|دقايق)" + EDGE_R, "u");

/* حقول الشريط، كما هي مكتوبة في `MEASURE_FIELDS` — مكرَّرة هنا بأسمائها
   العربية وحدها لأن هذا الملف لا يرى طبقة الحالة؛ الربط بالمعرّف يحدث في
   actions.js الذي يستورد `MEASURE_FIELDS` الحقيقية. */
const MEASURE_WORDS = [
  { id: "chest", words: ["صدر"] },
  { id: "waist", words: ["خصر"] },
  { id: "hips", words: ["ارداف", "أرداف"] },
  { id: "arm", words: ["ذراع"] },
  { id: "thigh", words: ["فخذ"] },
  { id: "neck", words: ["رقبه", "رقبة"] },
];

const startsWithWord = (folded, word) => {
  const f = fold(word);
  return folded === f || folded.startsWith(f + " ");
};

/* اسم الرياضة محفوظ بأداة التعريف («الجيم»)، وأحد لا يكتبها في جملة
   عادية («جيم ٤٠ دقيقة»). المطابقة تقبل الاسم بالأداة أو بدونها. */
const bare = (w) => w.replace(/^ال/, "");
const startsWithSport = (folded, label) => {
  const f = fold(label);
  return startsWithWord(folded, f) || startsWithWord(folded, bare(f));
};

const FAT = new RegExp("(?:دهون|فات)\\s*(" + NUMBER.source + ")", "u");

function parseWeight(text) {
  const fatM = text.match(FAT);
  /* الدهون تُستخرَج وتُزال أولاً، حتى لا يلتقط رقم الوزن رقمها خطأً في
     جملة مثل «وزن 82.5 دهون 18». */
  const withoutFat = fatM ? text.replace(fatM[0], " ") : text;
  const m = withoutFat.match(NUMBER);
  if (!m) return { kind: "unknown", reply: "ما لقيت رقماً. مثال: «وزن 82.5» أو «وزن 82.5 دهون 18»." };
  return { kind: "weight", kg: Number(m[0]), fat: fatM ? Number(fatM[1]) : null };
}

function parseMeasure(text) {
  const fields = {};
  for (const f of MEASURE_WORDS) {
    for (const w of f.words) {
      const re = new RegExp(fold(w) + "\\s*(" + NUMBER.source + ")", "u");
      const m = text.match(re);
      if (m) {
        fields[f.id] = Number(m[1]);
        break;
      }
    }
  }
  if (!Object.keys(fields).length) {
    return { kind: "unknown", reply: "اكتب الحقل ورقمه، مثال: «قياس خصر 86 صدر 102»." };
  }
  return { kind: "measure", fields };
}

/* `rest` هنا نصّ بعد حذف محفّز «اكلت» الأول — نوع الوجبة إن وُجد هو
   الكلمة الثانية تحديداً، لا كلمة منقَّبة في أي مكان، لنفس سبب أن
   المحفّز نفسه أول كلمة: «فطور» في منتصف جملة وصفية ليست نوع الوجبة. */
function parseMeal(rest) {
  const words = rest.split(" ").filter(Boolean);
  let meal = null;
  let nameWords = words;
  if (words.length) {
    const found = MEAL_WORDS.find((m) => m.words.some((w) => fold(w) === words[0]));
    if (found) {
      meal = found.id;
      nameWords = words.slice(1);
    }
  }
  const text = nameWords.join(" ");
  const m = text.match(NUMBER);
  if (!m) {
    return { kind: "unknown", reply: "ما لقيت السعرات. مثال: «اكلت أرز ودجاج 650 سعرة»." };
  }
  const calories = Number(m[0]);
  const name = text
    .replace(m[0], " ")
    .replace(CALORIE_WORD, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) {
    return { kind: "unknown", reply: "اكتب اسم الوجبة مع السعرات. مثال: «اكلت أرز ودجاج 650 سعرة»." };
  }
  return { kind: "meal", meal: meal || "snack", name, calories };
}

function parseWorkout(text, sport) {
  const roundsM = text.match(ROUNDS);
  const minutesM = text.match(MINUTES);
  let rounds = null;
  let roundMin = null;
  let minutes = null;
  if (roundsM) {
    rounds = Number(roundsM[1]);
    if (minutesM) roundMin = Number(minutesM[1]);
    minutes = roundMin !== null ? rounds * roundMin : null;
  } else if (minutesM) {
    minutes = Number(minutesM[1]);
  }
  let hard = 2;
  for (const h of HARD_WORDS) {
    if (h.words.some((w) => text.includes(fold(w)))) {
      hard = h.v;
      break;
    }
  }
  if (minutes === null) {
    return { kind: "unknown", reply: `كم دقيقة؟ مثال: «${sport.label} 40 دقيقة».` };
  }
  return { kind: "workout", sportId: sport.id, sportLabel: sport.label, minutes, hard, rounds, roundMin };
}

export function parseExercise(folded, routineExercises = []) {
  let clean = folded;
  for (const w of ["تسجيل", "سجل", "سجلت", "تدربت", "تمرين"]) {
    if (clean.startsWith(w + " ")) clean = clean.slice(w.length).trim();
  }

  // If text has minutes or rounds, it's a workout session, not an exercise set
  if (MINUTES.test(clean) || ROUNDS.test(clean)) return null;

  const xPattern = /(\d+(?:\.\d+)?)\s*(?:[xX*×]|تكرار|عدات|عده|عدة)\s*(\d+)/u;
  const xMatch = clean.match(xPattern);
  let weight = null;
  let reps = 10;
  let rawEx = "";

  if (xMatch) {
    weight = Number(xMatch[1]);
    reps = Number(xMatch[2]);
    rawEx = clean.replace(xMatch[0], " ");
  } else {
    const numMatch = clean.match(/\b(\d+(?:\.\d+)?)\b/);
    if (!numMatch) return null;
    weight = Number(numMatch[1]);
    rawEx = clean.replace(numMatch[0], " ");
  }

  const words = rawEx.split(/\s+/).filter((w) => !EXERCISE_STOP.has(w) && w.length > 0);
  const exerciseRaw = words.join(" ").trim();
  if (!exerciseRaw || exerciseRaw.length < 2) return null;
  if (["جيم", "حصة", "قياس", "بوكسنج", "وقت", "دقايق", "دقائق", "دقيقة"].includes(exerciseRaw)) return null;

  // Find target in routine or aliases
  let finalName = exerciseRaw;
  for (const map of EXERCISE_MAP) {
    if (map.match.some((m) => exerciseRaw.includes(m) || m.includes(exerciseRaw))) {
      finalName = map.target;
      break;
    }
  }

  /* هل تعرّفنا على اسم التمرين فعلاً، أو بقي كما كُتب بلا تمييز؟ الفرق
     هذا هو ما يمنع كلمة عابرة بعد رقم («اليوم»، «امس») من أن تصير
     تمريناً مخترَعاً — انظر `parseGym` حيث يُشترط هذا العلم قبل تفضيل
     القراءة كتمرين على قراءتها وزناً. */
  let recognized = finalName !== exerciseRaw;

  if (routineExercises && routineExercises.length) {
    const found = routineExercises.find(
      (rx) => fold(rx) === fold(finalName) || fold(rx) === fold(exerciseRaw)
    );
    if (found) {
      finalName = found;
      recognized = true;
    }
  }

  return {
    kind: "exercise",
    exercise: finalName,
    rawName: exerciseRaw,
    weight,
    reps,
    sets: 1,
    setType: "working",
    recognized,
  };
}

/* `sports` خاصّته — رياضاته هو، لا بذرة ثابتة. يُمرَّر من `actions.js` الذي
   يقرأه من الحالة الحيّة، لأن هذا الملف نفسه نقيّ ولا يلمس القرص. */
export function parseGym(raw, sports = [], routineExercises = []) {
  const text = String(raw || "").trim();
  if (!text) return { kind: "unknown", reply: null };
  const folded = fold(text);
  const first = folded.split(" ")[0] || "";

  if (HELP_TRIGGERS.includes(first) || text.startsWith("/")) return { kind: "help" };
  if (WEEK_TRIGGERS.some((w) => startsWithWord(folded, w))) return { kind: "week" };
  if (NUTRITION_STATUS_TRIGGERS.some((w) => startsWithWord(folded, w))) return { kind: "nutrition" };
  if (STATUS_TRIGGERS.some((w) => startsWithWord(folded, w))) return { kind: "status" };
  if (startsWithWord(folded, MEASURE_TRIGGER)) return parseMeasure(folded);

  const foodLead = FOOD_TRIGGERS.find((w) => startsWithWord(folded, w));
  if (foodLead) return parseMeal(folded.slice(fold(foodLead).length).trim());

  /* اسم الرياضة أول كلمة، أو ثاني كلمة بعد فعل قيادة («تدربت بوكسنج...»). */
  let rest = folded;
  const leadWord = folded.split(" ")[0];
  const hadLead = WORKOUT_LEAD.some((w) => fold(w) === leadWord);
  if (hadLead) rest = folded.slice(leadWord.length).trim();

  // Check sport workout with minutes or rounds (e.g. "جيم 40 دقيقة")
  const sport = sports.find((s) => startsWithSport(rest, s.label));
  if (sport) {
    const w = parseWorkout(rest, sport);
    if (w.kind === "workout" || (w.kind === "unknown" && w.reply)) return w;
  }

  /* «وزن»/«وزني» تعني وزن الجسم افتراضاً دائماً («وزني اليوم 82.5» —
     كلمة «اليوم» بعدها ليست تمريناً). الاستثناء الوحيد: فعل قيادة صريح
     («تسجيل وزن 50 صدر مستوي») مع اسم تمرين **معروف فعلاً** بعده — لا أي
     كلمة باقية. بلا الشرطين معاً فالوزن يفوز دائماً؛ تمرين غير معروف
     يُقرأ خطأً أسوأ من وزن غير مقصود، لأنه يخترع سطراً لم يُطلَب. */
  if (WEIGHT_TRIGGERS.some((w) => startsWithWord(rest, w))) {
    if (hadLead) {
      const ex = parseExercise(folded, routineExercises);
      if (ex && ex.recognized) return ex;
    }
    return parseWeight(rest);
  }

  const ex = parseExercise(folded, routineExercises);
  if (ex && ex.recognized) return ex;

  return { kind: "unknown" };
}
