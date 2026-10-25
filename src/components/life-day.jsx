/* --- one day, shared by every screen that shows it ---------------------
 *  The pieces «اليوم» and the routine screen both render, kept here rather
 *  than inside either of them.
 *
 *  Phase 1: `TaskChip` gained a meta line (due, estimate, aging), inline
 *  edit on the pencil, and its own inline checkbox (instead of the shared
 *  `Checkbox`) so a long Arabic task wraps to a second line instead of
 *  being truncated or pushing the quadrant column wider than the card
 *  beside it.
 *
 *  Triple-list system: a task can be one of the three *sacred* ones
 *  (`today`), one of the day's extras (`scheduled`), or just sit in the
 *  matrix.
 *
 *  Time-total: both cards now show the sum of their open tasks' estimates
 *  in the header.
 *
 *  Clear-done: both cards carry a small broom — «مسح» — that sweeps the
 *  finished rows off the board. On the extras card the broom lifts the
 *  `scheduled` flag; on the sacred card it lifts the `today` flag. Neither
 *  deletes anything: the task keeps its `done` mark and its place in the
 *  matrix, only the day's board is cleared. `arm()` is called first so one
 *  `Ctrl+Z` brings the whole sweep back.
 * --------------------------------------------------------------------- */

import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  Target,
  Sun,
  Zap,
  GripVertical,
  Footprints,
  Pencil,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  Plus,
  Eraser,
  Link2,
} from "lucide-react";
import {
  T,
  useBurst,
  Card,
  Btn,
  Field,
  Badge,
  Modal,
  useUndo,
  whenWord,
} from "./life-shared.jsx";
import {
  dayKey,
  TOP_TASK_CAP,
  uid,
  bookForHabit,
  withdrawReading,
  pctOf,
  taskAge,
  taskOverdue,
  taskDueToday,
  taskDueSoon,
  scheduledTasks,
  taskShape,
  nextOrder,
  AGED_DAYS,
  ESTIMATE_MAX,
  rows,
  syncHabitToGoals,
  syncTaskToGoal,
} from "../state/life-state.mjs";

/* The one colour the theme doesn't carry. Sky-400 from Tailwind — the
   blue the extras card and its sun toggle are drawn in. */
const SKY = "#38bdf8";

/* Minutes → the label the headers show beside the counter. */
const fmtEst = (mins) => {
  if (!mins) return "";
  if (mins < 60) return `${mins} د`;
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
};

/* The sum of the estimates of the rows that are still open in a given
   subset of the task list. */
const estOf = (list) =>
  list.reduce(
    (n, t) => n + (!t.done && Number.isFinite(t.estimate) ? t.estimate : 0),
    0,
  );

/* ==================================================================== *
 *  The 80/20 hook — exactly three non-negotiables a day.
 * ==================================================================== */
