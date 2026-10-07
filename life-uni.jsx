import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { Percent, UserSearch, Sparkles, Gauge, TrendingUp, Award, ExternalLink, Minus, GraduationCap, Presentation, Plus, X, ClipboardCheck, BookOpen, Clock, Settings, AlertTriangle, CalendarDays, ChevronRight, ChevronLeft, Trash2, Check, Pencil, FileText, Rocket, RotateCcw, Hash, ClipboardList, ShieldCheck, BookMarked, AlarmClock, MapPin, Users, CircleDot, SquarePen, School, CheckCheck, Calculator, Crosshair, Milestone, BadgeCheck, Hourglass, Flag, BarChart3 } from "lucide-react";
import { useBurst, safeUrl, whenWord, NumStep, DateField, TimeField, T, Card, Btn, Field, Badge, Modal, Checkbox, DOW_AR, arCount, DAY_FORMS, dayWord, daysPhrase, MIN_FORMS, minWord, STEP_FORMS, stepWord, MEET_FORMS, meetWord, TIMES_FORMS, timesWord, FALL_FORMS, fallWord, HOUR_FORMS, hourWord, COURSE_FORMS, courseWord, WEEK_FORMS, weekWord, LECTURE_FORMS, lectureWord, daysUntil, minsOf, nowMins, prettyTime, AR_MONTHS, arDate, gradePoints, gradeFromPct, coursesIn, termOf, courseIn, courseName, daySections, nextSection, useMinuteClock } from "./life-shared.jsx";
import { uid, TERM_WEEKS_DEFAULT, termShape, courseShape, uniTaskShape, UNI_TASK_KINDS, dayKey, clampNum, gradeOf, UNI_DAYS, uniDayOf, COURSE_TINTS, uniShape , GRADES, slotShape, markShape, isKey } from "./life-state.mjs";

/* ==================================================================== *
 *  MODULE — the university desk
 *
 *  Four screens that read from one another: الجدول (where to be), المقررات
 *  (the mark sheet and the absences), التسليمات (what is due), المعدّل
 *  (what all of it rolls up into).
 * ==================================================================== */

export const UNI_VIEWS = [
  { id: "week", label: "الجدول", icon: CalendarDays },
  { id: "courses", label: "المقررات", icon: BookMarked },
  { id: "tasks", label: "التسليمات", icon: ClipboardList },
  { id: "gpa", label: "المعدّل", icon: Calculator },
];

/* The letter whose points sit closest to a required average — «تحتاج 4.33»
   means nothing until it is «أي B+ في كل مقرّر تقريبًا». */
export const nearestGrade = (points, scale) => {
  let best = GRADES[0];
  let gap = Infinity;
  for (const g of GRADES) {
    const d = Math.abs(gradePoints(g, scale) - points);
    if (d < gap) {
      gap = d;
      best = g;
    }
  }
  return best.id;
};

/* Where an average sits, named. The number alone does not tell a student
   whether he is safe, and «٣.١ من ٥» is a different sentence from
   «٣.١ من ٤» — so the band is read off the ratio, not the raw figure. */
export const GPA_BANDS = [
  { min: 0.9, label: "ممتاز", tint: "#10B981" },
  { min: 0.75, label: "جيد جدًا", tint: "#00C2FF" },
  { min: 0.6, label: "جيد", tint: "#FFB020" },
  { min: 0.4, label: "مقبول", tint: "#FF7A45" },
  { min: 0, label: "تحت الخط", tint: "#FF3B5C" },
];
export const gpaBand = (gpa, scale) => {
  const r = scale ? gpa / scale : 0;
  return GPA_BANDS.find((b) => r >= b.min) || GPA_BANDS[GPA_BANDS.length - 1];
};

/* The university week, Sunday first. Friday is not on it; Saturday is, at
   the end, because some sections really are scheduled there and a timetable
   that cannot hold a real section is not a timetable. */
export const ABSENCE_LIMIT = 0.25;
export const uniKindOf = (id) =>
  UNI_TASK_KINDS.find((k) => k.id === id) || UNI_TASK_KINDS[0];
/* The ones that cannot be rescheduled by asking nicely. */
export const UNI_EXAM_KINDS = new Set(["quiz", "mid", "final"]);

/* What this term has to average for the cumulative to land on the target.
 *
 *  target = (bankedPoints + g · hours) / (bankedCredits + hours), solved for
 *  g. Returns null when there is nothing registered to earn it with, and a
 *  figure above the scale's ceiling when the target is simply out of reach
 *  this term — which the screen says plainly instead of printing «5.4».
 */
export const gpaNeeded = (target, banked, hours) => {
  if (!hours || hours <= 0) return null;
  return (target * (banked.credits + hours) - banked.points) / hours;
};

/* One term, so the screen opens on a timetable to fill rather than on a
   form asking what a term is. The dates are editable and the label is
   generic on purpose — inventing a term number would be inventing his
   transcript. */
/* --- the mark sheet --------------------------------------------------- *
 *  Two different questions, and conflating them is the usual bug: how much
 *  of the full hundred is already banked, versus how the marks that came
 *  back average on their own. One quiz worth 10%, answered perfectly, is
 *  ten points banked — not a course standing at 100%.
 * -------------------------------------------------------------------- */
export function courseStanding(c) {
  let totalW = 0;
  let gradedW = 0;
  let earned = 0; // points of the final hundred, already banked
  for (const m of c.marks || []) {
    totalW += m.weight;
    if (m.score === null) continue;
    gradedW += m.weight;
    earned += (m.score / m.max) * m.weight;
  }
  const pending = Math.max(0, totalW - gradedW);
  return {
    totalW,
    gradedW,
    pending,
    earned,
    /* The average over what has come back — the honest "how am I doing". */
    pace: gradedW > 0 ? (earned / gradedW) * 100 : null,
    /* Where the course lands if the rest goes exactly as the returned marks
       have gone. A projection, and labelled as one. */
    projected: gradedW > 0 ? earned + (earned / gradedW) * pending : null,
    /* The need-calculator is honest only once the declared weights add up
       to a hundred. Below that, some of the remaining marks are not
       declared at all, and «تحتاج ٨٤٪» would be arithmetic on a
       denominator that does not exist yet. */
    weightOk: Math.abs(totalW - 100) < 0.5,
  };
}

/* What the remaining weight has to average for the course to land on the
   target. Over 100 means the target is already out of reach on the
   declared weights, and the screen says so instead of printing 118%. */
export const needFor = (st, target) =>
  st.pending <= 0 ? null : ((target - st.earned) / st.pending) * 100;

/* How many meetings the course holds across the term, and how many
   absences bar you from the final. `null` rather than a guess when the
   timetable is empty — a cap of one, invented out of nothing, is exactly
   the kind of number a student would plan around. */
export const meetingsOf = (c, term) =>
  (c.slots || []).length * (term ? term.weeks : TERM_WEEKS_DEFAULT);
export const absenceCapOf = (c, term) => {
  if (c.absenceCap > 0) return c.absenceCap;
  const n = meetingsOf(c, term);
  return n > 0 ? Math.max(1, Math.floor(n * ABSENCE_LIMIT)) : null;
};

export const ATTEND_BANDS = [
  { min: 1, label: "خطر الحرمان", tint: "#FF3B5C" },
  { min: 0.75, label: "على الحدّ", tint: "#FF7A45" },
  { min: 0.5, label: "انتبه", tint: "#FFB020" },
  { min: 0, label: "آمن", tint: "#10B981" },
];
export const attendBand = (used, cap) => {
  if (!cap) return null;
  const r = used / cap;
  return ATTEND_BANDS.find((b) => r >= b.min) || ATTEND_BANDS[ATTEND_BANDS.length - 1];
};

/* Term and cumulative averages. Only a course carrying a published letter
   grade counts: an ungraded course has no points, and reading it as a zero
   would drop the GPA the moment a new term is registered. */
export function gpaOf(courses, scale) {
  let points = 0;
  let credits = 0;
  for (const c of courses || []) {
    const g = gradeOf(c.grade);
    if (!g) continue;
    points += gradePoints(g, scale) * c.credits;
    credits += c.credits;
  }
  return { gpa: credits ? points / credits : 0, points, credits };
}

/* The university's own deadlines, as calendar rows. Derived, never stored
   twice: a due date edited on the university screen has to move on the
   calendar in the same render, and two copies of one date are two dates
   that will eventually disagree. */
export function uniDue(uni, fromKey, toKey) {
  const map = new Map();
  for (const t of uni.tasks || []) {
    if (t.due < fromKey || t.due > toKey) continue;
    const row = map.get(t.due);
    if (row) row.push(t);
    else map.set(t.due, [t]);
  }
  for (const row of map.values())
    row.sort((a, b) => (minsOf(a.time) ?? 1441) - (minsOf(b.time) ?? 1441));
  return map;
}

/* Minutes to a position on the week grid, clamped to the band the grid
   actually draws — a 06:00 section must not render above the top edge. */
export const DAY_FROM = 7 * 60;
export const DAY_TO = 23 * 60;
export const spanPct = (from, to) => {
  const a = Math.max(DAY_FROM, Math.min(DAY_TO, from));
  const b = Math.max(a + 12, Math.min(DAY_TO, to));
  const w = DAY_TO - DAY_FROM;
  return { top: ((a - DAY_FROM) / w) * 100, height: ((b - a) / w) * 100 };
};

/* A number field you can actually type a decimal into. Committing
   `Number(e.target.value)` straight to state rewrites "8." as "8" between
   keystrokes, so "8.5" becomes unreachable — the field holds the text while
   it is being typed and commits the parsed number beside it. */
