/* --- the university desk's state layer -----------------------------------
 *  Courses, terms, marks, attendance, the week grid — the state behind the
 *  university desk. Distinct from life-uni.jsx, which is the UI that reads
 *  these shapes; this file holds no component and no icon.
 * --------------------------------------------------------------------- */
import {
  uid,
  obj,
  rows,
  hhmm,
  isKey,
  dayKey,
  addDays,
  clampNum,
  minsIn,
} from "./life-state-util.mjs";

export const GRADES = [
  { id: "A+", ar: "ممتاز مرتفع", p5: 5, p4: 4, min: 95 },
  { id: "A", ar: "ممتاز", p5: 4.75, p4: 3.75, min: 90 },
  { id: "B+", ar: "جيد جدًا مرتفع", p5: 4.5, p4: 3.5, min: 85 },
  { id: "B", ar: "جيد جدًا", p5: 4, p4: 3, min: 80 },
  { id: "C+", ar: "جيد مرتفع", p5: 3.5, p4: 2.5, min: 75 },
  { id: "C", ar: "جيد", p5: 3, p4: 2, min: 70 },
  { id: "D+", ar: "مقبول مرتفع", p5: 2.5, p4: 1.5, min: 65 },
  { id: "D", ar: "مقبول", p5: 2, p4: 1, min: 60 },
  { id: "F", ar: "راسب", p5: 1, p4: 0, min: 0 },
];
export const gradeOf = (id) => GRADES.find((g) => g.id === id) || null;
export const UNI_DAYS = [
  { d: 0, label: "الأحد", short: "ح" },
  { d: 1, label: "الإثنين", short: "ن" },
  { d: 2, label: "الثلاثاء", short: "ث" },
  { d: 3, label: "الأربعاء", short: "ر" },
  { d: 4, label: "الخميس", short: "خ" },
  { d: 6, label: "السبت", short: "س" },
];
export const uniDayOf = (d) => UNI_DAYS.find((x) => x.d === Number(d)) || null;

/* Vivid, never pastel — the tint is how a block is found on the timetable
   at a glance, and a washed-out one finds nothing. */
export const COURSE_TINTS = [
  "#00C2FF",
  "#FFB020",
  "#FF4D8D",
  "#9D5CFF",
  "#5B8CFF",
  "#FF7A45",
  "#10B981",
  "#FF5722",
];

/* A quarter of the meetings is the usual bar for being barred from the
   final. Derived from how often the course actually meets rather than
   asked for — but still editable, because it is a regulation and
   regulations differ between universities. */
export const TERM_WEEKS_DEFAULT = 15;

export const UNI_TASK_KINDS = [
  { id: "assign", label: "واجب", tint: "#FF7A45" },
  { id: "quiz", label: "كويز", tint: "#FFB020" },
  { id: "mid", label: "اختبار فصلي", tint: "#FF4D8D" },
  { id: "final", label: "اختبار نهائي", tint: "#FF3B5C" },
  { id: "project", label: "مشروع", tint: "#9D5CFF" },
  { id: "present", label: "عرض تقديمي", tint: "#00C2FF" },
];
export const slotShape = (s) => (
  (s = obj(s)),
  {
  id: s.id || uid(),
  day: uniDayOf(s.day) ? Number(s.day) : 0,
  from: hhmm(s.from, "08:00"),
  to: hhmm(s.to, "09:50"),
  room: typeof s.room === "string" ? s.room : "",
});

export const markShape = (m) => (
  (m = obj(m)),
  {
  id: m.id || uid(),
  label: typeof m.label === "string" ? m.label : "",
  /* `null` is "not returned yet" and has to survive as null. A zero is a
     zero he actually scored, and folding the two together is exactly how a
     mark sheet starts lying about where he stands. */
  score:
    m.score === null || m.score === undefined || m.score === ""
      ? null
      : Number.isFinite(Number(m.score))
        ? Math.max(0, Number(m.score))
        : null,
  max: clampNum(m.max, 0.01, 1000, 100),
  weight: clampNum(m.weight, 0, 100, 0),
});

export const courseShape = (c) => (
  (c = obj(c)),
  {
  id: c.id || uid(),
  code: typeof c.code === "string" ? c.code : "",
  name: typeof c.name === "string" ? c.name : "",
  credits: clampNum(c.credits, 1, 12, 3),
  instructor: typeof c.instructor === "string" ? c.instructor : "",
  term: typeof c.term === "string" ? c.term : "",
  tint: COURSE_TINTS.includes(c.tint) ? c.tint : COURSE_TINTS[0],
  slots: Array.isArray(c.slots) ? c.slots.map(slotShape) : [],
  marks: Array.isArray(c.marks) ? c.marks.map(markShape) : [],
  /* Set by hand once the final grade is published. Until then the mark
     sheet projects one and the GPA leaves the course out entirely. */
  grade: gradeOf(c.grade) ? c.grade : null,
  absences: clampNum(c.absences, 0, 200, 0),
  /* The days the quick button recorded. `absences` stays the authoritative
     count — it has to, because a term usually starts with absences taken
     before the app did — and this is what lets the button refuse a second
     tap on a day it already recorded. Tapping «غياب» twice after one
     lecture is the easiest mistake on this screen and the hardest to
     notice: the number is simply wrong from then on. */
  absentOn: Array.isArray(c.absentOn)
    ? c.absentOn.filter((d) => typeof d === "string" && isKey(d))
    : [],
  absenceCap: clampNum(c.absenceCap, 0, 200, 0), // 0 → derive from the slots
  target: clampNum(c.target, 0, 100, 90),
  /* Blackboard, Teams, a shared drive — whatever the course actually lives
     in. Stored exactly as typed: running it through `safeUrl` here would
     rewrite the field between keystrokes, so «b» became «https://b/» before
     the second letter arrived. It is sanitised where it is used as an
     `href` instead, which is the only place it can do harm. */
  link: typeof c.link === "string" ? c.link : "",
  notes: typeof c.notes === "string" ? c.notes : "",
});