export function TopThree({ state, setState }) {
  const arm = useUndo();
  const picked = state.tasks.filter((t) => t.today);
  const done = picked.filter((t) => t.done).length;
  const slots = [...Array(TOP_TASK_CAP)].map((_, i) => picked[i] || null);
  const full = picked.length >= TOP_TASK_CAP;
  const est = estOf(picked);
  const linkedGoalsCount = picked.filter(
    (t) => t.linkedGoalId && (state.goals || []).some((g) => g.id === t.linkedGoalId),
  ).length;

  // 👇 التعديل الجوهري: تحديث الهدف المرتبط عند إنجاز المهمة
  const patch = (id, next) =>
    setState((s) => {
      const task = s.tasks.find((t) => t.id === id);
      const nextGoals = (task && task.linkedGoalId && next.done !== undefined)
        ? syncTaskToGoal(s.goals, task.linkedGoalId, next.done)
        : s.goals;
      return {
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...next } : t)),
        goals: nextGoals,
      };
    });

  /* The broom. Lifts `today` off every finished row; the task keeps its
     `done` mark and its quadrant, only the sacred slot is freed. */
  const clearDone = () => {
    const doneIds = new Set(picked.filter((t) => t.done).map((t) => t.id));
    if (!doneIds.size) return;
    arm("مُسحت المهام المنجزة", { tasks: state.tasks });
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        doneIds.has(t.id) ? { ...t, today: false } : t,
      ),
    }));
  };

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
            <h3
              className="text-[17px] font-extrabold"
              style={{ color: T.ctaLift }}
            >
              أهم ٣ مهام اليوم
            </h3>
            <p
              className="text-[11.5px] leading-relaxed"
              style={{ color: T.faint }}
            >
              ثلاث مقدسة. لو أنجزتها وحدها، كان اليوم ناجحًا. السقف الوحيد هو
              الـ ٣ — الباقي بلا حدود.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {linkedGoalsCount > 0 && (
            <span
              className="flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-extrabold"
              style={{
                borderColor: `${T.primary}45`,
                background: `${T.primary}14`,
                color: T.primaryLift,
              }}
              title="عدد المهام الثلاث المرتبطة مباشرة بأهداف إرثي 2030"
            >
              <Target size={11} />
              <span>تخدم {linkedGoalsCount} من إرث 2030</span>
            </span>
          )}
          {est > 0 && (
            <span
              className="flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold tabular-nums"
              style={{
                borderColor: `${T.cta}3D`,
                background: `${T.cta}0D`,
                color: T.ctaLift,
              }}
              title={`مجموع الوقت المتوقع: ${Math.floor(est / 60)} س ${est % 60} د`}
            >
              <Clock size={10} />
              <span dir="ltr">{fmtEst(est)}</span>
            </span>
          )}
          {done > 0 && (
            <button
              type="button"
              onClick={clearDone}
              title={`مسح ${done} منجزة — ترجع للمصفوفة`}
              aria-label="مسح المهام المنجزة"
              className="flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all duration-200 hover:border-white/40 hover:bg-white/[0.06]"
              style={{
                borderColor: `${T.cta}3D`,
                color: T.ctaLift,
              }}
            >
              <Eraser size={11} />
              مسح
            </button>
          )}
          <Badge tint={done === TOP_TASK_CAP ? T.primary : T.cta}>
            <span dir="ltr" className="tabular-nums">
              {done}/{TOP_TASK_CAP}
            </span>
            {" منجزة"}
          </Badge>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {slots.map((task, i) =>
          task ? (
            <div key={task.id} className="flex items-start gap-2.5">
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
                  goals={state.goals} // <--- تم تمرير الأهداف
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", task.id)
                  }
                  onToggleDone={() => patch(task.id, { done: !task.done })}
                  onToggleToday={() => patch(task.id, { today: false })}
                  onEdit={({ text, due, estimate, linkedGoalId }) =>
                    patch(task.id, { text, due, estimate, linkedGoalId }) // <--- تحديث لتمرير linkedGoalId
                  }
                  onDelete={() => {
                    arm("حُذفت المهمة", { tasks: state.tasks });
                    setState((s) => ({
                      ...s,
                      tasks: s.tasks.filter((t) => t.id !== task.id),
                    }));
                  }}
                />
                {!!task.step && (
                  <p
                    className="mt-1 flex items-start gap-1.5 pr-2 text-[11px] leading-relaxed"
                    style={{ color: task.done ? T.faint : T.muted }}
                  >
                    <Footprints
                      size={11}
                      className="mt-[3px] shrink-0"
                      style={{ color: task.done ? T.faint : T.cta }}
                    />
                    <span
                      style={
                        task.done
                          ? {
                              textDecorationLine: "line-through",
                              textDecorationColor: `${T.primary}80`,
                            }
                          : undefined
                      }
                    >
                      {task.step}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div key={`slot-${i}`} className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: T.faint,
                }}
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
          )
        )}
      </div>

      {full && (
        <p
          className="mt-4 rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${SKY}3D`,
            background: `${SKY}12`,
            color: SKY,
          }}
        >
          الثلاث المقدسة مكتملة. الباقي — بلا حدود — في «مهام إضافية لليوم»
          تحت.
        </p>
      )}
    </Card>
  );
}