export function NumField({
  value,
  onChange,
  allowEmpty = false,
  min = 0,
  max = 1000,
  className = "",
  ...rest
}) {
  const show = (v) => (v === null || v === undefined ? "" : String(v));
  const [text, setText] = useState(() => show(value));
  const [typing, setTyping] = useState(false);

  /* A change arriving from outside — a reset, an import, another field —
     has to appear, but not while this one is being typed into: rewriting
     the text under the cursor is how a caret jumps to the end mid-number. */
  useEffect(() => {
    if (!typing) setText(show(value));
  }, [value, typing]);

  const commit = (raw) => {
    setText(raw);
    if (raw.trim() === "") {
      if (allowEmpty) onChange(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return; // "-" or "1e" mid-typing: keep the text
    onChange(Math.min(max, Math.max(min, n)));
  };

  return (
    <Field
      type="text"
      inputMode="decimal"
      dir="ltr"
      value={text}
      onFocus={() => setTyping(true)}
      onBlur={() => {
        setTyping(false);
        setText(show(value));
      }}
      onChange={(e) => commit(e.target.value)}
      className={`text-left tabular-nums ${className}`}
      {...rest}
    />
  );
}

/* Letter grades, as a grid. The one the percentage currently earns is
   ringed so the published grade can be checked against the mark sheet
   instead of being taken on trust. */
export function GradePicker({ value, onPick, scale, suggest }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {GRADES.map((g) => {
        const on = value === g.id;
        const hint = !on && suggest === g.id;
        const pts = gradePoints(g, scale);
        const tint = g.id === "F" ? T.danger : g.min >= 85 ? T.primary : T.accent;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onPick(on ? null : g.id)}
            aria-pressed={on}
            title={`${g.ar} — ${pts}`}
            className="rounded-xl border px-2 py-2 text-center transition-all"
            style={{
              borderColor: on ? `${tint}99` : hint ? `${T.sky}80` : T.border,
              background: on ? `${tint}26` : hint ? `${T.sky}14` : "rgba(255,255,255,0.03)",
              color: on ? tint : hint ? T.sky : T.muted,
            }}
          >
            <span dir="ltr" className="block text-[13px] font-extrabold">
              {g.id}
            </span>
            <span dir="ltr" className="block text-[9.5px] tabular-nums opacity-70">
              {pts}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* A labelled figure. Used wherever a screen states a number it computed,
   so the unit and the caveat travel with it. */
export function StatTile({ icon: Icon, label, value, sub, tint = T.accent }) {
  return (
    /* A Card, not a flat `${tint}0F` fill. These sit straight on the sky in
       the university header, and a fixed low-alpha tint becomes a pale
       smear against a noon horizon — the fill has to come from the phase.
       The tint keeps the rim and the figure, which is all it was for. */
    <Card className="p-3.5" style={{ borderColor: `${tint}40` }}>
      <p className="flex items-center gap-1.5 text-[10.5px]" style={{ color: T.faint }}>
        {Icon && <Icon size={12} style={{ color: tint }} />}
        {label}
      </p>
      <p
        dir="ltr"
        className="mt-1 text-[20px] font-extrabold leading-none tabular-nums"
        style={{ color: tint }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: T.faint }}>
          {sub}
        </p>
      )}
    </Card>
  );
}

/* --- the course desk -------------------------------------------------- *
 *  The card is a glance; this is where the term is actually run. The mark
 *  sheet, the timetable rows, the absence count and the grade all live
 *  here because they answer one another's questions.
 * -------------------------------------------------------------------- */
export function CourseDesk({ course, term, scale, onClose, onPatch, onDelete }) {
  if (!course) return null;

  const c = course;
  const st = courseStanding(c);
  const cap = absenceCapOf(c, term);
  const band = attendBand(c.absences, cap);
  const meetings = meetingsOf(c, term);
  const need = st.weightOk ? needFor(st, c.target) : null;
  const suggest =
    st.projected !== null ? gradeFromPct(st.projected).id : null;

  /* Every edit is expressed against `prev` — the course as it stands in
     state — not against `c`, the copy this render was drawn from. Two
     clicks on a stepper inside one frame otherwise both read the same
     starting number and one of them is lost. */
  const patch = (p) =>
    onPatch((prev) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) }));

  const addSlot = () =>
    patch((prev) => ({
      slots: [...prev.slots, slotShape({ day: 0, from: "08:00", to: "09:50" })],
    }));
  const setSlot = (id, p) =>
    patch((prev) => ({
      slots: prev.slots.map((s) => (s.id === id ? slotShape({ ...s, ...p }) : s)),
    }));
  const dropSlot = (id) =>
    patch((prev) => ({ slots: prev.slots.filter((s) => s.id !== id) }));

  const addMark = () =>
    patch((prev) => ({
      marks: [...prev.marks, markShape({ label: "", score: null, max: 100, weight: 0 })],
    }));
  const setMark = (id, p) =>
    patch((prev) => ({
      marks: prev.marks.map((m) => (m.id === id ? { ...m, ...p } : m)),
    }));
  const dropMark = (id) =>
    patch((prev) => ({ marks: prev.marks.filter((m) => m.id !== id) }));

  /* The four weightings almost every syllabus uses, so the mark sheet is
     one tap away from being usable instead of five rows of typing. */
  const preset = () =>
    patch({
      marks: [
        markShape({ label: "أعمال فصلية", max: 100, weight: 20 }),
        markShape({ label: "كويزات", max: 100, weight: 10 }),
        markShape({ label: "اختبار فصلي", max: 100, weight: 30 }),
        markShape({ label: "اختبار نهائي", max: 100, weight: 40 }),
      ],
    });

  return (
    <Modal
      open={!!course}
      onClose={onClose}
      wide
      title={courseName(c)}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={onClose}>
            <Check size={15} strokeWidth={3} /> تم
          </Btn>
          <Btn variant="danger" onClick={onDelete} title="حذف المقرّر">
            <Trash2 size={15} />
          </Btn>
        </>
      }
    >
      <div className="space-y-6">
        {/* --- identity --- */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-name">
              اسم المقرّر
            </label>
            <Field
              id="los-c-name"
              value={c.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="مثال: مبادئ الإدارة"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-code">
              الرمز
            </label>
            <Field
              id="los-c-code"
              dir="ltr"
              value={c.code}
              onChange={(e) => patch({ code: e.target.value })}
              placeholder="MGT 101"
              style={{ textAlign: "left" }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-dr">
              المحاضر
            </label>
            <Field
              id="los-c-dr"
              value={c.instructor}
              onChange={(e) => patch({ instructor: e.target.value })}
              placeholder="اسم الدكتور"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs text-white/45">الساعات المعتمدة</span>
            <NumStep
              value={c.credits}
              onChange={(v) => patch({ credits: clampNum(v, 1, 12, 3) })}
              min={1}
              max={12}
              unit="ساعة"
              tint={c.tint}
            />
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs text-white/45">اللون على الجدول</span>
          <div className="flex flex-wrap gap-2">
            {COURSE_TINTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => patch({ tint: t })}
                aria-label={`اللون ${t}`}
                aria-pressed={c.tint === t}
                className="h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110"
                style={{
                  background: t,
                  borderColor: c.tint === t ? T.fg : "transparent",
                  boxShadow: c.tint === t ? `0 0 14px ${t}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* --- the timetable rows --- */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.accent }}>
              <Clock size={13} /> مواعيد المحاضرات
            </p>
            <Btn variant="outline" size="sm" onClick={addSlot} style={{ borderColor: T.border }}>
              <Plus size={13} strokeWidth={3} /> موعد
            </Btn>
          </div>
          {c.slots.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-center text-[11px] leading-relaxed"
               style={{ borderColor: T.border, color: T.faint }}>
              بلا مواعيد لا يظهر المقرّر على الجدول، ولا يُحسب حدّ الغياب.
            </p>
          ) : (
            <div className="space-y-2">
              {c.slots.map((s) => {
                /* A section that ends before it starts draws as a sliver on
                   the week grid and quietly halves the meeting count behind
                   the absence limit. Flagged where it is typed, not left to
                   be discovered on the timetable. */
                const bad = (minsOf(s.to) ?? 0) <= (minsOf(s.from) ?? 0);
                return (
                <div
                  key={s.id}
                  className="flex flex-wrap items-end gap-2 rounded-xl border p-2.5"
                  style={{
                    borderColor: bad ? `${T.danger}59` : T.border,
                    background: bad ? `${T.danger}0F` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      اليوم
                    </span>
                    <Field
                      as="select"
                      value={s.day}
                      onChange={(e) => setSlot(s.id, { day: Number(e.target.value) })}
                      className="py-2 text-[12px]"
                      style={{ borderColor: T.border, colorScheme: "dark" }}
                    >
                      {UNI_DAYS.map((d) => (
                        <option key={d.d} value={d.d}>
                          {d.label}
                        </option>
                      ))}
                    </Field>
                  </div>
                  <div className="w-[88px]">
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      من
                    </span>
                    <TimeField value={s.from} onChange={(v) => setSlot(s.id, { from: v })} className="py-2 text-[12px]" />
                  </div>
                  <div className="w-[88px]">
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      إلى
                    </span>
                    <TimeField value={s.to} onChange={(v) => setSlot(s.id, { to: v })} className="py-2 text-[12px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      القاعة
                    </span>
                    <Field
                      value={s.room}
                      onChange={(e) => setSlot(s.id, { room: e.target.value })}
                      placeholder="٢٠٣"
                      className="py-2 text-[12px]"
                    />
                  </div>
                  <button
                    onClick={() => dropSlot(s.id)}
                    aria-label="حذف الموعد"
                    className="mb-1 rounded-lg p-2 text-white/30 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                  {bad && (
                    <p
                      className="flex w-full items-center gap-1.5 text-[10.5px] font-bold"
                      style={{ color: T.danger }}
                    >
                      <AlertTriangle size={11} /> وقت النهاية ليس بعد وقت البداية.
                    </p>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- attendance --- */}
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: band ? `${band.tint}3D` : T.border,
            background: band ? `${band.tint}0F` : "rgba(255,255,255,0.03)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.accent }}>
              <UserSearch size={13} /> الحضور والغياب
            </p>
            {band && (
              <Badge tint={band.tint}>
                <ShieldCheck size={11} /> {band.label}
              </Badge>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-[10.5px]" style={{ color: T.faint }}>
                إجمالي مرات الغياب
              </span>
              <NumStep
                value={c.absences}
                onChange={(v) => patch({ absences: clampNum(v, 0, 200, 0) })}
                min={0}
                max={200}
                unit="مرّة"
                tint={band ? band.tint : T.sky}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-[10.5px]" style={{ color: T.faint }}>
                الحدّ المسموح {c.absenceCap === 0 && cap !== null ? "(محسوب تلقائيًا)" : ""}
              </span>
              <NumStep
                value={c.absenceCap > 0 ? c.absenceCap : cap || 0}
                onChange={(v) => patch({ absenceCap: clampNum(v, 0, 200, 0) })}
                min={0}
                max={200}
                unit="مرّة"
                tint={T.accent}
              />
            </div>
          </div>

          {cap ? (
            <>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (c.absences / cap) * 100)}%`,
                    backgroundImage: `linear-gradient(90deg, ${band.tint}, ${band.tint}AA)`,
                    boxShadow: `0 0 12px ${band.tint}99`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: T.muted }}>
                {c.absences >= cap ? (
                  <>تجاوزت الحدّ — راجع المرشد الأكاديمي قبل أن يُثبّت الحرمان.</>
                ) : (
                  <>
                    يتبقّى لك{" "}
                    <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: band.tint }}>
                      {cap - c.absences}
                    </span>{" "}
                    {timesWord(cap - c.absences)} قبل الحرمان
                    {meetings > 0 && (
                      <>
                        {" "}— من{" "}
                        <span dir="ltr" className="tabular-nums">
                          {meetings}
                        </span>{" "}
                        {lectureWord(meetings)} في الفصل
                      </>
                    )}
                    .
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: T.faint }}>
              أضف مواعيد المحاضرات أو اكتب الحدّ بنفسك ليُحسب الغياب.
            </p>
          )}

          {/* The days the quick button recorded. A bare counter cannot be
              audited — «ستّ مرات» is unarguable and unverifiable at once,
              and the day you were actually present is the one you want to
              find. Removing a day puts the total back with it. */}
          {(c.absentOn || []).length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[10.5px]" style={{ color: T.faint }}>
                الأيام المسجّلة من هذه الشاشة
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...c.absentOn].sort().reverse().map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      patch((prev) => ({
                        absences: clampNum(prev.absences - 1, 0, 200, 0),
                        absentOn: (prev.absentOn || []).filter((x) => x !== d),
                      }))
                    }
                    aria-label={`حذف غياب ${arDate(d)}`}
                    title="احذف هذا اليوم"
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10.5px] font-bold transition-colors hover:border-white/40"
                    style={{ borderColor: T.border, color: T.muted }}
                  >
                    {arDate(d)}
                    <X size={10} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- where the course lives --- */}
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-link">
            رابط المقرّر <span style={{ color: T.faint }}>(بلاك بورد، تيمز، درايف)</span>
          </label>
          <div className="flex items-center gap-2">
            <Field
              id="los-c-link"
              dir="ltr"
              value={c.link}
              onChange={(e) => patch({ link: e.target.value })}
              placeholder="https://..."
              style={{ textAlign: "left" }}
            />
            {safeUrl(c.link) && (
              <Btn
                as="a"
                variant="outline"
                size="icon"
                href={safeUrl(c.link)}
                target="_blank"
                rel="noopener noreferrer"
                title="افتح الرابط"
                className="shrink-0"
                style={{ borderColor: T.border }}
              >
                <ExternalLink size={15} />
              </Btn>
            )}
          </div>
        </div>

        {/* --- the mark sheet --- */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.accent }}>
              <Percent size={13} /> توزيع الدرجات
            </p>
            <div className="flex gap-2">
              {c.marks.length === 0 && (
                <Btn variant="outline" size="sm" onClick={preset} style={{ borderColor: T.border }}>
                  <Sparkles size={13} /> توزيع شائع
                </Btn>
              )}
              <Btn variant="outline" size="sm" onClick={addMark} style={{ borderColor: T.border }}>
                <Plus size={13} strokeWidth={3} /> بند
              </Btn>
            </div>
          </div>

          {c.marks.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-center text-[11px] leading-relaxed"
               style={{ borderColor: T.border, color: T.faint }}>
              اكتب بنود التقييم وأوزانها، ثم أدخل الدرجات كما تصل — وسيُحسب
              كل شيء بعدها وحده.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="hidden gap-2 px-2.5 text-[10px] sm:flex" style={{ color: T.faint }}>
                <span className="min-w-0 flex-1">البند</span>
                <span className="w-[72px] text-center">الدرجة</span>
                <span className="w-[72px] text-center">من</span>
                <span className="w-[72px] text-center">الوزن ٪</span>
                <span className="w-[34px]" />
              </div>
              {c.marks.map((m) => {
                const got = m.score !== null ? (m.score / m.max) * m.weight : null;
                return (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-end gap-2 rounded-xl border p-2.5"
                    style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="min-w-[120px] flex-1">
                      <span className="mb-1 block text-[10px] sm:hidden" style={{ color: T.faint }}>
                        البند
                      </span>
                      <Field
                        value={m.label}
                        onChange={(e) => setMark(m.id, { label: e.target.value })}
                        placeholder="مثال: اختبار فصلي"
                        className="py-2 text-[12px]"
                      />
                    </div>
                    <div className="w-[72px]">
                      <span className="mb-1 block text-[10px] sm:hidden" style={{ color: T.faint }}>
                        الدرجة
                      </span>
                      <NumField
                        value={m.score}
                        allowEmpty
                        min={0}
                        max={1000}
                        onChange={(v) => setMark(m.id, { score: v })}
                        placeholder="—"
                        className="py-2 text-[12px]"
                      />
                    </div>
                    <div className="w-[72px]">
                      <span className="mb-1 block text-[10px] sm:hidden" style={{ color: T.faint }}>
                        من
                      </span>
                      <NumField
                        value={m.max}
                        min={0.01}
                        max={1000}
                        onChange={(v) => setMark(m.id, { max: v })}
                        className="py-2 text-[12px]"
                      />
                    </div>
                    <div className="w-[72px]">
                      <span className="mb-1 block text-[10px] sm:hidden" style={{ color: T.faint }}>
                        الوزن ٪
                      </span>
                      <NumField
                        value={m.weight}
                        min={0}
                        max={100}
                        onChange={(v) => setMark(m.id, { weight: v })}
                        className="py-2 text-[12px]"
                      />
                    </div>
                    <button
                      onClick={() => dropMark(m.id)}
                      aria-label="حذف البند"
                      className="mb-1 rounded-lg p-2 text-white/30 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                    {got !== null && (
                      <p className="w-full text-[10px]" style={{ color: T.muted }}>
                        حصّلت{" "}
                        <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: c.tint }}>
                          {got.toFixed(1)}
                        </span>{" "}
                        من{" "}
                        <span dir="ltr" className="tabular-nums">
                          {m.weight}
                        </span>{" "}
                        نقطة من المئة
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!st.weightOk && c.marks.length > 0 && (
            <p
              className="mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold"
              style={{ borderColor: `${T.accent}40`, background: `${T.accent}12`, color: T.accent }}
            >
              <AlertTriangle size={13} className="shrink-0" />
              مجموع الأوزان{" "}
              <span dir="ltr" className="tabular-nums">
                {st.totalW}
              </span>
              ٪ لا ١٠٠٪ — أكمله ليعمل حاسب «كم أحتاج».
            </p>
          )}
        </div>

        {/* --- where it stands --- */}
        {c.marks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              icon={BadgeCheck}
              label="محصّل من ١٠٠"
              value={st.earned.toFixed(1)}
              sub={`من ${st.gradedW}٪ رُصدت`}
              tint={c.tint}
            />
            <StatTile
              icon={Gauge}
              label="متوسط ما رُصد"
              value={st.pace === null ? "—" : `${st.pace.toFixed(1)}%`}
              sub={st.pace === null ? "لا درجات بعد" : gradeFromPct(st.pace).ar}
              tint={T.sky}
            />
            <StatTile
              icon={TrendingUp}
              label="المتوقّع"
              value={st.projected === null ? "—" : `${st.projected.toFixed(1)}%`}
              sub={
                st.projected === null
                  ? "يظهر بعد أول درجة"
                  : `بهذا المستوى: ${gradeFromPct(st.projected).id}`
              }
              tint={T.accent}
            />
            <StatTile
              icon={Hourglass}
              label="لم يُرصد بعد"
              value={`${st.pending}%`}
              sub="الوزن المتبقّي من المئة"
              tint={T.violet}
            />
          </div>
        )}

        {/* --- what the rest has to average --- */}
        {st.weightOk && st.pending > 0 && (
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${T.cta}3D`, background: `${T.cta}0F` }}
          >
            <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.cta }}>
              <Crosshair size={13} /> كم أحتاج في الباقي؟
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="min-w-[180px] flex-1">
                <span className="mb-1.5 block text-[10.5px]" style={{ color: T.faint }}>
                  هدفي في المقرّر
                </span>
                <NumStep
                  value={c.target}
                  onChange={(v) => patch({ target: clampNum(v, 0, 100, 90) })}
                  min={0}
                  max={100}
                  step={5}
                  unit="٪"
                  tint={T.cta}
                />
              </div>
              <div className="min-w-[160px] flex-1">
                {need === null ? null : need > 100 ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.danger }}>
                    الهدف لم يبقَ ممكنًا — أعلى ما يمكن بلوغه الآن{" "}
                    <span dir="ltr" className="tabular-nums">
                      {(st.earned + st.pending).toFixed(1)}
                    </span>
                    ٪. أنزل الهدف إلى ما يُدرك.
                  </p>
                ) : need <= 0 ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.primary }}>
                    بلغت الهدف فعلًا — الباقي تثبيت لا إنقاذ.
                  </p>
                ) : (
                  <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>
                    تحتاج متوسط{" "}
                    <span
                      dir="ltr"
                      className="text-[17px] font-extrabold tabular-nums"
                      style={{ color: need >= 90 ? T.danger : T.primary }}
                    >
                      {need.toFixed(1)}%
                    </span>{" "}
                    في البنود المتبقّية (
                    <span dir="ltr" className="tabular-nums">
                      {st.pending}
                    </span>
                    ٪ من الدرجة) لتصل إلى{" "}
                    <span dir="ltr" className="tabular-nums">
                      {c.target}
                    </span>
                    ٪.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- the published grade --- */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.accent }}>
            <Award size={13} /> التقدير النهائي
          </p>
          <p className="mb-2.5 text-[11px] leading-relaxed" style={{ color: T.faint }}>
            لا يُحسب في المعدّل حتى تختاره بنفسك — والمحاط بالأزرق هو ما
            يستحقّه المقرّر بحسب درجاتك الآن.
          </p>
          <GradePicker
            value={c.grade}
            onPick={(id) => patch({ grade: id })}
            scale={scale}
            suggest={suggest}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-c-notes">
            ملاحظات المقرّر
          </label>
          <Field
            id="los-c-notes"
            as="textarea"
            rows={3}
            value={c.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="ما يطلبه الدكتور، شكل الاختبار، ما يجب ألّا تنساه"
            className="resize-y leading-relaxed"
          />
        </div>
      </div>
    </Modal>
  );
}

export function CourseCard({ course, term, onOpen, onAbsence }) {
  const c = course;
  const st = courseStanding(c);
  const cap = absenceCapOf(c, term);
  const band = attendBand(c.absences, cap);
  const g = gradeOf(c.grade);
  const link = safeUrl(c.link);
  const absentToday = (c.absentOn || []).includes(dayKey());
  const days = c.slots
    .map((s) => uniDayOf(s.day))
    .filter(Boolean)
    .map((d) => d.short);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-[12px] font-extrabold"
          style={{
            borderColor: `${c.tint}45`,
            background: `${c.tint}18`,
            color: c.tint,
          }}
        >
          <span dir="ltr">{c.credits}</span>
        </span>
        <button onClick={onOpen} className="min-w-0 flex-1 text-right">
          <p className="truncate text-[14.5px] font-extrabold">{courseName(c)}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[10.5px]" style={{ color: T.faint }}>
            {c.code && <span dir="ltr">{c.code}</span>}
            {c.instructor && <span className="truncate">{c.instructor}</span>}
            {days.length > 0 && <span>{days.join(" · ")}</span>}
          </p>
        </button>
        {g && (
          <Badge tint={g.id === "F" ? T.danger : g.min >= 85 ? T.primary : T.accent}>
            <span dir="ltr">{g.id}</span>
          </Badge>
        )}
      </div>

      {/* The card stays a glance: a bar and two figures. Everything else is
          on the desk, one tap away. */}
      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-1 flex items-center justify-between text-[10.5px]" style={{ color: T.faint }}>
            <span>محصّل من ١٠٠</span>
            <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: c.tint }}>
              {st.earned.toFixed(1)} / {st.totalW || 100}
            </span>
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, st.earned)}%`,
                backgroundImage: `linear-gradient(90deg, ${c.tint}, ${c.tint}AA)`,
                boxShadow: `0 0 12px ${c.tint}99`,
              }}
            />
          </div>
        </div>

        {cap !== null && (
          <div>
            <p className="mb-1 flex items-center justify-between text-[10.5px]" style={{ color: T.faint }}>
              <span>الغياب</span>
              <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: band.tint }}>
                {c.absences} / {cap}
              </span>
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (c.absences / cap) * 100)}%`,
                  backgroundImage: `linear-gradient(90deg, ${band.tint}, ${band.tint}AA)`,
                  boxShadow: `0 0 12px ${band.tint}99`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Btn variant="outline" size="sm" onClick={onOpen} className="flex-1" style={{ borderColor: T.border }}>
          <SquarePen size={13} /> مكتب المقرّر
        </Btn>
        {link && (
          <Btn
            as="a"
            variant="ghost"
            size="sm"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderColor: T.border }}
            title="افتح صفحة المقرّر"
          >
            <ExternalLink size={13} /> الصفحة
          </Btn>
        )}
        {/* The label says which way the next tap goes — a button that
            silently flips between adding and removing is a button you stop
            trusting with a count that matters this much. */}
        <Btn
          variant="ghost"
          size="sm"
          onClick={onAbsence}
          style={{
            borderColor: absentToday ? `${T.danger}59` : T.border,
            color: absentToday ? T.danger : undefined,
          }}
          title={absentToday ? "تراجع عن غياب اليوم" : "سجّل غياب اليوم"}
        >
          {absentToday ? (
            <>
              <Minus size={13} strokeWidth={3} /> ألغِ غياب اليوم
            </>
          ) : (
            <>
              <Plus size={13} strokeWidth={3} /> غياب اليوم
            </>
          )}
        </Btn>
      </div>
    </Card>
  );
}

export function CourseModal({ open, draft, setDraft, terms, onClose, onSave }) {
  const d = draft || {};
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) setErr("");
  }, [open]);

  const save = () => {
    if (!String(d.name || "").trim() && !String(d.code || "").trim()) {
      setErr("اكتب اسم المقرّر أو رمزه.");
      return;
    }
    onSave();
  };
  const set = (p) => setDraft((s) => ({ ...s, ...p }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="مقرّر جديد"
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={save}>
            <Check size={15} strokeWidth={3} /> أضف
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-nc-name">
            اسم المقرّر
          </label>
          <Field
            id="los-nc-name"
            autoFocus
            value={d.name || ""}
            onChange={(e) => set({ name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="مثال: محاسبة إدارية"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-nc-code">
              الرمز
            </label>
            <Field
              id="los-nc-code"
              dir="ltr"
              value={d.code || ""}
              onChange={(e) => set({ code: e.target.value })}
              placeholder="ACC 201"
              style={{ textAlign: "left" }}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs text-white/45">الساعات</span>
            <NumStep
              value={d.credits ?? 3}
              onChange={(v) => set({ credits: v })}
              min={1}
              max={12}
              unit="ساعة"
              tint={d.tint || COURSE_TINTS[0]}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-nc-dr">
            المحاضر <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-nc-dr"
            value={d.instructor || ""}
            onChange={(e) => set({ instructor: e.target.value })}
            placeholder="اسم الدكتور"
          />
        </div>
        {terms.length > 1 && (
          <div>
            <span className="mb-2 block text-xs text-white/45">الفصل</span>
            <Field
              as="select"
              value={d.term || ""}
              onChange={(e) => set({ term: e.target.value })}
              style={{ borderColor: T.border, colorScheme: "dark" }}
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label || "فصل بلا اسم"}
                </option>
              ))}
            </Field>
          </div>
        )}
        <div>
          <span className="mb-2 block text-xs text-white/45">اللون</span>
          <div className="flex flex-wrap gap-2">
            {COURSE_TINTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set({ tint: t })}
                aria-label={`اللون ${t}`}
                aria-pressed={d.tint === t}
                className="h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110"
                style={{
                  background: t,
                  borderColor: d.tint === t ? T.fg : "transparent",
                  boxShadow: d.tint === t ? `0 0 14px ${t}` : "none",
                }}
              />
            ))}
          </div>
        </div>
        {err && (
          <p
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold"
            style={{ borderColor: `${T.danger}4D`, background: `${T.danger}14`, color: T.danger }}
            role="alert"
          >
            <AlertTriangle size={13} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}

export function TermModal({ open, draft, setDraft, onClose, onSave, onDelete }) {
  const d = draft || {};
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) setErr("");
  }, [open, d.id]);

  const save = () => {
    if (!String(d.label || "").trim()) {
      setErr("اكتب اسم الفصل.");
      return;
    }
    if (!isKey(d.start) || !isKey(d.end)) {
      setErr("تواريخ الفصل غير صالحة.");
      return;
    }
    if (d.end < d.start) {
      setErr("نهاية الفصل قبل بدايته.");
      return;
    }
    onSave();
  };
  const set = (p) => setDraft((s) => ({ ...s, ...p }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={d.isNew ? "فصل دراسي جديد" : "تعديل الفصل"}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={save}>
            <Check size={15} strokeWidth={3} /> حفظ
          </Btn>
          {!d.isNew && (
            <Btn variant="danger" onClick={onDelete} title="حذف الفصل">
              <Trash2 size={15} />
            </Btn>
          )}
          <Btn variant="outline" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-tm-label">
            اسم الفصل
          </label>
          <Field
            id="los-tm-label"
            autoFocus
            value={d.label || ""}
            onChange={(e) => set({ label: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="مثال: الفصل الأول ١٤٤٨"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-tm-start">
              البداية
            </label>
            <DateField id="los-tm-start" value={d.start} onChange={(v) => set({ start: v })} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-tm-end">
              النهاية
            </label>
            <DateField id="los-tm-end" value={d.end} min={d.start} onChange={(v) => set({ end: v })} />
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-xs text-white/45">عدد أسابيع الدراسة</span>
          <NumStep
            value={d.weeks ?? TERM_WEEKS_DEFAULT}
            onChange={(v) => set({ weeks: v })}
            min={1}
            max={40}
            unit="أسبوع"
            tint={T.sky}
          />
          <p className="mt-1.5 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            منه يُحسب عدد المحاضرات، ومنه حدّ الغياب (
            <span dir="ltr" className="tabular-nums">
              25
            </span>
            ٪).
          </p>
        </div>
        {err && (
          <p
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold"
            style={{ borderColor: `${T.danger}4D`, background: `${T.danger}14`, color: T.danger }}
            role="alert"
          >
            <AlertTriangle size={13} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}

export function UniTaskModal({ open, draft, setDraft, courses, onClose, onSave }) {
  const d = draft || {};
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) setErr("");
  }, [open, d.id]);

  const save = () => {
    if (!String(d.title || "").trim()) {
      setErr("اكتب عنوان التسليم.");
      return;
    }
    if (!isKey(d.due)) {
      setErr("تاريخ الاستحقاق غير صالح.");
      return;
    }
    onSave();
  };
  const set = (p) => setDraft((s) => ({ ...s, ...p }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={d.id && !d.isNew ? "تعديل التسليم" : "تسليم أو اختبار جديد"}
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={save}>
            <Check size={15} strokeWidth={3} /> حفظ
          </Btn>
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            إلغاء
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-title">
            العنوان
          </label>
          <Field
            id="los-ut-title"
            autoFocus
            value={d.title || ""}
            onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="مثال: تقرير الفصل الثالث"
          />
        </div>

        <div>
          <span className="mb-2 block text-xs text-white/45">النوع</span>
          <div className="grid grid-cols-2 gap-2">
            {UNI_TASK_KINDS.map((k) => {
              const on = d.kind === k.id;
              const Icon = k.icon;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => set({ kind: k.id })}
                  aria-pressed={on}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${k.tint}80` : T.border,
                    background: on ? `${k.tint}1F` : "rgba(255,255,255,0.03)",
                    color: on ? k.tint : T.muted,
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-course">
            المقرّر
          </label>
          <Field
            as="select"
            id="los-ut-course"
            value={d.course || ""}
            onChange={(e) => set({ course: e.target.value })}
            style={{ borderColor: T.border, colorScheme: "dark" }}
          >
            <option value="">بلا مقرّر</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {courseName(c)}
              </option>
            ))}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-due">
              الاستحقاق
            </label>
            <DateField id="los-ut-due" value={d.due} onChange={(v) => set({ due: v })} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-time">
              الوقت <span style={{ color: T.faint }}>(اختياري)</span>
            </label>
            <TimeField id="los-ut-time" value={d.time} onChange={(v) => set({ time: v })} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-place">
            المكان <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-ut-place"
            value={d.place || ""}
            onChange={(e) => set({ place: e.target.value })}
            placeholder="قاعة الاختبار، أو منصّة التسليم"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs text-white/45">وزنه من الدرجة</span>
          <NumStep
            value={d.weight ?? 0}
            onChange={(v) => set({ weight: v })}
            min={0}
            max={100}
            step={5}
            unit="٪"
            tint={T.accent}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-white/45" htmlFor="los-ut-notes">
            ملاحظة <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <Field
            id="los-ut-notes"
            as="textarea"
            rows={2}
            value={d.notes || ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="المطلوب بالضبط، وشروط الدكتور"
            className="resize-y leading-relaxed"
          />
        </div>

        {err && (
          <p
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold"
            style={{ borderColor: `${T.danger}4D`, background: `${T.danger}14`, color: T.danger }}
            role="alert"
          >
            <AlertTriangle size={13} /> {err}
          </p>
        )}
      </div>
    </Modal>
  );
}

