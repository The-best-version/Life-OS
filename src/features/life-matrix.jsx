import { TaskChip, TopThree } from "../components/life-day.jsx";
import {
  Btn,
  Card,
  Field,
  GLASS,
  Modal,
  T,
  TimeField,
  arDate,
  prettyTime,
  useBurst,
  useUndo,
} from "../components/life-shared.jsx";
import {
  QUADRANT_WIP,
  STEP_MAX,
  TOP_TASK_CAP,
  capToday,
  dayKey,
  estimateTotal,
  eventShape,
  hhmm,
  nextOrder,
  orderedDone,
  orderedOpen,
  prepPickAdd,
  prepPickDrop,
  prepPickEvent,
  prepShape,
  reorderWithin,
  taskShape,
  tomorrowKey,
  wipOf,
  syncTaskToGoal,
} from "../state/life-state.mjs";
import {
  AlertTriangle,
  CalendarPlus,
  Clock,
  Footprints,
  Plus,
  Sun,
  Target,
  Trash,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

/* The sun's colour, matching the one in life-day.jsx — the sky-400 from
   Tailwind. Kept as a literal here (not imported) so this file has no
   dependency on the extras card just for one hex. */
const SKY = "#38bdf8";

export function MatrixModule({ state, setState }) {
  const [draft, setDraft] = useState("");
  const [draftQ, setDraftQ] = useState("q2");
  const [draftGoal, setDraftGoal] = useState(""); // <--- حالة جديدة لاختيار الهدف
  const [over, setOver] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [capHit, fireCapHit] = useBurst(2800);
  const arm = useUndo();

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
          linkedGoalId: draftGoal || null, // <--- حفظ الهدف المرتبط
          createdAt: dayKey(),
          order: nextOrder(s.tasks, draftQ),
        }),
      ],
    }));
    setDraft("");
    setDraftGoal("");
  };

  // 👇 التعديل الجوهري: تحديث نسبة الهدف عند إنجاز المهمة
  const patch = (id, p) =>
    setState((s) => {
      const task = s.tasks.find((t) => t.id === id);
      const nextGoals = (task && task.linkedGoalId && p.done !== undefined)
        ? syncTaskToGoal(s.goals, task.linkedGoalId, p.done)
        : s.goals;
      return {
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)),
        goals: nextGoals,
      };
    });

  const promote = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.today) return;
    if (state.tasks.filter((x) => x.today).length >= TOP_TASK_CAP) {
      fireCapHit();
      return;
    }
    setState((s) => ({
      ...s,
      tasks: capToday(
        s.tasks.map((x) =>
          x.id === id ? { ...x, today: true, scheduled: false } : x,
        ),
      ),
    }));
  };

  const toggleToday = (t) =>
    t.today ? patch(t.id, { today: false }) : promote(t.id);

  const toggleScheduled = (t) =>
    t.scheduled
      ? patch(t.id, { scheduled: false })
      : patch(t.id, { scheduled: true, today: false });

  const remove = (id) => {
    arm("حُذفت المهمة", { tasks: state.tasks });
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  };

  const onDropQuadrant = (zone) => (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setOver(null);
    setDraggingId(null);
    if (!id) return;
    if (zone === "today") {
      promote(id);
      return;
    }
    setState((s) => {
      const t = s.tasks.find((x) => x.id === id);
      if (!t || t.quadrant === zone) return s;
      const order = nextOrder(s.tasks, zone);
      return {
        ...s,
        tasks: s.tasks.map((x) =>
          x.id === id ? { ...x, quadrant: zone, today: false, order } : x,
        ),
      };
    });
  };

  const onDropTask = (targetId) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setOver(null);
    setDraggingId(null);
    if (!id || id === targetId) return;
    setState((s) => ({ ...s, tasks: reorderWithin(s.tasks, id, targetId) }));
  };

  const dragProps = (zone) => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== zone) setOver(zone);
    },
    onDragLeave: () => setOver((o) => (o === zone ? null : o)),
    onDrop: onDropQuadrant(zone),
  });

  return (
    <div className="space-y-8 pb-20">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
          مصفوفة المهام
        </h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          صنّف كل مهمة بصدق، ثم ارفع ثلاثًا فقط إلى «أهم ٣ مهام» بأيقونة الهدف{" "}
          <Target size={12} className="mx-0.5 inline" /> — والباقي لليوم بأيقونة
          الشمس <span aria-hidden="true">☀️</span> — أو اتركه في المخزن هنا.
          أعطِ كل مهمة وقتها المتوقع وتاريخها، وستعرف كم ساعة أمامك فعلًا.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            id="los-task-new"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="مهمة جديدة…"
          />
          <div className="flex flex-wrap gap-2">
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
            {/* 👇 قائمة اختيار الهدف عند الإضافة 👇 */}
            <select
              value={draftGoal}
              onChange={(e) => setDraftGoal(e.target.value)}
              aria-label="الهدف المرتبط"
              className="rounded-xl border bg-transparent px-3 py-2.5 text-xs outline-none"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <option value="" style={{ background: T.cardSolid }}>— ربط بهدف —</option>
              {(state.goals || []).filter(g => !g.done).map(g => (
                <option key={g.id} value={g.id} style={{ background: T.cardSolid }}>{g.text}</option>
              ))}
            </select>
            <Btn variant="default" onClick={add} className="shrink-0">
              <Plus size={15} strokeWidth={3} /> إضافة
            </Btn>
          </div>
        </div>
      </Card>

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        {QUADRANTS.map((q) => (
          <QuadrantCard
            key={q.id}
            q={q}
            tasks={state.tasks}
            goals={state.goals} // <--- تمرير الأهداف لبطاقة المهام
            over={over === q.id}
            dragProps={dragProps(q.id)}
            draggingId={draggingId}
            onDragStart={setDraggingId}
            onDragEnd={() => setDraggingId(null)}
            onDropTask={onDropTask}
            onPatch={patch}
            onToggleToday={toggleToday}
            onToggleScheduled={toggleScheduled}
            onEdit={(id, fields) => patch(id, fields)}
            onDelete={remove}
          />
        ))}
      </div>
    </div>
  );
}