/* The four quadrants, just enough of them to label a dropdown. */
const EXTRA_QUADS = [
  { id: "q1", label: "عاجل ومهم" },
  { id: "q2", label: "مهم غير عاجل" },
  { id: "q3", label: "عاجل غير مهم" },
  { id: "q4", label: "غير عاجل وغير مهم" },
];

/* ==================================================================== *
 *  TodayExtras — the day's additional list, no ceiling.
 * ==================================================================== */
export function TodayExtras({ state, setState }) {
  const arm = useUndo();
  const [draft, setDraft] = useState("");
  const [draftQ, setDraftQ] = useState("q2");
  const [draftGoalId, setDraftGoalId] = useState("");
  const list = scheduledTasks(state.tasks);
  const doneCount = list.filter((t) => t.done).length;
  const todayCount = state.tasks.filter((t) => t.today).length;
  const canPromote = todayCount < TOP_TASK_CAP;
  const est = estOf(list);
  const linkedGoalsCount = list.filter(
    (t) => t.linkedGoalId && (state.goals || []).some((g) => g.id === t.linkedGoalId),
  ).length;

  // 👇 التعديل الجوهري: تحديث الهدف المرتبط عند إنجاز المهمة
  const patch = (id, next) =>
    setState((s) => {
      const task = s.tasks.find((t) => t.id === id);
      const nextGoals = (task && task.linkedGoalId && next.done !== undefined)
        ? syncTaskToGoal(s.goals, task.linkedGoalId, next.done)
        : s.goals;
      return {
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...next } : t)),
        goals: nextGoals,
      };
    });

  const promote = (task) => {
    if (task.today) return patch(task.id, { today: false });
    if (!canPromote) return;
    patch(task.id, { today: true, scheduled: false });
  };

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        taskShape({
          text,
          quadrant: draftQ,
          scheduled: true,
          linkedGoalId: draftGoalId || null,
          createdAt: dayKey(),
          order: nextOrder(s.tasks, draftQ),
        }),
      ],
    }));
    setDraft("");
    setDraftGoalId("");
  };

  /* The broom. Lifts `scheduled` off every finished row; the task keeps
     its `done` flag and its place in the matrix. */
  const clearDone = () => {
    const doneIds = new Set(list.filter((t) => t.done).map((t) => t.id));
    if (!doneIds.size) return;
    arm("مُسحت المهام المنجزة", { tasks: state.tasks });
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        doneIds.has(t.id) ? { ...t, scheduled: false } : t,
      ),
    }));
  };

  return (
    <Card
      className="p-6 sm:p-7"
      style={{
        borderColor: `${SKY}59`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.12), 0 0 46px -22px ${SKY}`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${SKY}59`,
              background: `linear-gradient(160deg, ${SKY}3D, ${SKY}0F)`,
              color: SKY,
            }}
          >
            <Sun size={20} strokeWidth={2.4} />
          </span>
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: SKY }}>
              مهام إضافية لليوم
            </h3>
            <p
              className="text-[11.5px] leading-relaxed"
              style={{ color: T.faint }}
            >
              بلا سقف. أضف ما تحتاجه فعلًا — اليوم يحتمل أكثر من ثلاث.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {linkedGoalsCount > 0 && (
            <span
              className="flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-extrabold"
              style={{
                borderColor: `${T.primary}45`,
                background: `${T.primary}14`,
                color: T.primaryLift,
              }}
              title="عدد المهام الثلاث المرتبطة مباشرة بأهداف إرثي 2030"
            >
              <Target size={11} />
              <span>تخدم {linkedGoalsCount} من إرث 2030</span>
            </span>
          )}
          {est > 0 && (
            <span
              className="flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold tabular-nums"
              style={{
                borderColor: `${SKY}3D`,
                background: `${SKY}0D`,
                color: SKY,
              }}
              title={`مجموع الوقت المتوقع: ${Math.floor(est / 60)} س ${est % 60} د`}
            >
              <Clock size={10} />
              <span dir="ltr">{fmtEst(est)}</span>
            </span>
          )}
          {doneCount > 0 && (
            <button
              type="button"
              onClick={clearDone}
              title={`مسح ${doneCount} منجزة — ترجع للمصفوفة`}
              aria-label="مسح المهام المنجزة"
              className="flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all duration-200 hover:border-white/40 hover:bg-white/[0.06]"
              style={{
                borderColor: `${SKY}3D`,
                color: SKY,
              }}
            >
              <Eraser size={11} />
              مسح
            </button>
          )}
          <Badge tint={SKY}>
            <span dir="ltr" className="tabular-nums">
              {doneCount}/{list.length}
            </span>
            {" منجزة"}
          </Badge>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {list.length === 0 ? (
          <p
            className="rounded-xl border border-dashed py-4 text-center text-[11.5px] leading-relaxed"
            style={{ borderColor: T.border, color: T.faint }}
          >
            لا مهام إضافية بعد — اكتب واحدة تحت، أو أضف من المصفوفة بزر{" "}
            <Sun size={11} className="inline -mt-0.5" style={{ color: SKY }} />{" "}
            على أي مهمة.
          </p>
        ) : (
          list.map((task) => (
            <TaskChip
              key={task.id}
              task={task}
              goals={state.goals} // <--- تم تمرير الأهداف
              onToggleDone={() => patch(task.id, { done: !task.done })}
              onToggleScheduled={() =>
                patch(task.id, { scheduled: !task.scheduled })
              }
              onToggleToday={() => promote(task)}
              onEdit={({ text, due, estimate, linkedGoalId }) =>
                patch(task.id, { text, due, estimate, linkedGoalId }) // <--- تحديث لتمرير linkedGoalId
              }
              onDelete={() => {
                arm("حُذفت المهمة", { tasks: state.tasks });
                setState((s) => ({
                  ...s,
                  tasks: s.tasks.filter((t) => t.id !== task.id),
                }));
              }}
            />
          ))
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Field
          id="los-extra-new"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="أضف مهمة لليوم…"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={draftGoalId}
            onChange={(e) => setDraftGoalId(e.target.value)}
            aria-label="ربط بهدف 2030"
            className="max-w-[165px] truncate rounded-xl border bg-transparent px-2.5 py-2.5 text-xs outline-none"
            style={{ borderColor: draftGoalId ? `${T.primary}66` : T.border, color: draftGoalId ? T.primaryLift : T.muted }}
          >
            <option value="" style={{ background: T.cardSolid }}>
              🎯 ربط بهدف (اختياري)
            </option>
            {(state.goals || [])
              .filter((g) => !g.done)
              .map((g) => (
                <option key={g.id} value={g.id} style={{ background: T.cardSolid }}>
                  {g.text}
                </option>
              ))}
          </select>
          <select
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            aria-label="الربع"
            className="rounded-xl border bg-transparent px-3 py-2.5 text-xs outline-none"
            style={{ borderColor: T.border, color: T.muted }}
          >
            {EXTRA_QUADS.map((q) => (
              <option
                key={q.id}
                value={q.id}
                style={{ background: T.cardSolid }}
              >
                {q.label}
              </option>
            ))}
          </select>
          <Btn
            variant="default"
            onClick={add}
            disabled={!draft.trim()}
            className="shrink-0"
          >
            <Plus size={15} strokeWidth={3} /> أضف
          </Btn>
        </div>
      </div>

      {!canPromote && list.length > 0 && (
        <p
          className="mt-4 rounded-xl border px-3.5 py-2.5 text-center text-[11px] leading-relaxed"
          style={{
            borderColor: `${T.cta}3D`,
            background: `${T.cta}12`,
            color: T.ctaLift,
          }}
        >
          الثلاث المقدسة مكتملة. أنجِز واحدة منها لترفع غيرها إليها.
        </p>
      )}
    </Card>
  );
}

