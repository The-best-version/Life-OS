import { TaskChip, TopThree } from "../components/life-day.jsx";
import {
  Badge,
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
  Brain,
  CalendarPlus,
  Check,
  Clock,
  Flame,
  Footprints,
  Plus,
  Sparkles,
  Sun,
  Target,
  Trash,
  X,
  Zap,
  Kanban,
  LayoutGrid,
  Loader2,
  Play,
  RotateCcw,
  Tag,
  Coffee,
  Laptop,
} from "lucide-react";
import { runLifeAgent } from "../utils/life-agent.js";
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

  // ميزة التبديل بين عرض المصفوفة وعرض كانبان 📋
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" | "kanban"
  // ميزة الذكاء الاصطناعي لتفكيك المهام (AI Task Breaker) 🪄
  const [breakingTaskId, setBreakingTaskId] = useState(null);
  const [aiBreakModal, setAiBreakModal] = useState(null); // { task, steps: [] }
  const [isBreaking, setIsBreaking] = useState(false);

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

  // تفكيك المهمة بالذكاء الاصطناعي
  const handleBreakTaskAI = async (task) => {
    setIsBreaking(true);
    setBreakingTaskId(task.id);
    try {
      const prompt = `قم بتفكيك المهمة التالية إلى ٣ خطوات عملية مصغرة وسهلة البدء يمكن إنجاز كل منها في ١٥ دقيقة:\nالمهمة: "${task.text}"\nأعطني الخطوات بنقاط واضحة.`;
      const reply = await runLifeAgent(prompt, [], state, setState, { mode: "executive" });
      const text = typeof reply === "string" ? reply : reply?.text || "";
      const lines = text
        .split("\n")
        .map((l) => l.replace(/^[0-9.-•*\s]+/, "").trim())
        .filter((l) => l.length > 3)
        .slice(0, 4);

      setAiBreakModal({
        task,
        steps: lines.length ? lines : ["خطوة البدء الأولى: فتح الملف وقراءة أول سطرين", "إعداد المسودة الأساسية", "المراجعة النهائية"],
      });
    } catch {
      setAiBreakModal({
        task,
        steps: ["الخطوة الأولى: تجهيز الأدوات وفتح الملف", "الخطوة الثانية: العمل المركز لمدة ١٥ دقيقة", "الخطوة الثالثة: إغلاق المهمة"],
      });
    } finally {
      setIsBreaking(false);
      setBreakingTaskId(null);
    }
  };

  const applySubTasks = (parentTask, steps) => {
    setState((s) => ({
      ...s,
      tasks: [
        ...s.tasks.map((t) => (t.id === parentTask.id ? { ...t, step: steps[0] } : t)),
        ...steps.slice(1).map((stepText) =>
          taskShape({
            text: `${parentTask.text} ➔ ${stepText}`,
            quadrant: parentTask.quadrant || "q2",
            linkedGoalId: parentTask.linkedGoalId,
            today: parentTask.today,
          })
        ),
      ],
    }));
    setAiBreakModal(null);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
              مصفوفة المهام
            </h2>
            <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-white/40">
              صنّف كل مهمة بصدق، ثم ارفع ثلاثًا فقط إلى «أهم ٣ مهام» — أو بدّل إلى عرض كانبان أثناء العمل.
            </p>
          </div>

          {/* تبديل العرض بين المصفوفة وكانبان 📋 */}
          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "matrix"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <LayoutGrid size={13} />
              <span>المصفوفة</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Kanban size={13} />
              <span>كانبان</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row items-stretch sm:items-center">
          <input
            id="los-task-new"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="اكتب مهمة جديدة هنا ثم اضغط Enter أو إضافة..."
            className="flex-1 w-full rounded-xl border bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              aria-label="الربع"
              className="rounded-xl border bg-black/50 px-3.5 py-3 text-xs font-bold text-white outline-none focus:border-indigo-400"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              {QUADRANTS.map((q) => (
                <option key={q.id} value={q.id} style={{ background: "#111" }}>
                  {q.label}
                </option>
              ))}
            </select>
            <select
              value={draftGoal}
              onChange={(e) => setDraftGoal(e.target.value)}
              aria-label="الهدف المرتبط"
              className="rounded-xl border bg-black/50 px-3.5 py-3 text-xs font-bold text-white outline-none focus:border-indigo-400 max-w-[160px] truncate"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <option value="" style={{ background: "#111" }}>— ربط بهدف (اختياري) —</option>
              {(state.goals || []).filter(g => !g.done).map(g => (
                <option key={g.id} value={g.id} style={{ background: "#111" }}>{g.text}</option>
              ))}
            </select>
            <Btn variant="default" onClick={add} className="shrink-0 py-3 px-5 font-bold">
              <Plus size={16} strokeWidth={3} /> إضافة
            </Btn>
          </div>
        </div>
      </Card>

      {/* 👇 الركيزة الثانية: الجدولة حسب منحنى الطاقة والبيولوجيا 👇 */}
      <CircadianEnergyCard state={state} setState={setState} />

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

      {viewMode === "matrix" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          {QUADRANTS.map((q) => (
            <QuadrantCard
              key={q.id}
              q={q}
              tasks={state.tasks}
              goals={state.goals}
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
              onBreakAI={handleBreakTaskAI}
              isBreakingId={breakingTaskId}
            />
          ))}
        </div>
      ) : (
        /* 📋 عرض كانبان السلس (Kanban View) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 [&>*]:min-w-0">
          <KanbanColumn
            title="📥 الوارد وقيد الانتظار"
            tint={T.sky}
            tasks={state.tasks.filter((t) => !t.today && !t.done)}
            goals={state.goals}
            onPatch={patch}
            onToggleToday={toggleToday}
            onToggleScheduled={toggleScheduled}
            onEdit={(id, fields) => patch(id, fields)}
            onDelete={remove}
            onBreakAI={handleBreakTaskAI}
            isBreakingId={breakingTaskId}
          />
          <KanbanColumn
            title="⚡ قيد التنفيذ اليوم"
            tint={T.primary}
            tasks={state.tasks.filter((t) => t.today && !t.done)}
            goals={state.goals}
            onPatch={patch}
            onToggleToday={toggleToday}
            onToggleScheduled={toggleScheduled}
            onEdit={(id, fields) => patch(id, fields)}
            onDelete={remove}
            onBreakAI={handleBreakTaskAI}
            isBreakingId={breakingTaskId}
          />
          <KanbanColumn
            title="✅ تم الإنجاز"
            tint={T.accent}
            tasks={state.tasks.filter((t) => t.done)}
            goals={state.goals}
            onPatch={patch}
            onToggleToday={toggleToday}
            onToggleScheduled={toggleScheduled}
            onEdit={(id, fields) => patch(id, fields)}
            onDelete={remove}
            onBreakAI={handleBreakTaskAI}
            isBreakingId={breakingTaskId}
          />
        </div>
      )}

      {/* نافذة تفكيك المهمة بالذكاء الاصطناعي 🪄 */}
      {aiBreakModal && (
        <Modal
          open={!!aiBreakModal}
          onClose={() => setAiBreakModal(null)}
          title="🪄 تفكيك المهمة بالذكاء الاصطناعي"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <span className="text-[10.5px] font-bold text-indigo-300 block mb-0.5">المهمة الأصلية:</span>
              <p className="text-sm font-black text-white">{aiBreakModal.task.text}</p>
            </div>

            <p className="text-xs text-white/60">
              إليك خطوات مصغرة ومحددة تبدأ بكل وضوح وتنهي التسويف:
            </p>

            <div className="space-y-2">
              {aiBreakModal.steps.map((step, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-white/10 bg-black/40 flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-white/90">{step}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="ghost" onClick={() => setAiBreakModal(null)}>
                إلغاء
              </Btn>
              <Btn
                variant="default"
                onClick={() => applySubTasks(aiBreakModal.task, aiBreakModal.steps)}
              >
                <Check size={14} /> اعتماد الخطوات في المصفوفة
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function QuadrantCard({
  q,
  tasks,
  goals,
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
  onBreakAI,
  isBreakingId,
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

/* 📋 مكون عمود كانبان (Kanban Column) */
function KanbanColumn({
  title,
  tint,
  tasks,
  goals,
  onPatch,
  onToggleToday,
  onToggleScheduled,
  onEdit,
  onDelete,
  onBreakAI,
  isBreakingId,
}) {
  return (
    <Card
      className="flex min-h-[300px] flex-col p-4 border"
      style={{
        borderColor: `${tint}30`,
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
        <h4 className="text-xs font-black text-white flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tint }} />
          {title}
        </h4>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono"
          style={{ backgroundColor: `${tint}20`, color: tint }}
        >
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar pr-1">
        {tasks.length === 0 ? (
          <p className="py-12 text-center text-xs text-white/20 italic">لا توجد مهام هنا</p>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="relative group/kanban">
              <TaskChip
                task={t}
                goals={goals}
                onToggleDone={() => onPatch(t.id, { done: !t.done })}
                onToggleToday={() => onToggleToday(t)}
                onToggleScheduled={() => onToggleScheduled(t)}
                onEdit={(fields) => onEdit(t.id, fields)}
                onDelete={() => onDelete(t.id)}
              />

              {!t.done && (
                <div className="mt-1 flex items-center justify-end gap-1.5 opacity-60 group-hover/kanban:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onBreakAI(t)}
                    disabled={isBreakingId === t.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-[9.5px] font-bold text-indigo-300 hover:bg-indigo-500/25 transition-all"
                    title="تفكيك المهمة لخطوات مصغرة بالذكاء الاصطناعي"
                  >
                    {isBreakingId === t.id ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Sparkles size={10} />
                    )}
                    <span>تفكيك 🪄</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
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

/* ============================================================================
 * الركيزة 2: نظام منحنى الطاقة الحيوية والجدولة البيولوجية (Circadian Rhythm Scheduling)
 * يطابق مهام مصفوفة أيزنهاور مع الطاقة الذهنية وساعات النوم والفترات البيولوجية لليوم
 * ============================================================================ */
const BIO_STORAGE_KEY = "los_bio_energy_v1";

const ENERGY_MODES = [
  {
    id: "peak",
    label: "طاقة عالية (ذروة) 🔥",
    score: 92,
    tint: "#10b981",
    desc: "نوم ممتاز وذهن صافٍ — يوم مثالي لاقتحام أصعب ٣ مهام استراتيجية (Q1 & Q2).",
    recCap: 3,
  },
  {
    id: "balanced",
    label: "طاقة متوازنة ⚖️",
    score: 75,
    tint: "#38bdf8",
    desc: "طاقة طبيعية — ركّز على مهمتين أساسيتين ومهمة سريعة لبناء الزخم.",
    recCap: 2,
  },
  {
    id: "low",
    label: "إرهاق / نوم قليل 🛡️",
    score: 45,
    tint: "#f59e0b",
    desc: "وضع حماية السلسلة — نكتفي بمهمة واحدة حاسمة اليوم والنسخ الصغيرة من العادات.",
    recCap: 1,
  },
];

const CIRCADIAN_ZONES = [
  {
    id: "zone-peak",
    title: "١. الذروة المعرفية (الصباح — بعد الفجر والضحى)",
    range: [4, 12],
    quadrant: "Q1 + Q2 (مهام عميقة وتفكير معقد)",
    tint: "#10b981",
  },
  {
    id: "zone-trough",
    title: "٢. الهبوط البيولوجي (بعد الظهر — العصر)",
    range: [12, 16],
    quadrant: "Q3 (مهام إدارية، ردود سريعة، أو قيلولة وتمرين)",
    tint: "#f59e0b",
  },
  {
    id: "zone-recovery",
    title: "٣. الانتعاش الإبداعي (المغرب — العشاء)",
    range: [16, 23],
    quadrant: "Q2 (تخطيط مشاريع، قراءة، وتجهيز الغد)",
    tint: "#8b5cf6",
  },
];

function CircadianEnergyCard({ state, setState }) {
  const today = dayKey();
  const [bio, setBio] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BIO_STORAGE_KEY) || "{}");
      if (saved && saved.date === today) return saved;
    } catch {}
    return { date: today, mode: "balanced", sleepHours: 7 };
  });
  const [appliedToast, setAppliedToast] = useState("");

  const saveBio = (patchObj) => {
    setBio((prev) => {
      const next = { ...prev, ...patchObj, date: today };
      try {
        localStorage.setItem(BIO_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const currentHour = new Date().getHours();
  const activeZone =
    CIRCADIAN_ZONES.find(
      (z) => currentHour >= z.range[0] && currentHour < z.range[1]
    ) || CIRCADIAN_ZONES[0];

  const modeMeta =
    ENERGY_MODES.find((m) => m.id === bio.mode) || ENERGY_MODES[1];

  // إعادة هندسة مهام اليوم تلقائياً بناءً على الطاقة الحيوية الحالية
  const handleAutoScheduleByEnergy = () => {
    setState((prev) => {
      const allTasks = prev.tasks || [];
      const openTasks = allTasks.filter((t) => !t.done);
      if (!openTasks.length) return prev;

      let chosenIds = [];
      if (bio.mode === "low") {
        // في حالة الإرهاق: نختار مهمة واحدة فقط (الأقصر وقتاً أو العاجلة جداً Q1)
        const sortedLow = [...openTasks].sort((a, b) => {
          const aScore = (a.quadrant === "q1" ? 0 : 10) + (Number(a.estimate) || 25);
          const bScore = (b.quadrant === "q1" ? 0 : 10) + (Number(b.estimate) || 25);
          return aScore - bScore;
        });
        chosenIds = sortedLow.slice(0, 1).map((t) => t.id);
      } else if (bio.mode === "peak") {
        // في حالة الذروة: نختار أهم ٣ مهام استراتيجية (المرتبطة بأهداف 2030 و Q1/Q2)
        const sortedPeak = [...openTasks].sort((a, b) => {
          const aRank =
            (a.linkedGoalId ? -5 : 0) +
            (a.quadrant === "q1" ? 1 : a.quadrant === "q2" ? 2 : 5);
          const bRank =
            (b.linkedGoalId ? -5 : 0) +
            (b.quadrant === "q1" ? 1 : b.quadrant === "q2" ? 2 : 5);
          return aRank - bRank;
        });
        chosenIds = sortedPeak.slice(0, TOP_TASK_CAP).map((t) => t.id);
      } else {
        // الوضع المتوازن: مهمتان من Q1/Q2 + مهمة سريعة
        const sortedBal = [...openTasks].sort((a, b) => {
          const aRank = a.quadrant === "q1" ? 1 : a.quadrant === "q2" ? 2 : 4;
          const bRank = b.quadrant === "q1" ? 1 : b.quadrant === "q2" ? 2 : 4;
          return aRank - bRank;
        });
        chosenIds = sortedBal.slice(0, 2).map((t) => t.id);
      }

      const chosenSet = new Set(chosenIds);
      const nextTasks = capToday(
        allTasks.map((t) => {
          if (t.done) return t;
          if (chosenSet.has(t.id)) {
            return { ...t, today: true, scheduled: false };
          }
          if (t.today) {
            return { ...t, today: false, scheduled: true };
          }
          return t;
        })
      );

      return { ...prev, tasks: nextTasks };
    });

    setAppliedToast(
      bio.mode === "low"
        ? "تم تفعيل وضع حماية الطاقة: تم تقليص مهام اليوم إلى مهمة واحدة حاسمة وتأجيل الباقي! 🛡️"
        : bio.mode === "peak"
          ? "تم تفعيل وضع الذروة: رُفعت أهم ٣ مهام استراتيجية (Q1/Q2) إلى قائمة اليوم! 🔥"
          : "تمت موازنة مهام اليوم حسب منحنى طاقتك المعتدل! ⚖️"
    );
    setTimeout(() => setAppliedToast(""), 4000);
  };

  return (
    <Card className="p-5 sm:p-6 border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-sky-500/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${modeMeta.tint}55`,
              backgroundColor: `${modeMeta.tint}18`,
              color: modeMeta.tint,
            }}
          >
            <Brain size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16.5px] font-extrabold text-white">
                منحنى الطاقة والجدولة البيولوجية (Circadian Readiness)
              </h3>
              <Badge tint={modeMeta.tint}>
                جاهزية اليوم: {modeMeta.score}%
              </Badge>
            </div>
            <p className="mt-0.5 text-[11.5px] text-white/50">
              طابق صعوبة مهامك مع طاقتك الحيوية وساعات نومك بدلاً من إجبار نفسك على جدول جامد
            </p>
          </div>
        </div>

        <Btn variant="default" size="sm" onClick={handleAutoScheduleByEnergy}>
          <Sparkles size={14} /> هندسة مهام اليوم حسب طاقتي الآن
        </Btn>
      </div>

      {appliedToast && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2 text-[12px] font-bold text-emerald-300">
          <Check size={15} />
          <span>{appliedToast}</span>
        </div>
      )}

      {/* اختيار مستوى الطاقة وساعات النوم */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
        {ENERGY_MODES.map((m) => {
          const active = bio.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => saveBio({ mode: m.id })}
              className="rounded-2xl border p-3.5 text-right transition-all"
              style={{
                borderColor: active ? `${m.tint}80` : "rgba(255,255,255,0.08)",
                backgroundColor: active ? `${m.tint}18` : "rgba(0,0,0,0.22)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[13px] font-extrabold"
                  style={{ color: active ? m.tint : "#fff" }}
                >
                  {m.label}
                </span>
                {active && <Check size={14} style={{ color: m.tint }} />}
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-white/55">
                {m.desc}
              </p>
            </button>
          );
        })}

        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-3.5">
          <div className="flex items-center justify-between text-[12px] font-bold">
            <span className="text-white/75">😴 ساعات النوم</span>
            <span className="text-sky-300">{bio.sleepHours} ساعات</span>
          </div>
          <input
            type="range"
            min="3"
            max="10"
            step="0.5"
            value={bio.sleepHours}
            onChange={(e) => {
              const hrs = Number(e.target.value);
              const autoMode = hrs < 5.5 ? "low" : hrs >= 7.5 ? "peak" : "balanced";
              saveBio({ sleepHours: hrs, mode: autoMode });
            }}
            className="my-2 w-full accent-sky-400 cursor-pointer"
          />
          <p className="text-[10px] text-white/45">
            تغيير ساعات النوم يضبط توصية الحمل المعرفي تلقائياً
          </p>
        </div>
      </div>

      {/* الفترات البيولوجية الثلاث لليوم */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {CIRCADIAN_ZONES.map((z) => {
          const isNow = activeZone.id === z.id;
          return (
            <div
              key={z.id}
              className="rounded-xl border px-3.5 py-2.5"
              style={{
                borderColor: isNow ? `${z.tint}66` : "rgba(255,255,255,0.06)",
                backgroundColor: isNow ? `${z.tint}15` : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-extrabold text-white">
                  {z.title}
                </span>
                {isNow && (
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[9.5px] font-black"
                    style={{ backgroundColor: `${z.tint}30`, color: z.tint }}
                  >
                    فترتك الآن
                  </span>
                )}
              </div>
              <p className="mt-1 text-[10.5px] text-white/60">
                الأنسَب الآن: <strong style={{ color: z.tint }}>{z.quadrant}</strong>
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}