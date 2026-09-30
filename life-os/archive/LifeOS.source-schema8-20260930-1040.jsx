import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createRoot } from "react-dom";
import {
  Menu,
  X,
  ListChecks,
  LayoutGrid,
  Library,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Check,
  Star,
  Flame,
  Quote,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Target,
  Clock,
  Zap,
  Trash,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Bed,
  GripVertical,
  RotateCcw,
  TrendingUp,
  ImagePlus,
  MoonStar,
  HeartPulse,
  Briefcase,
  Wallet,
  Users,
  Sparkles,
  Flag,
  Settings,
  Timer,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Coins,
  Lightbulb,
  NotebookPen,
  Bot,
  Swords,
  Kanban,
  ScanFace,
  Copy,
  CheckCheck,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

/* ==================================================================== *
 *  2027 LIFE OS — modular discipline system
 *  React + Tailwind CSS + lucide-react. Single file, no other deps.
 *  Install: npm i lucide-react
 *
 *  Note on Shadcn UI: shadcn is a set of components you copy into a
 *  project via its CLI (it compiles down to Radix UI + Tailwind), not a
 *  package you can import. The primitives below (Card, Btn, Field,
 *  Modal, Badge) follow shadcn's token model and API shape so this file
 *  stays dependency-free and drops straight into any React app.
 * ==================================================================== */

/* --- tokens --------------------------------------------------------- *
 *  "Vibrant Deep Slate" — an energetic canvas, not a void. Emerald is
 *  reserved for success (a done habit, a banked streak); Electric Coral
 *  drives every primary call to action; amber marks achievement.
 * -------------------------------------------------------------------- */
const T = {
  /* Warm charcoal, not blue slate. A blue-grey ground plus muted accents is
     exactly the palette of a trading terminal — warmth is what makes this
     read as a place to live rather than a dashboard to monitor. */
  bg: "#1B1418",
  bgDeep: "#120C10",
  bgLift: "#2A2028",
  card: "rgba(255,255,255,0.06)",
  cardSolid: "#2A2028",
  border: "rgba(255,255,255,0.13)",
  borderStrong: "rgba(255,255,255,0.24)",
  fg: "#FDF8F6",
  muted: "rgba(253,248,246,0.58)",
  faint: "rgba(253,248,246,0.34)",
  primary: "#10B981",
  primaryLift: "#34D399",
  cta: "#FF5722",
  ctaLift: "#FF8A50",
  accent: "#FFB020",
  violet: "#9D5CFF",
  sky: "#00C2FF",
  rose: "#FF4D8D",
  indigo: "#5B8CFF",
  ember: "#FF7A45",
  danger: "#FF3B5C",
};

/* Frosted glass, not a flat tint: a diagonal sheen falling to transparent,
   a brighter rim, and an inset top highlight standing in for the lit edge
   of a real pane of glass. */
const GLASS = {
  backgroundColor: "rgba(255,255,255,0.05)",
  backgroundImage:
    "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 48%, rgba(255,255,255,0) 100%)",
  borderColor: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(20px) saturate(165%)",
  boxShadow:
    "inset 0 1px 0 0 rgba(255,255,255,0.12), 0 18px 42px -28px rgba(0,0,0,0.85)",
};

/* --- navigation ------------------------------------------------------ */
const NAV = [
  { id: "routine", label: "الروتين اليومي", short: "الروتين", icon: ListChecks },
  { id: "matrix", label: "مصفوفة المهام", short: "المهام", icon: LayoutGrid },
  { id: "deep", label: "العمل العميق", short: "التركيز", icon: Timer },
  { id: "goals", label: "أهداف ٢٠٢٧", short: "الأهداف", icon: Flag },
  { id: "pipeline", label: "خط سير المشاريع", short: "المسار", icon: Kanban },
  { id: "tactical", label: "المراجعة التكتيكية", short: "التكتيك", icon: Swords },
  { id: "finance", label: "الدخل والمشاريع", short: "الدخل", icon: Wallet },
  { id: "prompts", label: "خزنة الأوامر", short: "الأوامر", icon: Bot },
  { id: "vault", label: "مكتبة الإنجازات", short: "المكتبة", icon: Library },
  { id: "analytics", label: "التتبع الشهري", short: "التتبع", icon: BarChart3 },
];

/* --- kanban ----------------------------------------------------------- */
const LANES = [
  { id: "todo", label: "للتنفيذ", tint: "#5B8CFF" },
  { id: "doing", label: "جاري العمل", tint: "#FFB020" },
  { id: "done", label: "مكتمل", tint: T.primary },
];

/* --- deep work -------------------------------------------------------- */
const SESSIONS = [
  { min: 25, label: "بومودورو", hint: "جولة قصيرة مركّزة" },
  { min: 90, label: "عمل عميق", hint: "دورة التركيز الكاملة" },
];

/* --- 90-day chunks ---------------------------------------------------- *
 *  A year is too big to act on. Four 90-day blocks are not, and the vault
 *  opens on the one you are living in.
 * ---------------------------------------------------------------------- */
const QUARTERS = [
  { id: "q1", label: "الربع الأول", months: "يناير — مارس", tint: "#00C2FF" },
  { id: "q2", label: "الربع الثاني", months: "أبريل — يونيو", tint: "#9D5CFF" },
  { id: "q3", label: "الربع الثالث", months: "يوليو — سبتمبر", tint: "#FFB020" },
  { id: "q4", label: "الربع الرابع", months: "أكتوبر — ديسمبر", tint: "#FF4D8D" },
];
const currentQuarter = (d = new Date()) => QUARTERS[Math.floor(d.getMonth() / 3)].id;

/* --- the six pillars of 2027 ----------------------------------------- */
const PILLARS = [
  { id: "faith", label: "الإيماني", icon: MoonStar, tint: "#9D5CFF" },
  { id: "health", label: "الصحي", icon: HeartPulse, tint: "#FF7A45" },
  { id: "career", label: "المهني", icon: Briefcase, tint: "#00C2FF" },
  { id: "money", label: "المالي", icon: Wallet, tint: "#FFB020" },
  { id: "social", label: "الاجتماعي", icon: Users, tint: "#FF4D8D" },
  { id: "self", label: "الشخصي", icon: Sparkles, tint: "#5B8CFF" },
];

/* --- routine groups -------------------------------------------------- */
const GROUPS = [
  { id: "morning", label: "الصباح", icon: Sunrise, tint: "#FFB020" },
  { id: "afternoon", label: "بعد الظهر", icon: Sun, tint: "#FF7A45" },
  { id: "asr", label: "بعد العصر", icon: Sunset, tint: "#FF4D8D" },
  { id: "maghrib", label: "بعد المغرب", icon: Moon, tint: "#9D5CFF" },
  { id: "postisha", label: "بعد العشاء", icon: MoonStar, tint: "#00C2FF" },
  { id: "night", label: "قبل النوم", icon: Bed, tint: "#5B8CFF" },
];

/* --- Eisenhower quadrants -------------------------------------------- */
const QUADRANTS = [
  {
    id: "q1",
    label: "عاجل ومهم",
    action: "افعلها الآن",
    tint: "#FF3B5C",
    icon: Zap,
  },
  {
    id: "q2",
    label: "مهم غير عاجل",
    action: "جدولها — هنا يُصنع الـ ٢٠٪",
    tint: "#00C2FF",
    icon: Target,
  },
  {
    id: "q3",
    label: "عاجل غير مهم",
    action: "فوّضها أو قلّصها",
    tint: "#FFB020",
    icon: Clock,
  },
  {
    id: "q4",
    label: "غير عاجل وغير مهم",
    action: "احذفها بلا تردد",
    tint: "rgba(255,255,255,0.3)",
    icon: Trash,
  },
];

/* --- daily cue -------------------------------------------------------- */
const QUOTES = [
  {
    text: "أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك.",
    author: "جيمس كلير",
  },
  {
    text: "إضاعة الوقت أشدّ من الموت؛ لأنها تقطعك عن الله والدار الآخرة.",
    author: "ابن القيّم",
  },
  { text: "اقرأ ما تحبّ حتى تُحبّ القراءة.", author: "نافال رافيكانت" },
  {
    text: "التركيز العميق مهارة نادرة وثمينة في اقتصاد اليوم.",
    author: "كال نيوبورت",
  },
  { text: "حاسبوا أنفسكم قبل أن تُحاسَبوا.", author: "عمر بن الخطاب" },
  {
    text: "ابن آدم، إنما أنت أيام؛ فإذا ذهب يوم ذهب بعضك.",
    author: "الحسن البصري",
  },
  {
    text: "ومن لم يذق مرّ التعلّم ساعة، تجرّع ذلّ الجهل طول حياته.",
    author: "الإمام الشافعي",
  },
  { text: "ليست حياتنا قصيرة، بل نحن نُضيّع كثيرًا منها.", author: "سينيكا" },
  {
    text: "أنت تملك سلطانًا على عقلك، لا على الأحداث. أدرك هذا تجد القوة.",
    author: "ماركوس أوريليوس",
  },
  {
    text: "وقتك محدود، فلا تُضيّعه عيشًا في حياة شخص آخر.",
    author: "ستيف جوبز",
  },
  { text: "الناجحون جدًّا يقولون «لا» لكل شيء تقريبًا.", author: "وارن بافيت" },
  { text: "ما يُقاس، يتحسّن.", author: "بيتر دراكر" },
  { text: "ما يصنع أعدائي بي؟ أنا جنّتي وبستاني في صدري.", author: "ابن تيمية" },
  { text: "العادة هي الفائدة المركّبة لتطوير الذات.", author: "جيمس كلير" },
  {
    text: "من عرف طول الطريق استعدّ له، ومن أيقن بالمنزل هان عليه السفر.",
    author: "ابن القيّم",
  },
  { text: "لا تُصلح عملك لأجل الناس، ولا تُفسده لأجلهم.", author: "الفضيل بن عياض" },
  {
    text: "الانضباط هو اختيار ما تريده أكثر على ما تريده الآن.",
    author: "أبراهام لينكون",
  },
  { text: "أصعب خطوة هي الأولى؛ وما بعدها عادة.", author: "أرسطو" },
  {
    text: "إذا لم تكن لك خطة، فستكون جزءًا من خطة غيرك.",
    author: "تيري ماكميلان",
  },
  { text: "عش يومك كأنه آخر أيامك، واعمل كأنك تعيش أبدًا.", author: "مثل عربي" },
  {
    text: "النجاح مجموع جهود صغيرة تتكرّر يومًا بعد يوم.",
    author: "روبرت كوليير",
  },
  { text: "أفضل وقت لغرس شجرة كان قبل عشرين عامًا، وثانيه اليوم.", author: "مثل صيني" },
  {
    text: "لن تتغيّر حياتك حتى تتغيّر عاداتك اليومية؛ السرّ في جدولك.",
    author: "جون مكسويل",
  },
  {
    text: "من استوى يوماه فهو مغبون، ومن كان غده شرًّا من يومه فهو ملعون.",
    author: "الحسن البصري",
  },
  { text: "التركيز يعني قول «لا» لمئة فكرة جيّدة.", author: "ستيف جوبز" },
  {
    text: "لا يُدرَك العلم براحة الجسم، ولا تُنال المعالي بالتمنّي.",
    author: "الإمام مسلم",
  },
  {
    text: "أنت ما تفعله بتكرار؛ فالتميّز ليس حدثًا بل عادة.",
    author: "ويل ديورانت",
  },
  {
    text: "أعظم ما يملكه المرء وقتٌ فارغ يملؤه بما ينفع.",
    author: "ابن الجوزي",
  },
  { text: "لا تنتظر الإلهام؛ اذهب إليه بعصا غليظة.", author: "جاك لندن" },
  { text: "ما بدأتَه اليوم يصنع من تكون بعد سنة.", author: "سينيكا" },
];

/* --- persistence ------------------------------------------------------ */
const STORAGE_KEY = "life-os-2027:v3";
const UI_KEY = "life-os-2027:ui";
const SCHEMA = 8;
const HISTORY_CAP = 500;
const STREAK_TARGET = 80;
/* 80/20: three real tasks a day beat a list of twenty. Hard cap, on purpose. */
const TOP_TASK_CAP = 3;

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
};
const uid = () => Math.random().toString(36).slice(2, 9);

/* The "بعد العشاء" block was split out of "المساء" in schema 4. These labels
   drive both the seed and the migration, so an existing user's صلاة العشاء
   moves into the new block instead of being duplicated beside it. */
const POSTISHA_LABELS = [
  "صلاة العشاء",
  "تقييم اليوم: التزمت؟",
  "تحضير مهام الغد الثلاث",
];
const LEGACY_POSTISHA = new Set(["صلاة العشاء", "تقييم يومي", ...POSTISHA_LABELS]);

/* Added in schema 6. Kept in their own list so the migration can top up an
   existing profile with exactly the ones it is missing. */
const ADDED_HABITS = [
  { label: "تمارين مقاومة (صدر/بطن) أو T-Bar + ١٥ ألف خطوة", group: "morning" },
  { label: "محادثة إنجليزية مع متحدث أصلي", group: "afternoon" },
  { label: "تحضير وجبة الغد: دجاج صيني وأرز", group: "maghrib" },
];

/* Schema 8 split the old "المساء" block into "بعد العصر" and "بعد المغرب". */
const ASR_HABITS = [
  { label: "صلاة العصر", group: "asr" },
  { label: "مراجعة سريعة لمهام اليوم", group: "asr" },
  { label: "مشي أو حركة خفيفة", group: "asr" },
];
const MAGHRIB_HABITS = [{ label: "صلاة المغرب وأذكار", group: "maghrib" }];

const ADDED_TASKS = [
  { text: "جلسة مذاكرة PMP — ٩٠ دقيقة", quadrant: "q2" },
  { text: "تحديث LinkedIn: إبراز إدارة المرافق والتدريب التعاوني", quadrant: "q2" },
  { text: "ساعتان عمل توصيل مرن", quadrant: "q3" },
];

const SEED_HABITS = [
  { id: uid(), label: "شرب ماء", group: "morning", done: false },
  { id: uid(), label: "صلاة الفجر وأذكار", group: "morning", done: false },
  ...ADDED_HABITS.filter((h) => h.group === "morning").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  { id: uid(), label: "جلسة STEP — ٩٠ دقيقة", group: "morning", done: false },
  { id: uid(), label: "صلاة الظهر", group: "afternoon", done: false },
  { id: uid(), label: "قراءة", group: "afternoon", done: false },
  ...ADDED_HABITS.filter((h) => h.group === "afternoon").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  ...ASR_HABITS.map((h) => ({ id: uid(), done: false, ...h })),
  ...MAGHRIB_HABITS.map((h) => ({ id: uid(), done: false, ...h })),
  ...ADDED_HABITS.filter((h) => h.group === "maghrib").map((h) => ({
    id: uid(),
    done: false,
    ...h,
  })),
  ...POSTISHA_LABELS.map((label) => ({
    id: uid(),
    label,
    group: "postisha",
    done: false,
  })),
  { id: uid(), label: "الابتعاد عن الشاشات", group: "night", done: false },
  { id: uid(), label: "تدوين", group: "night", done: false },
  { id: uid(), label: "أذكار النوم", group: "night", done: false },
];

