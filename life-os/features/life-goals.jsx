import { Badge, Btn, Card, Checkbox, DateField, Field, Modal, ProgressRing, T, dayWord, useBurst, useUndo, useHoverDelete } from "../components/life-shared.jsx";
import { GOAL_YEARS, HORIZONS, PILLARS, QUARTERS, VISION_MAX, WORD_MAX, YEAR_MIN, currentQuarter, daysTo, goalEnd, goalPct, goalPace, goalShape, horizonOf, nextOrder, streakRunFrom, treeGrowth, GROWTH_STAGES, openingWindow, parentHorizon, pillarOf, quarterOf, rows, taskShape, uid, windowOf, windowStand, yearQuarters } from "../state/life-state.mjs";
import { AlertTriangle, Calendar, Check, ChevronDown, ChevronUp, Compass, Flag, Gauge, Hourglass, Layers, Lightbulb, Link2, ListChecks, Minus, Plus, Search, Settings, SquarePen, Trash2, TrendingDown, TrendingUp, X, History, Target, Sparkles, PieChart, Activity, Network, PartyPopper, Sprout, GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// 👇 مكون السحب والإفلات مع أزرار احتياطية 👇
function DraggableWidget({ id, order, setOrder, children, className = "" }) {
  const [isDragging, setIsDragging] = useState(false);

  const moveItem = (fromId, toId) => {
    const newOrder = [...order];
    const dragIdx = newOrder.indexOf(fromId);
    const dropIdx = newOrder.indexOf(toId);
    if (dragIdx !== -1 && dropIdx !== -1) {
      newOrder.splice(dragIdx, 1);
      newOrder.splice(dropIdx, 0, fromId);
      setOrder(newOrder);
      try { localStorage.setItem("life_goals_widget_order_v3", JSON.stringify(newOrder)); } catch {}
    }
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId && draggedId !== id) {
      moveItem(draggedId, id);
    }
    setIsDragging(false);
  };

  const moveUp = () => {
    const idx = order.indexOf(id);
    if (idx > 0) moveItem(id, order[idx - 1]);
  };

  const moveDown = () => {
    const idx = order.indexOf(id);
    if (idx < order.length - 1) moveItem(id, order[idx + 1]);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative group transition-all duration-300 ${className} ${isDragging ? "opacity-50 scale-95" : ""}`}
    >
      {/* 👇 شريط التحكم الواضح (يظهر عند التمرير بالماوس) 👇 */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-1 rounded-xl bg-black/60 p-1.5 border border-white/20 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
        <div 
          draggable 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd} 
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/20 rounded-lg transition-colors" 
          title="اسحبني لتغيير الترتيب"
        >
          <GripVertical size={18} className="text-white/80" />
        </div>
        <div className="w-px h-5 bg-white/20 mx-0.5" />
        <button onClick={moveUp} className="p-1 hover:text-white text-white/60 transition-colors rounded-lg hover:bg-white/20" title="تحريك للأعلى">
          <ChevronUp size={18} />
        </button>
        <button onClick={moveDown} className="p-1 hover:text-white text-white/60 transition-colors rounded-lg hover:bg-white/20" title="تحريك للأسفل">
          <ChevronDown size={18} />
        </button>
      </div>
      
      {children}
    </div>
  );
}

export function GoalsModule({ state, setState }) {
  const here = new Date().getFullYear();
  const arm = useUndo();
  const [horizon, setHorizon] = useState("quarter");
  const [quarter, setQuarter] = useState(() => openingWindow(state.goals).quarter);
  const [year, setYear] = useState(() => openingWindow(state.goals).year);
  const [deskId, setDeskId] = useState(null);
  const [newGoalId, setNewGoalId] = useState(null);
  const [orphansOnly, setOrphansOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list");
  const [celebrateId, setCelebrateId] = useState(null);

  // 👇 حالة ترتيب الكروت (غيرنا اسم الذاكرة إلى v3 عشان ينمسح الترتيب القديم) 👇
  // العد التنازلي لم يعد ضمن القابل للسحب: هو وقائمة الأهداف تحته طرفا سؤال واحد
  // («أين أنا من الربع المختار؟») ويجب أن يبقيا متجاورين دائمًا، لا أن يفصل بينهما
  // سحب بطاقة أخرى إلى مكانه.
  const DEFAULT_ORDER = ["searchBar", "yearInPixels", "analysis", "wheel", "upcoming"];
  // ترتيب محفوظ يفقد بطاقة أُضيفت لاحقًا إلى DEFAULT_ORDER (كـ countdownBlock) هو ترتيب
  // قديم انتهت صلاحيته، لا تفضيل تعمّده المستخدم — إقحام الناقص في مقدّمة الترتيب
  // القديم كان يُبقي بقية البطاقات على تسلسلها القديم هي الأخرى (كـ "التحليل" قبل
  // "سنة في بكسل")، وهذا تسلسل لا يطابق لا القديم ولا الجديد. فالقاعدة الآن: ترتيب
  // محفوظ لا يحوي بالضبط كل مفاتيح DEFAULT_ORDER يُستبدل بها كاملة؛ ترتيب يحويها
  // جميعًا (حتى لو بتبديل المستخدم اليدوي) يُحترم كما هو.
  const [dashboardOrder, setDashboardOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("life_goals_widget_order_v3");
      const parsed = saved ? JSON.parse(saved) : null;
      const complete =
        Array.isArray(parsed) &&
        parsed.length === DEFAULT_ORDER.length &&
        DEFAULT_ORDER.every((id) => parsed.includes(id));
      return complete ? parsed : DEFAULT_ORDER;
    } catch {
      return DEFAULT_ORDER;
    }
  });

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

  const grown = useMemo(
    () =>
      treeGrowth(
        all,
        state.habits || [],
        state.history || [],
        streakRunFrom(state.history || []).days,
      ),
    [all, state.habits, state.history],
  );

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

  const q = query.trim();
  const searchResults = q ? all.filter((g) => g.text.includes(q)) : null;
  const pillarSource = searchResults || shown;

  const done = scoped.filter((g) => g.done).length;
  const pct = scoped.length
    ? Math.round(scoped.reduce((n, g) => n + goalPct(g, all, state.habits || []), 0) / scoped.length)
    : 0;

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

  const toggleGoal = (g) => {
    const isNowDone = !g.done;
    patch(g.id, { done: isNowDone });
    if (isNowDone) {
      setCelebrateId(g.id);
    }
  };

  const desk = deskId ? byId.get(deskId) : null;
  const celebrateGoal = celebrateId ? byId.get(celebrateId) : null;

  const quartersShown = useMemo(() => yearQuarters(year, all), [year, all]);

  const pickYear = (y) => {
    setYear(y);
    const qs = yearQuarters(y, all);
    if (!qs.some((q) => q.id === quarter)) setQuarter(qs[0].id);
  };

  // 👇 المكونات القابلة للسحب 👇
  const WIDGETS = {
    countdownBlock: {
      title: "الأفق الزمني",
      element: (
        <div className="space-y-4">
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
            {horizon === "quarter" && view === "list" && (
              <div className={`grid gap-3 ${quartersShown.length < 4 ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                {quartersShown.map((q) => {
                  const on = q.id === quarter;
                  const now = q.id === currentQuarter() && year === here;
                  const list = all.filter((g) => g.horizon === "quarter" && g.quarter === q.id && g.year === year);
                  const hit = list.filter((g) => g.done).length;
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
        </div>
      ),
      colSpan: "lg:col-span-2",
    },
    searchBar: {
      title: "البحث",
      element: (
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
      ),
      colSpan: "lg:col-span-2",
    },
    yearInPixels: {
      title: "سنة في بكسل",
      element: <YearInPixels year={year} history={state.history || []} />,
      colSpan: "lg:col-span-2",
    },
    analysis: {
      title: "لوحة التحليل",
      element: <GoalAnalysisDashboard goals={all} habits={state.habits || []} />,
      colSpan: "lg:col-span-2",
    },
    wheel: {
      title: "عجلة الحياة",
      element: <LifeWheel goals={all} />,
      colSpan: "lg:col-span-1",
    },
    upcoming: {
      title: "الأقرب أجلًا",
      element: <UpcomingDeadlinesCard goals={all} />,
      colSpan: "lg:col-span-1",
    },
  };

  return (
    <div className="space-y-8 pb-20">
      <Card className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">إرثي 2030</h2>
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
              
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
                <button 
                  onClick={() => setView("list")} 
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${view === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                  قائمة
                </button>
                <button 
                  onClick={() => setView("tree")} 
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${view === "tree" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                >
                  <Network size={12} /> شجرة
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <Target size={14} className="text-emerald-400" />
                <span className="text-[12px] font-bold text-white/80">{done} من {scoped.length} محقق</span>
              </div>
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

      {/* العد التنازلي وقائمة الأهداف تحته سؤال واحد — «أين أنا من الربع
          المختار؟» — فيُعرضان متجاورين دائمًا، قبل أي بطاقة قابلة للسحب. */}
      {WIDGETS.countdownBlock.element}

      {orphans.length > 0 && view === "list" && (
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

      {view === "tree" ? (
        <GoalTreeView
          all={all}
          habits={state.habits || []}
          onOpen={(id) => setDeskId(id)}
          onAdd={(pillarId) => add(pillarId)}
          grown={grown}
        />
      ) : (
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
                        onToggle={() => toggleGoal(g)}
                        onStep={
                          g.target > 0
                            ? (n) =>
                                patch(g.id, {
                                  current: Math.max(0, Math.min(g.target, g.current + n)),
                                })
                            : null
                        }
                        onOpen={() => setDeskId(g.id)}
                        onDelete={() => remove(g.id)}
                      />
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 👇 لوحة التحكم القابلة للسحب والإفلات 👇 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {dashboardOrder.map((id) => {
          const widget = WIDGETS[id];
          if (!widget) return null;
          return (
            <DraggableWidget
              key={id}
              id={id}
              order={dashboardOrder}
              setOrder={setDashboardOrder}
              className={widget.colSpan}
            >
              {widget.element}
            </DraggableWidget>
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

      <CelebrationModal
        goal={celebrateGoal}
        isOpen={!!celebrateId}
        onClose={() => setCelebrateId(null)}
        onSave={(lesson) => patch(celebrateId, { lesson })}
      />
    </div>
  );
}

/* ====================================================================== *
 *  شجرة الأهداف — جذعٌ يطول بما يُمشى عليه
 * ====================================================================== */
const GROUND_Y = 648;
const TREE_CX = 500;
const LEAF_D = "M0,0 C10,-9 16,-27 1,-45 C-14,-28 -10,-9 0,0 Z";
const BARK = ["#6B4A2D", "#6F4F30", "#735434"];
const LABEL_GAP = 9;

const labelW = (text, size) => Math.max(46, text.length * size * 0.47 + 22);
const labelH = (size) => size + 13;

function spreadLabels(labels) {
  const put = labels.map((l) => ({
    ...l,
    w: labelW(l.text, l.size),
    h: labelH(l.size),
    x: l.ax + Math.sin(l.a) * l.push,
    y: l.ay - Math.cos(l.a) * l.push - 4,
  }));
  for (let pass = 0; pass < 70; pass++) {
    let moved = false;
    for (let i = 0; i < put.length; i++)
      for (let j = i + 1; j < put.length; j++) {
        const A = put[i];
        const B = put[j];
        const ox = (A.w + B.w) / 2 + LABEL_GAP - Math.abs(A.x - B.x);
        const oy = (A.h + B.h) / 2 + LABEL_GAP - Math.abs(A.y - B.y);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (oy <= ox) {
          const s = A.y <= B.y ? 1 : -1;
          A.y -= (s * oy) / 2;
          B.y += (s * oy) / 2;
        } else {
          const s = A.x <= B.x ? 1 : -1;
          A.x -= (s * ox) / 2;
          B.x += (s * ox) / 2;
        }
      }
    if (!moved) break;
  }
  return put;
}

const jitter = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

const perp = (dx, dy) => {
  const m = Math.hypot(dx, dy) || 1;
  return [-dy / m, dx / m];
};

const taper = (p0, c, p2, w0, w2) => {
  const [n0x, n0y] = perp(c[0] - p0[0], c[1] - p0[1]);
  const [n2x, n2y] = perp(p2[0] - c[0], p2[1] - c[1]);
  const [ncx, ncy] = perp(p2[0] - p0[0], p2[1] - p0[1]);
  const wc = (w0 + w2) / 4;
  const f = (p, nx, ny, w) => `${p[0] + nx * w},${p[1] + ny * w}`;
  return (
    `M${f(p0, n0x, n0y, w0 / 2)} Q${f(c, ncx, ncy, wc)} ${f(p2, n2x, n2y, w2 / 2)}` +
    ` L${f(p2, -n2x, -n2y, w2 / 2)} Q${f(c, -ncx, -ncy, wc)} ${f(p0, -n0x, -n0y, w0 / 2)} Z`
  );
};

function useNarrow(px = 760) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < px,
  );
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < px);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [px]);
  return narrow;
}

function growTree(all, growth) {
  const byId = new Map(all.map((g) => [g.id, g]));
  const limbs = [];
  const leaves = [];
  const nodes = [];
  const masses = [];
  const labels = [];
  const trunkH = 150 + 180 * growth;
  const topY = GROUND_Y - trunkH;
  const w0 = 30 + 13 * growth;
  const w1 = w0 * 0.44;
  const trunk =
    `M${TREE_CX - w0},${GROUND_Y}` +
    ` C${TREE_CX - w0 * 0.84},${GROUND_Y - trunkH * 0.42} ${TREE_CX - w1 * 1.55},${GROUND_Y - trunkH * 0.76} ${TREE_CX - w1},${topY}` +
    ` L${TREE_CX + w1},${topY}` +
    ` C${TREE_CX + w1 * 1.55},${GROUND_Y - trunkH * 0.76} ${TREE_CX + w0 * 0.84},${GROUND_Y - trunkH * 0.42} ${TREE_CX + w0},${GROUND_Y} Z`;
  const roots = [-1, 1].map(
    (s) =>
      `M${TREE_CX + s * w0 * 0.92},${GROUND_Y - 4}` +
      ` C${TREE_CX + s * w0 * 1.5},${GROUND_Y + 2} ${TREE_CX + s * w0 * 1.9},${GROUND_Y + 10} ${TREE_CX + s * w0 * 2.5},${GROUND_Y + 15}` +
      ` C${TREE_CX + s * w0 * 1.8},${GROUND_Y + 19} ${TREE_CX + s * w0 * 1.2},${GROUND_Y + 18} ${TREE_CX + s * w0 * 0.8},${GROUND_Y + 16} Z`,
  );
  const grain = [-0.45, 0.05, 0.5].map(
    (u) =>
      `M${TREE_CX + u * w0 * 0.8},${GROUND_Y - 14} C${TREE_CX + u * w0 * 0.6},${GROUND_Y - trunkH * 0.45} ${TREE_CX + u * w1 * 1.1},${GROUND_Y - trunkH * 0.7} ${TREE_CX + u * w1 * 0.7},${topY + 6}`,
  );

  const limbOf = (key, p0, a, len, wStart, wEnd, depth, tint, bend) => {
    const ex = p0[0] + Math.sin(a) * len;
    const ey = p0[1] - Math.cos(a) * len;
    const [px, py] = perp(ex - p0[0], ey - p0[1]);
    const c = [(p0[0] + ex) / 2 + px * bend, (p0[1] + ey) / 2 + py * bend];
    limbs.push({
      key,
      d: taper(p0, c, [ex, ey], wStart, wEnd),
      sheen: `M${p0[0]},${p0[1]} Q${c[0]},${c[1]} ${ex},${ey}`,
      width: wStart,
      depth,
      tint,
    });
    return [ex, ey];
  };

  const leafy = (goal, x, y, angle, tint, depth) => {
    const j = jitter(goal.id);
    leaves.push({
      goal,
      x,
      y,
      angle: angle + (j - 0.5) * 0.5,
      size: 0.88 + j * 0.3,
      tint,
    });
    if (depth <= 2)
      [-0.62, 0.58].forEach((s, k) => {
        const jk = jitter(`${goal.id}${k}`);
        leaves.push({
          goal,
          key: `${goal.id}-${k}`,
          x: x + Math.sin(angle + s) * (20 + jk * 10),
          y: y - Math.cos(angle + s) * (20 + jk * 10),
          angle: angle + s + (jk - 0.5) * 0.4,
          size: 0.62 + jk * 0.22,
          tint,
          idle: true,
        });
      });
  };

  const walk = (goal, p0, angle, len, width, depth, tint) => {
    const bend = (depth % 2 === 0 ? 1 : -1) * len * 0.15;
    const kids = depth < 3 ? all.filter((g) => g.parent === goal.id) : [];
    const end = width * (kids.length ? 0.72 : 0.42);
    const [ex, ey] = limbOf(goal.id, p0, angle, len, width, end, depth, tint, bend);
    if (depth === 1)
      labels.push({
        key: goal.id,
        goal,
        text:
          (goal.text || "هدف بلا عنوان").length > 22
            ? `${goal.text.slice(0, 22)}…`
            : goal.text || "هدف بلا عنوان",
        full: goal.text,
        tint,
        size: 13,
        strong: false,
        ax: ex,
        ay: ey,
        a: angle,
        push: kids.length ? 30 : 46,
      });
    if (!kids.length) return leafy(goal, ex, ey, angle, tint, depth);
    nodes.push({ goal, x: ex, y: ey, a: angle, depth, tint });
    const spread = Math.min(1.4, 0.5 + 0.22 * kids.length);
    kids.forEach((k, i) => {
      const t = kids.length === 1 ? 0 : i / (kids.length - 1) - 0.5;
      const jk = jitter(k.id);
      walk(
        k,
        [ex, ey],
        angle + t * spread + (jk - 0.5) * 0.12,
        len * (0.6 + 0.08 * growth) * (0.9 + jk * 0.22),
        Math.max(3.4, end * 0.92),
        depth + 1,
        tint,
      );
    });
  };

  const rooted = (g) => !g.parent || !byId.has(g.parent);
  const boughs = PILLARS.map((p) => ({
    pillar: p,
    roots: all.filter((g) => g.pillar === p.id && rooted(g)),
  })).filter((b) => b.roots.length);

  const fan = boughs.length > 1 ? Math.min(2.25, 0.85 + 0.25 * boughs.length) : 0;
  boughs.forEach((b, i) => {
    const t = boughs.length === 1 ? 0 : i / (boughs.length - 1) - 0.5;
    const a = t * fan;
    const drop = Math.abs(t) * (64 + 30 * growth);
    const len = (122 + 70 * growth) * (1 - Math.abs(t) * 0.18);
    const wide = w1 * 1.25;
    const [ex, ey] = limbOf(
      `p-${b.pillar.id}`,
      [TREE_CX + Math.sin(a) * 10, topY + 14 + drop],
      a,
      len,
      wide,
      wide * 0.66,
      0,
      b.pillar.tint,
      (i % 2 ? -1 : 1) * len * 0.13,
    );
    nodes.push({ pillar: b.pillar, x: ex, y: ey, a, depth: 0, tint: b.pillar.tint });
    labels.push({
      key: `p-${b.pillar.id}`,
      pillar: b.pillar,
      text: b.pillar.label,
      tint: b.pillar.tint,
      size: 15,
      strong: true,
      ax: ex,
      ay: ey,
      a,
      push: 30,
    });
    const spread = Math.min(1.45, 0.45 + 0.2 * b.roots.length);
    b.roots.forEach((g, j) => {
      const u = b.roots.length === 1 ? 0 : j / (b.roots.length - 1) - 0.5;
      walk(
        g,
        [ex, ey],
        a + u * spread,
        (108 + 58 * growth) * (j % 2 ? 0.88 : 1.06),
        wide * 0.6,
        1,
        b.pillar.tint,
      );
    });
  });

  boughs.forEach((b) => {
    const own = leaves.filter((l) => l.goal.pillar === b.pillar.id);
    if (!own.length) return;
    masses.push({
      id: b.pillar.id,
      tint: b.pillar.tint,
      x: own.reduce((n, l) => n + l.x, 0) / own.length,
      y: own.reduce((n, l) => n + l.y, 0) / own.length,
      r: 70 + 46 * growth + Math.min(60, own.length * 7),
    });
  });

  const frame = (set) => {
    const xs = [
      ...leaves.map((n) => n.x),
      ...nodes.map((n) => n.x),
      ...set.map((l) => l.x - l.w / 2),
      ...set.map((l) => l.x + l.w / 2),
    ];
    const ys = [
      ...leaves.map((n) => n.y),
      ...nodes.map((n) => n.y),
      ...set.map((l) => l.y - l.h / 2),
    ];
    const minY = Math.min(topY, ...ys) - 40;
    const h = GROUND_Y + 62 - minY;
    const reach = Math.max(385, h * 0.58, ...xs.map((x) => Math.abs(x - TREE_CX) + 30));
    return { x: TREE_CX - reach, y: minY, w: reach * 2, h };
  };
  const everyName = spreadLabels(labels);
  const pillarsOnly = spreadLabels(labels.filter((l) => l.pillar));
  return {
    limbs,
    leaves,
    nodes,
    masses,
    names: {
      pillars: { labels: pillarsOnly, box: frame(pillarsOnly) },
      all: { labels: everyName, box: frame(everyName) },
    },
    trunk,
    roots,
    grain,
    topY,
  };
}

function TreeLabel({ label, onOpen }) {
  const { x, y, w, h, ax, ay, text, tint, strong, goal } = label;
  const far = Math.hypot(x - ax, y - ay) > h * 0.9;
  const open = goal && onOpen ? () => onOpen(goal.id) : null;
  return (
    <g
      className={open ? "cursor-pointer" : undefined}
      role={open ? "button" : undefined}
      tabIndex={open ? 0 : undefined}
      aria-hidden={open ? undefined : "true"}
      aria-label={open ? `${text} — افتح مكتب الهدف` : undefined}
      onClick={open || undefined}
      onKeyDown={
        open
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }
          : undefined
      }
    >
      {far && (
        <line
          x1={ax}
          y1={ay}
          x2={x + (ax > x ? w / 2 : -w / 2)}
          y2={y}
          stroke={tint}
          strokeOpacity="0.35"
          strokeWidth="1"
        />
      )}
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill="rgba(14,11,9,0.8)"
        stroke={tint}
        strokeOpacity={strong ? 0.55 : 0.3}
        strokeWidth="1"
      />
      <circle cx={x - w / 2 + 11} cy={y} r="3" fill={tint} />
      <text
        x={x + 6}
        y={y + label.size * 0.34}
        textAnchor="middle"
        fill={strong ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.82)"}
        fontSize={label.size}
        fontWeight={strong ? 800 : 700}
      >
        {text}
      </text>
    </g>
  );
}

function GoalTreeView({ all, habits, onOpen, onAdd, grown }) {
  const narrow = useNarrow();
  const [hot, setHot] = useState(null);
  const [named, setNamed] = useState("pillars");
  const tree = useMemo(() => growTree(all, grown.growth), [all, grown.growth]);

  if (!all.length)
    return (
      <Card className="p-10 text-center">
        <Sprout size={40} className="mx-auto text-emerald-400/40 mb-4" />
        <p className="text-[14px] font-bold text-white/70">لا بذرة بعد.</p>
        <p className="text-[12px] text-white/40 mt-1">
          أضف هدفًا واحدًا وستبدأ الشجرة بالخروج من التراب.
        </p>
      </Card>
    );

  const { limbs, leaves, nodes, masses, names, trunk, roots, grain } = tree;
  const { labels, box } = names[named] || names.pillars;
  const real = leaves.filter((l) => !l.idle);
  const pctOf = (g) => goalPct(g, all, habits);
  const grow = Math.round(grown.growth * 100);
  const chips = [
    { label: "الأهداف", v: Math.round(grown.parts.goals * 100), tint: T.primary },
    { label: "روتين الأسبوع", v: Math.round(grown.parts.week * 100), tint: T.success },
    { label: "السلسلة", v: Math.round(grown.parts.streak * 100), tint: T.achieve },
  ];
  const sow = (x, y, a, s) =>
    `translate(${x},${y}) rotate(${(a * 180) / Math.PI}) scale(${s})`;

  return (
    <Card className="p-5 md:p-7 overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-4">
        <div className="min-w-[210px]">
          <div className="flex items-center gap-2">
            <Sprout size={16} className="text-emerald-400" />
            <span className="text-[11px] font-bold tracking-wide text-white/40">
              شجرة الأهداف
            </span>
          </div>
          <h3 className="text-[22px] font-black text-white mt-1 leading-none">
            {grown.stage.label}
            <span dir="ltr" className="text-[14px] font-bold text-emerald-300/80 ms-2">
              {grow}%
            </span>
          </h3>
          <p className="text-[12px] text-white/45 mt-1.5">{grown.stage.hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: c.tint }}
              />
              <span className="text-[11px] font-bold text-white/60">{c.label}</span>
              <span dir="ltr" className="text-[12px] font-black text-white/90">
                {c.v}%
              </span>
            </div>
          ))}
          {!narrow && (
            <div className="flex bg-black/25 p-1 rounded-xl border border-white/10">
              {[
                { id: "pillars", label: "الركائز" },
                { id: "all", label: "كل الأهداف" },
              ].map((o) => (
                <button
                  key={o.id}
                  onClick={() => setNamed(o.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    named === o.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-300/20">
            <span className="text-[12px] font-black text-amber-200">
              {real.filter((l) => l.goal.done).length}
            </span>
            <span className="text-[11px] font-bold text-amber-100/60">
              ثمرة من {real.length} ورقة
            </span>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(1.5, grow)}%`,
              backgroundImage: `linear-gradient(90deg, ${T.success}, ${T.achieve})`,
            }}
          />
        </div>
        {!narrow && (
          <div className="flex justify-between mt-1.5">
            {GROWTH_STAGES.map((s) => (
              <span
                key={s.id}
                className="text-[10px] font-bold"
                style={{
                  color:
                    grown.growth >= s.at ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.22)",
                }}
              >
                {s.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className="relative w-full"
        style={{ aspectRatio: `${Math.round(box.w)} / ${Math.round(box.h)}` }}
      >
        <svg
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label="شجرة الأهداف"
        >
          <defs>
            <linearGradient id="los-trunk" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3A2516" />
              <stop offset="0.3" stopColor="#7A5634" />
              <stop offset="0.55" stopColor="#8C6540" />
              <stop offset="1" stopColor="#36220F" />
            </linearGradient>
            <radialGradient id="los-shade" cx="0.5" cy="0.5">
              <stop offset="0" stopColor="#000" stopOpacity="0.38" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            {masses.map((m) => (
              <radialGradient key={m.id} id={`los-mass-${m.id}`}>
                <stop offset="0" stopColor={m.tint} stopOpacity="0.2" />
                <stop offset="0.55" stopColor={m.tint} stopOpacity="0.08" />
                <stop offset="1" stopColor={m.tint} stopOpacity="0" />
              </radialGradient>
            ))}
            {real.map(({ goal, tint }) => {
              const p = goal.done ? 1 : pctOf(goal) / 100;
              return (
                <linearGradient key={goal.id} id={`los-leaf-${goal.id}`} x1="0" y1="1" x2="0.25" y2="0">
                  <stop offset={p} stopColor={tint} stopOpacity="0.95" />
                  <stop offset={p} stopColor={tint} stopOpacity="0.24" />
                </linearGradient>
              );
            })}
          </defs>

          {masses.map((m) => (
            <circle key={m.id} cx={m.x} cy={m.y} r={m.r} fill={`url(#los-mass-${m.id})`} />
          ))}
          <g opacity={0.17 + 0.13 * grown.growth}>
            {real.map(({ goal, x, y, angle, size, tint }) => (
              <path
                key={goal.id}
                d={LEAF_D}
                fill={tint}
                fillOpacity="0.2"
                transform={sow(x, y - 10, angle - 0.22, size * 1.5)}
              />
            ))}
          </g>

          <ellipse
            cx={TREE_CX}
            cy={GROUND_Y + 14}
            rx={150 + 55 * grown.growth}
            ry={26}
            fill="url(#los-shade)"
          />
          <path
            d={`M${TREE_CX - 180},${GROUND_Y + 11} Q${TREE_CX},${GROUND_Y - 19} ${TREE_CX + 180},${GROUND_Y + 11} Q${TREE_CX},${GROUND_Y + 31} ${TREE_CX - 180},${GROUND_Y + 11} Z`}
            fill="#2E2116"
            fillOpacity="0.62"
          />
          <g stroke={T.success} strokeOpacity="0.38" strokeWidth="2" strokeLinecap="round" fill="none">
            {Array.from({ length: 16 }, (_, i) => {
              const t = i / 15 - 0.5;
              const bx = TREE_CX + t * 320;
              const bh = (7 + 13 * grown.growth) * (0.6 + jitter(`g${i}`) * 0.9);
              const lean = (jitter(`l${i}`) - 0.5) * 16;
              return (
                <path
                  key={i}
                  d={`M${bx},${GROUND_Y + 14} Q${bx + lean * 0.5},${GROUND_Y + 14 - bh * 0.6} ${bx + lean},${GROUND_Y + 14 - bh}`}
                />
              );
            })}
          </g>

          <g className="los-sprout" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
            {roots.map((d, i) => (
              <path key={i} d={d} fill="#4A3120" />
            ))}
            <path d={trunk} fill="url(#los-trunk)" />
            {grain.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#2B1A0D"
                strokeOpacity="0.3"
                strokeWidth={i === 1 ? 2.4 : 1.6}
              />
            ))}

            {limbs
              .slice()
              .sort((a, b) => a.depth - b.depth)
              .map((l) => (
                <g key={l.key}>
                  <path d={l.d} fill={BARK[Math.min(2, l.depth)]} />
                  {l.depth >= 2 && <path d={l.d} fill={l.tint} fillOpacity="0.42" />}
                  <path
                    d={l.sheen}
                    fill="none"
                    stroke="#C79A6A"
                    strokeOpacity="0.16"
                    strokeWidth={Math.max(1, l.width * 0.3)}
                    strokeLinecap="round"
                  />
                </g>
              ))}
          </g>

          {leaves.map(({ goal, key, x, y, angle, size, tint, idle }, i) => {
            const s = size * (0.86 + 0.26 * grown.growth);
            if (idle)
              return (
                <g
                  key={key}
                  className="los-leaf"
                  style={{ animationDelay: `${Math.min(900, i * 22)}ms` }}
                  transform={sow(x, y, angle, s)}
                  aria-hidden="true"
                >
                  <path d={LEAF_D} fill="rgba(10,16,12,0.5)" />
                  <path d={LEAF_D} fill={tint} fillOpacity="0.3" stroke={tint} strokeWidth="1.1" strokeOpacity="0.4" />
                </g>
              );
            return (
              <g
                key={goal.id}
                className="los-leaf cursor-pointer"
                style={{ animationDelay: `${Math.min(900, i * 22)}ms` }}
                transform={sow(x, y, angle, s)}
                role="button"
                tabIndex={0}
                aria-label={`${goal.text} — ${pctOf(goal)}٪`}
                onClick={() => onOpen(goal.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(goal.id);
                  }
                }}
                onMouseEnter={() => setHot({ goal, x, y })}
                onMouseLeave={() => setHot(null)}
                onFocus={() => setHot({ goal, x, y })}
                onBlur={() => setHot(null)}
              >
                <path d={LEAF_D} fill="rgba(9,14,11,0.6)" />
                <path
                  d={LEAF_D}
                  fill={`url(#los-leaf-${goal.id})`}
                  stroke={goal.done ? T.success : tint}
                  strokeWidth={goal.done ? 2.2 : 1.5}
                  strokeOpacity="0.92"
                />
                <path d="M0,-2 L1,-40" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
                <path
                  d="M0,-14 L7,-21 M0,-22 L7,-29 M0,-14 L-6,-21 M0,-22 L-6,-29"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="0.9"
                  fill="none"
                />
                {goal.done && (
                  <g>
                    <circle cx="11" cy="-33" r="11" fill={T.achieve} opacity="0.2" />
                    <circle cx="11" cy="-33" r="6.2" fill={T.achieve} />
                    <circle cx="9" cy="-35" r="2" fill="#FFF" opacity="0.5" />
                    <path d="M11,-39 L10,-43" stroke="#5B3A18" strokeWidth="1.4" />
                  </g>
                )}
              </g>
            );
          })}

          {nodes.map(({ goal, pillar, x, y, a, depth, tint }) => {
            if (pillar)
              return (
                <g key={`p-${pillar.id}`} aria-hidden="true">
                  <circle cx={x} cy={y} r="6.5" fill="#20160F" stroke={tint} strokeWidth="2.5" />
                  {onAdd && (
                    <g
                      className="cursor-pointer los-bud"
                      role="button"
                      tabIndex={0}
                      aria-label={`أضف هدفًا في ${pillar.label}`}
                      onClick={() => onAdd(pillar.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onAdd(pillar.id);
                        }
                      }}
                    >
                      <circle
                        cx={x + Math.cos(a) * 21}
                        cy={y + Math.sin(a) * 21}
                        r="9.5"
                        fill="rgba(14,11,9,0.8)"
                        stroke={tint}
                        strokeOpacity="0.6"
                        strokeWidth="1.4"
                        strokeDasharray="3 2.5"
                      />
                      <path
                        d={`M${x + Math.cos(a) * 21 - 4},${y + Math.sin(a) * 21} h8 M${x + Math.cos(a) * 21},${y + Math.sin(a) * 21 - 4} v8`}
                        stroke={tint}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              );
            return (
              <g
                key={goal.id}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${goal.text} — ${pctOf(goal)}٪`}
                onClick={() => onOpen(goal.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(goal.id);
                  }
                }}
                onMouseEnter={() => setHot({ goal, x, y })}
                onMouseLeave={() => setHot(null)}
                onFocus={() => setHot({ goal, x, y })}
                onBlur={() => setHot(null)}
              >
                <circle cx={x} cy={y} r={depth === 1 ? 8 : 6} fill="#20160F" stroke={tint} strokeWidth="2.2" />
                {goal.done && <circle cx={x} cy={y} r={depth === 1 ? 4 : 3} fill={T.success} />}
              </g>
            );
          })}

          {!narrow &&
            labels.map((l) => (
              <TreeLabel key={l.key} label={l} onOpen={l.goal ? onOpen : null} />
            ))}
        </svg>

        {hot && (
          <div
            className="pointer-events-none absolute z-10 w-[232px] rounded-2xl border border-white/15 p-3.5 shadow-2xl"
            style={{
              backgroundColor: "rgba(16,12,10,0.95)",
              left: `${((hot.x - box.x) / box.w) * 100}%`,
              top: `${((hot.y - box.y) / box.h) * 100}%`,
              marginInlineStart: "-116px",
              marginTop: "-16px",
              transform: "translateY(-100%)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: pillarOf(hot.goal.pillar).tint }}
              />
              <span className="text-[10px] font-bold text-white/50">
                {pillarOf(hot.goal.pillar).label} · {horizonOf(hot.goal.horizon).short}
              </span>
              {hot.goal.done && (
                <span className="text-[10px] font-bold text-emerald-300 ms-auto">محقّق</span>
              )}
            </div>
            <p className="text-[12.5px] font-bold text-white leading-snug">
              {hot.goal.text || "هدف بلا عنوان"}
            </p>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-2.5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pctOf(hot.goal)}%`,
                  backgroundColor: hot.goal.done ? T.success : pillarOf(hot.goal.pillar).tint,
                }}
              />
            </div>
            <p className="text-[10px] text-white/45 mt-2">
              <span dir="ltr">{pctOf(hot.goal)}%</span> — اضغط لتفتح مكتبه وتعدّله
            </p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-white/35 mt-4 leading-relaxed">
        الجذع برنامجك، والأغصان الكبرى ركائزك الست، وكل ورقة هدف — اضغط ورقةً أو
        اسمًا ليفتح مكتبه فتعدّله، واضغط{" "}
        <span className="font-black text-white/60">＋</span> على أي ركيزة لتزرع فيها
        هدفًا جديدًا، و«كل الأهداف» ليظهر اسم كل هدف كبير على غصنه. تمتلئ الورقة بقدر
        ما أُنجز من هدفها، والثمرة هدفٌ تحقّق؛ وتطول الشجرة كلّها بتقدّم أهدافك
        وبالتزامك بالروتين هذا الأسبوع وبسلسلتك.
      </p>
    </Card>
  );
}

/* ==================================================================== *
 *  عجلة الحياة (Wheel of Life / Radar Chart)
 * ==================================================================== */
function LifeWheel({ goals }) {
  const activeGoals = goals.filter((g) => !g.done);
  const cx = 150;
  const cy = 150;
  const radius = 100;

  const pillarData = PILLARS.map((p) => {
    const list = activeGoals.filter((g) => g.pillar === p.id);
    const avg = list.length
      ? Math.round(list.reduce((n, g) => n + goalPct(g, goals), 0) / list.length)
      : 0;
    return { ...p, pct: avg };
  });

  const points = pillarData.map((d, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const x = cx + radius * (d.pct / 100) * Math.cos(angle);
    const y = cy + radius * (d.pct / 100) * Math.sin(angle);
    return { x, y, pct: d.pct, tint: d.tint, label: d.label, icon: d.icon };
  });

  const gridLevels = [20, 40, 60, 80, 100];
  const gridPoints = gridLevels.map((level) => {
    return PILLARS.map((_, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const x = cx + radius * (level / 100) * Math.cos(angle);
      const y = cy + radius * (level / 100) * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  });

  return (
    <Card className="p-5 flex flex-col items-center h-full">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-white/90">
          <Target size={15} className="text-emerald-400" /> عجلة الحياة
        </h3>
      </div>
      
      <div className="relative w-[300px] h-[300px] mt-4">
        <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
          {gridPoints.map((pts, idx) => (
            <polygon key={idx} points={pts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}

          {PILLARS.map((_, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
          })}

          <polygon
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="rgba(16, 185, 129, 0.2)"
            stroke="#10b981"
            strokeWidth="2"
            className="transition-all duration-1000 ease-out"
          />

          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill={p.tint} className="transition-all duration-1000 ease-out hover:r-6 cursor-pointer">
              <title>{p.label}: {p.pct}%</title>
            </circle>
          ))}
        </svg>

        {points.map((p, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const lx = cx + (radius + 35) * Math.cos(angle);
          const ly = cy + (radius + 25) * Math.sin(angle);
          return (
            <div key={i} className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(lx / 300) * 100}%`, top: `${(ly / 300) * 100}%` }}>
              <div className="flex items-center gap-1 text-[10px] font-bold whitespace-nowrap" style={{ color: p.tint }}>
                <p.icon size={11} /> {p.label}
              </div>
              <span className="text-[10px] font-extrabold text-white/80 bg-black/40 px-1.5 rounded">{p.pct}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ==================================================================== *
 *  نافذة الاحتفال بالإنجاز (Celebration Modal)
 * ==================================================================== */
function CelebrationModal({ goal, isOpen, onClose, onSave }) {
  const [lesson, setLesson] = useState("");

  useEffect(() => {
    if (isOpen && goal) setLesson(goal.lesson || "");
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="🎉 إنجاز عظيم!" wide>
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center mb-2">
          <PartyPopper size={56} className="text-emerald-400 animate-bounce" />
        </div>
        <h3 className="text-xl font-extrabold text-white">لقد حققت هدف: "{goal.text}"</h3>
        <p className="text-white/60 text-sm max-w-md mx-auto">هذا ليس مجرد رقم، بل خطوة حقيقية نحو "إرثك 2030". قبل أن تغلق هذه الصفحة، خذ لحظة للتفكير...</p>

        <div className="text-right mt-6 max-w-lg mx-auto bg-black/20 p-4 rounded-2xl border border-white/10">
          <label className="block text-sm font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
            <Lightbulb size={14} /> ما هو الدرس الذي تعلمته من هذا الهدف؟
          </label>
          <Field as="textarea" rows={3} value={lesson} onChange={(e) => setLesson(e.target.value)} placeholder="سجل الخلاصة هنا لتعود إليها لاحقاً..." className="w-full text-sm resize-none" />
        </div>

        <div className="flex gap-2 justify-center mt-6">
          <Btn variant="ghost" onClick={onClose}>تخطي</Btn>
          <Btn variant="default" onClick={() => { onSave(lesson); onClose(); }} className="bg-emerald-600 hover:bg-emerald-500 text-white"><Check size={14} /> حفظ الدرس وإغلاق</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ==================================================================== *
 *  ميزة "سنة في بكسل" (Year in Pixels)
 * ==================================================================== */
function YearInPixels({ year, history }) {
  const daysInYear = new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
  const today = new Date();
  const formatDate = (d) => {
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const todayStr = formatDate(today);

  const days = Array.from({ length: daysInYear }).map((_, i) => {
    const d = new Date(year, 0, i + 1);
    const dateStr = formatDate(d);
    const row = (history || []).find((h) => h.date === dateStr);
    let pct = row ? (row.pct || 0) : 0;
    const isFuture = d > today;
    return { dateStr, pct, isFuture };
  });

  return (
    <Card className="p-5 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-white/90"><Calendar size={15} className="text-indigo-400" /> سنة في بكسل ({year})</h3>
        <div className="flex gap-2 text-[9.5px] font-bold text-white/40">
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-white/5"></div> فارغ</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-500/40"></div> &lt;50%</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-yellow-500/60"></div> &lt;80%</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> 80%+</span>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="w-max mx-auto">
          <div 
            className="grid gap-1" 
            style={{ 
              gridTemplateColumns: "repeat(53, 14px)", 
              gridTemplateRows: "repeat(7, 14px)", 
              gridAutoFlow: "column",
            }}
          >
            {days.map((day, i) => {
              let color = "bg-white/5"; 
              if (day.isFuture) color = "bg-black/20 border border-white/5";
              else if (day.pct >= 80) color = "bg-emerald-500";
              else if (day.pct >= 50) color = "bg-yellow-500/60";
              else if (day.pct > 0) color = "bg-red-500/40";
              else if (day.dateStr <= todayStr) color = "bg-red-500/20";
              return <div key={day.dateStr} title={`${day.dateStr}: ${day.isFuture ? "قادم" : `${day.pct}%`}`} className={`w-[14px] h-[14px] rounded-[3px] transition-all hover:scale-125 hover:z-10 cursor-pointer ${color}`} />;
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function UpcomingDeadlinesCard({ goals }) {
  const items = useMemo(
    () => goals.filter((g) => !g.done).map((g) => ({ goal: g, left: daysTo(goalEnd(g)) })).filter((x) => x.left !== null && x.left >= 0).sort((a, b) => a.left - b.left).slice(0, 3),
    [goals]
  );
  if (!items.length) return null;

  return (
    <Card className="p-5 h-full">
      <p className="mb-3 flex items-center gap-2 text-[13px] font-extrabold" style={{ color: T.ctaLift }}><Hourglass size={14} /> الأقرب أجلًا</p>
      <div className="space-y-2">
        {items.map(({ goal, left }) => {
          const p = pillarOf(goal.pillar);
          return (
            <div key={goal.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: T.border, background: "rgba(255,255,255,0.02)" }}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${p.tint}1A`, color: p.tint }}><p.icon size={13} /></span>
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
    if (pace.pace?.state === "ahead") ahead++; else if (pace.pace?.state === "behind") behind++; else if (pace.pace?.state === "on-pace") onPace++;
  });

  const linked = activeGoals.filter((g) => g.linkedHabits && g.linkedHabits.length > 0).length;
  const linkedPct = Math.round((linked / activeGoals.length) * 100);

  const pillarCounts = {};
  activeGoals.forEach(g => { pillarCounts[g.pillar] = (pillarCounts[g.pillar] || 0) + 1; });
  let topPillarId = null, maxCount = 0;
  Object.entries(pillarCounts).forEach(([id, count]) => { if (count > maxCount) { maxCount = count; topPillarId = id; } });
  const topPillar = pillarOf(topPillarId);

  let insight = "";
  if (behind > 0) insight = `⚠️ لديك ${behind} أهداف متأخرة عن الجدول. راجع العقبات في مكتب الهدف لتعود للمسار.`;
  else if (linkedPct < 50) insight = `🔗 ${activeGoals.length - linked} من أهدافك لا ترتبط بعادات يومية. اربطها لتتحرك النسب تلقائياً.`;
  else if (ahead > 0) insight = `🚀 ممتاز! لديك ${ahead} أهداف تتقدم بسرعة أكبر من الجدول.`;
  else insight = `✅ كل أهدافك تسير حسب الخطة. استمر في إنجاز عاداتك اليومية.`;

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-500/5 to-transparent border-white/5 overflow-hidden relative h-full">
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-10 -mt-10 pointer-events-none" />
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20"><PieChart size={20} /></div>
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
                <div className="absolute inset-1 bg-[#151b23] rounded-full flex items-center justify-center"><span className="text-[11px] font-extrabold text-emerald-400">{linkedPct}%</span></div>
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
               <div className="p-2.5 rounded-xl border shrink-0" style={{ backgroundColor: `${topPillar.tint}15`, borderColor: `${topPillar.tint}30`, color: topPillar.tint }}><topPillar.icon size={18} /></div>
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
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDate(today);

  for (let i = 0; i < 91; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = formatDate(d);
    const row = (history || []).find((h) => h.date === dateStr);
    let doneCount = 0;
    if (row && Array.isArray(row.done)) doneCount = linked.filter(id => row.done.includes(id)).length;
    days.push({ date: dateStr, done: doneCount, total: linked.length, isToday: dateStr === todayStr });
  }

  return (
    <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">خريطة الالتزام</span>
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-sm bg-white/10"></div><div className="h-2 w-2 rounded-sm bg-emerald-500/40"></div><div className="h-2 w-2 rounded-sm bg-emerald-500"></div>
        </div>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(13, 1fr)", gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column" }}>
        {days.map((day) => {
          let color = "bg-white/5";
          if (day.done > 0) {
            const ratio = day.done / day.total;
            color = ratio === 1 ? "bg-emerald-500" : "bg-emerald-500/40";
          }
          return <div key={day.date} title={`${day.date}: ${day.done} من ${day.total}`} className={`aspect-square w-full rounded-[3px] transition-all hover:scale-125 hover:z-10 ${color} ${day.isToday ? "ring-1 ring-white" : ""}`} />;
        })}
      </div>
    </div>
  );
}

function GoalCard({ goal, all, habits, history, parent, kids, onToggle, onStep, onOpen, onDelete }) {
  const [burst, fireBurst] = useBurst(700);
  const p = pillarOf(goal.pillar);
  const pct = goalPct(goal, all, habits);
  const pace = goalPace(goal, all);
  const ripe = pct >= 100 && !goal.done;
  const Icon = p.icon;

  const edgeTint = !goal.done && pace.pace?.state === "behind" ? T.danger : !goal.done && pace.pace?.state === "ahead" ? T.primary : null;

  const handle = () => { if (!goal.done) fireBurst(); onToggle(); };
  const hoverDelete = useHoverDelete(onDelete);

  return (
    <div
      {...hoverDelete}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        goal.done ? "bg-white/[0.02] border-white/5 opacity-70" : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
      } ${burst ? "ring-2 ring-emerald-500" : ""}`}
      style={edgeTint ? { borderInlineStart: `3px solid ${edgeTint}`, boxShadow: `0 0 22px -12px ${edgeTint}` } : undefined}
    >
      {ripe && <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <button onClick={handle} className={`mt-0.5 shrink-0 flex items-center justify-center h-5 w-5 rounded-md border transition-all ${goal.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}>
            {goal.done && <Check size={12} className="text-black" strokeWidth={3} />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`text-[14px] font-bold leading-tight ${goal.done ? 'line-through text-white/40' : 'text-white/90'}`}>{goal.text}</h4>
              <button onClick={onOpen} className="shrink-0 text-white/20 hover:text-white/80 transition-colors"><SquarePen size={14} /></button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? T.primary : p.tint, boxShadow: `0 0 10px ${pct >= 100 ? T.primary : p.tint}` }} />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-white/60">{pct}%</span>
            </div>
          </div>
        </div>

        {!goal.done && goal.nextAction && (
          <div className="mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flag size={14} className="text-orange-400 shrink-0" />
            <span className="text-[12px] font-bold text-orange-200 leading-tight">{goal.nextAction}</span>
          </div>
        )}

        {!goal.done && <GoalHeatmap goal={goal} history={history} />}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/50">{p.label}</span>
          {goal.target > 0 && <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400 flex items-center gap-1">{goal.current} / {goal.target} {goal.unit}</span>}
          {goal.steps.length > 0 && <span className="px-2 py-1 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-400 flex items-center gap-1"><ListChecks size={10} /> {goal.steps.filter(s => s.done).length} خطوات</span>}
          {goal.linkedHabits && goal.linkedHabits.length > 0 && <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400 flex items-center gap-1"><Link2 size={10} /> {goal.linkedHabits.length} عادات</span>}
          {pace.pace && (
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${pace.pace.state === 'behind' ? 'bg-red-500/10 text-red-400' : pace.pace.state === 'ahead' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/50'}`}>
              {pace.pace.state === 'behind' ? <TrendingDown size={10} /> : <TrendingUp size={10} />} {pace.pace.label}
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
    <Tag className={`relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300 w-full text-right ${on ? "bg-white/[0.08] border-white/20 shadow-lg" : "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"}`} {...rest}>
      <div className="flex items-center gap-4 w-[140px] sm:w-[180px] shrink-0">
        <div className="p-2.5 rounded-xl border" style={{ backgroundColor: `${h.tint}15`, borderColor: `${h.tint}30`, color: h.tint }}><h.icon size={20} /></div>
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
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${clock.hit}%`, backgroundColor: h.tint, boxShadow: `0 0 10px ${h.tint}` }} />
        </div>
      </div>
      <div className="shrink-0 text-center pl-4 sm:pl-6 border-r border-white/10 min-w-[80px]">
        <span className="block text-[28px] font-extrabold tabular-nums leading-none" style={{ color: h.tint }}>{dead ? "0" : clock.left}</span>
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
        <div className="p-3 bg-orange-500/15 text-orange-400 rounded-2xl border border-orange-500/20"><Hourglass size={24} /></div>
        <div>
          <h3 className="text-[18px] font-extrabold text-white/90">العد التنازلي (الأفق الزمني)</h3>
          <p className="text-[12px] text-white/40">الوقت المتبقي والإنجاز في كل أفق زمني</p>
        </div>
      </div>
      <div className="space-y-3 relative z-10">
        {HORIZONS.map((h) => {
          const clock = horizonClock(h.id, all, year, quarter);
          return <HorizonRow key={h.id} as="button" h={h} clock={{ ...clock, label: clockLabel(h.id, year, quarter) }} on={h.id === horizon} onClick={() => onPick(h.id)} />;
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
    onSave({ word: draft.word.trim().slice(0, WORD_MAX), vision: draft.vision.trim().slice(0, VISION_MAX) });
    setDraft(null);
  };

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8 bg-black/20 border-white/5">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="relative flex flex-wrap items-start justify-between gap-3 mb-4">
        <h3 className="flex items-center gap-2 text-[18px] font-extrabold text-white/90"><Compass size={20} className="text-violet-400" /> كلمة سنتي ورؤيتي</h3>
        <Btn variant="ghost" size="sm" onClick={() => setDraft(draft ? null : { word: star.word, vision: star.vision })} className="bg-white/5 hover:bg-white/10">
          {draft ? <X size={14} /> : <SquarePen size={14} />} {draft ? "إلغاء" : empty ? "اكتبها" : "تعديل"}
        </Btn>
      </div>

      {draft ? (
        <div className="relative mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-bold text-white/50">كلمة واحدة تحكم السنة</label>
            <Field autoFocus maxLength={WORD_MAX} value={draft.word} onChange={(e) => setDraft((d) => ({ ...d, word: e.target.value }))} placeholder="مثال: إتقان" className="bg-black/20 border-white/10 text-lg font-bold text-violet-300" />
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-bold text-white/50">الرؤية — من تريد أن تكون؟</label>
            <Field as="textarea" rows={3} maxLength={VISION_MAX} value={draft.vision} onChange={(e) => setDraft((d) => ({ ...d, vision: e.target.value }))} placeholder="اكتبها بصيغة الحاضر..." className="bg-black/20 border-white/10 text-[13px] leading-relaxed text-white/80" />
          </div>
          <Btn variant="default" size="sm" onClick={commit} className="bg-violet-600 hover:bg-violet-500"><Check size={14} /> حفظ الرؤية</Btn>
        </div>
      ) : empty ? (
        <p className="relative text-[13px] leading-relaxed text-white/40 italic">"لم تكتب كلمتك بعد. كلمة واحدة وسطرٌ عن الرجل الذي تبنيه — هي ما يُبقيك على الأهداف حين يفتر الحافز."</p>
      ) : (
        <div className="relative">
          {star.word.trim() && <h4 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-3">{star.word}</h4>}
          {star.vision.trim() && <p className="max-w-3xl text-[14px] leading-relaxed text-white/70">{star.vision}</p>}
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
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, backgroundImage: `linear-gradient(90deg, ${bar}, ${bar}AA)`, boxShadow: pct ? `0 0 12px ${bar}99` : "none" }} />
      </div>
      {has && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span dir="ltr" className="text-[11px] tabular-nums" style={{ color: T.faint }}>{goal.current} / {goal.target} {goal.unit ? ` ${goal.unit}` : ""}</span>
          {onStep && (
            <span className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => onStep(-goal.step)} disabled={goal.current <= 0} aria-label={`أنقص ${goal.text}`} className="flex h-6 w-6 items-center justify-center rounded-md border transition-all active:scale-90 disabled:opacity-25" style={{ borderColor: T.border, color: T.muted }}><Minus size={11} strokeWidth={3} /></button>
              <button type="button" onClick={() => onStep(goal.step)} disabled={goal.current >= goal.target} aria-label={`زد ${goal.text}`} className="flex h-6 w-6 items-center justify-center rounded-md border transition-all active:scale-90 disabled:opacity-25" style={{ borderColor: `${tint}4D`, color: tint }}><Plus size={11} strokeWidth={3} /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ icon: Icon, tint, title, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen !== undefined ? defaultOpen : count > 0);
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${tint}3D`, background: `${tint}05` }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-right" aria-expanded={open}>
        <Icon size={14} style={{ color: tint }} />
        <span className="flex-1 text-[12.5px] font-bold" style={{ color: tint }}>{title}{count > 0 && <span dir="ltr"> ({count})</span>}</span>
        <ChevronDown size={15} className="transition-transform duration-200" style={{ color: tint, transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
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
  const [linkTab, setLinkTab] = useState("habits");

  const below = useMemo(() => {
    const out = new Set();
    if (!goal) return out;
    const walk = (id, depth) => {
      if (depth > HORIZONS.length) return;
      for (const g of all) if (g.parent === id && !out.has(g.id)) { out.add(g.id); walk(g.id, depth + 1); }
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
  const options = want ? all.filter((g) => g.horizon === want && g.id !== goal.id && !below.has(g.id)) : [];

  const linkedTasks = (tasks || []).filter(t => t.linkedGoalId === goal.id);

  const addStep = () => { const text = step.trim(); if (!text) return; onPatch({ steps: [...goal.steps, { id: uid(), text, done: false }] }); setStep(""); };
  const addObstacle = () => { const text = obstacleDraft.trim(); if (!text) return; onPatch({ obstacles: [...(goal.obstacles || []), text] }); setObstacleDraft(""); };
  const commitReview = () => {
    const note = reviewNote.trim(); if (!note) return;
    onPatch({ reviews: [...(goal.reviews || []), { id: uid(), date: new Date().toISOString().split("T")[0], note, progress: pct }] }); setReviewNote("");
  };
  const addLinkedTask = () => { const text = taskDraft.trim(); if (!text) return; onAddTask(text); setTaskDraft(""); };

  const label = "mb-1.5 block text-xs";

  return (
    <Modal open={!!goal} onClose={onClose} title="مكتب الهدف" wide onDelete={goal ? onDelete : undefined}>
      <div className="space-y-5">
        <div>
          <label htmlFor="los-gd-text" className={label} style={{ color: T.muted }}>الهدف</label>
          <Field id="los-gd-text" value={goal.text} onChange={(e) => onPatch({ text: e.target.value })} placeholder="مثال: ختم القرآن تدبّرًا مرّتين" />
        </div>

        <div className="flex items-center gap-2">
          <span dir="ltr" className="rounded-lg px-2 py-1 text-[12px] font-extrabold tabular-nums" style={{ background: pct >= 100 ? `${T.primary}1A` : "rgba(255,255,255,0.05)", color: pct >= 100 ? T.primary : T.muted }}>{pct}%</span>
          <Btn variant={goal.done ? "default" : "outline"} size="sm" className="mr-auto" onClick={() => onPatch({ done: !goal.done })}><Check size={13} strokeWidth={3} />{goal.done ? "مُحقَّق" : "علّمه مُحقَّقًا"}</Btn>
        </div>

        {goal.done && goal.lesson && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[12px] font-bold text-emerald-400 mb-1 flex items-center gap-1.5"><Sparkles size={14} /> الدرس المستفاد من هذا الهدف:</p>
            <p className="text-[13px] text-white/80 leading-relaxed italic">"{goal.lesson}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="los-gd-why" className={label} style={{ color: T.muted }}>لماذا هذا الهدف؟</label>
            <Field as="textarea" id="los-gd-why" rows={2} value={goal.why} onChange={(e) => onPatch({ why: e.target.value.slice(0, 400) })} placeholder="السبب الذي يحملك عليه." className="resize-none leading-relaxed" />
          </div>
          <div>
            <label htmlFor="los-gd-next" className={label} style={{ color: T.ctaLift }}>الخطوة القادمة (تظهر في البطاقة)</label>
            <Field as="textarea" id="los-gd-next" rows={2} value={goal.nextAction} onChange={(e) => onPatch({ nextAction: e.target.value })} placeholder="مثال: اقرأ 20 صفحة اليوم" className="resize-none leading-relaxed" />
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}>
          <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.sky }}><Gauge size={14} /> القياس</p>
          {goal.target > 0 ? (
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: T.muted }}>🎯 خط النهاية: <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: p.tint }}>{goal.target} {goal.unit || "—"}</span> — كل إنجاز يضيف <span dir="ltr" className="font-extrabold tabular-nums" style={{ color: p.tint }}>{goal.step}</span>.</p>
          ) : (
            <p className="mt-1 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>هدف بلا رقم لا يُقاس. اتركه صفرًا إن كان هدفًا بنعم أو لا — حينها تقيسه خطواته أو الأهداف التي تخدمه.</p>
          )}

          <div className="mt-3">
            <label htmlFor="los-gd-target" className="mb-1 block text-[10px] font-bold" style={{ color: T.faint }}>خط النهاية — كم الرقم الذي تصل إليه؟</label>
            <div className="flex items-stretch overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
              <Field id="los-gd-target" type="number" min="0" dir="ltr" value={goal.target || ""} onChange={(e) => { const target = Math.max(0, Math.round(+e.target.value) || 0); onPatch({ target, current: target > 0 ? Math.min(target, goal.current) : goal.current }); }} placeholder="0" className="flex-1 text-center tabular-nums" style={{ borderWidth: 0, borderRadius: 0 }} />
              <div className="w-px shrink-0" style={{ background: T.border }} />
              <Field id="los-gd-unit" maxLength={16} value={goal.unit} onChange={(e) => onPatch({ unit: e.target.value })} placeholder="كتاب" className="w-28 shrink-0" style={{ borderWidth: 0, borderRadius: 0 }} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {UNIT_SUGGESTIONS.map((u) => (
                <button key={u} type="button" onClick={() => onPatch({ unit: u })} aria-pressed={goal.unit === u} className="rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all" style={{ borderColor: goal.unit === u ? `${p.tint}80` : T.border, background: goal.unit === u ? `${p.tint}1F` : "transparent", color: goal.unit === u ? p.tint : T.faint }}>{u}</button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="los-gd-current" className="mb-1 block text-[10px] font-bold" style={{ color: T.faint }}>أين أنت الآن؟</label>
            <div className="flex items-stretch overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
              <Field id="los-gd-current" type="number" min="0" dir="ltr" value={goal.current || ""} onChange={(e) => { const n = Math.max(0, Math.round(+e.target.value) || 0); onPatch({ current: goal.target > 0 ? Math.min(goal.target, n) : n }); }} placeholder="0" className="flex-1 text-center tabular-nums" style={{ borderWidth: 0, borderRadius: 0 }} />
              <div className="w-px shrink-0" style={{ background: T.border }} />
              <label htmlFor="los-gd-step" className="flex shrink-0 items-center gap-1.5 px-2 text-[10px] font-bold whitespace-nowrap" style={{ color: T.faint }}>بخطوة <Field id="los-gd-step" type="number" min="1" dir="ltr" value={goal.step} onChange={(e) => onPatch({ step: Math.max(1, Math.round(+e.target.value) || 1) })} className="w-14 shrink-0 text-center tabular-nums" style={{ borderWidth: 0, borderRadius: 0 }} /></label>
            </div>
          </div>
          {goal.target > 0 && <div className="mt-3.5"><GoalMeter goal={goal} pct={pct} tint={p.tint} onStep={(n) => onPatch({ current: Math.max(0, Math.min(goal.target, goal.current + n)) })} /></div>}

          {pace.pace && goal.target > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: T.border, background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bold" style={{ color: paceTint }}>{pace.pace.label}</span>
                <span style={{ color: T.faint }}>· مضى {pace.pct}% · أنجزت {pct}%</span>
              </div>
              <div className="text-[10.5px] font-bold" style={{ color: paceTint }}>
                {pace.pace.state === "behind" ? <span>⚠️ متأخر بـ {pace.behindBy} {goal.unit} — تحتاج {Math.round(pace.rate.amount)} {goal.unit} {pace.rate.per}</span> : pace.rate ? <span>تحتاج {Math.round(pace.rate.amount)} {goal.unit} {pace.rate.per}</span> : null}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}>
          <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.primary }}><Link2 size={14} /> ما يغذّي هذا الهدف</p>
          <p className="mt-1 mb-3 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>عادة أو مهمة تُنجَز تزيد تقدّم هذا الهدف تلقائيًا بمقدار «الخطوة».</p>

          <div className="mb-3 flex gap-1.5">
            <button type="button" onClick={() => setLinkTab("habits")} aria-pressed={linkTab === "habits"} className="flex-1 rounded-xl border py-2 text-[11px] font-bold transition-all" style={{ borderColor: linkTab === "habits" ? `${T.primary}80` : T.border, background: linkTab === "habits" ? `${T.primary}1F` : "rgba(255,255,255,0.03)", color: linkTab === "habits" ? T.primary : T.muted }}>عادات{(goal.linkedHabits || []).length > 0 && <span dir="ltr"> ({(goal.linkedHabits || []).length})</span>}</button>
            <button type="button" onClick={() => setLinkTab("tasks")} aria-pressed={linkTab === "tasks"} className="flex-1 rounded-xl border py-2 text-[11px] font-bold transition-all" style={{ borderColor: linkTab === "tasks" ? `${T.sky}80` : T.border, background: linkTab === "tasks" ? `${T.sky}1F` : "rgba(255,255,255,0.03)", color: linkTab === "tasks" ? T.sky : T.muted }}>مهام{linkedTasks.length > 0 && <span dir="ltr"> ({linkedTasks.length})</span>}</button>
          </div>

          {linkTab === "habits" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {habits.map((h) => {
                const isLinked = (goal.linkedHabits || []).includes(h.id);
                return (
                  <button key={h.id} type="button" onClick={() => { const linked = goal.linkedHabits || []; const next = isLinked ? linked.filter(id => id !== h.id) : [...linked, h.id]; onPatch({ linkedHabits: next }); }} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all text-right" style={{ borderColor: isLinked ? `${T.primary}80` : T.border, background: isLinked ? `${T.primary}1F` : "rgba(255,255,255,0.03)", color: isLinked ? T.primary : T.muted }}>
                    <div className={`h-3.5 w-3.5 rounded-sm border flex shrink-0 items-center justify-center ${isLinked ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>{isLinked && <Check size={10} className="text-black" />}</div>
                    <span className="truncate">{h.label}</span>
                  </button>
                );
              })}
              {habits.length === 0 && <p className="text-[10.5px] text-white/30 col-span-2">لا توجد عادات مضافة بعد.</p>}
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {linkedTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/20 text-[11.5px] border border-white/5">
                    <span className={t.done ? "line-through text-white/40" : "text-white/80"}>{t.text}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${t.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"}`}>{t.done ? "منجزة" : "قيد الانتظار"}</span>
                  </div>
                ))}
                {linkedTasks.length === 0 && <p className="text-center text-[10.5px] text-white/30 py-2">لا توجد مهام مرتبطة بهذا الهدف بعد.</p>}
              </div>
              <div className="flex gap-2">
                <Field value={taskDraft} onChange={(e) => setTaskDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLinkedTask()} placeholder="مهمة جديدة لهذا الهدف..." className="flex-1 text-xs" />
                <Btn variant="outline" size="sm" onClick={addLinkedTask} className="shrink-0" style={{ borderColor: `${T.sky}80`, color: T.sky }}><Plus size={13} /> أضف</Btn>
              </div>
            </>
          )}
        </div>

        <div>
          <span className={label} style={{ color: T.muted }}>الخطوات — ما الذي يجعله يتحرّك؟</span>
          <div className="space-y-1">
            {goal.steps.length === 0 ? (
              <p className="py-2 text-[11px]" style={{ color: T.faint }}>لا خطوات بعد. أول خطوة صغيرة تكفي لبدء الحركة.</p>
            ) : (
              goal.steps.map((s, i) => (
                <div key={s.id} className="group flex items-center gap-1 rounded-lg border transition-all" style={{ borderColor: "transparent", background: s.done ? `${T.primary}0F` : "transparent" }}>
                  <Checkbox checked={s.done} onToggle={() => onPatch({ steps: goal.steps.map((x) => x.id === s.id ? { ...x, done: !x.done } : x) })} label={s.text} tint={T.primary} size="sm" />
                  <button onClick={() => onPatch({ steps: goal.steps.filter((x) => x.id !== s.id) })} aria-label={`حذف ${s.text}`} className="shrink-0 rounded p-1.5 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={12} /></button>
                  <span className="sr-only">خطوة {i + 1}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Field value={step} onChange={(e) => setStep(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStep()} placeholder="خطوة جديدة" className="flex-1" />
            <Btn variant="default" size="sm" onClick={addStep} className="shrink-0"><Plus size={13} strokeWidth={3} /> أضف</Btn>
          </div>
        </div>

        <CollapsibleSection icon={AlertTriangle} tint={T.danger} title="العقبات المتوقعة (Pre-mortem)" count={(goal.obstacles || []).length}>
          <p className="mt-1 mb-3 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>تخيل أنك فشلت في هذا الهدف. ما هو السبب الأكبر؟ سجله هنا وضع خطة لتجاوزه قبل أن يحدث.</p>
          <div className="space-y-2 mb-3">
            {(goal.obstacles || []).map((obs, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 text-[11.5px]">
                <span className="text-white/80">{obs}</span>
                <button onClick={() => onPatch({ obstacles: goal.obstacles.filter((_, idx) => idx !== i) })} className="text-white/30 hover:text-red-400"><X size={12} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Field value={obstacleDraft} onChange={(e) => setObstacleDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addObstacle()} placeholder="مثال: الانشغال بالعمل، أو التعب بعد الظهر..." className="flex-1 text-xs" />
            <Btn variant="danger" size="sm" onClick={addObstacle} className="shrink-0"><Plus size={13} /> أضف</Btn>
          </div>
        </CollapsibleSection>

        <CollapsibleSection icon={History} tint={T.sky} title="المراجعة الأسبوعية" count={(goal.reviews || []).length}>
          <p className="mt-1 mb-3 text-[10.5px] leading-relaxed" style={{ color: T.faint }}>سجل هنا ما تعلمته هذا الأسبوع. كيف كان أداؤك؟ وما الذي ستفعله بشكل مختلف الأسبوع القادم؟</p>
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
            {(goal.reviews || []).length === 0 && <p className="text-center text-[10.5px] text-white/30 py-2">لا توجد مراجعات بعد.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Field as="textarea" rows={2} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="أضف مراجعة لهذا الأسبوع..." className="text-xs resize-none" />
            <Btn variant="default" size="sm" onClick={commitReview} className="self-end">حفظ المراجعة</Btn>
          </div>
        </CollapsibleSection>

        <CollapsibleSection icon={Settings} tint={T.muted} title="الإعدادات" defaultOpen={isNew}>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className={`${label} flex items-center gap-1.5`} style={{ color: T.muted }}>الأفق <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${h.tint}1A`, color: h.tint }}><h.icon size={10} /> {h.label}</span></span>
              <div className="grid grid-cols-3 gap-1.5">
                {HORIZONS.map((x) => {
                  const on = x.id === goal.horizon;
                  return <button key={x.id} type="button" onClick={() => on ? undefined : onPatch({ horizon: x.id, parent: null })} aria-pressed={on} className="rounded-xl border px-2 py-2 text-[10.5px] font-bold transition-all" style={{ borderColor: on ? `${x.tint}80` : T.border, background: on ? `${x.tint}1F` : "rgba(255,255,255,0.03)", color: on ? x.tint : T.muted }}>{x.short}</button>;
                })}
              </div>
            </div>

            <div>
              <span className={label} style={{ color: T.muted }}>{goal.horizon === "quarter" ? "الربع والسنة" : "السنة"}</span>
              <div className="flex items-center gap-1.5">
                {goal.horizon === "quarter" && (
                  <div className="flex flex-1 gap-1.5">
                    {QUARTERS.map((q) => {
                      const on = q.id === goal.quarter;
                      return <button key={q.id} type="button" onClick={() => onPatch({ quarter: q.id })} aria-pressed={on} className="flex-1 rounded-xl border py-2 text-[10.5px] font-bold transition-all" style={{ borderColor: on ? `${q.tint}80` : T.border, background: on ? `${q.tint}1F` : "rgba(255,255,255,0.03)", color: on ? q.tint : T.muted }} title={q.months}>{q.id.toUpperCase()}</button>;
                    })}
                  </div>
                )}
                {goal.horizon !== "h3" && (
                  <select value={goal.year} onChange={(e) => onPatch({ year: +e.target.value })} dir="ltr" aria-label="السنة" className={`rounded-xl border py-2 text-[12px] font-extrabold tabular-nums outline-none transition-colors focus:border-white/30 ${goal.horizon === "quarter" ? "w-20 shrink-0 px-2 text-center" : "flex-1 px-3"}`} style={{ borderColor: `${T.accent}80`, background: T.cardSolid, color: T.accent }}>
                    {deskYears.map((y) => <option key={y} value={y} style={{ background: T.cardSolid }}>{y}</option>)}
                  </select>
                )}
                {goal.horizon === "h3" && <p className="flex-1 rounded-xl border px-3 py-2 text-center text-[10.5px] font-bold" style={{ borderColor: T.border, color: T.faint }}>{ARC_LABEL}</p>}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <span className={label} style={{ color: T.muted }}>الركيزة</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PILLARS.map((x) => {
                const on = x.id === goal.pillar;
                const XIcon = x.icon;
                return <button key={x.id} type="button" onClick={() => onPatch({ pillar: x.id })} aria-pressed={on} className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all" style={{ borderColor: on ? `${x.tint}80` : T.border, background: on ? `${x.tint}1F` : "rgba(255,255,255,0.03)", color: on ? x.tint : T.muted }}><XIcon size={14} strokeWidth={2} />{x.label}</button>;
              })}
            </div>
          </div>

          {want && (
            <div className="mt-4">
              <label htmlFor="los-gd-parent" className={label} style={{ color: T.muted }}>يخدم هدف «{horizonOf(want).label}»</label>
              <select id="los-gd-parent" value={goal.parent || ""} onChange={(e) => onPatch({ parent: e.target.value || null })} className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-white/30" style={{ borderColor: T.border, color: T.muted }}>
                <option value="" style={{ background: T.cardSolid }}>— لا يخدم شيئًا بعد —</option>
                {options.map((g) => <option key={g.id} value={g.id} style={{ background: T.cardSolid }}>{g.text}</option>)}
              </select>
              {options.length === 0 && <p className="mt-1.5 text-[10.5px]" style={{ color: T.accent }}>لا أهداف في أفق «{horizonOf(want).label}» بعد — أضف واحدًا أولًا ليصبح لهذا الهدف ما يخدمه.</p>}
            </div>
          )}

          <div className="mt-4">
            <label htmlFor="los-gd-deadline" className={`${label} flex items-center gap-1.5`} style={{ color: T.muted }}>موعد نهائي <span style={{ color: T.faint }}>(اختياري)</span><DeadlineChip day={goalEnd(goal)} done={goal.done} /></label>
            <div className="flex items-center gap-2">
              <DateField id="los-gd-deadline" value={goal.deadline} onChange={(v) => onPatch({ deadline: v })} />
              {goal.deadline && <Btn variant="ghost" size="sm" onClick={() => onPatch({ deadline: "" })} style={{ borderColor: T.border }}><X size={13} /> امسح</Btn>}
            </div>
            <p className="mt-1.5 text-[10.5px]" style={{ color: T.faint }}>بلا موعد، ينتهي الهدف مع نهاية نافذته: <span dir="ltr">{goalEnd(goal)}</span>.</p>
          </div>
        </CollapsibleSection>

        {kids.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ borderColor: `${T.sky}3D`, background: `${T.sky}0F` }}>
            <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: T.sky }}><Layers size={14} /> ما يخدم هذا الهدف</p>
            <div className="mt-2.5 space-y-1.5">
              {kids.map((k) => {
                const kp = goalPct(k, all, habits);
                return (
                  <div key={k.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: k.done ? T.primary : pillarOf(k.pillar).tint }} />
                    <span className="min-w-0 flex-1 truncate text-[11.5px]" style={{ color: k.done ? T.muted : T.fg, textDecorationLine: k.done ? "line-through" : "none" }}>{k.text}</span>
                    <span dir="ltr" className="shrink-0 text-[10.5px] font-bold tabular-nums" style={{ color: kp >= 100 ? T.primary : T.faint }}>{kp}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Btn variant="danger" size="sm" className="w-full" onClick={() => { if (window.confirm(kids.length ? `حذف «${goal.text}»؟ ${kids.length} هدفًا يخدمه ستبقى لكن بلا ارتباط.` : `حذف «${goal.text}»؟`)) onDelete(); }}><Trash2 size={13} /> احذف الهدف</Btn>
      </div>
    </Modal>
  );
}

const ARC_LABEL = "٢٠٢٧ — ٢٠٣٠";

const UNIT_SUGGESTIONS = ["كتاب", "صفحة", "ساعة", "مرة", "ريال", "كيلومتر"];

function DeadlineChip({ day, done }) {
  const left = daysTo(day);
  if (left === null) return null;
  const over = left < 0;
  const tint = done ? T.primary : over ? T.danger : left <= 7 ? T.cta : left <= 30 ? T.accent : T.faint;
  const n = Math.abs(over ? left : left);
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: `${tint}1A`, color: tint }} title={day}>
      <Hourglass size={9} />
      {left === 0 ? "اليوم آخر يوم" : over ? <>فات قبل <span dir="ltr" className="tabular-nums">{n}</span> {dayWord(n)}</> : <>بقي <span dir="ltr" className="tabular-nums">{n}</span> {dayWord(n)}</>}
    </span>
  );
}

export function horizonClock(id, all, year, quarter) {
  const [from, to] = windowOf(id, year, quarter);
  const stand = windowStand(from, to);
  const list = all.filter((g) => g.horizon !== id ? false : id === "quarter" ? g.quarter === quarter && g.year === year : id === "year" ? g.year === year : true);
  const hit = list.length ? Math.round(list.reduce((n, g) => n + goalPct(g, all), 0) / list.length) : 0;
  const done = list.filter((g) => g.done).length;
  const judged = stand.state === "live" && list.length > 0;
  const drift = hit - stand.pct;
  return {
    ...stand, from, to, goals: list.length, done, hit, drift,
    pace: !judged ? null : drift >= DRIFT_BAND ? { label: "متقدّم", tint: T.primary } : drift <= -DRIFT_BAND ? { label: "متأخّر", tint: T.danger } : { label: "على المسار", tint: T.accent },
  };
}

export const clockLabel = (id, year, quarter) =>
  id === "h3"
    ? ARC_LABEL
    : id === "year"
      ? String(year)
      : `${quarterOf(quarter).label} · ${year}`;