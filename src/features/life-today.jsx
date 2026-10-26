import { ReadLogModal, TodayExtras, TopThree, useHabitTick } from "../components/life-day.jsx";
import { Badge, Btn, Card, Checkbox, ConfigBlockBoundary, Modal, PRAYERS, ProgressRing, ReadingCue, T, arDate, countedWord, courseIn, courseName, coursesIn, cupWord, daySections, dayWord, daysPhrase, groupOf, nextPrayer, nextSection, prettyTime, taskWord, tasksPhrase, useBurst, useMinuteClock, whenWord } from "../components/life-shared.jsx";
import { todayBlocks } from "../life-config.js";
import { CORE_CAP, TOP_TASK_CAP, UNI_TASK_KINDS, blockRank, bookForHabit, capToday, clampGoal, dayKey, daysUntil, inReflectWindow, kindOf, minsIn, placeShape, prepPickAdd, prepReady, remainingIn, rows, scoredOf, stampToday, taskOverdue, taskShape, tomorrowKey, uid, uniDayOf, uniPending, uniShape, upcomingRows, IDENTITIES, HABIT_LEVEL_POINTS, identityScores, freezeShape, contextualBlock, chainedHabits } from "../state/life-state.mjs";
import { blockAt, clockAt, fixHour, prayerTimes } from "../utils/prayer-times.mjs";
import { AlertTriangle, AlarmClock, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BatteryCharging, Brain, CalendarClock, CalendarDays, Check, CheckCircle2, ClipboardList, Clock, Coffee, Droplets, Eye, EyeOff, FastForward, Feather, Flame, Footprints, GraduationCap, GripVertical, Inbox, Layers, Library, Link2, ListChecks, MapPin, Moon, MoonStar, Pause, Play, Plus, Rocket, RotateCcw, School, Settings2, Shield, ShieldCheck, Sparkles, Star, Sun, Sunrise, Target, TrendingUp, Trophy, Volume2, VolumeX, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const LAYOUT_KEY = "los-today-layout";

function useTodayLayout() {
  const [stored, setStored] = useState(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : null;
    } catch {
      return null;
    }
  });

  const layout = useMemo(() => {
    if (!stored) return todayBlocks;
    const byKey = new Map(todayBlocks.map((b) => [b.key, b]));
    const out = [];
    const seen = new Set();
    for (const item of stored) {
      if (!item || typeof item.key !== "string") continue;
      const def = byKey.get(item.key);
      if (!def || seen.has(item.key)) continue;
      seen.add(item.key);
      out.push({ ...def, visible: item.visible !== false });
    }
    for (const def of todayBlocks) {
      if (!seen.has(def.key)) out.push(def);
    }
    return out;
  }, [stored]);

  const save = (next) => {
    const clean = next.map((b) => ({
      key: b.key,
      visible: b.visible !== false,
    }));
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(clean));
    } catch {
      /* ignore */
    }
    setStored(clean);
  };

  const reset = () => {
    try {
      localStorage.removeItem(LAYOUT_KEY);
    } catch {
      /* ignore */
    }
    setStored(null);
  };

  return { layout, save, reset };
}

// 👇 مكون جديد للسحب والإفلات 👇
function SortableBlock({ id, isEditing, isDragging, children, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      draggable={isEditing}
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, id)}
      className={`relative transition-all duration-300 ${
        isEditing 
          ? `cursor-grab active:cursor-grabbing border-2 border-dashed rounded-[32px] p-1.5 ${isDragging ? 'opacity-30 border-indigo-500 scale-[0.98]' : 'border-white/20 bg-white/[0.02]'}`
          : ''
      }`}
      style={{
        animation: isEditing && !isDragging ? 'wiggle 0.3s ease-in-out infinite alternate' : 'none',
      }}
    >
      {isEditing && (
        <div className="absolute -top-3 -right-3 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
      )}
      
      <div className={isEditing ? 'pointer-events-none opacity-60 grayscale-[20%]' : ''}>
        {children}
      </div>
      
      <style>{`
        @keyframes wiggle {
          0% { transform: rotate(-0.3deg); }
          100% { transform: rotate(0.3deg); }
        }
      `}</style>
    </div>
  );
}

