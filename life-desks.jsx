import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCheck,
  Copy,
  NotebookPen,
  Pause,
  Pencil,
  Play,
  Plus,
  Square,
  Swords,
  Target,
  Timer,
  Trash2,
} from "lucide-react";
import {
  T,
  Card,
  Btn,
  Field,
  Badge,
  Modal,
  useBurst,
  usePrefersReducedMotion,
} from "./life-shared.jsx";
import { dayKey, logicalNow, rows, uid } from "./life-state.mjs";

/* ==================================================================== *
 *  THE FOUR DESKS — the places work is staged rather than scored
 *
 *  Four screens that have nothing to do with the habit score and
 *  everything to do with the week: the prompt vault, the tactical weekly
 *  review, the kanban sprint board, and the deep-work timer. They were
 *  carved out of LifeOS.jsx together because they share a shape rather
 *  than a dependency — each one reads one array off the state, writes
 *  back to it, and touches nothing the day's arithmetic reads. Nothing
 *  here feeds `disciplineOf`, which is why the seam crosses all four in
 *  exactly four places: the four modules this file exports.
 *
 *  `LANES` and `SESSIONS` came with them. Both lived in the table block
 *  near the top of LifeOS.jsx and both were read by one module in this
 *  file and by nothing else in the tree, so they are internal here and
 *  deliberately NOT exported — same reason `money` is internal to
 *  life-finance.jsx: a name exported but used nowhere else is a name the
 *  seam test has to reason about for nothing.
 * ==================================================================== */

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

export function PromptsModule({ state, setState }) {
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
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
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
const weekKey = (d = logicalNow()) => {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - ((t.getDay() + 1) % 7)); // weeks start Saturday
  return dayKey(t);
};

export function TacticalModule({ state, setState }) {
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
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
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
export function PipelineModule({ state, setState }) {
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
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
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
export function DeepWorkModule({ state, setState }) {
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
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
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
