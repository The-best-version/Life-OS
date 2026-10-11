import { AR_MONTHS, Badge, Btn, Card, GROUPS, Modal, T, WEEK_LABELS, arDate, dayWord, daysPhrase, fallWord, timesWord } from "../components/life-shared.jsx";
import { STREAK_TARGET, dayKey, daysBetween, isGap, levelOf, rows } from "../state/life-state.mjs";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Feather, Flame, HeartCrack, Hourglass, ListChecks, ShieldCheck, Star, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";

export function AnalyticsModule({ state, discipline, streak }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [openNote, setOpenNote] = useState(null);

  const byDate = useMemo(() => {
    const map = new Map(
      /* A gap row carries no percentage on purpose — it is a day nobody
         recorded, not a day that scored nothing — so it is kept out of this
         map entirely and answered from `gapDates` below. */
      rows(state.history)
        .filter((h) => !isGap(h))
        .map((h) => [h.date, h.pct]),
    );
    map.set(dayKey(), discipline); // today is live, not yet archived
    return map;
  }, [state.history, discipline]);

  /* The days written down as unrecorded. A square that is grey because the
     app was never opened and a square that is grey because the month has not
     got there yet are two different facts, and a tracker that draws them the
     same way is the one that let two silent days pass unnoticed. */
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
    const lead = (first.getDay() + 1) % 7; // week starts Saturday
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
      /* Counted, never averaged. An unrecorded day folded into the average
         as a zero would punish a day nobody has any record of; left out of
         the count entirely it would flatter a month of four entries. Said
         out loud is the only honest third option. */
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
    <div className="space-y-7">
      <Card className="p-6 sm:p-7">
        <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">التتبع الشهري</h2>
        <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
          كل مربّع يوم من عمرك. الفراغات هي ما ستندم عليه — لا الأخطاء.
        </p>
      </Card>

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

      {/* month grid */}
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
            /* Every recorded day opens, not just the ones carrying a written
               reflection — the roll call is the thing worth going back for. */
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
                  /* Dashed, so an unrecorded day is distinguishable from a
                     day that has not happened yet without needing a colour
                     the sky can wash out. */
                  cell.gap ? "border border-dashed" : "border"
                }`}
                style={{
                  background: cell.gap
                    ? "rgba(255,255,255,0.02)"
                    : LEVEL_BG[levelOf(cell.pct ?? 0)],
                  /* A tracked day and an untracked one must never look the
                     same. A 20% day is a day you showed up for, and at 0.28
                     alpha against a noon sky it read as blank — which is
                     what "nothing is being saved" looked like. */
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

        {/* Said out loud, under the grid it is about. Two silent days in a
            month is the fact that explains a flattering average, and a
            number nobody renders is a number nobody acts on. */}
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
                    {"صمدت "}
                    <span dir="ltr" className="tabular-nums">
                      {openNote.holds}
                    </span>
                    {` ${timesWord(openNote.holds)}`}
                  </Badge>
                )}
                {openNote.falls > 0 && (
                  <Badge tint={T.danger}>
                    <HeartCrack size={10} />
                    <span dir="ltr" className="tabular-nums">
                      {openNote.falls}
                    </span>
                    {` ${fallWord(openNote.falls)}`}
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

      <ConsistencyCard state={state} />

      {/* year overview */}
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


/* Which habits actually hold, across time rather than on one day. A month of
   percentages tells you how you did; this tells you *what* you did, and the
   bottom of the list is where the next percentage point is hiding.
   Only days carrying a recorded roster count — a day that stored a score and
   nothing else cannot say which habit earned it, and guessing would be worse
   than an honest gap. */
function ConsistencyCard({ state }) {
  const [win, setWin] = useState(30);

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

    const habits = [...tally.entries()]
      .map(([id, t]) => ({
        id,
        label: live.get(id)?.label || "عادة لم تعد في روتينك",
        group: live.get(id)?.group || null,
        pct: Math.round((t.kept / t.total) * 100),
        ...t,
      }))
      .sort((a, b) => b.pct - a.pct || b.kept - a.kept);

    return { days: scoped.length, habits, blocks };
  }, [state.history, state.habits, win]);

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
            ليست النسبة، بل ما وراءها: أي عادة تصمد، وأيّها تسقط أولًا.
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

      {!data ? (
        <p
          className="mt-5 rounded-xl border border-dashed py-10 text-center text-[11.5px] leading-relaxed"
          style={{ borderColor: T.border, color: T.faint }}
        >
          لا توجد أيام بسجلّ مفصّل بعد — يبدأ العدّ من اليوم.
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

          {/* which part of the day holds, before which habit holds */}
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
                <div
                  key={h.id}
                  className="rounded-xl border px-3.5 py-2.5"
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
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}


/* What you were actually keeping on a given day, block by block. Labels are
   resolved from the live routine rather than stored per day — a renamed habit
   should read under its current name, and twenty Arabic labels a day would
   cost most of a megabyte a year. A habit since deleted is still shown: it
   was part of that day whether or not it survived to this one. */
export function DayRollCall({ row, state }) {
  const detail = useMemo(() => {
    if (!row || !Array.isArray(row.done)) return null;
    const live = new Map((state.habits || []).map((h) => [h.id, h]));
    const done = new Set(row.done);
    /* The roster recorded that day. Older rows predate it, so they fall back
       to today's routine — flagged, because that comparison is approximate. */
    const exact = Array.isArray(row.all);
    const ids = exact ? row.all : (state.habits || []).map((h) => h.id);
    /* Which of the ticks were carried on the floor. A subset of `done`,
       never a third state: the day counted it fully and so does this list —
       it only says how. */
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

          {/* Where the score came from. "٢٠٪" says nothing about whether the
              morning held and the evening collapsed — and that is the whole
              question when you go back to look at a day. */}
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


/* ==================================================================== *
 *  MODULE 4 — Analytics
 * ==================================================================== */


const LEVEL_BG = [
  "rgba(255,255,255,0.04)",
  "rgba(16,185,129,0.42)",
  "rgba(16,185,129,0.5)",
  "rgba(16,185,129,0.74)",
  "#10B981",
];