export function UniTaskRow({ task, course, onToggle, onEdit, onDelete }) {
  const k = uniKindOf(task.kind);
  const Icon = k.icon;
  const left = daysUntil(task.due);
  const late = !task.done && left < 0;
  const soon = !task.done && left >= 0 && left <= 2;
  const [burst, fireBurst] = useBurst(700);

  const handle = () => {
    if (!task.done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`group flex items-start gap-2 rounded-xl border p-2.5 transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst
          ? T.primary
          : late
            ? `${T.danger}4D`
            : soon
              ? `${T.cta}40`
              : "rgba(255,255,255,0.08)",
        backgroundColor: burst
          ? `${T.primary}26`
          : task.done
            ? `${T.primary}0F`
            : late
              ? `${T.danger}0F`
              : "rgba(255,255,255,0.03)",
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: task.done ? `${T.primary}59` : `${k.tint}45`,
          background: task.done ? `${T.primary}1A` : `${k.tint}18`,
          color: task.done ? T.primary : k.tint,
        }}
      >
        <Icon size={15} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <Checkbox
            checked={task.done}
            onToggle={handle}
            label={task.title || k.label}
            tint={T.primary}
            size="sm"
          />
          <button
            onClick={onEdit}
            aria-label={`تعديل ${task.title || k.label}`}
            className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            aria-label={`حذف ${task.title || k.label}`}
            className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pr-1.5 text-[10.5px]">
          <span style={{ color: k.tint }}>{k.label}</span>
          {course && (
            <span className="inline-flex min-w-0 items-center gap-1" style={{ color: course.tint }}>
              <BookMarked size={10} className="shrink-0" />
              <span className="truncate">{courseName(course)}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1" style={{ color: T.faint }}>
            <CalendarDays size={10} />
            {arDate(task.due)}
          </span>
          {task.time && (
            <span className="inline-flex items-center gap-1" style={{ color: T.muted }}>
              <Clock size={10} />
              <span dir="ltr" className="tabular-nums">
                {prettyTime(task.time)}
              </span>
            </span>
          )}
          {task.place && (
            <span className="inline-flex min-w-0 items-center gap-1" style={{ color: T.faint }}>
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{task.place}</span>
            </span>
          )}
          {task.weight > 0 && (
            <span className="inline-flex items-center gap-1" style={{ color: T.accent }}>
              <Percent size={10} />
              <span dir="ltr" className="tabular-nums">
                {task.weight}
              </span>
            </span>
          )}
          {!task.done && (
            <span
              className="font-bold"
              style={{ color: late ? T.danger : soon ? T.cta : T.faint }}
            >
              {whenWord(task.due)}
            </span>
          )}
        </div>
        {task.notes && (
          <p className="mt-1.5 whitespace-pre-wrap pr-1.5 text-[11px] leading-relaxed" style={{ color: T.muted }}>
            {task.notes}
          </p>
        )}
      </div>
    </div>
  );
}

/* The week, drawn. A six-column grid is unreadable at 375px, so the phone
   gets the same data as a day at a time and the grid appears from `lg` up —
   the arrows are not a fallback, they are the only thing that works under
   a finger. */
export function WeekGrid({ courses, mins, dow }) {
  const hours = useMemo(() => {
    const out = [];
    for (let h = Math.floor(DAY_FROM / 60); h <= Math.floor(DAY_TO / 60); h += 2) out.push(h);
    return out;
  }, []);

  const nowLine =
    mins >= DAY_FROM && mins <= DAY_TO
      ? ((mins - DAY_FROM) / (DAY_TO - DAY_FROM)) * 100
      : null;

  return (
    <div className="hidden lg:block">
      <div className="flex gap-2">
        <div className="relative w-12 shrink-0" style={{ height: 560 }}>
          {hours.map((h) => {
            const { top } = spanPct(h * 60, h * 60 + 10);
            return (
              <span
                key={h}
                dir="ltr"
                className="absolute left-0 -translate-y-1/2 text-[10px] tabular-nums"
                style={{ top: `${top}%`, color: T.faint }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            );
          })}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-6 gap-2">
          {UNI_DAYS.map((d) => {
            const rows = daySections(courses, d.d, mins);
            const isToday = d.d === dow;
            return (
              <div key={d.d} className="min-w-0">
                <p
                  className="mb-1.5 truncate text-center text-[11px] font-extrabold"
                  style={{ color: isToday ? T.cta : T.muted }}
                >
                  {d.label}
                </p>
                <div
                  className="relative rounded-xl border"
                  style={{
                    height: 560,
                    borderColor: isToday ? `${T.cta}59` : "rgba(255,255,255,0.08)",
                    backgroundColor: isToday ? `${T.cta}0A` : "rgba(255,255,255,0.025)",
                  }}
                >
                  {hours.map((h) => {
                    const { top } = spanPct(h * 60, h * 60 + 10);
                    return (
                      <span
                        key={h}
                        className="absolute inset-x-0 border-t"
                        style={{ top: `${top}%`, borderColor: "rgba(255,255,255,0.05)" }}
                      />
                    );
                  })}

                  {isToday && nowLine !== null && (
                    <span
                      className="absolute inset-x-0 z-10 border-t-2"
                      style={{
                        top: `${nowLine}%`,
                        borderColor: T.cta,
                        boxShadow: `0 0 10px ${T.cta}`,
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {rows.map((r) => {
                    const { top, height } = spanPct(r.from, r.to);
                    return (
                      <span
                        key={`${r.course.id}:${r.slot.id}`}
                        className="absolute inset-x-1 overflow-hidden rounded-lg border p-1.5"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          borderColor: r.now ? r.course.tint : `${r.course.tint}59`,
                          background: `${r.course.tint}26`,
                          boxShadow: r.now ? `0 0 16px -4px ${r.course.tint}` : "none",
                        }}
                        title={`${courseName(r.course)} — ${r.slot.from} إلى ${r.slot.to}`}
                      >
                        <span
                          className="block truncate text-[10px] font-extrabold leading-tight"
                          style={{ color: r.course.tint }}
                        >
                          {courseName(r.course)}
                        </span>
                        <span dir="ltr" className="block truncate text-[9px] tabular-nums" style={{ color: T.muted }}>
                          {r.slot.from}–{r.slot.to}
                        </span>
                        {r.slot.room && (
                          <span className="block truncate text-[9px]" style={{ color: T.faint }}>
                            {r.slot.room}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function UniModule({ state, setState, onGo }) {
  const uni = state.uni || uniShape();
  const mins = useMinuteClock();
  const dow = new Date().getDay();

  const [view, setView] = useState("week");
  const [deskId, setDeskId] = useState(null);
  const [newCourse, setNewCourse] = useState(null);
  const [termDraft, setTermDraft] = useState(null);
  const [taskDraft, setTaskDraft] = useState(null);
  /* `null` means "follow today". Pinning the weekday at mount looked right
     until the screen was left open overnight and the phone kept opening on
     yesterday; resolving it at render costs nothing and cannot drift. A
     weekday the user picks himself is his until he leaves the screen. */
  const [pickDay, setPickDay] = useState(null);
  const day = pickDay ?? (uniDayOf(dow) ? dow : UNI_DAYS[0].d);

  const term = termOf(uni, uni.term);
  const courses = useMemo(() => coursesIn(uni, uni.term), [uni]);
  const desk = deskId ? courseIn(uni, deskId) : null;

  const patchUni = useCallback(
    (fn) =>
      setState((s) => {
        const prev = s.uni || uniShape();
        return { ...s, uni: { ...prev, ...fn(prev) } };
      }),
    [setState],
  );

  /* `fn` receives the course as it stands in state, not as it stood when
     the button was drawn.
   *
   *  `{ ...c, absences: c.absences + 1 }` reads `c` out of the render that
   *  drew the button, so two taps inside one frame both compute 1 and the
   *  second absence is silently swallowed — the counter is then wrong for
   *  the rest of the term with nothing on screen to suggest it. Every write
   *  goes through a function so the arithmetic is always done against the
   *  value that is actually stored. */
  const patchCourse = useCallback(
    (id, fn) =>
      patchUni((u) => ({
        courses: u.courses.map((c) => (c.id === id ? courseShape(fn(c)) : c)),
      })),
    [patchUni],
  );

  const dropCourse = (c) => {
    if (!window.confirm(`حذف «${courseName(c)}» بكل درجاته وملاحظاته؟`)) return;
    patchUni((u) => ({
      courses: u.courses.filter((x) => x.id !== c.id),
      /* A deliverable pointing at a deleted course would render under a
         blank name forever, so the link is cut rather than left dangling —
         the deliverable itself is the user's and stays. */
      tasks: u.tasks.map((t) => (t.course === c.id ? { ...t, course: "" } : t)),
    }));
    setDeskId(null);
  };

  /* One tap, one absence, once per day. The quick button is pressed in a
     corridor on the way out of a lecture, and a second tap — a fat finger,
     a re-render, coming back to the screen later the same day — used to add
     a second absence that nothing on screen contradicted. The day is
     recorded, so the second tap is recognised and refused with a reason
     rather than quietly counted. Removing it is the same button again. */
  const [absenceNote, setAbsenceNote] = useState(null); // {id, text, undo}
  const noteTimer = useRef(null);
  const flash = useCallback((msg) => {
    clearTimeout(noteTimer.current);
    setAbsenceNote(msg);
    noteTimer.current = setTimeout(() => setAbsenceNote(null), 4000);
  }, []);
  useEffect(() => () => clearTimeout(noteTimer.current), []);

  /* One button, both directions, and the direction is written on it. The
     test for "already recorded" happens inside the updater, against the
     stored row rather than the drawn one, so the day can never be counted
     twice however fast the button is pressed.

     A second press inside half a second is a slipped finger, not a change
     of mind: without this it toggles straight back off, so the tap the user
     meant to register leaves nothing behind and the confirmation underneath
     announces the opposite of what happened. A deliberate undo comes after
     reading that line, which takes far longer. */
  const lastAbsence = useRef({ id: null, at: 0 });
  const toggleTodayAbsence = (c) => {
    const now = Date.now();
    if (lastAbsence.current.id === c.id && now - lastAbsence.current.at < 500) return;
    lastAbsence.current = { id: c.id, at: now };

    const today = dayKey();
    const marked = (c.absentOn || []).includes(today);
    patchCourse(c.id, (prev) => {
      const was = (prev.absentOn || []).includes(today);
      return was
        ? {
            ...prev,
            absences: clampNum(prev.absences - 1, 0, 200, 0),
            absentOn: prev.absentOn.filter((d) => d !== today),
          }
        : {
            ...prev,
            absences: clampNum(prev.absences + 1, 0, 200, 0),
            absentOn: [...(prev.absentOn || []), today],
          };
    });
    flash({
      id: c.id,
      text: marked
        ? `أُلغي غياب اليوم في «${courseName(c)}».`
        : `سُجّل غياب اليوم في «${courseName(c)}».`,
    });
  };

  const saveCourse = () => {
    const c = courseShape({ ...newCourse, term: newCourse.term || uni.term });
    c.name = String(newCourse.name || "").trim();
    c.code = String(newCourse.code || "").trim();
    patchUni((u) => ({ courses: [...u.courses, c] }));
    setNewCourse(null);
    setDeskId(c.id);
  };

  const saveTerm = () => {
    const t = termShape(termDraft);
    t.label = String(termDraft.label || "").trim();
    patchUni((u) => ({
      terms: termDraft.isNew
        ? [...u.terms, t]
        : u.terms.map((x) => (x.id === t.id ? t : x)),
      term: termDraft.isNew ? t.id : u.term,
    }));
    setTermDraft(null);
  };

  const dropTerm = () => {
    const t = termDraft;
    const n = coursesIn(uni, t.id).length;
    if (
      !window.confirm(
        n
          ? `حذف «${t.label}» و${n} ${courseWord(n)} فيه؟`
          : `حذف «${t.label}»؟`,
      )
    )
      return;
    patchUni((u) => {
      const terms = u.terms.filter((x) => x.id !== t.id);
      const courses = u.courses.filter((c) => c.term !== t.id);
      const ids = new Set(courses.map((c) => c.id));
      return {
        terms,
        courses,
        /* Same reason as deleting one course: the deliverable survives, the
           dead link does not. */
        tasks: u.tasks.map((x) => (x.course && !ids.has(x.course) ? { ...x, course: "" } : x)),
        term: terms.length ? terms[0].id : "",
      };
    });
    setTermDraft(null);
  };

  const saveTask = () => {
    const t = uniTaskShape(taskDraft);
    t.title = String(taskDraft.title || "").trim();
    patchUni((u) => ({
      tasks: u.tasks.some((x) => x.id === t.id)
        ? u.tasks.map((x) => (x.id === t.id ? t : x))
        : [...u.tasks, t],
    }));
    setTaskDraft(null);
  };

  const toggleTask = (id) =>
    patchUni((u) => ({
      tasks: u.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));

  const dropTask = (t) => {
    if (!window.confirm(`حذف «${t.title}»؟`)) return;
    patchUni((u) => ({ tasks: u.tasks.filter((x) => x.id !== t.id) }));
  };

  const setScale = (n) =>
    patchUni(() => ({ scale: Number(n) === 4 ? 4 : 5 }));

  /* --- the figures ---------------------------------------------------- */
  const termGpa = useMemo(() => gpaOf(courses, uni.scale), [courses, uni.scale]);
  const allGraded = useMemo(() => gpaOf(uni.courses, uni.scale), [uni.courses, uni.scale]);
  /* The prior figure is only usable on the scale it was typed on. Rather
     than fold a four-point average into a five-point cumulative, the screen
     says it cannot and asks for the number again. */
  const priorUsable = uni.priorCredits === 0 || uni.priorScale === uni.scale;
  const cumulative = useMemo(() => {
    if (!priorUsable) return null;
    const credits = allGraded.credits + uni.priorCredits;
    if (!credits) return 0;
    return (allGraded.points + uni.priorGpa * uni.priorCredits) / credits;
  }, [allGraded, uni.priorGpa, uni.priorCredits, priorUsable]);
  /* The term's whole registered load. Declared up here because the
     graduation projection below reads it — a `const` used above its own
     declaration is a temporal-dead-zone throw, which takes the module
     down to a blank screen rather than warning about anything. */
  const loadHours = courses.reduce((n, c) => n + c.credits, 0);
  const cumCredits = allGraded.credits + uni.priorCredits;

  /* Everything already banked, as one pair: the published terms plus the
     figure off his transcript. This is the floor the target calculator
     builds on, so it is computed once and read by all of them. */
  const banked = useMemo(
    () => ({
      points: allGraded.points + uni.priorGpa * uni.priorCredits,
      credits: cumCredits,
    }),
    [allGraded.points, uni.priorGpa, uni.priorCredits, cumCredits],
  );
  /* The hours he is registered in right now — the only ones this term's
     average can be earned with. Ungraded on purpose: a course already
     graded is in `banked`, and counting it twice would ask him to re-earn
     marks he has. */
  const termHours = useMemo(
    () => courses.filter((c) => !gradeOf(c.grade)).reduce((n, c) => n + c.credits, 0),
    [courses],
  );
  const needThisTerm =
    uni.targetGpa > 0 && priorUsable
      ? gpaNeeded(uni.targetGpa, banked, termHours)
      : null;
  /* Where the cumulative lands if every registered hour comes out perfect. */
  const bestPossible =
    banked.credits + termHours > 0
      ? (banked.points + uni.scale * termHours) / (banked.credits + termHours)
      : 0;
  /* Projected on the term's whole registered load, not on `termHours`.
     `termHours` deliberately drops a course once its grade is published,
     which is right for "what do I still have to earn" and wrong here: as
     the term gets marked, the hours-per-term figure would shrink and the
     number of terms to graduation would climb every time a grade arrived. */
  const termsLeft =
    uni.gradCredits > 0 && loadHours > 0
      ? Math.max(0, Math.ceil((uni.gradCredits - cumCredits) / loadHours))
      : null;

  /* Each term with its own average, so «هل أنا أتحسّن؟» has an answer. */
  const termRecord = useMemo(
    () =>
      (uni.terms || []).map((t) => {
        const list = coursesIn(uni, t.id);
        return { t, n: list.length, ...gpaOf(list, uni.scale) };
      }),
    [uni, uni.scale],
  );

  /* Which week of the term today is, or null outside it. Counted from the
     term's own start date rather than from the calendar, and capped at the
     declared length so a term that runs past its end date does not report
     «الأسبوع ١٨ من ١٥». */
  const termWeek = useMemo(() => {
    if (!term) return null;
    const today = dayKey();
    if (today < term.start || today > term.end) return null;
    const n = Math.floor((daysUntil(today, term.start) || 0) / 7) + 1;
    return Math.min(term.weeks, Math.max(1, n));
  }, [term]);
  const todayRows = useMemo(
    () => daySections(courses, dow, mins),
    [courses, dow, mins],
  );
  /* The weekday the phone is showing — today unless the user swiped to
     another one. Only the real today gets a live "now" reading. */
  const dayRows = useMemo(
    () => daySections(courses, day, day === dow ? mins : -1),
    [courses, day, dow, mins],
  );
  const next = useMemo(
    () => nextSection(courses, dow, mins),
    [courses, dow, mins],
  );

  const openTasks = useMemo(
    () =>
      (uni.tasks || [])
        .filter((t) => !t.done)
        .sort((a, b) => (a.due === b.due ? 0 : a.due < b.due ? -1 : 1)),
    [uni.tasks],
  );
  const doneTasks = useMemo(
    () => (uni.tasks || []).filter((t) => t.done).sort((a, b) => (a.due < b.due ? 1 : -1)),
    [uni.tasks],
  );
  const lateTasks = openTasks.filter((t) => t.due < dayKey()).length;
  const week1 = openTasks.filter((t) => {
    const n = daysUntil(t.due);
    return n >= 0 && n <= 7;
  }).length;

  /* The one number that matters more than the GPA: who is close to being
     barred from a final. Surfaced at the top rather than buried in a desk. */
  const atRisk = useMemo(
    () =>
      courses
        .map((c) => {
          const cap = absenceCapOf(c, term);
          return cap ? { c, cap, band: attendBand(c.absences, cap) } : null;
        })
        .filter((r) => r && r.band.min >= 0.75),
    [courses, term],
  );

  const stats = [
    {
      k: "الساعات المسجّلة",
      v: loadHours,
      c: T.sky,
      icon: Hash,
      sub: `${courses.length} ${courseWord(courses.length)}`,
    },
    {
      k: "معدّل الفصل",
      v: termGpa.credits ? termGpa.gpa.toFixed(2) : "—",
      c: termGpa.credits ? gpaBand(termGpa.gpa, uni.scale).tint : T.faint,
      icon: Calculator,
      /* «من ٥» alone hides the thing worth knowing: how much of the term
         that average actually covers. An average over four of eighteen
         hours is not the term's average yet, and should not be read as one. */
      sub: termGpa.credits
        ? `من ${uni.scale} · ${termGpa.credits} ${hourWord(termGpa.credits)} من ${loadHours}`
        : "بعد رصد التقديرات",
    },
    { k: "تسليمات قادمة", v: week1, c: T.cta, icon: ClipboardList, sub: "خلال أسبوع" },
    {
      k: "متأخّر",
      v: lateTasks,
      c: lateTasks ? T.danger : T.faint,
      icon: AlertTriangle,
      sub: lateTasks ? "سلّمه أو ألغه" : "لا شيء متأخّر",
    },
  ];

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            الجامعة
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            الجدول والدرجات والغياب والمعدّل في شاشة واحدة — لأن كل رقم منها
            يجيب عن سؤال الآخر.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(uni.terms || []).map((t) => {
              const on = t.id === uni.term;
              const live = t.start <= dayKey() && dayKey() <= t.end;
              return (
                <button
                  key={t.id}
                  onClick={() => patchUni(() => ({ term: t.id }))}
                  onDoubleClick={() => setTermDraft({ ...t })}
                  aria-pressed={on}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition-all"
                  style={{
                    borderColor: on ? `${T.cta}80` : T.border,
                    background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                    color: on ? T.cta : T.muted,
                  }}
                >
                  {t.label || "فصل بلا اسم"}
                  {live && (
                    <span
                      aria-label="الفصل الحالي"
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: T.primary, boxShadow: `0 0 8px ${T.primary}` }}
                    />
                  )}
                </button>
              );
            })}
            {term && (
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => setTermDraft({ ...term })}
                style={{ borderColor: T.border }}
                title="تعديل الفصل الحالي"
              >
                <Pencil size={12} />
              </Btn>
            )}
            <Btn
              variant="outline"
              size="sm"
              onClick={() =>
                setTermDraft({
                  ...termShape({ label: "", start: dayKey() }),
                  isNew: true,
                })
              }
              style={{ borderColor: T.border }}
            >
              <Plus size={13} strokeWidth={3} /> فصل
            </Btn>
          </div>
          {term && (
            <div className="mt-2.5">
              <p className="text-[10.5px]" style={{ color: T.faint }}>
                {arDate(term.start)} — {arDate(term.end)} ·{" "}
                <span dir="ltr" className="tabular-nums">
                  {term.weeks}
                </span>{" "}
                {weekWord(term.weeks)}
                {/* Which week of the term it is, because «الأسبوع العاشر من
                    ١٥» is the sentence that decides whether there is still
                    room to fix a mark — the two dates alone are not. */}
                {termWeek !== null && (
                  <>
                    {" · الأسبوع "}
                    <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.accent }}>
                      {termWeek}
                    </span>
                  </>
                )}
              </p>
              {termWeek !== null && (
                <div
                  className="mt-1.5 h-1 w-full max-w-[280px] overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (termWeek / term.weeks) * 100)}%`,
                      backgroundImage: `linear-gradient(90deg, ${T.cta}, ${T.ctaLift})`,
                      boxShadow: `0 0 10px ${T.cta}99`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid shrink-0 grid-cols-4 gap-2">
          {UNI_VIEWS.map((v) => {
            const on = v.id === view;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={on}
                className="flex flex-col items-center gap-1 rounded-xl border px-2.5 py-2.5 text-[10.5px] font-bold transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                  color: on ? T.cta : T.muted,
                }}
              >
                <Icon size={15} strokeWidth={2} />
                {v.label}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile
            key={s.k}
            icon={s.icon}
            label={s.k}
            value={s.v}
            sub={s.sub}
            tint={s.c}
          />
        ))}
      </div>

      {/* An absence is recorded by one tap and changes a number that can
          end a course. It has to say out loud what it just did — a silent
          counter is one nobody checks until it is too late. */}
      {absenceNote && (
        <Card
          className="los-in flex items-center gap-2.5 p-3.5"
          style={{ borderColor: `${T.accent}59` }}
          role="status"
        >
          <ShieldCheck size={15} className="shrink-0" style={{ color: T.accent }} />
          <p className="text-[12px] font-bold" style={{ color: T.accent }}>
            {absenceNote.text}
          </p>
        </Card>
      )}

      {atRisk.length > 0 && (
        <Card className="p-5 sm:p-6" style={{ borderColor: `${T.danger}40` }}>
          <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.danger }}>
            <AlertTriangle size={15} /> الغياب يقترب من الحدّ
          </p>
          <div className="mt-3 space-y-2">
            {atRisk.map(({ c, cap, band }) => (
              <button
                key={c.id}
                onClick={() => setDeskId(c.id)}
                className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition-colors hover:bg-white/[0.06]"
                style={{ borderColor: `${band.tint}40`, backgroundColor: `${band.tint}0F` }}
              >
                <BookMarked size={15} className="shrink-0" style={{ color: c.tint }} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                  {courseName(c)}
                </span>
                <span dir="ltr" className="shrink-0 text-[11.5px] font-extrabold tabular-nums" style={{ color: band.tint }}>
                  {c.absences} / {cap}
                </span>
                <Badge tint={band.tint}>{band.label}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ---------------- الجدول ---------------- */}
      {view === "week" && (
        <>
          {next && (
            <Card className="p-5 sm:p-6" style={{ borderColor: `${next.course.tint}40` }}>
              <p className="flex items-center gap-2 text-[11px] font-bold" style={{ color: T.faint }}>
                <AlarmClock size={13} style={{ color: next.course.tint }} />
                {/* At seven days out the weekday name is today's own, so
                    «أوّل محاضرة الجمعة» would read as a lecture a few hours
                    away when it is a full week off. */}
                {next.now
                  ? "أنت الآن في"
                  : next.inDays === 0
                    ? "القادمة اليوم"
                    : next.inDays === 1
                      ? "أوّل محاضرة غدًا"
                      : next.inDays >= 7
                        ? "أوّل محاضرة الأسبوع القادم"
                        : `أوّل محاضرة ${DOW_AR[(dow + next.inDays) % 7]}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-extrabold" style={{ color: next.course.tint }}>
                    {courseName(next.course)}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11.5px]" style={{ color: T.muted }}>
                    <span dir="ltr" className="tabular-nums">
                      {prettyTime(next.slot.from)} – {prettyTime(next.slot.to)}
                    </span>
                    {next.slot.room && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {next.slot.room}
                      </span>
                    )}
                    {next.course.instructor && (
                      <span className="inline-flex items-center gap-1">
                        <Users size={11} /> {next.course.instructor}
                      </span>
                    )}
                  </p>
                </div>
                {next.inDays === 0 && !next.now && (
                  <Badge tint={T.cta}>
                    <Clock size={11} /> بعد{" "}
                    <span dir="ltr" className="tabular-nums">
                      {Math.max(1, next.from - mins)}
                    </span>{" "}
                    {minWord(Math.max(1, next.from - mins))}
                  </Badge>
                )}
                {next.now && (
                  <Badge tint={T.primary}>
                    <CircleDot size={11} /> جارية الآن
                  </Badge>
                )}
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                <CalendarDays size={15} /> الجدول الأسبوعي
              </p>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setView("courses")}
                style={{ borderColor: T.border }}
              >
                <SquarePen size={13} /> عدّل المواعيد
              </Btn>
            </div>

            {courses.length === 0 ? (
              <div className="py-10 text-center">
                <School size={28} className="mx-auto" style={{ color: T.faint }} />
                <p className="mt-3 text-[12.5px] leading-relaxed text-white/35">
                  لا مقرّرات في هذا الفصل بعد.
                </p>
                <Btn
                  variant="default"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    setNewCourse(courseShape({ term: uni.term, tint: COURSE_TINTS[0] }))
                  }
                  disabled={!uni.term}
                >
                  <Plus size={14} strokeWidth={3} /> أضف أول مقرّر
                </Btn>
              </div>
            ) : (
              <>
                <WeekGrid courses={courses} mins={mins} dow={dow} />

                {/* phone: a day at a time */}
                <div className="lg:hidden">
                  <div className="mb-3 grid grid-cols-6 gap-1.5">
                    {UNI_DAYS.map((d) => {
                      const on = d.d === day;
                      const isToday = d.d === dow;
                      const n = daySections(courses, d.d, -1).length;
                      return (
                        <button
                          key={d.d}
                          onClick={() => setPickDay(d.d)}
                          aria-pressed={on}
                          className="rounded-xl border px-1 py-2 text-center transition-all"
                          style={{
                            borderColor: on ? `${T.cta}80` : isToday ? `${T.cta}40` : T.border,
                            background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                            color: on ? T.cta : T.muted,
                          }}
                        >
                          <span className="block text-[12px] font-extrabold">{d.short}</span>
                          <span dir="ltr" className="block text-[9px] tabular-nums opacity-70">
                            {n}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    {/* Built once. Calling `daySections` for the emptiness
                        test and again for the rows walks every slot twice
                        on every tick of the clock. */}
                    {dayRows.length === 0 ? (
                      <p className="py-6 text-center text-[12px] text-white/30">
                        لا محاضرات في {uniDayOf(day)?.label}.
                      </p>
                    ) : (
                      dayRows.map((r) => (
                        <div
                          key={`${r.course.id}:${r.slot.id}`}
                          className="flex items-center gap-3 rounded-xl border p-3"
                          style={{
                            borderColor: r.now ? r.course.tint : `${r.course.tint}40`,
                            backgroundColor: `${r.course.tint}12`,
                          }}
                        >
                          <span
                            dir="ltr"
                            className="shrink-0 text-center text-[10.5px] font-extrabold tabular-nums leading-tight"
                            style={{ color: r.course.tint }}
                          >
                            {r.slot.from}
                            <br />
                            {r.slot.to}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-extrabold">
                              {courseName(r.course)}
                            </span>
                            <span className="mt-0.5 flex flex-wrap gap-x-2.5 text-[10.5px]" style={{ color: T.faint }}>
                              {r.slot.room && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={10} /> {r.slot.room}
                                </span>
                              )}
                              {r.course.instructor && <span className="truncate">{r.course.instructor}</span>}
                            </span>
                          </span>
                          {r.now && <Badge tint={T.primary}>الآن</Badge>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </Card>

          {todayRows.length > 0 && (
            <Card className="p-5 sm:p-6">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                <ClipboardCheck size={15} /> محاضرات اليوم
              </p>
              <p className="mt-1 text-[11px] leading-relaxed" style={{ color: T.faint }}>
                سجّل الغياب في يومه — غياب يُسجَّل بعد أسبوع هو غياب لا يُسجَّل.
              </p>
              <div className="mt-3 space-y-2">
                {todayRows.map((r) => {
                  const cap = absenceCapOf(r.course, term);
                  const band = attendBand(r.course.absences, cap);
                  return (
                    <div
                      key={`${r.course.id}:${r.slot.id}`}
                      className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                      style={{
                        borderColor: r.now ? r.course.tint : "rgba(255,255,255,0.08)",
                        backgroundColor: r.now ? `${r.course.tint}14` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span dir="ltr" className="shrink-0 text-[11px] font-extrabold tabular-nums" style={{ color: r.course.tint }}>
                        {r.slot.from}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                        {courseName(r.course)}
                      </span>
                      {cap !== null && (
                        <span dir="ltr" className="shrink-0 text-[10.5px] tabular-nums" style={{ color: band.tint }}>
                          {r.course.absences}/{cap}
                        </span>
                      )}
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTodayAbsence(r.course)}
                        style={{ borderColor: T.border }}
                      >
                        <Plus size={12} strokeWidth={3} /> غياب
                      </Btn>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ---------------- المقررات ---------------- */}
      {view === "courses" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px]" style={{ color: T.faint }}>
              {courses.length === 0
                ? "ابدأ بمقرّر واحد، وأكمل الباقي من مكتبه."
                : "اضغط المقرّر لتفتح مكتبه: المواعيد، الدرجات، الغياب، والتقدير."}
            </p>
            <Btn
              variant="default"
              size="sm"
              onClick={() =>
                setNewCourse(
                  courseShape({
                    term: uni.term,
                    tint: COURSE_TINTS[courses.length % COURSE_TINTS.length],
                  }),
                )
              }
              disabled={!uni.term}
            >
              <Plus size={14} strokeWidth={3} /> مقرّر جديد
            </Btn>
          </div>

          {!uni.term ? (
            <Card className="p-8 text-center">
              <School size={28} className="mx-auto" style={{ color: T.faint }} />
              <p className="mt-3 text-[12.5px] leading-relaxed text-white/35">
                أضف فصلًا دراسيًا أولًا — المقرّرات تعيش داخل فصل.
              </p>
            </Card>
          ) : courses.length === 0 ? (
            <Card className="p-8 text-center">
              <BookMarked size={28} className="mx-auto" style={{ color: T.faint }} />
              <p className="mt-3 text-[12.5px] leading-relaxed text-white/35">
                لا مقرّرات في «{term?.label || "هذا الفصل"}» بعد.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  term={term}
                  onOpen={() => setDeskId(c.id)}
                  onAbsence={() => toggleTodayAbsence(c)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- التسليمات ---------------- */}
      {view === "tasks" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px]" style={{ color: T.faint }}>
              كل تسليم هنا يظهر تلقائيًا في التقويم — تاريخ واحد في مكان واحد.
            </p>
            <div className="flex gap-2">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => onGo("agenda")}
                style={{ borderColor: T.border }}
              >
                <CalendarDays size={13} /> في التقويم
              </Btn>
              <Btn
                variant="default"
                size="sm"
                onClick={() =>
                  setTaskDraft({
                    ...uniTaskShape({ due: dayKey(), kind: "assign" }),
                    isNew: true,
                  })
                }
              >
                <Plus size={14} strokeWidth={3} /> تسليم جديد
              </Btn>
            </div>
          </div>

          <Card className="p-5 sm:p-7">
            <p className="text-[13px] font-extrabold" style={{ color: T.accent }}>
              المطلوب
            </p>
            {openTasks.length === 0 ? (
              <div className="py-10 text-center">
                <ClipboardCheck size={28} className="mx-auto" style={{ color: T.primary }} />
                <p className="mt-3 text-[12.5px] text-white/35">
                  لا شيء مستحقّ. أضف ما تعرف أنه قادم قبل أن يفاجئك.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {openTasks.map((t) => (
                  <UniTaskRow
                    key={t.id}
                    task={t}
                    course={courseIn(uni, t.course)}
                    onToggle={() => toggleTask(t.id)}
                    onEdit={() => setTaskDraft({ ...t })}
                    onDelete={() => dropTask(t)}
                  />
                ))}
              </div>
            )}
          </Card>

          {doneTasks.length > 0 && (
            <Card className="p-5 sm:p-7">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.primary }}>
                <CheckCheck size={15} /> مُنجز
                <span dir="ltr" className="tabular-nums opacity-60">
                  ({doneTasks.length})
                </span>
              </p>
              <div className="mt-4 space-y-2">
                {doneTasks.slice(0, 20).map((t) => (
                  <UniTaskRow
                    key={t.id}
                    task={t}
                    course={courseIn(uni, t.course)}
                    onToggle={() => toggleTask(t.id)}
                    onEdit={() => setTaskDraft({ ...t })}
                    onDelete={() => dropTask(t)}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ---------------- المعدّل ---------------- */}
      {view === "gpa" && (
        <>
          <Card className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                  <Calculator size={15} /> حاسب المعدّل
                </p>
                <p className="mt-1.5 max-w-lg text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
                  لا يُحسب مقرّر إلا بعد أن ترصد تقديره — المقرّر بلا تقدير
                  ليس صفرًا، وحسابه صفرًا يكذب عليك.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {[5, 4].map((n) => {
                  const on = uni.scale === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setScale(n)}
                      aria-pressed={on}
                      className="rounded-xl border px-4 py-2 text-[12px] font-extrabold transition-all"
                      style={{
                        borderColor: on ? `${T.cta}80` : T.border,
                        background: on ? `${T.cta}1F` : "rgba(255,255,255,0.03)",
                        color: on ? T.cta : T.muted,
                      }}
                    >
                      من <span dir="ltr">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div
                className="rounded-2xl border p-5 text-center"
                style={{
                  borderColor: `${termGpa.credits ? gpaBand(termGpa.gpa, uni.scale).tint : T.border}40`,
                  background: `${termGpa.credits ? gpaBand(termGpa.gpa, uni.scale).tint : "#ffffff"}0F`,
                }}
              >
                <p className="text-[10.5px]" style={{ color: T.faint }}>
                  معدّل الفصل
                </p>
                <p
                  dir="ltr"
                  className="mt-1 text-[32px] font-extrabold leading-none tabular-nums"
                  style={{
                    color: termGpa.credits ? gpaBand(termGpa.gpa, uni.scale).tint : T.faint,
                  }}
                >
                  {termGpa.credits ? termGpa.gpa.toFixed(2) : "—"}
                </p>
                <p className="mt-1.5 text-[10.5px]" style={{ color: T.muted }}>
                  {termGpa.credits ? (
                    <>
                      {gpaBand(termGpa.gpa, uni.scale).label} ·{" "}
                      <span dir="ltr" className="tabular-nums">
                        {termGpa.credits}
                      </span>{" "}
                      {hourWord(termGpa.credits)} محسوبة
                    </>
                  ) : (
                    "لا تقديرات مرصودة"
                  )}
                </p>
              </div>

              <div
                className="rounded-2xl border p-5 text-center"
                style={{
                  borderColor: `${
                    cumulative !== null && cumCredits
                      ? gpaBand(cumulative, uni.scale).tint
                      : T.border
                  }40`,
                  background: `${
                    cumulative !== null && cumCredits
                      ? gpaBand(cumulative, uni.scale).tint
                      : "#ffffff"
                  }0F`,
                }}
              >
                <p className="text-[10.5px]" style={{ color: T.faint }}>
                  المعدّل التراكمي
                </p>
                <p
                  dir="ltr"
                  className="mt-1 text-[32px] font-extrabold leading-none tabular-nums"
                  style={{
                    color:
                      cumulative !== null && cumCredits
                        ? gpaBand(cumulative, uni.scale).tint
                        : T.faint,
                  }}
                >
                  {cumulative !== null && cumCredits ? cumulative.toFixed(2) : "—"}
                </p>
                <p className="mt-1.5 text-[10.5px]" style={{ color: T.muted }}>
                  {cumulative === null ? (
                    "المعدّل السابق على مقياس آخر"
                  ) : cumCredits ? (
                    <>
                      <span dir="ltr" className="tabular-nums">
                        {cumCredits}
                      </span>{" "}
                      {hourWord(cumCredits)} إجمالًا
                    </>
                  ) : (
                    "لا ساعات بعد"
                  )}
                </p>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-[10.5px]" style={{ color: T.faint }}>
                  ما قبل هذه الفصول
                </p>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      المعدّل السابق
                    </span>
                    <NumField
                      value={uni.priorGpa}
                      min={0}
                      max={uni.scale}
                      onChange={(v) =>
                        patchUni(() => ({ priorGpa: v, priorScale: uni.scale }))
                      }
                      className="py-2 text-[12px]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                      ساعاته المعتمدة
                    </span>
                    <NumField
                      value={uni.priorCredits}
                      min={0}
                      max={500}
                      onChange={(v) =>
                        patchUni(() => ({ priorCredits: v, priorScale: uni.scale }))
                      }
                      className="py-2 text-[12px]"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {!priorUsable && (
              <p
                className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11.5px] font-bold leading-relaxed"
                style={{ borderColor: `${T.accent}40`, background: `${T.accent}12`, color: T.accent }}
                role="alert"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                المعدّل السابق مُدخل على مقياس «من{" "}
                <span dir="ltr">{uni.priorScale}</span>» وأنت تحسب الآن على «من{" "}
                <span dir="ltr">{uni.scale}</span>». أعد كتابته من سجلك
                الأكاديمي ليُحسب التراكمي — تحويله تلقائيًا رقمٌ مخترع.
              </p>
            )}
          </Card>

          {/* --- what this term has to average ------------------------- *
               The cumulative is the number he is judged on, but it is not
               the number he can act on — this term's average is. So the
               target is entered once and the screen turns it into the only
               figure that is actionable: what the hours he is registered in
               right now have to come out at.                              */}
          <Card className="p-5 sm:p-7">
            <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.cta }}>
              <Crosshair size={15} /> كم أحتاج هذا الفصل؟
            </p>
            <div className="mt-4 flex flex-wrap items-start gap-5">
              <div className="min-w-[200px] flex-1">
                <span className="mb-1.5 block text-[10.5px]" style={{ color: T.faint }}>
                  المعدّل التراكمي الذي أريده
                </span>
                <NumField
                  value={uni.targetGpa}
                  min={0}
                  max={uni.scale}
                  onChange={(v) => patchUni(() => ({ targetGpa: v }))}
                  placeholder="0"
                  className="py-2 text-[13px]"
                />
                <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: T.faint }}>
                  على مقياس «من <span dir="ltr">{uni.scale}</span>». اتركه صفرًا
                  لإخفاء الحاسب.
                </p>
              </div>
              <div className="min-w-[220px] flex-[2]">
                {uni.targetGpa <= 0 ? (
                  <p className="text-[12px] leading-relaxed" style={{ color: T.faint }}>
                    اكتب المعدّل الذي تريد الوصول إليه، ويقول لك كم يجب أن يكون
                    معدّل هذا الفصل بالضبط.
                  </p>
                ) : !priorUsable ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.accent }}>
                    حدّث المعدّل السابق على المقياس الحالي أولًا — بدونه لا
                    يُعرف من أين تبدأ.
                  </p>
                ) : termHours <= 0 ? (
                  <p className="text-[12px] leading-relaxed" style={{ color: T.faint }}>
                    لا ساعات مسجّلة في «{term?.label || "هذا الفصل"}» — أضف
                    مقرّراتك ليُحسب المطلوب.
                  </p>
                ) : needThisTerm === null ? null : needThisTerm > uni.scale ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.danger }}>
                    لا يُدرَك هذا الفصل مهما فعلت: حتى بمعدّل{" "}
                    <span dir="ltr" className="tabular-nums">
                      {uni.scale}
                    </span>{" "}
                    كاملًا سينتهي تراكميك عند{" "}
                    <span dir="ltr" className="tabular-nums">
                      {bestPossible.toFixed(2)}
                    </span>
                    . اخفض الهدف أو وزّعه على فصلين.
                  </p>
                ) : needThisTerm <= 0 ? (
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: T.primary }}>
                    أنت فوق هدفك فعلًا — هذا الفصل تثبيت لا إنقاذ.
                  </p>
                ) : (
                  <p className="text-[12.5px] leading-relaxed" style={{ color: T.muted }}>
                    معدّل هذا الفصل يجب أن يكون{" "}
                    <span
                      dir="ltr"
                      className="text-[22px] font-extrabold tabular-nums"
                      style={{ color: gpaBand(needThisTerm, uni.scale).tint }}
                    >
                      {needThisTerm.toFixed(2)}
                    </span>{" "}
                    على الأقل، عبر{" "}
                    <span dir="ltr" className="tabular-nums">
                      {termHours}
                    </span>{" "}
                    {hourWord(termHours)} مسجّلة — أي ما يقارب تقدير{" "}
                    <span dir="ltr" className="font-bold">
                      {nearestGrade(needThisTerm, uni.scale)}
                    </span>{" "}
                    في كل مقرّر.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* --- the degree, not the term ------------------------------- */}
          <Card className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                <Milestone size={15} /> الطريق إلى التخرّج
              </p>
              <div className="w-[160px]">
                <span className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                  ساعات الخطة كاملة
                </span>
                <NumField
                  value={uni.gradCredits}
                  min={0}
                  max={400}
                  onChange={(v) => patchUni(() => ({ gradCredits: v }))}
                  placeholder="0"
                  className="py-1.5 text-[12px]"
                />
              </div>
            </div>

            {uni.gradCredits > 0 ? (
              <>
                <div
                  className="mt-4 h-2 w-full overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (cumCredits / uni.gradCredits) * 100)}%`,
                      backgroundImage: `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`,
                      boxShadow: `0 0 14px ${T.primary}99`,
                    }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile
                    icon={BadgeCheck}
                    label="أُنجز"
                    value={cumCredits}
                    sub={`${Math.round((cumCredits / uni.gradCredits) * 100)}٪ من الخطة`}
                    tint={T.primary}
                  />
                  <StatTile
                    icon={Hourglass}
                    label="يتبقّى"
                    value={Math.max(0, uni.gradCredits - cumCredits)}
                    sub={`${hourWord(Math.max(0, uni.gradCredits - cumCredits))} معتمدة`}
                    tint={T.accent}
                  />
                  <StatTile
                    icon={Hash}
                    label="مسجّل الآن"
                    value={loadHours}
                    sub={term?.label || "هذا الفصل"}
                    tint={T.sky}
                  />
                  <StatTile
                    icon={Flag}
                    label="فصول متبقّية"
                    value={termsLeft === null ? "—" : termsLeft}
                    sub={
                      termsLeft === null
                        ? "يظهر بعد تسجيل ساعاتك"
                        : `بمعدّل ${loadHours} ${hourWord(loadHours)} للفصل`
                    }
                    tint={T.violet}
                  />
                </div>
              </>
            ) : (
              <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
                اكتب عدد ساعات خطتك الدراسية كاملة، ويتحوّل عدّاد الساعات إلى
                شريط تخرّج يقول لك كم بقي وكم فصلًا.
              </p>
            )}
          </Card>

          {/* --- every term, not just this one -------------------------- *
               The term switcher shows one term's average at a time, which
               is the one view that cannot answer «هل أنا أتحسّن؟». The
               whole record on one card can.                               */}
          {(uni.terms || []).length > 1 && (
            <Card className="p-5 sm:p-7">
              <p className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.accent }}>
                <BarChart3 size={15} /> سجلّ الفصول
              </p>
              <div className="mt-4 space-y-2">
                {termRecord.map((row) => {
                  const on = row.t.id === uni.term;
                  const band = row.credits ? gpaBand(row.gpa, uni.scale) : null;
                  return (
                    <button
                      key={row.t.id}
                      onClick={() => patchUni(() => ({ term: row.t.id }))}
                      aria-pressed={on}
                      className="flex w-full flex-wrap items-center gap-3 rounded-xl border p-3 text-right transition-colors hover:bg-white/[0.06]"
                      style={{
                        borderColor: on ? `${T.cta}59` : "rgba(255,255,255,0.08)",
                        backgroundColor: on ? `${T.cta}0F` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-extrabold">
                          {row.t.label || "فصل بلا اسم"}
                        </span>
                        <span className="mt-0.5 block text-[10.5px]" style={{ color: T.faint }}>
                          {arDate(row.t.start)} — {arDate(row.t.end)} ·{" "}
                          <span dir="ltr" className="tabular-nums">
                            {row.n}
                          </span>{" "}
                          {courseWord(row.n)}
                        </span>
                      </span>
                      <span className="shrink-0 text-left">
                        <span
                          dir="ltr"
                          className="block text-[17px] font-extrabold tabular-nums"
                          style={{ color: band ? band.tint : T.faint }}
                        >
                          {row.credits ? row.gpa.toFixed(2) : "—"}
                        </span>
                        <span className="block text-[10px]" style={{ color: T.faint }}>
                          {row.credits ? (
                            <>
                              <span dir="ltr" className="tabular-nums">
                                {row.credits}
                              </span>{" "}
                              {hourWord(row.credits)}
                            </>
                          ) : (
                            "بلا تقديرات"
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-7">
            <p className="text-[13px] font-extrabold" style={{ color: T.accent }}>
              تقديرات {term?.label || "الفصل"}
            </p>
            {courses.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-white/30">
                لا مقرّرات في هذا الفصل.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {courses.map((c) => {
                  const st = courseStanding(c);
                  const g = gradeOf(c.grade);
                  const suggest = st.projected !== null ? gradeFromPct(st.projected).id : null;
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border p-3.5"
                      style={{ borderColor: `${c.tint}2E`, background: `${c.tint}0A` }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button onClick={() => setDeskId(c.id)} className="min-w-0 flex-1 text-right">
                          <p className="truncate text-[13.5px] font-extrabold" style={{ color: c.tint }}>
                            {courseName(c)}
                          </p>
                          <p className="mt-0.5 text-[10.5px]" style={{ color: T.faint }}>
                            <span dir="ltr" className="tabular-nums">
                              {c.credits}
                            </span>{" "}
                            {hourWord(c.credits)}
                            {st.projected !== null && (
                              <>
                                {" · المتوقّع "}
                                <span dir="ltr" className="tabular-nums">
                                  {st.projected.toFixed(1)}%
                                </span>
                              </>
                            )}
                          </p>
                        </button>
                        {g && (
                          <span
                            dir="ltr"
                            className="shrink-0 text-[13px] font-extrabold tabular-nums"
                            style={{ color: gradePoints(g, uni.scale) >= 4 ? T.primary : T.accent }}
                          >
                            {gradePoints(g, uni.scale).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <GradePicker
                          value={c.grade}
                          onPick={(id) => patchCourse(c.id, (prev) => ({ ...prev, grade: id }))}
                          scale={uni.scale}
                          suggest={suggest}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      <CourseDesk
        course={desk}
        term={term}
        scale={uni.scale}
        onClose={() => setDeskId(null)}
        onPatch={(fn) => patchCourse(desk.id, fn)}
        onDelete={() => desk && dropCourse(desk)}
      />

      <CourseModal
        open={!!newCourse}
        draft={newCourse}
        setDraft={setNewCourse}
        terms={uni.terms || []}
        onClose={() => setNewCourse(null)}
        onSave={saveCourse}
      />

      <TermModal
        open={!!termDraft}
        draft={termDraft}
        setDraft={setTermDraft}
        onClose={() => setTermDraft(null)}
        onSave={saveTerm}
        onDelete={dropTerm}
      />

      <UniTaskModal
        open={!!taskDraft}
        draft={taskDraft}
        setDraft={setTaskDraft}
        courses={uni.courses || []}
        onClose={() => setTaskDraft(null)}
        onSave={saveTask}
      />
    </div>
  );
}
