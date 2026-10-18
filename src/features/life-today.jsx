import { ReadLogModal, TodayExtras, TopThree, useHabitTick } from "../components/life-day.jsx";
import { Badge, Btn, Card, Checkbox, ConfigBlockBoundary, Modal, PRAYERS, ProgressRing, ReadingCue, T, arDate, countedWord, courseIn, courseName, coursesIn, cupWord, daySections, dayWord, daysPhrase, groupOf, nextPrayer, nextSection, prettyTime, taskWord, tasksPhrase, useBurst, useMinuteClock, whenWord } from "../components/life-shared.jsx";
import { todayBlocks } from "../life-config.js";
import { CORE_CAP, UNI_TASK_KINDS, blockRank, bookForHabit, clampGoal, daysUntil, goalPct, inReflectWindow, kindOf, minsIn, placeShape, prepReady, remainingIn, rows, scoredOf, taskOverdue, tomorrowKey, uniDayOf, uniPending, uniShape, upcomingRows } from "../state/life-state.mjs";
import { blockAt, clockAt, fixHour, prayerTimes } from "../utils/prayer-times.mjs";
import { AlertTriangle, AlarmClock, ArrowDown, ArrowLeft, ArrowUp, CalendarClock, CalendarDays, ClipboardList, Droplets, Eye, EyeOff, Feather, Flame, Footprints, GraduationCap, Library, ListChecks, MapPin, MoonStar, RotateCcw, School, Settings2, Star, Sunrise, Target, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/* Where a user's own layout of اليوم screen lives. localStorage and not
   `state` for the same reason the daily goal is: the layout outlives a day,
   a rollover and a migration — it is a standing preference, not a piece of
   today. The config file above stays the *defaults*; this is only the set
   of overrides the user has actually touched. Merging them is what lets a
   new block added to the config later still appear on a profile that had
   saved a layout before the block existed. */
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
      /* ignore — the state still updates for the session */
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

  const [fading, setFading] = useState(() => new Set());
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const tick = (id, tiny = false) => {
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
    toggle(id, tiny);
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
      />
    ),
    readingCue: <ReadingCue list={state.reads} />,
    prayerWaterGrid: (
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
        <PrayerCard place={state.place} onOpenSettings={onOpenSettings} />
        <WaterCard
          count={state.water}
          goal={clampGoal(state.waterGoal)}
          onSet={(n) =>
            setState((s) => ({
              ...s,
              water: Math.max(0, Math.min(clampGoal(s.waterGoal), n)),
            }))
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
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
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

      {/* الصندوق الجديد: خطوتك اليوم نحو أهدافك */}
      <DailyGoalFocus state={state} onGoGoals={() => onGo("goals")} />

      {layout
        .filter((b) => b.visible !== false)
        .map((b) => (
          <ConfigBlockBoundary key={b.key}>{blockRegistry[b.key] ?? null}</ConfigBlockBoundary>
        ))}

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
 *
 *  The config file above is the *defaults*; this is the set of overrides
 *  the user has actually touched, kept in localStorage under `LAYOUT_KEY`.
 *  Opening the modal passes the merged layout in; saving writes only the
 *  key/visible pairs back, so a future block added to `todayBlocks` still
 *  shows on a profile that saved a layout before the block existed.
 *
 *  Rows move by one step at a time — an Up arrow and a Down arrow, one per
 *  row. A drag-and-drop sortable list is the sort of thing that reads as
 *  an upgrade and behaves as a tax on a screen with seven rows: the arrows
 *  say exactly which line went where, and there is nothing to misread on a
 *  phone. The two ends disable rather than wrap, because a move that takes
 *  the first card to the bottom when the user meant to nudge it up is a
 *  mistake nobody undoes on purpose.
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

function TodayHabit({ habit, book, onToggle, onToggleTiny, late = false }) {
  const [burst, fireBurst] = useBurst(700);
  const g = groupOf(habit.group);
  const Icon = g.icon;

  const handle = () => {
    if (!habit.done) fireBurst();
    onToggle();
  };
  const handleTiny = () => {
    if (!habit.done) fireBurst();
    onToggleTiny();
  };

  return (
    <div
      className={`group flex items-center gap-2 rounded-xl border px-2 py-1 transition-all duration-200${
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
      <Checkbox
        checked={habit.done}
        onToggle={handle}
        label={habit.label}
        tint={T.primary}
        size="sm"
      />
      {!!habit.min && (habit.tiny || !habit.done) && (
        <button
          onClick={handleTiny}
          title={`نسخة صغيرة: ${habit.min}`}
          aria-label={`إنجاز النسخة الصغيرة من ${habit.label}`}
          className="shrink-0 rounded p-1 opacity-50 transition-all duration-200 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          style={{ color: T.sky }}
        >
          <Feather
            size={12}
            style={habit.tiny ? { filter: `drop-shadow(0 0 5px ${T.sky}AA)` } : undefined}
          />
        </button>
      )}
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
}) {
  const Icon = block.icon;
  return (
    <Card className="flex flex-col items-center gap-6 p-6 sm:p-7 lg:flex-row lg:justify-between">
      <div className="min-w-0 text-center lg:text-right">
        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            اليوم
          </h2>
          {onOpenLayout && (
            <button
              type="button"
              onClick={onOpenLayout}
              title="ترتيب بطاقات اليوم"
              aria-label="ترتيب بطاقات اليوم"
              className="rounded-lg border p-1.5 text-white/40 transition-colors hover:border-white/40 hover:text-white"
              style={{ borderColor: T.border }}
            >
              <Settings2 size={13} />
            </button>
          )}
        </div>
        <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/40 lg:justify-start">
          <CalendarDays size={13} /> {dateLabel}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
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

export function RemainingHabitsCard({
  block,
  open,
  missed,
  books,
  remaining,
  allDone,
  onTick,
  onGo,
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h3
          className="flex items-center gap-2 text-[15px] font-extrabold"
          style={{ color: T.primaryLift }}
        >
          <ListChecks size={16} /> العادات المتبقية
        </h3>
        <div className="flex items-center gap-2">
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
 *  الميزة الجوهرية: بطاقة الأهداف في شاشة اليوم
 * ==================================================================== */
export function DailyGoalFocus({ state, onGoGoals }) {
  const activeGoals = rows(state.goals).filter(
    (g) => !g.done && g.nextAction && g.horizon === "quarter"
  );

  if (activeGoals.length === 0) return null;

  return (
    <Card className="p-5 sm:p-6 border-emerald-500/30 bg-emerald-500/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-extrabold flex items-center gap-2 text-emerald-400">
          <Target size={18} /> خطوتك اليوم نحو أهدافك
        </h3>
        <button
          onClick={onGoGoals}
          className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
        >
          كل الأهداف <ArrowLeft size={12} />
        </button>
      </div>

      <div className="space-y-3">
        {activeGoals.map((g) => {
          const pct = goalPct(g, state.goals, state.habits);
          return (
            <div key={g.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-white/90">{g.text}</span>
                <span className="text-[11px] font-bold text-emerald-500">{pct}%</span>
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-emerald-300/80 bg-emerald-500/10 p-2 rounded-lg mt-1">
                <span className="font-bold">الخطوة القادمة:</span>
                <span>{g.nextAction}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}