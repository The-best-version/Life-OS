import { AR_MONTHS, Badge, Btn, Card, GROUPS, Modal, T, WEEK_LABELS, arDate, dayWord, daysPhrase, fallWord, timesWord } from "../components/life-shared.jsx";
import { STREAK_TARGET, DAILY_GOAL_DEFAULT, DAILY_GOAL_MIN, DAILY_GOAL_MAX, clampDailyGoal, dayKey, daysBetween, habitStreak, historyIndex, isGap, levelOf, rows } from "../state/life-state.mjs";
import { CalendarDays, CalendarRange, Check, ChevronLeft, ChevronRight, Feather, Flame, HeartCrack, Hourglass, ListChecks, ShieldCheck, Sparkles, Star, Target, TrendingDown, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";

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

export function AnalyticsModule({ state, discipline, streak, setState }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [openNote, setOpenNote] = useState(null);

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

  const yearBars = useMemo(() => {
    return AR_MONTHS.map((label, m) => {
      const vals = rows(state.history)
        .filter((h) => {
          if (isGap(h)) return false;
          const [y, mm] = String(h.date).split("-").map(Number);
          return y === cursor.y && mm - 1 === m;
        })
        .map((h) => h.pct);
      return {
        label,
        avg: vals.length
          ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          : 0,
        n: vals.length,
      };
    });
  }, [state.history, cursor.y]);

  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="space-y-8">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">التتبع الشهري</h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          كل مربّع يوم من عمرك. الفراغات هي ما ستندم عليه — لا الأخطاء.
        </p>
      </Card>

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

      <WeeklyInsightCard state={state} />

      <TrendChart state={state} discipline={discipline} />

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

      <WeeklyPatternCard state={state} />

      <ConsistencyCard state={state} />

      <Card className="p-6 sm:p-7">
        <h3 className="text-sm font-bold text-white/70">
          متوسط كل شهر في {cursor.y}
        </h3>
        <div className="mt-5 flex h-32 items-end gap-1.5">
          {yearBars.map((b, i) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-full w-full items-end">
                <div
                  title={`${b.label}: ${b.avg}٪ (${b.n} يوم)`}
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(3, b.avg)}%`,
                    background:
                      b.avg >= STREAK_TARGET
                        ? T.primary
                        : b.avg > 0
                        ? T.accent
                        : "rgba(255,255,255,0.06)",
                    opacity: i === cursor.m ? 1 : 0.65,
                  }}
                />
              </div>
              <span className="text-[8.5px] text-white/25">{b.label.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


/* ==================================================================== *
 *  GoalCard
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
 *  WeeklyInsightCard
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
 *  TrendChart — with 4 spans: week / month / 90d / year
 * ==================================================================== */
function TrendChart({ state, discipline }) {
  const [span, setSpan] = useState(7);
  const [hover, setHover] = useState(null);

  const goal = Number.isFinite(state?.goal) ? state.goal : DAILY_GOAL_DEFAULT;

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

  const hovered = hover !== null ? data[hover] : null;

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
          className="w-full block select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
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
                />
              </>
            )}

          {hovered && hovered.pct !== null && (
            <g>
              <line
                x1={xOf(hover)}
                y1={PAD_T}
                x2={xOf(hover)}
                y2={PAD_T + chartH}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={xOf(hover)}
                cy={yOf(hovered.pct)}
                r="6"
                fill={T.accent}
                stroke="rgba(20,14,19,0.95)"
                strokeWidth="2"
              />
            </g>
          )}

          {span <= 7
            ? data.map((d, i) => {
                const x = xOf(i);
                const isToday = i === data.length - 1;
                return (
                  <text
                    key={i}
                    x={x}
                    y={H - 12}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight={isToday ? 800 : 500}
                    fill={isToday ? T.accent : "rgba(255,255,255,0.5)"}
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
                  >
                    {mm}/{dd}
                  </text>
                );
              })}
        </svg>
      </div>

      <div className="mt-3 text-center text-[11.5px] h-5">
        {hovered ? (
          <>
            <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.fg }}>
              {hovered.date}
            </span>
            {" — "}
            {hovered.pct !== null ? (
              <span
                dir="ltr"
                className="font-extrabold tabular-nums"
                style={{
                  fontSize: 14,
                  color: hovered.pct >= goal ? T.primary : T.accent,
                }}
              >
                {hovered.pct}%
              </span>
            ) : (
              <span style={{ color: T.faint }}>لا سجلّ</span>
            )}
          </>
        ) : (
          <span style={{ color: T.faint }}>مرّر على المنحنى لرؤية يوم محدّد</span>
        )}
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
    </Card>
  );
}


/* ==================================================================== *
 *  WeeklyPatternCard
 * ==================================================================== */
function WeeklyPatternCard({ state }) {
  const data = useMemo(() => {
    const recs = rows(state.history).filter(
      (h) => !isGap(h) && Number.isFinite(h.pct),
    );
    if (recs.length < 4) return null;

    const buckets = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
    for (const r of recs) {
      const [y, m, d] = String(r.date).split("-").map(Number);
      if (!y || !m || !d) continue;
      const jsDay = new Date(y, m - 1, d).getDay();
      const idx = (jsDay + 1) % 7;
      buckets[idx].sum += r.pct;
      buckets[idx].n += 1;
    }

    const cells = buckets.map((b, i) => ({
      idx: i,
      avg: b.n ? Math.round(b.sum / b.n) : 0,
      n: b.n,
    }));

    const solid = cells.filter((c) => c.n >= 2);
    if (!solid.length) return { cells, best: null, worst: null };

    const best = solid.reduce((a, b) => (b.avg > a.avg ? b : a));
    const worst = solid.reduce((a, b) => (b.avg < a.avg ? b : a));
    return { cells, best, worst };
  }, [state.history]);

  if (!data) return null;

  const tintFor = (avg, n) => {
    if (!n) return "rgba(255,255,255,0.14)";
    if (avg >= 80) return T.primary;
    if (avg >= 50) return T.accent;
    if (avg > 0) return T.ember;
    return T.danger;
  };

  const showSummary =
    data.best &&
    data.worst &&
    data.best.idx !== data.worst.idx &&
    data.best.avg - data.worst.avg >= 5;

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="flex items-center gap-2 text-[17px] font-extrabold"
            style={{ color: T.sky }}
          >
            <CalendarRange size={17} /> نمط الأسبوع
          </h3>
          <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
            أي يوم من أيام الأسبوع تصمد فيه، وأيّها يسقط منك أولًا.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
        {data.cells.map((c) => {
          const label = WEEK_FULL[c.idx];
          const tint = tintFor(c.avg, c.n);
          const isBest = data.best && data.best.idx === c.idx && c.n >= 2;
          const isWorst = data.worst && data.worst.idx === c.idx && c.n >= 2;
          const barH = c.n ? Math.max(6, c.avg) : 4;

          return (
            <div
              key={c.idx}
              className="flex min-w-0 flex-col items-center gap-1.5"
              title={
                c.n
                  ? `${label} — ${c.avg}٪ متوسط من ${c.n} ${c.n === 1 ? "يوم" : "أيام"}`
                  : `${label} — لا سجلّ بعد`
              }
            >
              <span
                dir="ltr"
                className="text-[11.5px] font-extrabold tabular-nums"
                style={{ color: c.n ? tint : T.faint }}
              >
                {c.n ? `${c.avg}%` : "—"}
              </span>

              <div
                className="relative flex h-20 w-full items-end overflow-hidden rounded-lg border"
                style={{
                  borderColor: isBest
                    ? `${T.primary}80`
                    : isWorst
                    ? `${T.danger}80`
                    : T.border,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  className="w-full rounded-t transition-all duration-700"
                  style={{
                    height: `${barH}%`,
                    background: c.n
                      ? `linear-gradient(180deg, ${tint}CC, ${tint}66)`
                      : "transparent",
                    boxShadow: c.n && c.avg >= 50 ? `0 0 10px ${tint}55` : "none",
                  }}
                />
              </div>

              <span
                className="w-full text-center text-[9px] font-bold leading-tight sm:text-[10.5px]"
                style={{
                  color: isBest ? T.primary : isWorst ? T.danger : T.muted,
                }}
              >
                {label}
              </span>

              {c.n > 0 && (
                <span
                  dir="ltr"
                  className="text-[9px] tabular-nums"
                  style={{ color: T.faint }}
                >
                  ·{c.n}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showSummary && (
        <p
          className="mt-5 rounded-xl border px-3.5 py-3 text-[11.5px] leading-relaxed"
          style={{
            borderColor: `${T.sky}3D`,
            background: `${T.sky}0D`,
            color: T.muted,
          }}
        >
          <strong style={{ color: T.primary }}>
            {WEEK_FULL[data.best.idx]}
          </strong>{" "}
          أقوى أيامك (
          <span dir="ltr" className="tabular-nums">
            {data.best.avg}%
          </span>
          ) ·{" "}
          <strong style={{ color: T.danger }}>
            {WEEK_FULL[data.worst.idx]}
          </strong>{" "}
          أضعفها (
          <span dir="ltr" className="tabular-nums">
            {data.worst.avg}%
          </span>
          ) — راجع ما الذي يختلف في هذا اليوم.
        </p>
      )}
    </Card>
  );
}


/* ==================================================================== *
 *  ConsistencyCard
 * ==================================================================== */
function ConsistencyCard({ state }) {
  const [win, setWin] = useState(30);
  const [openHabit, setOpenHabit] = useState(null);

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
          <p className="mt-4 text-[11px]" style={{ color: T.faint }}>
            محسوب على{" "}
            <span dir="ltr" className="font-bold tabular-nums" style={{ color: T.muted }}>
              {data.days}
            </span>{" "}
            {dayWord(data.days)} بسجلّ مفصّل
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {GROUPS.map((g) => {
              const b = data.blocks.get(g.id);
              if (!b || !b.total) return null;
              const pct = Math.round((b.kept / b.total) * 100);
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className="rounded-xl border px-2 py-2.5 text-center"
                  style={{ borderColor: `${g.tint}3D`, background: `${g.tint}10` }}
                >
                  <Icon size={13} className="mx-auto" style={{ color: g.tint }} />
                  <p
                    dir="ltr"
                    className="mt-1 text-[15px] font-extrabold tabular-nums"
                    style={{ color: g.tint }}
                  >
                    {pct}%
                  </p>
                  <p className="truncate text-[9.5px]" style={{ color: T.faint }}>
                    {g.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-2">
            {data.habits.map((h, i) => {
              const tint = tintFor(h.pct);
              const g = GROUPS.find((x) => x.id === h.group);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setOpenHabit(h)}
                  aria-label={`تفاصيل ${h.label}`}
                  className="block w-full rounded-xl border px-3.5 py-2.5 text-right transition-all duration-200 hover:border-white/30 hover:bg-white/[0.05]"
                  style={{
                    borderColor: i === 0 ? `${T.primary}59` : T.border,
                    background:
                      i === 0 ? `${T.primary}0F` : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-[12.5px] font-bold" style={{ color: T.fg }}>
                      {i === 0 && <span style={{ color: T.accent }}>★ </span>}
                      {h.label}
                    </p>
                    {h.streak > 0 && (
                      <span
                        className="flex shrink-0 items-center gap-0.5 text-[10.5px] font-extrabold tabular-nums"
                        style={{ color: T.ember }}
                        title={`${h.streak} يوم متواصل`}
                      >
                        <Flame size={10} />
                        <span dir="ltr">{h.streak}</span>
                      </span>
                    )}
                    {h.trend !== 0 && (
                      <span
                        className="flex shrink-0 items-center gap-0.5 text-[10.5px] font-extrabold tabular-nums"
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
                    <span
                      dir="ltr"
                      className="shrink-0 text-[10.5px] tabular-nums"
                      style={{ color: T.faint }}
                    >
                      {h.kept}/{h.total}
                    </span>
                    <span
                      dir="ltr"
                      className="w-10 shrink-0 text-left text-[13px] font-extrabold tabular-nums"
                      style={{ color: tint }}
                    >
                      {h.pct}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full"
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
                  {g && (
                    <p className="mt-1 text-[9.5px]" style={{ color: g.tint }}>
                      {g.label}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
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
 *  HabitDrillModal
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
 *  DayRollCall
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