const SEED_TASKS = [
  { id: uid(), text: "تسليم تقرير الجامعة", quadrant: "q1", today: true, done: false },
  { id: uid(), text: "مراجعة مكثفة لاختبار STEP", quadrant: "q2", today: true, done: false },
  ...ADDED_TASKS.map((t) => ({ id: uid(), today: false, done: false, ...t })),
  { id: uid(), text: "بناء صندوق الطوارئ", quadrant: "q2", today: false, done: false },
  { id: uid(), text: "الرد على الرسائل المتراكمة", quadrant: "q3", today: false, done: false },
  { id: uid(), text: "تصفّح مواقع التواصل بلا هدف", quadrant: "q4", today: false, done: false },
];

const SEED_BOOKS = [
  {
    id: uid(),
    title: "العادات الذرية",
    author: "جيمس كلير",
    status: "finished",
    rating: 5,
    lesson: "لا ترتقي إلى أهدافك، بل تهبط إلى مستوى أنظمتك. ابنِ النظام قبل الحلم.",
  },
  {
    id: uid(),
    title: "العمل العميق",
    author: "كال نيوبورت",
    status: "finished",
    rating: 4,
    lesson: "ساعتان بلا تشتت تهزم يومًا كاملًا مشتتًا. احمِ تركيزك كما تحمي مالك.",
  },
  {
    id: uid(),
    title: "الفوائد",
    author: "ابن القيّم",
    status: "reading",
    rating: 5,
    lesson: "القلب يصدأ كما يصدأ الحديد، وجلاؤه الذكر وتلاوة القرآن.",
  },
];

const SEED_GOALS = [
  { text: "ختم القرآن تدبّرًا مرّة", pillar: "faith", quarter: "q1" },
  { text: "قيام الليل ٣ مرّات أسبوعيًّا", pillar: "faith", quarter: "q2" },
  { text: "حفظ جزء عمّ إتقانًا", pillar: "faith", quarter: "q3" },
  { text: "المحافظة على الصلوات في وقتها", pillar: "faith", quarter: "q4" },
  { text: "نادي ٤ مرّات أسبوعيًّا بلا انقطاع", pillar: "health", quarter: "q1" },
  { text: "الوصول إلى وزن صحّي وثباته", pillar: "health", quarter: "q3" },
  { text: "نوم ٧ ساعات ثابتة كل ليلة", pillar: "health", quarter: "q2" },
  { text: "اجتياز اختبار STEP بدرجة عالية", pillar: "career", quarter: "q1" },
  { text: "إتقان الإنجليزية محادثةً", pillar: "career", quarter: "q3" },
  { text: "إنهاء مشروع تخرّج يُفتخر به", pillar: "career", quarter: "q4" },
  { text: "بناء صندوق طوارئ يغطّي ٦ أشهر", pillar: "money", quarter: "q2" },
  { text: "ادّخار ٢٠٪ من كل دخل", pillar: "money", quarter: "q3" },
  { text: "مصدر دخل ثانٍ", pillar: "money", quarter: "q4" },
  { text: "صلة الرحم أسبوعيًّا", pillar: "social", quarter: "q1" },
  { text: "بناء دائرة صحبة صالحة", pillar: "social", quarter: "q3" },
  { text: "قراءة ٦ كتب", pillar: "self", quarter: "q3" },
  { text: "تقليل وقت الشاشات إلى ساعة يوميًّا", pillar: "self", quarter: "q2" },
  { text: "تعلّم مهارة جديدة كليًّا", pillar: "self", quarter: "q4" },
].map((g) => ({ id: uid(), done: false, ...g }));

const SEED_PROMPTS = [
  {
    title: "محاكي اختبار PMP",
    body: "تصرّف كمحاكي صارم لاختبار PMP. اطرح عليّ سؤالًا موقفيًّا صعبًا من نمط الاختبار الحقيقي، بأربعة خيارات متقاربة. لا تكشف الإجابة حتى أجيب، ثم اشرح لماذا الخيار الصحيح صحيح ولماذا كل خيار آخر خاطئ، مع ربطه بمجال المعرفة ومجموعة العمليات.",
  },
  {
    title: "بريد إدارة المرافق",
    body: "اكتب بريدًا مهنيًّا موجزًا لمدير المرافق بخصوص [الموضوع]. النبرة: محترمة وحازمة وواضحة. ابدأ بالسياق في سطر، ثم المشكلة بالأرقام، ثم الإجراء المطلوب بتاريخ محدّد. لا تزيد على ١٥٠ كلمة، ولا تستخدم عبارات إنشائية.",
  },
].map((p) => ({ id: uid(), ...p }));

const SEED_PIPELINE = [
  { title: "إنهاء اختبار PMP التجريبي الأول", lane: "todo" },
  { title: "دراسة جدوى عربة الآيس كريم", lane: "todo" },
  { title: "تحديث LinkedIn بخبرة التدريب التعاوني", lane: "doing" },
].map((c) => ({ id: uid(), ...c }));

const freshState = (carry = {}) => ({
  schema: SCHEMA,
  date: dayKey(),
  habits: (carry.habits || SEED_HABITS).map((h) => ({ ...h, done: false })),
  tasks: (carry.tasks || SEED_TASKS).map((t) => ({ ...t, done: false })),
  books: carry.books || SEED_BOOKS,
  goals: carry.goals || SEED_GOALS,
  sessions: carry.sessions || [],
  income: carry.income || [],
  ventures: carry.ventures || [],
  prompts: carry.prompts || SEED_PROMPTS,
  reviews: carry.reviews || [],
  pipeline: carry.pipeline || SEED_PIPELINE,
  history: carry.history || [],
  streakBase: carry.streakBase || 0,
  bestStreak: carry.bestStreak || 0,
  dayBanked: false,
});

/* Reshapes a saved payload without discarding anything the user typed. */
function migrate(saved) {
  const from = saved.schema || 0;
  let habits = saved.habits;

  if (from < 4 && Array.isArray(habits)) {
    habits = habits.map((h) =>
      h.group === "evening" && LEGACY_POSTISHA.has(h.label)
        ? { ...h, group: "postisha", label: h.label === "تقييم يومي" ? "تقييم اليوم: التزمت؟" : h.label }
        : h,
    );
    const present = new Set(
      habits.filter((h) => h.group === "postisha").map((h) => h.label),
    );
    const missing = POSTISHA_LABELS.filter((l) => !present.has(l)).map((label) => ({
      id: uid(),
      label,
      group: "postisha",
      done: false,
    }));
    if (missing.length) habits = [...habits, ...missing];
  }

  /* Goals predate quarters. Park every existing one in the quarter the user
     is living in, so nothing they wrote disappears behind a tab. */
  let goals = saved.goals;
  if (from < 5 && Array.isArray(goals)) {
    const here = currentQuarter();
    goals = goals.map((g) => (g.quarter ? g : { ...g, quarter: here }));
  }

  /* Top up with the routines added in schema 6, matching on label so a
     profile that already has one (or renamed it) never gets a duplicate. */
  let tasks = saved.tasks;
  if (from < 6) {
    if (Array.isArray(habits)) {
      const have = new Set(habits.map((h) => h.label));
      habits = [
        ...habits,
        ...ADDED_HABITS.filter((h) => !have.has(h.label)).map((h) => ({
          id: uid(),
          done: false,
          ...h,
        })),
      ];
    }
    if (Array.isArray(tasks)) {
      const have = new Set(tasks.map((t) => t.text));
      tasks = [
        ...tasks,
        ...ADDED_TASKS.filter((t) => !have.has(t.text)).map((t) => ({
          id: uid(),
          today: false,
          done: false,
          ...t,
        })),
      ];
    }
  }

  /* "المساء" became "بعد المغرب", and "بعد العصر" is new. The old block's
     habits move rather than being recreated, so nothing the user wrote in
     it is lost or duplicated. */
  if (from < 8 && Array.isArray(habits)) {
    habits = habits.map((h) => {
      if (h.group === "evening") return { ...h, group: "maghrib" };
      if (h.group === "afternoon" && h.label === "صلاة العصر")
        return { ...h, group: "asr" };
      return h;
    });
    const have = new Set(habits.map((h) => h.label));
    habits = [
      ...habits,
      ...[...ASR_HABITS, ...MAGHRIB_HABITS]
        .filter((h) => !have.has(h.label))
        .map((h) => ({ id: uid(), done: false, ...h })),
    ];
  }

  return { ...saved, schema: SCHEMA, habits, goals, tasks };
}

function loadState() {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = migrate(JSON.parse(raw));
    const carry = {
      habits: saved.habits,
      tasks: saved.tasks,
      books: saved.books,
      goals: saved.goals,
      sessions: saved.sessions,
      income: saved.income,
      ventures: saved.ventures,
      prompts: saved.prompts,
      reviews: saved.reviews,
      pipeline: saved.pipeline,
      history: saved.history,
      bestStreak: saved.bestStreak,
    };
    if (saved.date === dayKey()) return { ...freshState(carry), ...saved };
    const continued = saved.date === yesterdayKey() && saved.dayBanked;
    return freshState({
      ...carry,
      streakBase: continued ? (saved.streakBase || 0) + 1 : 0,
    });
  } catch {
    return freshState();
  }
}

const readUI = () => {
  try {
    return JSON.parse(window.localStorage.getItem(UI_KEY) || "{}");
  } catch {
    return {};
  }
};

/* ==================================================================== *
 *  Primitives (shadcn-shaped, dependency-free)
 * ==================================================================== */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/* Advances on every open, and again on tap. Keying it to the day of the
   month was the literal spec but meant the card never visibly moved within
   a day — the cue is only motivating if it is actually new. The cursor
   persists so consecutive opens walk the list instead of repeating. */
const QUOTE_KEY = "life-os-2027:quote";

function useDailyQuote() {
  const [i, setI] = useState(() => {
    let prev = -1;
    try {
      prev = parseInt(window.localStorage.getItem(QUOTE_KEY), 10);
    } catch {
      /* storage blocked — fall back to the day of the month */
    }
    const next = Number.isFinite(prev)
      ? (prev + 1) % QUOTES.length
      : new Date().getDate() % QUOTES.length;
    try {
      window.localStorage.setItem(QUOTE_KEY, String(next));
    } catch {
      /* per-viewer convenience only */
    }
    return next;
  });

  const shuffle = useCallback(() => {
    setI((cur) => {
      const next = (cur + 1) % QUOTES.length;
      try {
        window.localStorage.setItem(QUOTE_KEY, String(next));
      } catch {
        /* per-viewer convenience only */
      }
      return next;
    });
  }, []);

  return [QUOTES[i], shuffle];
}

/* Fires a one-shot reward flag that auto-clears. Deliberately no
   requestAnimationFrame here — it never runs in a hidden tab, which both
   swallowed the reward and replayed it whenever the tab came back. */
function useBurst(ms = 640) {
  const [on, setOn] = useState(false);
  const timer = useRef(null);
  const fire = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [on, fire];
}