export const termShape = (t) => (
  (t = obj(t)),
  {
  id: t.id || uid(),
  label: typeof t.label === "string" ? t.label : "",
  start: isKey(t.start) ? t.start : dayKey(),
  end: isKey(t.end) ? t.end : addDays(dayKey(), 7 * TERM_WEEKS_DEFAULT),
  weeks: clampNum(t.weeks, 1, 40, TERM_WEEKS_DEFAULT),
});

export const uniTaskShape = (t) => (
  (t = obj(t)),
  {
  id: t.id || uid(),
  title: typeof t.title === "string" ? t.title : "",
  kind: UNI_TASK_KINDS.some((k) => k.id === t.kind) ? t.kind : "assign",
  course: typeof t.course === "string" ? t.course : "",
  due: isKey(t.due) ? t.due : dayKey(),
  time: hhmm(t.time),
  place: typeof t.place === "string" ? t.place : "",
  weight: clampNum(t.weight, 0, 100, 0),
  done: !!t.done,
  notes: typeof t.notes === "string" ? t.notes : "",
});

/* The whole desk, reshaped. The active-term pointer is normalised here and
   nowhere else: a dangling id — a term deleted, or a hand-edited backup —
   would otherwise render an empty screen that looks exactly like lost data. */
export const uniShape = (u) => {
  u = obj(u);
  const terms = Array.isArray(u.terms) ? u.terms.map(termShape) : [];
  const ids = new Set(terms.map((t) => t.id));
  let term = typeof u.term === "string" && ids.has(u.term) ? u.term : "";
  if (!term && terms.length) {
    const today = dayKey();
    term = (terms.find((t) => t.start <= today && today <= t.end) || terms[0]).id;
  }
  return {
    scale: Number(u.scale) === 4 ? 4 : 5,
    /* Everything before the terms listed here, as one pair. Asking for
       every past term just to show a cumulative figure is a wall nobody
       climbs; two numbers off a transcript is thirty seconds. */
    priorGpa: clampNum(u.priorGpa, 0, 5, 0),
    priorCredits: clampNum(u.priorCredits, 0, 500, 0),
    /* Which scale that figure was typed on. Without it, flipping the scale
       folds a four-point average into a five-point cumulative — a wrong
       number stated confidently, which is worse than no number at all. */
    priorScale: Number(u.priorScale) === 4 ? 4 : 5,
    /* The degree's total credit hours, for the graduation bar. Zero means
       «not set» and the bar stays hidden — a progress bar against a number
       the user never gave is a progress bar against a guess. */
    gradCredits: clampNum(u.gradCredits, 0, 400, 0),
    /* The cumulative he is aiming at, for the «كم أحتاج هذا الفصل»
       calculator. Zero means «not set», same reasoning. */
    targetGpa: clampNum(u.targetGpa, 0, 5, 0),
    term,
    terms,
    courses: Array.isArray(u.courses) ? u.courses.map(courseShape) : [],
    tasks: Array.isArray(u.tasks) ? u.tasks.map(uniTaskShape) : [],
  };
};

/* The deliverables still owed, nearest first — the overdue ones included,
   and first, because a deadline that slipped is the one that needs saying
   out loud. Date then time, so two things due the same day come back in the
   order the day will meet them; an untimed one sits after the timed ones
   rather than at dawn. Nothing is filtered by term: a deliverable is owed
   whether or not its course belongs to the term that is currently open. */
export function uniPending(uni, today = dayKey()) {
  const list = rows(obj(uni).tasks)
    .map(uniTaskShape)
    .filter((t) => !t.done);
  return list.sort((a, b) => {
    if (a.due !== b.due) return a.due < b.due ? -1 : 1;
    const x = minsIn(a.time);
    const y = minsIn(b.time);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return x - y;
  });
}

export const SEED_UNI = () => {
  const start = dayKey();
  const t = termShape({
    label: "الفصل الحالي",
    start,
    end: addDays(start, 7 * TERM_WEEKS_DEFAULT),
    weeks: TERM_WEEKS_DEFAULT,
  });
  return uniShape({ terms: [t], term: t.id });
};
