import { ReadLogModal, TopThree, useHabitTick } from "../components/life-day.jsx";
import { Badge, Btn, Card, Checkbox, ProgressRing, T, arDate, clockAt, countedWord, courseIn, courseName, coursesIn, daySections, dayWord, daysPhrase, groupOf, nextPrayer, nextSection, prettyTime, taskWord, tasksPhrase, useBurst, useMinuteClock, whenWord } from "../components/life-shared.jsx";
import { CORE_CAP, UNI_TASK_KINDS, blockRank, bookForHabit, daysUntil, inReflectWindow, kindOf, minsIn, placeShape, prepReady, remainingIn, scoredOf, tomorrowKey, uniDayOf, uniPending, uniShape, upcomingRows } from "../state/life-state.mjs";
import { blockAt } from "../utils/prayer-times.mjs";
import { AlarmClock, ArrowLeft, CalendarClock, CalendarDays, ClipboardList, Feather, Flame, Footprints, GraduationCap, Library, ListChecks, MoonStar, School, Star, Sunrise, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  /* Every number on this screen is a function of the clock: the open block,
     the countdown to the next prayer, which lecture is running. One tick a
     minute re-reads them all. */
  useMinuteClock();
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const place = placeShape(state.place);
  const uni = state.uni || uniShape();

  const next = nextPrayer(place, now);
  /* The block the day is actually in, from the prayers rather than from
     clock hours — the same anchoring the six routine blocks use, because a
     screen that says «بعد العصر» ten minutes before العصر is a screen that
     has to be checked against another one. */
  const block = blockAt(place, now);
  const g = groupOf(block?.id);
  const BlockIcon = g.icon;

  const { toggle, logging, closeLog, logRead } = useHabitTick(state, setState);

  /* A habit ticked here leaves the list it was ticked from, and a row that
     vanishes under the finger animates nothing — the ripple, the pop and the
     emerald glow all play on a row that is no longer mounted. So the id is
     held for a moment longer than the animation and the row goes out after
     it, struck through. On a timer and never through requestAnimationFrame:
     a hidden tab does not run frames, and the reward would be swallowed and
     then replayed when the tab came back. */
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
  /* His own order inside a block is his; across blocks the flat array can
     interleave them, so what is behind him is read in the order the day ran
     — earliest block first, which is also the order it has to be caught up
     in. */
  const missed = useMemo(
    () => open.missed.slice().sort((a, b) => blockRank(a.group) - blockRank(b.group)),
    [open.missed],
  );
  const doneCount = habits.filter((h) => h.done).length;
  const allDone = habits.length > 0 && doneCount === habits.length;

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

  /* The weekday the timetable is read on is the wall clock's, not the
     logical day's: at 01:00 the logical day is still yesterday, and the
     lectures someone awake at that hour needs are the ones he is about to
     walk into. The weekday is printed under the heading for that exact
     reason — «اليوم» is ambiguous in those four hours and a named day is
     not. */
  const dow = now.getDay();
  const courses = useMemo(() => coursesIn(uni, uni.term), [uni]);
  const sections = useMemo(() => daySections(courses, dow, mins), [courses, dow, mins]);
  const ahead = useMemo(
    () => (sections.length ? null : nextSection(courses, dow, mins)),
    [sections.length, courses, dow, mins],
  );

  /* The university's deliverables and the calendar's exams and deadlines,
     in one list. Two sources, never copied into a third: a due date edited
     on either screen moves here in the same render. Overdue rows come first
     because the list is sorted by date and a date that has passed is the one
     that needs saying out loud. */
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

  /* Tomorrow's prep, read and never written here. `useMinuteClock` above is
     what makes the window live: the card appears when 20:00 arrives on a
     screen that was already open, instead of waiting for a reload. */
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

  return (
    <div className="space-y-5">
      {/* First on the screen, above the ring and the score, because what it
          replaces is the first sentence the app says after a week away. */}
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

      {/* Where the day is, in one card: the date, the open block, the next
          prayer and the one score the day is judged by. */}
      <Card className="flex flex-col items-center gap-6 p-6 sm:p-7 lg:flex-row lg:justify-between">
        <div className="min-w-0 text-center lg:text-right">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            اليوم
          </h2>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-xs text-white/40 lg:justify-start">
            <CalendarDays size={13} /> {dateLabel}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
            <span
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-extrabold"
              style={{
                borderColor: `${g.tint}3D`,
                backgroundColor: `${g.tint}14`,
                color: g.tint,
              }}
            >
              <BlockIcon size={14} /> {g.label}
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
            {/* Hidden while the comeback card is up. A zero beside a flame
                is a verdict, and the one thing someone opening this after a
                week away must not be handed first is a verdict. It is back
                the moment the card is closed. */}
            {comeback === 0 && (
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
              {doneCount} / {habits.length}
            </span>{" "}
            عادة اليوم. ما في هذه الشاشة هو ما تبقّى من يومك — والتفاصيل في
            شاشاتها.
          </p>
        </div>
        <ProgressRing value={discipline} size={150} />
      </Card>

      {/* The three. The same component the routine screen shows, not a copy
          of it: the cap is the rule, and one rule cannot have two
          renderings. */}
      <TopThree state={state} setState={setState} />

      {/* Tomorrow, asked for in the evening and nowhere else. Read-only
          here like everything on this screen — the picks, the steps and the
          hours all live where they already lived, and the card only says
          what is prepared and opens the screen that prepares it. */}
      {evening && (
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
                {/* The count, never the word «ثلاث» — two picks announced as
                    three is the screen lying about the one number it
                    exists to carry. */}
                <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: T.faint }}>
                  {!prepared.length ? (
                    "اختر ثلاثًا الآن، وابدأ الغد بلا مساومة"
                  ) : tasksPhrase(prepared.length) ? (
                    <>
                      {tasksPhrase(prepared.length)} {arDate(tomorrowOn)}
                    </>
                  ) : (
                    <>
                      <span dir="ltr" className="font-bold tabular-nums">
                        {prepared.length}
                      </span>{" "}
                      {taskWord(prepared.length)} تنتظر {arDate(tomorrowOn)}
                    </>
                  )}
                </p>
              </div>
            </div>
            <Btn variant={prepared.length ? "outline" : "default"} size="sm" onClick={onOpenTomorrow}>
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
      )}

      {/* What is still open, the block in front of you first. */}
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
                {habits.length - doneCount}
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
              <p className="mb-2 text-[11px] font-bold" style={{ color: g.tint }}>
                {g.label} — الآن
              </p>
              {open.here.length ? (
                <div className="space-y-1.5">
                  {open.here.map((h) => (
                    <TodayHabit
                      key={h.id}
                      habit={h}
                      book={bookForHabit(h, state.books)}
                      onToggle={() => tick(h.id)}
                      onToggleTiny={() => tick(h.id, true)}
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

            {/* Behind him, not hidden. A habit whose block has closed is
                still tickable — the day is not over until 04:00 — and a
                screen that drops it is a screen that quietly lowers the
                score without saying so. */}
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
                      book={bookForHabit(h, state.books)}
                      onToggle={() => tick(h.id)}
                      onToggleTiny={() => tick(h.id, true)}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* The timetable, for one day only. */}
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

        {/* The nearest thing with a date on it. */}
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
            {nearest.length ? (
              nearest.map((r) => {
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
      </div>

      <ReadLogModal
        open={!!logging}
        book={logging ? bookForHabit(logging, state.books) : null}
        onClose={closeLog}
        onLog={logRead}
      />
    </div>
  );
}


/* One habit, light. No drag, no arrows, no delete: this screen is for doing
   them, and the routine screen is where they are managed. The payout is the
   same, because a completion that animates nothing is a bug wherever it is
   ticked. */
function TodayHabit({ habit, book, onToggle, onToggleTiny, late = false }) {
  const [burst, fireBurst] = useBurst(700);
  const g = groupOf(habit.group);
  const Icon = g.icon;

  const handle = () => {
    if (!habit.done) fireBurst();
    onToggle();
  };

  /* Same payout as the full tick — see HabitRow. This screen is where a bad
     day is actually lived, so the floor has to be reachable here or it is a
     feature that only exists on the screen nobody opens at 23:40. */
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
      {/* Kept visible through the reward hold, when `done` has just flipped
          and the row is still on screen — a mark that vanishes under the
          finger that set it reads as a tap that did not land. */}
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


/* A row on the two cards at the foot of the screen — a lecture, a
   deliverable, an exam. One shape for all three so the eye reads them the
   same way: a tint, what it is, and when. */
function TodayLine({
  tint,
  icon: Icon,
  title,
  sub,
  when,
  time,
  hot = false,
  now = false,
}) {
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


/* ==================================================================== *
 *  وضع الرجوع — two days away, and no verdict waiting
 *
 *  Somebody opening this app after a week away is opening it for a verdict,
 *  and the verdict a broken streak and a 0% ring deliver is «you failed, and
 *  here is the number». That is the moment the app gets closed for a month,
 *  and no amount of accurate arithmetic makes it a useful thing to say.
 *
 *  So on a day that follows two or more unrecorded ones, the first thing on
 *  «اليوم» is the smallest possible surface: the core habits and the three
 *  tasks, and nothing else. No streak, no percentage, no count of what was
 *  missed — all of that is still one scroll away and none of it is the first
 *  sentence. It owns nothing of its own: the habits are the same flat array
 *  ticked through the same `useHabitTick`, and the three are the same
 *  `TopThree` every other screen renders.
 *
 *  It closes, and stays closed for the rest of the day. A card that says
 *  «نبدأ بأقل شي» and then reappears after every tick is the nagging it
 *  exists to replace.
 * ==================================================================== */
function ComebackCard({ state, setState, days, onTick, onTickTiny, onClose }) {
  /* The core when one is set, every habit when none is — the same roster
     the score reads, so this card cannot show a different five from the
     ring. Only what is still open: the point is the shortest list, and a
     list of things already done is not a place to start. */
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
            {/* The days away are stated once, flatly, because they are a
                fact he already knows and hiding them would be the app
                pretending. What is never stated is a verdict about them. */}
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


/* ==================================================================== *
 *  Primitives (shadcn-shaped, dependency-free)
 * ==================================================================== */



/* ==================================================================== *
 *  MODULE 0 — اليوم
 *
 *  The screen the app opens on, and the only one that answers «وش عليّ
 *  الآن؟» without being asked twice. Nothing here is a new store: the
 *  prayers are computed, the three tasks are the same `TopThree` the routine
 *  shows, the habits are the same flat array ticked through the same
 *  `useHabitTick`, and the lectures and the deadlines are read off the
 *  university desk and the calendar where they already live. A second copy
 *  of any of it would be a second day that disagrees with the first.
 *
 *  It is deliberately short. A landing screen that lists everything is the
 *  fifteen-tab sidebar again with extra steps — what belongs here is what
 *  the next hour needs, and a way into the screen that owns the rest.
 * ==================================================================== */

/* How long a ticked habit stays on «اليوم» before it drops out of the list.
   Longer than the 700ms reward burst, so the animation finishes on a row
   that is still there. */
const REWARD_HOLD = 1100;

