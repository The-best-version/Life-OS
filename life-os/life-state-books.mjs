/* --- the library: the shelf and its reading cues ------------------------
 *  Every book's workspace and the shelf's seed data, plus the second cue
 *  list — one about reading, walked by the same `useDailyQuote` the general
 *  cue card uses, under its own key so the two cursors never fight.
 * --------------------------------------------------------------------- */
import { uid, obj } from "./life-state-util.mjs";

export const READ_ACTIVE = "active";
export const READ_GOAL_DEFAULT = 20;

/* Every book gained a workspace in schema 10: a summary, a list of points
   with the page they came from, and a page counter. `bookShape` is the one
   place that shape is written, so the seed, the add form and the migration
   cannot drift apart. */
export const bookShape = (b) => (
  (b = obj(b)),
  {
  title: "",
  author: "",
  status: "planned",
  rating: 0,
  lesson: "",
  cover: "",
  summary: "",
  notes: [],
  pages: "",
  page: "",
  finishedAt: null,
  ...b,
});

/* A habit can feed the library. `habit.book` is the link:
     null        — an ordinary habit, nothing to do with reading
     "active"    — follows whichever book is marked «أقرأه الآن»
     "<book id>" — pinned to one book, for a second reading habit
   Ticking such a habit logs a session; unticking removes today's and rolls
   the page counter back, so the log can never claim pages that were undone. */
export const SEED_BOOKS = [
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

export const READING_QUOTES = [
  { text: "الكتاب بلا درس مكتوب لم يُقرأ، بل مُرّ عليه.", author: "قاعدة المكتبة" },
  { text: "من قرأ كتابًا واحدًا وطبّقه، أنفع ممن قرأ مئة ونسيها.", author: "مثل مأثور" },
  { text: "اقرأ ما تحبّ حتى تُحبّ القراءة.", author: "نافال رافيكانت" },
  {
    text: "لو لم يكن في الكتب إلا أنها تقطع عنك وساوس الفراغ لكفى.",
    author: "ابن الجوزي",
  },
  { text: "الكتب هي المرآة التي نرى فيها أنفسنا قبل أن نرى غيرنا.", author: "عباس العقاد" },
  {
    text: "قراءة عشر صفحات كل يوم تصنع ١٥ كتابًا في السنة. البطء ليس العدوّ، الانقطاع هو.",
    author: "قاعدة التراكم",
  },
  { text: "خير جليس في الزمان كتاب.", author: "المتنبّي" },
  {
    text: "لا تقرأ لتردّ، ولا لتصدّق؛ اقرأ لتزن وتفكّر.",
    author: "فرانسيس بيكون",
  },
  { text: "الفصل الذي لم تلخّصه، ستنساه قبل نهاية الشهر.", author: "قاعدة التلخيص" },
  {
    text: "قيمة الكتاب في ما غيّره فيك، لا في عدد صفحاته.",
    author: "قاعدة المكتبة",
  },
  { text: "من لم يذق مرّ التعلّم ساعة، تجرّع ذلّ الجهل طول حياته.", author: "الإمام الشافعي" },
  {
    text: "كتاب تقرؤه مرّتين خير من كتابين تقرأ كلًّا منهما مرّة.",
    author: "قاعدة العمق",
  },
];

export const SEED_READS = () => READING_QUOTES.map((q) => ({ id: uid(), ...q }));
