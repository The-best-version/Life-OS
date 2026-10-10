/* --- career pipeline and applications -----------------------------------
 *  Prompt library, the job pipeline board, and the application tracker.
 * --------------------------------------------------------------------- */
import { uid, obj, dayKey } from "./life-state-util.mjs";

export const SEED_PROMPTS = [
  {
    title: "محاكي اختبار PMP",
    body: "تصرّف كمحاكي صارم لاختبار PMP. اطرح عليّ سؤالًا موقفيًّا صعبًا من نمط الاختبار الحقيقي، بأربعة خيارات متقاربة. لا تكشف الإجابة حتى أجيب، ثم اشرح لماذا الخيار الصحيح صحيح ولماذا كل خيار آخر خاطئ، مع ربطه بمجال المعرفة ومجموعة العمليات.",
  },
  {
    title: "بريد إدارة المرافق",
    body: "اكتب بريدًا مهنيًّا موجزًا لمدير المرافق بخصوص [الموضوع]. النبرة: محترمة وحازمة وواضحة. ابدأ بالسياق في سطر، ثم المشكلة بالأرقام، ثم الإجراء المطلوب بتاريخ محدّد. لا تزيد على ١٥٠ كلمة، ولا تستخدم عبارات إنشائية.",
  },
].map((p) => ({ id: uid(), ...p }));

export const SEED_PIPELINE = [
  { title: "إنهاء اختبار PMP التجريبي الأول", lane: "todo" },
  { title: "دراسة جدوى عربة الآيس كريم", lane: "todo" },
  { title: "تحديث LinkedIn بخبرة التدريب التعاوني", lane: "doing" },
].map((c) => ({ id: uid(), ...c }));

export const APP_STAGES = [
  { id: "sent", label: "مُرسَل", tint: "#5B8CFF" },
  { id: "touch", label: "تمت المتابعة", tint: "#00C2FF" },
  { id: "screen", label: "فرز هاتفي", tint: "#9D5CFF" },
  { id: "intv", label: "مقابلة", tint: "#FFB020" },
  { id: "offer", label: "عرض", tint: "#10B981" },
  { id: "closed", label: "مُغلَق", tint: "#FF4D8D" },
];
export const sprintShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  company: typeof s.company === "string" ? s.company : "",
  role: typeof s.role === "string" ? s.role : "",
  startedAt: typeof s.startedAt === "string" ? s.startedAt : dayKey(),
  pain: typeof s.pain === "string" ? s.pain : "",
  solution: typeof s.solution === "string" ? s.solution : "",
  contact: typeof s.contact === "string" ? s.contact : "",
  days: s.days && typeof s.days === "object" ? s.days : {},
  notes: s.notes && typeof s.notes === "object" ? s.notes : {},
});

export const appShape = (a) => (
  (a = obj(a)),
  {
  id: a.id || uid(),
  company: typeof a.company === "string" ? a.company : "",
  role: typeof a.role === "string" ? a.role : "",
  stage: APP_STAGES.some((s) => s.id === a.stage) ? a.stage : "sent",
  sentAt: typeof a.sentAt === "string" ? a.sentAt : dayKey(),
  touchedAt: typeof a.touchedAt === "string" ? a.touchedAt : null,
  note: typeof a.note === "string" ? a.note : "",
});

export const storyShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  title: typeof s.title === "string" ? s.title : "",
  situation: typeof s.situation === "string" ? s.situation : "",
  task: typeof s.task === "string" ? s.task : "",
  action: typeof s.action === "string" ? s.action : "",
  result: typeof s.result === "string" ? s.result : "",
});

export const careerShape = (c) => (
  (c = obj(c)),
  {
  startedAt: typeof c.startedAt === "string" ? c.startedAt : null,
  /* The one-time Saudi registrations. An object keyed by id rather than an
     array of done ids, so adding a row later cannot shift anyone's ticks. */
  setup: c.setup && typeof c.setup === "object" ? c.setup : {},
  missions: c.missions && typeof c.missions === "object" ? c.missions : {},
  sprints: Array.isArray(c.sprints) ? c.sprints.map(sprintShape) : [],
  apps: Array.isArray(c.apps) ? c.apps.map(appShape) : [],
  stories: Array.isArray(c.stories) ? c.stories.map(storyShape) : [],
  log: Array.isArray(c.log) ? c.log : [],
});
