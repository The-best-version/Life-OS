import { TaskChip, TopThree } from "../components/life-day.jsx";
import { Btn, Card, Field, GLASS, Modal, T, TimeField, arDate, prettyTime, useBurst, useUndo } from "../components/life-shared.jsx";
import { STEP_MAX, TOP_TASK_CAP, capToday, eventShape, hhmm, prepPickAdd, prepPickDrop, prepPickEvent, prepShape, taskShape, tomorrowKey } from "../state/life-state.mjs";
import { CalendarPlus, Clock, Footprints, Plus, Target, Trash, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";

export function MatrixModule({ state, setState }) {
  const [draft, setDraft] = useState("");
  const [draftQ, setDraftQ] = useState("q2");
  const [over, setOver] = useState(null);
  const [capHit, fireCapHit] = useBurst(2800);
  const arm = useUndo();

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setState((s) => ({
      ...s,
      /* Through the one shape, so the matrix's form and the evening prep's
         cannot drift into writing two different kinds of task. */
      tasks: [...s.tasks, taskShape({ text, quadrant: draftQ })],
    }));
    setDraft("");
  };

  const patch = (id, p) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));

  /* The cap is the whole point of the rule, so a fourth pick is refused
     outright rather than quietly hidden — and it says why. `capToday`
     re-asserts it on the way out, because this is no longer the only door:
     the evening prep promotes three of its own at the rollover. */
  const promote = (id) => {
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.today) return;
    if (state.tasks.filter((x) => x.today).length >= TOP_TASK_CAP) {
      fireCapHit();
      return;
    }
    setState((s) => ({
      ...s,
      tasks: capToday(s.tasks.map((x) => (x.id === id ? { ...x, today: true } : x))),
    }));
  };

  const toggleToday = (t) =>
    t.today ? patch(t.id, { today: false }) : promote(t.id);

  const remove = (id) => {
    arm("حُذفت المهمة", { tasks: state.tasks });
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  };

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
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">مصفوفة المهام</h2>
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
                borderColor: over === q.id ? `${q.tint}B3` : T.border,
                backgroundColor: over === q.id ? `${q.tint}2E` : T.card,
                boxShadow:
                  over === q.id
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
 *  جهّز غدك — the three picked the night before
 *
 *  A day's three tasks get chosen the night before or they get chosen at
 *  ten in the morning by whatever shouted loudest. This is the screen that
 *  asks for them, and it owns no store of its own: a pick is a task id out
 *  of the same `state.tasks` the matrix edits, the first step is written
 *  onto that task row, and the hour goes onto the calendar as a real entry
 *  rather than a second copy of a time. `rollDay` then promotes exactly
 *  those three and spends the prep — the arithmetic is `applyPrep` in
 *  life-state.mjs, under test, and nothing here recomputes any of it.
 * ==================================================================== */
export function TomorrowModal({ open, onClose, state, setState }) {
  const arm = useUndo();
  const [capHit, fireCapHit] = useBurst(2800);
  const [draft, setDraft] = useState("");

  /* Recomputed on every render rather than captured when the modal opened:
     a window left open across 04:00 would otherwise be preparing a day that
     has already started. */
  const on = tomorrowKey();
  const prep = prepShape(state.tomorrow);
  const picks = prep.for === on ? prep.picks : [];
  const byId = useMemo(
    () => new Map((state.tasks || []).map((t) => [t.id, t])),
    [state.tasks],
  );
  const rowsOf = picks.map((p) => ({ pick: p, task: byId.get(p.task) })).filter((r) => r.task);
  const slots = [...Array(TOP_TASK_CAP)].map((_, i) => rowsOf[i] || null);
  const full = rowsOf.length >= TOP_TASK_CAP;

  const pool = (state.tasks || []).filter(
    (t) => !t.done && !picks.some((p) => p.task === t.id),
  );

  /* The event a pick's hour lives in, looked up rather than remembered. */
  const eventOf = (p) =>
    p.event ? (state.events || []).find((e) => e.id === p.event) || null : null;

  const pick = (id) => {
    /* The cap is refused in `prepPickAdd` whatever this does; the screen's
       job is only to say why. */
    if (full) {
      fireCapHit();
      return;
    }
    setState((s) => ({ ...s, tomorrow: prepPickAdd(s.tomorrow, id, tomorrowKey()) }));
  };

  /* Written straight onto the task row, keystroke by keystroke. Held in
     local state and committed on close was the other option and is worse:
     a step typed and then dismissed with Escape is text the user wrote,
     and this app does not lose that. */
  const setStep = (id, text) =>
    setState((s) => ({
      ...s,
      tasks: (s.tasks || []).map((t) =>
        t.id === id ? { ...t, step: String(text).slice(0, STEP_MAX) } : t,
      ),
    }));

  /* An hour is a calendar entry, not a field on the prep. Setting one
     creates it, changing one moves it, clearing one deletes it — and the
     pick only ever remembers which entry it is. */
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
        /* Only the two fields this screen owns. A title he rewrote on the
           calendar is his, and a repeat he set there stays set. */
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

  /* Removing a pick deletes the calendar entry its hour created, so it is
     armed like every other destructive button in this tree. The whole
     arrays go in, never the rows. */
  const drop = (p) => {
    arm("أُزيلت من تجهيز الغد", {
      events: state.events,
      tomorrow: state.tomorrow,
    });
    setState((s) => ({
      ...s,
      events: p.event ? (s.events || []).filter((e) => e.id !== p.event) : s.events || [],
      tomorrow: prepPickDrop(s.tomorrow, p.task),
    }));
  };

  /* A task that does not exist yet. Without this, preparing tomorrow at
     22:00 means going to the matrix first — and a screen that sends you
     somewhere else to be used is a screen you stop opening. It lands in
     «مهم غير عاجل» like every other undecided task, through the one shape. */
  const addAndPick = () => {
    const text = draft.trim();
    if (!text) return;
    if (full) {
      fireCapHit();
      return;
    }
    const t = taskShape({ text, quadrant: "q2" });
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
                style={{ borderColor: `${T.cta}3D`, backgroundColor: `${T.cta}0A` }}
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
                  style={{ background: "rgba(255,255,255,0.06)", color: T.faint }}
                >
                  {i + 1}
                </span>
                <p className="text-[11.5px]" style={{ color: T.faint }}>
                  اختر مهمة من الأسفل.
                </p>
              </div>
            ),
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
                      <Plus size={11} strokeWidth={3} style={{ color: q.tint }} />
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