/* --- ticking a habit -------------------------------------------------- */
export function useHabitTick(state, setState) {
  const [logging, setLogging] = useState(null);
  const arm = useUndo();

  const toggle = useCallback(
    (id, tiny = false, level = null) => {
      const habit = state.habits.find((h) => h.id === id);
      const turningOn = habit && !habit.done;

      if (habit && !turningOn) {
        arm("أُزيل التأشير", {
          habits: state.habits,
          reading: state.reading,
          books: state.books,
          goals: state.goals,
        });
      }

      setState((s) => {
        const effLevel = level ? level : (tiny ? "micro" : "standard");
        const next = {
          ...s,
          habits: s.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  done: !h.done,
                  tiny: !h.done ? (effLevel === "micro" || !!tiny) : false,
                  levelDone: !h.done ? effLevel : null,
                }
              : h
          ),
        };
        if (habit && habit.book && !turningOn) {
          const back = withdrawReading(s.reading, s.books, id, dayKey());
          next.reading = back.reading;
          next.books = back.books;
        }
        
        // ====================================================================
        // الميزة الجوهرية: تحديث الأهداف المرتبطة تلقائياً
        // ====================================================================
        const isNowDone = next.habits.find((h) => h.id === id)?.done;
        next.goals = syncHabitToGoals(s.goals || [], id, isNowDone);

        return next;
      });

      if (habit?.book && turningOn) setLogging(habit);
    },
    [state.habits, state.reading, state.books, state.goals, setState, arm]
  );

  const logRead = useCallback(
    (pages) => {
      const habit = logging;
      if (!habit) return;
      setState((s) => {
        const book = bookForHabit(habit, s.books);
        if (!book) return s;
        const total = parseInt(book.pages, 10);
        const at = parseInt(book.page, 10);
        const base = Number.isFinite(at) ? at : 0;
        const next =
          Number.isFinite(total) && total > 0
            ? Math.min(total, base + pages)
            : base + pages;
        return {
          ...s,
          reading: [
            ...(s.reading || []),
            {
              id: uid(),
              date: dayKey(),
              bookId: book.id,
              habitId: habit.id,
              pages,
            },
          ],
          books: s.books.map((b) =>
            b.id === book.id ? { ...b, page: String(next) } : b
          ),
        };
      });
      setLogging(null);
    },
    [logging, setState]
  );

  const closeLog = useCallback(() => setLogging(null), []);
  return { toggle, logging, closeLog, logRead };
}