function Card({ children, className = "", style, as = "div", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-2xl border ${className}`}
      style={{ ...GLASS, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Btn({
  children,
  variant = "default",
  size = "md",
  className = "",
  style,
  ...rest
}) {
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-[15px] gap-2",
    icon: "p-2",
  };
  const variants = {
    default: {
      background: `linear-gradient(135deg, ${T.cta}, ${T.ctaLift})`,
      color: "#1A0600",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.cta}CC`,
    },
    success: {
      background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLift})`,
      color: "#04140E",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.primary}CC`,
    },
    gold: {
      background: `linear-gradient(135deg, ${T.accent}, #FDE68A)`,
      color: "#1C1203",
      borderColor: "transparent",
      boxShadow: `0 8px 24px -10px ${T.accent}AA`,
    },
    outline: {
      background: "transparent",
      color: T.muted,
      borderColor: T.border,
    },
    ghost: {
      background: "transparent",
      color: T.muted,
      borderColor: "transparent",
    },
    danger: {
      background: `${T.danger}1F`,
      color: T.danger,
      borderColor: `${T.danger}4D`,
    },
  };
  return (
    <button
      className={`los-btn inline-flex items-center justify-center rounded-xl border font-bold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${className}`}
      style={{ ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

function Field({ className = "", style, as = "input", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm text-white/85 outline-none transition-colors placeholder:text-white/20 focus:border-white/30 ${className}`}
      style={{ borderColor: T.border, ...style }}
      {...rest}
    />
  );
}

function Badge({ children, tint = T.accent, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${className}`}
      style={{
        borderColor: `${tint}44`,
        color: tint,
        background: `${tint}14`,
      }}
    >
      {children}
    </span>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="los-in relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border p-6 sm:rounded-3xl"
        style={{
          background: `linear-gradient(160deg, ${T.bgLift}, ${T.bgDeep})`,
          borderColor: `${T.cta}40`,
          boxShadow: `0 40px 90px -30px ${T.cta}55`,
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold" style={{ color: T.accent }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg border p-1.5 text-white/45 transition-colors hover:text-white"
            style={{ borderColor: T.border }}
          >
            <X size={15} />
          </button>
        </div>
        {children}
        {footer ? <div className="mt-6 flex gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}

function StarRating({ value, onChange, size = 15 }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} من ٥`}
          className="rounded p-0.5 transition-transform hover:scale-125 active:scale-95"
        >
          <Star
            size={size}
            strokeWidth={1.8}
            style={{
              color: n <= value ? T.accent : "rgba(255,255,255,0.2)",
              fill: n <= value ? T.accent : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}

function Checkbox({ checked, onToggle, label, tint = T.primary, size = "md" }) {
  const box = size === "sm" ? 18 : 22;
  const [pop, firePop] = useBurst(640);

  const handle = () => {
    if (!checked) firePop();
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={checked}
      className="group/c flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1.5 text-right transition-colors hover:bg-white/[0.06]"
    >
      <span
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: box, height: box }}
      >
        {pop && (
          <span
            aria-hidden="true"
            className="los-ripple pointer-events-none absolute inset-0 rounded-md border-2"
            style={{ borderColor: tint }}
          />
        )}
        <span
          className={`flex h-full w-full items-center justify-center rounded-md border transition-all duration-300${
            pop ? " los-pop" : ""
          }`}
          style={{
            borderColor: checked ? tint : T.borderStrong,
            background: checked ? tint : "transparent",
            boxShadow: checked ? `0 0 16px ${tint}80` : "none",
            transform: checked && !pop ? "scale(1.06)" : "scale(1)",
          }}
        >
          <Check
            size={size === "sm" ? 11 : 14}
            strokeWidth={4}
            className="transition-all duration-200"
            style={{
              color: T.bgDeep,
              opacity: checked ? 1 : 0,
              transform: checked ? "scale(1)" : "scale(0.4)",
            }}
          />
        </span>
      </span>
      <span
        className="min-w-0 flex-1 truncate text-[13.5px] transition-all duration-300"
        style={{
          color: checked ? tint : "rgba(248,250,252,0.86)",
          textDecoration: checked ? "line-through" : "none",
          textDecorationColor: `${tint}80`,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* --- discipline ring -------------------------------------------------- *
 *  The gradient ramps cool→hot as the day fills and keeps rotating, so a
 *  glance at the ring reads as momentum rather than a static gauge.
 * ---------------------------------------------------------------------- */
function ProgressRing({ value, size = 168, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const full = pct >= 100;
  const hit = pct >= STREAK_TARGET;
  const still = usePrefersReducedMotion();
  const gid = useMemo(() => `los-ring-${uid()}`, []);

  const ramp = full
    ? [T.primaryLift, T.primary, T.sky]
    : hit
    ? [T.primary, T.primaryLift, T.accent]
    : pct >= 50
    ? [T.accent, T.ember, T.cta]
    : [T.cta, T.ctaLift, T.accent];

  const lead = full ? T.primaryLift : hit ? T.primary : pct >= 50 ? T.accent : T.cta;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`pointer-events-none absolute inset-3 rounded-full blur-2xl transition-all duration-700${
          full && !still ? " los-halo" : ""
        }`}
        style={{
          background: `radial-gradient(circle, ${ramp[0]} 0%, ${ramp[2]} 70%, transparent 100%)`,
          opacity: full ? 0.45 : hit ? 0.28 : 0.14,
        }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ramp[0]} />
            <stop offset="50%" stopColor={ramp[1]} />
            <stop offset="100%" stopColor={ramp[2]} />
            {!still && (
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="7s"
                repeatCount="indefinite"
              />
            )}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)",
            filter: `drop-shadow(0 0 ${full ? 18 : 12}px ${lead}AA)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {/* The throb lives on a wrapper: a transform on the same element as
            background-clip:text collapses the clip in Chrome and the number
            paints as a solid block. */}
        <span className={full && !still ? "los-throb" : undefined}>
          <span
            className="block font-extrabold leading-none tabular-nums"
            style={{
              fontSize: size * 0.27,
              backgroundImage: `linear-gradient(135deg, ${ramp[0]}, ${ramp[1]}, ${ramp[2]})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: lead,
            }}
          >
            {pct}
            <span className="align-super text-[0.45em] font-bold">%</span>
          </span>
        </span>
        <span
          className="mt-1 text-[10.5px] font-bold leading-tight"
          style={{ color: full ? T.primaryLift : T.faint }}
        >
          {full ? "يوم مكتمل 🔥" : "مؤشر الانضباط"}
        </span>
      </div>
    </div>
  );
}

/* ==================================================================== *
 *  The 80/20 hook — exactly three non-negotiables a day
 * ==================================================================== */
function TopThree({ state, setState }) {
  const picked = state.tasks.filter((t) => t.today);
  const done = picked.filter((t) => t.done).length;
  const slots = [...Array(TOP_TASK_CAP)].map((_, i) => picked[i] || null);
  const full = picked.length >= TOP_TASK_CAP;

  const patch = (id, next) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...next } : t)),
    }));

  return (
    <Card
      className="p-6 sm:p-7"
      style={{
        borderColor: done === TOP_TASK_CAP ? `${T.primary}70` : `${T.cta}59`,
        boxShadow:
          done === TOP_TASK_CAP
            ? `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 46px -18px ${T.primary}`
            : `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 46px -20px ${T.cta}`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${T.cta}59`,
              background: `linear-gradient(160deg, ${T.cta}3D, ${T.cta}0F)`,
              color: T.ctaLift,
            }}
          >
            <Zap size={20} strokeWidth={2.4} />
          </span>
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              أهم ٣ مهام اليوم
            </h3>
            <p className="text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
              ثلاث فقط. لو أنجزتها وحدها، كان اليوم ناجحًا.
            </p>
          </div>
        </div>
        <Badge tint={done === TOP_TASK_CAP ? T.primary : T.cta}>
          <span dir="ltr" className="tabular-nums">
            {done}/{TOP_TASK_CAP}
          </span>
          {" منجزة"}
        </Badge>
      </div>

      <div className="mt-5 space-y-2.5">
        {slots.map((task, i) =>
          task ? (
            <div key={task.id} className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                style={{
                  background: task.done ? `${T.primary}26` : `${T.cta}26`,
                  color: task.done ? T.primary : T.ctaLift,
                }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <TaskChip
                  task={task}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                  onToggleDone={() => patch(task.id, { done: !task.done })}
                  onToggleToday={() => patch(task.id, { today: false })}
                  onDelete={() =>
                    setState((s) => ({
                      ...s,
                      tasks: s.tasks.filter((t) => t.id !== task.id),
                    }))
                  }
                />
              </div>
            </div>
          ) : (
            <div key={`slot-${i}`} className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                style={{ background: "rgba(255,255,255,0.06)", color: T.faint }}
              >
                {i + 1}
              </span>
              <p
                className="flex-1 rounded-xl border border-dashed py-3 text-center text-[11.5px]"
                style={{ borderColor: T.border, color: T.faint }}
              >
                اختر مهمة من مصفوفة المهام
              </p>
            </div>
          ),
        )}
      </div>

      {full && (
        <p
          className="mt-4 rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.accent}3D`,
            background: `${T.accent}12`,
            color: T.accent,
          }}
        >
          القائمة مكتملة. أنجِز واحدة قبل أن تضيف غيرها — هذا هو الشرط.
        </p>
      )}
    </Card>
  );
}

/* ==================================================================== *
 *  MODULE 1 — Daily routine
 * ==================================================================== */
function HabitRow({ habit, onToggle, onEdit, onDelete }) {
  const [burst, fireBurst] = useBurst(700);

  const handle = () => {
    if (!habit.done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg border transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst ? T.primary : "transparent",
        background: burst
          ? `${T.primary}26`
          : habit.done
          ? `${T.primary}0F`
          : "transparent",
      }}
    >
      <Checkbox
        checked={habit.done}
        onToggle={handle}
        label={habit.label}
        tint={T.primary}
      />
      <button
        onClick={onEdit}
        aria-label={`تعديل ${habit.label}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`حذف ${habit.label}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function RoutineModule({
  state,
  setState,
  discipline,
  streak,
  quote,
  onShuffleQuote,
  mirror,
  onOpenMirror,
}) {
  const [editing, setEditing] = useState(null); // {id?, label, group}
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const toggle = (id) =>
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
    }));

  const save = () => {
    const label = editing.label.trim();
    if (!label) return;
    setState((s) => ({
      ...s,
      habits: editing.id
        ? s.habits.map((h) =>
            h.id === editing.id ? { ...h, label, group: editing.group } : h
          )
        : [
            ...s.habits,
            { id: uid(), label, group: editing.group, done: false },
          ],
    }));
    setEditing(null);
  };

  const remove = (id) =>
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));

  const done = state.habits.filter((h) => h.done).length;
  const flame =
    discipline >= STREAK_TARGET
      ? { color: T.ember, glow: `drop-shadow(0 0 14px ${T.ember})`, animate: true }
      : discipline >= 50
      ? { color: "#B45309", glow: "none", animate: false }
      : { color: "rgba(255,255,255,0.22)", glow: "none", animate: false };

  return (
    <div className="space-y-7">
      {/* daily cue — tap for the next one */}
      <Card
        as="button"
        onClick={onShuffleQuote}
        title="اضغط لاقتباس آخر"
        className="los-cue group relative w-full overflow-hidden p-6 text-center transition-all duration-300 sm:p-7"
      >
        <div
          className="pointer-events-none absolute -top-24 right-1/3 h-56 w-56 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
          style={{ background: T.accent }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ background: T.rose }}
        />
        <Quote
          size={20}
          className="relative mx-auto mb-2 opacity-40"
          style={{ color: T.accent }}
        />
        <p
          key={quote.text}
          className="los-in relative mx-auto max-w-2xl text-[15px] font-bold leading-relaxed sm:text-lg"
          style={{ color: T.fg }}
        >
          {quote.text}
        </p>
        <p className="relative mt-2 text-xs" style={{ color: T.accent }}>
          — {quote.author}
        </p>
        <span
          className="relative mt-3 inline-flex items-center gap-1.5 text-[10.5px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ color: T.faint }}
        >
          <RotateCcw size={11} /> اضغط لاقتباس آخر
        </span>
      </Card>

      {/* score */}
      <Card className="flex flex-col items-center gap-7 p-6 sm:p-7 lg:flex-row lg:justify-between">
        <div className="text-center lg:text-right">
          <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">الروتين اليومي</h2>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/40 lg:justify-start">
            <CalendarDays size={13} /> {dateLabel}
          </p>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/35">
            {done} من {state.habits.length} عادة. المؤشر يمتلئ مع كل علامة —
            وعند ٨٠٪ يُحتسب اليوم في سلسلتك.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start">
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2"
              style={{ borderColor: T.border }}
            >
              <Flame
                size={22}
                className={flame.animate ? "los-flame" : ""}
                style={{
                  color: flame.color,
                  filter: flame.glow,
                  transition: "all .5s ease",
                }}
              />
              <span className="text-xl font-extrabold tabular-nums">{streak}</span>
              <span className="text-[11px] text-white/35">يوم متتالٍ</span>
            </div>
            <Btn
              variant="default"
              size="sm"
              onClick={() => setEditing({ label: "", group: "morning" })}
            >
              <Plus size={14} strokeWidth={3} /> عادة جديدة
            </Btn>
            <button
              onClick={onOpenMirror}
              title="مرآة المحاسبة"
              aria-label="مرآة المحاسبة"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200"
              style={{
                borderColor: mirror ? `${T.danger}80` : `${T.danger}3D`,
                background: mirror ? `${T.danger}24` : `${T.danger}0F`,
                color: T.danger,
                boxShadow: mirror ? `0 0 18px -6px ${T.danger}` : "none",
              }}
            >
              <ScanFace size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
        <ProgressRing value={discipline} size={176} />
      </Card>

      <TopThree state={state} setState={setState} />

      {/* habit groups */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {GROUPS.map((g) => {
          const list = state.habits.filter((h) => h.group === g.id);
          const gDone = list.filter((h) => h.done).length;
          const Icon = g.icon;
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${g.tint}33`,
                    background: `${g.tint}14`,
                    color: g.tint,
                  }}
                >
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <h3 className="text-[15px] font-bold">{g.label}</h3>
                <span className="mr-auto text-[11px] tabular-nums text-white/30">
                  {gDone}/{list.length}
                </span>
              </div>

              <div
                className="mt-3.5 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: list.length ? `${(gDone / list.length) * 100}%` : "0%",
                    backgroundImage:
                      gDone === list.length && list.length
                        ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
                        : `linear-gradient(90deg, ${g.tint}, ${g.tint}AA)`,
                    boxShadow: `0 0 12px ${
                      gDone === list.length && list.length ? T.primary : g.tint
                    }99`,
                  }}
                />
              </div>

              <div className="mt-2 space-y-0.5">
                {list.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-white/25">
                    لا عادات في هذه الفترة بعد
                  </p>
                ) : (
                  list.map((h) => (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      onToggle={() => toggle(h.id)}
                      onEdit={() =>
                        setEditing({ id: h.id, label: h.label, group: h.group })
                      }
                      onDelete={() => remove(h.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل العادة" : "عادة جديدة"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn
              variant="outline"
              className="flex-1"
              onClick={() => setEditing(null)}
            >
              إلغاء
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="los-habit-label"
                className="mb-1.5 block text-xs text-white/45"
              >
                اسم العادة
              </label>
              <Field
                id="los-habit-label"
                value={editing.label}
                autoFocus
                onChange={(e) =>
                  setEditing((s) => ({ ...s, label: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="مثال: قراءة ١٠ صفحات"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-white/45">الفترة</span>
              <div className="grid grid-cols-2 gap-2">
                {GROUPS.map((g) => {
                  const active = editing.group === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setEditing((s) => ({ ...s, group: g.id }))}
                      aria-pressed={active}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] transition-all"
                      style={{
                        borderColor: active ? `${g.tint}80` : T.border,
                        background: active ? `${g.tint}16` : "transparent",
                        color: active ? g.tint : T.muted,
                      }}
                    >
                      <g.icon size={15} /> {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 2 — Eisenhower matrix
 * ==================================================================== */
function TaskChip({ task, onToggleToday, onToggleDone, onDelete, onDragStart }) {
  const [burst, fireBurst] = useBurst(700);

  const handleDone = () => {
    if (!task.done) fireBurst();
    onToggleDone();
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-200 hover:border-white/25${burst ? " los-reward" : ""}`}
      style={{
        borderColor: burst ? T.primary : task.done ? `${T.primary}55` : T.border,
        background: burst
          ? `${T.primary}2E`
          : task.done
          ? `${T.primary}14`
          : "rgba(255,255,255,0.04)",
        cursor: "grab",
      }}
    >
      <GripVertical
        size={13}
        className="shrink-0 text-white/15 transition-colors group-hover:text-white/35"
      />
      <Checkbox
        checked={task.done}
        onToggle={handleDone}
        label={task.text}
        size="sm"
      />
      <button
        onClick={onToggleToday}
        aria-pressed={task.today}
        aria-label="إضافة إلى مهام اليوم"
        title="مهام اليوم"
        className="shrink-0 rounded p-1 transition-colors"
        style={{ color: task.today ? T.accent : "rgba(255,255,255,0.15)" }}
      >
        <Target size={14} strokeWidth={task.today ? 2.6 : 2} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`حذف ${task.text}`}
        className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function MatrixModule({ state, setState }) {
  const [draft, setDraft] = useState("");
  const [draftQ, setDraftQ] = useState("q2");
  const [over, setOver] = useState(null);
  const [capHit, fireCapHit] = useBurst(2800);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        { id: uid(), text, quadrant: draftQ, today: false, done: false },
      ],
    }));
    setDraft("");
  };

  const patch = (id, p) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  /* The cap is the whole point of the rule, so a fourth pick is refused
     outright rather than quietly hidden — and it says why. */
  const promote = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.today) return;
    if (state.tasks.filter((x) => x.today).length >= TOP_TASK_CAP) {
      fireCapHit();
      return;
    }
    patch(id, { today: true });
  };

  const toggleToday = (t) =>
    t.today ? patch(t.id, { today: false }) : promote(t.id);

  const remove = (id) =>
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

  const onDrop = (zone) => (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setOver(null);
    if (!id) return;
    if (zone === "today") promote(id);
    else patch(id, { quadrant: zone, today: false });
  };

  const dragProps = (zone) => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== zone) setOver(zone);
    },
    onDragLeave: () => setOver((o) => (o === zone ? null : o)),
    onDrop: onDrop(zone),
  });


  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">مصفوفة المهام</h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          صنّف كل مهمة بصدق، ثم ارفع ثلاثًا فقط إلى «أهم ٣ مهام» — بالسحب أو
          بأيقونة الهدف
          <Target size={12} className="mx-1 inline" /> على الجوال.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            id="los-task-new"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="مهمة جديدة…"
          />
          <div className="flex gap-2">
            <select
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              aria-label="الربع"
              className="rounded-xl border bg-transparent px-3 py-2.5 text-xs outline-none"
              style={{ borderColor: T.border, color: T.muted }}
            >
              {QUADRANTS.map((q) => (
                <option key={q.id} value={q.id} style={{ background: T.cardSolid }}>
                  {q.label}
                </option>
              ))}
            </select>
            <Btn variant="default" onClick={add} className="shrink-0">
              <Plus size={15} strokeWidth={3} /> إضافة
            </Btn>
          </div>
        </div>
      </Card>

      {/* the drop target that matters */}
      <div
        {...dragProps("today")}
        className="rounded-2xl transition-all duration-200"
        style={{
          outline: over === "today" ? `2px dashed ${T.cta}` : "none",
          outlineOffset: 4,
        }}
      >
        <TopThree state={state} setState={setState} />
      </div>

      {capHit && (
        <p
          className="los-in rounded-2xl border px-4 py-3 text-center text-xs font-bold leading-relaxed"
          style={{
            borderColor: `${T.danger}59`,
            background: `${T.danger}1A`,
            color: T.danger,
          }}
        >
          ثلاث مهام فقط — هذا هو الحد. أنجِز واحدة أو أنزل غيرها أولًا.
        </p>
      )}

      {/* four quadrants */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {QUADRANTS.map((q) => {
          const list = state.tasks.filter((t) => t.quadrant === q.id);
          const Icon = q.icon;
          return (
            <Card
              key={q.id}
              {...dragProps(q.id)}
              className="flex min-h-[200px] flex-col p-5 transition-all duration-200"
              style={{
                ...GLASS,
                borderColor: over === q.id ? q.tint : T.border,
                background:
                  over === q.id ? `${q.tint}14` : T.card,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    borderColor: `${q.tint}33`,
                    background: `${q.tint}14`,
                    color: q.tint,
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-bold" style={{ color: q.tint }}>
                    {q.label}
                  </h3>
                  <p className="text-[10.5px] text-white/35">{q.action}</p>
                </div>
                <span className="mr-auto shrink-0 text-[11px] tabular-nums text-white/25">
                  {list.length}
                </span>
              </div>

              <div className="mt-4 flex-1 space-y-2">
                {list.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-white/20">
                    فارغ
                  </p>
                ) : (
                  list.map((t) => (
                    <TaskChip
                      key={t.id}
                      task={t}
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", t.id)
                      }
                      onToggleDone={() => patch(t.id, { done: !t.done })}
                      onToggleToday={() => toggleToday(t)}
                      onDelete={() => remove(t.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ==================================================================== *
 *  The accountability mirror — no styling softener, on purpose
 * ==================================================================== */
function MirrorModal({ open, onClose, value, onSave }) {
  const [draft, setDraft] = useState("");

  /* Reopened on a new day, the stored value is empty and so is the box —
     the entry is keyed by date, which is what "clears at midnight" means. */
  useEffect(() => {
    if (open) setDraft(value || "");
  }, [open, value]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مرآة المحاسبة"
      footer={
        <>
          <Btn
            variant="default"
            className="flex-1"
            onClick={() => onSave(draft.trim())}
            style={{
              backgroundImage: `linear-gradient(135deg, ${T.danger}, ${T.ember})`,
              boxShadow: `0 8px 24px -10px ${T.danger}`,
              color: "#1A0603",
            }}
          >
            <Flame size={15} /> واجه الحقيقة
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إغلاق
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <p
          className="rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.danger}45`,
            background: `${T.danger}12`,
            color: T.danger,
          }}
        >
          هنا لا تُجمّل ولا تبرّر. اكتب ما تهرب منه — الكسل الذي سمّيته راحة،
          والتأجيل الذي سمّيته انتظارًا. لا أحد يقرأ هذا غيرك.
        </p>
        <Field
          as="textarea"
          rows={8}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="resize-none leading-relaxed"
          style={{
            borderColor: `${T.danger}59`,
            background: `${T.danger}0A`,
          }}
          placeholder="قل الحقيقة كاملة…"
        />
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  MODULE — AI prompt vault
 * ==================================================================== */
function PromptCard({ prompt, onEdit, onDelete }) {
  const [copied, fireCopied] = useBurst(1800);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.body);
      fireCopied();
    } catch {
      /* clipboard can be blocked — select-and-copy still works manually */
    }
  };

  return (
    <Card className="group flex flex-col p-5 sm:p-6">
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${T.violet}45`,
            background: `${T.violet}18`,
            color: T.violet,
          }}
        >
          <Bot size={16} strokeWidth={1.9} />
        </span>
        <h3 className="min-w-0 flex-1 pt-1.5 text-[15px] font-bold">
          {prompt.title}
        </h3>
        <button
          onClick={onEdit}
          aria-label={`تعديل ${prompt.title}`}
          className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          aria-label={`حذف ${prompt.title}`}
          className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <p
        className="mt-3.5 flex-1 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed"
        style={{
          borderColor: T.border,
          background: "rgba(255,255,255,0.03)",
          color: "rgba(248,250,252,0.72)",
        }}
      >
        {prompt.body}
      </p>

      <Btn
        variant={copied ? "success" : "outline"}
        size="sm"
        className="mt-4 w-full"
        onClick={copy}
      >
        {copied ? (
          <>
            <CheckCheck size={14} /> نُسخ
          </>
        ) : (
          <>
            <Copy size={14} /> نسخ الأمر
          </>
        )}
      </Btn>
    </Card>
  );
}

function PromptsModule({ state, setState }) {
  const [editing, setEditing] = useState(null); // {id?, title, body}
  const prompts = state.prompts || [];

  const save = () => {
    const title = editing.title.trim();
    const body = editing.body.trim();
    if (!title || !body) return;
    setState((s) => ({
      ...s,
      prompts: editing.id
        ? s.prompts.map((p) => (p.id === editing.id ? { ...p, title, body } : p))
        : [{ id: uid(), title, body }, ...(s.prompts || [])],
    }));
    setEditing(null);
  };

  return (
    <div className="space-y-7">
      <Card className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-7">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">
            خزنة الأوامر
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            الأوامر التي تُجيد صياغتها مرّة، تستعملها ألف مرّة. احفظها هنا بدل أن
            تكتبها من جديد كل يوم.
          </p>
        </div>
        <Btn
          variant="default"
          onClick={() => setEditing({ title: "", body: "" })}
          className="shrink-0"
        >
          <Plus size={15} strokeWidth={3} /> أمر جديد
        </Btn>
      </Card>

      {prompts.length === 0 ? (
        <Card className="py-14 text-center text-xs text-white/25">
          لا أوامر محفوظة بعد.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {prompts.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onEdit={() => setEditing({ id: p.id, title: p.title, body: p.body })}
              onDelete={() =>
                setState((s) => ({
                  ...s,
                  prompts: s.prompts.filter((x) => x.id !== p.id),
                }))
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الأمر" : "أمر جديد"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="los-p-title" className="mb-1.5 block text-xs text-white/45">
              العنوان
            </label>
            <Field
              id="los-p-title"
              autoFocus
              value={editing?.title || ""}
              onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
              placeholder="مثال: محاكي اختبار PMP"
            />
          </div>
          <div>
            <label htmlFor="los-p-body" className="mb-1.5 block text-xs text-white/45">
              نصّ الأمر
            </label>
            <Field
              id="los-p-body"
              as="textarea"
              rows={7}
              value={editing?.body || ""}
              onChange={(e) => setEditing((s) => ({ ...s, body: e.target.value }))}
              className="resize-none leading-relaxed"
              placeholder="تصرّف كـ…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE — tactical weekly review
 * ==================================================================== */
const weekKey = (d = new Date()) => {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - ((t.getDay() + 1) % 7)); // weeks start Saturday
  return dayKey(t);
};

function TacticalModule({ state, setState }) {
  const reviews = useMemo(
    () => [...(state.reviews || [])].sort((a, b) => (a.week < b.week ? 1 : -1)),
    [state.reviews],
  );
  const thisWeek = weekKey();
  const current = reviews.find((r) => r.week === thisWeek);
  const [threat, setThreat] = useState("");
  const [move, setMove] = useState("");
  const [saved, fireSaved] = useBurst(2200);

  useEffect(() => {
    setThreat(current?.threat || "");
    setMove(current?.move || "");
  }, [current?.threat, current?.move]);

  const save = () => {
    const t = threat.trim();
    const m = move.trim();
    if (!t && !m) return;
    setState((s) => {
      const rest = (s.reviews || []).filter((r) => r.week !== thisWeek);
      return {
        ...s,
        reviews: [...rest, { id: current?.id || uid(), week: thisWeek, threat: t, move: m }],
      };
    });
    fireSaved();
  };

  const panels = [
    {
      key: "threat",
      title: "القطع المهدَّدة",
      hint: "ما الذي تراجع هذا الأسبوع؟ سمّه بلا تجميل.",
      icon: Swords,
      tint: T.danger,
      value: threat,
      set: setThreat,
      placeholder: "مثال: النادي توقّف ٤ أيام، ومذاكرة PMP صفر…",
    },
    {
      key: "move",
      title: "النقلة القادمة",
      hint: "إجراء واحد حاسم للأسبوع القادم. واحد فقط.",
      icon: Target,
      tint: T.cta,
      value: move,
      set: setMove,
      placeholder: "مثال: جلسة PMP ٩٠ دقيقة يوميًّا قبل الظهر…",
    },
  ];

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">
          المراجعة التكتيكية
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          مرّة كل أسبوع، انظر إلى اللوح من فوق: أي قطعة تتعرّض للتهديد، وما
          النقلة الواحدة التي تغيّر الموقف.
        </p>
        <div className="mt-4">
          <Badge tint={T.accent}>
            {"أسبوع "}
            <span dir="ltr" className="tabular-nums">
              {thisWeek}
            </span>
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {panels.map((p) => {
          const Icon = p.icon;
          return (
            <Card
              key={p.key}
              className="p-6 sm:p-7"
              style={{ borderColor: `${p.tint}3D` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${p.tint}59`,
                    background: `${p.tint}18`,
                    color: p.tint,
                  }}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold" style={{ color: p.tint }}>
                    {p.title}
                  </h3>
                  <p className="text-[11px]" style={{ color: T.faint }}>
                    {p.hint}
                  </p>
                </div>
              </div>
              <Field
                as="textarea"
                rows={6}
                value={p.value}
                onChange={(e) => p.set(e.target.value)}
                className="mt-4 resize-none leading-relaxed"
                placeholder={p.placeholder}
              />
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Btn variant={saved ? "success" : "default"} onClick={save}>
          {saved ? (
            <>
              <CheckCheck size={15} /> حُفظت
            </>
          ) : (
            <>
              <NotebookPen size={15} /> احفظ مراجعة الأسبوع
            </>
          )}
        </Btn>
        <span className="text-[11.5px]" style={{ color: T.faint }}>
          الحفظ يستبدل مراجعة هذا الأسبوع، ولا يمسّ الأسابيع السابقة.
        </span>
      </div>

      {reviews.filter((r) => r.week !== thisWeek).length > 0 && (
        <Card className="p-6 sm:p-7">
          <h3 className="text-[17px] font-extrabold" style={{ color: T.accent }}>
            الأسابيع السابقة
          </h3>
          <div className="mt-4 space-y-3">
            {reviews
              .filter((r) => r.week !== thisWeek)
              .slice(0, 12)
              .map((r) => (
                <div
                  key={r.id}
                  className="group rounded-2xl border p-4"
                  style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      dir="ltr"
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: T.accent }}
                    >
                      {r.week}
                    </span>
                    <button
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          reviews: s.reviews.filter((x) => x.id !== r.id),
                        }))
                      }
                      aria-label={`حذف مراجعة ${r.week}`}
                      className="mr-auto shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {r.threat && (
                    <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: T.danger }}>
                      <span style={{ color: T.faint }}>المهدَّد: </span>
                      {r.threat}
                    </p>
                  )}
                  {r.move && (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: T.ctaLift }}>
                      <span style={{ color: T.faint }}>النقلة: </span>
                      {r.move}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ==================================================================== *
 *  MODULE — 90-day sprint pipeline
 * ==================================================================== */
function PipelineModule({ state, setState }) {
  const [draft, setDraft] = useState("");
  const [over, setOver] = useState(null);
  const cards = state.pipeline || [];

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      pipeline: [...(s.pipeline || []), { id: uid(), title, lane: "todo" }],
    }));
    setDraft("");
  };

  const moveTo = (id, lane) =>
    setState((s) => ({
      ...s,
      pipeline: s.pipeline.map((c) => (c.id === id ? { ...c, lane } : c)),
    }));

  const shift = (card, dir) => {
    const i = LANES.findIndex((l) => l.id === card.lane);
    const next = LANES[Math.min(LANES.length - 1, Math.max(0, i + dir))];
    if (next && next.id !== card.lane) moveTo(card.id, next.id);
  };

  const remove = (id) =>
    setState((s) => ({ ...s, pipeline: s.pipeline.filter((c) => c.id !== id) }));

  const done = cards.filter((c) => c.lane === "done").length;

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">
          خط سير المشاريع
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          محطّات الـ ٩٠ يومًا. اسحب البطاقة بين الأعمدة، أو حرّكها بالسهمين على
          الجوال.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="محطّة جديدة…"
          />
          <Btn variant="default" onClick={add} className="shrink-0">
            <Plus size={15} strokeWidth={3} /> إضافة
          </Btn>
        </div>
        <div className="mt-4">
          <Badge tint={done === cards.length && cards.length ? T.primary : T.accent}>
            <span dir="ltr" className="tabular-nums">
              {done}/{cards.length}
            </span>
            {" مكتملة"}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {LANES.map((lane, li) => {
          const list = cards.filter((c) => c.lane === lane.id);
          return (
            <Card
              key={lane.id}
              className="p-5 transition-all duration-200 sm:p-6"
              style={{
                borderColor: over === lane.id ? lane.tint : `${lane.tint}33`,
                boxShadow:
                  over === lane.id
                    ? `inset 0 1px 0 0 rgba(255,255,255,0.085), 0 0 40px -14px ${lane.tint}`
                    : undefined,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(lane.id);
              }}
              onDragLeave={() => setOver((o) => (o === lane.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveTo(id, lane.id);
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: lane.tint, boxShadow: `0 0 8px ${lane.tint}` }}
                />
                <h3 className="text-[15px] font-bold">{lane.label}</h3>
                <span className="mr-auto text-[11px] tabular-nums text-white/30">
                  {list.length}
                </span>
              </div>

              <div className="mt-4 min-h-[120px] space-y-2.5">
                {list.length === 0 ? (
                  <p
                    className="rounded-xl border border-dashed py-8 text-center text-[11px]"
                    style={{ borderColor: T.border, color: T.faint }}
                  >
                    لا محطّات هنا
                  </p>
                ) : (
                  list.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                      className="group rounded-xl border px-3.5 py-3 transition-all duration-200 hover:border-white/25"
                      style={{
                        borderColor: c.lane === "done" ? `${T.primary}45` : T.border,
                        background:
                          c.lane === "done"
                            ? `${T.primary}0F`
                            : "rgba(255,255,255,0.04)",
                        cursor: "grab",
                      }}
                    >
                      <p
                        className="text-[13px] leading-relaxed"
                        style={{
                          color: c.lane === "done" ? T.primary : "rgba(248,250,252,0.86)",
                          textDecoration: c.lane === "done" ? "line-through" : "none",
                        }}
                      >
                        {c.title}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1">
                        <button
                          onClick={() => shift(c, -1)}
                          disabled={li === 0}
                          aria-label="إرجاع للعمود السابق"
                          className="rounded p-1 text-white/30 transition-colors hover:text-white/70 disabled:opacity-20"
                        >
                          <ArrowRight size={13} />
                        </button>
                        <button
                          onClick={() => shift(c, 1)}
                          disabled={li === LANES.length - 1}
                          aria-label="تقديم للعمود التالي"
                          className="rounded p-1 text-white/30 transition-colors hover:text-white/70 disabled:opacity-20"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          aria-label={`حذف ${c.title}`}
                          className="mr-auto rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE — deep work
 * ==================================================================== */
function DeepWorkModule({ state, setState }) {
  const [minutes, setMinutes] = useState(SESSIONS[0].min);
  const [endAt, setEndAt] = useState(null); // epoch ms while running
  const [left, setLeft] = useState(SESSIONS[0].min * 60);
  const [focusId, setFocusId] = useState(null);
  const [rang, setRang] = useState(false);
  const still = usePrefersReducedMotion();

  const picked = state.tasks.filter((t) => t.today);
  const focus = picked.find((t) => t.id === focusId) || null;
  const running = endAt !== null;

  /* Driven by a target timestamp, not by decrementing a counter — an
     interval drifts and is throttled hard in a background tab, so a
     counted-down timer silently loses minutes while you work. */
  useEffect(() => {
    if (!running) return;
    const tick = () => setLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, endAt]);

  const log = useCallback(
    (mins, taskId) =>
      setState((s) => ({
        ...s,
        sessions: [
          ...(s.sessions || []),
          { id: uid(), date: dayKey(), minutes: mins, taskId: taskId || null },
        ].slice(-400),
      })),
    [setState],
  );

  useEffect(() => {
    if (!running || left > 0 || rang) return;
    setRang(true);
    setEndAt(null);
    log(minutes, focusId);
    if (focusId) {
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === focusId ? { ...t, done: true } : t)),
      }));
    }
  }, [running, left, rang, minutes, focusId, log, setState]);

  const start = () => {
    setRang(false);
    setEndAt(Date.now() + left * 1000);
  };
  const pause = () => {
    setEndAt(null);
    setLeft(Math.max(0, Math.round((endAt - Date.now()) / 1000)));
  };
  const stop = () => {
    setEndAt(null);
    setRang(false);
    setLeft(minutes * 60);
  };
  const choose = (m) => {
    setEndAt(null);
    setRang(false);
    setMinutes(m);
    setLeft(m * 60);
  };

  const total = minutes * 60;
  const pct = total ? ((total - left) / total) * 100 : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  const today = (state.sessions || []).filter((s) => s.date === dayKey());
  const todayMin = today.reduce((n, s) => n + s.minutes, 0);

  const SIZE = 268;
  const STROKE = 14;
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const gid = useMemo(() => `los-deep-${uid()}`, []);
  const hot = left <= 60 && running;

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">
          العمل العميق
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          اختر مهمة واحدة، أغلق كل شيء آخر، وشغّل المؤقّت. الجولة المكتملة تُسجَّل
          وتُعلّم المهمة منجزة.
        </p>
      </Card>

      <Card className="flex flex-col items-center gap-7 p-6 sm:p-8">
        <div className="flex flex-wrap justify-center gap-2.5">
          {SESSIONS.map((s) => {
            const on = s.min === minutes;
            return (
              <button
                key={s.min}
                onClick={() => choose(s.min)}
                aria-pressed={on}
                className="rounded-2xl border px-5 py-3 text-center transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  backgroundImage: on
                    ? `linear-gradient(160deg, ${T.cta}2E, ${T.cta}0A)`
                    : "none",
                  backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                  color: on ? T.ctaLift : T.muted,
                }}
              >
                <span className="block text-[15px] font-extrabold">
                  <span dir="ltr" className="tabular-nums">
                    {s.min}
                  </span>{" "}
                  دقيقة
                </span>
                <span className="mt-0.5 block text-[10.5px]" style={{ color: T.faint }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <div
            className={`pointer-events-none absolute inset-4 rounded-full blur-2xl transition-all duration-700${
              running && !still ? " los-halo" : ""
            }`}
            style={{
              background: `radial-gradient(circle, ${hot ? T.danger : T.cta} 0%, ${T.primary} 75%, transparent 100%)`,
              opacity: running ? 0.34 : 0.13,
            }}
          />
          <svg width={SIZE} height={SIZE} className="relative -rotate-90">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={hot ? T.danger : T.cta} />
                <stop offset="55%" stopColor={T.ctaLift} />
                <stop offset="100%" stopColor={T.primary} />
                {!still && (
                  <animateTransform
                    attributeName="gradientTransform"
                    type="rotate"
                    from="0 0.5 0.5"
                    to="360 0.5 0.5"
                    dur="9s"
                    repeatCount="indefinite"
                  />
                )}
              </linearGradient>
            </defs>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={r}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - (pct / 100) * c}
              style={{
                transition: "stroke-dashoffset 300ms linear",
                filter: `drop-shadow(0 0 14px ${hot ? T.danger : T.cta}AA)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <span
              dir="ltr"
              className="text-[54px] font-extrabold leading-none tabular-nums"
              style={{ color: hot ? T.danger : T.fg }}
            >
              {mm}:{ss}
            </span>
            <span
              className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed"
              style={{ color: focus ? T.ctaLift : T.faint }}
            >
              {focus ? focus.text : "بلا مهمة محدّدة"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {running ? (
            <Btn variant="outline" onClick={pause} style={{ borderColor: `${T.accent}59`, color: T.accent }}>
              <Pause size={15} /> إيقاف مؤقّت
            </Btn>
          ) : (
            <Btn variant="default" onClick={start} disabled={left === 0}>
              <Play size={15} /> {left === minutes * 60 ? "ابدأ" : "أكمل"}
            </Btn>
          )}
          <Btn variant="outline" onClick={stop}>
            <Square size={13} /> تصفير
          </Btn>
        </div>

        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2"
          style={{ borderColor: T.border, color: T.muted }}
        >
          <Timer size={14} style={{ color: T.primary }} />
          <span className="text-[11.5px]">
            اليوم:{" "}
            <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.primary }}>
              {todayMin}
            </span>{" "}
            دقيقة في{" "}
            <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.primary }}>
              {today.length}
            </span>{" "}
            جولة
          </span>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          على ماذا تركّز؟
        </h3>
        <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
          من أهم ٣ مهام اليوم. الجولة المكتملة تُعلّمها منجزة تلقائيًّا.
        </p>
        <div className="mt-4 space-y-2.5">
          {picked.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لم تختر مهام اليوم بعد — ارفع ثلاثًا من مصفوفة المهام
            </p>
          ) : (
            picked.map((t) => {
              const on = t.id === focusId;
              return (
                <button
                  key={t.id}
                  onClick={() => setFocusId(on ? null : t.id)}
                  aria-pressed={on}
                  disabled={running}
                  className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderColor: on ? `${T.cta}80` : T.border,
                    backgroundImage: on
                      ? `linear-gradient(160deg, ${T.cta}2E, ${T.cta}0A)`
                      : "none",
                    backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                    color: on ? T.ctaLift : T.muted,
                  }}
                >
                  <Target size={15} strokeWidth={on ? 2.6 : 2} className="shrink-0" />
                  <span
                    className="min-w-0 flex-1 truncate text-[13.5px] font-bold"
                    style={{ textDecoration: t.done ? "line-through" : "none" }}
                  >
                    {t.text}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE — 2027 goals, by pillar
 * ==================================================================== */
function GoalRow({ goal, onToggle, onEdit, onDelete }) {
  const [burst, fireBurst] = useBurst(700);

  const handle = () => {
    if (!goal.done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg border transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst ? T.primary : "transparent",
        background: burst
          ? `${T.primary}26`
          : goal.done
          ? `${T.primary}0F`
          : "transparent",
      }}
    >
      {/* Emerald, never the pillar's pastel — done is done, and it has to
          read that way at a glance. The pillar colours its own chrome. */}
      <Checkbox
        checked={goal.done}
        onToggle={handle}
        label={goal.text}
        tint={T.primary}
        size="sm"
      />
      <button
        onClick={onEdit}
        aria-label={`تعديل ${goal.text}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`حذف ${goal.text}`}
        className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function GoalsModule({ state, setState }) {
  const [editing, setEditing] = useState(null); // {id?, text, pillar, quarter}
  /* Opens on the 90 days you are actually in — the whole point of chunking. */
  const [quarter, setQuarter] = useState(currentQuarter);

  const all = state.goals || [];
  const goals = all.filter((g) => g.quarter === quarter);
  const done = goals.filter((g) => g.done).length;
  const pct = goals.length ? Math.round((done / goals.length) * 100) : 0;
  const meta = QUARTERS.find((q) => q.id === quarter) || QUARTERS[0];
  const live = quarter === currentQuarter();
  /* Counted from date boundaries, not the current clock time — on the last
     day of a quarter you still have that whole day, so the floor is 1. */
  const daysLeft = useMemo(() => {
    if (!live) return null;
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3 + 3,
      0,
    );
    return Math.max(1, Math.round((end - midnight) / 86400000) + 1);
  }, [live]);

  const toggle = (id) =>
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    }));

  const remove = (id) =>
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));

  const save = () => {
    const text = editing.text.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      goals: editing.id
        ? s.goals.map((g) =>
            g.id === editing.id
              ? { ...g, text, pillar: editing.pillar, quarter: editing.quarter }
              : g,
          )
        : [
            ...s.goals,
            {
              id: uid(),
              text,
              pillar: editing.pillar,
              quarter: editing.quarter,
              done: false,
            },
          ],
    }));
    setQuarter(editing.quarter);
    setEditing(null);
  };

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">أهداف ٢٠٢٧</h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            تسعون يومًا في كل مرّة. ركّز على الربع الذي تعيشه، ودع البقيّة تنتظر
            دورها.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn
              variant="default"
              size="sm"
              onClick={() =>
                setEditing({ text: "", pillar: "faith", quarter })
              }
            >
              <Plus size={14} strokeWidth={3} /> هدف جديد
            </Btn>
            <Badge tint={pct === 100 && goals.length ? T.primary : meta.tint}>
              <span dir="ltr" className="tabular-nums">
                {done}/{goals.length}
              </span>
              {" مُحقَّق"}
            </Badge>
            {daysLeft !== null && (
              <Badge tint={T.cta}>
                {daysLeft === 1 ? (
                  "بقي يوم واحد"
                ) : daysLeft === 2 ? (
                  "بقي يومان"
                ) : (
                  <>
                    {daysLeft <= 10 ? "بقيت " : "بقي "}
                    <span dir="ltr" className="tabular-nums">
                      {daysLeft}
                    </span>
                    {daysLeft <= 10 ? " أيام" : " يومًا"}
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
        <ProgressRing value={pct} size={150} stroke={11} />
      </Card>

      {/* quarter tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {QUARTERS.map((q) => {
          const on = q.id === quarter;
          const now = q.id === currentQuarter();
          const list = all.filter((g) => g.quarter === q.id);
          const hit = list.filter((g) => g.done).length;
          return (
            <button
              key={q.id}
              onClick={() => setQuarter(q.id)}
              aria-pressed={on}
              className="rounded-2xl border px-3 py-3 text-right transition-all duration-200"
              style={{
                borderColor: on ? `${q.tint}80` : T.border,
                backgroundImage: on
                  ? `linear-gradient(160deg, ${q.tint}2E, ${q.tint}0A)`
                  : "none",
                backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                color: on ? q.tint : T.muted,
                boxShadow: on ? `0 10px 26px -16px ${q.tint}` : "none",
              }}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
                {q.label}
                {now && (
                  <span
                    aria-label="الربع الحالي"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: T.cta, boxShadow: `0 0 8px ${T.cta}` }}
                  />
                )}
              </span>
              <span className="mt-0.5 block text-[10px]" style={{ color: T.faint }}>
                {q.months}
              </span>
              <span
                className="mt-1 block text-[10.5px] font-bold tabular-nums"
                dir="ltr"
                style={{ color: on ? q.tint : T.faint }}
              >
                {hit}/{list.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {PILLARS.map((p) => {
          const list = goals.filter((g) => g.pillar === p.id);
          const hit = list.filter((g) => g.done).length;
          const complete = list.length > 0 && hit === list.length;
          const Icon = p.icon;
          return (
            <Card key={p.id} className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: complete ? `${T.primary}59` : `${p.tint}45`,
                    background: complete ? `${T.primary}1A` : `${p.tint}18`,
                    color: complete ? T.primary : p.tint,
                  }}
                >
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <h3 className="text-[15px] font-bold">{p.label}</h3>
                <span className="mr-auto text-[11px] tabular-nums text-white/30">
                  <span dir="ltr">
                    {hit}/{list.length}
                  </span>
                </span>
              </div>

              <div
                className="mt-3.5 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: list.length ? `${(hit / list.length) * 100}%` : "0%",
                    backgroundImage: complete
                      ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
                      : `linear-gradient(90deg, ${p.tint}, ${p.tint}AA)`,
                    boxShadow: `0 0 12px ${complete ? T.primary : p.tint}99`,
                  }}
                />
              </div>

              <div className="mt-2 space-y-0.5">
                {list.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-white/25">
                    لا أهداف في هذه الركيزة بعد
                  </p>
                ) : (
                  list.map((g) => (
                    <GoalRow
                      key={g.id}
                      goal={g}
                      onToggle={() => toggle(g.id)}
                      onEdit={() =>
                        setEditing({ id: g.id, text: g.text, pillar: g.pillar })
                      }
                      onDelete={() => remove(g.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الهدف" : "هدف جديد"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="los-g-text" className="mb-1.5 block text-xs text-white/45">
              الهدف
            </label>
            <Field
              id="los-g-text"
              autoFocus
              value={editing?.text || ""}
              onChange={(e) => setEditing((s) => ({ ...s, text: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="مثال: ختم القرآن تدبّرًا مرّتين"
            />
          </div>
          <div>
            <span className="mb-2 block text-xs text-white/45">الربع</span>
            <div className="grid grid-cols-2 gap-2">
              {QUARTERS.map((q) => {
                const on = editing?.quarter === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setEditing((s) => ({ ...s, quarter: q.id }))}
                    aria-pressed={on}
                    className="rounded-xl border px-3 py-2.5 text-xs font-bold transition-all"
                    style={{
                      borderColor: on ? `${q.tint}80` : T.border,
                      background: on ? `${q.tint}1F` : "rgba(255,255,255,0.03)",
                      color: on ? q.tint : T.muted,
                    }}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-xs text-white/45">الركيزة</span>
            <div className="grid grid-cols-2 gap-2">
              {PILLARS.map((p) => {
                const on = editing?.pillar === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEditing((s) => ({ ...s, pillar: p.id }))}
                    aria-pressed={on}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all"
                    style={{
                      borderColor: on ? `${p.tint}80` : T.border,
                      background: on ? `${p.tint}1F` : "rgba(255,255,255,0.03)",
                      color: on ? p.tint : T.muted,
                    }}
                  >
                    <Icon size={14} strokeWidth={2} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE — flexible income & side ventures
 * ==================================================================== */
const money = (n) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(n || 0),
  );

function FinanceModule({ state, setState }) {
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState("");
  const [amount, setAmount] = useState("");
  const [venture, setVenture] = useState(null); // {id?, name, cost, revenue}

  const income = state.income || [];
  const ventures = state.ventures || [];

  const since = (days) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return income.filter((e) => new Date(e.date) >= d);
  };
  const week = since(7);
  const month = since(30);
  const sum = (list) => list.reduce((n, e) => n + (e.amount || 0), 0);
  const hoursOf = (list) => list.reduce((n, e) => n + (e.hours || 0), 0);
  const weekTotal = sum(week);
  const monthTotal = sum(month);
  const monthHours = hoursOf(month);
  const rate = monthHours ? monthTotal / monthHours : 0;

  const addIncome = () => {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const hrs = parseFloat(hours);
    setState((s) => ({
      ...s,
      income: [
        {
          id: uid(),
          date: dayKey(),
          label: label.trim() || "عمل مرن",
          hours: Number.isFinite(hrs) && hrs > 0 ? hrs : 0,
          amount: amt,
        },
        ...(s.income || []),
      ].slice(0, 500),
    }));
    setLabel("");
    setHours("");
    setAmount("");
  };

  const removeIncome = (id) =>
    setState((s) => ({ ...s, income: s.income.filter((e) => e.id !== id) }));

  const saveVenture = () => {
    const name = venture.name.trim();
    if (!name) return;
    const cost = parseFloat(venture.cost) || 0;
    const revenue = parseFloat(venture.revenue) || 0;
    setState((s) => ({
      ...s,
      ventures: venture.id
        ? s.ventures.map((v) =>
            v.id === venture.id ? { ...v, name, cost, revenue } : v,
          )
        : [...(s.ventures || []), { id: uid(), name, cost, revenue }],
    }));
    setVenture(null);
  };

  const stats = [
    { label: "هذا الأسبوع", value: weekTotal, tint: T.primary, icon: Coins },
    { label: "آخر ٣٠ يومًا", value: monthTotal, tint: T.accent, icon: Wallet },
    { label: "معدّل الساعة", value: rate, tint: T.sky, icon: TrendingUp },
  ];

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">
          الدخل والمشاريع
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          سجّل ساعاتك ودخلك المرن، واحسب كلفة أي فكرة قبل أن تبدأها. الأرقام
          بالريال.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${s.tint}45`,
                    background: `${s.tint}16`,
                    color: s.tint,
                  }}
                >
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <span className="text-[11.5px]" style={{ color: T.faint }}>
                  {s.label}
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-extrabold tabular-nums"
                dir="ltr"
                style={{ color: s.tint }}
              >
                {money(s.value)}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 sm:p-7">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          تسجيل دخل
        </h3>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="المصدر — مثال: توصيل"
          />
          <Field
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            inputMode="decimal"
            placeholder="ساعات"
            className="sm:max-w-[130px]"
          />
          <Field
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIncome()}
            inputMode="decimal"
            placeholder="المبلغ"
            className="sm:max-w-[150px]"
          />
          <Btn variant="default" onClick={addIncome} className="shrink-0">
            <Plus size={15} strokeWidth={3} /> إضافة
          </Btn>
        </div>

        <div className="mt-5 space-y-2">
          {income.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا دخل مسجّل بعد
            </p>
          ) : (
            income.slice(0, 12).map((e) => (
              <div
                key={e.id}
                className="group flex items-center gap-3 rounded-xl border px-4 py-2.5"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px]">{e.label}</span>
                {e.hours > 0 && (
                  <span
                    className="shrink-0 text-[10.5px] tabular-nums"
                    dir="ltr"
                    style={{ color: T.faint }}
                  >
                    {e.hours}h
                  </span>
                )}
                <span
                  className="shrink-0 text-[13px] font-extrabold tabular-nums"
                  dir="ltr"
                  style={{ color: T.primary }}
                >
                  {money(e.amount)}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums" dir="ltr" style={{ color: T.faint }}>
                  {e.date.slice(5)}
                </span>
                <button
                  onClick={() => removeIncome(e.id)}
                  aria-label={`حذف ${e.label}`}
                  className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
              أفكار ومشاريع
            </h3>
            <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
              الكلفة مقابل العائد المتوقّع — قبل أن تصرف ريالًا.
            </p>
          </div>
          <Btn
            variant="default"
            size="sm"
            onClick={() => setVenture({ name: "", cost: "", revenue: "" })}
          >
            <Plus size={14} strokeWidth={3} /> فكرة جديدة
          </Btn>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ventures.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px] lg:col-span-2"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا أفكار مسجّلة بعد
            </p>
          ) : (
            ventures.map((v) => {
              const profit = (v.revenue || 0) - (v.cost || 0);
              const good = profit >= 0;
              return (
                <div
                  key={v.id}
                  className="group rounded-2xl border p-4"
                  style={{
                    borderColor: good ? `${T.primary}3D` : `${T.danger}3D`,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb
                      size={15}
                      style={{ color: good ? T.primary : T.danger }}
                      className="shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
                      {v.name}
                    </span>
                    <button
                      onClick={() =>
                        setVenture({
                          id: v.id,
                          name: v.name,
                          cost: String(v.cost ?? ""),
                          revenue: String(v.revenue ?? ""),
                        })
                      }
                      aria-label={`تعديل ${v.name}`}
                      className="shrink-0 rounded p-1 text-white/25 transition-all hover:text-white/70"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          ventures: s.ventures.filter((x) => x.id !== v.id),
                        }))
                      }
                      aria-label={`حذف ${v.name}`}
                      className="shrink-0 rounded p-1 text-white/25 transition-all hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { k: "الكلفة", v: v.cost, tint: T.faint },
                      { k: "العائد", v: v.revenue, tint: T.accent },
                      { k: "الربح", v: profit, tint: good ? T.primary : T.danger },
                    ].map((cell) => (
                      <div
                        key={cell.k}
                        className="rounded-xl py-2"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <p className="text-[10px]" style={{ color: T.faint }}>
                          {cell.k}
                        </p>
                        <p
                          dir="ltr"
                          className="mt-0.5 text-[14px] font-extrabold tabular-nums"
                          style={{ color: cell.tint }}
                        >
                          {money(cell.v)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal
        open={!!venture}
        onClose={() => setVenture(null)}
        title={venture?.id ? "تعديل الفكرة" : "فكرة جديدة"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={saveVenture}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setVenture(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="los-v-name" className="mb-1.5 block text-xs text-white/45">
              اسم الفكرة
            </label>
            <Field
              id="los-v-name"
              autoFocus
              value={venture?.name || ""}
              onChange={(e) => setVenture((s) => ({ ...s, name: e.target.value }))}
              placeholder="مثال: متجر إلكتروني صغير"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="los-v-cost" className="mb-1.5 block text-xs text-white/45">
                الكلفة المتوقّعة
              </label>
              <Field
                id="los-v-cost"
                inputMode="decimal"
                value={venture?.cost || ""}
                onChange={(e) => setVenture((s) => ({ ...s, cost: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="los-v-rev" className="mb-1.5 block text-xs text-white/45">
                العائد المتوقّع
              </label>
              <Field
                id="los-v-rev"
                inputMode="decimal"
                value={venture?.revenue || ""}
                onChange={(e) => setVenture((s) => ({ ...s, revenue: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && saveVenture()}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* --- image helpers --------------------------------------------------- */
function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 280, MAX_H = 400;
        const scale = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ==================================================================== *
 *  MODULE 3 — Book vault
 * ==================================================================== */
const BOOK_STATUS = {
  planned: { label: "أنوي قراءته", tint: "#A855F7" },
  reading: { label: "أقرأه الآن", tint: "#3B82F6" },
  finished: { label: "أنهيته", tint: T.primary },
};

function VaultModule({ state, setState }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  const save = () => {
    const title = editing.title.trim();
    if (!title) return;
    setState((s) => ({
      ...s,
      books: editing.id
        ? s.books.map((b) => (b.id === editing.id ? { ...editing, title } : b))
        : [{ ...editing, id: uid(), title }, ...s.books],
    }));
    setEditing(null);
  };

  const patch = (next) =>
    setState((s) => ({
      ...s,
      books: s.books.map((b) => (b.id === next.id ? next : b)),
    }));

  const remove = (id) =>
    setState((s) => ({ ...s, books: s.books.filter((b) => b.id !== id) }));

  const shown =
    filter === "all" ? state.books : state.books.filter((b) => b.status === filter);
  const finished = state.books.filter((b) => b.status === "finished").length;

  return (
    <div className="space-y-7">
      <Card className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-7">
        <div>
          <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">مكتبة الإنجازات</h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            {finished} كتابًا مُنهًى من {state.books.length}. الكتاب بلا درس
            مكتوب لم يُقرأ.
          </p>
        </div>
        <Btn
          variant="default"
          onClick={() =>
            setEditing({
              title: "",
              author: "",
              status: "planned",
              rating: 0,
              lesson: "",
              cover: "",
            })
          }
        >
          <Plus size={15} strokeWidth={3} /> أضف كتابًا
        </Btn>
      </Card>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "الكل", tint: T.accent },
          ...Object.entries(BOOK_STATUS).map(([id, v]) => ({
            id,
            label: v.label,
            tint: v.tint,
          })),
        ].map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className="rounded-xl border px-4 py-2 text-xs font-bold transition-all"
              style={{
                borderColor: active ? `${f.tint}70` : T.border,
                background: active ? `${f.tint}16` : "rgba(255,255,255,0.03)",
                color: active ? f.tint : T.muted,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <Card className="py-14 text-center text-xs text-white/25">
          لا كتب في هذا التصنيف بعد.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {shown.map((b) => {
            const meta = BOOK_STATUS[b.status] || BOOK_STATUS.planned;
            return (
              <Card
                key={b.id}
                className="group flex gap-4 p-4 transition-all duration-500 hover:-translate-y-1"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${T.accent}59`;
                  e.currentTarget.style.boxShadow = `0 18px 50px -22px ${T.accent}88`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* spine + cover */}
                <div
                  className="relative h-[132px] w-[92px] shrink-0 overflow-hidden rounded-lg border"
                  style={{
                    borderColor: b.cover ? `${meta.tint}55` : `${meta.tint}33`,
                    boxShadow: b.cover ? `0 8px 30px -8px ${meta.tint}60` : `0 4px 20px -8px ${meta.tint}40`,
                  }}
                >
                  {b.cover ? (
                    <img
                      src={b.cover}
                      alt={b.title}
                      className="los-cover-in h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center"
                      style={{
                        background: `linear-gradient(160deg, ${meta.tint}45 0%, ${T.bgDeep} 72%)`,
                      }}
                    >
                      {/* inner glow blob */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-60"
                        style={{
                          background: `radial-gradient(ellipse 80% 55% at 50% 25%, ${meta.tint}55, transparent)`,
                        }}
                      />
                      <span
                        className="relative z-10 font-black leading-none"
                        style={{
                          fontSize: 44,
                          color: `${meta.tint}EE`,
                          textShadow: `0 0 28px ${meta.tint}BB, 0 0 6px ${meta.tint}`,
                        }}
                      >
                        {b.title.trim().charAt(0) || "؟"}
                      </span>
                      <span className="relative z-10 mt-2 px-1 text-center line-clamp-2 text-[8px] leading-tight text-white/35">
                        {b.title}
                      </span>
                    </div>
                  )}
                  {/* spine */}
                  <span
                    className="pointer-events-none absolute inset-y-0 right-0 w-[5px]"
                    style={{ background: `linear-gradient(to bottom, ${meta.tint}99, ${meta.tint}44)` }}
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-bold text-white/90">
                        {b.title}
                      </h3>
                      <p className="truncate text-[11px] text-white/35">
                        {b.author || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        onClick={() => setEditing({ ...b })}
                        aria-label={`تعديل ${b.title}`}
                        className="rounded p-1.5 text-white/15 transition-colors hover:text-white/70"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(b.id)}
                        aria-label={`حذف ${b.title}`}
                        className="rounded p-1.5 text-white/15 transition-colors hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={b.status}
                      onChange={(e) => patch({ ...b, status: e.target.value })}
                      aria-label={`حالة ${b.title}`}
                      className="rounded-md border bg-transparent px-2 py-0.5 text-[10.5px] outline-none"
                      style={{
                        borderColor: `${meta.tint}44`,
                        color: meta.tint,
                        background: `${meta.tint}12`,
                      }}
                    >
                      {Object.entries(BOOK_STATUS).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: T.cardSolid }}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <StarRating
                      value={b.rating}
                      onChange={(rating) => patch({ ...b, rating })}
                    />
                  </div>

                  <div className="mt-2.5 flex-1">
                    <label
                      htmlFor={`los-lesson-${b.id}`}
                      className="mb-1 block text-[10px]"
                      style={{ color: `${T.accent}AA` }}
                    >
                      أهم درس يغيّر حياتي
                    </label>
                    <textarea
                      id={`los-lesson-${b.id}`}
                      value={b.lesson}
                      onChange={(e) => patch({ ...b, lesson: e.target.value })}
                      rows={3}
                      placeholder="اكتب الدرس الواحد الذي ستطبّقه…"
                      className="w-full resize-none rounded-lg border bg-transparent px-2.5 py-2 text-[11.5px] leading-relaxed text-white/70 outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الكتاب" : "كتاب جديد"}
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={save}>
              حفظ
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setEditing(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {/* cover upload */}
            <div>
              <span className="mb-1.5 block text-xs text-white/45">غلاف الكتاب</span>
              <label
                className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border transition-all duration-200 hover:border-white/30"
                style={{
                  borderColor: editing.cover ? `${T.accent}55` : T.border,
                  background: editing.cover ? "transparent" : "rgba(255,255,255,0.03)",
                  height: editing.cover ? "auto" : 64,
                }}
              >
                {editing.cover ? (
                  <div className="relative w-full">
                    <img
                      src={editing.cover}
                      alt="غلاف"
                      className="max-h-40 w-full object-contain"
                    />
                    <span
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-lg border px-3 py-1 text-[10px] font-bold"
                      style={{ borderColor: T.border, background: `${T.bgDeep}D9`, color: T.muted }}
                    >
                      تغيير الصورة
                    </span>
                  </div>
                ) : (
                  <span className="flex flex-col items-center gap-1" style={{ color: T.muted }}>
                    <ImagePlus size={20} />
                    <span className="text-[11px]">رفع غلاف (اختياري)</span>
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const data = await resizeImage(file);
                      setEditing((s) => ({ ...s, cover: data }));
                    } catch {/* ignore */ }
                  }}
                />
              </label>
              {editing.cover && (
                <button
                  type="button"
                  className="mt-1.5 text-[10.5px] text-white/30 hover:text-red-400 transition-colors"
                  onClick={() => setEditing((s) => ({ ...s, cover: "" }))}
                >
                  حذف الصورة
                </button>
              )}
            </div>
            <div>
              <label htmlFor="los-b-title" className="mb-1.5 block text-xs text-white/45">
                العنوان
              </label>
              <Field
                id="los-b-title"
                autoFocus
                value={editing.title}
                onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                placeholder="مثال: العادات الذرية"
              />
            </div>
            <div>
              <label htmlFor="los-b-author" className="mb-1.5 block text-xs text-white/45">
                المؤلف
              </label>
              <Field
                id="los-b-author"
                value={editing.author}
                onChange={(e) => setEditing((s) => ({ ...s, author: e.target.value }))}
                placeholder="مثال: جيمس كلير"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/45">التقييم</span>
              <StarRating
                value={editing.rating}
                size={18}
                onChange={(rating) => setEditing((s) => ({ ...s, rating }))}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-white/45">الحالة</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(BOOK_STATUS).map(([k, v]) => {
                  const active = editing.status === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setEditing((s) => ({ ...s, status: k }))}
                      aria-pressed={active}
                      className="rounded-xl border px-2 py-2 text-[11.5px] font-bold transition-all"
                      style={{
                        borderColor: active ? `${v.tint}80` : T.border,
                        background: active ? `${v.tint}16` : "transparent",
                        color: active ? v.tint : T.muted,
                      }}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="los-b-lesson" className="mb-1.5 block text-xs text-white/45">
                أهم درس يغيّر حياتي
              </label>
              <Field
                as="textarea"
                id="los-b-lesson"
                rows={3}
                value={editing.lesson}
                onChange={(e) => setEditing((s) => ({ ...s, lesson: e.target.value }))}
                placeholder="الدرس الواحد الذي ستطبّقه…"
                className="resize-none leading-relaxed"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ==================================================================== *
 *  MODULE 4 — Analytics
 * ==================================================================== */
const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const WEEK_LABELS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

const levelOf = (pct) =>
  pct >= 90 ? 4 : pct >= 70 ? 3 : pct >= 45 ? 2 : pct > 0 ? 1 : 0;
const LEVEL_BG = [
  "rgba(255,255,255,0.04)",
  "rgba(16,185,129,0.28)",
  "rgba(16,185,129,0.5)",
  "rgba(16,185,129,0.74)",
  "#10B981",
];

function AnalyticsModule({ state, discipline, streak }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [openNote, setOpenNote] = useState(null);

  const byDate = useMemo(() => {
    const map = new Map((state.history || []).map((h) => [h.date, h.pct]));
    map.set(dayKey(), discipline); // today is live, not yet archived
    return map;
  }, [state.history, discipline]);

  const notesByDate = useMemo(
    () =>
      new Map(
        (state.history || [])
          .filter((h) => h.distraction || h.fix || h.mirror)
          .map((h) => [h.date, h]),
      ),
    [state.history],
  );

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const lead = (first.getDay() + 1) % 7; // week starts Saturday
    const cells = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dayKey(new Date(cursor.y, cursor.m, d));
      cells.push({ d, ds, pct: byDate.get(ds) });
    }
    return cells;
  }, [cursor, byDate]);

  const monthStats = useMemo(() => {
    const vals = grid.filter((c) => c && c.pct !== undefined).map((c) => c.pct);
    return {
      tracked: vals.length,
      avg: vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0,
      best: vals.length ? Math.max(...vals) : 0,
      hit: vals.filter((v) => v >= STREAK_TARGET).length,
    };
  }, [grid]);

  const yearBars = useMemo(() => {
    return AR_MONTHS.map((label, m) => {
      const vals = (state.history || [])
        .filter((h) => {
          const [y, mm] = h.date.split("-").map(Number);
          return y === cursor.y && mm - 1 === m;
        })
        .map((h) => h.pct);
      return {
        label,
        avg: vals.length
          ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          : 0,
        n: vals.length,
      };
    });
  }, [state.history, cursor.y]);

  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="text-2xl font-extrabold leading-tight sm:text-[27px]">التتبع الشهري</h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          كل مربّع يوم من عمرك. الفراغات هي ما ستندم عليه — لا الأخطاء.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "متوسط الشهر", v: `${monthStats.avg}%`, c: T.accent, icon: TrendingUp },
          { k: "أفضل يوم", v: `${monthStats.best}%`, c: T.primary, icon: Star },
          { k: "أيام فوق ٨٠٪", v: String(monthStats.hit), c: T.primary, icon: Check },
          { k: "السلسلة الحالية", v: String(streak), c: T.ember, icon: Flame },
        ].map((s) => (
          <Card key={s.k} className="p-4">
            <div className="flex items-center gap-2">
              <s.icon size={13} style={{ color: s.c }} />
              <p className="text-[10.5px] text-white/40">{s.k}</p>
            </div>
            <p
              className="mt-1.5 text-2xl font-extrabold tabular-nums"
              style={{ color: s.c }}
            >
              {s.v}
            </p>
          </Card>
        ))}
      </div>

      {/* month grid */}
      <Card className="p-6 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <Btn variant="outline" size="icon" onClick={() => shift(1)} aria-label="الشهر التالي">
            <ChevronLeft size={16} />
          </Btn>
          <h3 className="text-base font-bold">
            {AR_MONTHS[cursor.m]}{" "}
            <span className="tabular-nums text-white/40">{cursor.y}</span>
          </h3>
          <Btn variant="outline" size="icon" onClick={() => shift(-1)} aria-label="الشهر السابق">
            <ChevronRight size={16} />
          </Btn>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEK_LABELS.map((w) => (
            <span key={w} className="pb-1 text-[10px] text-white/25">
              {w}
            </span>
          ))}
          {grid.map((cell, i) => {
            if (cell === null) return <span key={`e${i}`} />;
            const note = notesByDate.get(cell.ds);
            return (
              <button
                key={cell.ds}
                type="button"
                onClick={() => note && setOpenNote(note)}
                disabled={!note}
                title={
                  cell.pct === undefined
                    ? `${cell.ds} — لا سجلّ`
                    : `${cell.ds} — ${cell.pct}٪${note ? " — فيه وقفة" : ""}`
                }
                className="relative flex aspect-square items-center justify-center rounded-lg border text-[11px] font-bold tabular-nums transition-transform duration-150 hover:scale-110 disabled:cursor-default"
                style={{
                  background: LEVEL_BG[levelOf(cell.pct ?? 0)],
                  borderColor:
                    cell.ds === dayKey() ? T.accent : "rgba(255,255,255,0.06)",
                  color:
                    (cell.pct ?? 0) >= 45
                      ? "#04140E"
                      : "rgba(255,255,255,0.35)",
                }}
              >
                {cell.d}
                {note && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: T.cta, boxShadow: `0 0 5px ${T.cta}` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <Modal
          open={!!openNote}
          onClose={() => setOpenNote(null)}
          title={`وقفة ${openNote?.date || ""}`}
        >
          <div className="space-y-4">
            <Badge tint={(openNote?.pct ?? 0) >= STREAK_TARGET ? T.primary : T.cta}>
              <span dir="ltr" className="tabular-nums">
                {openNote?.pct ?? 0}%
              </span>
              {" ذلك اليوم"}
            </Badge>
            {openNote?.distraction && (
              <div>
                <p className="mb-1.5 text-xs text-white/45">ما الذي شتّتني</p>
                <p
                  className="rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                  style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
                >
                  {openNote.distraction}
                </p>
              </div>
            )}
            {openNote?.fix && (
              <div>
                <p className="mb-1.5 text-xs text-white/45">كيف أتجنّبه</p>
                <p
                  className="rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                  style={{
                    borderColor: `${T.primary}3D`,
                    background: `${T.primary}0F`,
                  }}
                >
                  {openNote.fix}
                </p>
              </div>
            )}
            {openNote?.mirror && (
              <div>
                <p className="mb-1.5 text-xs text-white/45">مرآة المحاسبة</p>
                <p
                  className="whitespace-pre-wrap rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                  style={{
                    borderColor: `${T.danger}3D`,
                    background: `${T.danger}0F`,
                  }}
                >
                  {openNote.mirror}
                </p>
              </div>
            )}
          </div>
        </Modal>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
          <span>الإطار الذهبي = اليوم · النقطة المرجانية = وقفة مكتوبة</span>
          <span className="flex items-center gap-1.5">
            أقل
            {LEVEL_BG.map((c, i) => (
              <span
                key={i}
                className="h-[11px] w-[11px] rounded-[3px]"
                style={{ background: c }}
              />
            ))}
            أكثر
          </span>
        </div>
      </Card>

      {/* year overview */}
      <Card className="p-6 sm:p-7">
        <h3 className="text-sm font-bold text-white/70">
          متوسط كل شهر في {cursor.y}
        </h3>
        <div className="mt-5 flex h-32 items-end gap-1.5">
          {yearBars.map((b, i) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-full w-full items-end">
                <div
                  title={`${b.label}: ${b.avg}٪ (${b.n} يوم)`}
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(3, b.avg)}%`,
                    background:
                      b.avg >= STREAK_TARGET
                        ? T.primary
                        : b.avg > 0
                        ? T.accent
                        : "rgba(255,255,255,0.06)",
                    opacity: i === cursor.m ? 1 : 0.65,
                  }}
                />
              </div>
              <span className="text-[8.5px] text-white/25">{b.label.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* Module scope, not a closure inside LifeOS — defining it inline gave the
   nav a new component type every render, so React tore down and rebuilt
   every button, dropping focus and restarting transitions mid-flight. */
function NavList({ tab, onGo, showLabels }) {
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((n) => {
        const on = n.id === tab;
        const Icon = n.icon;
        return (
          <button
            key={n.id}
            onClick={() => onGo(n.id)}
            aria-current={on ? "page" : undefined}
            title={showLabels ? undefined : n.label}
            className={`los-nav flex items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition-all duration-200${
              on ? " los-nav-on" : ""
            }`}
            style={{
              borderColor: on ? `${T.cta}66` : "transparent",
              background: on
                ? `linear-gradient(135deg, ${T.cta}2E, ${T.cta}0F)`
                : "transparent",
              color: on ? T.ctaLift : T.muted,
              boxShadow: on ? `0 8px 22px -12px ${T.cta}` : "none",
            }}
          >
            <Icon size={18} strokeWidth={on ? 2.4 : 1.9} className="shrink-0" />
            {showLabels && (
              <span className="truncate text-[13.5px] font-bold">{n.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* Mobile navigation. Floats clear of the bottom edge so it reads as a
   separate pane of glass rather than a docked strip, and clears the home
   indicator via safe-area inset. */
const TAB_BAR = 4; // four fit a phone legibly; the rest live behind "المزيد"

function BottomTabs({ tab, onGo, onSettings }) {
  const [more, setMore] = useState(false);
  const front = NAV.slice(0, TAB_BAR);
  const rest = NAV.slice(TAB_BAR);
  const restActive = rest.some((n) => n.id === tab);

  const glass = {
    backgroundColor: `${T.bgDeep}E0`,
    backgroundImage:
      "linear-gradient(135deg, rgba(255,255,255,0.13), rgba(255,255,255,0.035))",
    borderColor: "rgba(255,255,255,0.16)",
    backdropFilter: "blur(24px) saturate(160%)",
    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.16), 0 20px 44px -16px rgba(0,0,0,0.95), 0 0 34px -16px ${T.cta}`,
  };

  const tabStyle = (on) => ({
    color: on ? T.ctaLift : T.faint,
    backgroundImage: on
      ? `linear-gradient(160deg, ${T.cta}40, ${T.cta}0D)`
      : "none",
    boxShadow: on ? `0 10px 22px -14px ${T.cta}` : "none",
  });

  const Pip = () => (
    <span
      aria-hidden="true"
      className="absolute top-0.5 h-[3px] w-7 rounded-full"
      style={{ background: T.ctaLift, boxShadow: `0 0 10px 1px ${T.cta}` }}
    />
  );

  return (
    <>
      {more && (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMore(false)}
          />
          <div
            className="los-in absolute inset-x-4 rounded-[26px] border p-3"
            style={{ ...glass, bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)" }}
          >
            <div className="grid grid-cols-2 gap-2">
              {rest.map((n) => {
                const on = n.id === tab;
                const Icon = n.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      onGo(n.id);
                      setMore(false);
                    }}
                    aria-current={on ? "page" : undefined}
                    className="los-tab flex items-center gap-2.5 rounded-2xl px-4 py-3 text-right transition-all duration-300"
                    style={tabStyle(on)}
                  >
                    <Icon size={17} strokeWidth={on ? 2.5 : 1.9} className="shrink-0" />
                    <span className="truncate text-[12.5px] font-bold">{n.short}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  onSettings();
                  setMore(false);
                }}
                className="los-tab flex items-center gap-2.5 rounded-2xl px-4 py-3 text-right transition-all duration-300"
                style={tabStyle(false)}
              >
                <Settings size={17} strokeWidth={1.9} className="shrink-0" />
                <span className="truncate text-[12.5px] font-bold">الإعدادات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="التنقّل الرئيسي"
        className="fixed inset-x-0 z-[56] flex justify-center px-4 lg:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      >
        <div
          className="flex w-full max-w-md items-stretch gap-1 rounded-[26px] border p-1.5"
          style={glass}
        >
          {front.map((n) => {
            const on = n.id === tab;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => {
                  onGo(n.id);
                  setMore(false);
                }}
                aria-current={on ? "page" : undefined}
                className="los-tab relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 transition-all duration-300"
                style={tabStyle(on)}
              >
                {on && <Pip />}
                <Icon
                  size={19}
                  strokeWidth={on ? 2.6 : 1.9}
                  className={`shrink-0 transition-transform duration-300${
                    on ? " -translate-y-px scale-110" : ""
                  }`}
                />
                <span className="text-[9.5px] font-bold leading-none">{n.short}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            aria-label="المزيد"
            className="los-tab relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 transition-all duration-300"
            style={tabStyle(more || restActive)}
          >
            {restActive && !more && <Pip />}
            <Menu
              size={19}
              strokeWidth={more || restActive ? 2.6 : 1.9}
              className="shrink-0"
            />
            <span className="text-[9.5px] font-bold leading-none">المزيد</span>
          </button>
        </div>
      </nav>
    </>
  );
}

/* ==================================================================== *
 *  Backup — export / import the whole payload
 * ==================================================================== */
function SettingsModal({ open, onClose, state, setState }) {
  const fileRef = useRef(null);
  const [note, setNote] = useState(null); // {ok, text}

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-os-2027-${dayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNote({ ok: true, text: "تم تنزيل نسخة احتياطية." });
    } catch {
      setNote({ ok: false, text: "تعذّر التصدير." });
    }
  };

  const importData = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      /* A file can be anything — refuse a payload that is not this app's,
         rather than replacing good data with a half-valid object. */
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.habits)) {
        setNote({ ok: false, text: "الملف ليس نسخة صالحة من Life OS." });
        return;
      }
      setState(migrate({ ...freshState(), ...parsed }));
      setNote({ ok: true, text: "تم استيراد البيانات واستبدال الحالي." });
    } catch {
      setNote({ ok: false, text: "تعذّرت قراءة الملف — تأكّد أنه JSON سليم." });
    }
  };

  const counts = [
    { k: "عادة", n: state.habits?.length || 0 },
    { k: "مهمة", n: state.tasks?.length || 0 },
    { k: "هدف", n: state.goals?.length || 0 },
    { k: "كتاب", n: state.books?.length || 0 },
  ];

  return (
    <Modal open={open} onClose={onClose} title="الإعدادات والنسخ الاحتياطي">
      <div className="space-y-5">
        <div
          className="grid grid-cols-4 gap-2 rounded-2xl border p-3 text-center"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          {counts.map((c) => (
            <div key={c.k}>
              <p
                dir="ltr"
                className="text-[17px] font-extrabold tabular-nums"
                style={{ color: T.accent }}
              >
                {c.n}
              </p>
              <p className="text-[10px]" style={{ color: T.faint }}>
                {c.k}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <Btn variant="default" className="w-full" onClick={exportData}>
            <Download size={15} /> تصدير البيانات
          </Btn>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} /> استيراد البيانات
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              importData(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <p
          className="rounded-xl border px-3.5 py-2.5 text-[11px] leading-relaxed"
          style={{
            borderColor: `${T.accent}3D`,
            background: `${T.accent}12`,
            color: T.accent,
          }}
        >
          الاستيراد يستبدل كل بياناتك الحالية. صدّر نسخة أولًا إن لم تكن متأكّدًا.
        </p>

        {note && (
          <p
            className="los-in rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] font-bold"
            style={{
              borderColor: note.ok ? `${T.primary}59` : `${T.danger}59`,
              background: note.ok ? `${T.primary}1A` : `${T.danger}1A`,
              color: note.ok ? T.primary : T.danger,
            }}
          >
            {note.text}
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  End-of-day reflection — only on a day that fell short
 * ==================================================================== */
function ReflectionModal({ open, onClose, onSave, pct }) {
  const [distraction, setDistraction] = useState("");
  const [fix, setFix] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="وقفة آخر اليوم"
      footer={
        <>
          <Btn
            variant="default"
            className="flex-1"
            onClick={() => onSave(distraction.trim(), fix.trim())}
          >
            احفظ
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            لاحقًا
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <p
          className="rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.cta}3D`,
            background: `${T.cta}12`,
            color: T.ctaLift,
          }}
        >
          أغلقت اليوم على{" "}
          <span dir="ltr" className="font-extrabold tabular-nums">
            {pct}%
          </span>
          . لا لوم — لكن لا تمرّ عليه دون أن تعرف السبب.
        </p>
        <div>
          <label htmlFor="los-r-d" className="mb-1.5 block text-xs text-white/45">
            ما الذي شتّتني اليوم؟
          </label>
          <Field
            id="los-r-d"
            as="textarea"
            rows={3}
            autoFocus
            value={distraction}
            onChange={(e) => setDistraction(e.target.value)}
            className="resize-none"
            placeholder="اكتبه بصراحة…"
          />
        </div>
        <div>
          <label htmlFor="los-r-f" className="mb-1.5 block text-xs text-white/45">
            كيف أتجنّبه غدًا؟
          </label>
          <Field
            id="los-r-f"
            as="textarea"
            rows={3}
            value={fix}
            onChange={(e) => setFix(e.target.value)}
            className="resize-none"
            placeholder="إجراء واحد محدّد…"
          />
        </div>
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  ROOT
 * ==================================================================== */
export default function LifeOS() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState(() => readUI().tab || "routine");
  const [collapsed, setCollapsed] = useState(() => !!readUI().collapsed);
  const [streakToast, setStreakToast] = useState(null); // streak count when banked
  const [settings, setSettings] = useState(false);
  const [reflect, setReflect] = useState(false);
  const [reflectDone, setReflectDone] = useState(false);
  const [mirror, setMirror] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage blocked — the session still works */
    }
  }, [state]);

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_KEY, JSON.stringify({ tab, collapsed }));
    } catch {
      /* per-viewer convenience only */
    }
  }, [tab, collapsed]);

  const habitsDone = state.habits.filter((h) => h.done).length;
  const discipline = state.habits.length
    ? Math.round((habitsDone / state.habits.length) * 100)
    : 0;

  /* archive today's score continuously so analytics never needs a save button.
     Today's entry is merged, not replaced — it also carries the evening
     reflection, and rebuilding it from scratch would wipe what was written. */
  useEffect(() => {
    setState((s) => {
      const today = dayKey();
      const prev = (s.history || []).find((h) => h.date === today);
      const rest = (s.history || []).filter((h) => h.date !== today);
      const next = [...rest, { ...prev, date: today, pct: discipline }].slice(
        -HISTORY_CAP,
      );
      return { ...s, history: next };
    });
  }, [discipline]);

  useEffect(() => {
    if (discipline >= STREAK_TARGET && !state.dayBanked) {
      setState((s) => {
        const n = s.streakBase + 1;
        return { ...s, dayBanked: true, bestStreak: Math.max(s.bestStreak || 0, n) };
      });
      setStreakToast(state.streakBase + 1);
      const t = setTimeout(() => setStreakToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [discipline, state.dayBanked, state.streakBase]);

  const streak = state.streakBase + (state.dayBanked ? 1 : 0);

  const [quote, shuffleQuote] = useDailyQuote();

  /* After 20:00, on a day that fell short, once — and never again if today's
     reflection is already written. Polled because the app is often left open. */
  const todayEntry = (state.history || []).find((h) => h.date === dayKey());
  const alreadyReflected = !!(todayEntry?.distraction || todayEntry?.fix);
  useEffect(() => {
    if (alreadyReflected || reflectDone) return;
    const check = () => {
      if (new Date().getHours() >= 20 && discipline < STREAK_TARGET) {
        setReflect(true);
        setReflectDone(true);
      }
    };
    check();
    /* A background tab throttles intervals hard, so also check the moment
       the tab is looked at again — that is when the evening prompt matters. */
    const id = setInterval(check, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [alreadyReflected, reflectDone, discipline]);

  const saveReflection = useCallback(
    (distraction, fix) => {
      setState((s) => {
        const today = dayKey();
        const prev = (s.history || []).find((h) => h.date === today);
        const rest = (s.history || []).filter((h) => h.date !== today);
        return {
          ...s,
          history: [
            ...rest,
            { ...prev, date: today, pct: discipline, distraction, fix },
          ].slice(-HISTORY_CAP),
        };
      });
      setReflect(false);
    },
    [discipline],
  );

  const saveMirror = useCallback(
    (text) => {
      setState((s) => {
        const today = dayKey();
        const prev = (s.history || []).find((h) => h.date === today);
        const rest = (s.history || []).filter((h) => h.date !== today);
        return {
          ...s,
          history: [...rest, { ...prev, date: today, pct: discipline, mirror: text }].slice(
            -HISTORY_CAP,
          ),
        };
      });
      setMirror(false);
    },
    [discipline],
  );

  const resetDay = useCallback(() => {
    if (!window.confirm("تصفير اليوم؟ سيُلغى تأشير جميع العادات والمهام.")) return;
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => ({ ...h, done: false })),
      tasks: s.tasks.map((t) => ({ ...t, done: false })),
    }));
  }, []);

  const go = (id) => setTab(id);

  const active = NAV.find((n) => n.id === tab) || NAV[0];

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full text-white antialiased"
      style={{
        background: `
          radial-gradient(820px 460px at 84% -8%, ${T.cta}33 0%, transparent 60%),
          radial-gradient(700px 400px at 4% 4%, ${T.accent}24 0%, transparent 58%),
          radial-gradient(760px 440px at 92% 44%, ${T.rose}1F 0%, transparent 60%),
          radial-gradient(900px 600px at 30% 106%, ${T.violet}2B 0%, transparent 64%),
          linear-gradient(170deg, ${T.bgLift} 0%, ${T.bg} 44%, ${T.bgDeep} 100%)
        `,
        backgroundAttachment: "fixed",
        fontFamily:
          "'Tajawal', 'Cairo', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700&display=swap');
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        /* Cairo carries more weight at display sizes than Tajawal; headings
           take it, body copy stays on Tajawal for readability. */
        h1, h2, h3 {
          font-family: 'Cairo', 'Tajawal', ui-sans-serif, system-ui, sans-serif;
          letter-spacing: -0.015em;
        }
        h2 { line-height: 1.25; }

        /* Everything Tailwind marks as transitioning eases OUT instead of
           in-and-out, so hover arrives fast and settles slowly. Attribute
           selectors tie with Tailwind's own class, and this block ships
           after it in the document, so it wins without !important. */
        [class~="transition"],
        [class~="transition-all"],
        [class~="transition-colors"],
        [class~="transition-transform"],
        [class~="transition-opacity"] {
          transition-timing-function: cubic-bezier(.22, 1, .36, 1);
        }

        @keyframes losFlame { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.15) rotate(3deg); } }
        .los-flame { animation: losFlame 1.6s ease-in-out infinite; }

        @keyframes losIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .los-in { animation: losIn .3s cubic-bezier(.22,1,.36,1) both; }

        @keyframes losCoverIn { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
        .los-cover-in { animation: losCoverIn .35s cubic-bezier(.22,1,.36,1) both; }

        /* --- reward loop: the payoff for finishing something ------------ */
        @keyframes losReward {
          0%   { transform: scale(1);     box-shadow: 0 0 0 0 ${T.primary}B3; }
          30%  { transform: scale(1.045); box-shadow: 0 0 22px 6px ${T.primary}66; }
          60%  { transform: scale(0.982); box-shadow: 0 0 30px 10px ${T.primary}26; }
          100% { transform: scale(1);     box-shadow: 0 0 0 0 ${T.primary}00; }
        }
        .los-reward { animation: losReward .7s cubic-bezier(.34,1.56,.64,1) forwards; }

        @keyframes losPop {
          0%   { transform: scale(1)    rotate(0deg); }
          35%  { transform: scale(1.35) rotate(-8deg); }
          62%  { transform: scale(0.9)  rotate(3deg); }
          100% { transform: scale(1.06) rotate(0deg); }
        }
        .los-pop { animation: losPop .52s cubic-bezier(.34,1.56,.64,1) forwards; }

        @keyframes losRipple {
          0%   { opacity: .95; transform: scale(1); }
          100% { opacity: 0;   transform: scale(2.9); }
        }
        .los-ripple { animation: losRipple .64s cubic-bezier(.22,1,.36,1) forwards; }

        @keyframes losHalo { 0%,100% { opacity: .38; transform: scale(1); } 50% { opacity: .62; transform: scale(1.06); } }
        .los-halo { animation: losHalo 2.4s ease-in-out infinite; }

        @keyframes losThrob { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .los-throb { animation: losThrob 2.4s ease-in-out infinite; }

        /* Hover lives in CSS so React never fights an imperatively-set style. */
        .los-nav:not(.los-nav-on):hover {
          background: rgba(255,255,255,0.07) !important;
          color: ${T.fg} !important;
        }
        .los-nav-on:hover { filter: brightness(1.12); }
        .los-btn:active { filter: brightness(.95); }
        .los-tab:active { transform: scale(.93); }

        @media (prefers-reduced-motion: reduce) {
          .los-flame, .los-in, .los-cover-in, .los-reward,
          .los-pop, .los-ripple, .los-halo, .los-throb {
            animation: none !important;
          }
          .los-btn:hover { transform: none !important; }
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* ---------- sidebar (desktop) ---------- */}
        <aside
          className="sticky top-0 hidden h-screen shrink-0 flex-col border-l p-4 transition-all duration-300 lg:flex"
          style={{
            width: collapsed ? 80 : 268,
            borderColor: T.border,
            background: "rgba(255,255,255,0.045)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="mb-7 flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "توسيع القائمة" : "طيّ القائمة"}
              aria-expanded={!collapsed}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors hover:border-white/30"
              style={{ borderColor: T.border, color: T.accent }}
            >
              <Menu size={18} />
            </button>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold leading-tight">
                  2027 <span style={{ color: T.accent }}>Life OS</span>
                </p>
                <p className="truncate text-[10px] text-white/30">
                  وقت حصاد الثمار
                </p>
              </div>
            )}
          </div>

          <NavList tab={tab} onGo={go} showLabels={!collapsed} />

          <div className="mt-auto space-y-3">
            {!collapsed && (
              <div
                className="rounded-2xl border p-4 text-center"
                style={{ borderColor: T.border, background: T.card }}
              >
                <p className="text-[10px] text-white/35">مؤشر اليوم</p>
                <p
                  className="text-3xl font-extrabold tabular-nums"
                  style={{
                    color: discipline >= STREAK_TARGET ? T.primary : T.accent,
                  }}
                >
                  {discipline}%
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                  <Flame
                    size={13}
                    style={{
                      color: discipline >= STREAK_TARGET ? T.ember : "rgba(255,255,255,.25)",
                    }}
                  />
                  {streak} يوم متتالٍ
                </div>
              </div>
            )}
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => setSettings(true)}
              className="w-full"
              style={{ borderColor: T.border }}
              title="الإعدادات والنسخ الاحتياطي"
            >
              <Settings size={13} />
              {!collapsed && "الإعدادات"}
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={resetDay}
              className="w-full"
              style={{ borderColor: T.border }}
              title="تصفير اليوم"
            >
              <RotateCcw size={13} />
              {!collapsed && "تصفير اليوم"}
            </Btn>
          </div>
        </aside>

        {/* ---------- main ---------- */}
        <main className="min-w-0 flex-1">
          {/* mobile header — navigation lives in BottomTabs, so no menu here */}
          <div
            className="sticky z-40 flex items-center justify-between gap-3 border-b px-5 py-3.5 lg:hidden"
            style={{
              top: "env(safe-area-inset-top, 0px)",
              borderColor: "rgba(255,255,255,0.10)",
              backgroundColor: `${T.bg}D9`,
              backdropFilter: "blur(18px) saturate(150%)",
            }}
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold leading-tight">
                2027 <span style={{ color: T.accent }}>Life OS</span>
              </p>
              <p
                className="truncate text-[10.5px] leading-tight"
                style={{ color: T.faint }}
              >
                {active.label}
              </p>
            </div>
            <span
              className="shrink-0 rounded-xl border px-3 py-1.5 text-[13px] font-extrabold tabular-nums"
              style={{
                borderColor:
                  discipline >= STREAK_TARGET ? `${T.primary}59` : `${T.accent}4D`,
                backgroundColor:
                  discipline >= STREAK_TARGET ? `${T.primary}1A` : `${T.accent}14`,
                color: discipline >= STREAK_TARGET ? T.primary : T.accent,
              }}
            >
              {discipline}%
            </span>
          </div>

          <div className="mx-auto w-full max-w-6xl px-5 pb-36 pt-7 sm:px-7 lg:px-10 lg:pb-20 lg:pt-12">
            <div key={tab} className="los-in">
              {tab === "routine" && (
                <RoutineModule
                  state={state}
                  setState={setState}
                  discipline={discipline}
                  streak={streak}
                  quote={quote}
                  onShuffleQuote={shuffleQuote}
                  mirror={todayEntry?.mirror || ""}
                  onOpenMirror={() => setMirror(true)}
                />
              )}
              {tab === "matrix" && (
                <MatrixModule state={state} setState={setState} />
              )}
              {tab === "deep" && <DeepWorkModule state={state} setState={setState} />}
              {tab === "goals" && <GoalsModule state={state} setState={setState} />}
              {tab === "pipeline" && (
                <PipelineModule state={state} setState={setState} />
              )}
              {tab === "tactical" && (
                <TacticalModule state={state} setState={setState} />
              )}
              {tab === "finance" && (
                <FinanceModule state={state} setState={setState} />
              )}
              {tab === "prompts" && (
                <PromptsModule state={state} setState={setState} />
              )}
              {tab === "vault" && <VaultModule state={state} setState={setState} />}
              {tab === "analytics" && (
                <AnalyticsModule
                  state={state}
                  discipline={discipline}
                  streak={streak}
                />
              )}
            </div>

            <footer className="mt-14 text-center text-[11px] text-white/20">
              2027 Life OS · الانضباط حرية مؤجّلة
            </footer>
          </div>
        </main>
      </div>

      <BottomTabs tab={tab} onGo={go} onSettings={() => setSettings(true)} />

      <SettingsModal
        open={settings}
        onClose={() => setSettings(false)}
        state={state}
        setState={setState}
      />

      <ReflectionModal
        open={reflect}
        onClose={() => setReflect(false)}
        onSave={saveReflection}
        pct={discipline}
      />

      <MirrorModal
        open={mirror}
        onClose={() => setMirror(false)}
        value={todayEntry?.mirror || ""}
        onSave={saveMirror}
      />

      {/* streak-banked toast */}
      {streakToast !== null && (
        <div
          className="los-in pointer-events-none fixed bottom-28 left-1/2 z-[70] -translate-x-1/2 flex items-center gap-3 rounded-2xl border px-6 py-4 shadow-2xl lg:bottom-8"
          style={{
            background: `linear-gradient(135deg, ${T.bgLift}, ${T.bgDeep})`,
            borderColor: `${T.primary}70`,
            boxShadow: `0 0 70px -10px ${T.primary}99`,
          }}
        >
          <Flame size={28} className="los-flame" style={{ color: T.ember, filter: `drop-shadow(0 0 10px ${T.ember})` }} />
          <div className="text-right">
            <p className="text-[13px] font-extrabold" style={{ color: T.accent }}>
              اليوم محتسب في سلسلتك! 🔥
            </p>
            <p className="text-[11px] text-white/50">
              <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.ember }}>{streakToast}</span> يوم متتالٍ
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<LifeOS />);