function QuadrantCard({
  q,
  tasks,
  goals, // <--- استقبال الأهداف
  over,
  dragProps,
  draggingId,
  onDragStart,
  onDragEnd,
  onDropTask,
  onPatch,
  onToggleToday,
  onToggleScheduled,
  onEdit,
  onDelete,
}) {
  const [showDone, setShowDone] = useState(false);
  const open = useMemo(() => orderedOpen(tasks, q.id), [tasks, q.id]);
  const done = useMemo(() => orderedDone(tasks, q.id), [tasks, q.id]);
  const est = estimateTotal(tasks, q.id);
  const wip = wipOf(tasks, q.id);
  const cap = QUADRANT_WIP[q.id];
  const Icon = q.icon;

  const wipTone = wip === "chaos" ? T.danger : wip === "crowded" ? T.accent : "transparent";

  return (
    <Card
      {...dragProps}
      className="flex min-h-[200px] min-w-0 flex-col overflow-hidden p-5 transition-all duration-200"
      style={{
        ...GLASS,
        borderColor: over ? `${q.tint}B3` : T.border,
        backgroundColor: over ? `${q.tint}2E` : T.card,
        boxShadow: over
          ? `0 0 0 1px ${q.tint}59, ${GLASS.boxShadow}`
          : GLASS.boxShadow,
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
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] font-bold" style={{ color: q.tint }}>
            {q.label}
          </h3>
          <p className="text-[10.5px]" style={{ color: T.faint }}>
            {q.action}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-[11px] font-bold tabular-nums" style={{ color: T.muted }}>
            {open.length}
          </span>
          {est > 0 && (
            <span
              className="flex items-center gap-0.5 text-[10px] tabular-nums"
              style={{ color: T.faint }}
              title={`مجموع الوقت المتوقع: ${Math.floor(est / 60)} س ${est % 60} د`}
            >
              <Clock size={9} />
              <span dir="ltr">
                {Math.floor(est / 60)}:{String(est % 60).padStart(2, "0")}
              </span>
            </span>
          )}
        </div>
      </div>

      {wip !== "calm" && (
        <p
          className="mt-3 flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px] leading-tight"
          style={{
            borderColor: `${wipTone}4D`,
            background: `${wipTone}12`,
            color: wipTone,
          }}
        >
          <AlertTriangle size={11} className="mt-[2px] shrink-0" />
          <span>
            {wip === "chaos"
              ? `${open.length} مهمة هنا — هذه ليست قائمة، هذه فوضى. أعد التصنيف أو احذف.`
              : `تجاوزت ${cap} مهام. حدّد أيهم تُنفَّذ الآن، والباقي أرجئه.`}
          </span>
        </p>
      )}

      <div className="mt-4 flex-1 space-y-2">
        {open.length === 0 ? (
          <p
            className="py-6 text-center text-[11px]"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            فارغ
          </p>
        ) : (
          open.map((t) => (
            <TaskChip
              key={t.id}
              task={t}
              goals={goals} // <--- تمرير الأهداف للـ TaskChip
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", t.id);
                e.dataTransfer.effectAllowed = "move";
                onDragStart(t.id);
              }}
              onDragEnd={onDragEnd}
              onDragOver={(e) => {
                if (draggingId && draggingId !== t.id) e.preventDefault();
              }}
              onDrop={onDropTask(t.id)}
              onToggleDone={() => onPatch(t.id, { done: !t.done })}
              onToggleToday={() => onToggleToday(t)}
              onToggleScheduled={() => onToggleScheduled(t)}
              onEdit={(fields) => onEdit(t.id, fields)}
              onDelete={() => onDelete(t.id)}
            />
          ))
        )}
      </div>

      {done.length > 0 && (
        <div className="mt-3 border-t pt-3" style={{ borderColor: T.border }}>
          <button
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-[10.5px] transition-colors hover:bg-white/5"
            style={{ color: T.faint }}
          >
            <span className="flex items-center gap-1.5">
              <span className="font-bold" style={{ color: T.primary }}>
                {done.length}
              </span>
              منجزة
            </span>
            <span className="text-[9px] opacity-60">
              {showDone ? "إخفاء" : "إظهار"}
            </span>
          </button>
          {showDone && (
            <div className="los-in mt-2 space-y-1.5 opacity-60">
              {done.map((t) => (
                <TaskChip
                  key={t.id}
                  task={t}
                  goals={goals} // <--- تمرير الأهداف للـ TaskChip
                  compact
                  onToggleDone={() => onPatch(t.id, { done: !t.done })}
                  onToggleToday={() => onToggleToday(t)}
                  onDelete={() => onDelete(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function TomorrowModal({ open, onClose, state, setState }) {
  const arm = useUndo();
  const [capHit, fireCapHit] = useBurst(2800);
  const [draft, setDraft] = useState("");

  const on = tomorrowKey();
  const prep = prepShape(state.tomorrow);
  const picks = prep.for === on ? prep.picks : [];
  const byId = useMemo(
    () => new Map((state.tasks || []).map((t) => [t.id, t])),
    [state.tasks]
  );
  const rowsOf = picks
    .map((p) => ({ pick: p, task: byId.get(p.task) }))
    .filter((r) => r.task);
  const slots = [...Array(TOP_TASK_CAP)].map((_, i) => rowsOf[i] || null);
  const full = rowsOf.length >= TOP_TASK_CAP;

  const pool = useMemo(() => {
    const rank = { q1: 0, q2: 1, q3: 2, q4: 3 };
    return (state.tasks || [])
      .filter((t) => !t.done && !picks.some((p) => p.task === t.id))
      .map((t, i) => ({ t, i }))
      .sort((a, b) => {
        if (!!a.t.scheduled !== !!b.t.scheduled)
          return a.t.scheduled ? -1 : 1;
        const ra = rank[a.t.quadrant] ?? 9;
        const rb = rank[b.t.quadrant] ?? 9;
        if (ra !== rb) return ra - rb;
        return a.i - b.i;
      })
      .map((x) => x.t);
  }, [state.tasks, picks]);

  const eventOf = (p) =>
    p.event ? (state.events || []).find((e) => e.id === p.event) || null : null;

  const pick = (id) => {
    if (full) {
      fireCapHit();
      return;
    }
    setState((s) => ({ ...s, tomorrow: prepPickAdd(s.tomorrow, id, tomorrowKey()) }));
  };

  const setStep = (id, text) =>
    setState((s) => ({
      ...s,
      tasks: (s.tasks || []).map((t) =>
        t.id === id ? { ...t, step: String(text).slice(0, STEP_MAX) } : t
      ),
    }));

  const setTime = (p, raw) =>
    setState((s) => {
      const time = hhmm(raw);
      const day = tomorrowKey();
      const task = (s.tasks || []).find((t) => t.id === p.task);
      let events = s.events || [];
      let id = p.event;
      if (!time) {
        if (id) events = events.filter((e) => e.id !== id);
        id = null;
      } else if (id && events.some((e) => e.id === id)) {
        events = events.map((e) => (e.id === id ? { ...e, date: day, time } : e));
      } else {
        const ev = eventShape({
          date: day,
          time,
          kind: "note",
          title: (task?.text || "").trim() || "مهمة الغد",
          warn: 0,
        });
        events = [...events, ev];
        id = ev.id;
      }
      return { ...s, events, tomorrow: prepPickEvent(s.tomorrow, p.task, id) };
    });

  const drop = (p) => {
    arm("أُزيلت من تجهيز الغد", {
      events: state.events,
      tomorrow: state.tomorrow,
    });
    setState((s) => ({
      ...s,
      events: p.event
        ? (s.events || []).filter((e) => e.id !== p.event)
        : s.events || [],
      tomorrow: prepPickDrop(s.tomorrow, p.task),
    }));
  };

  const addAndPick = () => {
    const text = draft.trim();
    if (!text) return;
    if (full) {
      fireCapHit();
      return;
    }
    const t = taskShape({
      text,
      quadrant: "q2",
      createdAt: dayKey(),
    });
    setState((s) => ({
      ...s,
      tasks: [...(s.tasks || []), t],
      tomorrow: prepPickAdd(s.tomorrow, t.id, tomorrowKey()),
    }));
    setDraft("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="جهّز غدك"
      footer={
        <Btn variant="default" className="flex-1" onClick={onClose}>
          تمّ — نراه غدًا
        </Btn>
      }
    >
      <div className="space-y-5">
        <p
          className="rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.violet}3D`,
            background: `${T.violet}12`,
            color: T.muted,
          }}
        >
          ثلاث مهام لـ{" "}
          <span className="font-extrabold" style={{ color: T.violet }}>
            {arDate(on)}
          </span>
          . اكتب لكل واحدة أول خطوة — الخطوة هي ما يتحرّك، لا العنوان. ما
          تختاره الليلة يصبح «أهم ٣ مهام» حين يبدأ الغد.
        </p>

        <div className="space-y-3">
          {slots.map((row, i) =>
            row ? (
              <div
                key={row.pick.task}
                className="rounded-2xl border p-3.5"
                style={{
                  borderColor: `${T.cta}3D`,
                  backgroundColor: `${T.cta}0A`,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                    style={{ background: `${T.cta}26`, color: T.ctaLift }}
                  >
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 pt-1 text-[13px] font-bold leading-snug text-white/85">
                    {row.task.text}
                  </p>
                  <button
                    onClick={() => drop(row.pick)}
                    aria-label={`أزل ${row.task.text} من تجهيز الغد`}
                    title="أزل من غدك"
                    className="shrink-0 rounded-lg border p-1.5 text-white/30 transition-colors hover:text-red-400"
                    style={{ borderColor: T.border }}
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label
                      htmlFor={`los-step-${row.task.id}`}
                      className="mb-1.5 flex items-center gap-1.5 text-[11px] text-white/45"
                    >
                      <Footprints size={11} style={{ color: T.cta }} /> أول خطوة
                    </label>
                    <Field
                      id={`los-step-${row.task.id}`}
                      value={row.task.step || ""}
                      maxLength={STEP_MAX}
                      onChange={(e) => setStep(row.task.id, e.target.value)}
                      placeholder="أصغر شيء يبدأ الحركة…"
                    />
                  </div>
                  <div className="sm:w-36">
                    <label
                      htmlFor={`los-time-${row.task.id}`}
                      className="mb-1.5 flex items-center gap-1.5 text-[11px] text-white/45"
                    >
                      <Clock size={11} style={{ color: T.violet }} /> وقت محدد
                    </label>
                    <TimeField
                      id={`los-time-${row.task.id}`}
                      value={eventOf(row.pick)?.time || ""}
                      onChange={(v) => setTime(row.pick, v)}
                    />
                  </div>
                </div>

                {!!eventOf(row.pick) && (
                  <p
                    className="mt-2 flex items-center gap-1.5 text-[10.5px]"
                    style={{ color: T.primary }}
                  >
                    <CalendarPlus size={11} /> موعد في التقويم{" "}
                    <span dir="ltr" className="font-bold tabular-nums">
                      {prettyTime(eventOf(row.pick).time)}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div
                key={`slot-${i}`}
                className="flex items-center gap-2.5 rounded-2xl border border-dashed px-3.5 py-4"
                style={{ borderColor: T.border }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: T.faint,
                  }}
                >
                  {i + 1}
                </span>
                <p className="text-[11.5px]" style={{ color: T.faint }}>
                  اختر مهمة من الأسفل.
                </p>
              </div>
            )
          )}
        </div>

        {full ? (
          <p
            className={`rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] leading-relaxed${
              capHit ? " los-pop" : ""
            }`}
            style={{
              borderColor: `${T.accent}3D`,
              background: `${T.accent}12`,
              color: T.accent,
            }}
          >
            ثلاث فقط — هذا هو الشرط. أزل واحدة قبل أن تضع غيرها.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-[11px] font-bold" style={{ color: T.muted }}>
              مهامك غير المنجزة
            </p>
            {pool.length ? (
              <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pl-1">
                {pool.map((t) => {
                  const q = QUADRANTS.find((x) => x.id === t.quadrant) || QUADRANTS[1];
                  return (
                    <button
                      key={t.id}
                      onClick={() => pick(t.id)}
                      className="flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11.5px] transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: `${q.tint}40`,
                        backgroundColor: `${q.tint}12`,
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {t.scheduled ? (
                        <Sun
                          size={11}
                          strokeWidth={2.6}
                          style={{ color: SKY }}
                        />
                      ) : (
                        <Plus
                          size={11}
                          strokeWidth={3}
                          style={{ color: q.tint }}
                        />
                      )}
                      <span className="truncate">{t.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p
                className="rounded-xl border border-dashed px-3 py-4 text-center text-[11.5px]"
                style={{ borderColor: T.border, color: T.faint }}
              >
                لا مهام غير منجزة. اكتب واحدة تحت.
              </p>
            )}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Field
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAndPick()}
                placeholder="أو اكتب مهمة جديدة لغدٍ…"
                aria-label="مهمة جديدة لغد"
              />
              <Btn variant="outline" onClick={addAndPick} disabled={!draft.trim()}>
                <Plus size={14} strokeWidth={3} /> أضفها واخترها
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

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