export function ReadLogModal({ open, book, onClose, onLog }) {
  const [pages, setPages] = useState("");

  useEffect(() => {
    if (open) setPages("");
  }, [open, book?.id]);

  if (!open) return null;

  const commit = (n) => {
    const v = parseInt(n, 10);
    if (!Number.isFinite(v) || v <= 0) return;
    onLog(v);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={book ? "كم صفحة قرأت؟" : "لا كتاب نشط"}
      footer={
        book ? (
          <>
            <Btn
              variant="default"
              className="flex-1"
              onClick={() => commit(pages)}
            >
              سجّل
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={onClose}>
              تخطّي
            </Btn>
          </>
        ) : (
          <Btn variant="outline" className="flex-1" onClick={onClose}>
            حسنًا
          </Btn>
        )
      }
    >
      {book ? (
        <div className="space-y-4">
          <p
            className="text-[12.5px] leading-relaxed"
            style={{ color: T.muted }}
          >
            من <span style={{ color: T.accent }}>«{book.title}»</span>
            {pctOf(book) !== null && (
              <>
                {" "}
                — أنت عند الصفحة{" "}
                <span dir="ltr" className="tabular-nums">
                  {book.page}
                </span>
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 50].map((n) => (
              <button
                key={n}
                onClick={() => setPages(String(n))}
                className="rounded-xl border px-4 py-2 text-xs font-bold tabular-nums transition-all duration-200 hover:scale-105"
                dir="ltr"
                style={{
                  borderColor: pages === String(n) ? `${T.cta}80` : T.border,
                  background:
                    pages === String(n) ? `${T.cta}1F` : "transparent",
                  color: pages === String(n) ? T.ctaLift : T.muted,
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="los-read-pages"
              className="mb-1.5 block text-xs text-white/45"
            >
              أو اكتب العدد
            </label>
            <Field
              id="los-read-pages"
              value={pages}
              autoFocus
              inputMode="numeric"
              onChange={(e) => setPages(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit(pages)}
              placeholder="عدد الصفحات"
              className="tabular-nums"
            />
          </div>
        </div>
      ) : (
        <p
          className="text-[12.5px] leading-relaxed"
          style={{ color: T.muted }}
        >
          هذه العادة مربوطة بالكتاب الذي تقرأه الآن، ولا كتاب موسوم بـ«أقرأه
          الآن» في مكتبتك. علّم كتابًا بهذه الحالة، أو اربط العادة بكتاب بعينه
          من تعديل العادة.
        </p>
      )}
    </Modal>
  );
}

/* ==================================================================== *
 *  TaskChip — the one row a task is drawn as, everywhere it appears.
 * ==================================================================== */
export function TaskChip({
  task,
  goals, // <--- تم استقبال الأهداف
  compact = false,
  onToggleToday,
  onToggleScheduled,
  onToggleDone,
  onDelete,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const [burst, fireBurst] = useBurst(700);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => draftOf(task));
  const [over, setOver] = useState(false);

  const age = taskAge(task);
  const overdue = taskOverdue(task);
  const dueToday = taskDueToday(task);
  const dueSoon = taskDueSoon(task);
  const aged = age >= AGED_DAYS && !task.done && !overdue && !dueToday;

  const handleDone = () => {
    if (!task.done) fireBurst();
    onToggleDone();
  };

  const startEdit = () => {
    if (!onEdit) return;
    setDraft(draftOf(task));
    setEditing(true);
  };

  const commitEdit = () => {
    const text = draft.text.trim();
    if (!text) return;
    onEdit({ 
      text, 
      due: draft.due, 
      estimate: draft.estimate, 
      linkedGoalId: draft.linkedGoalId // <--- تمرير الهدف المعدل
    });
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  if (editing) {
    return (
      <div
        className="w-full min-w-0 rounded-xl border p-3"
        style={{ borderColor: `${T.cta}80`, background: `${T.cta}0D` }}
      >
        <Field
          autoFocus
          value={draft.text}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          placeholder="نص المهمة"
        />

        {/* 👇 قائمة اختيار الهدف 👇 */}
        <div className="mt-2">
          <label className="mb-1 block text-[10px] text-white/45">مرتبطة بهدف</label>
          <select
            value={draft.linkedGoalId || ""}
            onChange={(e) => setDraft((d) => ({ ...d, linkedGoalId: e.target.value || null }))}
            className="w-full rounded-lg border bg-transparent px-2 py-1.5 text-xs outline-none"
            style={{ borderColor: T.border, color: T.muted }}
          >
            <option value="">— لا يوجد —</option>
            {(goals || []).filter(g => !g.done).map(g => (
              <option key={g.id} value={g.id}>{g.text}</option>
            ))}
          </select>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label
              htmlFor={`los-chip-due-${task.id}`}
              className="mb-1 block text-[10px]"
              style={{ color: T.faint }}
            >
              تاريخ الاستحقاق
            </label>
            <Field
              id={`los-chip-due-${task.id}`}
              type="date"
              dir="ltr"
              value={draft.due}
              onChange={(e) => setDraft((d) => ({ ...d, due: e.target.value }))}
              style={{ colorScheme: "dark", textAlign: "left" }}
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor={`los-chip-est-${task.id}`}
              className="mb-1 block text-[10px]"
              style={{ color: T.faint }}
            >
              الوقت المتوقع (دقيقة)
            </label>
            <Field
              id={`los-chip-est-${task.id}`}
              type="number"
              min="0"
              max={ESTIMATE_MAX}
              step="15"
              dir="ltr"
              value={draft.estimate || ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, estimate: e.target.value }))
              }
              placeholder="0"
              className="tabular-nums"
            />
          </div>
        </div>
        <div className="mt-2.5 flex gap-2">
          <Btn
            variant="default"
            size="sm"
            className="flex-1"
            onClick={commitEdit}
          >
            <Check size={13} strokeWidth={3} /> حفظ
          </Btn>
          <Btn variant="ghost" size="sm" className="flex-1" onClick={cancelEdit}>
            إلغاء
          </Btn>
        </div>
      </div>
    );
  }

  const borderTint = over
    ? T.cta
    : overdue
      ? T.danger
      : dueToday
        ? T.cta
        : task.done
          ? `${T.primary}55`
          : task.scheduled
            ? `${SKY}66`
            : T.border;

  const bgTint = over
    ? `${T.cta}1F`
    : burst
      ? `${T.primary}2E`
      : overdue
        ? `${T.danger}0D`
        : dueToday
          ? `${T.cta}0D`
          : task.done
            ? `${T.primary}14`
            : task.scheduled
              ? `${SKY}0D`
              : "rgba(255,255,255,0.04)";

  const hasMeta =
    !compact &&
    (overdue || dueToday || dueSoon || task.due || task.estimate > 0 || aged || task.linkedGoalId);

  return (
    <div
      draggable={!task.done}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (task.done) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
        onDragOver?.(e);
      }}
      onDragLeave={(e) => {
        setOver(false);
        onDragLeave?.(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDrop?.(e);
      }}
      className={`group flex w-full min-w-0 items-start gap-2 overflow-hidden rounded-xl border px-2.5 py-2 transition-all duration-200 hover:border-white/25${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: borderTint,
        background: bgTint,
        cursor: task.done ? "default" : "grab",
        opacity: aged ? 0.72 : 1,
      }}
    >
      {!task.done ? (
        <GripVertical
          size={13}
          className="mt-1.5 shrink-0 text-white/15 transition-colors group-hover:text-white/35"
        />
      ) : (
        <span className="mt-1.5 w-[13px] shrink-0" aria-hidden="true" />
      )}

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={handleDone}
          aria-pressed={task.done}
          className="flex w-full min-w-0 items-start gap-2 rounded-lg px-1.5 py-1 text-right transition-colors hover:bg-white/[0.06]"
        >
          <span
            className="relative mt-[2px] flex shrink-0 items-center justify-center"
            style={{ width: 18, height: 18 }}
          >
            {burst && (
              <span
                aria-hidden="true"
                className="los-ripple pointer-events-none absolute inset-0 rounded-md border-2"
                style={{ borderColor: T.primary }}
              />
            )}
            <span
              className={`flex h-full w-full items-center justify-center rounded-md border transition-all duration-300${
                burst ? " los-pop" : ""
              }`}
              style={{
                borderColor: task.done ? T.primary : T.borderStrong,
                background: task.done ? T.primary : "transparent",
                boxShadow: task.done ? `0 0 16px ${T.primary}80` : "none",
                transform:
                  task.done && !burst ? "scale(1.06)" : "scale(1)",
              }}
            >
              <Check
                size={11}
                strokeWidth={4}
                className="transition-all duration-200"
                style={{
                  color: T.bgDeep,
                  opacity: task.done ? 1 : 0,
                  transform: task.done ? "scale(1)" : "scale(0.4)",
                }}
              />
            </span>
          </span>
          <span
            className="min-w-0 flex-1 whitespace-normal text-[13.5px] leading-snug"
            style={{
              color: task.done ? T.primary : "rgba(248,250,252,0.86)",
              textDecorationLine: task.done ? "line-through" : "none",
              textDecorationColor: `${T.primary}80`,
              overflowWrap: "anywhere",
            }}
          >
            {task.text}
          </span>
        </button>

        {hasMeta && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 pr-1.5 text-[10px] leading-tight">
            {overdue && (
              <span
                className="inline-flex items-center gap-0.5 font-bold"
                style={{ color: T.danger }}
              >
                <AlertTriangle size={10} strokeWidth={2.6} /> متأخرة
              </span>
            )}
            {!overdue && task.due && (
              <span
                className="inline-flex items-center gap-0.5"
                style={{
                  color: dueToday ? T.cta : dueSoon ? T.accent : T.faint,
                  fontWeight: dueToday || dueSoon ? 700 : 400,
                }}
              >
                <Calendar size={10} />
                {dueToday || dueSoon ? whenWord(task.due) : formatDue(task.due)}
              </span>
            )}
            {task.estimate > 0 && (
              <span
                className="inline-flex items-center gap-0.5"
                style={{ color: T.faint }}
              >
                <Clock size={10} />
                <span dir="ltr" className="tabular-nums">
                  {task.estimate}
                </span>
                د
              </span>
            )}

            {/* 👇 أيقونة واسم الهدف المرتبط 👇 */}
            {task.linkedGoalId && (() => {
              const linkedGoal = (goals || []).find((g) => g.id === task.linkedGoalId);
              return (
                <span
                  className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-extrabold"
                  style={{
                    borderColor: `${T.primary}45`,
                    background: `${T.primary}15`,
                    color: T.primaryLift,
                  }}
                  title={linkedGoal ? `تخدم هدف 2030: ${linkedGoal.text}` : "مرتبطة بهدف"}
                >
                  <Target size={10} />
                  <span className="max-w-[11rem] truncate">
                    {linkedGoal ? linkedGoal.text : "هدف مرتبط"}
                  </span>
                </span>
              );
            })()}

            {aged && <span style={{ color: T.faint }}>· قديمة</span>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {onToggleScheduled && (
          <button
            onClick={onToggleScheduled}
            aria-pressed={task.scheduled}
            aria-label="إضافة إلى مهام اليوم الإضافية"
            title="مهام إضافية لليوم"
            className="rounded p-1 transition-colors"
            style={{
              color: task.scheduled ? SKY : "rgba(255,255,255,0.15)",
            }}
          >
            <Sun size={14} strokeWidth={task.scheduled ? 2.6 : 2} />
          </button>
        )}
        <button
          onClick={onToggleToday}
          aria-pressed={task.today}
          aria-label="إضافة إلى مهام اليوم المقدسة"
          title="أهم ٣ مهام"
          className="rounded p-1 transition-colors"
          style={{ color: task.today ? T.accent : "rgba(255,255,255,0.15)" }}
        >
          <Target size={14} strokeWidth={task.today ? 2.6 : 2} />
        </button>
        {onEdit && (
          <button
            onClick={startEdit}
            aria-label={`تعديل ${task.text}`}
            title="تعديل"
            className="rounded p-1 text-white/25 opacity-40 transition-all hover:text-white/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Pencil size={13} />
          </button>
        )}
        <button
          onClick={onDelete}
          aria-label={`حذف ${task.text}`}
          className="rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function draftOf(task) {
  return {
    text: task.text,
    due: task.due || "",
    estimate: task.estimate || 0,
    linkedGoalId: task.linkedGoalId || null, // <--- إضافة الهدف للـ draft
  };
}

function formatDue(due) {
  const [y, m, d] = String(due).split("-").map(Number);
  if (!y || !m || !d) return due;
  const AR_MONTHS = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  return `${d} ${AR_MONTHS[m - 1]}`;
}

/* ==================================================================== *
 *  End-of-day reflection
 * ==================================================================== */
export function ReflectionModal({
  open,
  onClose,
  onSave,
  pct,
  value,
  fixValue,
}) {
  const [distraction, setDistraction] = useState("");
  const [fix, setFix] = useState("");

  useEffect(() => {
    if (!open) return;
    setDistraction(value || "");
    setFix(fixValue || "");
  }, [open, value, fixValue]);

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
          <label
            htmlFor="los-r-d"
            className="mb-1.5 block text-xs text-white/45"
          >
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
          <label
            htmlFor="los-r-f"
            className="mb-1.5 block text-xs text-white/45"
          >
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