/* --- one day, shared by every screen that shows it ---------------------
 *  The pieces «اليوم» and the routine screen both render, kept here rather
 *  than inside either of them. CLAUDE.md says a habit is ticked in one
 *  place and that «اليوم» renders the same `TopThree` the routine does,
 *  never a copy — and the moment those lived in one screen's file, the
 *  other had to import from it while that one imported back, which is a
 *  name crossing the cut in both directions. So the shared day sits below
 *  both: `useHabitTick` with its reading prompt and its withdrawal on an
 *  untick, `TopThree` with the matrix chip it is built from, and the
 *  evening reflection.
 *
 *  This file imports nothing from the screens above it. That is the whole
 *  point of it.
 * --------------------------------------------------------------------- */

import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Target, Zap, GripVertical, Footprints } from "lucide-react";
import { T, useBurst, Card, Btn, Field, Badge, Modal, Checkbox, useUndo } from "./life-shared.jsx";
import { dayKey, rows, TOP_TASK_CAP, uid, bookForHabit, pctOf } from "./life-state.mjs";

/* ==================================================================== *
 *  The 80/20 hook — exactly three non-negotiables a day
 * ==================================================================== */
export function TopThree({ state, setState }) {
  const arm = useUndo();
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
                  onDelete={() => {
                    arm("حُذفت المهمة", { tasks: state.tasks });
                    setState((s) => ({
                      ...s,
                      tasks: s.tasks.filter((t) => t.id !== task.id),
                    }));
                  }}
                />
                {/* The step he wrote the night before, under the task it
                    belongs to. A task is a sentence; this is the thing a
                    body can start, and it is the only reason the prep
                    screen is worth opening twice. */}
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

/* --- ticking a habit -------------------------------------------------- *
 *  Two screens tick the same habits — the routine, where the blocks are
 *  managed, and «اليوم», where what is still open is answered — and the tick
 *  is not a boolean flip. A linked habit opens the reading log after the
 *  tick has landed, and unticking withdraws today's sessions for it and
 *  rolls the book's page counter back. A second copy of that in a second
 *  screen is two copies of the library's arithmetic, and the day the two
 *  disagree the shelf keeps pages the user undid.
 * ---------------------------------------------------------------------- */
export function useHabitTick(state, setState) {
  const [logging, setLogging] = useState(null); // habit awaiting a page count
  const arm = useUndo();

  /* `tiny` is the second way in, not a second hook: «نسخة صغيرة» lands here
     like every other tick, so the reading withdrawal, the undo and the
     reward are one implementation and cannot drift into two. */
  const toggle = useCallback(
    (id, tiny = false) => {
      const habit = state.habits.find((h) => h.id === id);
      const turningOn = habit && !habit.done;

      /* An untick is a deletion in everything but name: it withdraws today's
         reading sessions for the habit and rolls the book's page counter
         back, and a mis-tapped row on a phone can cost an evening's pages.
         Only the untick is armed — a tick that went in by mistake is undone
         by tapping it again, which is the same gesture. */
      if (habit && !turningOn) {
        arm("أُزيل التأشير", {
          habits: state.habits,
          reading: state.reading,
          books: state.books,
        });
      }

      setState((s) => {
        const next = {
          ...s,
          habits: s.habits.map((h) =>
            h.id === id
              ? /* The mark rides with the tick and leaves with it. A habit
                   unticked is not «done the small way», it is not done —
                   and a `tiny` left behind on an unticked row is a mark the
                   archive would read back as a day that was carried. */
                { ...h, done: !h.done, tiny: !h.done ? !!tiny : false }
              : h,
          ),
        };
        /* Unticking withdraws today's sessions for this habit and rolls the
           page counters back, so the library never keeps pages that were
           undone in the routine. */
        if (habit && habit.book && !turningOn) {
          const today = dayKey();
          const dropped = (s.reading || []).filter(
            (r) => r.habitId === id && r.date === today,
          );
          if (dropped.length) {
            const back = new Map();
            for (const r of dropped)
              back.set(r.bookId, (back.get(r.bookId) || 0) + r.pages);
            next.reading = (s.reading || []).filter(
              (r) => !(r.habitId === id && r.date === today),
            );
            next.books = s.books.map((b) => {
              const n = back.get(b.id);
              if (!n) return b;
              const at = parseInt(b.page, 10);
              if (!Number.isFinite(at)) return b;
              return { ...b, page: String(Math.max(0, at - n)) };
            });
          }
        }
        return next;
      });

      /* Ask only after the tick has landed, so the reward animation plays
         and a skipped prompt still leaves the habit done. */
      if (habit?.book && turningOn) setLogging(habit);
    },
    [state.habits, state.reading, state.books, setState, arm],
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
        const next = Number.isFinite(total) && total > 0
          ? Math.min(total, base + pages)
          : base + pages;
        return {
          ...s,
          reading: [
            ...(s.reading || []),
            { id: uid(), date: dayKey(), bookId: book.id, habitId: habit.id, pages },
          ],
          books: s.books.map((b) =>
            b.id === book.id ? { ...b, page: String(next) } : b,
          ),
        };
      });
      setLogging(null);
    },
    [logging, setState],
  );

  const closeLog = useCallback(() => setLogging(null), []);
  return { toggle, logging, closeLog, logRead };
}

/* Asked right after a reading habit is ticked. Deliberately skippable: the
   habit is already done and animated by the time this opens, so refusing to
   type a number must never undo the completion. */
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
          <p className="text-[12.5px] leading-relaxed" style={{ color: T.muted }}>
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
                  borderColor:
                    pages === String(n) ? `${T.cta}80` : T.border,
                  background: pages === String(n) ? `${T.cta}1F` : "transparent",
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
        <p className="text-[12.5px] leading-relaxed" style={{ color: T.muted }}>
          هذه العادة مربوطة بالكتاب الذي تقرأه الآن، ولا كتاب موسوم بـ«أقرأه
          الآن» في مكتبتك. علّم كتابًا بهذه الحالة، أو اربط العادة بكتاب بعينه
          من تعديل العادة.
        </p>
      )}
    </Modal>
  );
}

/* ==================================================================== *
 *  MODULE 2 — Eisenhower matrix
 * ==================================================================== */
export function TaskChip({ task, onToggleToday, onToggleDone, onDelete, onDragStart }) {
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

/* ==================================================================== *
 *  End-of-day reflection — only on a day that fell short
 * ==================================================================== */
export function ReflectionModal({ open, onClose, onSave, pct, value, fixValue }) {
  const [distraction, setDistraction] = useState("");
  const [fix, setFix] = useState("");

  /* Seeded from the archive each time it opens. Without this, opening it a
     second time showed two empty boxes and saving overwrote what was
     already written with nothing — a reflection silently erased by the act
     of going back to read it. */
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
