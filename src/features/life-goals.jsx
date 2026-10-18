import { Badge, Btn, Card, Checkbox, DateField, Field, Modal, ProgressRing, T, dayWord, useBurst, useUndo } from "../components/life-shared.jsx";
import { GOAL_YEARS, HORIZONS, PILLARS, QUARTERS, VISION_MAX, WORD_MAX, YEAR_MIN, currentQuarter, daysTo, goalEnd, goalPct, goalPace, goalShape, horizonOf, nextOrder, openingWindow, parentHorizon, pillarOf, quarterOf, rows, taskShape, uid, windowOf, windowStand, yearQuarters } from "../state/life-state.mjs";
import { AlertTriangle, Check, ChevronDown, Compass, Flag, Gauge, Hourglass, Layers, Lightbulb, Link2, ListChecks, Minus, Plus, Search, Settings, SquarePen, Trash2, TrendingDown, TrendingUp, X, History, Target, Sparkles, PieChart, Activity } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export function GoalsModule({ state, setState }) {
  const here = new Date().getFullYear();
  const arm = useUndo();
  const [horizon, setHorizon] = useState("quarter");
  const [quarter, setQuarter] = useState(() => openingWindow(state.goals).quarter);
  const [year, setYear] = useState(() => openingWindow(state.goals).year);
  const [deskId, setDeskId] = useState(null);
  /* مكتب الهدف المُنشأ تَوّه يفتح على قسم «الإعدادات» موسّعًا — يحتاجه ليختار
     الركيزة والأفق أول مرة. أي فتح لاحق لنفس الهدف يلقاه مطويًا كغيره.
     يُمسح عند إغلاق المكتب، لا عند تغيّر الهدف نفسه، فتعديل النص أو أي
     حقل آخر وأنت بعدها داخل نفس الجلسة لا يُطوي القسم تحتك. */
  const [newGoalId, setNewGoalId] = useState(null);
  const [orphansOnly, setOrphansOnly] = useState(false);
  /* بحث عبر كل الأهداف بلا اعتبار للأفق أو الربع أو السنة المختارة — ٣٧
     هدفًا من البذرة وحدها كفيلة بجعل التنقّل اليدوي بين الأرباع أبطأ من
     كتابة كلمة. فارغ يعني «اعرض حسب الأفق كالعادة». */
  const [query, setQuery] = useState("");

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

  const years = useMemo(() => {
    const set = new Set(GOAL_YEARS);
    for (const g of all) if (g.horizon !== "h3" && g.year >= YEAR_MIN) set.add(g.year);
    return [...set].sort((a, b) => a - b);
  }, [all]);

  const meta = horizonOf(horizon);
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
  const orphans = useMemo(
    () => scoped.filter((g) => g.horizon !== "h3" && !g.parent),
    [scoped],
  );
  const shown = orphansOnly ? orphans : scoped;

  /* البحث يتجاوز نطاق الأفق/الربع/السنة كليًا — هدف يسكن ربعًا غير الظاهر
     حاليًا يجب أن يظهر أيضًا، وإلا كان بحثًا داخل ما تراه أصلًا لا بحثًا
     حقيقيًا. غير فعّال (null) حين الحقل فارغ، فتبقى بقية الشاشة كالمعتاد. */
  const q = query.trim();
  const searchResults = q ? all.filter((g) => g.text.includes(q)) : null;
  const pillarSource = searchResults || shown;

  const done = scoped.filter((g) => g.done).length;
  const pct = scoped.length
    ? Math.round(scoped.reduce((n, g) => n + goalPct(g, all, state.habits || []), 0) / scoped.length)
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
    arm("حُذف الهدف", { goals: state.goals || [] });
    setState((s) => ({
      ...s,
      goals: (s.goals || [])
        .filter((g) => g.id !== id)
        .map((g) => (g.parent === id ? { ...g, parent: null } : g)),
    }));
  };

  const add = (pillarOverride) => {
    const row = goalShape({
      horizon,
      quarter,
      year: year < YEAR_MIN ? YEAR_MIN : year,
      pillar: pillarOverride || shown[0]?.pillar || "faith",
    });
    setState((s) => ({ ...s, goals: [...(s.goals || []), row] }));
    setDeskId(row.id);
    setNewGoalId(row.id);
  };

  const desk = deskId ? byId.get(deskId) : null;

  /* أرباع السنة المعروضة. سنة المدرج (٢٠٢٦) لا تعرض إلا ما بقي منها، فلا
     يُفتح التبويب على ربع انتهى قبل أن يبدأ النظام. */
  const quartersShown = useMemo(() => yearQuarters(year, all), [year, all]);

  /* تبديل السنة يصحّح الربع معه: ربع مختار لم يعد له تبويب في السنة
     الجديدة يترك الشاشة فارغة بلا تبويب مضيء — وهو فراغ يبدو عطلًا. */
  const pickYear = (y) => {
    setYear(y);
    const qs = yearQuarters(y, all);
    if (!qs.some((q) => q.id === quarter)) setQuarter(qs[0].id);
  };

  return (
    <div className="space-y-8 pb-20">
      <Card className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">أهدافي</h2>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[11px] font-bold text-white/50 border border-white/10">
                {meta.label}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-white/40 max-w-lg mb-6">
              {meta.hint}
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              <Btn variant="default" size="sm" onClick={() => add()} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
                <Plus size={16} strokeWidth={3} /> هدف جديد
              </Btn>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Target size={14} className="text-emerald-400" />
                <span className="text-[12px] font-bold text-white/80">{done} من {scoped.length} محقق</span>
              </div>
              {daysLeft !== null && daysLeft > 0 && live && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Hourglass size={14} />
                  <span className="text-[12px] font-bold">بقي {daysLeft} يوم</span>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center bg-black/20 p-4 rounded-3xl border border-white/5">
             <ProgressRing value={pct} size={110} stroke={8} label="إنجاز الأفق" />
          </div>
        </div>
      </Card>

      <NorthStarCard
        value={state.northStar}
        onSave={(northStar) => setState((s) => ({ ...s, northStar }))}
      />

      <GoalAnalysisDashboard goals={all} habits={state.habits || []} />

      <UpcomingDeadlinesCard goals={all} />

      <div className="relative">
        <Search size={16} className="absolute top-1/2 right-4 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في كل أهدافك — بلا اعتبار للأفق أو الربع المختار..."
          className="w-full rounded-2xl border bg-white/[0.02] py-3 pr-11 pl-4 text-[13px] outline-none transition-colors focus:border-white/30"
          style={{ borderColor: T.border, color: T.fg }}
        />
      </div>

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

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {years.map((y) => {
            const on = y === year;
            const list = all.filter((g) => g.horizon === horizon && g.year === y);
            return (
              <button
                key={y}
                onClick={() => pickYear(y)}
                className={`flex-1 min-w-[100px] rounded-2xl border px-4 py-3 text-[13px] font-extrabold tabular-nums transition-all duration-300 ${
                  on 
                    ? "bg-white/10 border-white/20 text-white shadow-lg" 
                    : "bg-white/[0.02] border-transparent text-white/40 hover:bg-white/5"
                }`}
              >
                {y} <span className="opacity-50 text-[11px] mr-1">({list.length})</span>
              </button>
            );
          })}
        </div>

        {horizon === "quarter" && (
          <div
            className={`grid gap-3 ${
              quartersShown.length < 4 ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            {quartersShown.map((q) => {
              const on = q.id === quarter;
              const now = q.id === currentQuarter() && year === here;
              const list = all.filter(
                (g) => g.horizon === "quarter" && g.quarter === q.id && g.year === year,
              );
              const hit = list.filter((g) => g.done).length;
              /* إشارة على الربع كله قبل فتحه — لا بعد ما تفتح أهدافه وتقارنها
                 يدويًا. تُقرأ فقط على التبويبات غير المختارة: التبويب المختار
                 له تمييزه الخاص أصلًا (الخلفية البيضاء)، وتلوين حدّه فوقها
                 يتزاحم معه بدل أن يضيف إشارة جديدة. */
              const open = list.filter((g) => !g.done);
              const behindCount = open.filter((g) => goalPace(g, all).pace?.state === "behind").length;
              const allAhead = open.length > 0 && open.every((g) => goalPace(g, all).pace?.state === "ahead");
              const quarterTint = behindCount > 0 ? T.danger : allAhead ? T.primary : null;
              return (
                <button
                  key={q.id}
                  onClick={() => setQuarter(q.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-right transition-all duration-300 ${
                    on
                      ? "bg-white/10 border-white/20 shadow-lg"
                      : "bg-white/[0.02] border-transparent hover:bg-white/5"
                  }`}
                  style={quarterTint && !on ? { borderInlineStart: `3px solid ${quarterTint}` } : undefined}
                >
                  {on && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[14px] font-extrabold ${on ? "text-white" : "text-white/60"}`}>{q.label}</span>
                    {now && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                  <span className="block text-[11px] text-white/40 mb-3">{q.months}</span>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className={on ? "text-emerald-400" : "text-white/30"}>مُنجز: {hit}</span>
                    <span className={on ? "text-white/60" : "text-white/30"}>الكل: {list.length}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {orphans.length > 0 && (
        <button
          onClick={() => setOrphansOnly((v) => !v)}
          className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-right transition-all duration-300 ${
            orphansOnly ? "bg-orange-500/20 border-orange-500/40" : "bg-orange-500/5 border-orange-500/10 hover:bg-orange-500/10"
          }`}
        >
          <AlertTriangle size={18} className={orphansOnly ? "text-orange-400" : "text-orange-500/50"} />
          <span className="flex-1 text-[13px] font-bold text-orange-200/80">
            {orphans.length} أهداف لا تخدم هدفًا أعلى — اضغط للعرض
          </span>
        </button>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {PILLARS.map((p) => {
          const list = pillarSource.filter((g) => g.pillar === p.id);
          const hit = list.filter((g) => g.done).length;
          const complete = list.length > 0 && hit === list.length;
          const Icon = p.icon;
          const avg = list.length
            ? Math.round(list.reduce((n, g) => n + goalPct(g, all, state.habits || []), 0) / list.length)
            : 0;
            
          return (
            <Card key={p.id} className="p-0 overflow-hidden bg-white/[0.01] border-white/5 flex flex-col">
              <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-gradient-to-l from-white/[0.03] to-transparent">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: complete ? `${T.primary}20` : `${p.tint}15`,
                    color: complete ? T.primary : p.tint,
                    border: `1px solid ${complete ? T.primary : p.tint}30`,
                  }}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="flex-1">
                  <h3 className="text-[16px] font-extrabold text-white/90">{p.label}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/40 font-bold">{hit} من {list.length} محقق</span>
                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700" 
                        style={{ 
                          width: `${avg}%`, 
                          backgroundColor: complete ? T.primary : p.tint,
                          boxShadow: `0 0 10px ${complete ? T.primary : p.tint}80`
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-3">
                {list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Sparkles size={24} className="mb-3 text-white/20" />
                    {searchResults ? (
                      <p className="text-[12px] font-bold text-white/40">لا نتائج في هذه الركيزة</p>
                    ) : (
                      <>
                        <p className="text-[12px] font-bold text-white/40">لا توجد أهداف هنا بعد</p>
                        <button
                          type="button"
                          onClick={() => add(p.id)}
                          className="mt-3 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all"
                          style={{ borderColor: `${p.tint}50`, color: p.tint, background: `${p.tint}0F` }}
                        >
                          <Plus size={12} strokeWidth={3} /> هدف في «{p.label}»
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  list.map((g) => (
                    <GoalCard
                      key={g.id}
                      goal={g}
                      all={all}
                      habits={state.habits || []}
                      history={state.history || []}
                      parent={g.parent ? byId.get(g.parent) : null}
                      kids={kidsOf.get(g.id) || []}
                      onToggle={() => patch(g.id, { done: !g.done })}
                      onStep={
                        g.target > 0
                          ? (n) =>
                              patch(g.id, {
                                current: Math.max(0, Math.min(g.target, g.current + n)),
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
        key={deskId}
        goal={desk}
        isNew={deskId === newGoalId}
        all={all}
        tasks={state.tasks || []}
        habits={state.habits || []}
        history={state.history || []}
        onClose={() => {
          setDeskId(null);
          setNewGoalId(null);
        }}
        onPatch={(fields) => patch(deskId, fields)}
        onAddTask={(text) =>
          setState((s) => ({
            ...s,
            tasks: [
              ...(s.tasks || []),
              taskShape({
                text,
                quadrant: "q2",
                linkedGoalId: deskId,
                order: nextOrder(s.tasks, "q2"),
              }),
            ],
          }))
        }
        onDelete={() => {
          remove(deskId);
          setDeskId(null);
        }}
      />
    </div>
  );
}

/* أقرب ثلاثة أهداف لموعدها النهائي، عبر كل الركائز معًا — اللوحة فوقها
   تقول «هدف واحد متأخر» كرقم مجرّد، وهذه تجيب «أيّه بالضبط» مباشرة بدل
   فتح الأعمدة الستة والمقارنة يدويًا. */
function UpcomingDeadlinesCard({ goals }) {
  const items = useMemo(
    () =>
      goals
        .filter((g) => !g.done)
        .map((g) => ({ goal: g, left: daysTo(goalEnd(g)) }))
        .filter((x) => x.left !== null && x.left >= 0)
        .sort((a, b) => a.left - b.left)
        .slice(0, 3),
    [goals],
  );
  if (!items.length) return null;

  return (
    <Card className="p-5">
      <p className="mb-3 flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.ctaLift }}>
        <Hourglass size={14} /> الأقرب أجلًا
      </p>
      <div className="space-y-2">
        {items.map(({ goal, left }) => {
          const p = pillarOf(goal.pillar);
          return (
            <div
              key={goal.id}
              className="flex items-center gap-3 rounded-xl border p-2.5"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.02)" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${p.tint}1A`, color: p.tint }}
              >
                <p.icon size={13} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-white/85">{goal.text}</span>
              <DeadlineChip day={goalEnd(goal)} done={false} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function GoalAnalysisDashboard({ goals, habits }) {
  const activeGoals = goals.filter((g) => !g.done);
  if (activeGoals.length === 0) return null;

  let ahead = 0, behind = 0, onPace = 0;
  activeGoals.forEach((g) => {
    const pace = goalPace(g, goals);
    if (pace.pace?.state === "ahead") ahead++;
    else if (pace.pace?.state === "behind") behind++;
    else if (pace.pace?.state === "on-pace") onPace++;
  });

  const linked = activeGoals.filter((g) => g.linkedHabits && g.linkedHabits.length > 0).length;
  const linkedPct = Math.round((linked / activeGoals.length) * 100);

  const pillarCounts = {};
  activeGoals.forEach(g => {
    pillarCounts[g.pillar] = (pillarCounts[g.pillar] || 0) + 1;
  });
  let topPillarId = null, maxCount = 0;
  Object.entries(pillarCounts).forEach(([id, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topPillarId = id;
    }
  });
  const topPillar = pillarOf(topPillarId);

  let insight = "";
  if (behind > 0) {
    insight = `⚠️ لديك ${behind} أهداف متأخرة عن الجدول. راجع العقبات في مكتب الهدف لتعود للمسار.`;
  } else if (linkedPct < 50) {
    insight = `🔗 ${activeGoals.length - linked} من أهدافك لا ترتبط بعادات يومية. اربطها لتتحرك النسب تلقائياً.`;
  } else if (ahead > 0) {
    insight = `🚀 ممتاز! لديك ${ahead} أهداف تتقدم بسرعة أكبر من الجدول.`;
  } else {
    insight = `✅ كل أهدافك تسير حسب الخطة. استمر في إنجاز عاداتك اليومية.`;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-500/5 to-transparent border-white/5 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20">
          <PieChart size={20} />
        </div>
        <div>
          <h3 className="text-[16px] font-extrabold text-white/90">لوحة تحليل الأهداف</h3>
          <p className="text-[11px] text-white/40">نظرة سريعة على أداء أهدافك النشطة ({activeGoals.length} هدف)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 relative z-10">
        <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
           <p className="text-[11px] font-bold text-white/50 mb-3 flex items-center gap-1"><Activity size={12}/> مؤشر الأداء (Pace)</p>
           <div className="flex items-center h-3 w-full rounded-full overflow-hidden mb-3 bg-white/5">
             <div style={{ width: `${(ahead/activeGoals.length)*100}%` }} className="h-full bg-emerald-500" title={`متقدم: ${ahead}`} />
             <div style={{ width: `${(onPace/activeGoals.length)*100}%` }} className="h-full bg-blue-500" title={`على المسار: ${onPace}`} />
             <div style={{ width: `${(behind/activeGoals.length)*100}%` }} className="h-full bg-red-500" title={`متأخر: ${behind}`} />
           </div>
           <div className="flex justify-between text-[10px] font-bold">
             <span className="text-emerald-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> {ahead} متقدم</span>
             <span className="text-blue-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> {onPace} مسار</span>
             <span className="text-red-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> {behind} متأخر</span>
           </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col justify-between">
           <p className="text-[11px] font-bold text-white/50 mb-3 flex items-center gap-1"><Link2 size={12}/> ربط العادات</p>
           <div className="flex items-center gap-3">
             <div className="relative h-11 w-11 shrink-0 flex items-center justify-center rounded-full border border-white/10" style={{ background: `conic-gradient(#10b981 ${linkedPct}%, transparent 0)` }}>
                <div className="absolute inset-1 bg-[#151b23] rounded-full flex items-center justify-center">
                  <span className="text-[11px] font-extrabold text-emerald-400">{linkedPct}%</span>
                </div>
             </div>
             <div>
               <span className="block text-[13px] font-bold text-white/80">{linked} من {activeGoals.length}</span>
               <span className="block text-[10px] text-white/40">أهداف مرتبطة بعادات يومية</span>
             </div>
           </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col justify-between">
           <p className="text-[11px] font-bold text-white/50 mb-3 flex items-center gap-1"><Target size={12}/> أكثر ركيزة نشطة</p>
           {topPillar ? (
             <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-xl border shrink-0" style={{ backgroundColor: `${topPillar.tint}15`, borderColor: `${topPillar.tint}30`, color: topPillar.tint }}>
                 <topPillar.icon size={18} />
               </div>
               <div>
                 <span className="block text-[13px] font-bold text-white/80">{topPillar.label}</span>
                 <span className="block text-[10px] text-white/40">{maxCount} أهداف نشطة</span>
               </div>
             </div>
           ) : <span className="text-[11px] text-white/40">لا توجد بيانات</span>}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-[12px] font-bold leading-relaxed flex items-start gap-2.5 relative z-10">
         <Sparkles size={16} className="shrink-0 mt-0.5 text-indigo-400" />
         <p>{insight}</p>
      </div>
    </Card>
  );
}

function GoalHeatmap({ goal, history }) {
  const linked = goal.linkedHabits || [];
  if (linked.length === 0) return null;

  const days = [];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() - 84);

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDate(today);

  for (let i = 0; i < 91; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = formatDate(d);
    const row = (history || []).find((h) => h.date === dateStr);
    let doneCount = 0;
    if (row && Array.isArray(row.done)) {
      doneCount = linked.filter(id => row.done.includes(id)).length;
    }
    days.push({ date: dateStr, done: doneCount, total: linked.length, isToday: dateStr === todayStr });
  }

  return (
    <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">خريطة الالتزام</span>
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-sm bg-white/10"></div>
          <div className="h-2 w-2 rounded-sm bg-emerald-500/40"></div>
          <div className="h-2 w-2 rounded-sm bg-emerald-500"></div>
        </div>
      </div>
      <div 
        className="grid gap-1" 
        style={{ 
          gridTemplateColumns: "repeat(13, 1fr)", 
          gridTemplateRows: "repeat(7, 1fr)",
          gridAutoFlow: "column",
        }}
      >
        {days.map((day) => {
          let color = "bg-white/5";
          if (day.done > 0) {
            const ratio = day.done / day.total;
            color = ratio === 1 ? "bg-emerald-500" : "bg-emerald-500/40";
          }
          return (
            <div
              key={day.date}
              title={`${day.date}: ${day.done} من ${day.total}`}
              className={`aspect-square w-full rounded-[3px] transition-all hover:scale-125 hover:z-10 ${color} ${
                day.isToday ? "ring-1 ring-white" : ""
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function GoalCard({ goal, all, habits, history, parent, kids, onToggle, onStep, onOpen }) {
  const [burst, fireBurst] = useBurst(700);
  const p = pillarOf(goal.pillar);
  const pct = goalPct(goal, all, habits);
  const pace = goalPace(goal, all);
  const ripe = pct >= 100 && !goal.done;
  const Icon = p.icon;

  /* توهّج حافة البطاقة حسب الحالة — بدل قراءة شارة صغيرة، تفرز عينك
     الأهداف المتعثّرة من أول نظرة على الشاشة كلها. يُحسب فقط للمتأخر
     والمتقدّم؛ «على المسار» يبقى حياديًا كي لا يغرق التلوين كل بطاقة. */
  const edgeTint =
    !goal.done && pace.pace?.state === "behind"
      ? T.danger
      : !goal.done && pace.pace?.state === "ahead"
        ? T.primary
        : null;

  const handle = () => {
    if (!goal.done) fireBurst();
    onToggle();
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        goal.done
          ? "bg-white/[0.02] border-white/5 opacity-70"
          : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
      } ${burst ? "ring-2 ring-emerald-500" : ""}`}
      style={
        edgeTint
          ? { borderInlineStart: `3px solid ${edgeTint}`, boxShadow: `0 0 22px -12px ${edgeTint}` }
          : undefined
      }
    >
      {ripe && <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />}

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <button onClick={handle} className={`mt-0.5 shrink-0 flex items-center justify-center h-5 w-5 rounded-md border transition-all ${goal.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}>
            {goal.done && <Check size={12} className="text-black" strokeWidth={3} />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`text-[14px] font-bold leading-tight ${goal.done ? 'line-through text-white/40' : 'text-white/90'}`}>
                {goal.text}
              </h4>
              <button onClick={onOpen} className="shrink-0 text-white/20 hover:text-white/80 transition-colors">
                <SquarePen size={14} />
              </button>
            </div>
            
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${pct}%`, 
                    backgroundColor: pct >= 100 ? T.primary : p.tint,
                    boxShadow: `0 0 10px ${pct >= 100 ? T.primary : p.tint}`
                  }} 
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-white/60">{pct}%</span>
            </div>
          </div>
        </div>

        {!goal.done && goal.nextAction && (
          <div className="mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flag size={14} className="text-orange-400 shrink-0" />
            <span className="text-[12px] font-bold text-orange-200 leading-tight">
              {goal.nextAction}
            </span>
          </div>
        )}

        {!goal.done && <GoalHeatmap goal={goal} history={history} />}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/50">{p.label}</span>
          
          {goal.target > 0 && (
            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              {goal.current} / {goal.target} {goal.unit}
            </span>
          )}
          
          {goal.steps.length > 0 && (
            <span className="px-2 py-1 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-400 flex items-center gap-1">
              <ListChecks size={10} /> {goal.steps.filter(s => s.done).length} خطوات
            </span>
          )}

          {goal.linkedHabits && goal.linkedHabits.length > 0 && (
            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <Link2 size={10} /> {goal.linkedHabits.length} عادات
            </span>
          )}

          {pace.pace && (
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${
              pace.pace.state === 'behind' ? 'bg-red-500/10 text-red-400' : 
              pace.pace.state === 'ahead' ? 'bg-emerald-500/10 text-emerald-400' : 
              'bg-white/5 text-white/50'
            }`}>
              {pace.pace.state === 'behind' ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
              {pace.pace.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function HorizonRow({ clock, h, compact = false, on = false, as = "div", ...rest }) {
  const Tag = as;
  const dead = clock.state === "done";
  return (
    <Tag
      className={`relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300 w-full text-right ${
        on ? "bg-white/[0.08] border-white/20 shadow-lg" : "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"
      }`}
      {...rest}
    >
      <div className="flex items-center gap-4 w-[140px] sm:w-[180px] shrink-0">
        <div className="p-2.5 rounded-xl border" style={{ backgroundColor: `${h.tint}15`, borderColor: `${h.tint}30`, color: h.tint }}>
          <h.icon size={20} />
        </div>
        <div>
          <div className="text-[15px] font-extrabold text-white">{h.label}</div>
          <div className="text-[11px] font-bold text-white/50 mt-0.5">{clock.label}</div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-8">
        <div className="flex items-center justify-between text-[12px] font-bold mb-2">
          <span className="text-white/60">أُنجز: <span style={{ color: h.tint }}>{clock.hit}%</span></span>
          <span className="text-white/40">مضى: {clock.pct}%</span>
        </div>
        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-700" 
            style={{ width: `${clock.hit}%`, backgroundColor: h.tint, boxShadow: `0 0 10px ${h.tint}` }} 
          />
        </div>
      </div>

      <div className="shrink-0 text-center pl-4 sm:pl-6 border-r border-white/10 min-w-[80px]">
        <span className="block text-[28px] font-extrabold tabular-nums leading-none" style={{ color: h.tint }}>
          {dead ? "0" : clock.left}
        </span>
        <span className="block text-[11px] font-bold text-white/50 mt-1">يوم متبقي</span>
      </div>
    </Tag>
  );
}

function CountdownCard({ all, year, quarter, horizon, onPick }) {
  return (
    <Card className="p-6 sm:p-8 bg-gradient-to-br from-orange-500/5 to-transparent border-white/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-4 mb-6">
        <div className="p-3 bg-orange-500/15 text-orange-400 rounded-2xl border border-orange-500/20">
          <Hourglass size={24} />
        </div>
        <div>
          <h3 className="text-[18px] font-extrabold text-white/90">العد التنازلي (الأفق الزمني)</h3>
          <p className="text-[12px] text-white/40">الوقت المتبقي والإنجاز في كل أفق زمني</p>
        </div>
      </div>
      
      <div className="space-y-3 relative z-10">
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
            />
          );
        })}
      </div>
    </Card>
  );
}

const DRIFT_BAND = 10;

function NorthStarCard({ value, onSave }) {
  const [draft, setDraft] = useState(null);
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
    <Card className="relative overflow-hidden p-6 sm:p-8 bg-black/20 border-white/5">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      
      <div className="relative flex flex-wrap items-start justify-between gap-3 mb-4">
        <h3 className="flex items-center gap-2 text-[18px] font-extrabold text-white/90">
          <Compass size={20} className="text-violet-400" /> كلمة سنتي ورؤيتي
        </h3>
        <Btn
          variant="ghost"
          size="sm"
          onClick={() => setDraft(draft ? null : { word: star.word, vision: star.vision })}
          className="bg-white/5 hover:bg-white/10"
        >
          {draft ? <X size={14} /> : <SquarePen size={14} />}
          {draft ? "إلغاء" : empty ? "اكتبها" : "تعديل"}
        </Btn>
      </div>

      {draft ? (
        <div className="relative mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-bold text-white/50">كلمة واحدة تحكم السنة</label>
            <Field
              autoFocus
              maxLength={WORD_MAX}
              value={draft.word}
              onChange={(e) => setDraft((d) => ({ ...d, word: e.target.value }))}
              placeholder="مثال: إتقان"
              className="bg-black/20 border-white/10 text-lg font-bold text-violet-300"
            />
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-bold text-white/50">الرؤية — من تريد أن تكون؟</label>
            <Field
              as="textarea"
              rows={3}
              maxLength={VISION_MAX}
              value={draft.vision}
              onChange={(e) => setDraft((d) => ({ ...d, vision: e.target.value }))}
              placeholder="اكتبها بصيغة الحاضر..."
              className="bg-black/20 border-white/10 text-[13px] leading-relaxed text-white/80"
            />
          </div>
          <Btn variant="default" size="sm" onClick={commit} className="bg-violet-600 hover:bg-violet-500">
            <Check size={14} /> حفظ الرؤية
          </Btn>
        </div>
      ) : empty ? (
        <p className="relative text-[13px] leading-relaxed text-white/40 italic">
          "لم تكتب كلمتك بعد. كلمة واحدة وسطرٌ عن الرجل الذي تبنيه — هي ما يُبقيك على الأهداف حين يفتر الحافز."
        </p>
      ) : (
        <div className="relative">
          {star.word.trim() && (
            <h4 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-3">
              {star.word}
            </h4>
          )}
          {star.vision.trim() && (
            <p className="max-w-3xl text-[14px] leading-relaxed text-white/70">
              {star.vision}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

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

/* قسم قابل للطيّ — للعقبات والمراجعة الأسبوعية في مكتب الهدف: صندوقان
   كبيران ملوّنان كانا يظهران بكامل حجمهما حتى فارغين تمامًا، فيستقبلانك
   بإلحاح بصري في أول فتح لأي هدف جديد. يبدأ مفتوحًا فقط إن كان فيه محتوى
   بالفعل — هدف فارغ يرى سطرًا واحدًا، هدف مكتوب فيه يرى ما كتبه مباشرة. */
function CollapsibleSection({ icon: Icon, tint, title, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen !== undefined ? defaultOpen : count > 0);
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${tint}3D`, background: `${tint}05` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-right"
        aria-expanded={open}
      >
        <Icon size={14} style={{ color: tint }} />
        <span className="flex-1 text-[12.5px] font-bold" style={{ color: tint }}>
          {title}
          {count > 0 && <span dir="ltr"> ({count})</span>}
        </span>
        <ChevronDown
          size={15}
          className="transition-transform duration-200"
          style={{ color: tint, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

function GoalDesk({ goal, isNew, all, tasks, habits, history, onClose, onPatch, onAddTask, onDelete }) {
  const [step, setStep] = useState("");
  const [obstacleDraft, setObstacleDraft] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [taskDraft, setTaskDraft] = useState("");
  /* عادات ومهام هذا الهدف سؤال واحد — «شو يغذّيه يوميًا؟» — فتُعرضان في
     بطاقة واحدة بعلامتي تبويب بدل بطاقتين منفصلتين بنفس العنوان الفرعي. */
  const [linkTab, setLinkTab] = useState("habits");

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
  const pct = goalPct(goal, all, habits);
  const pace = goalPace(goal, all);
  const paceTint = pace.pace?.state === "ahead" ? T.primary : pace.pace?.state === "behind" ? T.danger : T.accent;
  const want = parentHorizon(goal.horizon);
  const kids = all.filter((g) => g.parent === goal.id);
  const deskYears = [...new Set([...GOAL_YEARS, goal.year])].sort((a, b) => a - b).filter((y) => y >= YEAR_MIN);
  const options = want
    ? all.filter((g) => g.horizon === want && g.id !== goal.id && !below.has(g.id))
    : [];

  const linkedTasks = (tasks || []).filter(t => t.linkedGoalId === goal.id);

  const addStep = () => {
    const text = step.trim();
    if (!text) return;
    onPatch({ steps: [...goal.steps, { id: uid(), text, done: false }] });
    setStep("");
  };

  const addObstacle = () => {
    const text = obstacleDraft.trim();
    if (!text) return;
    onPatch({ obstacles: [...(goal.obstacles || []), text] });
    setObstacleDraft("");
  };

  const commitReview = () => {
    const note = reviewNote.trim();
    if (!note) return;
    const newReview = {
      id: uid(),
      date: new Date().toISOString().split("T")[0],
      note,
      progress: pct
    };
    onPatch({ reviews: [...(goal.reviews || []), newReview] });
    setReviewNote("");
  };

  const addLinkedTask = () => {
    const text = taskDraft.trim();
    if (!text) return;
    onAddTask(text);
    setTaskDraft("");
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

        {/* الصف العلوي للأهمّ فقط — النسبة وزر الإنجاز. أفق الهدف وموعده
            معلومتان لا فعل، ومكانهما بجانب ما يضبطهما لا هنا: الأفق بجانب
            أزرار الأفق أسفل، والموعد بجانب حقل الموعد النهائي. */}
        <div className="flex items-center gap-2">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              placeholder="السبب الذي يحملك عليه."
              className="resize-none leading-relaxed"
            />
          </div>
          <div>
            <label htmlFor="los-gd-next" className={label} style={{ color: T.ctaLift }}>
              الخطوة القادمة (تظهر في البطاقة)
            </label>
            <Field
              as="textarea"
              id="los-gd-next"
              rows={2}
              value={goal.nextAction}
              onChange={(e) => onPatch({ nextAction: e.target.value })}
              placeholder="مثال: اقرأ 20 صفحة اليوم"
              className="resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* من هنا للأسفل: كل شي تعمل عليه فعليًا — تقيس، تربط، تنجز — قبل
            كل شي تضبطه مرة وحدة ثم تنساه. العقبات والمراجعة بعدها لأنها
            عمل متقطّع لا يومي، والإعدادات (الأفق، الركيزة، الموعد) في
            آخر قسم مطوي لأنها الأقل تكرارًا من كل ما سبقها. */}
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.sky }}>
            <Gauge size={14} /> القياس
          </p>
          {/* سطر إرشاد واحد يتبدّل بحال الهدف — لا نصّ ثابت دائمًا: قبل
              كتابة رقم يشرح متى الرقم أصلًا غير مطلوب، وبعدها يتحوّل لجملة
              حيّة تقرأ الأرقام الأربعة معًا بدل أربع خانات متفرّقة. */}
          {goal.target > 0 ? (
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: T.muted }}>
              🎯 خط النهاية:{" "}
              <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: p.tint }}>
                {goal.target} {goal.unit || "—"}
              </span>
              {" "}— كل إنجاز يضيف{" "}
              <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: p.tint }}>
                {goal.step}
              </span>
              .
            </p>
          ) : (
            <p className="mt-1 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
              هدف بلا رقم لا يُقاس. اتركه صفرًا إن كان هدفًا بنعم أو لا — حينها
              تقيسه خطواته أو الأهداف التي تخدمه.
            </p>
          )}

          {/* خانتان مدموجتان بإطار واحد لكل سؤال — «كم خط النهاية؟» ثم «وين
              أنت الآن؟» — بدل أربع خانات منفصلة بلا رابط بصري بينها. رقائق
              الوحدات الشائعة تحت الأولى توفّر كتابتها يدويًا في الغالب. */}
          <div className="mt-3">
            <label htmlFor="los-gd-target" className="mb-1 block text-[10px] font-bold" style={{ color: T.faint }}>
              خط النهاية — كم الرقم الذي تصل إليه؟
            </label>
            <div className="flex items-stretch overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
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
                className="flex-1 text-center tabular-nums"
                style={{ borderWidth: 0, borderRadius: 0 }}
              />
              <div className="w-px shrink-0" style={{ background: T.border }} />
              <Field
                id="los-gd-unit"
                maxLength={16}
                value={goal.unit}
                onChange={(e) => onPatch({ unit: e.target.value })}
                placeholder="كتاب"
                className="w-28 shrink-0"
                style={{ borderWidth: 0, borderRadius: 0 }}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {UNIT_SUGGESTIONS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onPatch({ unit: u })}
                  aria-pressed={goal.unit === u}
                  className="rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all"
                  style={{
                    borderColor: goal.unit === u ? `${p.tint}80` : T.border,
                    background: goal.unit === u ? `${p.tint}1F` : "transparent",
                    color: goal.unit === u ? p.tint : T.faint,
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="los-gd-current" className="mb-1 block text-[10px] font-bold" style={{ color: T.faint }}>
              أين أنت الآن؟
            </label>
            <div className="flex items-stretch overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
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
                className="flex-1 text-center tabular-nums"
                style={{ borderWidth: 0, borderRadius: 0 }}
              />
              <div className="w-px shrink-0" style={{ background: T.border }} />
              <label
                htmlFor="los-gd-step"
                className="flex shrink-0 items-center gap-1.5 px-2 text-[10px] font-bold whitespace-nowrap"
                style={{ color: T.faint }}
              >
                بخطوة
                <Field
                  id="los-gd-step"
                  type="number"
                  min="1"
                  dir="ltr"
                  value={goal.step}
                  onChange={(e) =>
                    onPatch({ step: Math.max(1, Math.round(+e.target.value) || 1) })
                  }
                  className="w-14 shrink-0 text-center tabular-nums"
                  style={{ borderWidth: 0, borderRadius: 0 }}
                />
              </label>
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

          {pace.pace && goal.target > 0 && (
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5"
              style={{ borderColor: T.border, background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bold" style={{ color: paceTint }}>
                  {pace.pace.label}
                </span>
                <span style={{ color: T.faint }}>
                  · مضى {pace.pct}% · أنجزت {pct}%
                </span>
              </div>
              <div className="text-[10.5px] font-bold" style={{ color: paceTint }}>
                {pace.pace.state === "behind" ? (
                  <span>⚠️ متأخر بـ {pace.behindBy} {goal.unit} — تحتاج {Math.round(pace.rate.amount)} {goal.unit} {pace.rate.per}</span>
                ) : pace.rate ? (
                  <span>تحتاج {Math.round(pace.rate.amount)} {goal.unit} {pace.rate.per}</span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
        >
          <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.primary }}>
            <Link2 size={14} /> ما يغذّي هذا الهدف
          </p>
          <p className="mt-1 mb-3 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            عادة أو مهمة تُنجَز تزيد تقدّم هذا الهدف تلقائيًا بمقدار «الخطوة».
          </p>

          {/* سؤال واحد — «شو يغذّي هذا الهدف يوميًا؟» — بعلامتي تبويب بدل
              بطاقتين منفصلتين كانتا تكرّران نفس العنوان الفرعي تقريبًا. */}
          <div className="mb-3 flex gap-1.5">
            <button
              type="button"
              onClick={() => setLinkTab("habits")}
              aria-pressed={linkTab === "habits"}
              className="flex-1 rounded-xl border py-2 text-[11px] font-bold transition-all"
              style={{
                borderColor: linkTab === "habits" ? `${T.primary}80` : T.border,
                background: linkTab === "habits" ? `${T.primary}1F` : "rgba(255,255,255,0.03)",
                color: linkTab === "habits" ? T.primary : T.muted,
              }}
            >
              عادات{(goal.linkedHabits || []).length > 0 && <span dir="ltr"> ({(goal.linkedHabits || []).length})</span>}
            </button>
            <button
              type="button"
              onClick={() => setLinkTab("tasks")}
              aria-pressed={linkTab === "tasks"}
              className="flex-1 rounded-xl border py-2 text-[11px] font-bold transition-all"
              style={{
                borderColor: linkTab === "tasks" ? `${T.sky}80` : T.border,
                background: linkTab === "tasks" ? `${T.sky}1F` : "rgba(255,255,255,0.03)",
                color: linkTab === "tasks" ? T.sky : T.muted,
              }}
            >
              مهام{linkedTasks.length > 0 && <span dir="ltr"> ({linkedTasks.length})</span>}
            </button>
          </div>

          {linkTab === "habits" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {habits.map((h) => {
                const isLinked = (goal.linkedHabits || []).includes(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      const linked = goal.linkedHabits || [];
                      const next = isLinked ? linked.filter(id => id !== h.id) : [...linked, h.id];
                      onPatch({ linkedHabits: next });
                    }}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all text-right"
                    style={{
                      borderColor: isLinked ? `${T.primary}80` : T.border,
                      background: isLinked ? `${T.primary}1F` : "rgba(255,255,255,0.03)",
                      color: isLinked ? T.primary : T.muted,
                    }}
                  >
                    <div className={`h-3.5 w-3.5 rounded-sm border flex shrink-0 items-center justify-center ${isLinked ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>
                      {isLinked && <Check size={10} className="text-black" />}
                    </div>
                    <span className="truncate">{h.label}</span>
                  </button>
                );
              })}
              {habits.length === 0 && (
                <p className="text-[10.5px] text-white/30 col-span-2">لا توجد عادات مضافة بعد.</p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {linkedTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/20 text-[11.5px] border border-white/5">
                    <span className={t.done ? "line-through text-white/40" : "text-white/80"}>{t.text}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${t.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"}`}>
                      {t.done ? "منجزة" : "قيد الانتظار"}
                    </span>
                  </div>
                ))}
                {linkedTasks.length === 0 && (
                  <p className="text-center text-[10.5px] text-white/30 py-2">لا توجد مهام مرتبطة بهذا الهدف بعد.</p>
                )}
              </div>
              {/* تُنشَأ في «مهم غير عاجل» مربوطة بهذا الهدف مباشرة — بلا
                  مغادرة هذه النافذة لمصفوفة المهام ثم العودة لربطها يدويًا. */}
              <div className="flex gap-2">
                <Field
                  value={taskDraft}
                  onChange={(e) => setTaskDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLinkedTask()}
                  placeholder="مهمة جديدة لهذا الهدف..."
                  className="flex-1 text-xs"
                />
                <Btn variant="outline" size="sm" onClick={addLinkedTask} className="shrink-0" style={{ borderColor: `${T.sky}80`, color: T.sky }}>
                  <Plus size={13} /> أضف
                </Btn>
              </div>
            </>
          )}
        </div>

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

        <CollapsibleSection
          icon={AlertTriangle}
          tint={T.danger}
          title="العقبات المتوقعة (Pre-mortem)"
          count={(goal.obstacles || []).length}
        >
          <p className="mt-1 mb-3 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            تخيل أنك فشلت في هذا الهدف. ما هو السبب الأكبر؟ سجله هنا وضع خطة لتجاوزه قبل أن يحدث.
          </p>
          <div className="space-y-2 mb-3">
            {(goal.obstacles || []).map((obs, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 text-[11.5px]">
                <span className="text-white/80">{obs}</span>
                <button onClick={() => onPatch({ obstacles: goal.obstacles.filter((_, idx) => idx !== i) })} className="text-white/30 hover:text-red-400">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Field
              value={obstacleDraft}
              onChange={(e) => setObstacleDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addObstacle()}
              placeholder="مثال: الانشغال بالعمل، أو التعب بعد الظهر..."
              className="flex-1 text-xs"
            />
            <Btn variant="danger" size="sm" onClick={addObstacle} className="shrink-0">
              <Plus size={13} /> أضف
            </Btn>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={History}
          tint={T.sky}
          title="المراجعة الأسبوعية"
          count={(goal.reviews || []).length}
        >
          <p className="mt-1 mb-3 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>
            سجل هنا ما تعلمته هذا الأسبوع. كيف كان أداؤك؟ وما الذي ستفعله بشكل مختلف الأسبوع القادم؟
          </p>

          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
            {(goal.reviews || []).slice().reverse().map((rev) => (
              <div key={rev.id} className="p-3 rounded-xl bg-black/20 border border-white/5 text-[11.5px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sky-400">{rev.date}</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">كان التقدم: {rev.progress}%</span>
                </div>
                <p className="text-white/80 leading-relaxed">{rev.note}</p>
              </div>
            ))}
            {(goal.reviews || []).length === 0 && (
              <p className="text-center text-[10.5px] text-white/30 py-2">لا توجد مراجعات بعد.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Field
              as="textarea"
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="أضف مراجعة لهذا الأسبوع..."
              className="text-xs resize-none"
            />
            <Btn variant="default" size="sm" onClick={commitReview} className="self-end">
              حفظ المراجعة
            </Btn>
          </div>
        </CollapsibleSection>

        {/* الأفق، الركيزة، الربط بهدف أعلى، والموعد النهائي — تُضبط مرة
            عند إنشاء الهدف وتُنسى بعدها، فهي القسم الوحيد المطويّ دائمًا
            إلا لحظة الإنشاء نفسها (isNew). */}
        <CollapsibleSection icon={Settings} tint={T.muted} title="الإعدادات" defaultOpen={isNew}>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className={`${label} flex items-center gap-1.5`} style={{ color: T.muted }}>
                الأفق
                <span
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: `${h.tint}1A`, color: h.tint }}
                >
                  <h.icon size={10} /> {h.label}
                </span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {HORIZONS.map((x) => {
                  const on = x.id === goal.horizon;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => on ? undefined : onPatch({ horizon: x.id, parent: null })}
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
              {/* صفّ واحد بدل تسعة أزرار متلاصقة: الأرباع أزرار لأنها أربعة
                  فقط وتُقارَن ببعضها، والسنة منتقٍ مدمج لأن قائمتها تطول مع
                  فتح كل سنة مدرج جديدة — صفّ من خمس سنوات كأزرار هو بالضبط
                  الازدحام الذي كانت عليه هذه البطاقة. */}
              <div className="flex items-center gap-1.5">
                {goal.horizon === "quarter" && (
                  <div className="flex flex-1 gap-1.5">
                    {QUARTERS.map((q) => {
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
                  </div>
                )}
                {goal.horizon !== "h3" && (
                  <select
                    value={goal.year}
                    onChange={(e) => onPatch({ year: +e.target.value })}
                    dir="ltr"
                    aria-label="السنة"
                    className={`rounded-xl border py-2 text-[12px] font-extrabold tabular-nums outline-none transition-colors focus:border-white/30 ${
                      goal.horizon === "quarter" ? "w-20 shrink-0 px-2 text-center" : "flex-1 px-3"
                    }`}
                    style={{ borderColor: `${T.accent}80`, background: T.cardSolid, color: T.accent }}
                  >
                    {deskYears.map((y) => (
                      <option key={y} value={y} style={{ background: T.cardSolid }}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}
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

          <div className="mt-4">
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

          {want && (
            <div className="mt-4">
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

          <div className="mt-4">
            <label htmlFor="los-gd-deadline" className={`${label} flex items-center gap-1.5`} style={{ color: T.muted }}>
              موعد نهائي <span style={{ color: T.faint }}>(اختياري)</span>
              <DeadlineChip day={goalEnd(goal)} done={goal.done} />
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
        </CollapsibleSection>

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
                const kp = goalPct(k, all, habits);
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

const ARC_LABEL = "٢٠٢٧ — ٢٠٣٠";

/* وحدات شائعة تكفي أغلب الأهداف الرقمية — تعبئة بضغطة بدل كتابة يدوية
   في الغالب. الحقل يبقى نصًّا حرًّا، فكتابة وحدة غير موجودة هنا لا تُرفض. */
const UNIT_SUGGESTIONS = ["كتاب", "صفحة", "ساعة", "مرة", "ريال", "كيلومتر"];

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
        ? { label: "متقدّم", tint: T.primary }
        : drift <= -DRIFT_BAND
          ? { label: "متأخّر", tint: T.danger }
          : { label: "على المسار", tint: T.accent },
  };
}

export const clockLabel = (id, year, quarter) =>
  id === "h3"
    ? ARC_LABEL
    : id === "year"
      ? String(year)
      : `${quarterOf(quarter).label} · ${year}`;