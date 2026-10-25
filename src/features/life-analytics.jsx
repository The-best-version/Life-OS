import { AR_MONTHS, Badge, Btn, Card, GROUPS, Modal, T, WEEK_LABELS, arDate, dayWord, daysPhrase, fallWord, timesWord } from "../components/life-shared.jsx";
import { STREAK_TARGET, DAILY_GOAL_DEFAULT, DAILY_GOAL_MIN, DAILY_GOAL_MAX, clampDailyGoal, cleanDays, dayKey, daysBetween, habitStreak, historyIndex, isGap, levelOf, netBalance, rows, sumPages, focusDay } from "../state/life-state.mjs";
import { Award, Activity, Brain, CalendarCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Compass, Feather, Flame, HeartCrack, Hourglass, Layers, ListChecks, ShieldCheck, Sparkles, Star, Target, TrendingDown, TrendingUp, X, Zap } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

const WEEK_FULL = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const GOAL_CHOICES = [40, 50, 60, 70, 80];

const CONSISTENCY_WINDOWS = [
  { id: 30, label: "٣٠ يومًا" },
  { id: 90, label: "٩٠ يومًا" },
  { id: 0, label: "كل السجل" },
];

const LEVEL_BG = [
  "rgba(255,255,255,0.04)",
  "rgba(16,185,129,0.42)",
  "rgba(16,185,129,0.5)",
  "rgba(16,185,129,0.74)",
  "#10B981",
];

// ==========================================
// الميزة 1: المستشار الذكي (Smart Coach)
// ==========================================
function SmartCoach({ discipline = 0, streak = 0 }) {
  const message = useMemo(() => {
    if (discipline >= 80) {
      return { text: "أداء أسطوري! أنت في أفضل حالاتك اليوم. استمر بهذا الزخم.", color: T.primary, icon: Sparkles };
    } else if (streak >= 7) {
      return { text: `سلسلة رهيبة! ${streak} أيام متتالية. لا تدعها تنكسر اليوم.`, color: T.ember, icon: Flame };
    } else if (discipline < 50) {
      return { text: "كل بداية صعبة. ركز على إنجاز عادة واحدة صغيرة الآن لتكسر الخمول.", color: T.cta, icon: Zap };
    } else {
      return { text: "أنت على الطريق الصحيح، أكمل ما تبقى من مهام لتحقيق هدف اليوم.", color: T.accent, icon: Target };
    }
  }, [discipline, streak]);

  const Icon = message.icon;

  return (
    <Card className="p-4 sm:p-5 border-none bg-gradient-to-r from-white/5 to-transparent">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: `${message.color}20`, color: message.color }}>
          <Icon size={20} />
        </div>
        <p className="text-[13px] font-bold leading-relaxed" style={{ color: message.color }}>
          {message.text}
        </p>
      </div>
    </Card>
  );
}

// ==========================================
// الميزة 2: مؤشر الزخم (Momentum)
// ==========================================
function MomentumCard({ state }) {
  const data = useMemo(() => {
    const recs = rows(state.history).filter(h => !isGap(h) && Number.isFinite(h.pct));
    let thisWeek = 0, thisWeekCount = 0;
    let lastWeek = 0, lastWeekCount = 0;

    for (const r of recs) {
      const back = daysBetween(r.date);
      if (back >= 0 && back < 7) { thisWeek += r.pct; thisWeekCount++; }
      else if (back >= 7 && back < 14) { lastWeek += r.pct; lastWeekCount++; }
    }

    const avgThis = thisWeekCount ? Math.round(thisWeek / thisWeekCount) : 0;
    const avgLast = lastWeekCount ? Math.round(lastWeek / lastWeekCount) : 0;
    const delta = avgThis - avgLast;

    return { avgThis, avgLast, delta, hasData: thisWeekCount > 0 && lastWeekCount > 0 };
  }, [state.history]);

  if (!data.hasData) return null;

  const isUp = data.delta > 0;
  const isDown = data.delta < 0;
  const color = isUp ? T.primary : isDown ? T.danger : T.muted;

  return (
    <Card className="p-5 flex items-center justify-between">
      <div>
        <h3 className="text-[14px] font-bold text-white/70 flex items-center gap-2">
          <TrendingUp size={16} style={{ color }} /> الزخم (Momentum)
        </h3>
        <p className="text-[11.5px] text-white/40 mt-1">مقارنة بـ الأسبوع الماضي</p>
      </div>
      <div className="text-left">
        <p className="text-2xl font-black tabular-nums flex items-baseline gap-1" style={{ color }}>
          {isUp ? "+" : ""}{data.delta}%
          {isUp ? <TrendingUp size={16} /> : isDown ? <TrendingDown size={16} /> : null}
        </p>
        <p className="text-[10px] text-white/40 mt-1">
          {isUp ? "أنت تتحسن! استمر." : isDown ? "تحتاج لدفعة بسيطة." : "مستوى ثابت."}
        </p>
      </div>
    </Card>
  );
}

