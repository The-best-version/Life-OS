import { Badge, Btn, Card, Checkbox, DateField, Field, Modal, ProgressRing, T, dayWord, useBurst, useUndo } from "./life-shared.jsx";
import { GOAL_YEARS, HORIZONS, PILLARS, QUARTERS, VISION_MAX, WORD_MAX, currentQuarter, daysTo, goalEnd, goalPct, goalShape, horizonOf, openingWindow, parentHorizon, pillarOf, quarterOf, rows, uid, windowOf, windowStand } from "./life-state.mjs";
import { AlertTriangle, Check, Compass, Flag, Gauge, Hourglass, Layers, Lightbulb, Link2, ListChecks, Minus, Plus, SquarePen, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export function GoalsModule({ state, setState }) {
  /* Opens on the ninety days you are actually in — the whole point of
     chunking. The horizons above it are one tap away but never the default.
     Before the arc starts there is no «now» to open on, so it falls to the
     first ninety days of the first year instead: opening on Q4 of a year
     that has not begun, because the wall clock happens to say October, is
     the one window nobody is planning in. */
  const here = new Date().getFullYear();
  const arm = useUndo();
  const [horizon, setHorizon] = useState("quarter");
  const [quarter, setQuarter] = useState(() => openingWindow(state.goals).quarter);
  const [year, setYear] = useState(() => openingWindow(state.goals).year);
  const [deskId, setDeskId] = useState(null);
  const [orphansOnly, setOrphansOnly] = useState(false);

  const all = useMemo(() => (state.goals || []).map(goalShape), [state.goals]);
  const byId = useMemo(() => new Map(all.map((g) => [g.id, g])), [all]);
  const kidsOf = useMemo(() => {
    const m = new Map();
    for (const g of all) {
      if (!g.parent) continue;
      if (!m.has(g.parent)) m.set(g.parent, []);
      m.get(g.parent).push(g);
    }
    return m;
  }, [all]);

  /* The years on offer: the arc, plus any year that still has goals filed in
     it. Without the second half, a year the arc has moved past would keep its
     goals but lose its tab — and a goal you cannot navigate to is gone as far
     as the user is concerned. */
  const years = useMemo(() => {
    const set = new Set(GOAL_YEARS);
    for (const g of all) if (g.horizon !== "h3") set.add(g.year);
    return [...set].sort((a, b) => a - b);
  }, [all]);

  const meta = horizonOf(horizon);
  /* Which window the chosen horizon means. The three-year arc has only one. */
  const inWindow = useCallback(
    (g) =>
      g.horizon !== horizon
        ? false
        : horizon === "quarter"
          ? g.quarter === quarter && g.year === year
          : horizon === "year"
            ? g.year === year
            : true,
    [horizon, quarter, year],
  );

  const scoped = useMemo(() => all.filter(inWindow), [all, inWindow]);
  /* Only below the top horizon: a three-year goal has nothing above it to
     serve, so calling it an orphan would be nonsense. */
  const orphans = useMemo(
    () => scoped.filter((g) => g.horizon !== "h3" && !g.parent),
    [scoped],
  );
  const shown = orphansOnly ? orphans : scoped;

  const done = scoped.filter((g) => g.done).length;
  const pct = scoped.length
    ? Math.round(scoped.reduce((n, g) => n + goalPct(g, all), 0) / scoped.length)
    : 0;

  const live =
    horizon === "quarter"
      ? quarter === currentQuarter() && year === here
      : horizon === "year"
        ? year === here
        : true;

  const windowEnd =
    horizon === "quarter"
      ? goalEnd({ horizon: "quarter", quarter, year, deadline: "" })
      : horizon === "year"
        ? `${year}-12-31`
        : `${GOAL_YEARS[GOAL_YEARS.length - 1]}-12-31`;
  const daysLeft = daysTo(windowEnd);

  const patch = (id, fields) =>
    setState((s) => ({
      ...s,
      goals: (s.goals || []).map((g) =>
        g.id === id ? goalShape({ ...goalShape(g), ...fields }) : g,
      ),
    }));

  const remove = (id) => {
    /* The cut links come back with the list, which is the point of restoring
       the array whole rather than re-inserting the row. */
    arm("حُذف الهدف", { goals: state.goals || [] });
    setState((s) => ({
      ...s,
      /* The children stay — they are the user's own rows, not this goal's
         property. Their link is cut rather than followed, which is also what
         `migrate` would do on the next load; doing it here keeps the screen
         honest without waiting for a reload. */
      goals: (s.goals || [])
        .filter((g) => g.id !== id)
        .map((g) => (g.parent === id ? { ...g, parent: null } : g)),
    }));
  };

  /* A new goal lands in the window on screen and opens straight onto its own
     desk: a goal with no reason, no measure and nothing it serves is the kind
     this screen exists to prevent, so the form that asks for all three is the
     next thing the user sees rather than something to go hunting for. */
  const add = () => {
    const row = goalShape({
      horizon,
      quarter,
      year,
      pillar: shown[0]?.pillar || "faith",
    });
    setState((s) => ({ ...s, goals: [...(s.goals || []), row] }));
    setDeskId(row.id);
  };

  const desk = deskId ? byId.get(deskId) : null;

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
            أهدافي
          </h2>
          <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
            {meta.hint}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn variant="default" size="sm" onClick={add}>
              <Plus size={14} strokeWidth={3} /> هدف جديد
            </Btn>
            <Badge tint={pct === 100 && scoped.length ? T.primary : meta.tint}>
              <span dir="ltr" className="tabular-nums">
                {done}/{scoped.length}
              </span>
              {" مُحقَّق"}
            </Badge>
            {daysLeft !== null && daysLeft > 0 && live && (
              <Badge tint={T.cta}>
                {daysLeft === 1 ? (
                  "بقي يوم واحد"
                ) : daysLeft === 2 ? (
                  "بقي يومان"
                ) : (
                  <>
                    بقي{" "}
                    <span dir="ltr" className="tabular-nums">
                      {daysLeft}
                    </span>{" "}
                    {dayWord(daysLeft)}
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
        <ProgressRing value={pct} size={150} stroke={11} label="تقدّم الأفق" />
      </Card>

      <NorthStarCard
        value={state.northStar}
        onSave={(northStar) => setState((s) => ({ ...s, northStar }))}
      />

      {/* The clock on all three windows at once. Doubles as the horizon
          switcher, so the countdown is not a second control to learn. */}
      <CountdownCard
        all={all}
        year={year}
        quarter={quarter}
        horizon={horizon}
        onPick={(id) => {
          setHorizon(id);
          setOrphansOnly(false);
        }}
      />

      {/* the window inside the horizon */}
      {horizon !== "h3" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {years.map((y) => {
              const on = y === year;
              const list = all.filter((g) => g.horizon === horizon && g.year === y);
              return (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  aria-pressed={on}
                  dir="ltr"
                  className="flex-1 rounded-xl border px-2 py-2 text-[11.5px] font-extrabold tabular-nums transition-all duration-200"
                  style={{
                    borderColor: on ? `${T.accent}80` : T.border,
                    background: on ? `${T.accent}1F` : "rgba(255,255,255,0.03)",
                    color: on ? T.accent : T.faint,
                  }}
                >
                  {y}
                  <span className="mr-1.5 opacity-60">({list.length})</span>
                </button>
              );
            })}
          </div>

          {horizon === "quarter" && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUARTERS.map((q) => {
                const on = q.id === quarter;
                const now = q.id === currentQuarter() && year === here;
                const list = all.filter(
                  (g) => g.horizon === "quarter" && g.quarter === q.id && g.year === year,
                );
                const hit = list.filter((g) => g.done).length;
                return (
                  <button
                    key={q.id}
                    onClick={() => setQuarter(q.id)}
                    aria-pressed={on}
                    className="rounded-2xl border px-3 py-3 text-right transition-all duration-200"
                    style={{
                      borderColor: on ? `${q.tint}80` : T.border,
                      backgroundImage: on
                        ? `linear-gradient(160deg, ${q.tint}2E, ${q.tint}0A)`
                        : "none",
                      backgroundColor: on ? "transparent" : "rgba(255,255,255,0.03)",
                      color: on ? q.tint : T.muted,
                      boxShadow: on ? `0 10px 26px -16px ${q.tint}` : "none",
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-[13px] font-extrabold">
                      {q.label}
                      {now && (
                        <span
                          aria-label="الربع الحالي"
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: T.cta, boxShadow: `0 0 8px ${T.cta}` }}
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[10px]" style={{ color: T.faint }}>
                      {q.months}
                    </span>
                    <span
                      className="mt-1 block text-[10.5px] font-bold tabular-nums"
                      dir="ltr"
                      style={{ color: on ? q.tint : T.faint }}
                    >
                      {hit}/{list.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Every goal below the top horizon should answer to one above it.
          Saying so once, with a way to see exactly which ones do not, is the
          whole discipline this screen adds over a flat list. */}
      {orphans.length > 0 && (
        <button
          onClick={() => setOrphansOnly((v) => !v)}
          aria-pressed={orphansOnly}
          className="flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3 text-right transition-all duration-200"
          style={{
            borderColor: orphansOnly ? `${T.cta}80` : `${T.accent}4D`,
            background: orphansOnly ? `${T.cta}1A` : `${T.accent}12`,
          }}
        >
          <AlertTriangle size={15} className="shrink-0" style={{ color: orphansOnly ? T.cta : T.accent }} />
          <span className="min-w-0 flex-1 text-[12px] font-bold leading-relaxed" style={{ color: orphansOnly ? T.ctaLift : T.accent }}>
            <span dir="ltr" className="tabular-nums">
              {orphans.length}
            </span>{" "}
            من أهداف هذه النافذة لا تخدم هدفًا أعلى.
            <span className="block text-[10.5px] font-normal" style={{ color: T.muted }}>
              {orphansOnly ? "اضغط لعرض الكل" : "اضغط لعرضها وحدها"}
            </span>
          </span>
        </button>
      )}

      {/* by pillar */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {PILLARS.map((p) => {
          const list = shown.filter((g) => g.pillar === p.id);
          const hit = list.filter((g) => g.done).length;
          const complete = list.length > 0 && hit === list.length;
          const Icon = p.icon;
          const avg = list.length
            ? Math.round(list.reduce((n, g) => n + goalPct(g, all), 0) / list.length)
            : 0;
          return (
            <Card key={p.id} className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: complete ? `${T.primary}59` : `${p.tint}45`,
                    background: complete ? `${T.primary}1A` : `${p.tint}18`,
                    color: complete ? T.primary : p.tint,
                  }}
                >
                  <Icon size={18} strokeWidth={1.9} />
                </span>
                <h3 className="text-[15px] font-bold">{p.label}</h3>
                <span className="mr-auto text-[11px] tabular-nums text-white/30">
                  <span dir="ltr">
                    {hit}/{list.length}
                  </span>
                </span>
              </div>

              <div
                className="mt-3.5 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${avg}%`,
                    backgroundImage: complete
                      ? `linear-gradient(90deg, ${T.primary}, ${T.primaryLift})`
                      : `linear-gradient(90deg, ${p.tint}, ${p.tint}AA)`,
                    boxShadow: avg ? `0 0 12px ${complete ? T.primary : p.tint}99` : "none",
                  }}
                />
              </div>

              <div className="mt-3 space-y-2">
                {list.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-white/25">
                    {orphansOnly
                      ? "لا أهداف معلّقة في هذه الركيزة"
                      : "لا أهداف في هذه الركيزة بعد"}
                  </p>
                ) : (
                  list.map((g) => (
                    <GoalCard
                      key={g.id}
                      goal={g}
                      all={all}
                      parent={g.parent ? byId.get(g.parent) : null}
                      kids={kidsOf.get(g.id) || []}
                      onToggle={() => patch(g.id, { done: !g.done })}
                      onStep={
                        g.target > 0
                          ? (n) =>
                              patch(g.id, {
                                current: Math.max(
                                  0,
                                  Math.min(g.target, g.current + n),
                                ),
                              })
                          : null
                      }
                      onOpen={() => setDeskId(g.id)}
                    />
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <GoalDesk
        goal={desk}
        all={all}
        onClose={() => setDeskId(null)}
        onPatch={(fields) => patch(deskId, fields)}
        onDelete={() => {
          remove(deskId);
          setDeskId(null);
        }}
      />
    </div>
  );
}


/* --- the desk --------------------------------------------------------- *
 *  Everything a goal is, in one place: the horizon, the window, the reason,
 *  the meter, the milestones, the deadline and the goal it serves. Edits are
 *  applied live through `onPatch` rather than held in a draft and saved at
 *  the end — the same way the book and course desks work, so closing the
 *  sheet can never be the thing that loses a milestone.
 * ---------------------------------------------------------------------- */
function GoalDesk({ goal, all, onClose, onPatch, onDelete }) {
  const [step, setStep] = useState("");
  /* Every hook runs before the early return, without exception. This sheet is
     rendered with `goal === null` whenever it is shut, so a `useMemo` placed
     after the guard would run on open and not on close — which is React
     error #310 and a blank screen, not a warning. */
  const below = useMemo(() => {
    const out = new Set();
    if (!goal) return out;
    const walk = (id, depth) => {
      if (depth > HORIZONS.length) return;
      for (const g of all)
        if (g.parent === id && !out.has(g.id)) {
          out.add(g.id);
          walk(g.id, depth + 1);
        }
    };
    walk(goal.id, 0);
    return out;
  }, [all, goal]);

  if (!goal) return null;

  const h = horizonOf(goal.horizon);
  const p = pillarOf(goal.pillar);
  const pct = goalPct(goal, all);
  const want = parentHorizon(goal.horizon);
  const kids = all.filter((g) => g.parent === goal.id);
  /* The goal's own year is always offered, even once the arc has moved past
     it — otherwise the desk would show no year selected at all and the first
     tap would move the goal somewhere the user never asked for. */
  const deskYears = [...new Set([...GOAL_YEARS, goal.year])].sort((a, b) => a - b);
  /* Only goals one horizon up may be a parent, and never one already below
     this goal in the chain — that is the loop `migrate` has to repair, and it
     is cheaper to make it unreachable in the picker than to repair it later. */
  const options = want
    ? all.filter((g) => g.horizon === want && g.id !== goal.id && !below.has(g.id))
    : [];

  const addStep = () => {
    const text = step.trim();
    if (!text) return;
    onPatch({ steps: [...goal.steps, { id: uid(), text, done: false }] });
    setStep("");
  };

  const label = "mb-1.5 block text-xs";

  return (
    <Modal open={!!goal} onClose={onClose} title="مكتب الهدف" wide>
      <div className="space-y-5">
        <div>
          <label htmlFor="los-gd-text" className={label} style={{ color: T.muted }}>
            الهدف
          </label>
          <Field
            id="los-gd-text"
            value={goal.text}
            onChange={(e) => onPatch({ text: e.target.value })}
            placeholder="مثال: ختم القرآن تدبّرًا مرّتين"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold"
            style={{ background: `${h.tint}1A`, color: h.tint }}
          >
            <h.icon size={12} /> {h.label}
          </span>
          <span
            dir="ltr"
            className="rounded-lg px-2 py-1 text-[12px] font-extrabold tabular-nums"
            style={{
              background: pct >= 100 ? `${T.primary}1A` : "rgba(255,255,255,0.05)",
              color: pct >= 100 ? T.primary : T.muted,
            }}
          >
            {pct}%
          </span>
          <DeadlineChip day={goalEnd(goal)} done={goal.done} />
          <Btn
            variant={goal.done ? "default" : "outline"}
            size="sm"
            className="mr-auto"
            onClick={() => onPatch({ done: !goal.done })}
          >
            <Check size={13} strokeWidth={3} />
            {goal.done ? "مُحقَّق" : "علّمه مُحقَّقًا"}
          </Btn>
        </div>

        {/* why */}
        <div>
          <label htmlFor="los-gd-why" className={label} style={{ color: T.muted }}>
            لماذا هذا الهدف؟
          </label>
          <Field
            as="textarea"
            id="los-gd-why"
            rows={2}
            value={goal.why}
            onChange={(e) => onPatch({ why: e.target.value.slice(0, 400) })}
            placeholder="السبب الذي يحملك عليه في الشهر السابع، لا في الأول."
            className="resize-none leading-relaxed"
          />
        </div>

        {/* the window */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className={label} style={{ color: T.muted }}>
              الأفق
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {HORIZONS.map((x) => {
                const on = x.id === goal.horizon;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() =>
                      /* Changing horizon invalidates the parent: a 90-day goal
                         promoted to a yearly one cannot still serve the yearly
                         goal it used to. Cutting it here is what keeps the
                         chain legal without a repair pass. */
                      on
                        ? undefined
                        : onPatch({ horizon: x.id, parent: null })
                    }
                    aria-pressed={on}
                    className="rounded-xl border px-2 py-2 text-[10.5px] font-bold transition-all"
                    style={{
                      borderColor: on ? `${x.tint}80` : T.border,
                      background: on ? `${x.tint}1F` : "rgba(255,255,255,0.03)",
                      color: on ? x.tint : T.muted,
                    }}
                  >
                    {x.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className={label} style={{ color: T.muted }}>
              {goal.horizon === "quarter" ? "الربع والسنة" : "السنة"}
            </span>
            <div className="flex gap-1.5">
              {goal.horizon === "quarter" &&
                QUARTERS.map((q) => {
                  const on = q.id === goal.quarter;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onPatch({ quarter: q.id })}
                      aria-pressed={on}
                      className="flex-1 rounded-xl border py-2 text-[10.5px] font-bold transition-all"
                      style={{
                        borderColor: on ? `${q.tint}80` : T.border,
                        background: on ? `${q.tint}1F` : "rgba(255,255,255,0.03)",
                        color: on ? q.tint : T.muted,
                      }}
                      title={q.months}
                    >
                      {q.id.toUpperCase()}
                    </button>
                  );
                })}
              {goal.horizon !== "h3" &&
                deskYears.map((y) => {
                  const on = y === goal.year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => onPatch({ year: y })}
                      aria-pressed={on}
                      dir="ltr"
                      className="flex-1 rounded-xl border py-2 text-[10.5px] font-bold tabular-nums transition-all"
                      style={{
                        borderColor: on ? `${T.accent}80` : T.border,
                        background: on ? `${T.accent}1F` : "rgba(255,255,255,0.03)",
                        color: on ? T.accent : T.muted,
                      }}
                    >
                      {y}
                    </button>
                  );
                })}
              {goal.horizon === "h3" && (
                <p
                  className="flex-1 rounded-xl border px-3 py-2 text-center text-[10.5px] font-bold"
                  style={{ borderColor: T.border, color: T.faint }}
                >
                  {ARC_LABEL}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* pillar */}
        <div>
          <span className={label} style={{ color: T.muted }}>
            الركيزة
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PILLARS.map((x) => {
              const on = x.id === goal.pillar;
              const XIcon = x.icon;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => onPatch({ pillar: x.id })}
                  aria-pressed={on}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all"
                  style={{
                    borderColor: on ? `${x.tint}80` : T.border,
                    background: on ? `${x.tint}1F` : "rgba(255,255,255,0.03)",
                    color: on ? x.tint : T.muted,
                  }}
                >
                  <XIcon size={14} strokeWidth={2} />
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* the chain */}
        {want && (
          <div>
            <label htmlFor="los-gd-parent" className={label} style={{ color: T.muted }}>
              يخدم هدف «{horizonOf(want).label}»
            </label>
            <select
              id="los-gd-parent"
              value={goal.parent || ""}
              onChange={(e) => onPatch({ parent: e.target.value || null })}
              className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30"
              style={{ borderColor: T.border, color: T.muted }}
            >
              <option value="" style={{ background: T.cardSolid }}>
                — لا يخدم شيئًا بعد —
              </option>
              {options.map((g) => (
                <option key={g.id} value={g.id} style={{ background: T.cardSolid }}>
                  {g.text}
                </option>
              ))}
            </select>
            {options.length === 0 && (
              <p className="mt-1.5 text-[10.5px]" style={{ color: T.accent }}>
                لا أهداف في أفق «{horizonOf(want).label}» بعد — أضف واحدًا أولًا
                ليصبح لهذا الهدف ما يخدمه.
              </p>
            )}
          </div>
        )}

        {/* the meter */}
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.sky }}>
            <Gauge size={14} /> القياس
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            هدف بلا رقم لا يُقاس. اتركه صفرًا إن كان هدفًا بنعم أو لا — حينها
            تقيسه خطواته أو الأهداف التي تخدمه.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="los-gd-target" className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                الهدف الرقمي
              </label>
              <Field
                id="los-gd-target"
                type="number"
                min="0"
                dir="ltr"
                value={goal.target || ""}
                onChange={(e) => {
                  const target = Math.max(0, Math.round(+e.target.value) || 0);
                  onPatch({
                    target,
                    current: target > 0 ? Math.min(target, goal.current) : goal.current,
                  });
                }}
                placeholder="0"
                className="tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="los-gd-current" className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                المُحقَّق
              </label>
              <Field
                id="los-gd-current"
                type="number"
                min="0"
                dir="ltr"
                value={goal.current || ""}
                onChange={(e) => {
                  const n = Math.max(0, Math.round(+e.target.value) || 0);
                  onPatch({ current: goal.target > 0 ? Math.min(goal.target, n) : n });
                }}
                placeholder="0"
                className="tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="los-gd-unit" className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                الوحدة
              </label>
              <Field
                id="los-gd-unit"
                maxLength={16}
                value={goal.unit}
                onChange={(e) => onPatch({ unit: e.target.value })}
                placeholder="كتاب"
              />
            </div>
            <div>
              <label htmlFor="los-gd-step" className="mb-1 block text-[10px]" style={{ color: T.faint }}>
                مقدار الخطوة
              </label>
              <Field
                id="los-gd-step"
                type="number"
                min="1"
                dir="ltr"
                value={goal.step}
                onChange={(e) =>
                  onPatch({ step: Math.max(1, Math.round(+e.target.value) || 1) })
                }
                className="tabular-nums"
              />
            </div>
          </div>
          {goal.target > 0 && (
            <div className="mt-3.5">
              <GoalMeter
                goal={goal}
                pct={pct}
                tint={p.tint}
                onStep={(n) =>
                  onPatch({
                    current: Math.max(0, Math.min(goal.target, goal.current + n)),
                  })
                }
              />
            </div>
          )}
        </div>

        {/* deadline */}
        <div>
          <label htmlFor="los-gd-deadline" className={label} style={{ color: T.muted }}>
            موعد نهائي <span style={{ color: T.faint }}>(اختياري)</span>
          </label>
          <div className="flex items-center gap-2">
            <DateField
              id="los-gd-deadline"
              value={goal.deadline}
              onChange={(v) => onPatch({ deadline: v })}
            />
            {goal.deadline && (
              <Btn variant="ghost" size="sm" onClick={() => onPatch({ deadline: "" })} style={{ borderColor: T.border }}>
                <X size={13} /> امسح
              </Btn>
            )}
          </div>
          <p className="mt-1.5 text-[10.5px]" style={{ color: T.faint }}>
            بلا موعد، ينتهي الهدف مع نهاية نافذته:{" "}
            <span dir="ltr">{goalEnd(goal)}</span>.
          </p>
        </div>

        {/* milestones */}
        <div>
          <span className={label} style={{ color: T.muted }}>
            الخطوات — ما الذي يجعله يتحرّك؟
          </span>
          <div className="space-y-1">
            {goal.steps.length === 0 ? (
              <p className="py-2 text-[11px]" style={{ color: T.faint }}>
                لا خطوات بعد. أول خطوة صغيرة تكفي لبدء الحركة.
              </p>
            ) : (
              goal.steps.map((s, i) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-1 rounded-lg border transition-all"
                  style={{
                    borderColor: "transparent",
                    background: s.done ? `${T.primary}0F` : "transparent",
                  }}
                >
                  <Checkbox
                    checked={s.done}
                    onToggle={() =>
                      onPatch({
                        steps: goal.steps.map((x) =>
                          x.id === s.id ? { ...x, done: !x.done } : x,
                        ),
                      })
                    }
                    label={s.text}
                    tint={T.primary}
                    size="sm"
                  />
                  <button
                    onClick={() =>
                      onPatch({
                        steps: goal.steps.filter((x) => x.id !== s.id),
                      })
                    }
                    aria-label={`حذف ${s.text}`}
                    className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="sr-only">خطوة {i + 1}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Field
              value={step}
              onChange={(e) => setStep(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStep()}
              placeholder="خطوة جديدة"
              className="flex-1"
            />
            <Btn variant="default" size="sm" onClick={addStep} className="shrink-0">
              <Plus size={13} strokeWidth={3} /> أضف
            </Btn>
          </div>
        </div>

        {/* what it carries */}
        {kids.length > 0 && (
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${T.sky}3D`, background: `${T.sky}0F` }}
          >
            <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.sky }}>
              <Layers size={14} /> ما يخدم هذا الهدف
            </p>
            <div className="mt-2.5 space-y-1.5">
              {kids.map((k) => {
                const kp = goalPct(k, all);
                return (
                  <div key={k.id} className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: k.done ? T.primary : pillarOf(k.pillar).tint }}
                    />
                    <span
                      className="min-w-0 flex-1 truncate text-[11.5px]"
                      style={{
                        color: k.done ? T.muted : T.fg,
                        textDecorationLine: k.done ? "line-through" : "none",
                      }}
                    >
                      {k.text}
                    </span>
                    <span
                      dir="ltr"
                      className="shrink-0 text-[10.5px] font-bold tabular-nums"
                      style={{ color: kp >= 100 ? T.primary : T.faint }}
                    >
                      {kp}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Btn
          variant="danger"
          size="sm"
          className="w-full"
          onClick={() => {
            if (
              window.confirm(
                kids.length
                  ? `حذف «${goal.text}»؟ ${kids.length} هدفًا يخدمه ستبقى لكن بلا ارتباط.`
                  : `حذف «${goal.text}»؟`,
              )
            )
              onDelete();
          }}
        >
          <Trash2 size={13} /> احذف الهدف
        </Btn>
      </div>
    </Modal>
  );
}


function GoalCard({ goal, all, parent, kids, onToggle, onStep, onOpen }) {
  const [burst, fireBurst] = useBurst(700);
  const p = pillarOf(goal.pillar);
  const pct = goalPct(goal, all);
  const ripe = pct >= 100 && !goal.done;
  const Icon = p.icon;
  const childLabel = horizonOf(goal.horizon).child;
  const kidsDone = kids.filter((k) => k.done).length;

  const handle = () => {
    if (!goal.done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`rounded-2xl border p-3.5 transition-all duration-200${
        burst ? " los-reward" : ""
      }`}
      style={{
        borderColor: burst
          ? T.primary
          : goal.done
            ? `${T.primary}4D`
            : ripe
              ? `${T.accent}4D`
              : T.border,
        backgroundColor: goal.done
          ? `${T.primary}0F`
          : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-start gap-1">
        <Checkbox
          checked={goal.done}
          onToggle={handle}
          label={goal.text}
          tint={T.primary}
          size="sm"
        />
        <button
          onClick={onOpen}
          aria-label={`مكتب ${goal.text}`}
          title="افتح المكتب"
          className="shrink-0 rounded p-1.5 transition-all hover:scale-110"
          style={{ color: p.tint }}
        >
          <SquarePen size={13} />
        </button>
      </div>

      <div className="mt-2.5">
        <GoalMeter goal={goal} pct={pct} tint={p.tint} onStep={onStep} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
          style={{ background: `${p.tint}1A`, color: p.tint }}
        >
          <Icon size={9} />
          {p.label}
        </span>
        <span
          dir="ltr"
          className="shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold tabular-nums"
          style={{
            background: pct >= 100 ? `${T.primary}1A` : "rgba(255,255,255,0.05)",
            color: pct >= 100 ? T.primary : T.muted,
          }}
        >
          {pct}%
        </span>
        <DeadlineChip day={goalEnd(goal)} done={goal.done} />
        {goal.steps.length > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px]"
            style={{ background: "rgba(255,255,255,0.05)", color: T.faint }}
          >
            <ListChecks size={9} />
            <span dir="ltr" className="tabular-nums">
              {goal.steps.filter((s) => s.done).length}/{goal.steps.length}
            </span>
          </span>
        )}
        {kids.length > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px]"
            style={{ background: `${T.sky}14`, color: T.sky }}
            title={`${childLabel || "هدف"} يخدم هذا الهدف`}
          >
            <Layers size={9} />
            <span dir="ltr" className="tabular-nums">
              {kidsDone}/{kids.length}
            </span>
          </span>
        )}
        {goal.why.trim() && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px]"
            style={{ background: `${T.violet}14`, color: T.violet }}
            title={goal.why}
          >
            <Lightbulb size={9} /> لماذا
          </span>
        )}
      </div>

      {/* The one line the chain is for: what this goal is in service of. */}
      {parent ? (
        <p
          className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed"
          style={{ color: T.faint }}
        >
          <Link2 size={10} className="mt-0.5 shrink-0" style={{ color: T.sky }} />
          <span>
            يخدم:{" "}
            <span style={{ color: T.muted }}>{parent.text}</span>
          </span>
        </p>
      ) : (
        goal.horizon !== "h3" && (
          <p
            className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed"
            style={{ color: `${T.accent}B3` }}
          >
            <AlertTriangle size={10} className="mt-0.5 shrink-0" />
            <span>لا يخدم هدفًا أعلى — اربطه من المكتب.</span>
          </p>
        )
      )}

      {ripe && (
        <p
          className="los-in mt-2 flex items-center gap-1.5 text-[10px] font-bold"
          style={{ color: T.accent }}
        >
          <Check size={11} strokeWidth={3} /> اكتمل القياس — علّمه مُحقَّقًا
        </p>
      )}
    </div>
  );
}


/* One horizon, as a row. The row is what fixed the design: three tall tiles
   left most of their height empty and the numbers floating in it, which is
   what reads as unfinished no matter how the type is set. */
export function HorizonRow({ clock, h, compact = false, on = false, as = "div", ...rest }) {
  const Tag = as;
  const label = clock.label;
  const dead = clock.state === "done";
  return (
    <Tag
      className={`relative block w-full overflow-hidden rounded-xl border text-right transition-all duration-200${
        as === "button" ? " hover:brightness-110" : ""
      }`}
      style={{
        borderColor: on ? `${h.tint}80` : `${h.tint}2E`,
        backgroundColor: on ? "transparent" : "rgba(255,255,255,0.025)",
        backgroundImage: on
          ? `linear-gradient(160deg, ${h.tint}24, ${h.tint}08)`
          : "none",
        boxShadow: on ? `0 10px 26px -18px ${h.tint}` : "none",
        opacity: dead ? 0.55 : 1,
        padding: compact ? "11px 13px 11px 13px" : "14px 16px",
      }}
      {...rest}
    >
      {/* the accent edge, on the reading-start side — the same rule the
          project's own report charts are drawn with */}
      <span
        aria-hidden="true"
        className="absolute block rounded-full"
        style={{
          right: 0,
          top: compact ? 11 : 14,
          bottom: compact ? 11 : 14,
          width: 3,
          background: h.tint,
          boxShadow: `0 0 10px ${h.tint}99`,
        }}
      />

      {/* Three columns — name, track, count — rather than two blocks pinned
          to the edges. Pinned, the middle of a wide row is simply empty, and
          an empty middle is what reads as unfinished however the type is set.
          The order flips on a phone: name and count share the first line and
          the track takes the second, which is the only way the track stays
          wide enough to read at 375px. */}
      <span className="flex flex-wrap items-center gap-x-4 gap-y-2.5 pr-3">
        <span
          className={`order-1 block min-w-0 flex-1 sm:flex-none ${
            compact ? "sm:w-[108px]" : "sm:w-[132px]"
          }`}
        >
          <span
            className={`flex items-center gap-1.5 font-extrabold ${
              compact ? "text-[11.5px]" : "text-[13px]"
            }`}
            style={{ color: h.tint }}
          >
            <h.icon size={compact ? 12 : 14} strokeWidth={2.2} />
            <span className="truncate">{h.short}</span>
          </span>
          <span
            className={`mt-0.5 block truncate ${compact ? "text-[9.5px]" : "text-[10.5px]"}`}
            dir="auto"
            style={{ color: T.faint }}
          >
            {label}
          </span>
        </span>

        <span className="order-3 block w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1">
          <PaceTrack clock={clock} tint={h.tint} compact={compact} />
          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              className={`flex items-center gap-2 ${compact ? "text-[9px]" : "text-[10px]"}`}
              style={{ color: T.faint }}
            >
              <span>
                مضى{" "}
                <span dir="ltr" className="tabular-nums" style={{ color: T.muted }}>
                  {clock.pct}%
                </span>
              </span>
              <span aria-hidden="true" style={{ opacity: 0.35 }}>
                ·
              </span>
              <span>
                أُنجز{" "}
                <span dir="ltr" className="tabular-nums" style={{ color: h.tint }}>
                  {clock.hit}%
                </span>
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold ${
                compact ? "text-[9px]" : "text-[9.5px]"
              }`}
              style={{
                background:
                  clock.goals && clock.done === clock.goals
                    ? `${T.primary}1A`
                    : "rgba(255,255,255,0.05)",
                color: clock.goals && clock.done === clock.goals ? T.primary : T.muted,
              }}
            >
              <Flag size={9} />
              <span dir="ltr" className="tabular-nums">
                {clock.done}/{clock.goals}
              </span>
            </span>
            {clock.pace && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold ${
                  compact ? "text-[9px]" : "text-[9.5px]"
                }`}
                style={{ background: `${clock.pace.tint}1A`, color: clock.pace.tint }}
              >
                {clock.drift >= DRIFT_BAND ? (
                  <TrendingUp size={9} />
                ) : clock.drift <= -DRIFT_BAND ? (
                  <TrendingDown size={9} />
                ) : (
                  <Check size={9} strokeWidth={3} />
                )}
                {clock.pace.label}
              </span>
            )}
          </span>
        </span>

        <span
          className={`order-2 block shrink-0 text-left sm:order-3 ${
            compact ? "sm:w-[72px]" : "sm:w-[88px]"
          }`}
        >
          {dead ? (
            <span
              className={`block font-extrabold ${compact ? "text-[12px]" : "text-[14px]"}`}
              style={{ color: T.faint }}
            >
              انتهت
            </span>
          ) : (
            <>
              <span className="flex items-baseline justify-start gap-1 leading-none">
                <span
                  dir="ltr"
                  className={`font-extrabold tabular-nums ${
                    compact ? "text-[23px]" : "text-[28px]"
                  }`}
                  style={{ color: h.tint, letterSpacing: "-0.02em" }}
                >
                  {clock.left}
                </span>
                <span
                  className={`font-bold ${compact ? "text-[10px]" : "text-[11px]"}`}
                  style={{ color: T.muted }}
                >
                  {dayWord(clock.left)}
                </span>
              </span>
              {clock.state === "soon" && (
                <span
                  className="mt-0.5 block text-[9px] font-bold"
                  style={{ color: T.faint }}
                >
                  يبدأ بعد{" "}
                  <span dir="ltr" className="tabular-nums">
                    {clock.until}
                  </span>{" "}
                  {dayWord(clock.until)}
                </span>
              )}
            </>
          )}
        </span>
      </span>
    </Tag>
  );
}


/* The horizon a goal's parent must belong to. The top of the chain has none,
   which is also how the editor knows to hide the parent picker. */
const ARC_LABEL = "٢٠٢٧ — ٢٠٢٩";



/* The full card, for the goals screen. Each row also switches the horizon,
   so the countdown is not a second control to learn beside the tabs. */
function CountdownCard({ all, year, quarter, horizon, onPick }) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="min-w-0">
        <h3
          className="flex items-center gap-2 text-[16px] font-extrabold"
          style={{ color: T.ctaLift }}
        >
          <Hourglass size={16} /> العدّ التنازلي
        </h3>
        <p className="mt-1.5 max-w-2xl text-[11.5px] leading-relaxed" style={{ color: T.faint }}>
          الشريط الملوّن ما أُنجز من أهداف النافذة، والعلامة البيضاء واقفة عند
          اليوم الذي أنت فيه. إن سبقتِ العلامةُ الشريطَ فأنت متأخّر — وهذا هو
          الرقم الذي يستحقّ النظر.
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        {HORIZONS.map((h) => {
          const clock = horizonClock(h.id, all, year, quarter);
          return (
            <HorizonRow
              key={h.id}
              as="button"
              h={h}
              clock={{ ...clock, label: clockLabel(h.id, year, quarter) }}
              on={h.id === horizon}
              onClick={() => onPick(h.id)}
              aria-pressed={h.id === horizon}
            />
          );
        })}
      </div>
    </Card>
  );
}


/* ==================================================================== *
 *  MODULE — goals across three horizons
 *
 *  A 90-day goal that serves nothing is a chore with a deadline. The screen
 *  is built around the chain rather than around a flat list: three years, the
 *  year, and the ninety days you are in — each row knowing the one above it
 *  that it serves and the ones below it that carry it.
 *
 *  The card is a glance and the desk is where the work happens, the same
 *  split the library and the university desk already use. A goal's reason,
 *  its meter, its milestones and its deadline all live on the desk; the card
 *  shows only what you scan for.
 * ==================================================================== */

/* --- the horizon clock ------------------------------------------------ *
 *  How much of a window has gone, beside how much of its goals have. The
 *  first number alone is a countdown and decoration; the two together are
 *  the only thing that can tell you that you are behind, which is the one
 *  fact a planner exists to surface while there is still time to act on it.
 * ---------------------------------------------------------------------- */
const DRIFT_BAND = 10; // inside ten points of the clock still counts as on pace


/* «بقي ١٢ يومًا», «اليوم آخر يوم», «فات موعده قبل ٣ أيام». A window that has
   closed has to say so — a goal silently sitting past its deadline is the
   one state a planner must never render as normal. */
function DeadlineChip({ day, done }) {
  const left = daysTo(day);
  if (left === null) return null;
  const over = left < 0;
  const tint = done
    ? T.primary
    : over
      ? T.danger
      : left <= 7
        ? T.cta
        : left <= 30
          ? T.accent
          : T.faint;
  const n = Math.abs(over ? left : left);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
      style={{ background: `${tint}1A`, color: tint }}
      title={day}
    >
      <Hourglass size={9} />
      {left === 0 ? (
        "اليوم آخر يوم"
      ) : over ? (
        <>
          فات قبل{" "}
          <span dir="ltr" className="tabular-nums">
            {n}
          </span>{" "}
          {dayWord(n)}
        </>
      ) : (
        <>
          بقي{" "}
          <span dir="ltr" className="tabular-nums">
            {n}
          </span>{" "}
          {dayWord(n)}
        </>
      )}
    </span>
  );
}


/* A compact meter row. Used on the card and again on the desk, so the two
   can never show a different number for the same goal. */
function GoalMeter({ goal, pct, tint, onStep }) {
  const has = goal.target > 0;
  const full = pct >= 100;
  const bar = full ? T.primary : tint;
  return (
    <div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, pct)}%`,
            backgroundImage: `linear-gradient(90deg, ${bar}, ${bar}AA)`,
            boxShadow: pct ? `0 0 12px ${bar}99` : "none",
          }}
        />
      </div>
      {has && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span dir="ltr" className="text-[11px] tabular-nums" style={{ color: T.faint }}>
            {goal.current} / {goal.target}
            {goal.unit ? ` ${goal.unit}` : ""}
          </span>
          {onStep && (
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onStep(-goal.step)}
                disabled={goal.current <= 0}
                aria-label={`أنقص ${goal.text}`}
                className="flex h-6 w-6 items-center justify-center rounded-md border transition-all active:scale-90 disabled:opacity-25"
                style={{ borderColor: T.border, color: T.muted }}
              >
                <Minus size={11} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => onStep(goal.step)}
                disabled={goal.current >= goal.target}
                aria-label={`زد ${goal.text}`}
                className="flex h-6 w-6 items-center justify-center rounded-md border transition-all active:scale-90 disabled:opacity-25"
                style={{ borderColor: `${tint}4D`, color: tint }}
              >
                <Plus size={11} strokeWidth={3} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}


/* The word and the vision. Above every goal on the screen, because it is
   what the goals are for — eighteen targets with no sentence saying who they
   are building is a list abandoned in March. */
function NorthStarCard({ value, onSave }) {
  const [draft, setDraft] = useState(null); // null = reading, object = editing
  const star = value || { word: "", vision: "" };
  const empty = !star.word.trim() && !star.vision.trim();

  const commit = () => {
    onSave({
      word: draft.word.trim().slice(0, WORD_MAX),
      vision: draft.vision.trim().slice(0, VISION_MAX),
    });
    setDraft(null);
  };

  return (
    <Card className="relative overflow-hidden p-6 sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ background: T.violet }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <h3
          className="flex items-center gap-2 text-[16px] font-extrabold"
          style={{ color: T.accent }}
        >
          <Compass size={17} /> كلمة سنتي ورؤيتي
        </h3>
        <Btn
          variant="ghost"
          size="sm"
          onClick={() =>
            setDraft(draft ? null : { word: star.word, vision: star.vision })
          }
          style={{ borderColor: T.border }}
        >
          {draft ? <X size={13} /> : <SquarePen size={13} />}
          {draft ? "إلغاء" : empty ? "اكتبها" : "تعديل"}
        </Btn>
      </div>

      {draft ? (
        <div className="los-in relative mt-4 space-y-3.5">
          <div>
            <label
              htmlFor="los-ns-word"
              className="mb-1.5 block text-xs"
              style={{ color: T.muted }}
            >
              كلمة واحدة تحكم السنة
            </label>
            <Field
              id="los-ns-word"
              autoFocus
              maxLength={WORD_MAX}
              value={draft.word}
              onChange={(e) => setDraft((d) => ({ ...d, word: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              placeholder="مثال: إتقان"
            />
          </div>
          <div>
            <label
              htmlFor="los-ns-vision"
              className="mb-1.5 block text-xs"
              style={{ color: T.muted }}
            >
              الرؤية — من تريد أن تكون في نهاية {ARC_LABEL}؟
            </label>
            <Field
              as="textarea"
              id="los-ns-vision"
              rows={4}
              maxLength={VISION_MAX}
              value={draft.vision}
              onChange={(e) =>
                setDraft((d) => ({ ...d, vision: e.target.value }))
              }
              placeholder="اكتبها بصيغة الحاضر، كأنها قد تحقّقت: «أنا رجل يقوم لصلاته، يقرأ كل يوم، ويعمل فيما يحبّ…»"
              className="resize-none leading-relaxed"
            />
            <p className="mt-1 text-left text-[10px] tabular-nums" dir="ltr" style={{ color: T.faint }}>
              {draft.vision.length}/{VISION_MAX}
            </p>
          </div>
          <Btn variant="default" size="sm" onClick={commit}>
            <Check size={13} strokeWidth={3} /> احفظ
          </Btn>
        </div>
      ) : empty ? (
        <p
          className="relative mt-4 text-[12.5px] leading-relaxed"
          style={{ color: T.faint }}
        >
          لم تكتب كلمتك بعد. كلمة واحدة وسطرٌ عن الرجل الذي تبنيه — هي ما
          يُبقيك على الأهداف حين يفتر الحافز.
        </p>
      ) : (
        <div className="relative mt-4">
          {star.word.trim() && (
            <p
              className="los-title text-3xl font-extrabold leading-tight sm:text-4xl"
              style={{ wordBreak: "break-word" }}
            >
              {star.word}
            </p>
          )}
          {star.vision.trim() && (
            <p
              className="mt-3 max-w-2xl whitespace-pre-line text-[13px] leading-relaxed"
              style={{ color: T.muted }}
            >
              {star.vision}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}


/* --- the pace track --------------------------------------------------- *
 *  One track, not two. The fill is how far the goals have got; the marker
 *  standing on it is where the calendar currently is. Marker ahead of fill
 *  means you are behind, and that reads in a glance without a legend —
 *  which two stacked bars never did, because at the start of a window they
 *  are both empty and look like a component that failed to load.
 *
 *  Everything is positioned from `right`: the page is RTL, so a window fills
 *  from the right edge the way the text runs.
 * ---------------------------------------------------------------------- */
function PaceTrack({ clock, tint, compact = false }) {
  const h = compact ? 7 : 9;
  const behind = clock.pace && clock.drift <= -DRIFT_BAND;
  return (
    <span className="relative block" style={{ height: h + 10, marginTop: 2 }}>
      {/* the window */}
      <span
        className="absolute inset-x-0 block overflow-hidden rounded-full"
        style={{ top: 5, height: h, background: "rgba(255,255,255,0.09)" }}
      >
        {/* time already spent, kept very quiet — it is the backdrop the fill
            is judged against, not a second thing to read */}
        <span
          className="absolute inset-y-0 block transition-all duration-700"
          style={{
            right: 0,
            width: `${clock.pct}%`,
            background: "rgba(255,255,255,0.10)",
          }}
        />
        {/* what the goals have actually done */}
        <span
          className="absolute inset-y-0 block rounded-full transition-all duration-700"
          style={{
            right: 0,
            width: `${clock.hit}%`,
            backgroundImage: `linear-gradient(270deg, ${tint}, ${tint}99)`,
            boxShadow: clock.hit ? `0 0 12px ${tint}AA` : "none",
          }}
        />
      </span>

      {/* «أنت هنا» — the calendar's own position on the window */}
      {clock.state === "live" && (
        <span
          className="absolute block transition-all duration-700"
          style={{ right: `${clock.pct}%`, top: 0, height: h + 10 }}
          title={`مضى ${clock.pct}% من المدّة`}
        >
          <span
            className="absolute block rounded-full"
            style={{
              top: 0,
              right: -1.5,
              width: 3,
              height: h + 10,
              background: behind ? T.danger : "rgba(255,255,255,0.85)",
              boxShadow: behind
                ? `0 0 10px ${T.danger}`
                : "0 0 8px rgba(255,255,255,0.55)",
            }}
          />
        </span>
      )}
    </span>
  );
}


export function horizonClock(id, all, year, quarter) {
  const [from, to] = windowOf(id, year, quarter);
  const stand = windowStand(from, to);
  const list = all.filter((g) =>
    g.horizon !== id
      ? false
      : id === "quarter"
        ? g.quarter === quarter && g.year === year
        : id === "year"
          ? g.year === year
          : true,
  );
  const hit = list.length
    ? Math.round(list.reduce((n, g) => n + goalPct(g, all), 0) / list.length)
    : 0;
  const done = list.filter((g) => g.done).length;
  /* Pace is only a question once the window is open and has goals in it.
     Calling an empty quarter «متأخّر» would be scolding someone for not yet
     having written anything down. */
  const judged = stand.state === "live" && list.length > 0;
  const drift = hit - stand.pct;
  return {
    ...stand,
    from,
    to,
    goals: list.length,
    done,
    hit,
    drift,
    pace: !judged
      ? null
      : drift >= DRIFT_BAND
        ? { label: "متقدّم على الوقت", tint: T.primary }
        : drift <= -DRIFT_BAND
          ? { label: "متأخّر عن الوقت", tint: T.danger }
          : { label: "على المسار", tint: T.accent },
  };
}


/* The window each horizon is counting, named the way it is spoken. */
export const clockLabel = (id, year, quarter) =>
  id === "h3"
    ? ARC_LABEL
    : id === "year"
      ? String(year)
      : `${quarterOf(quarter).label} · ${year}`;