export function TodayModule({
  state,
  setState,
  discipline,
  streak,
  onGo,
  onOpenSettings,
  onOpenTomorrow,
  comeback = 0,
  onCloseComeback,
}) {
  useMinuteClock();
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const place = placeShape(state.place);
  const uni = state.uni || uniShape();

  const next = nextPrayer(place, now);
  const block = blockAt(place, now);
  const g = groupOf(block?.id);

  const { toggle, logging, closeLog, logRead } = useHabitTick(state, setState);
  const { layout, save: saveLayout, reset: resetLayout } = useTodayLayout();
  const [layoutOpen, setLayoutOpen] = useState(false);

  // 👇 حالات جديدة لوضع التعديل والسحب + وضع الطوارئ (الأساسيات فقط) 👇
  const [isEditing, setIsEditing] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const todayStr = dayKey();
  const [emergencyMode, setEmergencyMode] = useState(() => {
    try {
      return localStorage.getItem("los-emergency-day") === todayStr;
    } catch {
      return false;
    }
  });

  const toggleEmergencyMode = () => {
    setEmergencyMode((prev) => {
      const next = !prev;
      try {
        if (next) localStorage.setItem("los-emergency-day", todayStr);
        else localStorage.removeItem("los-emergency-day");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const [fading, setFading] = useState(() => new Set());
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const tick = (id, tiny = false, level = null) => {
    const h = (state.habits || []).find((x) => x.id === id);
    if (h && !h.done) {
      setFading((prev) => new Set(prev).add(id));
      timers.current.push(
        setTimeout(
          () =>
            setFading((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            }),
          REWARD_HOLD,
        ),
      );
    }
    toggle(id, tiny, level);
  };

  // 👇 دوال السحب والإفلات 👇
  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentLayout = [...layout];
    const draggedIdx = currentLayout.findIndex((b) => b.key === draggedId);
    const targetIdx = currentLayout.findIndex((b) => b.key === targetId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const [moved] = currentLayout.splice(draggedIdx, 1);
      currentLayout.splice(targetIdx, 0, moved);
      saveLayout(currentLayout); 
    }
    setDraggedId(null);
  };

  const habits = state.habits || [];
  const open = remainingIn(habits, block?.id, fading);
  const missed = useMemo(
    () => open.missed.slice().sort((a, b) => blockRank(a.group) - blockRank(b.group)),
    [open.missed],
  );
  const doneCount = habits.filter((h) => h.done).length;
  const allDone = habits.length > 0 && doneCount === habits.length;

  const overdue = useMemo(
    () => (state.tasks || []).filter((t) => taskOverdue(t)),
    [state.tasks],
  );

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const dow = now.getDay();
  const courses = useMemo(() => coursesIn(uni, uni.term), [uni]);
  const sections = useMemo(() => daySections(courses, dow, mins), [courses, dow, mins]);
  const ahead = useMemo(
    () => (sections.length ? null : nextSection(courses, dow, mins)),
    [sections.length, courses, dow, mins],
  );

  const soon = useMemo(() => {
    const out = [];
    for (const t of uniPending(uni)) {
      const k = UNI_TASK_KINDS.find((x) => x.id === t.kind) || UNI_TASK_KINDS[0];
      const c = t.course ? courseIn(uni, t.course) : null;
      out.push({
        key: `u-${t.id}`,
        on: t.due,
        time: t.time,
        title: t.title || k.label,
        tint: k.tint,
        sub: [k.label, c ? courseName(c) : ""].filter(Boolean).join(" · "),
        go: "uni",
      });
    }
    for (const r of upcomingRows(state.events || [])) {
      if (r.ev.kind !== "exam" && r.ev.kind !== "deadline") continue;
      const k = kindOf(r.ev.kind);
      out.push({
        key: `e-${r.ev.id}-${r.on}`,
        on: r.on,
        time: r.ev.time,
        title: r.ev.title || k.label,
        tint: k.tint,
        sub: [k.label, r.ev.place].filter(Boolean).join(" · "),
        go: "agenda",
      });
    }
    out.sort((a, b) =>
      a.on === b.on
        ? (minsIn(a.time) ?? 1441) - (minsIn(b.time) ?? 1441)
        : a.on < b.on
          ? -1
          : 1,
    );
    return out;
  }, [uni, state.events]);

  const nearest = soon.slice(0, 4);

  const evening = inReflectWindow(now);
  const tomorrowOn = tomorrowKey();
  const prepared = useMemo(() => {
    const byId = new Map((state.tasks || []).map((t) => [t.id, t]));
    const events = state.events || [];
    return prepReady(state.tomorrow, state.tasks, tomorrowOn)
      .map((p) => ({
        task: byId.get(p.task),
        at: p.event ? events.find((e) => e.id === p.event)?.time || "" : "",
      }))
      .filter((r) => r.task);
  }, [state.tomorrow, state.tasks, state.events, tomorrowOn]);

  const activeGoalsPulse = useMemo(() => {
    const goals = (state.goals || []).filter((gl) => !gl.done);
    if (!goals.length) return { total: 0, connectedToday: 0 };
    const todayTasks = (state.tasks || []).filter((t) => t.today || t.scheduled);
    const connectedIds = new Set();
    for (const t of todayTasks) {
      if (t.linkedGoalId) connectedIds.add(t.linkedGoalId);
    }
    for (const gl of goals) {
      if (Array.isArray(gl.linkedHabits) && gl.linkedHabits.length > 0) {
        connectedIds.add(gl.id);
      }
    }
    return { total: goals.length, connectedToday: connectedIds.size };
  }, [state.goals, state.tasks]);

  const blockRegistry = {
    dayHeader: (
      <DayHeaderCard
        dateLabel={dateLabel}
        block={g}
        next={next}
        streak={streak}
        showStreak={comeback === 0}
        doneCount={doneCount}
        total={habits.length}
        discipline={discipline}
        onOpenSettings={onOpenSettings}
        onOpenLayout={() => setLayoutOpen(true)}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        emergencyMode={emergencyMode}
        onToggleEmergency={toggleEmergencyMode}
        activeGoalsPulse={activeGoalsPulse}
        onGo={onGo}
      />
    ),
    ritualLaunchpad: (
      <MorningLaunchpadAndShutdownCard
        state={state}
        setState={setState}
        discipline={discipline}
        doneCount={doneCount}
        totalHabits={habits.length}
        onOpenTomorrow={onOpenTomorrow}
        onGo={onGo}
      />
    ),
    readingCue: <ReadingCue list={state.reads} />,
    prayerWaterGrid: (
      <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
        <PrayerCard place={state.place} onOpenSettings={onOpenSettings} />
        <WaterCard
          count={state.water}
          goal={clampGoal(state.waterGoal)}
          onSet={(n) =>
            setState((s) => {
              const nextWater = Math.max(0, Math.min(clampGoal(s.waterGoal), n));
              return stampToday({ ...s, water: nextWater });
            })
          }
        />
      </div>
    ),
    tasksModule: (
      <>
        <TopThree state={state} setState={setState} />
        <TodayExtras state={state} setState={setState} />
      </>
    ),
    remainingHabits: (
      <RemainingHabitsCard
        block={g}
        open={open}
        missed={missed}
        books={state.books}
        habits={habits}
        state={state}
        setState={setState}
        remaining={habits.length - doneCount}
        allDone={allDone}
        onTick={tick}
        onGo={onGo}
      />
    ),
    tomorrowPrep: evening ? (
      <TomorrowPrepCard prepared={prepared} on={tomorrowOn} onOpen={onOpenTomorrow} />
    ) : null,
    lecturesAndDeadlines: (
      <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
        <LecturesCard dow={dow} sections={sections} ahead={ahead} mins={mins} onGo={onGo} />
        <NearestDueCard items={nearest} onGo={onGo} />
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      {comeback > 0 && (
        <ComebackCard
          state={state}
          setState={setState}
          days={comeback}
          onTick={tick}
          onTickTiny={(id) => tick(id, true)}
          onClose={onCloseComeback}
        />
      )}

      {emergencyMode && comeback === 0 && (
        <EmergencyModeCard
          state={state}
          setState={setState}
          onTick={tick}
          onTickTiny={(id) => tick(id, true)}
          onClose={toggleEmergencyMode}
        />
      )}

      {overdue.length > 0 && (
        <button
          type="button"
          onClick={() => onGo("matrix")}
          className="los-in flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-right transition-all duration-200 hover:border-white/40 hover:bg-white/[0.03]"
          style={{
            borderColor: `${T.danger}66`,
            background: `${T.danger}12`,
            boxShadow: `0 0 30px -18px ${T.danger}`,
          }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${T.danger}4D`,
              background: `${T.danger}1A`,
              color: T.danger,
            }}
          >
            <AlertTriangle size={18} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[13.5px] font-extrabold"
              style={{ color: T.danger }}
            >
              عندك{" "}
              <span dir="ltr" className="tabular-nums">
                {overdue.length}
              </span>{" "}
              {overdue.length === 1 ? "مهمة متأخرة" : "مهام متأخرة"}
            </p>
            <p
              className="mt-0.5 truncate text-[11px] leading-relaxed"
              style={{ color: T.muted }}
            >
              {overdue
                .slice(0, 3)
                .map((t) => t.text)
                .filter(Boolean)
                .join(" · ")}
              {overdue.length > 3 && ` · +${overdue.length - 3}`}
            </p>
          </div>
          <ArrowLeft size={16} className="shrink-0" style={{ color: T.danger }} />
        </button>
      )}

      {layout
        .filter((b) => b.visible !== false)
        .map((b) => (
          <SortableBlock
            key={b.key}
            id={b.key}
            isEditing={isEditing}
            isDragging={draggedId === b.key}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <ConfigBlockBoundary>{blockRegistry[b.key] ?? null}</ConfigBlockBoundary>
          </SortableBlock>
        ))}

      {/* 👇 زر حفظ الترتيب يظهر في الأسفل عند وضع التعديل 👇 */}
      {isEditing && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5">
          <button 
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-2xl shadow-indigo-900/60 transition-all hover:scale-105 active:scale-95 border border-indigo-400/50"
          >
            <Check size={20} /> حفظ الترتيب
          </button>
        </div>
      )}

      <ReadLogModal
        open={!!logging}
        book={logging ? bookForHabit(logging, state.books) : null}
        onClose={closeLog}
        onLog={logRead}
      />

      <TodayLayoutModal
        open={layoutOpen}
        onClose={() => setLayoutOpen(false)}
        layout={layout}
        onSave={saveLayout}
        onReset={resetLayout}
      />
    </div>
  );
}

/* ==================================================================== *
 *  TodayLayoutModal — hide, reorder, or reset the اليوم cards.
 * ==================================================================== */
function TodayLayoutModal({ open, onClose, layout, onSave, onReset }) {
  const [draft, setDraft] = useState(layout);
  useEffect(() => {
    if (open) setDraft(layout);
  }, [open, layout]);

  if (!open) return null;

  const toggle = (key) =>
    setDraft((d) =>
      d.map((b) => (b.key === key ? { ...b, visible: !b.visible } : b)),
    );

  const move = (key, dir) =>
    setDraft((d) => {
      const i = d.findIndex((b) => b.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.length) return d;
      const copy = [...d];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const commit = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ترتيب بطاقات اليوم"
      footer={
        <>
          <Btn variant="default" className="flex-1" onClick={commit}>
            حفظ
          </Btn>
          <Btn
            variant="outline"
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            <RotateCcw size={13} /> استعادة الافتراضي
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <p
          className="rounded-xl border px-3.5 py-2.5 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.cta}3D`,
            background: `${T.cta}0A`,
            color: T.muted,
          }}
        >
          الأزرار اللي فوق وتحت تنقل البطاقة سطر واحد. العين المشطوبة تخفيها من
          الشاشة. الإعدادات تُحفظ في هذا المتصفح فقط.
        </p>

        <div className="space-y-2">
          {draft.map((b, i) => {
            const off = b.visible === false;
            const first = i === 0;
            const last = i === draft.length - 1;
            return (
              <div
                key={b.key}
                className="flex items-center gap-2 rounded-xl border px-2.5 py-2"
                style={{
                  borderColor: off ? "rgba(255,255,255,0.08)" : T.border,
                  background: off ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                  opacity: off ? 0.65 : 1,
                }}
              >
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(b.key, -1)}
                    disabled={first}
                    title="للأعلى"
                    aria-label="تحريك للأعلى"
                    className="rounded p-1 transition-colors disabled:cursor-default disabled:opacity-20 hover:text-white"
                    style={{ color: T.muted }}
                  >
                    <ArrowUp size={12} strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(b.key, 1)}
                    disabled={last}
                    title="للأسفل"
                    aria-label="تحريك للأسفل"
                    className="rounded p-1 transition-colors disabled:cursor-default disabled:opacity-20 hover:text-white"
                    style={{ color: T.muted }}
                  >
                    <ArrowDown size={12} strokeWidth={3} />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[12.5px] font-bold"
                    style={{ color: T.fg }}
                  >
                    {b.label || b.key}
                  </p>
                  {b.desc && (
                    <p
                      className="mt-0.5 truncate text-[10.5px]"
                      style={{ color: T.faint }}
                    >
                      {b.desc}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggle(b.key)}
                  aria-pressed={!off}
                  aria-label={off ? "إظهار البطاقة" : "إخفاء البطاقة"}
                  title={off ? "إظهار" : "إخفاء"}
                  className="shrink-0 rounded-lg border p-1.5 transition-colors"
                  style={{
                    borderColor: off ? T.border : `${T.cta}80`,
                    background: off ? "transparent" : `${T.cta}1F`,
                    color: off ? T.faint : T.ctaLift,
                  }}
                >
                  {off ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

const REWARD_HOLD = 1100;

function TodayHabit({ habit, book, onToggle, onToggleTiny, onToggleLevel, late = false }) {
  const [burst, fireBurst] = useBurst(700);
  const g = groupOf(habit.group);
  const Icon = g.icon;
  const identity = habit.identity && IDENTITIES ? IDENTITIES[habit.identity] : null;

  const handle = () => {
    if (!habit.done) fireBurst();
    onToggle();
  };
  const handleTiny = () => {
    if (!habit.done) fireBurst();
    onToggleTiny();
  };
  const handleLevel = (lvl) => {
    if (onToggleLevel) {
      if (!habit.done || habit.levelDone !== lvl) fireBurst();
      onToggleLevel(lvl);
    }
  };

  const currentLevel = habit.levelDone || (habit.tiny ? "micro" : habit.done ? "standard" : null);

  return (
    <div
      className={`group flex flex-wrap items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst
          ? T.primary
          : late
            ? `${T.accent}2E`
            : "rgba(255,255,255,0.07)",
        backgroundColor: burst
          ? `${T.primary}26`
          : late
            ? `${T.accent}0D`
            : "rgba(255,255,255,0.025)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
          style={{
            borderColor: `${g.tint}33`,
            backgroundColor: `${g.tint}14`,
            color: g.tint,
          }}
          title={g.label}
        >
          <Icon size={13} />
        </span>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <Checkbox
            checked={habit.done}
            onToggle={handle}
            label={habit.label}
            tint={T.primary}
            size="sm"
          />
          {identity && (
            <span
              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                backgroundColor: `${identity.tint}1A`,
                color: identity.tint,
                borderColor: `${identity.tint}33`,
              }}
              title={`عمود الهوية: ${identity.label}`}
            >
              {identity.icon} {identity.label}
            </span>
          )}
          {habit.afterHabit && (
            <span
              className="inline-flex items-center gap-0.5 text-[9.5px]"
              style={{ color: T.faint }}
              title="سلسلة تكديس تالية"
            >
              <Link2 size={9} /> ↳ يتبع: {habit.afterHabit}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onToggleLevel ? (
          <div className="inline-flex items-center rounded-lg border p-0.5" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
            <button
              type="button"
              onClick={() => handleLevel("micro")}
              title="بذرة (قاعدة الدقيقتين) 🌱"
              className={`rounded px-1.5 py-0.5 text-[9.5px] font-extrabold transition-all ${
                habit.done && currentLevel === "micro"
                  ? "bg-amber-500/25 text-amber-300 font-black shadow-sm"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              🌱 دقيقتان
            </button>
            <button
              type="button"
              onClick={() => handleLevel("standard")}
              title="المستوى المستهدف 🎯"
              className={`rounded px-1.5 py-0.5 text-[9.5px] font-extrabold transition-all ${
                habit.done && currentLevel === "standard"
                  ? "bg-emerald-500/25 text-emerald-300 font-black shadow-sm"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              🎯 مستهدف
            </button>
            <button
              type="button"
              onClick={() => handleLevel("mastery")}
              title="مستوى الإتقان ⚡"
              className={`rounded px-1.5 py-0.5 text-[9.5px] font-extrabold transition-all ${
                habit.done && currentLevel === "mastery"
                  ? "bg-indigo-500/30 text-indigo-300 font-black shadow-sm"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              ⚡ إتقان
            </button>
          </div>
        ) : !!habit.min && (habit.tiny || !habit.done) ? (
          <button
            onClick={handleTiny}
            title={`نسخة خفيفة للطوارئ: ${habit.min}`}
            aria-label={`إنجاز النسخة الصغيرة من ${habit.label}`}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[10px] font-bold transition-all duration-200 hover:scale-105"
            style={{
              borderColor: habit.tiny ? `${T.sky}80` : `${T.sky}38`,
              background: habit.tiny ? `${T.sky}24` : `${T.sky}10`,
              color: T.sky,
            }}
          >
            <Feather
              size={11}
              style={habit.tiny ? { filter: `drop-shadow(0 0 5px ${T.sky}AA)` } : undefined}
            />
            <span className="hidden sm:inline">{habit.tiny ? "خفيفة ✓" : "خفيفة"}</span>
          </button>
        ) : null}

        {habit.core && (
          <Star
            size={12}
            aria-label="عادة أساسية"
            className="shrink-0"
            fill={T.accent}
            style={{ color: T.accent, filter: `drop-shadow(0 0 5px ${T.accent}AA)` }}
          />
        )}
        {late && (
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold"
            style={{ backgroundColor: `${T.accent}1F`, color: T.accent }}
          >
            {g.label}
          </span>
        )}
        {book && (
          <span
            title={`مربوطة بـ«${book.title}»`}
            className="hidden shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:inline-flex"
            style={{ backgroundColor: `${T.accent}1A`, color: T.accent }}
          >
            <Library size={10} />
            <span className="max-w-[7rem] truncate">{book.title}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function TodayLine({ tint, icon: Icon, title, sub, when, time, hot = false, now = false }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border px-2.5 py-2"
      style={{
        borderColor: now
          ? `${T.cta}59`
          : hot
            ? `${T.danger}3D`
            : "rgba(255,255,255,0.07)",
        backgroundColor: now
          ? `${T.cta}1A`
          : hot
            ? `${T.danger}0F`
            : "rgba(255,255,255,0.025)",
        boxShadow: now ? `0 0 22px -10px ${T.cta}` : "none",
      }}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
        style={{ borderColor: `${tint}33`, backgroundColor: `${tint}14`, color: tint }}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold" style={{ color: T.fg }}>
          {title}
        </p>
        {sub && (
          <p className="truncate text-[10.5px]" style={{ color: T.faint }}>
            {sub}
          </p>
        )}
      </div>
      <div className="shrink-0 text-left">
        {time && (
          <p
            dir="ltr"
            className="text-[12px] font-extrabold tabular-nums"
            style={{ color: now ? T.ctaLift : hot ? T.danger : T.muted }}
          >
            {time}
          </p>
        )}
        {when && (
          <p className="text-[10px]" style={{ color: hot ? T.danger : T.faint }}>
            {when}
          </p>
        )}
      </div>
    </div>
  );
}

function ComebackCard({ state, setState, days, onTick, onTickTiny, onClose }) {
  const open = scoredOf(state.habits || []).filter((h) => !h.done);
  const shown = open.slice(0, CORE_CAP);

  return (
    <Card
      className="p-6 sm:p-7"
      style={{
        borderColor: `${T.sky}59`,
        backgroundColor: `${T.sky}0D`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 50px -20px ${T.sky}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${T.sky}4D`,
              background: `linear-gradient(160deg, ${T.sky}33, ${T.sky}0F)`,
              color: T.sky,
            }}
          >
            <Sunrise size={20} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[17px] font-extrabold" style={{ color: T.sky }}>
              رجعت. نبدأ بأقل شي.
            </h3>
            <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
              {daysPhrase(days) || `${days} ${dayWord(days)}`} بلا تسجيل. لا شيء
              يحتاج تعويضًا — اليوم وحده يكفي.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="إغلاق بطاقة الرجوع"
          title="أرني الشاشة كاملة"
          className="shrink-0 rounded-lg border p-1.5 text-white/30 transition-colors hover:text-white"
          style={{ borderColor: T.border }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: T.primaryLift }}>
          <Star size={11} fill={T.accent} style={{ color: T.accent }} /> الأساسيات
        </p>
        {shown.length ? (
          <div className="space-y-1.5">
            {shown.map((h) => (
              <TodayHabit
                key={h.id}
                habit={h}
                book={bookForHabit(h, state.books)}
                onToggle={() => onTick(h.id)}
                onToggleTiny={() => onTickTiny(h.id)}
              />
            ))}
          </div>
        ) : (
          <p
            className="rounded-xl border border-dashed px-3 py-4 text-center text-[11.5px]"
            style={{ borderColor: T.border, color: T.faint }}
          >
            أساسياتك كلها تمّت اليوم. هذا كل المطلوب.
          </p>
        )}
      </div>

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: T.ctaLift }}>
          <Zap size={11} /> ثلاث مهام، لا أكثر
        </p>
        <div className="-mx-1">
          <TopThree state={state} setState={setState} />
        </div>
      </div>
    </Card>
  );
}

function EmergencyModeCard({ state, setState, onTick, onTickTiny, onClose }) {
  const coreHabits = scoredOf(state.habits || []).slice(0, CORE_CAP);
  const openCore = coreHabits.filter((h) => !h.done);
  const doneCoreCount = coreHabits.length - openCore.length;

  const rescueAllTiny = () => {
    for (const h of openCore) {
      onTickTiny(h.id);
    }
  };

  return (
    <Card
      className="p-6 sm:p-7"
      style={{
        borderColor: `${T.warn}66`,
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(56,189,248,0.06) 55%, rgba(12,15,28,0.95) 100%)",
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 46px -20px ${T.warn}`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${T.warn}59`,
              background: `linear-gradient(160deg, ${T.warn}33, ${T.warn}0F)`,
              color: T.warn,
            }}
          >
            <Feather size={20} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-extrabold" style={{ color: T.warn }}>
                وضع الطوارئ · الحد الأدنى غير القابل للكسر
              </h3>
              <Badge tint={T.warn}>
                <span dir="ltr" className="tabular-nums">
                  {doneCoreCount}/{coreHabits.length}
                </span>{" "}
                جذور اليوم
              </Badge>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: T.muted }}>
              في أيام الضغط العالي أو الإرهاق أو الاختبارات، الانتصار الحقيقي هو{" "}
              <strong className="text-white">عدم السقوط للصفر</strong>. ركّز فقط على الجذور
              الأساسية أدناه أو أنجزها بالنسخة الخفيفة (🪶).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {openCore.length > 0 && (
            <button
              type="button"
              onClick={rescueAllTiny}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-extrabold transition-all hover:scale-105"
              style={{
                borderColor: `${T.sky}66`,
                background: `${T.sky}1F`,
                color: T.sky,
              }}
              title="إنجاز النسخة الخفيفة لكل العادات الأساسية المتبقية لحماية السلسلة"
            >
              <Feather size={13} /> إنقاذ اليوم بالنسخة الخفيفة ({openCore.length})
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="إيقاف وضع الطوارئ"
            title="العودة للوضع الكامل"
            className="shrink-0 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold text-white/60 transition-colors hover:text-white"
            style={{ borderColor: T.border }}
          >
            إنهاء الطوارئ ✕
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5 text-[11.5px] font-extrabold" style={{ color: T.primaryLift }}>
          <Star size={12} fill={T.accent} style={{ color: T.accent }} /> العادات الجذرية فقط (تجاهل الكماليات اليوم)
        </p>
        {openCore.length ? (
          <div className="space-y-1.5">
            {openCore.map((h) => (
              <TodayHabit
                key={h.id}
                habit={h}
                book={bookForHabit(h, state.books)}
                onToggle={() => onTick(h.id)}
                onToggleTiny={() => onTickTiny(h.id)}
              />
            ))}
          </div>
        ) : (
          <p
            className="rounded-xl border px-3.5 py-4 text-center text-[12px] font-extrabold"
            style={{
              borderColor: `${T.primary}45`,
              background: `${T.primary}14`,
              color: T.primaryLift,
            }}
          >
            🛡️ أتممت جميع الجذور الأساسية لليوم! سلسلتك في أمان تام — يمكنك الاستراحة الآن بلا أي تأنيب ضمير.
          </p>
        )}
      </div>
    </Card>
  );
}

export function DayHeaderCard({
  dateLabel,
  block,
  next,
  streak,
  showStreak,
  doneCount,
  total,
  discipline,
  onOpenSettings,
  onOpenLayout,
  isEditing,
  onToggleEdit,
  emergencyMode = false,
  onToggleEmergency,
  activeGoalsPulse,
  onGo,
}) {
  const Icon = block.icon;
  return (
    <Card className="flex flex-col items-center gap-6 p-6 sm:p-7 md:flex-row md:justify-between">
      <div className="min-w-0 text-center md:text-right">
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            اليوم
          </h2>
          {onOpenLayout && (
            <button
              type="button"
              onClick={onOpenLayout}
              title="إخفاء/إظهار البطاقات"
              aria-label="إخفاء أو إظهار البطاقات"
              className="rounded-lg border p-1.5 text-white/40 transition-colors hover:border-white/40 hover:text-white"
              style={{ borderColor: T.border }}
            >
              <Settings2 size={13} />
            </button>
          )}
          
          {/* 👇 الزر الجديد لتفعيل السحب والإفلات 👇 */}
          <button
            type="button"
            onClick={onToggleEdit}
            title={isEditing ? "حفظ الترتيب" : "تعديل الترتيب بالسحب"}
            className={`rounded-lg border p-1.5 transition-colors ${isEditing ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:border-white/40 hover:text-white'}`}
            style={{ borderColor: isEditing ? undefined : T.border }}
          >
            {isEditing ? <Check size={13} /> : <GripVertical size={13} />}
          </button>

          {/* 👇 زر وضع الطوارئ (الحد الأدنى غير القابل للكسر) 👇 */}
          {onToggleEmergency && (
            <button
              type="button"
              onClick={onToggleEmergency}
              title="تفعيل وضع الطوارئ للأيام المزدحمة والمرهقة (التركيز على الجذور والنسخة الخفيفة فقط)"
              className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-extrabold transition-all hover:scale-105"
              style={{
                borderColor: emergencyMode ? `${T.warn}80` : T.border,
                background: emergencyMode ? `${T.warn}24` : "rgba(255,255,255,0.03)",
                color: emergencyMode ? T.warn : T.muted,
              }}
            >
              <Feather size={12} />
              <span>{emergencyMode ? "وضع الطوارئ مفعّل 🛡️" : "وضع الطوارئ"}</span>
            </button>
          )}
        </div>
        <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/40 md:justify-start">
          <CalendarDays size={13} /> {dateLabel}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
          <span
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-extrabold"
            style={{
              borderColor: `${block.tint}3D`,
              backgroundColor: `${block.tint}14`,
              color: block.tint,
            }}
          >
            <Icon size={14} /> {block.label}
          </span>
          {next && (
            <button
              onClick={onOpenSettings}
              title="تغيير المدينة"
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] transition-colors hover:bg-white/[0.06]"
              style={{ borderColor: `${T.violet}3D`, backgroundColor: `${T.violet}12` }}
            >
              <MoonStar size={14} style={{ color: T.violet }} />
              <span style={{ color: T.muted }}>
                {next.tomorrow ? "فجر غدٍ" : next.label}
              </span>
              <span
                dir="ltr"
                className="font-extrabold tabular-nums"
                style={{ color: T.cta }}
              >
                {clockAt(next.at / 60)}
              </span>
              <span className="text-[10.5px]" style={{ color: T.faint }}>
                {next.left >= 60
                  ? `بعد ${Math.floor(next.left / 60)} س ${next.left % 60} د`
                  : `بعد ${next.left} د`}
              </span>
            </button>
          )}
          {showStreak && (
            <span
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px]"
              style={{ borderColor: T.border }}
            >
              <Flame size={14} style={{ color: streak > 0 ? T.ember : T.faint }} />
              <span className="font-extrabold tabular-nums">{streak}</span>
              <span className="text-[10.5px]" style={{ color: T.faint }}>
                {countedWord(streak)}
              </span>
            </span>
          )}
          {activeGoalsPulse && activeGoalsPulse.total > 0 && (
            <button
              type="button"
              onClick={() => onGo && onGo("goals")}
              title="اضغط لفتح شاشة إرثي 2030 ومراجعة أهدافك الكبرى"
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-extrabold transition-all hover:bg-white/[0.06]"
              style={{
                borderColor: `${T.primary}45`,
                backgroundColor: `${T.primary}12`,
                color: T.primaryLift,
              }}
            >
              <Target size={13} />
              <span>
                إرث 2030:{" "}
                {activeGoalsPulse.connectedToday > 0
                  ? `تخدم ${activeGoalsPulse.connectedToday} أهداف اليوم`
                  : `${activeGoalsPulse.total} أهداف نشطة`}
              </span>
            </button>
          )}
        </div>
        <p className="mt-3 max-w-md text-xs leading-relaxed text-white/35">
          <span dir="ltr" className="font-extrabold tabular-nums">
            {doneCount} / {total}
          </span>{" "}
          عادة اليوم. ما في هذه الشاشة هو ما تبقّى من يومك — والتفاصيل في
          شاشاتها.
        </p>
      </div>
      <ProgressRing value={discipline} size={150} />
    </Card>
  );
}

export function TomorrowPrepCard({ prepared, on, onOpen }) {
  return (
    <Card
      className="p-5 sm:p-6"
      style={{
        borderColor: `${T.violet}59`,
        backgroundColor: `${T.violet}0D`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${T.violet}4D`,
              background: `linear-gradient(160deg, ${T.violet}33, ${T.violet}0F)`,
              color: T.violet,
            }}
          >
            <Sunrise size={18} strokeWidth={2.4} />
          </span>
          <div>
            <h3 className="text-[15px] font-extrabold" style={{ color: T.violet }}>
              {prepared.length ? "غدك مجهّز" : "جهّز غدك"}
            </h3>
            <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: T.faint }}>
              {!prepared.length ? (
                "اختر ثلاثًا الآن، وابدأ الغد بلا مساومة"
              ) : tasksPhrase(prepared.length) ? (
                <>
                  {tasksPhrase(prepared.length)} {arDate(on)}
                </>
              ) : (
                <>
                  <span dir="ltr" className="font-bold tabular-nums">
                    {prepared.length}
                  </span>{" "}
                  {taskWord(prepared.length)} تنتظر {arDate(on)}
                </>
              )}
            </p>
          </div>
        </div>
        <Btn variant={prepared.length ? "outline" : "default"} size="sm" onClick={onOpen}>
          {prepared.length ? "عدّل" : "ابدأ"} <ArrowLeft size={13} />
        </Btn>
      </div>

      {prepared.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {prepared.map((r, i) => (
            <div
              key={r.task.id}
              className="flex items-start gap-2.5 rounded-xl border px-3 py-2"
              style={{ borderColor: T.border }}
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold tabular-nums"
                style={{ background: `${T.violet}26`, color: T.violet }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-white/80">
                  {r.task.text}
                </p>
                {!!r.task.step && (
                  <p
                    className="mt-0.5 flex items-start gap-1.5 text-[11px] leading-relaxed"
                    style={{ color: T.faint }}
                  >
                    <Footprints size={10} className="mt-[3px] shrink-0" />
                    <span>{r.task.step}</span>
                  </p>
                )}
              </div>
              {!!r.at && (
                <span
                  dir="ltr"
                  className="mt-0.5 shrink-0 text-[11px] font-extrabold tabular-nums"
                  style={{ color: T.violet }}
                >
                  {prettyTime(r.at)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ==========================================================================
 * ترقيات نظام العادات والروتين:
 * 1. وضع التدفق الموجه للروتين (Routine Flow Runner)
 * 2. درع تجميد السلسلة (Streak Freeze Shield)
 * 3. أعمدة الهوية الشخصية (Identity Pillars)
 * 4. سلاسل التكديس التلقائي (Habit Stacking Chains)
 * ========================================================================== */

export function RoutineFlowModal({ open, onClose, habits = [], books = [], onTick, onTickLevel }) {
  const pending = useMemo(() => habits.filter((h) => !h.done), [habits]);
  const [currIdx, setCurrIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isRunning, setIsRunning] = useState(false);

  const safeIdx = Math.min(currIdx, Math.max(0, pending.length - 1));
  const curr = pending[safeIdx] || null;

  useEffect(() => {
    setTimeLeft(120);
    setIsRunning(false);
  }, [safeIdx, curr?.id]);

  useEffect(() => {
    let t = null;
    if (isRunning && timeLeft > 0) {
      t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    }
    return () => clearInterval(t);
  }, [isRunning, timeLeft]);

  if (!open) return null;

  const handleLevel = (lvl) => {
    if (!curr) return;
    if (onTickLevel) onTickLevel(curr.id, lvl);
    else if (onTick) onTick(curr.id, lvl === "micro");
  };

  const g = curr ? groupOf(curr.group) : null;
  const Icon = g?.icon;
  const book = curr ? bookForHabit(curr, books) : null;
  const identity = curr?.identity && IDENTITIES ? IDENTITIES[curr.identity] : null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  return (
    <Modal open={open} onClose={onClose} title="🚀 تدفق الروتين الموجه (Routine Flow)">
      {pending.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Trophy size={36} />
          </div>
          <h4 className="text-[17px] font-black text-white">أنت بطل اليوم! 🎉</h4>
          <p className="text-[13px] text-white/70">
            أنجزت جميع العادات اليومية. لم يتبقَّ شيء في قائمة الانتظار.
          </p>
          <Btn variant="primary" onClick={onClose} className="mt-4">
            إغلاق
          </Btn>
        </div>
      ) : curr ? (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11.5px] font-bold text-white/70">
              <span>
                العادة {currIdx + 1} من {pending.length}
              </span>
              <span dir="ltr" className="tabular-nums">
                {Math.round(((currIdx + 1) / pending.length) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
                style={{ width: `${((currIdx + 1) / pending.length) * 100}%` }}
              />
            </div>
          </div>

          <div
            className="rounded-2xl border p-5 text-center space-y-4"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderColor: curr.core ? `${T.accent}40` : "rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl border text-[18px]"
                style={{
                  borderColor: `${g?.tint}40`,
                  backgroundColor: `${g?.tint}1A`,
                  color: g?.tint,
                }}
              >
                {Icon && <Icon size={20} />}
              </span>
              {identity && (
                <span
                  className="rounded-lg px-2 py-0.5 text-[10.5px] font-extrabold"
                  style={{
                    backgroundColor: `${identity.tint}20`,
                    color: identity.tint,
                  }}
                >
                  {identity.icon} {identity.label}
                </span>
              )}
              {curr.core && (
                <span
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-extrabold"
                  style={{ backgroundColor: `${T.accent}20`, color: T.accent }}
                >
                  <Star size={12} fill={T.accent} /> أساسية
                </span>
              )}
            </div>

            <h3 className="text-[20px] font-black text-white">{curr.label}</h3>

            {book && (
              <p className="text-[12px] text-amber-300/90 font-bold">
                📖 مرتبطة بكتاب: {book.title} (صفحة {book.progress || 0})
              </p>
            )}

            {curr.min && (
              <p className="text-[11.5px] text-sky-300/80">
                🌱 بذرة الـ 2 دقيقة: {curr.min}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <div
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-[16px] font-bold"
                style={{
                  borderColor: isRunning ? `${T.cta}60` : "rgba(255,255,255,0.1)",
                  background: isRunning ? `${T.cta}15` : "rgba(0,0,0,0.2)",
                  color: isRunning ? T.cta : "white",
                }}
              >
                <Clock size={16} />
                <span>{timeFormatted}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="rounded-xl border p-2 text-white/80 hover:text-white transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
                title={isRunning ? "إيقاف مؤقت" : "بدء المؤقت"}
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeLeft(120);
                  setIsRunning(false);
                }}
                className="rounded-xl border p-2 text-white/80 hover:text-white transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
                title="إعادة ضبط"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-center text-[11px] font-bold text-white/50">
              اختر مستوى الإنجاز لإنهاء العادة والانتقال للتالية:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLevel("micro")}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: "rgba(245,158,11,0.4)",
                  backgroundColor: "rgba(245,158,11,0.1)",
                }}
              >
                <span className="text-[14px]">🌱</span>
                <span className="text-[11.5px] font-extrabold text-amber-300">
                  بذرة (دقيقتان)
                </span>
                <span className="text-[9.5px] text-white/50">حماية السلسلة</span>
              </button>
              <button
                type="button"
                onClick={() => handleLevel("standard")}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: "rgba(16,185,129,0.5)",
                  backgroundColor: "rgba(16,185,129,0.12)",
                }}
              >
                <span className="text-[14px]">🎯</span>
                <span className="text-[11.5px] font-extrabold text-emerald-300">
                  مستهدف كامل
                </span>
                <span className="text-[9.5px] text-white/50">الهدف المعتاد</span>
              </button>
              <button
                type="button"
                onClick={() => handleLevel("mastery")}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  borderColor: "rgba(99,102,241,0.5)",
                  backgroundColor: "rgba(99,102,241,0.15)",
                }}
              >
                <span className="text-[14px]">⚡</span>
                <span className="text-[11.5px] font-extrabold text-indigo-300">
                  إتقان بطل
                </span>
                <span className="text-[9.5px] text-white/50">جهد مضاعف</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={currIdx === 0}
              onClick={() => setCurrIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowRight size={13} /> العادة السابقة
            </button>
            <button
              type="button"
              disabled={currIdx >= pending.length - 1}
              onClick={() => setCurrIdx((i) => Math.min(pending.length - 1, i + 1))}
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              تخطي إلى التالية <ArrowLeft size={13} />
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export function StreakShieldModal({ open, onClose, state, setState }) {
  if (!open || !state) return null;
  const freezes = freezeShape(state.freezes);
  const today = dayKey();
  const isFrozenToday = (freezes.dates || []).includes(today);

  const toggleFreeze = () => {
    setState((s) => {
      const f = freezeShape(s.freezes);
      const dates = f.dates || [];
      const already = dates.includes(today);
      if (already) {
        return {
          ...s,
          freezes: {
            ...f,
            dates: dates.filter((d) => d !== today),
          },
        };
      }
      if (f.available <= 0) return s;
      return {
        ...s,
        freezes: {
          ...f,
          available: Math.max(0, f.available - 1),
          used: (f.used || 0) + 1,
          dates: [...dates, today],
        },
      };
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="🛡️ درع تجميد السلسلة (Streak Freeze Shield)">
      <div className="space-y-4">
        <div
          className="rounded-2xl border p-4 text-center space-y-2"
          style={{
            borderColor: isFrozenToday ? `${T.sky}60` : `${T.border}`,
            background: isFrozenToday ? `${T.sky}15` : "rgba(255,255,255,0.02)",
          }}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
            {isFrozenToday ? <ShieldCheck size={28} /> : <Shield size={28} />}
          </div>
          <h4 className="text-[16px] font-black text-white">
            {isFrozenToday ? "الدرع نشط اليوم! 🛡️" : "الدرع غير مفعّل لليوم"}
          </h4>
          <p className="text-[12px] text-white/70 leading-relaxed">
            {isFrozenToday
              ? "سلسلتك محمية اليوم من الانقطاع في حال انشغالك أو سفرك أو مرضك."
              : "يمكنك تجميد اليوم لحماية سلسلتك إذا كنت متعباً أو مسافراً."}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border px-3.5 py-2.5" style={{ borderColor: T.border, background: "rgba(0,0,0,0.2)" }}>
          <div className="text-right">
            <span className="text-[12.5px] font-bold text-white">رصيد الدروع المتاح:</span>
            <span className="block text-[10.5px] text-white/50">درعان لكل شهر تجدد تلقائياً</span>
          </div>
          <Badge tint={freezes.available > 0 ? T.sky : T.faint}>
            <span dir="ltr" className="font-mono text-[14px] font-black">
              {freezes.available}
            </span>{" "}
            درع
          </Badge>
        </div>

        <button
          type="button"
          onClick={toggleFreeze}
          disabled={!isFrozenToday && freezes.available <= 0}
          className="w-full rounded-2xl py-3 text-[13px] font-extrabold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
          style={{
            background: isFrozenToday
              ? "rgba(239,68,68,0.25)"
              : "linear-gradient(135deg, rgba(14,165,233,0.8), rgba(99,102,241,0.8))",
            border: `1px solid ${isFrozenToday ? "rgba(239,68,68,0.4)" : "rgba(14,165,233,0.5)"}`,
          }}
        >
          {isFrozenToday ? "إلغاء تجميد اليوم واسترجاع الدرع" : "🛡️ تفعيل الدرع لليوم (استهلاك درع واحد)"}
        </button>

        <p className="text-[11px] text-white/40 leading-relaxed text-center">
          💡 درع التجميد فكرة مثبتة علمياً لبناء الاستمرارية: حماية السلسلة في الأيام الاستثنائية تحميك من الإحباط النفسي للانقطاع.
        </p>
      </div>
    </Modal>
  );
}

export function IdentityPillarsWidget({ habits = [] }) {
  const scores = useMemo(() => identityScores(habits), [habits]);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-extrabold text-white/80">
          🏛️ أعمدة الهوية الشخصية (Identity Pillars)
        </span>
        <span className="text-[10.5px] text-white/40">ارتباط العادات بذاتك المستقبلية</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(IDENTITIES).map(([key, def]) => {
          const sc = scores[key] || { total: 0, done: 0, pct: 0 };
          return (
            <div
              key={key}
              className="rounded-xl border p-2.5 text-center transition-all"
              style={{
                borderColor: `${def.tint}26`,
                backgroundColor: `${def.tint}0D`,
              }}
            >
              <span className="text-[18px]">{def.icon}</span>
              <p className="mt-1 text-[12px] font-extrabold" style={{ color: def.tint }}>
                {def.label}
              </p>
              <div className="mt-1 flex items-center justify-center gap-1 text-[10.5px] text-white/60">
                <span dir="ltr" className="font-mono font-bold">
                  {sc.done}/{sc.total}
                </span>
                <span>({sc.pct}%)</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${sc.pct}%`,
                    backgroundColor: def.tint,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChainedHabitsView({ habits = [], onTick }) {
  const chains = useMemo(() => chainedHabits(habits), [habits]);

  if (chains.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-center text-[11.5px] text-white/50" style={{ borderColor: T.border }}>
        لا توجد سلاسل تكديس مفعّلة حالياً. يمكنك ربط عادة بأخرى عبر اختيار العادة التابعة.
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-extrabold text-white/80">
          🔗 سلاسل التكديس التلقائي (Habit Stacking)
        </span>
        <span className="text-[10.5px] text-white/40">قاعدة جيمس كلير: بعد [س] أفعل [ص]</span>
      </div>
      <div className="space-y-2">
        {chains.map((chain, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center gap-2 rounded-xl border p-2.5 text-[12px]"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <span
              className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                chain.lead.done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/80"
              }`}
            >
              {chain.lead.done ? "✓ " : ""}
              {chain.lead.label}
            </span>
            <span className="text-white/40 font-bold">➔ يتبعه:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {chain.followers.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onTick && onTick(f.id)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold transition-all hover:scale-105 ${
                    f.done
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-white/15 bg-white/5 text-white/80"
                  }`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${f.done ? "bg-emerald-400" : "border border-white/40"}`} />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RemainingHabitsCard({
  block,
  open,
  missed,
  books,
  habits = [],
  state,
  setState,
  remaining,
  allDone,
  onTick,
  onGo,
}) {
  const [flowOpen, setFlowOpen] = useState(false);
  const [shieldOpen, setShieldOpen] = useState(false);
  const [subTab, setSubTab] = useState("habits");

  const today = dayKey();
  const freezes = state ? freezeShape(state.freezes) : null;
  const isFrozen = freezes ? (freezes.dates || []).includes(today) : false;

  const currentHabits = habits.length > 0 ? habits : [...open.here, ...missed, ...(open.later || [])];

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h3
          className="flex items-center gap-2 text-[15px] font-extrabold"
          style={{ color: T.primaryLift }}
        >
          <ListChecks size={16} /> العادات والروتين اليومي
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFlowOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[11.5px] font-black text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            style={{
              borderColor: `${T.cta}66`,
              background: `linear-gradient(135deg, ${T.cta}40, ${T.primary}40)`,
            }}
          >
            <Rocket size={13} style={{ color: T.cta }} /> بدء الروتين الآن
          </button>

          <button
            type="button"
            onClick={() => setShieldOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-extrabold transition-all hover:bg-white/10"
            style={{
              borderColor: isFrozen ? `${T.sky}60` : "rgba(255,255,255,0.12)",
              backgroundColor: isFrozen ? `${T.sky}20` : "rgba(255,255,255,0.03)",
              color: isFrozen ? T.sky : "white",
            }}
            title="درع تجميد السلسلة"
          >
            {isFrozen ? <ShieldCheck size={13} /> : <Shield size={13} />}
            <span>{isFrozen ? "الدرع نشط" : "درع السلسلة"}</span>
          </button>

          <Badge tint={allDone ? T.primary : T.cta}>
            <span dir="ltr" className="tabular-nums">
              {remaining}
            </span>
            {" متبقية"}
          </Badge>
          <Btn variant="ghost" size="sm" onClick={() => onGo("routine")}>
            الروتين <ArrowLeft size={13} />
          </Btn>
        </div>
      </div>

      {/* تبويبات سريعة: العادات | أعمدة الهوية | سلاسل التكديس */}
      <div className="mt-3 flex items-center gap-1.5 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setSubTab("habits")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-all ${
            subTab === "habits"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          قائمة العادات
        </button>
        <button
          type="button"
          onClick={() => setSubTab("identities")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-all ${
            subTab === "identities"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          🏛️ أعمدة الهوية
        </button>
        <button
          type="button"
          onClick={() => setSubTab("chains")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-all ${
            subTab === "chains"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          🔗 سلاسل التكديس
        </button>
      </div>

      {subTab === "identities" && (
        <IdentityPillarsWidget habits={currentHabits} />
      )}

      {subTab === "chains" && (
        <ChainedHabitsView habits={currentHabits} onTick={onTick} />
      )}

      {subTab === "habits" && (
        <>
          {allDone ? (
            <p
              className="mt-4 rounded-xl border px-3.5 py-6 text-center text-[13px] font-bold leading-relaxed"
              style={{
                borderColor: `${T.primary}3D`,
                backgroundColor: `${T.primary}12`,
                color: T.primaryLift,
              }}
            >
              كل عادات اليوم تمّت. أغلق الشاشة واذهب — لا شيء ينتظرك هنا.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-bold" style={{ color: block.tint }}>
                  {block.label} — الآن
                </p>
                {open.here.length ? (
                  <div className="space-y-1.5">
                    {open.here.map((h) => (
                      <TodayHabit
                        key={h.id}
                        habit={h}
                        book={bookForHabit(h, books)}
                        onToggle={() => onTick(h.id)}
                        onToggleTiny={() => onTick(h.id, true)}
                        onToggleLevel={(lvl) => onTick(h.id, lvl === "micro", lvl)}
                      />
                    ))}
                  </div>
                ) : (
                  <p
                    className="rounded-xl border border-dashed px-3 py-3 text-center text-[11.5px]"
                    style={{ borderColor: T.border, color: T.faint }}
                  >
                    لا شيء متبقٍّ في هذا البلوك.
                  </p>
                )}
              </div>

              {missed.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold" style={{ color: T.accent }}>
                    فاتك في بلوكات مضت —{" "}
                    <span dir="ltr" className="tabular-nums">
                      {missed.length}
                    </span>
                  </p>
                  <div className="space-y-1.5">
                    {missed.slice(0, 5).map((h) => (
                      <TodayHabit
                        key={h.id}
                        habit={h}
                        book={bookForHabit(h, books)}
                        onToggle={() => onTick(h.id)}
                        onToggleTiny={() => onTick(h.id, true)}
                        onToggleLevel={(lvl) => onTick(h.id, lvl === "micro", lvl)}
                        late
                      />
                    ))}
                  </div>
                  {missed.length > 5 && (
                    <button
                      onClick={() => onGo("routine")}
                      className="mt-2 w-full rounded-xl border border-dashed py-2 text-[11.5px] transition-colors hover:bg-white/[0.06]"
                      style={{ borderColor: T.border, color: T.muted }}
                    >
                      وبقي{" "}
                      <span dir="ltr" className="tabular-nums">
                        {missed.length - 5}
                      </span>{" "}
                      — افتح الروتين
                    </button>
                  )}
                </div>
              )}

              {open.later.length > 0 && (
                <p className="text-[11px]" style={{ color: T.faint }}>
                  وأمامك{" "}
                  <span dir="ltr" className="tabular-nums">
                    {open.later.length}
                  </span>{" "}
                  عادة في بلوكات لم تبدأ بعد.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* نوافذ تدفق الروتين ودرع السلسلة */}
      <RoutineFlowModal
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        habits={currentHabits}
        books={books}
        onTick={onTick}
        onTickLevel={(id, lvl) => onTick(id, lvl === "micro", lvl)}
      />

      {state && setState && (
        <StreakShieldModal
          open={shieldOpen}
          onClose={() => setShieldOpen(false)}
          state={state}
          setState={setState}
        />
      )}
    </Card>
  );
}

export function LecturesCard({ dow, sections, ahead, mins, onGo }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3
            className="flex items-center gap-2 text-[15px] font-extrabold"
            style={{ color: T.sky }}
          >
            <School size={16} /> محاضرات اليوم
          </h3>
          <p className="mt-1 text-[10.5px]" style={{ color: T.faint }}>
            {uniDayOf(dow)?.label || "نهاية الأسبوع"}
          </p>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => onGo("uni")}>
          الجامعة <ArrowLeft size={13} />
        </Btn>
      </div>

      <div className="mt-4 space-y-1.5">
        {sections.length ? (
          sections.map((r) => (
            <TodayLine
              key={r.slot.id}
              tint={r.course.tint}
              icon={GraduationCap}
              title={courseName(r.course)}
              sub={[r.slot.room, r.course.instructor].filter(Boolean).join(" · ")}
              time={`${prettyTime(r.slot.from)} – ${prettyTime(r.slot.to)}`}
              when={r.now ? "الآن" : r.to <= mins ? "انتهت" : ""}
              now={r.now}
            />
          ))
        ) : (
          <>
            <p
              className="rounded-xl border border-dashed px-3 py-4 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا محاضرات اليوم.
            </p>
            {ahead && (
              <TodayLine
                tint={ahead.course.tint}
                icon={CalendarClock}
                title={courseName(ahead.course)}
                sub={`القادمة · ${uniDayOf(ahead.slot.day)?.label || ""}`}
                time={prettyTime(ahead.slot.from)}
                when={ahead.inDays === 1 ? "غدًا" : ahead.inDays === 0 ? "اليوم" : ""}
              />
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export function NearestDueCard({ items, onGo }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3
            className="flex items-center gap-2 text-[15px] font-extrabold"
            style={{ color: T.rose }}
          >
            <AlarmClock size={16} /> أقرب اختبار أو تسليم
          </h3>
          <p className="mt-1 text-[10.5px]" style={{ color: T.faint }}>
            من الجامعة والتقويم معًا
          </p>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => onGo("agenda")}>
          التقويم <ArrowLeft size={13} />
        </Btn>
      </div>

      <div className="mt-4 space-y-1.5">
        {items.length ? (
          items.map((r) => {
            const left = daysUntil(r.on);
            return (
              <button
                key={r.key}
                onClick={() => onGo(r.go)}
                className="block w-full text-right"
              >
                <TodayLine
                  tint={r.tint}
                  icon={ClipboardList}
                  title={r.title}
                  sub={r.sub}
                  time={r.time ? prettyTime(r.time) : ""}
                  when={whenWord(r.on)}
                  hot={left !== null && left <= 1}
                />
              </button>
            );
          })
        ) : (
          <p
            className="rounded-xl border border-dashed px-3 py-4 text-center text-[11.5px]"
            style={{ borderColor: T.border, color: T.faint }}
          >
            لا تسليمات ولا اختبارات مسجّلة.
          </p>
        )}
      </div>
    </Card>
  );
}

export function PrayerCard({ place, onOpenSettings }) {
  useMinuteClock();
  const now = new Date();
  const p = placeShape(place);
  const times = prayerTimes(p, now);
  const next = nextPrayer(p, now);
  const mins = now.getHours() * 60 + now.getMinutes();

  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="flex items-center gap-2 text-[15px] font-extrabold"
            style={{ color: T.violet }}
          >
            <MoonStar size={16} /> أوقات الصلاة
          </h3>
          <button
            onClick={onOpenSettings}
            className="mt-1 inline-flex items-center gap-1 text-[10.5px] transition-colors hover:text-white/70"
            style={{ color: T.faint }}
            title="تغيير المدينة"
          >
            <MapPin size={10} /> {p.label}
            {p.asr === 2 && " · حنفي"}
          </button>
        </div>
        {next && (
          <div className="shrink-0 text-left">
            <p className="text-[10px]" style={{ color: T.faint }}>
              {next.tomorrow ? "فجر غدٍ بعد" : `${next.label} بعد`}
            </p>
            <p
              dir="ltr"
              className="text-[15px] font-extrabold tabular-nums"
              style={{ color: T.cta }}
            >
              {next.left >= 60
                ? `${Math.floor(next.left / 60)}:${String(next.left % 60).padStart(2, "0")}`
                : `${next.left} د`}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PRAYERS.map((row) => {
          const t = times[row.id];
          const at = t === null || !Number.isFinite(t) ? null : fixHour(t) * 60;
          const on = !row.mark && next && next.id === row.id && !next.tomorrow;
          const past = at !== null && at <= mins;
          const Icon = row.icon;
          return (
            <div
              key={row.id}
              className="rounded-xl border px-2 py-2.5 text-center transition-all duration-300"
              style={{
                borderColor: on ? `${T.cta}80` : `${row.tint}2E`,
                background: on ? `${T.cta}1F` : `${row.tint}0D`,
                boxShadow: on ? `0 0 20px -8px ${T.cta}` : "none",
                opacity: past && !on ? 0.45 : 1,
              }}
            >
              <Icon size={13} className="mx-auto" style={{ color: on ? T.cta : row.tint }} />
              <p
                dir="ltr"
                className="mt-1 text-[13.5px] font-extrabold tabular-nums"
                style={{ color: on ? T.ctaLift : row.tint }}
              >
                {clockAt(t)}
              </p>
              <p className="truncate text-[9.5px]" style={{ color: on ? T.ctaLift : T.faint }}>
                {row.label}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-auto pt-3 text-[10px] leading-relaxed" style={{ color: T.faint }}>
        محسوبة على طريقة أم القرى محليًّا — تعمل بلا إنترنت، ولا تُحمّل من أي
        خدمة.
      </p>
    </Card>
  );
}

export function WaterCard({ count, goal, onSet }) {
  const [burst, fireBurst] = useBurst(700);
  const n = Math.min(goal, Math.max(0, count || 0));
  const pct = goal ? Math.round((n / goal) * 100) : 0;
  const full = n >= goal;

  const tap = (i) => {
    const to = n === i ? i - 1 : i;
    if (to > n && to >= goal) fireBurst();
    onSet(to);
  };

  return (
    <Card className={`flex h-full flex-col p-5 sm:p-6${burst ? " los-reward" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          className="flex items-center gap-2 text-[15px] font-extrabold"
          style={{ color: full ? T.primary : T.sky }}
        >
          <Droplets size={16} /> شرب الماء
        </h3>
        <span
          dir="ltr"
          className="shrink-0 rounded-lg px-2 py-0.5 text-[11.5px] font-extrabold tabular-nums"
          style={{
            background: full ? `${T.primary}1A` : "rgba(255,255,255,0.05)",
            color: full ? T.primary : T.muted,
          }}
        >
          {n} / {goal}
        </span>
      </div>

      <div className="mb-4 mt-4 flex flex-wrap gap-1.5">
        {Array.from({ length: goal }, (_, i) => {
          const on = i < n;
          return (
            <button
              key={i}
              onClick={() => tap(i + 1)}
              aria-label={`كوب ${i + 1}`}
              aria-pressed={on}
              title={`كوب ${i + 1}`}
              className="relative h-10 w-7 overflow-hidden rounded-b-lg rounded-t-sm border transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                borderColor: on ? `${T.sky}99` : T.border,
                background: "rgba(255,255,255,0.03)",
                boxShadow: on ? `0 0 14px -6px ${T.sky}` : "none",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 transition-all duration-500"
                style={{
                  height: on ? "78%" : "0%",
                  backgroundImage: `linear-gradient(180deg, ${T.sky}CC, ${T.indigo}E6)`,
                }}
              />
            </button>
          );
        })}
      </div>

      <div
        className="mt-auto h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundImage: full
              ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
              : `linear-gradient(90deg, ${T.sky}, ${T.indigo})`,
            boxShadow: pct ? `0 0 12px ${full ? T.primary : T.sky}99` : "none",
          }}
        />
      </div>
      <p
        className="mt-2.5 text-[10.5px] leading-relaxed"
        style={{ color: full ? T.primary : T.faint }}
      >
        {full ? (
          "بلغت هدفك اليوم 💧"
        ) : (
          <>
            بقي{" "}
            <span dir="ltr" className="tabular-nums">
              {goal - n}
            </span>{" "}
            {cupWord(goal - n)}
            {n > 0 && " — اضغط الكوب الممتلئ الأخير للتراجع."}
          </>
        )}
      </p>
    </Card>
  );
}

/* ==================================================================== *
 *  MorningLaunchpadAndShutdownCard — طقس الإقلاع الصباحي وإغلاق المساء
 *  30-second Morning Launchpad + Cal Newport Evening Shutdown Ritual
 * ==================================================================== */
const RITUAL_STORAGE_KEY = "los-daily-rituals-v1";

function readRitualStore() {
  try {
    const raw = localStorage.getItem(RITUAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRitualStore(nextMap) {
  try {
    localStorage.setItem(RITUAL_STORAGE_KEY, JSON.stringify(nextMap));
  } catch {
    /* ignore */
  }
}

const SLEEP_PRESETS = [
  { val: 5, label: "5 س", hint: "أقل من الكفاية" },
  { val: 6, label: "6 س", hint: "متوسط" },
  { val: 7, label: "7 س", hint: "جيد" },
  { val: 7.5, label: "7.5 س", hint: "مثالي (5 دورات)" },
  { val: 8, label: "8 س", hint: "استشفاء كامل" },
  { val: 9, label: "9+ س", hint: "تعويض عميق" },
];

const ENERGY_LEVELS = [
  { val: 1, label: "١ · خمول", color: "#F43F5E" },
  { val: 2, label: "٢ · هادئ", color: "#F59E0B" },
  { val: 3, label: "٣ · متوازن", color: "#38BDF8" },
  { val: 4, label: "٤ · نشيط", color: "#10B981" },
  { val: 5, label: "٥ · ذروة", color: "#A78BFA" },
];

export function MorningLaunchpadAndShutdownCard({
  state,
  setState,
  discipline = 0,
  doneCount = 0,
  totalHabits = 0,
  onOpenTomorrow,
  onGo,
}) {
  const [burst, fireBurst] = useBurst(850);
  const today = dayKey();
  const tomorrowOn = tomorrowKey();
  const currentHour = new Date().getHours();
  const isEveningDefault = currentHour >= 17 || currentHour < 4;

  const [ritualMap, setRitualMap] = useState(() => readRitualStore());
  const todayRowFromHistory = useMemo(
    () => rows(state.history).find((h) => h && h.date === today) || null,
    [state.history, today],
  );

  const savedRitual = useMemo(() => {
    const fromState = state.dailyRituals?.[today] || {};
    const fromStorage = ritualMap[today] || {};
    return {
      morningDone: !!(fromState.morningDone || fromStorage.morningDone),
      morningAt: fromState.morningAt || fromStorage.morningAt || "",
      sleepHours:
        Number.isFinite(+fromState.sleepHours) && +fromState.sleepHours > 0
          ? +fromState.sleepHours
          : Number.isFinite(+todayRowFromHistory?.sleepHours) && +todayRowFromHistory.sleepHours > 0
            ? +todayRowFromHistory.sleepHours
            : Number.isFinite(+fromStorage.sleepHours) && +fromStorage.sleepHours > 0
              ? +fromStorage.sleepHours
              : 7.5,
      morningEnergy:
        Number.isFinite(+fromState.morningEnergy) && +fromState.morningEnergy >= 1
          ? +fromState.morningEnergy
          : Number.isFinite(+fromStorage.morningEnergy) && +fromStorage.morningEnergy >= 1
            ? +fromStorage.morningEnergy
            : 4,
      intention:
        typeof fromState.intention === "string"
          ? fromState.intention
          : typeof fromStorage.intention === "string"
            ? fromStorage.intention
            : "",
      eveningDone: !!(fromState.eveningDone || fromStorage.eveningDone),
      eveningAt: fromState.eveningAt || fromStorage.eveningAt || "",
      eveningWin:
        typeof fromState.eveningWin === "string"
          ? fromState.eveningWin
          : typeof fromStorage.eveningWin === "string"
            ? fromStorage.eveningWin
            : "",
      rolledCount:
        Number.isFinite(+fromState.rolledCount)
          ? +fromState.rolledCount
          : Number.isFinite(+fromStorage.rolledCount)
            ? +fromStorage.rolledCount
            : 0,
    };
  }, [state.dailyRituals, ritualMap, today, todayRowFromHistory]);

  const [mode, setMode] = useState(() => (isEveningDefault ? "evening" : "morning"));
  const [expanded, setExpanded] = useState(() => {
    if (isEveningDefault) return !savedRitual.eveningDone;
    return !savedRitual.morningDone;
  });

  const [sleepDraft, setSleepDraft] = useState(savedRitual.sleepHours);
  const [energyDraft, setEnergyDraft] = useState(savedRitual.morningEnergy);
  const [intentionDraft, setIntentionDraft] = useState(savedRitual.intention);
  const [quickTaskText, setQuickTaskText] = useState("");
  const [eveningWinDraft, setEveningWinDraft] = useState(savedRitual.eveningWin);
  const [brainDumpText, setBrainDumpText] = useState("");
  const [statusToast, setStatusToast] = useState("");

  // 👇 بيانات ورشة المراجعة والتخطيط الأسبوعي 👇
  const weekKey = useMemo(() => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun..6=Sat
    const diffToSat = (day + 1) % 7;
    const sat = new Date(d);
    sat.setDate(d.getDate() - diffToSat);
    return dayKey(sat);
  }, []);

  const savedWeekly = useMemo(() => {
    const fromState = state.weeklyReviews?.[weekKey] || {};
    let fromStorage = {};
    try {
      const raw = localStorage.getItem("los-weekly-reviews-v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed[weekKey]) fromStorage = parsed[weekKey];
      }
    } catch {
      /* ignore */
    }
    return {
      done: !!(fromState.done || fromStorage.done),
      savedAt: fromState.savedAt || fromStorage.savedAt || "",
      weeklyWin: fromState.weeklyWin || fromStorage.weeklyWin || "",
      weeklyLesson: fromState.weeklyLesson || fromStorage.weeklyLesson || "",
      keystoneHabitId: fromState.keystoneHabitId || fromStorage.keystoneHabitId || "",
      focusGoalId: fromState.focusGoalId || fromStorage.focusGoalId || "",
    };
  }, [state.weeklyReviews, weekKey]);

  const [weeklyWinDraft, setWeeklyWinDraft] = useState(savedWeekly.weeklyWin);
  const [weeklyLessonDraft, setWeeklyLessonDraft] = useState(savedWeekly.weeklyLesson);
  const [keystoneDraft, setKeystoneDraft] = useState(savedWeekly.keystoneHabitId);
  const [focusGoalDraft, setFocusGoalDraft] = useState(savedWeekly.focusGoalId);
  const [weeklyTaskText, setWeeklyTaskText] = useState("");

  useEffect(() => {
    setWeeklyWinDraft(savedWeekly.weeklyWin);
    setWeeklyLessonDraft(savedWeekly.weeklyLesson);
    setKeystoneDraft(savedWeekly.keystoneHabitId);
    setFocusGoalDraft(savedWeekly.focusGoalId);
  }, [
    savedWeekly.weeklyWin,
    savedWeekly.weeklyLesson,
    savedWeekly.keystoneHabitId,
    savedWeekly.focusGoalId,
  ]);

  const weekStats = useMemo(() => {
    const last7Keys = [];
    const nowD = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(nowD);
      d.setDate(nowD.getDate() - i);
      last7Keys.push(dayKey(d));
    }
    const keySet = new Set(last7Keys);
    const histRows = rows(state.history).filter((h) => h && keySet.has(h.date));
    const avgPct = histRows.length
      ? Math.round(histRows.reduce((s, h) => s + (Number(h.pct) || 0), 0) / histRows.length)
      : discipline;
    const bestRow = histRows.reduce(
      (best, h) => (!best || (Number(h.pct) || 0) > (Number(best.pct) || 0) ? h : best),
      null,
    );
    const pages = rows(state.reads)
      .filter((r) => r && keySet.has(r.date))
      .reduce((s, r) => s + (Number(r.pages) || 0), 0);
    const focusMins = rows(state.pomodoros)
      .filter((p) => p && keySet.has(p.date))
      .reduce((s, p) => s + (Number(p.mins) || 0), 0);
    return {
      loggedDays: histRows.length,
      avgPct,
      bestPct: bestRow ? Math.round(Number(bestRow.pct) || 0) : discipline,
      bestDate: bestRow ? bestRow.date : today,
      pages,
      focusMins,
    };
  }, [state.history, state.reads, state.pomodoros, discipline, today]);

  useEffect(() => {
    setSleepDraft(savedRitual.sleepHours);
    setEnergyDraft(savedRitual.morningEnergy);
    setIntentionDraft(savedRitual.intention);
    setEveningWinDraft(savedRitual.eveningWin);
  }, [
    savedRitual.sleepHours,
    savedRitual.morningEnergy,
    savedRitual.intention,
    savedRitual.eveningWin,
  ]);

  const flashNote = (msg) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(""), 3200);
  };

  const persistRitualPatch = (patch, extraStateUpdater) => {
    const mergedToday = {
      ...savedRitual,
      ...patch,
    };
    const nextMap = {
      ...ritualMap,
      [today]: mergedToday,
    };
    setRitualMap(nextMap);
    writeRitualStore(nextMap);

    setState((prev) => {
      const prevRituals = prev.dailyRituals && typeof prev.dailyRituals === "object" ? prev.dailyRituals : {};
      const nextHistory = rows(prev.history).some((h) => h && h.date === today)
        ? rows(prev.history).map((h) =>
            h && h.date === today
              ? {
                  ...h,
                  sleepHours: mergedToday.sleepHours,
                  morningEnergy: mergedToday.morningEnergy,
                  morningIntention: mergedToday.intention,
                  eveningWin: mergedToday.eveningWin,
                }
              : h,
          )
        : [
            ...rows(prev.history),
            {
              date: today,
              pct: discipline,
              sleepHours: mergedToday.sleepHours,
              morningEnergy: mergedToday.morningEnergy,
              morningIntention: mergedToday.intention,
              eveningWin: mergedToday.eveningWin,
            },
          ];

      const baseNext = {
        ...prev,
        sleepHours: mergedToday.sleepHours,
        history: nextHistory,
        dailyRituals: {
          ...prevRituals,
          [today]: mergedToday,
        },
      };
      return extraStateUpdater ? extraStateUpdater(baseNext) : baseNext;
    });
  };

  const allTasks = rows(state.tasks);
  const topTasks = useMemo(
    () => allTasks.filter((t) => t.today && !t.done),
    [allTasks],
  );
  const completedTasksToday = useMemo(
    () => allTasks.filter((t) => t.done && (t.today || t.scheduled)),
    [allTasks],
  );
  const openTodayTasks = useMemo(
    () => allTasks.filter((t) => !t.done && (t.today || t.scheduled)),
    [allTasks],
  );
  const candidatePool = useMemo(
    () => allTasks.filter((t) => !t.done && !t.today).slice(0, 5),
    [allTasks],
  );

  const waterGoal = clampGoal(state.waterGoal);
  const waterCount = Math.min(waterGoal, Math.max(0, state.water || 0));

  const addMorningCup = () => {
    setState((s) => ({
      ...s,
      water: Math.min(clampGoal(s.waterGoal), Math.max(0, (s.water || 0) + 1)),
    }));
    flashNote("💧 تم تسجيل كوب ماء صباحي لتنشيط الدورة الدموية!");
  };

  const promoteTaskToTop = (taskId) => {
    if (topTasks.length >= TOP_TASK_CAP) {
      flashNote("قائمة أهم ٣ مهام مكتملة (٣/٣)");
      return;
    }
    setState((s) => ({
      ...s,
      tasks: capToday(
        rows(s.tasks).map((t) =>
          t.id === taskId ? { ...t, today: true, scheduled: false } : t,
        ),
      ),
    }));
  };

  const handleQuickAddTopTask = (e) => {
    e.preventDefault();
    const clean = quickTaskText.trim();
    if (!clean) return;
    const asTop = topTasks.length < TOP_TASK_CAP;
    const created = taskShape({
      id: uid(),
      text: clean,
      quadrant: "q1",
      today: asTop,
      scheduled: !asTop,
      done: false,
      createdAt: today,
    });
    setState((s) => ({
      ...s,
      tasks: capToday([created, ...rows(s.tasks)]),
    }));
    setQuickTaskText("");
    flashNote(asTop ? "✅ أُضيفت إلى أهم ٣ مهام اليوم" : "✅ أُضيفت إلى مهام اليوم الإضافية");
  };

  const handleLaunchMorning = () => {
    const nowTime = new Date().toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    fireBurst();
    persistRitualPatch({
      morningDone: true,
      morningAt: nowTime,
      sleepHours: sleepDraft,
      morningEnergy: energyDraft,
      intention: intentionDraft.trim(),
    });
    setExpanded(false);
    flashNote("🚀 تم اعتماد الإقلاع الصباحي! انطلق ليوم استثنائي.");
  };

  const handleRolloverOpenTasks = () => {
    if (openTodayTasks.length === 0) {
      flashNote("✨ لا توجد مهام مفتوحة لترحيلها — يومك نظيف تمامًا!");
      return;
    }
    const toRoll = openTodayTasks;
    persistRitualPatch(
      {
        rolledCount: (savedRitual.rolledCount || 0) + toRoll.length,
      },
      (s) => {
        let nextPrep = s.tomorrow;
        for (const t of toRoll.slice(0, TOP_TASK_CAP)) {
          nextPrep = prepPickAdd(nextPrep, t.id, tomorrowOn);
        }
        return {
          ...s,
          tomorrow: nextPrep,
        };
      },
    );
    flashNote(`📦 تم تجهيز وترحيل ${toRoll.length} مهام إلى خطة الغد (${tomorrowOn}) بنجاح!`);
  };

  const handleBrainDumpToInbox = (e) => {
    e.preventDefault();
    const clean = brainDumpText.trim();
    if (!clean) return;
    const item = {
      id: `inb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: clean,
      source: "shutdown-ritual",
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      inbox: [item, ...rows(s.inbox)],
    }));
    setBrainDumpText("");
    flashNote("🧠 تم تفريغ الفكرة إلى صندوق الوارد — نم بذهن صافٍ!");
  };

  const handleCompleteEveningShutdown = () => {
    const nowTime = new Date().toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    fireBurst();
    persistRitualPatch({
      eveningDone: true,
      eveningAt: nowTime,
      eveningWin: eveningWinDraft.trim(),
    });
    setExpanded(false);
    flashNote("🌙 تم ختم اليوم وإغلاق المكتب بسلام. تصبح على خير وإنجاز!");
  };

  const handleAddWeeklyPriorityTask = (e) => {
    e.preventDefault();
    const clean = weeklyTaskText.trim();
    if (!clean) return;
    const asTop = topTasks.length < TOP_TASK_CAP;
    const created = taskShape({
      id: uid(),
      text: clean,
      quadrant: "q2",
      today: asTop,
      scheduled: !asTop,
      done: false,
      linkedGoalId: focusGoalDraft || null,
      createdAt: today,
    });
    setState((s) => ({
      ...s,
      tasks: capToday([created, ...rows(s.tasks)]),
    }));
    setWeeklyTaskText("");
    flashNote(
      focusGoalDraft
        ? "🎯 أُضيفت الأولوية الأسبوعية ورُبطت بهدفك في إرث 2030!"
        : "✅ أُضيفت الأولوية الأسبوعية إلى قائمة مهامك!",
    );
  };

  const handleSaveWeeklyReview = () => {
    const nowTime = new Date().toLocaleDateString("ar-SA", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const entry = {
      done: true,
      savedAt: nowTime,
      weeklyWin: weeklyWinDraft.trim(),
      weeklyLesson: weeklyLessonDraft.trim(),
      keystoneHabitId: keystoneDraft || "",
      focusGoalId: focusGoalDraft || "",
      avgPct: weekStats.avgPct,
    };
    try {
      const raw = localStorage.getItem("los-weekly-reviews-v1");
      const map = raw ? JSON.parse(raw) : {};
      map[weekKey] = entry;
      localStorage.setItem("los-weekly-reviews-v1", JSON.stringify(map));
    } catch {
      /* ignore */
    }
    setState((s) => ({
      ...s,
      weeklyReviews: {
        ...(s.weeklyReviews && typeof s.weeklyReviews === "object" ? s.weeklyReviews : {}),
        [weekKey]: entry,
      },
    }));
    fireBurst();
    setExpanded(false);
    flashNote("🗓️ تم اعتماد مراجعة وخطة الأسبوع بنجاح! أسبوع مبارك وواضح الاتجاه.");
  };

  const isMorning = mode === "morning";
  const isWeekly = mode === "weekly";
  const accentColor = isWeekly ? T.primary : isMorning ? T.warn : T.indigo;
  const isWeekend = new Date().getDay() === 5 || new Date().getDay() === 6;

  return (
    <Card
      className={`overflow-hidden p-5 sm:p-6 transition-all duration-300${burst ? " los-reward" : ""}`}
      style={{
        borderColor: `${accentColor}45`,
        background: isWeekly
          ? "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(56,189,248,0.05) 55%, rgba(12,16,28,0.95) 100%)"
          : isMorning
            ? "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(16,185,129,0.04) 55%, rgba(15,18,30,0.92) 100%)"
            : "linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(167,139,250,0.05) 55%, rgba(12,14,24,0.95) 100%)",
      }}
    >
      {/* الشريط العلوي والتبديل بين الإقلاع الصباحي وإغلاق المساء والتخطيط الأسبوعي */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${accentColor}55`,
              background: `${accentColor}1A`,
              color: accentColor,
              boxShadow: `0 0 22px -8px ${accentColor}`,
            }}
          >
            {isWeekly ? <CalendarDays size={21} /> : isMorning ? <Sunrise size={21} /> : <MoonStar size={21} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15.5px] font-extrabold" style={{ color: T.ink }}>
                {isWeekly
                  ? "ورشة المراجعة والتخطيط الأسبوعي (١٠ دقائق)"
                  : isMorning
                    ? "طقس الإقلاع الصباحي (٣٠ ثانية)"
                    : "طقس إغلاق اليوم المسائي (Shutdown Ritual)"}
              </h3>
              {savedRitual.morningDone && (
                <Badge tint={T.primary}>
                  🌅 إقلاع الصباح {savedRitual.morningAt ? `· ${savedRitual.morningAt}` : "✓"}
                </Badge>
              )}
              {savedRitual.eveningDone && (
                <Badge tint={T.violet}>
                  🌙 إغلاق المساء {savedRitual.eveningAt ? `· ${savedRitual.eveningAt}` : "✓"}
                </Badge>
              )}
              {savedWeekly.done && (
                <Badge tint={T.sky}>
                  🗓️ خطة الأسبوع ✓
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-[11.5px]" style={{ color: T.muted }}>
              {isWeekly
                ? "حصاد آخر ٧ أيام تلقائيًا، تثبيت العادة المحورية، وربط أولويات الأسبوع بإرث 2030"
                : isMorning
                  ? "اضبط بوصلتك الصباحية: النوم، الطاقة البيولوجية، أول كوب ماء، وأهم ٣ مهام"
                  : "أغلق ملفات اليوم بلا قلق: جرد الإنجاز، ترحيل المهام المتبقية، وتصفية الذهن قبل النوم"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex flex-wrap rounded-xl border p-1"
            style={{ borderColor: T.border, background: "rgba(0,0,0,0.28)" }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("morning");
                setExpanded(true);
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-extrabold transition-all"
              style={{
                background: isMorning ? `${T.warn}26` : "transparent",
                color: isMorning ? T.warn : T.muted,
              }}
            >
              <Sun size={13} /> إقلاع الصباح
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("evening");
                setExpanded(true);
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-extrabold transition-all"
              style={{
                background: mode === "evening" ? `${T.indigo}2E` : "transparent",
                color: mode === "evening" ? T.violet : T.muted,
              }}
            >
              <Moon size={13} /> إغلاق المساء
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("weekly");
                setExpanded(true);
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-extrabold transition-all"
              style={{
                background: isWeekly ? `${T.primary}26` : "transparent",
                color: isWeekly ? T.primaryLift : isWeekend && !savedWeekly.done ? T.warn : T.muted,
              }}
            >
              <CalendarDays size={13} /> تخطيط الأسبوع
              {isWeekend && !savedWeekly.done && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition-colors hover:bg-white/10"
            style={{ borderColor: T.border, color: T.ink }}
          >
            {expanded ? "طيّ البطاقة" : "فتح الطقس"}
          </button>
        </div>
      </div>

      {statusToast && (
        <div
          className="mt-3 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-bold"
          style={{
            borderColor: `${T.primary}55`,
            background: `${T.primary}18`,
            color: T.primaryLift,
          }}
        >
          <Sparkles size={14} />
          <span>{statusToast}</span>
        </div>
      )}

      {/* العرض المضغوط عند إتمام الطقس وطيّ البطاقة */}
      {!expanded && isMorning && savedRitual.morningDone && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.22)",
          }}
        >
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-extrabold" style={{ color: T.primary }}>
              <Rocket size={14} /> تم الإقلاع الصباحي
            </span>
            <span style={{ color: T.muted }}>
              😴 نوم: <strong dir="ltr" className="text-white">{savedRitual.sleepHours}h</strong>
            </span>
            <span style={{ color: T.muted }}>
              ⚡ طاقة: <strong dir="ltr" className="text-white">{savedRitual.morningEnergy}/5</strong>
            </span>
            <span style={{ color: T.muted }}>
              🎯 أهم المهام: <strong dir="ltr" className="text-white">{topTasks.length}/{TOP_TASK_CAP}</strong>
            </span>
            {savedRitual.intention && (
              <span
                className="rounded-lg border px-2.5 py-0.5 text-[11.5px] font-bold"
                style={{
                  borderColor: `${T.warn}40`,
                  background: `${T.warn}14`,
                  color: T.warn,
                }}
              >
                🧭 نية اليوم: «{savedRitual.intention}»
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[11.5px] font-bold underline-offset-4 hover:underline"
            style={{ color: T.warn }}
          >
            تعديل الإقلاع
          </button>
        </div>
      )}

      {!expanded && mode === "evening" && savedRitual.eveningDone && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
          style={{
            borderColor: `${T.violet}38`,
            background: "rgba(15, 12, 32, 0.5)",
          }}
        >
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-extrabold" style={{ color: T.violet }}>
              <CheckCircle2 size={14} /> Shutdown Complete — المكتب مغلق بسلام
            </span>
            <span style={{ color: T.muted }}>
              📊 انضباط اليوم: <strong dir="ltr" className="text-white">{discipline}%</strong>
            </span>
            {savedRitual.eveningWin && (
              <span
                className="rounded-lg border px-2.5 py-0.5 text-[11.5px] font-bold"
                style={{
                  borderColor: `${T.primary}40`,
                  background: `${T.primary}14`,
                  color: T.primaryLift,
                }}
              >
                🏆 مكسب اليوم: «{savedRitual.eveningWin}»
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[11.5px] font-bold underline-offset-4 hover:underline"
            style={{ color: T.violet }}
          >
            مراجعة الإغلاق
          </button>
        </div>
      )}

      {!expanded && isWeekly && savedWeekly.done && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
          style={{
            borderColor: `${T.primary}38`,
            background: "rgba(10, 26, 22, 0.45)",
          }}
        >
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-extrabold" style={{ color: T.primaryLift }}>
              <CheckCircle2 size={14} /> خطة الأسبوع معتمدة
            </span>
            <span style={{ color: T.muted }}>
              📊 متوسط آخر ٧ أيام: <strong dir="ltr" className="text-white">{weekStats.avgPct}%</strong>
            </span>
            {savedWeekly.weeklyWin && (
              <span
                className="rounded-lg border px-2.5 py-0.5 text-[11.5px] font-bold"
                style={{
                  borderColor: `${T.primary}40`,
                  background: `${T.primary}14`,
                  color: T.primaryLift,
                }}
              >
                🏆 انتصار الأسبوع: «{savedWeekly.weeklyWin}»
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[11.5px] font-bold underline-offset-4 hover:underline"
            style={{ color: T.primaryLift }}
          >
            تعديل خطة الأسبوع
          </button>
        </div>
      )}

      {/* ==================== 1) تفاصيل طقس الإقلاع الصباحي ==================== */}
      {expanded && isMorning && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* المربع الأول: النوم + الطاقة + الماء الصباحي */}
            <div
              className="rounded-2xl border p-4 space-y-4"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                    <Moon size={14} style={{ color: T.sky }} /> ١. كم ساعة نمت الليلة الماضية؟
                  </label>
                  <span dir="ltr" className="text-[12px] font-extrabold tabular-nums" style={{ color: T.sky }}>
                    {sleepDraft} hrs
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {SLEEP_PRESETS.map((p) => {
                    const active = Math.abs(sleepDraft - p.val) < 0.1;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setSleepDraft(p.val)}
                        title={p.hint}
                        className="rounded-xl border py-2 text-center transition-all"
                        style={{
                          borderColor: active ? T.sky : T.border,
                          background: active ? `${T.sky}22` : "rgba(255,255,255,0.03)",
                          color: active ? T.sky : T.muted,
                        }}
                      >
                        <div className="text-[12px] font-extrabold">{p.label}</div>
                        <div className="text-[9.5px] opacity-75">{p.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                    <BatteryCharging size={14} style={{ color: T.warn }} /> ٢. شحنة الطاقة والتركيز الآن
                  </label>
                  <span className="text-[11px] font-bold" style={{ color: T.warn }}>
                    {ENERGY_LEVELS.find((e) => e.val === energyDraft)?.label}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {ENERGY_LEVELS.map((lv) => {
                    const active = energyDraft === lv.val;
                    return (
                      <button
                        key={lv.val}
                        type="button"
                        onClick={() => setEnergyDraft(lv.val)}
                        className="rounded-xl border py-2 text-center text-[11px] font-extrabold transition-all"
                        style={{
                          borderColor: active ? lv.color : T.border,
                          background: active ? `${lv.color}24` : "rgba(255,255,255,0.03)",
                          color: active ? lv.color : T.muted,
                        }}
                      >
                        {lv.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* أول كوب ماء + بوصلة النية */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11.5px]" style={{ color: T.muted }}>
                  💧 شرب الماء اليوم:{" "}
                  <strong dir="ltr" className="text-white">
                    {waterCount} / {waterGoal}
                  </strong>{" "}
                  أكواب
                </div>
                <button
                  type="button"
                  onClick={addMorningCup}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11.5px] font-extrabold transition-all hover:scale-105"
                  style={{
                    borderColor: `${T.sky}55`,
                    background: `${T.sky}1C`,
                    color: T.sky,
                  }}
                >
                  <Droplets size={13} /> +١ كوب ماء صباحي
                </button>
              </div>
            </div>

            {/* المربع الثاني: نية اليوم وتثبيت أهم 3 مهام */}
            <div
              className="rounded-2xl border p-4 space-y-3.5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
              }}
            >
              <div>
                <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                  <Target size={14} style={{ color: T.primary }} /> ٣. بوصلة النية (ما الذي سيجعل اليوم ناجحًا؟)
                </label>
                <input
                  type="text"
                  value={intentionDraft}
                  onChange={(e) => setIntentionDraft(e.target.value)}
                  placeholder="مثال: إنجاز ساعتين عميقتين في المشروع دون فتح الجوال..."
                  className="mt-1.5 w-full rounded-xl border bg-black/30 px-3 py-2 text-[12px] text-white placeholder-white/30 focus:outline-none"
                  style={{ borderColor: T.border }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[12px] font-extrabold" style={{ color: T.ink }}>
                    <Flame size={14} style={{ color: T.warn }} /> أهم ٣ مهام حاسمة اليوم ({topTasks.length}/{TOP_TASK_CAP})
                  </span>
                  <button
                    type="button"
                    onClick={() => onGo && onGo("matrix")}
                    className="text-[10.5px] font-bold hover:underline"
                    style={{ color: T.cta }}
                  >
                    فتح المصفوفة ←
                  </button>
                </div>

                <div className="mt-2 space-y-1.5">
                  {topTasks.length > 0 ? (
                    topTasks.map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-[12px]"
                        style={{
                          borderColor: `${T.primary}40`,
                          background: `${T.primary}10`,
                        }}
                      >
                        <span className="truncate font-bold text-white">
                          {idx + 1}. {t.text}
                        </span>
                        <Badge tint={T.primary}>أساسية</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed px-3 py-2 text-[11px]" style={{ borderColor: T.border, color: T.faint }}>
                      لم تختر مهامك الثلاث الحاسمة لليوم بعد — اختر من القائمة أدناه أو أضف مهمة فورًا.
                    </p>
                  )}
                </div>

                {topTasks.length < TOP_TASK_CAP && candidatePool.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-[10.5px]" style={{ color: T.faint }}>
                      ترقية سريعة إلى أهم ٣ مهام بضغطة واحدة:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidatePool.slice(0, 3).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => promoteTaskToTop(c.id)}
                          className="inline-flex max-w-full items-center gap-1 truncate rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-white/10"
                          style={{ borderColor: T.border, color: T.muted }}
                        >
                          <Plus size={11} style={{ color: T.warn }} />
                          <span className="truncate">{c.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleQuickAddTopTask} className="mt-2.5 flex gap-1.5">
                  <input
                    type="text"
                    value={quickTaskText}
                    onChange={(e) => setQuickTaskText(e.target.value)}
                    placeholder="أضف مهمة حاسمة لليوم مباشرة..."
                    className="min-w-0 flex-1 rounded-xl border bg-black/30 px-3 py-1.5 text-[11.5px] text-white placeholder-white/30 focus:outline-none"
                    style={{ borderColor: T.border }}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl border px-3 py-1.5 text-[11.5px] font-extrabold transition-all hover:opacity-90"
                    style={{
                      borderColor: `${T.warn}55`,
                      background: `${T.warn}20`,
                      color: T.warn,
                    }}
                  >
                    + تثبيت
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px]" style={{ color: T.faint }}>
              💡 بيانات نومك وطاقتك تُغذّي تلقائيًا «محرك الارتباط الذكي» و«جدولة الإيقاع البيولوجي».
            </p>
            <button
              type="button"
              onClick={handleLaunchMorning}
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-[13px] font-extrabold text-slate-950 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundImage: `linear-gradient(135deg, ${T.warn}, ${T.primary})`,
                boxShadow: `0 10px 26px -10px ${T.warn}`,
              }}
            >
              <Rocket size={16} /> اعتماد الإقلاع الصباحي وبدء اليوم
            </button>
          </div>
        </div>
      )}

      {/* ==================== 2) تفاصيل طقس إغلاق اليوم المسائي ==================== */}
      {expanded && mode === "evening" && (
        <div className="mt-5 space-y-4">
          {/* شريط جرد الحصاد اليومي */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}
            >
              <div className="text-[10.5px]" style={{ color: T.muted }}>انضباط اليوم</div>
              <div dir="ltr" className="mt-1 text-[18px] font-extrabold tabular-nums" style={{ color: T.primary }}>
                {discipline}%
              </div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}
            >
              <div className="text-[10.5px]" style={{ color: T.muted }}>العادات المنجزة</div>
              <div dir="ltr" className="mt-1 text-[18px] font-extrabold tabular-nums" style={{ color: T.sky }}>
                {doneCount} / {totalHabits}
              </div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}
            >
              <div className="text-[10.5px]" style={{ color: T.muted }}>مهام اليوم المكتملة</div>
              <div dir="ltr" className="mt-1 text-[18px] font-extrabold tabular-nums" style={{ color: T.violet }}>
                {completedTasksToday.length}
              </div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}
            >
              <div className="text-[10.5px]" style={{ color: T.muted }}>مهام مفتوحة متبقية</div>
              <div
                dir="ltr"
                className="mt-1 text-[18px] font-extrabold tabular-nums"
                style={{ color: openTodayTasks.length > 0 ? T.warn : T.primary }}
              >
                {openTodayTasks.length}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* المربع الأول: ترحيل المهام المتبقية للغد بلا تأنيب ضمير */}
            <div
              className="rounded-2xl border p-4 space-y-3"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                  <CalendarClock size={15} style={{ color: T.warn }} /> ١. إخلاء المهام المفتوحة وترحيلها للغد
                </h4>
                {onOpenTomorrow && (
                  <button
                    type="button"
                    onClick={onOpenTomorrow}
                    className="text-[11px] font-bold hover:underline"
                    style={{ color: T.cta }}
                  >
                    نافذة جهّز غدك ←
                  </button>
                )}
              </div>

              {openTodayTasks.length > 0 ? (
                <>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {openTodayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-[11.5px]"
                        style={{
                          borderColor: "rgba(255,255,255,0.07)",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span className="truncate text-white">{t.text}</span>
                        <Badge tint={t.today ? T.warn : T.muted}>
                          {t.today ? "أهم ٣" : "إضافية"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleRolloverOpenTasks}
                    className="w-full rounded-xl border py-2 px-3 text-[12px] font-extrabold transition-all hover:bg-white/10"
                    style={{
                      borderColor: `${T.warn}55`,
                      background: `${T.warn}18`,
                      color: T.warn,
                    }}
                  >
                    📦 ترحيل المهام المتبقية ({openTodayTasks.length}) إلى خطة الغد وإخلاء الذهن
                  </button>
                </>
              ) : (
                <div
                  className="rounded-xl border px-3.5 py-4 text-center text-[12px] font-bold"
                  style={{
                    borderColor: `${T.primary}40`,
                    background: `${T.primary}10`,
                    color: T.primaryLift,
                  }}
                >
                  ✨ أتممت جميع مهام اليوم المجدولة — لا توجد أي مهام عالقة الليلة!
                </div>
              )}
            </div>

            {/* المربع الثاني: مكسب اليوم + تفريغ العقل إلى صندوق الوارد */}
            <div
              className="rounded-2xl border p-4 space-y-3"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
              }}
            >
              <div>
                <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                  <Trophy size={14} style={{ color: T.primary }} /> ٢. أهم مكسب أو نعمة في يومي (تأمل المساء)
                </label>
                <input
                  type="text"
                  value={eveningWinDraft}
                  onChange={(e) => setEveningWinDraft(e.target.value)}
                  placeholder="مثال: التزمت بصلاتي وأنهيت الجزء الأصعب من مذاكرة اليوم..."
                  className="mt-1.5 w-full rounded-xl border bg-black/30 px-3 py-2 text-[12px] text-white placeholder-white/30 focus:outline-none"
                  style={{ borderColor: T.border }}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-extrabold" style={{ color: T.ink }}>
                  <Brain size={14} style={{ color: T.violet }} /> ٣. تفريغ فكرة عالقة قبل النوم (إلى صندوق الوارد)
                </label>
                <form onSubmit={handleBrainDumpToInbox} className="mt-1.5 flex gap-1.5">
                  <input
                    type="text"
                    value={brainDumpText}
                    onChange={(e) => setBrainDumpText(e.target.value)}
                    placeholder="أي فكرة أو تذكير يشغل بالك الآن أفرغه هنا..."
                    className="min-w-0 flex-1 rounded-xl border bg-black/30 px-3 py-1.5 text-[11.5px] text-white placeholder-white/30 focus:outline-none"
                    style={{ borderColor: T.border }}
                  />
                  <button
                    type="submit"
                    className="shrink-0 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[11.5px] font-extrabold transition-all hover:opacity-90"
                    style={{
                      borderColor: `${T.violet}55`,
                      background: `${T.violet}20`,
                      color: T.violet,
                    }}
                  >
                    <Inbox size={13} /> تفريغ
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px]" style={{ color: T.faint }}>
              🌙 قاعدة كال نيوبورت: «حين تقول Shutdown Complete، يتوقف عقلك الباطن عن القلق ويبدأ الاستشفاء الحقيقي».
            </p>
            <button
              type="button"
              onClick={handleCompleteEveningShutdown}
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-[13px] font-extrabold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundImage: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                boxShadow: `0 10px 26px -10px ${T.indigo}`,
              }}
            >
              <MoonStar size={16} /> ختم اليوم وإغلاق المكتب بسلام (Shutdown Complete)
            </button>
          </div>
        </div>
      )}

      {/* ==================== 3) تفاصيل ورشة المراجعة والتخطيط الأسبوعي ==================== */}
      {expanded && isWeekly && (
        <div className="mt-5 space-y-4">
          {/* شريط مرآة آخر 7 أيام (محسوب تلقائيًا) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}
            >
              <div className="text-[10.5px]" style={{ color: T.muted }}>متوسط آخر ٧ أيام</div>
              <div dir="ltr" className="mt-1 text-[18px] font-extrabold tabular-nums" style={{ color: T.primary }}>
                {weekStats.avgPct}%
              </div>
              <div className="mt-0.5 text-[9.5px]" style={{ color: T.faint }}>
                ({weekStats.loggedDays} أيام مسجلة)
              </div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}
            >
              <div className="text-[10.5px]" style={{ color: T.muted }}>أعلى قمة انضباط</div>
              <div dir="ltr" className="mt-1 text-[18px] font-extrabold tabular-nums" style={{ color: T.warn }}>
                {weekStats.bestPct}%
              </div>
              <div className="mt-0.5 text-[9.5px]" style={{ color: T.faint }}>
                {arDate(weekStats.bestDate)}
              </div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}
            >
              <div className="text-[10.5px]" style={{ color: T.muted }}>قراءة آخر ٧ أيام</div>
              <div dir="ltr" className="mt-1 text-[18px] font-extrabold tabular-nums" style={{ color: T.sky }}>
                {weekStats.pages} ص
              </div>
              <div className="mt-0.5 text-[9.5px]" style={{ color: T.faint }}>
                حصاد المعرفة
              </div>
            </div>
            <div
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.22)" }}
            >
              <div className="text-[10.5px]" style={{ color: T.muted }}>التركيز العميق (٧ أيام)</div>
              <div dir="ltr" className="mt-1 text-[18px] font-extrabold tabular-nums" style={{ color: T.violet }}>
                {weekStats.focusMins} د
              </div>
              <div className="mt-0.5 text-[9.5px]" style={{ color: T.faint }}>
                جلسات بومودورو
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* المربع الأول: حصاد الأسبوع الماضي + العادة المحورية */}
            <div
              className="rounded-2xl border p-4 space-y-3"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
              }}
            >
              <div>
                <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                  <Trophy size={14} style={{ color: T.primary }} /> ١. أبرز انتصار أو تقدم في الأسبوع الماضي
                </label>
                <input
                  type="text"
                  value={weeklyWinDraft}
                  onChange={(e) => setWeeklyWinDraft(e.target.value)}
                  placeholder="مثال: حافظت على صلاة الفجر وأنهيت قراءة فصلين..."
                  className="mt-1.5 w-full rounded-xl border bg-black/30 px-3 py-2 text-[12px] text-white placeholder-white/30 focus:outline-none"
                  style={{ borderColor: T.border }}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                  <AlertTriangle size={14} style={{ color: T.warn }} /> ٢. العائق الأكبر وكيف أتجاوزه هذا الأسبوع
                </label>
                <input
                  type="text"
                  value={weeklyLessonDraft}
                  onChange={(e) => setWeeklyLessonDraft(e.target.value)}
                  placeholder="مثال: السهر بعد العشاء — سأغلق الشاشات الساعة ١٠:٣٠ مساءً..."
                  className="mt-1.5 w-full rounded-xl border bg-black/30 px-3 py-2 text-[12px] text-white placeholder-white/30 focus:outline-none"
                  style={{ borderColor: T.border }}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                  <Star size={14} style={{ color: T.accent }} /> ٣. العادة المحورية لهذا الأسبوع (Keystone Habit)
                </label>
                <select
                  value={keystoneDraft}
                  onChange={(e) => setKeystoneDraft(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border bg-black/30 px-3 py-2 text-[12px] text-white focus:outline-none"
                  style={{ borderColor: T.border }}
                >
                  <option value="" style={{ background: T.cardSolid }}>
                    — اختر العادة التي ترفع بقية عاداتك هذا الأسبوع —
                  </option>
                  {(state.habits || []).map((h) => (
                    <option key={h.id} value={h.id} style={{ background: T.cardSolid }}>
                      {h.core ? "⭐ " : ""}{h.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* المربع الثاني: ربط الأسبوع بإرث 2030 وتثبيت الأولويات */}
            <div
              className="rounded-2xl border p-4 space-y-3"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: T.ink }}>
                    <Target size={14} style={{ color: T.primary }} /> ٤. أي هدف من «إرثي 2030» سيتحرك هذا الأسبوع؟
                  </label>
                  <button
                    type="button"
                    onClick={() => onGo && onGo("goals")}
                    className="text-[10.5px] font-bold hover:underline"
                    style={{ color: T.primaryLift }}
                  >
                    إرثي 2030 ←
                  </button>
                </div>
                <select
                  value={focusGoalDraft}
                  onChange={(e) => setFocusGoalDraft(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border bg-black/30 px-3 py-2 text-[12px] text-white focus:outline-none"
                  style={{ borderColor: focusGoalDraft ? `${T.primary}66` : T.border }}
                >
                  <option value="" style={{ background: T.cardSolid }}>
                    — اختر هدفًا استراتيجيًا من إرث 2030 للتركيز عليه —
                  </option>
                  {(state.goals || [])
                    .filter((g) => !g.done)
                    .map((g) => (
                      <option key={g.id} value={g.id} style={{ background: T.cardSolid }}>
                        🎯 {g.text} ({g.current || 0}/{g.target || 100} {g.unit || ""})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-extrabold" style={{ color: T.ink }}>
                  <Zap size={14} style={{ color: T.cta }} /> ٥. أضف خطوة تنفيذية للأسبوع (تُربط تلقائيًا بالهدف المختار أعلاه)
                </label>
                <form onSubmit={handleAddWeeklyPriorityTask} className="mt-1.5 flex gap-1.5">
                  <input
                    type="text"
                    value={weeklyTaskText}
                    onChange={(e) => setWeeklyTaskText(e.target.value)}
                    placeholder="اكتب خطوة عملية تخدم هدفك هذا الأسبوع..."
                    className="min-w-0 flex-1 rounded-xl border bg-black/30 px-3 py-1.5 text-[11.5px] text-white placeholder-white/30 focus:outline-none"
                    style={{ borderColor: T.border }}
                  />
                  <button
                    type="submit"
                    className="shrink-0 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[11.5px] font-extrabold transition-all hover:opacity-90"
                    style={{
                      borderColor: `${T.primary}55`,
                      background: `${T.primary}20`,
                      color: T.primaryLift,
                    }}
                  >
                    <Plus size={13} /> إدراج
                  </button>
                </form>
              </div>

              <div
                className="rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  color: T.muted,
                }}
              >
                💡 <strong className="text-white">سر الوضوح المستقبلي:</strong> حين تختار هدفًا واحدًا من إرث 2030 وتضيف له خطوة أو خطوتين في مهام الأسبوع، فإن كل علامة (✓) تضعها اليوم تقرّبك فعليًا من رؤيتك الكبرى.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px]" style={{ color: T.faint }}>
              🗓️ عشر دقائق من التخطيط الأسبوعي توفر عليك عشرات الساعات من التشتت والقرارات العشوائية.
            </p>
            <button
              type="button"
              onClick={handleSaveWeeklyReview}
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-[13px] font-extrabold text-slate-950 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundImage: `linear-gradient(135deg, ${T.primary}, ${T.sky})`,
                boxShadow: `0 10px 26px -10px ${T.primary}`,
              }}
            >
              <CheckCircle2 size={16} /> اعتماد مراجعة وخطة الأسبوع
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