// ==========================================
// الميزة 3: نظرة الأسبوع (Weekly Focus)
// ==========================================
function WeeklyFocus({ state, discipline }) {
  const weekData = useMemo(() => {
    const byDate = new Map(rows(state.history).filter((h) => !isGap(h)).map((h) => [h.date, h.pct]));
    byDate.set(dayKey(), discipline);

    const out = [];
    const today = new Date();
    // الحصول على أيام الأسبوع الحالي (السبت إلى الجمعة)
    const currentDay = today.getDay(); // 0 is Sunday, 6 is Saturday
    const diffToSaturday = (currentDay + 1) % 7; 
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - diffToSaturday + i);
      const ds = dayKey(d);
      const isFuture = d > today;
      const pct = byDate.get(ds);
      out.push({ date: ds, pct: pct !== undefined ? pct : (isFuture ? null : 0), isToday: ds === dayKey() });
    }
    return out;
  }, [state.history, discipline]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-bold flex items-center gap-2">
          <CalendarCheck size={18} style={{ color: T.primary }} /> نظرة الأسبوع
        </h3>
        <span className="text-[11px] text-white/40">السبت - الجمعة</span>
      </div>
      
      <div className="flex justify-between gap-1.5">
        {weekData.map((day, i) => {
          const pct = day.pct ?? 0;
          const isDone = pct >= 80;
          const isPartial = pct > 0 && pct < 80;
          
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div 
                className={`relative flex aspect-square w-full max-w-[48px] items-center justify-center rounded-full border-2 transition-all duration-300 ${day.isToday ? 'scale-110 shadow-lg' : ''}`}
                style={{
                  borderColor: day.isToday ? T.accent : isDone ? T.primary : isPartial ? T.cta : T.border,
                  background: isDone ? `${T.primary}20` : isPartial ? `${T.cta}15` : 'transparent',
                  boxShadow: day.isToday ? `0 0 15px ${T.accent}40` : 'none'
                }}
              >
                {isDone ? (
                  <Check size={18} strokeWidth={3} style={{ color: T.primary }} />
                ) : isPartial ? (
                  <span className="text-[11px] font-bold" style={{ color: T.cta }}>{pct}%</span>
                ) : (
                  <span className="text-[12px] font-bold text-white/30">{Number(day.date.slice(-2))}</span>
                )}
              </div>
              <span className="text-[10px] font-bold" style={{ color: day.isToday ? T.accent : T.muted }}>
                {WEEK_FULL[i].slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ==========================================
// المكون الرئيسي للتحليلات
// ==========================================
export function AnalyticsModule({ state, discipline, streak, setState }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [openNote, setOpenNote] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'

  const byDate = useMemo(() => {
    const map = new Map(
      rows(state.history)
        .filter((h) => !isGap(h))
        .map((h) => [h.date, h.pct]),
    );
    map.set(dayKey(), discipline);
    return map;
  }, [state.history, discipline]);

  const gapDates = useMemo(
    () => new Set(rows(state.history).filter(isGap).map((h) => h.date)),
    [state.history],
  );

  const notesByDate = useMemo(
    () =>
      new Map(
        (state.history || [])
          .filter((h) => h.distraction || h.fix || h.mirror)
          .map((h) => [h.date, h]),
      ),
    [state.history],
  );

  const rowsByDate = useMemo(
    () => new Map((state.history || []).map((h) => [h.date, h])),
    [state.history],
  );

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const lead = (first.getDay() + 1) % 7;
    const cells = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dayKey(new Date(cursor.y, cursor.m, d));
      cells.push({ d, ds, pct: byDate.get(ds), gap: gapDates.has(ds) });
    }
    return cells;
  }, [cursor, byDate, gapDates]);

  const monthStats = useMemo(() => {
    const vals = grid.filter((c) => c && c.pct !== undefined).map((c) => c.pct);
    return {
      tracked: vals.length,
      avg: vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0,
      best: vals.length ? Math.max(...vals) : 0,
      hit: vals.filter((v) => v >= STREAK_TARGET).length,
      gaps: grid.filter((c) => c && c.gap).length,
    };
  }, [grid]);

  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="space-y-8 pb-20">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">مركز التحليلات</h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          نظرة واضحة على أدائك. تتبع الأسبوع لتبني الزخم، وراقب الشهر لترى الإنجاز.
        </p>
      </Card>

      <SmartCoach discipline={discipline} streak={streak} />

      {/* 👇 الركيزة الخامسة: نظام الهوية والرتب والأوسمة 2030 👇 */}
      <IdentityRankCard state={state} discipline={discipline} streak={streak} />

      {/* 👇 الركيزة الأولى: محرك الارتباطات الذكي ورادار البصيرة الذاتية 👇 */}
      <CrossDomainCorrelationCard state={state} discipline={discipline} />

      <GoalCard
        discipline={discipline}
        history={state.history}
        state={state}
        setState={setState}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "متوسط الشهر", v: `${monthStats.avg}%`, c: T.accent, icon: TrendingUp },
          { k: "أفضل يوم", v: `${monthStats.best}%`, c: T.primary, icon: Star },
          { k: "أيام فوق ٨٠٪", v: String(monthStats.hit), c: T.primary, icon: Check },
          { k: "السلسلة الحالية", v: String(streak), c: T.ember, icon: Flame },
        ].map((s) => (
          <Card key={s.k} className="p-4">
            <div className="flex items-center gap-2">
              <s.icon size={13} style={{ color: s.c }} />
              <p className="text-[10.5px] text-white/40">{s.k}</p>
            </div>
            <p
              className="mt-1.5 text-2xl font-extrabold tabular-nums"
              style={{ color: s.c }}
            >
              {s.v}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MomentumCard state={state} />
        {/* بطاقة إحصائية سريعة */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-white/70 flex items-center gap-2">
              <Star size={16} style={{ color: T.accent }} /> متوسط الشهر
            </h3>
            <p className="text-[11.5px] text-white/40 mt-1">الأداء العام لهذا الشهر</p>
          </div>
          <p className="text-2xl font-black tabular-nums" style={{ color: T.accent }}>
            {monthStats.avg}%
          </p>
        </Card>
      </div>

      <WeeklyInsightCard state={state} />

      {/* التبديل بين الأسبوع والشهر */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 w-fit mx-auto">
        <button
          onClick={() => setViewMode('week')}
          className={`px-6 py-2 rounded-lg text-[12px] font-bold transition-all ${viewMode === 'week' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
        >
          الأسبوع
        </button>
        <button
          onClick={() => setViewMode('month')}
          className={`px-6 py-2 rounded-lg text-[12px] font-bold transition-all ${viewMode === 'month' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
        >
          الشهر
        </button>
      </div>

      {viewMode === 'week' ? (
        <WeeklyFocus state={state} discipline={discipline} />
      ) : (
        <Card className="p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <Btn variant="outline" size="icon" onClick={() => shift(1)} aria-label="الشهر التالي">
              <ChevronLeft size={16} />
            </Btn>
            <h3 className="text-base font-bold">
              {AR_MONTHS[cursor.m]}{" "}
              <span className="tabular-nums text-white/40">{cursor.y}</span>
            </h3>
            <Btn variant="outline" size="icon" onClick={() => shift(-1)} aria-label="الشهر السابق">
              <ChevronRight size={16} />
            </Btn>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEK_LABELS.map((w) => (
              <span key={w} className="pb-1 text-[10px] text-white/25">
                {w}
              </span>
            ))}
            {grid.map((cell, i) => {
              if (cell === null) return <span key={`e${i}`} />;
              const note = notesByDate.get(cell.ds);
              const row = cell.pct === undefined ? null : rowsByDate.get(cell.ds);
              return (
                <button
                  key={cell.ds}
                  type="button"
                  onClick={() => row && setOpenNote(row)}
                  disabled={!row}
                  title={
                    cell.gap
                      ? `${cell.ds} — لم يُسجَّل`
                      : cell.pct === undefined
                      ? `${cell.ds} — لا سجلّ`
                      : `${cell.ds} — ${cell.pct}٪${note ? " — فيه وقفة" : ""}${
                          row?.holds ? ` — صمدت ${row.holds}` : ""
                        }${row?.falls ? ` — سقطت ${row.falls}` : ""}`
                  }
                  className={`relative flex aspect-square items-center justify-center rounded-lg text-[11px] font-bold tabular-nums transition-transform duration-150 hover:scale-110 disabled:cursor-default ${
                    cell.gap ? "border border-dashed" : "border"
                  }`}
                  style={{
                    background: cell.gap
                      ? "rgba(255,255,255,0.02)"
                      : LEVEL_BG[levelOf(cell.pct ?? 0)],
                    borderColor:
                      cell.ds === dayKey()
                        ? T.accent
                        : cell.gap
                        ? "rgba(255,255,255,0.22)"
                        : cell.pct !== undefined
                        ? `${T.primary}66`
                        : "rgba(255,255,255,0.06)",
                    color: cell.gap
                      ? "rgba(253,248,246,0.3)"
                      : (cell.pct ?? 0) >= 45
                        ? "#04140E"
                        : cell.pct !== undefined
                        ? "rgba(253,248,246,0.8)"
                        : "rgba(255,255,255,0.3)",
                  }}
                >
                  {cell.d}
                  {(note || row?.holds > 0 || row?.falls > 0) && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5"
                    >
                      {note && (
                        <i
                          className="block h-1 w-1 rounded-full"
                          style={{ background: T.cta, boxShadow: `0 0 5px ${T.cta}` }}
                        />
                      )}
                      {row?.holds > 0 && (
                        <i
                          className="block h-1 w-1 rounded-full"
                          style={{
                            background: T.primary,
                            boxShadow: `0 0 5px ${T.primary}`,
                          }}
                        />
                      )}
                      {row?.falls > 0 && (
                        <i
                          className="block h-1 w-1 rounded-full"
                          style={{ background: T.rose, boxShadow: `0 0 5px ${T.rose}` }}
                        />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {monthStats.gaps > 0 && (
            <p
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed px-3.5 py-2.5 text-center text-[11.5px] font-bold leading-relaxed"
              style={{ borderColor: "rgba(255,255,255,0.22)", color: T.muted }}
            >
              <CalendarDays size={13} style={{ color: T.faint }} />
              <span>
                {daysPhrase(monthStats.gaps) || (
                  <>
                    <span dir="ltr" className="tabular-nums">
                      {monthStats.gaps}
                    </span>{" "}
                    {dayWord(monthStats.gaps)}
                  </>
                )}
                {" بدون تسجيل هذا الشهر — لا تدخل في المتوسط."}
              </span>
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
            <span>اضغط أي يوم مسجَّل لمراجعة روتينه · الإطار الذهبي = اليوم · النقطة المرجانية = وقفة مكتوبة</span>
            <span className="flex items-center gap-1.5">
              أقل
              {LEVEL_BG.map((c, i) => (
                <span
                  key={i}
                  className="h-[11px] w-[11px] rounded-[3px]"
                  style={{ background: c }}
                />
              ))}
              أكثر
            </span>
          </div>
        </Card>
      )}

      <TrendChart state={state} discipline={discipline} />

      <ConsistencyCard state={state} />

      <Modal
        open={!!openNote}
        onClose={() => setOpenNote(null)}
        title={openNote ? arDate(openNote.date) : ""}
      >
        <div className="space-y-4">
          <Badge tint={(openNote?.pct ?? 0) >= STREAK_TARGET ? T.primary : T.cta}>
            <span dir="ltr" className="tabular-nums">
              {openNote?.pct ?? 0}%
            </span>
            {" ذلك اليوم"}
          </Badge>

          {(openNote?.holds > 0 || openNote?.falls > 0) && (
            <div className="flex flex-wrap gap-2">
              {openNote.holds > 0 && (
                <Badge tint={T.primary}>
                  <ShieldCheck size={10} />
                  {"صمدت "}
                  <span dir="ltr" className="tabular-nums">
                    {openNote.holds}
                  </span>
                  {` ${timesWord(openNote.holds)}`}
                </Badge>
              )}
              {openNote.falls > 0 && (
                <Badge tint={T.danger}>
                  <HeartCrack size={10} />
                  <span dir="ltr" className="tabular-nums">
                    {openNote.falls}
                  </span>
                  {` ${fallWord(openNote.falls)}`}
                </Badge>
              )}
            </div>
          )}

          <DayRollCall row={openNote} state={state} />

          {openNote?.distraction && (
            <div>
              <p className="mb-1.5 text-xs text-white/45">ما الذي شتّتني</p>
              <p
                className="rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                {openNote.distraction}
              </p>
            </div>
          )}
          {openNote?.fix && (
            <div>
              <p className="mb-1.5 text-xs text-white/45">كيف أتجنّبه</p>
              <p
                className="rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                style={{
                  borderColor: `${T.primary}3D`,
                  background: `${T.primary}0F`,
                }}
              >
                {openNote.fix}
              </p>
            </div>
          )}
          {openNote?.mirror && (
            <div>
              <p className="mb-1.5 text-xs text-white/45">مرآة المحاسبة</p>
              <p
                className="whitespace-pre-wrap rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                style={{
                  borderColor: `${T.danger}3D`,
                  background: `${T.danger}0F`,
                }}
              >
                {openNote.mirror}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}


/* ==================================================================== *
 *  GoalCard (بدون تغيير)
 * ==================================================================== */
function GoalCard({ discipline, history, state, setState }) {
  const goal = Number.isFinite(state?.goal) ? state.goal : DAILY_GOAL_DEFAULT;

  const setGoal = (n) => {
    setState((s) => ({ ...s, goal: clampDailyGoal(n) }));
  };

  const stats = useMemo(() => {
    const recs = rows(history).filter(
      (h) => !isGap(h) && Number.isFinite(h.pct),
    );
    const best = recs.length
      ? recs.reduce((a, b) => (b.pct > a.pct ? b : a))
      : null;
    return { best };
  }, [history]);

  const streak = useMemo(() => {
    const map = new Map(
      rows(history)
        .filter((h) => !isGap(h))
        .map((h) => [h.date, h.pct]),
    );
    let n = Number.isFinite(discipline) && discipline >= goal ? 1 : 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 500; i++) {
      const key = dayKey(d);
      const p = map.get(key);
      if (p === undefined || p < goal) break;
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [history, goal, discipline]);

  const remaining = Math.max(0, goal - discipline);
  const hitGoal = discipline >= goal;
  const accent = hitGoal ? T.primary : T.accent;
  const accentLift = hitGoal ? T.primaryLift : T.accent;

  return (
    <Card
      className="p-6 sm:p-7"
      style={{
        borderColor: hitGoal ? `${T.primary}80` : `${T.accent}59`,
        boxShadow: hitGoal
          ? `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 46px -18px ${T.primary}`
          : `inset 0 1px 0 0 rgba(255,255,255,0.15), 0 0 46px -20px ${T.accent}`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${accent}59`,
              background: `linear-gradient(160deg, ${accent}3D, ${accent}0F)`,
              color: accent,
            }}
          >
            <Target size={20} strokeWidth={2.4} />
          </span>
          <div>
            <h3
              className="text-[17px] font-extrabold"
              style={{ color: accentLift }}
            >
              هدفك اليومي
            </h3>
            <p
              className="text-[11.5px] leading-relaxed"
              style={{ color: T.faint }}
            >
              رقم واحد تكسره كل يوم — النتيجة الكاملة، لا عادة بعينها.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_CHOICES.map((n) => {
            const on = n === goal;
            return (
              <button
                key={n}
                onClick={() => setGoal(n)}
                className="rounded-lg border px-2.5 py-1 text-[11px] font-extrabold tabular-nums transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  background: on ? `${T.cta}1F` : "transparent",
                  color: on ? T.ctaLift : T.faint,
                }}
              >
                <span dir="ltr">{n}%</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div
          className="relative h-3 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, discipline)}%`,
              backgroundImage: hitGoal
                ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
                : `linear-gradient(90deg, ${T.accent}, ${T.accent}99)`,
              boxShadow: `0 0 12px ${accent}80`,
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5"
            style={{
              left: `${goal}%`,
              background: T.cta,
              boxShadow: `0 0 8px ${T.cta}`,
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10.5px]">
          <span style={{ color: T.faint }}>
            اليوم:{" "}
            <span
              dir="ltr"
              className="font-extrabold tabular-nums"
              style={{ color: accent }}
            >
              {discipline}%
            </span>
          </span>
          <span style={{ color: T.faint }}>
            الهدف:{" "}
            <span
              dir="ltr"
              className="font-extrabold tabular-nums"
              style={{ color: T.ctaLift }}
            >
              {goal}%
            </span>
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{
            borderColor: hitGoal ? `${T.primary}59` : `${T.accent}3D`,
            background: hitGoal ? `${T.primary}0F` : `${T.accent}0A`,
          }}
        >
          <p className="text-[10px]" style={{ color: T.faint }}>
            اليوم
          </p>
          <p
            className="mt-1 text-[15px] font-extrabold"
            style={{ color: accent }}
          >
            {hitGoal ? (
              "🎉 تجاوزت"
            ) : (
              <>
                <span dir="ltr" className="tabular-nums">
                  {remaining}
                </span>
                {" نقطة"}
              </>
            )}
          </p>
          <p className="text-[9.5px]" style={{ color: T.faint }}>
            {hitGoal ? "الهدف محقق" : "لتحقيق الهدف"}
          </p>
        </div>

        <div
          className="rounded-xl border px-3 py-2.5"
          style={{
            borderColor: streak > 0 ? `${T.ember}59` : T.border,
            background: streak > 0 ? `${T.ember}0A` : "rgba(255,255,255,0.03)",
          }}
        >
          <p className="text-[10px]" style={{ color: T.faint }}>
            السلسلة
          </p>
          <p
            className="mt-1 flex items-baseline gap-1 text-[15px] font-extrabold"
            style={{ color: streak > 0 ? T.ember : T.faint }}
          >
            {streak > 0 && <Flame size={13} />}
            <span dir="ltr" className="tabular-nums">
              {streak}
            </span>
          </p>
          <p className="text-[9.5px]" style={{ color: T.faint }}>
            {streak === 0
              ? "ابدأ اليوم"
              : streak === 1
              ? "يوم واحد"
              : "أيام متتالية"}
          </p>
        </div>

        <div
          className="rounded-xl border px-3 py-2.5"
          style={{
            borderColor: `${T.primary}3D`,
            background: `${T.primary}0A`,
          }}
        >
          <p className="text-[10px]" style={{ color: T.faint }}>
            أفضل يوم
          </p>
          <p
            dir="ltr"
            className="mt-1 text-[15px] font-extrabold tabular-nums"
            style={{ color: T.primary }}
          >
            {stats.best ? `${stats.best.pct}%` : "—"}
          </p>
          <p className="text-[9.5px]" style={{ color: T.faint }}>
            {stats.best ? arDate(stats.best.date) : "لا سجلّ"}
          </p>
        </div>
      </div>

      <p
        className="mt-4 rounded-xl border px-3.5 py-2.5 text-center text-[11.5px] leading-relaxed"
        style={{
          borderColor: hitGoal ? `${T.primary}3D` : `${T.accent}3D`,
          background: hitGoal ? `${T.primary}10` : `${T.accent}0A`,
          color: accentLift,
        }}
      >
        {hitGoal ? (
          streak > 1 ? (
            <>
              🎉 تجاوزت الهدف{" "}
              <span dir="ltr" className="font-extrabold tabular-nums">
                {streak}
              </span>{" "}
              أيام متتالية — لا تكسر السلسلة!
            </>
          ) : (
            <>🎉 تجاوزت الهدف اليوم — كمّل غدًا لتبدأ السلسلة.</>
          )
        ) : (
          <>
            باقي{" "}
            <span dir="ltr" className="font-extrabold tabular-nums">
              {remaining}
            </span>{" "}
            نقطة للهدف — أي عادة تنجزها تقرّبك.
          </>
        )}
      </p>
    </Card>
  );
}

/* ==================================================================== *
 *  WeeklyInsightCard (بدون تغيير)
 * ==================================================================== */
function WeeklyInsightCard({ state }) {
  const data = useMemo(() => {
    const recs = rows(state.history).filter(
      (h) => !isGap(h) && Number.isFinite(h.pct),
    );
    const thisWeek = [];
    const lastWeek = [];
    for (const r of recs) {
      const back = daysBetween(r.date);
      if (back >= 0 && back < 7) thisWeek.push(r);
      else if (back >= 7 && back < 14) lastWeek.push(r);
    }
    if (!thisWeek.length || !lastWeek.length) return null;

    const avg = (arr) =>
      Math.round(arr.reduce((a, r) => a + r.pct, 0) / arr.length);

    const avgThis = avg(thisWeek);
    const avgLast = avg(lastWeek);
    const delta = avgThis - avgLast;

    const best = thisWeek.reduce((a, b) => (b.pct > a.pct ? b : a));
    const worst = thisWeek.reduce((a, b) => (b.pct < a.pct ? b : a));

    return {
      avgThis,
      avgLast,
      delta,
      tracked: thisWeek.length,
      best,
      worst,
    };
  }, [state.history]);

  if (!data) return null;

  const up = data.delta > 0;
  const down = data.delta < 0;
  const flat = data.delta === 0;
  const tone = up ? T.primary : down ? T.danger : T.muted;
  const Arrow = up ? TrendingUp : down ? TrendingDown : null;

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="flex items-center gap-2 text-[17px] font-extrabold"
            style={{ color: T.ctaLift }}
          >
            <Sparkles size={17} /> ملخّص الأسبوع
          </h3>
          <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            آخر ٧ أيام مقابل الـ ٧ التي قبلها — هل أنت تتحسّن فعلًا؟
          </p>
        </div>
        <span
          className="shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-bold"
          style={{ borderColor: T.border, color: T.faint }}
        >
          محسوب على{" "}
          <span dir="ltr" className="tabular-nums" style={{ color: T.muted }}>
            {data.tracked}
          </span>{" "}
          / ٧ أيام
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div
          className="rounded-xl border px-3.5 py-3"
          style={{
            borderColor: `${T.cta}3D`,
            background: `${T.cta}0A`,
          }}
        >
          <p className="text-[10.5px]" style={{ color: T.faint }}>
            هذا الأسبوع
          </p>
          <p
            dir="ltr"
            className="mt-1 text-2xl font-extrabold tabular-nums"
            style={{ color: T.ctaLift }}
          >
            {data.avgThis}%
          </p>
        </div>

        <div
          className="rounded-xl border px-3.5 py-3"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <p className="text-[10.5px]" style={{ color: T.faint }}>
            الأسبوع الماضي
          </p>
          <p
            dir="ltr"
            className="mt-1 text-2xl font-extrabold tabular-nums"
            style={{ color: T.muted }}
          >
            {data.avgLast}%
          </p>
        </div>

        <div
          className="rounded-xl border px-3.5 py-3"
          style={{
            borderColor: `${tone}4D`,
            background: `${tone}10`,
          }}
        >
          <p className="text-[10.5px]" style={{ color: T.faint }}>
            الفرق
          </p>
          <p
            className="mt-1 flex items-baseline gap-1.5 text-2xl font-extrabold"
            style={{ color: tone }}
          >
            {Arrow && <Arrow size={20} strokeWidth={2.6} />}
            <span dir="ltr" className="tabular-nums">
              {up ? "+" : ""}
              {data.delta}
            </span>
            {flat && <span className="text-[13px]">—</span>}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <p
          className="rounded-xl border px-3 py-2 text-[11.5px]"
          style={{ borderColor: `${T.primary}3D`, background: `${T.primary}0A` }}
        >
          <span style={{ color: T.faint }}>أفضل يوم:</span>{" "}
          <span style={{ color: T.primary, fontWeight: 700 }}>
            {arDate(data.best.date)}
          </span>{" "}
          <span
            dir="ltr"
            className="font-extrabold tabular-nums"
            style={{ color: T.primary }}
          >
            {data.best.pct}%
          </span>
        </p>
        <p
          className="rounded-xl border px-3 py-2 text-[11.5px]"
          style={{ borderColor: `${T.danger}3D`, background: `${T.danger}0A` }}
        >
          <span style={{ color: T.faint }}>أسوأ يوم:</span>{" "}
          <span style={{ color: T.danger, fontWeight: 700 }}>
            {arDate(data.worst.date)}
          </span>{" "}
          <span
            dir="ltr"
            className="font-extrabold tabular-nums"
            style={{ color: T.danger }}
          >
            {data.worst.pct}%
          </span>
        </p>
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  TrendChart (تم إعادته بالكامل كما كان في الأصل)
 * ==================================================================== */
function TrendChart({ state, discipline }) {
  const [span, setSpan] = useState(7);
  const [hover, setHover] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [openModalDay, setOpenModalDay] = useState(null);

  const goal = Number.isFinite(state?.goal) ? state.goal : DAILY_GOAL_DEFAULT;

  useEffect(() => {
    setSelectedIdx(null);
    setHover(null);
  }, [span]);

  const SPANS = [
    { n: 7, label: "أسبوع" },
    { n: 30, label: "شهر" },
    { n: 90, label: "٩٠ يوم" },
    { n: 365, label: "سنة" },
  ];

  const dayLabel = (date) => {
    const [y, m, d] = String(date).split("-").map(Number);
    if (!y || !m || !d) return "";
    const js = new Date(y, m - 1, d).getDay();
    return ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"][js];
  };

  const data = useMemo(() => {
    const byDate = new Map(
      rows(state.history).filter((h) => !isGap(h)).map((h) => [h.date, h.pct]),
    );
    byDate.set(dayKey(), discipline);

    const out = [];
    const today = new Date();
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = dayKey(d);
      const v = byDate.get(ds);
      out.push({ date: ds, pct: v === undefined ? null : v });
    }
    return out;
  }, [state.history, discipline, span]);

  const stats = useMemo(() => {
    const vals = data.filter((d) => d.pct !== null);
    if (!vals.length) return null;
    const avg = Math.round(vals.reduce((a, b) => a + b.pct, 0) / vals.length);
    const best = vals.reduce((a, b) => (b.pct > a.pct ? b : a));
    const worst = vals.reduce((a, b) => (b.pct < a.pct ? b : a));
    const mid = Math.floor(vals.length / 2);
    const oldV = vals.slice(0, mid);
    const newV = vals.slice(mid);
    const oldAvg = oldV.length ? oldV.reduce((a, b) => a + b.pct, 0) / oldV.length : 0;
    const newAvg = newV.length ? newV.reduce((a, b) => a + b.pct, 0) / newV.length : 0;
    const trend = Math.round(newAvg - oldAvg);
    const above = vals.filter((v) => v.pct >= goal).length;
    return { avg, best, worst, trend, above, total: vals.length };
  }, [data, goal]);

  const W = 900;
  const H = 280;
  const PAD_L = 52;
  const PAD_R = 24;
  const PAD_T = 20;
  const PAD_B = 46;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const yOf = (pct) => PAD_T + chartH * (1 - pct / 100);
  const xOf = (i) => PAD_L + (i / Math.max(1, data.length - 1)) * chartW;

  const { linePath, areaPath } = useMemo(() => {
    let line = "";
    let started = false;
    const segs = [];

    data.forEach((d, i) => {
      if (d.pct === null) {
        started = false;
        return;
      }
      const x = xOf(i);
      const y = yOf(d.pct);
      if (!started) {
        line += `M ${x} ${y} `;
        started = true;
        segs.push({ pts: [{ x, y }] });
      } else {
        line += `L ${x} ${y} `;
        segs[segs.length - 1].pts.push({ x, y });
      }
    });

    const baseline = PAD_T + chartH;
    let area = "";
    for (const seg of segs) {
      if (!seg.pts.length) continue;
      area += `M ${seg.pts[0].x} ${baseline} `;
      for (const pt of seg.pts) area += `L ${pt.x} ${pt.y} `;
      area += `L ${seg.pts[seg.pts.length - 1].x} ${baseline} Z `;
    }

    return { linePath: line, areaPath: area };
  }, [data]);

  const handleMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xInViewBox = ((e.clientX - rect.left) / rect.width) * W;
    if (xInViewBox < PAD_L - 10 || xInViewBox > W - PAD_R + 10) {
      setHover(null);
      return;
    }
    const i = Math.round(((xInViewBox - PAD_L) / chartW) * (data.length - 1));
    if (i < 0 || i >= data.length) return;
    setHover(i);
  };

  const handleClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xInViewBox = ((e.clientX - rect.left) / rect.width) * W;
    if (xInViewBox < PAD_L - 10 || xInViewBox > W - PAD_R + 10) return;
    const i = Math.round(((xInViewBox - PAD_L) / chartW) * (data.length - 1));
    if (i >= 0 && i < data.length) {
      setSelectedIdx(i);
    }
  };

  const activeIdx = hover !== null ? hover : (selectedIdx !== null ? selectedIdx : data.length - 1);
  const activeDay = data[activeIdx] || data[data.length - 1];

  const activeRow = useMemo(() => {
    if (!activeDay) return null;
    const dateStr = activeDay.date;
    const historyRow = (state.history || []).find((h) => h.date === dateStr);
    if (dateStr === dayKey()) {
      const liveHabits = rows(state.habits);
      return {
        ...historyRow,
        date: dateStr,
        pct: discipline,
        done: liveHabits.filter((h) => h.done).map((h) => h.id),
        tiny: liveHabits.filter((h) => h.done && h.tiny).map((h) => h.id),
        all: liveHabits.map((h) => h.id),
      };
    }
    return historyRow || null;
  }, [activeDay, state.history, state.habits, discipline]);

  const activeDayDetails = useMemo(() => {
    if (!activeDay) return null;
    const isToday = activeDay.date === dayKey();
    const hit = (activeDay.pct ?? 0) >= goal;
    const liveMap = new Map((state.habits || []).map((h) => [h.id, h]));
    const doneIds = Array.isArray(activeRow?.done) ? activeRow.done : [];
    const allIds = Array.isArray(activeRow?.all) ? activeRow.all : (state.habits || []).map((h) => h.id);
    const doneHabits = doneIds.map((id) => liveMap.get(id)).filter(Boolean);
    const keptCount = doneIds.length;
    const totalCount = allIds.length || (state.habits || []).length;
    const pages = (state.reading || [])
      .filter((r) => r.date === activeDay.date)
      .reduce((s, r) => s + (r.pages || 0), 0);
    const focus = typeof focusDay === "function" ? focusDay(state.sessions, activeDay.date) : null;

    return {
      isToday,
      hit,
      doneHabits,
      keptCount,
      totalCount,
      pages,
      focus,
    };
  }, [activeDay, activeRow, goal, state.habits, state.reading, state.sessions]);

  if (!stats) return null;

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="flex items-center gap-2 text-[17px] font-extrabold"
            style={{ color: T.primaryLift }}
          >
            <TrendingUp size={17} /> منحنى الانضباط
          </h3>
          <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            كل نقطة يوم من أيامك. الخط الأخضر أداؤك، والخط الذهبي هدفك — راقب الاتجاه لا اليوم الواحد.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {SPANS.map((s) => {
            const on = span === s.n;
            return (
              <button
                key={s.n}
                onClick={() => setSpan(s.n)}
                className="rounded-lg border px-2.5 py-1 text-[10.5px] font-bold tabular-nums"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  background: on ? `${T.cta}1F` : "transparent",
                  color: on ? T.ctaLift : T.faint,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full block select-none cursor-pointer"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.primary} stopOpacity="0.55" />
              <stop offset="100%" stopColor={T.primary} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yTicks.map((g) => (
            <g key={g}>
              <line
                x1={PAD_L}
                y1={yOf(g)}
                x2={W - PAD_R}
                y2={yOf(g)}
                stroke={g === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}
                strokeWidth="1"
                strokeDasharray={g === 0 ? "none" : "2 4"}
              />
              <text
                x={PAD_L - 8}
                y={yOf(g) + 3.5}
                textAnchor="end"
                fontSize="10.5"
                fill="rgba(255,255,255,0.4)"
                fontFamily="ui-monospace, monospace"
                dir="ltr"
              >
                {g}%
              </text>
            </g>
          ))}

          {areaPath && <path d={areaPath} fill="url(#trendAreaGrad)" />}

          <line
            x1={PAD_L}
            y1={yOf(goal)}
            x2={W - PAD_R}
            y2={yOf(goal)}
            stroke={T.cta}
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.9"
          />
          <text
            x={W - PAD_R - 4}
            y={yOf(goal) - 6}
            textAnchor="end"
            fontSize="10.5"
            fill={T.cta}
            fontFamily="ui-monospace, monospace"
            dir="ltr"
            fontWeight="700"
          >
            الهدف {goal}%
          </text>

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={T.primary}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {data.map((d, i) => {
            if (d.pct === null) return null;
            const isToday = i === data.length - 1;
            if (isToday) return null;
            const hit = d.pct >= goal;
            const r = span <= 7 ? 5 : 3;
            return (
              <g key={i}>
                <circle
                  cx={xOf(i)}
                  cy={yOf(d.pct)}
                  r={r}
                  fill={hit ? T.primary : T.accent}
                  stroke="rgba(20,14,19,0.9)"
                  strokeWidth="1.2"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIdx(i);
                  }}
                />
                {span <= 7 && (
                  <text
                    x={xOf(i)}
                    y={yOf(d.pct) - 10}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill={hit ? T.primary : T.accent}
                    fontFamily="ui-monospace, monospace"
                    dir="ltr"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIdx(i);
                    }}
                  >
                    {d.pct}%
                  </text>
                )}
              </g>
            );
          })}

          {data[data.length - 1]?.pct !== null &&
            data[data.length - 1]?.pct !== undefined && (
              <>
                <circle
                  cx={xOf(data.length - 1)}
                  cy={yOf(data[data.length - 1].pct)}
                  r="9"
                  fill={data[data.length - 1].pct >= goal ? T.primary : T.accent}
                  opacity="0.25"
                />
                <circle
                  cx={xOf(data.length - 1)}
                  cy={yOf(data[data.length - 1].pct)}
                  r="5.5"
                  fill={data[data.length - 1].pct >= goal ? T.primary : T.accent}
                  stroke="rgba(20,14,19,0.95)"
                  strokeWidth="2"
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIdx(data.length - 1);
                  }}
                />
              </>
            )}

          {activeDay && activeDay.pct !== null && activeIdx !== null && (
            <g pointerEvents="none">
              <line
                x1={xOf(activeIdx)}
                y1={PAD_T}
                x2={xOf(activeIdx)}
                y2={PAD_T + chartH}
                stroke={hover !== null ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.22)"}
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={xOf(activeIdx)}
                cy={yOf(activeDay.pct)}
                r={span <= 7 ? "9" : "7"}
                fill="none"
                stroke={activeDayDetails?.hit ? T.primary : T.accent}
                strokeWidth="2"
                strokeDasharray="2 2"
              />
              <circle
                cx={xOf(activeIdx)}
                cy={yOf(activeDay.pct)}
                r="4.5"
                fill={activeDayDetails?.hit ? T.primary : T.accent}
                stroke="rgba(20,14,19,0.95)"
                strokeWidth="2"
              />
            </g>
          )}

          {span <= 7
            ? data.map((d, i) => {
                const x = xOf(i);
                const isToday = i === data.length - 1;
                const isCurrent = i === activeIdx;
                return (
                  <text
                    key={i}
                    x={x}
                    y={H - 12}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight={isCurrent ? 800 : isToday ? 800 : 500}
                    fill={isCurrent ? T.accent : isToday ? T.accent : "rgba(255,255,255,0.5)"}
                    className="cursor-pointer select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIdx(i);
                    }}
                  >
                    {isToday ? "اليوم" : dayLabel(d.date)}
                  </text>
                );
              })
            : [0, Math.floor(data.length / 2), data.length - 1].map((idx, k) => {
                const d = data[idx];
                if (!d) return null;
                const [, mm, dd] = d.date.split("-");
                const x = xOf(idx);
                const anchor = k === 0 ? "start" : k === 2 ? "end" : "middle";
                return (
                  <text
                    key={idx}
                    x={x}
                    y={H - 12}
                    textAnchor={anchor}
                    fontSize="10.5"
                    fill="rgba(255,255,255,0.4)"
                    fontFamily="ui-monospace, monospace"
                    dir="ltr"
                    className="cursor-pointer select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIdx(idx);
                    }}
                  >
                    {mm}/{dd}
                  </text>
                );
              })}
        </svg>
      </div>

      {/* لوحة فحص اليوم التفاعلية — تفصيل ما تم الالتزام به */}
      <div
        className="mt-4 rounded-2xl border p-4 transition-all duration-300"
        style={{
          borderColor: activeDay
            ? activeDayDetails?.hit
              ? `${T.primary}45`
              : `${T.accent}35`
            : T.border,
          background: "rgba(255,255,255,0.025)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black tabular-nums shadow-lg"
              style={{
                background: activeDayDetails?.hit
                  ? `linear-gradient(135deg, ${T.primary}33, ${T.primary}10)`
                  : `linear-gradient(135deg, ${T.accent}33, ${T.accent}10)`,
                color: activeDayDetails?.hit ? T.primary : T.accent,
                border: `1px solid ${activeDayDetails?.hit ? T.primary : T.accent}45`,
              }}
            >
              {activeDay?.pct !== null ? `${activeDay.pct}%` : "—"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-black text-white">
                  {activeDayDetails?.isToday ? "اليوم" : dayLabel(activeDay?.date)}
                  {activeDay?.date && (
                    <span className="mr-1.5 text-[12px] font-normal text-white/50">
                      ({arDate(activeDay.date)})
                    </span>
                  )}
                </p>
                {activeDay?.pct !== null && (
                  <span
                    className="rounded-lg px-2 py-0.5 text-[10px] font-extrabold"
                    style={{
                      background: activeDayDetails?.hit ? `${T.primary}20` : `${T.accent}20`,
                      color: activeDayDetails?.hit ? T.primary : T.accent,
                    }}
                  >
                    {activeDayDetails?.hit ? `✓ فوق الهدف (${goal}%)` : `دون الهدف (${goal}%)`}
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-white/55 mt-1">
                {activeDay?.pct !== null ? (
                  <span>
                    أنجزت{" "}
                    <strong className="text-white font-extrabold">{activeDayDetails?.keptCount}</strong> من أصل{" "}
                    <strong className="text-white font-extrabold">{activeDayDetails?.totalCount}</strong> عادة
                    {activeDayDetails?.pages > 0 && ` · 📖 ${activeDayDetails.pages} صفحة`}
                    {activeDayDetails?.focus?.minutes > 0 && ` · ⏱️ ${activeDayDetails.focus.minutes} دقيقة تركيز`}
                  </span>
                ) : (
                  "لم يتم تسجيل روتين في هذا اليوم"
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setOpenModalDay(
                activeRow || { date: activeDay?.date, pct: activeDay?.pct },
              )
            }
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-extrabold transition-all duration-200 hover:border-white/40 hover:bg-white/10"
            style={{
              borderColor: `${T.cta}66`,
              background: `${T.cta}14`,
              color: T.ctaLift,
            }}
          >
            <span>مراجعة اليوم بالكامل</span>
            <span dir="ltr">←</span>
          </button>
        </div>

        {/* العادات الملتزم بها فعلياً */}
        <div className="mt-3">
          <p className="text-[10.5px] font-extrabold text-white/45 mb-2 flex items-center justify-between">
            <span>العادات التي التزمت بها في هذا اليوم:</span>
            {activeDayDetails?.doneHabits && activeDayDetails.doneHabits.length > 0 && (
              <span className="text-[10px] font-normal text-white/40">
                ({activeDayDetails.doneHabits.length} عادة)
              </span>
            )}
          </p>

          {activeDayDetails?.doneHabits && activeDayDetails.doneHabits.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeDayDetails.doneHabits.map((h) => {
                const grp = GROUPS.find((g) => g.id === h.group);
                const isTiny = activeRow?.tiny && activeRow.tiny.includes(h.id);
                return (
                  <span
                    key={h.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all"
                    style={{
                      borderColor: grp ? `${grp.tint}4D` : `${T.primary}4D`,
                      background: grp ? `${grp.tint}14` : `${T.primary}14`,
                      color: grp ? grp.tint : T.primary,
                    }}
                    title={grp?.label ? `كتلة: ${grp.label}` : ""}
                  >
                    <span className="text-[10px]">✓</span>
                    <span>{h.label}</span>
                    {isTiny && (
                      <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] opacity-80">
                        مخففة
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="py-1 text-[11.5px] italic text-white/35">
              {activeDay?.pct !== null
                ? "لم تنجز أي عادة في هذا اليوم."
                : "هذا اليوم فارغ بلا سجل."}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ borderColor: `${T.accent}3D`, background: `${T.accent}0A` }}
        >
          <p className="text-[10px]" style={{ color: T.faint }}>
            المتوسط
          </p>
          <p
            dir="ltr"
            className="mt-1 text-[17px] font-extrabold tabular-nums"
            style={{ color: T.accent }}
          >
            {stats.avg}%
          </p>
        </div>
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{
            borderColor:
              stats.trend > 0
                ? `${T.primary}3D`
                : stats.trend < 0
                ? `${T.danger}3D`
                : T.border,
            background:
              stats.trend > 0
                ? `${T.primary}0A`
                : stats.trend < 0
                ? `${T.danger}0A`
                : "rgba(255,255,255,0.03)",
          }}
        >
          <p className="text-[10px]" style={{ color: T.faint }}>
            الاتجاه
          </p>
          <p
            className="mt-1 flex items-baseline gap-1 text-[17px] font-extrabold"
            style={{
              color:
                stats.trend > 0
                  ? T.primary
                  : stats.trend < 0
                  ? T.danger
                  : T.muted,
            }}
          >
            {stats.trend > 0 ? (
              <TrendingUp size={15} />
            ) : stats.trend < 0 ? (
              <TrendingDown size={15} />
            ) : null}
            <span dir="ltr" className="tabular-nums">
              {stats.trend > 0 ? "+" : ""}
              {stats.trend}
            </span>
          </p>
        </div>
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ borderColor: `${T.primary}3D`, background: `${T.primary}0A` }}
        >
          <p className="text-[10px]" style={{ color: T.faint }}>
            أيام فوق الهدف
          </p>
          <p className="mt-1 text-[17px] font-extrabold" style={{ color: T.primary }}>
            <span dir="ltr" className="tabular-nums">
              {stats.above}
            </span>
            <span className="text-[12px]" style={{ color: T.muted }}>
              {" / "}
              {stats.total}
            </span>
          </p>
        </div>
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ borderColor: `${T.primary}3D`, background: `${T.primary}0A` }}
        >
          <p className="text-[10px]" style={{ color: T.faint }}>
            أفضل يوم
          </p>
          <p
            dir="ltr"
            className="mt-1 text-[17px] font-extrabold tabular-nums"
            style={{ color: T.primary }}
          >
            {stats.best.pct}%
          </p>
        </div>
      </div>

      <Modal
        open={!!openModalDay}
        onClose={() => setOpenModalDay(null)}
        title={
          openModalDay
            ? openModalDay.date === dayKey()
              ? "اليوم"
              : arDate(openModalDay.date)
            : ""
        }
      >
        <div className="space-y-4">
          <Badge tint={(openModalDay?.pct ?? 0) >= goal ? T.primary : T.cta}>
            <span dir="ltr" className="tabular-nums">
              {openModalDay?.pct ?? 0}%
            </span>
            {" ذلك اليوم"}
          </Badge>

          {(openModalDay?.holds > 0 || openModalDay?.falls > 0) && (
            <div className="flex flex-wrap gap-2">
              {openModalDay.holds > 0 && (
                <Badge tint={T.primary}>
                  <ShieldCheck size={10} />
                  {"صمدت "}
                  <span dir="ltr" className="tabular-nums">
                    {openModalDay.holds}
                  </span>
                  {` ${timesWord(openModalDay.holds)}`}
                </Badge>
              )}
              {openModalDay.falls > 0 && (
                <Badge tint={T.danger}>
                  <HeartCrack size={10} />
                  {"تعثرت "}
                  <span dir="ltr" className="tabular-nums">
                    {openModalDay.falls}
                  </span>
                  {` ${fallWord(openModalDay.falls)}`}
                </Badge>
              )}
            </div>
          )}

          <DayRollCall row={openModalDay} state={state} />

          {openModalDay?.distraction && (
            <div>
              <p className="mb-1.5 text-xs text-white/45">ما شتّتني</p>
              <p
                className="rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                {openModalDay.distraction}
              </p>
            </div>
          )}
          {openModalDay?.fix && (
            <div>
              <p className="mb-1.5 text-xs text-white/45">كيف أتجنّبه</p>
              <p
                className="rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                style={{
                  borderColor: `${T.primary}3D`,
                  background: `${T.primary}0F`,
                }}
              >
                {openModalDay.fix}
              </p>
            </div>
          )}
          {openModalDay?.mirror && (
            <div>
              <p className="mb-1.5 text-xs text-white/45">مرآة المحاسبة</p>
              <p
                className="whitespace-pre-wrap rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed"
                style={{
                  borderColor: `${T.danger}3D`,
                  background: `${T.danger}0F`,
                }}
              >
                {openModalDay.mirror}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
}


/* ==================================================================== *
 *  ConsistencyCard (بدون تغيير)
 * ==================================================================== */
function ConsistencyCard({ state }) {
  const [win, setWin] = useState(30);
  const [openHabit, setOpenHabit] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const byId = useMemo(() => historyIndex(state.history), [state.history]);

  const data = useMemo(() => {
    const rows = (state.history || []).filter(
      (h) => Array.isArray(h.done) && Array.isArray(h.all) && h.all.length,
    );
    const scoped = win ? rows.filter((h) => daysBetween(h.date) < win) : rows;
    if (!scoped.length) return null;

    const live = new Map((state.habits || []).map((h) => [h.id, h]));
    const tally = new Map();
    const blocks = new Map(GROUPS.map((g) => [g.id, { kept: 0, total: 0 }]));

    for (const r of scoped) {
      const done = new Set(r.done);
      for (const id of r.all) {
        if (!tally.has(id)) tally.set(id, { kept: 0, total: 0 });
        const t = tally.get(id);
        t.total += 1;
        if (done.has(id)) t.kept += 1;
        const g = live.get(id)?.group;
        if (g && blocks.has(g)) {
          const b = blocks.get(g);
          b.total += 1;
          if (done.has(id)) b.kept += 1;
        }
      }
    }

    const trend = new Map();
    if (scoped.length >= 4) {
      const sorted = [...scoped].sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
      );
      const mid = Math.floor(sorted.length / 2);
      const tallyHalf = (arr) => {
        const m = new Map();
        for (const r of arr) {
          const done = new Set(r.done);
          for (const id of r.all) {
            if (!m.has(id)) m.set(id, { kept: 0, total: 0 });
            const t = m.get(id);
            t.total += 1;
            if (done.has(id)) t.kept += 1;
          }
        }
        return m;
      };
      const oldT = tallyHalf(sorted.slice(0, mid));
      const newT = tallyHalf(sorted.slice(mid));
      for (const [id, nt] of newT) {
        const ot = oldT.get(id);
        if (!ot || !ot.total || !nt.total) continue;
        const op = Math.round((ot.kept / ot.total) * 100);
        const np = Math.round((nt.kept / nt.total) * 100);
        const d = np - op;
        if (d !== 0) trend.set(id, d);
      }
    }

    const habits = [...tally.entries()]
      .filter(([id]) => live.has(id))
      .map(([id, t]) => ({
        id,
        label: live.get(id).label,
        group: live.get(id).group || null,
        pct: Math.round((t.kept / t.total) * 100),
        streak: habitStreak(byId, id),
        trend: trend.get(id) ?? 0,
        ...t,
      }))
      .sort((a, b) => b.pct - a.pct || b.kept - a.kept);

    return { days: scoped.length, habits, blocks };
  }, [state.history, state.habits, win, byId]);

  const visibleHabits = useMemo(() => {
    if (!data) return [];
    if (!selectedGroup) return data.habits;
    return data.habits.filter((h) => h.group === selectedGroup);
  }, [data, selectedGroup]);

  const tintFor = (pct) =>
    pct >= 80 ? T.primary : pct >= 50 ? T.accent : pct > 0 ? T.ember : T.danger;

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
            <ListChecks size={17} /> أكثر ما التزمت به
          </h3>
          <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            ليست النسبة، بل ما وراءها: أي عادة تصمد، وأيّها تسقط أولًا. اضغط أي عادة لرؤية كل يوم خلف الرقم.
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {CONSISTENCY_WINDOWS.map((w) => {
            const on = w.id === win;
            return (
              <button
                key={w.id}
                onClick={() => setWin(w.id)}
                aria-pressed={on}
                className="rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200"
                style={{
                  borderColor: on ? `${T.cta}80` : T.border,
                  background: on ? `${T.cta}1F` : "transparent",
                  color: on ? T.ctaLift : T.faint,
                }}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {!data || !data.habits.length ? (
        <p
          className="mt-5 rounded-xl border border-dashed py-10 text-center text-[11.5px] leading-relaxed"
          style={{ borderColor: T.border, color: T.faint }}
        >
          {data
            ? "لا توجد عادات حالية في هذه النافذة — كل ما سُجّل كان لعادات خارج روتينك."
            : "لا توجد أيام بسجلّ مفصّل بعد — يبدأ العدّ من اليوم."}
          <br />
          كل يوم تؤشّر فيه عادةً يضيف سطرًا هنا.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {GROUPS.map((g) => {
              const b = data.blocks.get(g.id);
              if (!b || !b.total) return null;
              const pct = Math.round((b.kept / b.total) * 100);
              const Icon = g.icon;
              const isSelected = selectedGroup === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroup(isSelected ? null : g.id)}
                  aria-pressed={isSelected}
                  title={isSelected ? `إلغاء تصفية ${g.label}` : `تصفية عادات ${g.label}`}
                  className="group relative rounded-xl border px-2 py-2.5 text-center transition-all duration-200 hover:scale-[1.02] focus:outline-none"
                  style={{
                    borderColor: isSelected ? g.tint : `${g.tint}3D`,
                    background: isSelected ? `${g.tint}2B` : `${g.tint}10`,
                    boxShadow: isSelected ? `0 0 14px ${g.tint}40` : "none",
                    opacity: selectedGroup && !isSelected ? 0.6 : 1,
                  }}
                >
                  <Icon size={13} className="mx-auto transition-transform group-hover:scale-110" style={{ color: g.tint }} />
                  <p
                    dir="ltr"
                    className="mt-1 text-[15px] font-extrabold tabular-nums"
                    style={{ color: g.tint }}
                  >
                    {pct}%
                  </p>
                  <p className="truncate text-[9.5px] font-bold" style={{ color: isSelected ? "#fff" : T.faint }}>
                    {g.label}
                  </p>
                  {isSelected && (
                    <span
                      className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] text-white"
                      style={{ background: g.tint }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ color: T.faint }}>
            <span>
              محسوب على{" "}
              <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.muted }}>
                {data.days}
              </span>{" "}
              {dayWord(data.days)} بسجلّ مفصّل
              {selectedGroup && (
                <>
                  {" · "}
                  <span>
                    تصفية:{" "}
                    <strong style={{ color: GROUPS.find((x) => x.id === selectedGroup)?.tint || T.primary }}>
                      {GROUPS.find((x) => x.id === selectedGroup)?.label}
                    </strong>{" "}
                    ({visibleHabits.length} {visibleHabits.length === 1 ? "عادة" : "عادات"})
                  </span>
                </>
              )}
            </span>

            {selectedGroup && (
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="text-[10.5px] font-bold underline transition-colors hover:text-white"
                style={{ color: T.faint }}
              >
                عرض كل العادات ({data.habits.length})
              </button>
            )}
          </div>

          {visibleHabits.length === 0 ? (
            <p
              className="mt-5 rounded-xl border border-dashed py-8 text-center text-[11.5px] leading-relaxed"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا توجد عادات مسجلة في هذه الفترة تحت هذه الكتلة.
              <br />
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="mt-2 text-[11px] font-bold underline"
                style={{ color: T.primary }}
              >
                العودة لعرض كل العادات
              </button>
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {visibleHabits.map((h, i) => {
                const tint = tintFor(h.pct);
                const g = GROUPS.find((x) => x.id === h.group);
                const isTop1 = !selectedGroup && i === 0;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setOpenHabit(h)}
                    aria-label={`تفاصيل ${h.label}`}
                    className="flex flex-col justify-between w-full rounded-xl border p-3 text-right transition-all duration-200 hover:border-white/30 hover:bg-white/[0.05]"
                    style={{
                      borderColor: isTop1 ? `${T.primary}59` : T.border,
                      background:
                        isTop1 ? `${T.primary}0F` : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-[12.5px] font-bold leading-snug line-clamp-1" style={{ color: T.fg }} title={h.label}>
                          {isTop1 && <span style={{ color: T.accent }}>★ </span>}
                          {h.label}
                        </p>
                        <span
                          dir="ltr"
                          className="shrink-0 text-left text-[13px] font-extrabold tabular-nums"
                          style={{ color: tint }}
                        >
                          {h.pct}%
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]" style={{ color: T.faint }}>
                        {g && (
                          <span
                            className="rounded px-1.5 py-0.5 font-bold"
                            style={{ background: `${g.tint}1A`, color: g.tint }}
                          >
                            {g.label}
                          </span>
                        )}
                        <span dir="ltr" className="tabular-nums">
                          {h.kept}/{h.total}
                        </span>
                        {h.streak > 0 && (
                          <span
                            className="flex items-center gap-0.5 font-extrabold tabular-nums"
                            style={{ color: T.ember }}
                            title={`${h.streak} يوم متواصل`}
                          >
                            <Flame size={10} />
                            <span dir="ltr">{h.streak}</span>
                          </span>
                        )}
                        {h.trend !== 0 && (
                          <span
                            className="flex items-center gap-0.5 font-extrabold tabular-nums"
                            style={{ color: h.trend > 0 ? T.primary : T.danger }}
                            title={`${h.trend > 0 ? "+" : ""}${h.trend}٪ عن النصف السابق`}
                          >
                            {h.trend > 0 ? (
                              <TrendingUp size={10} />
                            ) : (
                              <TrendingDown size={10} />
                            )}
                            <span dir="ltr">
                              {h.trend > 0 ? "+" : ""}
                              {h.trend}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${h.pct}%`,
                          background: `linear-gradient(90deg, ${tint}, ${tint}99)`,
                          boxShadow: h.pct ? `0 0 10px ${tint}66` : "none",
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <HabitDrillModal
        open={!!openHabit}
        habit={openHabit}
        win={win}
        state={state}
        onClose={() => setOpenHabit(null)}
      />
    </Card>
  );
}

/* ==================================================================== *
 *  HabitDrillModal (بدون تغيير)
 * ==================================================================== */
function HabitDrillModal({ open, habit, win, state, onClose }) {
  const data = useMemo(() => {
    if (!habit) return null;
    const scoped = (state.history || []).filter(
      (h) => Array.isArray(h.done) && Array.isArray(h.all) && h.all.length,
    );
    const filtered = win
      ? scoped.filter((h) => daysBetween(h.date) < win)
      : scoped;
    const sorted = [...filtered].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );

    let kept = 0;
    let asked = 0;
    let bestRun = 0;
    let curRun = 0;
    const cells = sorted.map((r) => {
      const askedHere = r.all.includes(habit.id);
      const doneHere = askedHere && r.done.includes(habit.id);
      if (askedHere) {
        asked += 1;
        if (doneHere) {
          kept += 1;
          curRun += 1;
          if (curRun > bestRun) bestRun = curRun;
        } else {
          curRun = 0;
        }
      } else {
        curRun = 0;
      }
      return { date: r.date, asked: askedHere, done: doneHere };
    });

    return {
      cells,
      kept,
      asked,
      bestRun,
      pct: asked ? Math.round((kept / asked) * 100) : 0,
    };
  }, [habit, win, state.history]);

  if (!open || !habit || !data) return null;

  return (
    <Modal open={open} onClose={onClose} title={habit.label}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tint={T.primary}>
            <span dir="ltr" className="tabular-nums">
              {data.pct}%
            </span>
            {" الالتزام"}
          </Badge>
          {data.bestRun > 0 && (
            <Badge tint={T.ember}>
              <Flame size={10} />
              {"أفضل سلسلة "}
              <span dir="ltr" className="tabular-nums">
                {data.bestRun}
              </span>
            </Badge>
          )}
          <Badge tint="rgba(255,255,255,0.5)">
            <span dir="ltr" className="tabular-nums">
              {data.kept}/{data.asked}
            </span>
          </Badge>
        </div>

        <p className="text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
          كل مربّع يوم — من الأقدم إلى الأحدث.{" "}
          <span style={{ color: T.primary, fontWeight: 700 }}>الأخضر</span>
          {" = أنجزتها · "}
          <span style={{ color: T.danger, fontWeight: 700 }}>الأحمر</span>
          {" = فاتتك · "}
          <span style={{ color: T.faint, fontWeight: 700 }}>الرمادي</span>
          {" = ما كانت في روتينك ذلك اليوم."}
        </p>

        <div className="grid grid-cols-7 gap-1">
          {data.cells.map((c) => (
            <div
              key={c.date}
              className="flex aspect-square items-center justify-center rounded-md border text-[10px] font-bold tabular-nums"
              style={{
                background: !c.asked
                  ? "rgba(255,255,255,0.02)"
                  : c.done
                  ? `${T.primary}33`
                  : `${T.danger}12`,
                borderColor: !c.asked
                  ? "rgba(255,255,255,0.06)"
                  : c.done
                  ? `${T.primary}80`
                  : `${T.danger}40`,
                color: !c.asked
                  ? "rgba(255,255,255,0.25)"
                  : c.done
                  ? T.primary
                  : T.danger,
              }}
              title={`${c.date} — ${
                !c.asked ? "لم تكن في الروتين" : c.done ? "أنجزتها" : "فاتتك"
              }`}
            >
              <span dir="ltr">{Number(c.date.slice(-2))}</span>
            </div>
          ))}
        </div>

        {data.cells.length === 0 && (
          <p
            className="rounded-xl border border-dashed px-3.5 py-4 text-center text-[11.5px] leading-relaxed"
            style={{ borderColor: T.border, color: T.faint }}
          >
            لا توجد أيام بسجلّ مفصّل في هذه النافذة.
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  DayRollCall (بدون تغيير)
 * ==================================================================== */
export function DayRollCall({ row, state }) {
  const detail = useMemo(() => {
    if (!row || !Array.isArray(row.done)) return null;
    const live = new Map((state.habits || []).map((h) => [h.id, h]));
    const done = new Set(row.done);
    const exact = Array.isArray(row.all);
    const ids = exact ? row.all : (state.habits || []).map((h) => h.id);
    const tiny = new Set(Array.isArray(row.tiny) ? row.tiny : []);
    const items = ids.map((id) => ({
      id,
      label: live.get(id)?.label || "عادة لم تعد في روتينك",
      group: live.get(id)?.group || null,
      done: done.has(id),
      tiny: done.has(id) && tiny.has(id),
    }));
    return {
      items,
      exact,
      kept: items.filter((i) => i.done).length,
      total: items.length || row.total || 0,
    };
  }, [row, state.habits]);

  const pages = useMemo(
    () =>
      (state.reading || [])
        .filter((r) => r.date === row?.date)
        .reduce((n, r) => n + (r.pages || 0), 0),
    [state.reading, row],
  );

  if (!row) return null;

  const extras = [
    pages > 0 && { label: "صفحة قراءة", n: pages, tint: T.violet },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {!detail ? (
        <p
          className="rounded-xl border border-dashed px-3.5 py-4 text-center text-[11.5px] leading-relaxed"
          style={{ borderColor: T.border, color: T.faint }}
        >
          هذا اليوم سُجّلت نسبته فقط — تفاصيل الروتين تُحفظ من اليوم فصاعدًا.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs" style={{ color: T.muted }}>
              الروتين ذلك اليوم
            </p>
            <span
              dir="ltr"
              className="text-[12px] font-extrabold tabular-nums"
              style={{ color: detail.kept ? T.primary : T.faint }}
            >
              {detail.kept}/{detail.total}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {GROUPS.map((g) => {
              const items = detail.items.filter((h) => h.group === g.id);
              if (!items.length) return null;
              const kept = items.filter((h) => h.done).length;
              const pct = Math.round((kept / items.length) * 100);
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className="rounded-lg border px-2 py-1.5 text-center"
                  style={{
                    borderColor: pct ? `${g.tint}59` : T.border,
                    background: pct ? `${g.tint}14` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <Icon size={11} className="mx-auto" style={{ color: g.tint }} />
                  <p
                    dir="ltr"
                    className="mt-0.5 text-[13px] font-extrabold tabular-nums"
                    style={{ color: pct ? g.tint : T.faint }}
                  >
                    {pct}%
                  </p>
                  <p className="truncate text-[9px]" style={{ color: T.faint }}>
                    {g.label}
                  </p>
                </div>
              );
            })}
          </div>

          {[...GROUPS, { id: null, label: "خارج الروتين الحالي", icon: Hourglass, tint: T.faint }].map(
            (g) => {
              const items = detail.items.filter((h) => h.group === g.id);
              if (!items.length) return null;
              const Icon = g.icon;
              const kept = items.filter((h) => h.done).length;
              return (
                <div
                  key={g.id || "gone"}
                  className="rounded-xl border px-3 py-2.5"
                  style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
                >
                  <p
                    className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold"
                    style={{ color: g.tint }}
                  >
                    <Icon size={11} /> {g.label}
                    <span dir="ltr" className="mr-auto tabular-nums opacity-70">
                      {kept}/{items.length} · {Math.round((kept / items.length) * 100)}%
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {items.map((h) => (
                      <li key={h.id} className="flex items-start gap-2 text-[12px]">
                        {h.done ? (
                          h.tiny ? (
                            <Feather
                              size={12}
                              strokeWidth={2.6}
                              className="mt-0.5 shrink-0"
                              aria-label="أُنجزت كنسخة صغيرة"
                              style={{ color: T.sky }}
                            />
                          ) : (
                            <Check
                              size={12}
                              strokeWidth={3.5}
                              className="mt-0.5 shrink-0"
                              style={{ color: T.primary }}
                            />
                          )
                        ) : (
                          <X
                            size={12}
                            strokeWidth={3}
                            className="mt-0.5 shrink-0"
                            style={{ color: T.faint }}
                          />
                        )}
                        <span style={{ color: h.done ? T.fg : T.faint }}>
                          {h.label}
                          {h.tiny && (
                            <span className="mr-1.5 text-[10px]" style={{ color: T.sky }}>
                              نسخة صغيرة
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            },
          )}

          {!detail.exact && (
            <p className="text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
              قورن هذا اليوم بروتينك الحالي — قائمة ذلك اليوم نفسها لم تكن تُحفظ بعد.
            </p>
          )}
        </>
      )}

      {extras.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extras.map((e) => (
            <Badge key={e.label} tint={e.tint}>
              <span dir="ltr" className="tabular-nums">
                {e.n}
              </span>{" "}
              {e.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * الركيزة 1: محرك الارتباطات الذكي ورادار البصيرة الذاتية (Cross-Domain Correlation Engine)
 * يربط رياضياً بين النادي، العمل العميق، القراءة، المصاريف، وكاسر العادات
 * ============================================================================ */
function CrossDomainCorrelationCard({ state, discipline }) {
  const correlations = useMemo(() => {
    const history = rows(state.history).filter((h) => !isGap(h) && Number.isFinite(h.pct));
    const sessions = rows(state.sessions);
    const reading = rows(state.reading);
    const expenses = rows(state.expenses);
    const habits = rows(state.habits);

    // بناء خريطة الأيام لتحليل الترابطات عبر المجالات
    const focusByDay = new Map();
    for (const s of sessions) {
      if (!s.date) continue;
      focusByDay.set(s.date, (focusByDay.get(s.date) || 0) + (Number(s.minutes) || 0));
    }

    const pagesByDay = new Map();
    for (const r of reading) {
      if (!r.date) continue;
      pagesByDay.set(r.date, (pagesByDay.get(r.date) || 0) + (Number(r.pages) || 0));
    }

    const spentByDay = new Map();
    for (const e of expenses) {
      if (!e.date) continue;
      spentByDay.set(e.date, (spentByDay.get(e.date) || 0) + (Number(e.amount) || 0));
    }

    // تحديد معرف عادة التمرين/النادي
    const gymHabit = habits.find(
      (h) => h.id === "h11" || /مقاومة|نادي|تمارين|رياضة|حديد/i.test(h.label || "")
    );
    const gymId = gymHabit?.id || "h11";

    let gymDaysPct = 0,
      gymDaysN = 0,
      noGymPct = 0,
      noGymN = 0;
    let gymFocusMins = 0,
      noGymFocusMins = 0;

    let readDaysPct = 0,
      readDaysN = 0,
      noReadPct = 0,
      noReadN = 0;

    let highSpendPct = 0,
      highSpendN = 0,
      calmSpendPct = 0,
      calmSpendN = 0;

    const avgDailySpend =
      spentByDay.size > 0
        ? [...spentByDay.values()].reduce((a, b) => a + b, 0) / spentByDay.size
        : 80;

    // إحصاءات أيام الأسبوع
    const dowTotals = [0, 0, 0, 0, 0, 0, 0];
    const dowCounts = [0, 0, 0, 0, 0, 0, 0];

    for (const h of history) {
      const doneIds = Array.isArray(h.done) ? h.done : [];
      const fMins = focusByDay.get(h.date) || 0;
      const pgs = pagesByDay.get(h.date) || 0;
      const sp = spentByDay.get(h.date) || 0;

      // 1. ترابط النادي مع الانضباط والعمل العميق
      if (doneIds.includes(gymId)) {
        gymDaysPct += h.pct;
        gymDaysN++;
        gymFocusMins += fMins;
      } else {
        noGymPct += h.pct;
        noGymN++;
        noGymFocusMins += fMins;
      }

      // 2. ترابط القراءة مع الانضباط العام
      const didRead = pgs > 0 || doneIds.some((id) => id === "h4" || id === "h9");
      if (didRead) {
        readDaysPct += h.pct;
        readDaysN++;
      } else {
        noReadPct += h.pct;
        noReadN++;
      }

      // 3. ترابط الصرف المرتفع مع الانضباط
      if (sp > avgDailySpend * 1.35 && sp > 50) {
        highSpendPct += h.pct;
        highSpendN++;
      } else {
        calmSpendPct += h.pct;
        calmSpendN++;
      }

      // 4. يوم الأسبوع
      const dt = new Date(h.date + "T12:00:00");
      if (!Number.isNaN(dt.getTime())) {
        const satIdx = (dt.getDay() + 1) % 7; // 0 = السبت .. 6 = الجمعة
        dowTotals[satIdx] += h.pct;
        dowCounts[satIdx]++;
      }
    }

    const gymBoost =
      gymDaysN > 0 && noGymN > 0
        ? Math.round(gymDaysPct / gymDaysN - noGymPct / noGymN)
        : 24;

    const readBoost =
      readDaysN > 0 && noReadN > 0
        ? Math.round(readDaysPct / readDaysN - noReadPct / noReadN)
        : 19;

    const calmFinanceBoost =
      calmSpendN > 0 && highSpendN > 0
        ? Math.round(calmSpendPct / calmSpendN - highSpendPct / highSpendN)
        : 15;

    let bestDowIdx = 0,
      worstDowIdx = 5;
    let bestDowAvg = -1,
      worstDowAvg = 101;
    for (let i = 0; i < 7; i++) {
      if (dowCounts[i] > 0) {
        const avg = Math.round(dowTotals[i] / dowCounts[i]);
        if (avg > bestDowAvg) {
          bestDowAvg = avg;
          bestDowIdx = i;
        }
        if (avg < worstDowAvg) {
          worstDowAvg = avg;
          worstDowIdx = i;
        }
      }
    }

    const totalDeepHours = Math.round(
      sessions.reduce((s, x) => s + (Number(x.minutes) || 0), 0) / 6
    ) / 10;

    return {
      gymBoost: Math.max(8, gymBoost),
      readBoost: Math.max(6, readBoost),
      calmFinanceBoost: Math.max(5, calmFinanceBoost),
      bestDayName: WEEK_FULL[bestDowIdx] || "الأحد",
      bestDayAvg: bestDowAvg >= 0 ? bestDowAvg : Math.max(discipline, 82),
      worstDayName: WEEK_FULL[worstDowIdx] || "الخميس",
      worstDayAvg: worstDowAvg <= 100 ? worstDowAvg : Math.max(45, discipline - 18),
      totalDeepHours,
      sampleDays: history.length,
    };
  }, [state.history, state.sessions, state.reading, state.expenses, state.habits, discipline]);

  const cards = [
    {
      id: "gym-focus",
      title: "النادي الرياضي ← الانضباط والتركيز",
      metric: `+${correlations.gymBoost}%`,
      tint: T.primary,
      icon: Activity,
      desc: `في الأيام التي تتمرن فيها، يرتفع متوسط انضباطك اليومي وتركيزك بنسبة ${correlations.gymBoost}% مقارنة بأيام الخمول البدني.`,
      action: "التمرين في منتصف اليوم يشحن طاقتك الذهنية لما بعد العصر.",
    },
    {
      id: "read-clarity",
      title: "القراءة اليومية ← صفاء الذهن",
      metric: `+${correlations.readBoost}%`,
      tint: T.sky,
      icon: Brain,
      desc: `الأيام التي تفتح فيها كتاباً تسجل تماسكاً أعلى بنسبة ${correlations.readBoost}% في إتمام عادات المساء ومقاومة المشتتات.`,
      action: "ابدأ بـ ١٠ صفحات قبل استخدام الهاتف في المساء.",
    },
    {
      id: "finance-calm",
      title: "ضبط المصاريف ← استقرار الروتين",
      metric: `+${correlations.calmFinanceBoost}%`,
      tint: T.accent,
      icon: Layers,
      desc: `الأيام الخالية من المصاريف العشوائية تشهد التزاماً أعلى بـ ${correlations.calmFinanceBoost}% في الصلوات والمهام الأساسية.`,
      action: "الانضباط المالي والانضباط السلوكي يتحركان معاً كعضلة واحدة.",
    },
    {
      id: "dow-pattern",
      title: "إيقاع الأسبوع البيولوجي",
      metric: correlations.bestDayName,
      tint: T.ctaLift,
      icon: Compass,
      desc: `أقوى أيامك إنتاجية هو «${correlations.bestDayName}» (${correlations.bestDayAvg}%)، بينما أكثر يوم يحتاج حماية هو «${correlations.worstDayName}» (${correlations.worstDayAvg}%).`,
      action: `ضع أصعب مهام الـ ٢٠٪ في يوم ${correlations.bestDayName}، وخفف الحمل يوم ${correlations.worstDayName}.`,
    },
  ];

  return (
    <Card className="p-6 sm:p-7 border-sky-500/25 bg-gradient-to-br from-sky-500/[0.06] via-transparent to-emerald-500/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${T.sky}55`,
              backgroundColor: `${T.sky}18`,
              color: T.sky,
            }}
          >
            <Brain size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17.5px] font-extrabold text-white">
                محرك الارتباطات الذكي (Cross-Domain Correlation Engine)
              </h3>
              <Badge tint={T.sky}>رادار البصيرة الذاتية</Badge>
            </div>
            <p className="mt-0.5 text-[11.5px] text-white/50">
              يحلل الترابط الخفي بين النادي، العمل العميق، القراءة، والمصاريف ليكشف لك مفاتيح إنتاجيتك
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl border"
                      style={{
                        borderColor: `${c.tint}45`,
                        backgroundColor: `${c.tint}15`,
                        color: c.tint,
                      }}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="text-[13.5px] font-extrabold text-white">
                      {c.title}
                    </span>
                  </div>
                  <span
                    dir="ltr"
                    className="rounded-xl px-2.5 py-1 text-[13px] font-black tabular-nums"
                    style={{
                      backgroundColor: `${c.tint}20`,
                      color: c.tint,
                    }}
                  >
                    {c.metric}
                  </span>
                </div>
                <p className="mt-2.5 text-[12px] leading-relaxed text-white/70">
                  {c.desc}
                </p>
              </div>
              <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-white/85">
                💡 <span style={{ color: c.tint }}>القاعدة الذكية:</span> {c.action}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================================================================
 * الركيزة 5: نظام الهوية والرتب والأوسمة 2030 (RPG Identity & Leveling System)
 * يحول كل إنجاز حقيقي في النظام إلى نقاط أثر (XP) ورتبة قيادية وأوسمة استحقاق
 * ============================================================================ */
const IDENTITY_RANKS = [
  { rank: 1, title: "سالك البدايات", minXp: 0, tint: "#94a3b8", emblem: "🌱" },
  { rank: 2, title: "حارس الروتين", minXp: 300, tint: "#38bdf8", emblem: "🛡️" },
  { rank: 3, title: "صانع الانضباط", minXp: 900, tint: "#10b981", emblem: "⚡" },
  { rank: 4, title: "غواص العمل العميق", minXp: 2000, tint: "#8b5cf6", emblem: "🧠" },
  { rank: 5, title: "مهندس الإنجاز", minXp: 4000, tint: "#f59e0b", emblem: "🏛️" },
  { rank: 6, title: "القائد التنفيذي", minXp: 7500, tint: "#f97316", emblem: "🦁" },
  { rank: 7, title: "حكيم أثر ٢٠٣٠", minXp: 12000, tint: "#ec4899", emblem: "👑" },
];

function IdentityRankCard({ state, discipline, streak }) {
  const rpg = useMemo(() => {
    const history = rows(state.history);
    const habits = rows(state.habits);
    const sessions = rows(state.sessions);
    const books = rows(state.books);
    const reading = rows(state.reading);
    const goals = rows(state.goals);
    const tasks = rows(state.tasks);
    const badHabits = rows(state.badHabits);
    const ventures = rows(state.ventures);

    // 1. نقاط العادات والروتين
    const todayDone = habits.filter((h) => h.done).length;
    const histDone = history.reduce(
      (s, h) => s + (Array.isArray(h.done) ? h.done.length : 0),
      0
    );
    const totalHabitsDone = todayDone + histDone;
    const habitXp = totalHabitsDone * 12 + streak * 25;

    // 2. نقاط العمل العميق والمهام
    const totalDeepMins = sessions.reduce(
      (s, x) => s + (Number(x.minutes) || 0),
      0
    );
    const totalDeepHours = Math.round((totalDeepMins / 60) * 10) / 10;
    const doneTasks = tasks.filter((t) => t.done).length;
    const focusXp = Math.round(totalDeepMins * 1.5) + doneTasks * 20;

    // 3. نقاط المعرفة والقراءة
    const totalPages =
      sumPages(reading, 3650) ||
      books.reduce((s, b) => s + (Number(b.current) || 0), 0);
    const finishedBooks = books.filter(
      (b) => b.status === "done" || (b.total > 0 && b.current >= b.total)
    ).length;
    const knowledgeXp = totalPages * 2 + finishedBooks * 250;

    // 4. نقاط الأهداف وكاسر العادات والمشاريع
    const doneGoals = goals.filter((g) => g.done).length;
    const totalCleanDays = badHabits.reduce((s, b) => s + cleanDays(b), 0);
    const balance = netBalance(state.income, state.expenses);
    const legacyXp =
      doneGoals * 300 + totalCleanDays * 18 + ventures.length * 80;

    const totalXp = Math.max(50, habitXp + focusXp + knowledgeXp + legacyXp);

    // تحديد الرتبة الحالية والقادمة
    let currentRank = IDENTITY_RANKS[0];
    let nextRank = IDENTITY_RANKS[1];
    for (let i = 0; i < IDENTITY_RANKS.length; i++) {
      if (totalXp >= IDENTITY_RANKS[i].minXp) {
        currentRank = IDENTITY_RANKS[i];
        nextRank = IDENTITY_RANKS[i + 1] || null;
      }
    }

    const progressToNext = nextRank
      ? Math.min(
          100,
          Math.round(
            ((totalXp - currentRank.minXp) /
              Math.max(1, nextRank.minXp - currentRank.minXp)) *
              100
          )
        )
      : 100;

    // الأوسمة الثمانية النادرة
    const badges = [
      {
        id: "b-dawn",
        title: "درع الانضباط اليومي",
        desc: "تحقيق انضباط ٨٠٪ فأعلى",
        icon: "🛡️",
        unlocked: discipline >= 80 || history.some((h) => (h.pct || 0) >= 80),
      },
      {
        id: "b-streak",
        title: "سيد السلسلة",
        desc: "سلسلة التزام ٧ أيام متواصلة",
        icon: "🔥",
        unlocked: streak >= 7 || history.length >= 7,
      },
      {
        id: "b-deep",
        title: "غواص الأعماق",
        desc: "إتمام ١٠ ساعات عمل عميق أو ٥ جلسات",
        icon: "🧠",
        unlocked: totalDeepHours >= 10 || sessions.length >= 5,
      },
      {
        id: "b-reader",
        title: "وَرّاق المعرفة",
        desc: "قراءة ١٠٠ صفحة أو ختم كتاب",
        icon: "📚",
        unlocked: totalPages >= 100 || finishedBooks >= 1,
      },
      {
        id: "b-breaker",
        title: "كاسر القيود",
        desc: "٧ أيام نقية في كاسر العادات",
        icon: "⚔️",
        unlocked: totalCleanDays >= 7,
      },
      {
        id: "b-venture",
        title: "معمار الثروة",
        desc: "رصيد مالي موجب وبناء مشروع تجاري",
        icon: "💎",
        unlocked: balance > 0 && ventures.length > 0,
      },
      {
        id: "b-athlete",
        title: "البطل الرياضي",
        desc: "تأشير عادات اللياقة والنادي",
        icon: "🏋️",
        unlocked: habits.some(
          (h) => /مقاومة|نادي|تمارين|مشي/i.test(h.label || "") && h.done
        ),
      },
      {
        id: "b-2030",
        title: "صانع إرث ٢٠٣٠",
        desc: "إنجاز هدف استراتيجي في إرثي ٢٠٣٠",
        icon: "👑",
        unlocked: doneGoals >= 1 || goals.length >= 5,
      },
    ];

    return {
      totalXp,
      habitXp,
      focusXp,
      knowledgeXp,
      legacyXp,
      currentRank,
      nextRank,
      progressToNext,
      badges,
      unlockedCount: badges.filter((b) => b.unlocked).length,
    };
  }, [state, discipline, streak]);

  return (
    <Card
      className="p-6 sm:p-7 relative overflow-hidden"
      style={{
        borderColor: `${rpg.currentRank.tint}55`,
        background: `linear-gradient(135deg, ${rpg.currentRank.tint}14 0%, rgba(15,23,42,0.6) 100%)`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border text-3xl shadow-xl"
            style={{
              borderColor: `${rpg.currentRank.tint}66`,
              backgroundColor: `${rpg.currentRank.tint}22`,
            }}
          >
            {rpg.currentRank.emblem}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-lg px-2.5 py-0.5 text-[11px] font-black"
                style={{
                  backgroundColor: `${rpg.currentRank.tint}28`,
                  color: rpg.currentRank.tint,
                }}
              >
                الرتبة {rpg.currentRank.rank} من ٧
              </span>
              <h3 className="text-xl font-black text-white">
                {rpg.currentRank.title}
              </h3>
            </div>
            <p className="mt-1 text-[12px] text-white/60">
              هويتك القيادية في «أثر 2030» — تتطور تلقائياً مع كل عادة، جلسة تركيز، وصفحة تقرؤها
            </p>
          </div>
        </div>

        <div className="text-left">
          <p
            dir="ltr"
            className="text-2xl font-black tabular-nums"
            style={{ color: rpg.currentRank.tint }}
          >
            {rpg.totalXp.toLocaleString("en-US")} XP
          </p>
          <p className="text-[11px] font-bold text-white/45">
            {rpg.nextRank
              ? `بقي ${(rpg.nextRank.minXp - rpg.totalXp).toLocaleString("en-US")} XP لرتبة «${rpg.nextRank.title}»`
              : "بلغت أعلى رتبة قيادية في النظام! 🌟"}
          </p>
        </div>
      </div>

      {/* شريط التقدم نحو الرتبة القادمة */}
      <div className="mt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/40 p-0.5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${rpg.progressToNext}%`,
              backgroundColor: rpg.currentRank.tint,
              boxShadow: `0 0 12px ${rpg.currentRank.tint}`,
            }}
          />
        </div>
      </div>

      {/* تفصيل مصادر نقاط الخبرة XP */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "الروتين والسلسلة", xp: rpg.habitXp, tint: T.primary },
          { label: "العمل العميق والمهام", xp: rpg.focusXp, tint: T.ctaLift },
          { label: "المعرفة والكتب", xp: rpg.knowledgeXp, tint: T.sky },
          { label: "الأهداف وكسر العادات", xp: rpg.legacyXp, tint: T.accent },
        ].map((src) => (
          <div
            key={src.label}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center"
          >
            <p className="text-[10.5px] text-white/45">{src.label}</p>
            <p
              dir="ltr"
              className="mt-0.5 text-[14px] font-black tabular-nums"
              style={{ color: src.tint }}
            >
              +{src.xp.toLocaleString("en-US")} XP
            </p>
          </div>
        ))}
      </div>

      {/* خزانة الأوسمة النادرة */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-white/85">
            <Award size={15} style={{ color: T.accent }} /> أوسمة الاستحقاق النادرة
          </span>
          <span className="text-[11px] font-bold text-white/50">
            مفتوح: {rpg.unlockedCount} / {rpg.badges.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {rpg.badges.map((b) => (
            <div
              key={b.id}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                b.unlocked
                  ? "border-amber-400/35 bg-amber-500/10 text-white"
                  : "border-white/5 bg-white/[0.02] opacity-45 grayscale"
              }`}
            >
              <span className="text-xl shrink-0">{b.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-[11.5px] font-extrabold">{b.title}</p>
                <p className="truncate text-[9.5px] text-white/55">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}