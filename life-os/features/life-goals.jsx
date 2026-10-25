import { Badge, Btn, Card, Checkbox, DateField, Field, Modal, ProgressRing, T, dayWord, useBurst, useUndo, useHoverDelete } from "../components/life-shared.jsx";
import { GOAL_YEARS, HORIZONS, PILLARS, QUARTERS, VISION_MAX, WORD_MAX, YEAR_MIN, currentQuarter, daysTo, goalEnd, goalPct, goalPace, goalShape, horizonOf, nextOrder, streakRunFrom, treeGrowth, GROWTH_STAGES, openingWindow, parentHorizon, pillarOf, quarterOf, rows, taskShape, uid, windowOf, windowStand, yearQuarters } from "../state/life-state.mjs";
import { AlertTriangle, Calendar, Check, ChevronDown, ChevronUp, Compass, Flag, Gauge, Hourglass, Layers, Lightbulb, Link2, ListChecks, Minus, Plus, Search, Settings, SquarePen, Trash2, TrendingDown, TrendingUp, X, XCircle, History, Target, Sparkles, PieChart, Activity, Network, PartyPopper, Sprout, GripVertical, Star, Edit3, Command, CheckCircle2, Keyboard, Brain, Clock, Zap, ArrowLeft, Rocket, Timer } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// 👇 دالة حساب زخم العادات (آخر 7 أيام) 👇
function calculateHabitMomentum(goal, history) {
  const linked = goal.linkedHabits || [];
  if (linked.length === 0) return null;
  
  let completedCount = 0;
  const totalPossible = linked.length * 7;
  
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    
    const dayRow = (history || []).find(h => h.date === dateStr);
    if (dayRow && Array.isArray(dayRow.done)) {
      linked.forEach(hid => {
        if (dayRow.done.includes(hid)) completedCount++;
      });
    }
  }
  
  return Math.round((completedCount / totalPossible) * 100);
}

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
  
  const [showAllMonthly, setShowAllMonthly] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false); 
  const [pendingDeskId, setPendingDeskId] = useState(null);
  const [draggedMonthlyId, setDraggedMonthlyId] = useState(null);

  const [monthlyTitle, setMonthlyTitle] = useState(() => {
    return localStorage.getItem("life_monthly_title") || "أهداف الشهر الحالي";
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(monthlyTitle);

  const hoveredGoalIdRef = useRef(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [calibrationOpen, setCalibrationOpen] = useState(false);

  // سجل الالتزام السلوكي للأهداف (WIG Spotlight, Cost of Failure, Identity, Confidence, Paused)
  const [commitStore, setCommitStore] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("los_goals_commitment_engine_v1") || "{}");
    } catch {
      return {};
    }
  });

  const updateCommitStore = useCallback((patchObj) => {
    setCommitStore((prev) => {
      const next = { ...prev, ...patchObj };
      try {
        localStorage.setItem("los_goals_commitment_engine_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updateGoalCommitMeta = useCallback((goalId, fields) => {
    if (!goalId) return;
    setCommitStore((prev) => {
      const prevGoal = prev[goalId] || {};
      const next = {
        ...prev,
        [goalId]: {
          ...prevGoal,
          ...fields,
          lastTouchedAt: new Date().toISOString().slice(0, 10),
        },
      };
      try {
        localStorage.setItem("los_goals_commitment_engine_v1", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const flashGoalToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const saveTitle = () => {
    setMonthlyTitle(tempTitle);
    localStorage.setItem("life_monthly_title", tempTitle);
    setIsEditingTitle(false);
  };

  const DEFAULT_ORDER = ["searchBar", "yearInPixels", "analysis", "wheel", "upcoming"];
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

  const patch = useCallback((id, fields) =>
    setState((s) => ({
      ...s,
      goals: (s.goals || []).map((g) =>
        g.id === id ? goalShape({ ...goalShape(g), ...fields }) : g,
      ),
    })), [setState]);

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

  const toggleTask = useCallback((taskId) => {
    setState((s) => ({
      ...s,
      tasks: (s.tasks || []).map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      ),
    }));
  }, [setState]);

  const addTaskToGoal = useCallback((goalId, text) => {
    if (!text.trim()) return;
    setState((s) => ({
      ...s,
      tasks: [
        ...(s.tasks || []),
        taskShape({
          text: text.trim(),
          quadrant: "q2",
          linkedGoalId: goalId,
          order: nextOrder(s.tasks, "q2"),
        }),
      ],
    }));
  }, [setState]);

  // إرسال الخطوة الفيزيائية القادمة مباشرة إلى أهم الثلاث مهام في شاشة «اليوم»
  const dispatchNextActionToToday = useCallback((goal, customText) => {
    if (!goal) return;
    const actionText = (customText ?? goal.nextAction ?? "").trim();
    if (!actionText) {
      flashGoalToast("اكتب الخطوة الفيزيائية القادمة أولاً لتثبيتها في يومك ⚡");
      return;
    }
    setState((s) => ({
      ...s,
      goals: (s.goals || []).map((g) =>
        g.id === goal.id ? goalShape({ ...goalShape(g), nextAction: actionText }) : g
      ),
      tasks: [
        taskShape({
          text: `🎯 [${goal.text.slice(0, 28)}] — ${actionText}`,
          quadrant: "q1",
          top: true,
          done: false,
          linkedGoalId: goal.id,
          order: nextOrder(s.tasks, "q1"),
        }),
        ...(s.tasks || []),
      ],
    }));
    updateGoalCommitMeta(goal.id, { lastDispatchedAction: actionText });
    flashGoalToast("🚀 تم إرسال الخطوة إلى «الثلاث الأهم» في شاشة اليوم!");
  }, [setState, updateGoalCommitMeta, flashGoalToast]);

  const desk = deskId ? byId.get(deskId) : null;
  const celebrateGoal = celebrateId ? byId.get(celebrateId) : null;

  const quartersShown = useMemo(() => yearQuarters(year, all), [year, all]);

  const pickYear = (y) => {
    setYear(y);
    const qs = yearQuarters(y, all);
    if (!qs.some((q) => q.id === quarter)) setQuarter(qs[0].id);
  };

  const handleHover = useCallback((id) => {
    hoveredGoalIdRef.current = id;
  }, []);

  useEffect(() => {
    if (pendingDeskId) {
      setDeskId(pendingDeskId);
      setPendingDeskId(null);
    }
  }, [pendingDeskId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        e.stopPropagation();

        const targetId = deskId ? deskId : hoveredGoalIdRef.current;
        
        if (targetId) {
          patch(targetId, { isMonthlyFocus: true });
          setToastMsg("تم إضافة الهدف إلى قائمة الشهر! ⭐");
          setTimeout(() => setToastMsg(null), 3000);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deskId, patch]);

  const monthlyGoalsRaw = all.filter(g => g.isMonthlyFocus && !g.done);
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  const monthlyGoals = [...monthlyGoalsRaw].sort((a, b) => {
    if (a.monthlyOrder !== undefined && b.monthlyOrder !== undefined) {
      return a.monthlyOrder - b.monthlyOrder;
    }
    if (a.monthlyOrder !== undefined) return -1;
    if (b.monthlyOrder !== undefined) return 1;
    return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
  });

  const handleMonthlyDragStart = (e, id) => {
    setDraggedMonthlyId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleMonthlyDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleMonthlyDragEnd = () => {
    setDraggedMonthlyId(null);
  };

  const handleMonthlyDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedMonthlyId || draggedMonthlyId === targetId) return;

    const currentGoals = [...monthlyGoals];
    const fromIdx = currentGoals.findIndex(g => g.id === draggedMonthlyId);
    const toIdx = currentGoals.findIndex(g => g.id === targetId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const [moved] = currentGoals.splice(fromIdx, 1);
      currentGoals.splice(toIdx, 0, moved);

      const orderMap = {};
      currentGoals.forEach((g, index) => {
        orderMap[g.id] = index;
      });

      setState(s => ({
        ...s,
        goals: s.goals.map(g => {
          if (orderMap[g.id] !== undefined) {
            return { ...g, monthlyOrder: orderMap[g.id] };
          }
          return g;
        })
      }));
    }
    setDraggedMonthlyId(null);
  };

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
    "upcoming": {
      title: "الأقرب أجلًا",
      element: <UpcomingDeadlinesCard goals={all} />,
      colSpan: "lg:col-span-1",
    },
  };

  return (
    <div className="space-y-8 pb-20">
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={20} />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

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

              <button
                type="button"
                onClick={() => setCalibrationOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-1.5 text-[11.5px] font-extrabold text-amber-300 transition-all hover:bg-amber-500/25 shadow-lg"
              >
                <Timer size={14} /> معايرة الأسبوع (60 ثانية) ⚡
              </button>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center bg-black/20 p-4 rounded-3xl border border-white/5">
             <ProgressRing value={pct} size={110} stroke={8} label="إنجاز الأفق" />
          </div>
        </div>
      </Card>

      {/* 1️⃣ بؤرة الهدف القائد الشمالي (The North Star / WIG Spotlight) */}
      <WigSpotlightCard
        all={all}
        habits={state.habits || []}
        history={state.history || []}
        commitStore={commitStore}
        onSelectWig={(goalId) => updateCommitStore({ activeWigId: goalId })}
        onUpdateGoalMeta={updateGoalCommitMeta}
        onPatchGoal={patch}
        onSendToToday={dispatchNextActionToToday}
        onOpenGoal={(id) => setDeskId(id)}
        onOpenCalibration={() => setCalibrationOpen(true)}
      />

      {/* 3️⃣ رادار إنقاذ الأهداف الراكدة وتفكيك المقاومة (Goal CPR & Friction Buster) */}
      <GoalCprBanner
        all={all}
        scoped={scoped}
        habits={state.habits || []}
        history={state.history || []}
        commitStore={commitStore}
        onUpdateGoalMeta={updateGoalCommitMeta}
        onPatchGoal={patch}
        onSendToToday={dispatchNextActionToToday}
        onOpenGoal={(id) => setDeskId(id)}
        onToast={flashGoalToast}
      />

      <NorthStarCard
        value={state.northStar}
        onSave={(northStar) => setState((s) => ({ ...s, northStar }))}
      />

      <WhatIfSimulatorCard state={state} all={all} />

      <Card className="p-0 border-amber-500/20 bg-[#111] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-5 border-b border-white/5 bg-gradient-to-l from-white/[0.02] to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Star size={20} className="text-amber-400 fill-amber-400" />
            </div>
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                    autoFocus
                    className="bg-black/50 border border-amber-500/50 rounded-lg px-2 py-1 text-[16px] font-bold text-white outline-none"
                  />
                  <button onClick={saveTitle} className="text-emerald-400 hover:text-emerald-300"><Check size={16} /></button>
                </div>
              ) : (
                <h3 
                  className="text-[18px] font-extrabold text-white flex items-center gap-2 cursor-pointer group/title"
                  onClick={() => { setTempTitle(monthlyTitle); setIsEditingTitle(true); }}
                  title="اضغط لتعديل الاسم"
                >
                  {monthlyTitle}
                  <Edit3 size={14} className="text-white/20 group-hover/title:text-amber-400 transition-colors" />
                </h3>
              )}
              <p className="text-[12px] text-white/50 mt-0.5 font-bold">أهدافك المركزية لهذا الشهر — اضغط على أي هدف لفتح تفاصيله.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] transition-colors shadow-lg shadow-indigo-900/20"
            >
              <Brain size={14} /> تحليل شامل
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 shadow-inner">
              <Keyboard size={14} className="text-amber-400" />
              <span className="text-[11px] font-bold text-white">Alt + <span className="text-amber-400">S</span></span>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-5">
          {monthlyGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
              <Star size={32} className="mb-3 text-amber-500/20" />
              <p className="text-[14px] font-bold text-white/60">لا توجد أهداف شهرية بعد.</p>
              <p className="text-[12px] text-white/40 mt-1">حط الماوس على أي هدف في الأسفل واضغط <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold border border-white/20">Alt + S</kbd>، أو اضغط النجمة ⭐ بجانبه.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {(showAllMonthly ? monthlyGoals : monthlyGoals.slice(0, 4)).map(g => {
                const p = pillarOf(g.pillar);
                const Icon = p.icon;
                
                const priorityStyles = {
                  critical: { cardBg: "bg-red-500/[0.08] border-red-500/30 shadow-[0_4px_20px_-10px_rgba(239,68,68,0.3)] hover:bg-red-500/[0.12] hover:border-red-500/50", text: '#ef4444' },
                  high: { cardBg: "bg-orange-500/[0.08] border-orange-500/30 shadow-[0_4px_20px_-10px_rgba(249,115,22,0.3)] hover:bg-orange-500/[0.12] hover:border-orange-500/50", text: '#f97316' },
                  medium: { cardBg: "bg-yellow-500/[0.08] border-yellow-500/30 shadow-[0_4px_20px_-10px_rgba(234,179,8,0.3)] hover:bg-yellow-500/[0.12] hover:border-yellow-500/50", text: '#eab308' },
                  low: { cardBg: "bg-emerald-500/[0.08] border-emerald-500/30 shadow-[0_4px_20px_-10px_rgba(16,185,129,0.3)] hover:bg-emerald-500/[0.12] hover:border-emerald-500/50", text: '#10b981' }
                };
                const pStyle = priorityStyles[g.priority || 'medium'];
                const pct = goalPct(g, all, state.habits || []);
                const momentum = calculateHabitMomentum(g, state.history || []);
                
                return (
                  <div 
                    key={g.id} 
                    onDragOver={handleMonthlyDragOver}
                    onDrop={(e) => handleMonthlyDrop(e, g.id)}
                    onClick={() => setDeskId(g.id)}
                    className={`group relative flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-300 ${
                      pStyle.cardBg
                    } ${draggedMonthlyId === g.id ? 'opacity-40 border-amber-500/50 scale-[0.99]' : ''}`}
                  >
                    <div className="absolute right-0 top-3 bottom-3 w-1 rounded-l-full" style={{ backgroundColor: pStyle.text }} />
                    
                    <div 
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); handleMonthlyDragStart(e, g.id); }}
                      onDragEnd={(e) => { e.stopPropagation(); handleMonthlyDragEnd(); }}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden sm:flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 transition-colors px-1"
                    >
                      <GripVertical size={16} />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 sm:w-[160px]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm" style={{ backgroundColor: `${p.tint}20`, color: p.tint, border: `1px solid ${p.tint}30` }}>
                        <Icon size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-extrabold" style={{ color: p.tint }}>{p.label}</span>
                        <select
                          onClick={(e) => e.stopPropagation()}
                          value={g.priority || 'medium'}
                          onChange={(e) => patch(g.id, { priority: e.target.value })}
                          className="bg-transparent text-[10px] font-bold outline-none cursor-pointer border-none p-0 mt-0.5 appearance-none hover:text-white transition-colors"
                          style={{ color: pStyle.text }}
                        >
                          <option value="critical" style={{ color: '#ef4444', background: '#1a1a1a' }}>أولوية قصوى</option>
                          <option value="high" style={{ color: '#f97316', background: '#1a1a1a' }}>أولوية عالية</option>
                          <option value="medium" style={{ color: '#eab308', background: '#1a1a1a' }}>أولوية متوسطة</option>
                          <option value="low" style={{ color: '#10b981', background: '#1a1a1a' }}>أولوية منخفضة</option>
                        </select>
                        
                        {momentum !== null && (
                          <div 
                            className="flex items-center gap-1 mt-1 text-[9px] font-bold cursor-help" 
                            title="نسبة التزامك بالعادات المرتبطة بهذا الهدف في آخر 7 أيام"
                            style={{ color: momentum >= 70 ? '#10b981' : momentum >= 40 ? '#eab308' : '#ef4444' }}
                          >
                            <Activity size={9} /> 
                            <span>زخم {momentum}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="flex-1 text-[13px] font-bold text-white/90 leading-relaxed break-words pr-2">
                      {g.text}
                    </h4>

                    <div className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: p.tint }} />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums text-white/50 w-6">{pct}%</span>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); patch(g.id, { isMonthlyFocus: false }); }}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                        title="إزالة"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {monthlyGoals.length > 4 && (
                <button
                  onClick={() => setShowAllMonthly(!showAllMonthly)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 py-2.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  {showAllMonthly ? (
                    <>
                      <ChevronUp size={14} /> عرض أقل
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> عرض بقية الأهداف ({monthlyGoals.length - 4})
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

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
                        tasks={state.tasks || []}
                        habits={state.habits || []}
                        history={state.history || []}
                        parent={g.parent ? byId.get(g.parent) : null}
                        kids={kidsOf.get(g.id) || []}
                        commitMeta={commitStore[g.id]}
                        onPatchGoal={(fields) => patch(g.id, fields)}
                        onSendToToday={(txt) => dispatchNextActionToToday(g, txt)}
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
                        onHover={handleHover} 
                        onToggleMonthly={() => patch(g.id, { isMonthlyFocus: !g.isMonthlyFocus })}
                      />
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
        commitMeta={desk ? commitStore[desk.id] : null}
        onUpdateCommitMeta={(fields) => updateGoalCommitMeta(deskId, fields)}
        onSendToToday={(txt) => dispatchNextActionToToday(desk, txt)}
        onClose={() => {
          setDeskId(null);
          setNewGoalId(null);
        }}
        onPatch={(fields) => patch(deskId, fields)}
        onAddTask={(text) => addTaskToGoal(deskId, text)}
        onToggleTask={toggleTask}
        onDelete={() => {
          remove(deskId);
          setDeskId(null);
        }}
      />

      <MonthlyReviewModal 
        isOpen={isReviewOpen} 
        onClose={() => setIsReviewOpen(false)} 
        goals={monthlyGoals} 
        all={all}
        tasks={state.tasks || []}
        history={state.history || []}
        title={monthlyTitle}
        onOpenGoal={(id) => {
          setIsReviewOpen(false); 
          setPendingDeskId(id);
        }}
      />

      <WeeklyCalibrationModal
        open={calibrationOpen}
        onClose={() => setCalibrationOpen(false)}
        all={all}
        monthlyGoals={monthlyGoals}
        habits={state.habits || []}
        commitStore={commitStore}
        onUpdateGoalMeta={updateGoalCommitMeta}
        onPatchGoal={patch}
        onSendToToday={dispatchNextActionToToday}
        onToast={flashGoalToast}
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

function MonthlyReviewModal({ isOpen, onClose, goals, all, tasks, history, title, onOpenGoal }) {
  if (!isOpen) return null;

  const totalGoals = goals.length;
  if (totalGoals === 0) return null;

  const totalProgress = goals.reduce((sum, g) => sum + goalPct(g, all, []), 0);
  const avgProgress = Math.round(totalProgress / totalGoals);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const timeProgress = Math.round((currentDay / daysInMonth) * 100);
  const isTimeAhead = timeProgress > avgProgress;

  let totalMomentum = 0;
  let momentumCount = 0;
  
  const goalsWithStats = goals.map(g => {
    const pct = goalPct(g, all, []);
    const momentum = calculateHabitMomentum(g, history);
    if (momentum !== null) {
      totalMomentum += momentum;
      momentumCount++;
    }
    return { goal: g, pct, momentum };
  });

  const avgMomentum = momentumCount > 0 ? Math.round(totalMomentum / momentumCount) : 0;

  let healthScore = avgProgress * 0.4;
  healthScore += (timeProgress === 0 ? 100 : Math.min(100, (avgProgress / timeProgress) * 100)) * 0.3;
  healthScore += avgMomentum * 0.3;
  healthScore = Math.round(healthScore);

  const pillarsStats = PILLARS.map(p => {
    const pillarGoals = goals.filter(g => g.pillar === p.id);
    if (pillarGoals.length === 0) return { ...p, pct: 0, count: 0 };
    const sum = pillarGoals.reduce((acc, g) => acc + goalPct(g, all, []), 0);
    return { ...p, pct: Math.round(sum / pillarGoals.length), count: pillarGoals.length };
  }).filter(p => p.count > 0);

  const needsAttention = goalsWithStats
    .filter(g => g.pct < timeProgress || (g.momentum !== null && g.momentum < 40))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  const doingGreat = goalsWithStats
    .filter(g => !needsAttention.find(n => n.goal.id === g.goal.id))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  const weakestPillar = [...pillarsStats].sort((a, b) => a.pct - b.pct)[0];
  let smartInsight = "";
  if (needsAttention.length > 0) {
    smartInsight = `ركيزة "${weakestPillar.label}" هي الأضعف حالياً (${weakestPillar.pct}%). هدفك "${needsAttention[0].goal.text.slice(0, 20)}..." يحتاجك اليوم. ابدأ بخطوتك القادمة فوراً.`;
  } else {
    smartInsight = "أداءك ممتاز جداً! أنت متوازن في جميع الركائز. حافظ على هذا الزخم ولا تضف أهدافاً جديدة حتى تُنهي الحالية.";
  }

  return (
    <Modal open={isOpen} onClose={onClose} title={`مركز القيادة: ${title}`} wide>
      <div className="space-y-6 py-2">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/30 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <h3 className="text-[13px] font-bold text-indigo-200 mb-2 flex items-center gap-1"><Activity size={14} /> درجة الصحة العامة</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">{healthScore}</span>
              <span className="text-sm font-bold text-indigo-400">/ 100</span>
            </div>
            <p className="text-[11px] font-bold text-white/50 mt-1">
              {healthScore >= 80 ? "أداء أسطوري 🔥" : healthScore >= 50 ? "أداء جيد، يحتاج تركيز ⚡" : "تحتاج إعادة ترتيب أولوياتك ⚠️"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/20 border border-white/5 flex flex-col justify-center">
            <p className="text-[12px] font-bold text-white/70 mb-3 flex items-center gap-1.5"><Clock size={14}/> إيقاع الشهر (الوقت مقابل الإنجاز)</p>
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-white/50">مضى: {timeProgress}%</span>
              <span className={isTimeAhead ? "text-amber-400" : "text-emerald-400"}>أنجزت: {avgProgress}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div style={{ width: `${timeProgress}%` }} className="h-full bg-white/30 relative">
                 <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/80" />
              </div>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mt-1.5">
              <div style={{ width: `${avgProgress}%` }} className={`h-full ${isTimeAhead ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </div>
            <p className="text-[10px] mt-2 font-bold" style={{ color: isTimeAhead ? '#f59e0b' : '#10b981' }}>
              {isTimeAhead ? "أنت متأخر عن الوقت، تحتاج تسريع الوتيرة." : "خطواتك تواكب أيام الشهر، استمر!"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/20 border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-[12px] font-bold text-white/70 mb-2 flex items-center gap-1.5"><Zap size={14} className="text-amber-400"/> متوسط الزخم (7 أيام)</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">{avgMomentum}</span>
              <span className="text-sm font-bold text-amber-400">%</span>
            </div>
            <p className="text-[10px] text-white/40 mt-2 leading-relaxed">يعتمد على التزامك بالعادات المرتبطة بأهدافك هذا الأسبوع.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
          <h4 className="flex items-center gap-2 text-[14px] font-extrabold text-white/90 mb-4">
            <PieChart size={16} className="text-sky-400" /> توزيع الجهد حسب الركائز
          </h4>
          <div className="space-y-3">
            {pillarsStats.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-24 flex items-center gap-1.5 text-[11px] font-bold shrink-0" style={{ color: p.tint }}>
                  <p.icon size={12} /> {p.label}
                </div>
                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.pct}%`, backgroundColor: p.tint }} />
                </div>
                <div className="w-8 text-left text-[11px] font-extrabold tabular-nums text-white/70 shrink-0">
                  {p.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <h4 className="flex items-center gap-2 text-[14px] font-extrabold text-red-400">
                <AlertTriangle size={16} /> أهم 3 أهداف تحتاج تركيزك
              </h4>
            </div>
            {needsAttention.length > 0 ? (
              <div className="space-y-3 relative z-10">
                {needsAttention.map(({ goal, pct, momentum }) => (
                  <div 
                    key={goal.id} 
                    className="w-full text-right p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-red-500/40 transition-colors block"
                  >
                    <p className="text-[13px] font-bold text-white/90 leading-snug mb-3">{goal.text}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                       <span className="text-[10px] font-bold text-red-300 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">إنجاز: {pct}%</span>
                       {momentum !== null && (
                         <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1"><Activity size={10}/> زخم: {momentum}%</span>
                       )}
                    </div>

                    <button
                      onClick={() => onOpenGoal(goal.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-[11px] font-bold text-white transition-colors"
                    >
                      تحليل الهدف والخطوات <ArrowLeft size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 bg-black/20 rounded-xl">
                <CheckCircle2 size={28} className="text-emerald-500 mb-2 opacity-80" />
                <p className="text-[12px] font-bold text-white/60">كل أهدافك تحت السيطرة!</p>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none" />
            <h4 className="flex items-center gap-2 text-[14px] font-extrabold text-emerald-400 mb-4">
              <TrendingUp size={16} /> نقاط قوتك (ماشي صح)
            </h4>
            {doingGreat.length > 0 ? (
              <div className="space-y-3 relative z-10">
                {doingGreat.map(({ goal, pct, momentum }) => (
                  <div 
                    key={goal.id} 
                    className="w-full text-right p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/40 transition-colors block"
                  >
                    <p className="text-[13px] font-bold text-white/90 leading-snug mb-3">{goal.text}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">إنجاز: {pct}%</span>
                      {momentum !== null && (
                         <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"><Activity size={10}/> زخم: {momentum}%</span>
                       )}
                    </div>

                    <button
                      onClick={() => onOpenGoal(goal.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-[11px] font-bold text-white transition-colors"
                    >
                      تحليل الهدف والخطوات <ArrowLeft size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 bg-black/20 rounded-xl">
                <p className="text-[12px] font-bold text-white/60">لم تصنع زخماً كافياً بعد!</p>
              </div>
            )}
          </div>

        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-100 text-[12.5px] font-bold leading-relaxed flex items-start gap-3">
          <Brain size={18} className="shrink-0 mt-0.5 text-indigo-400" />
          <p>{smartInsight}</p>
        </div>

      </div>
    </Modal>
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

/* ==================================================================== *
 *  👇 التعديل الجديد: خريطة الالتزام التفاعلية (أسبوع / شهر) 👇
 * ==================================================================== */
function GoalHeatmap({ goal, history, allHabits = [] }) {
  const [viewMode, setViewMode] = useState("month"); 
  const [selectedDay, setSelectedDay] = useState(null);
  const linked = goal.linkedHabits || [];

  if (linked.length === 0) return null;

  const today = new Date();
  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const todayStr = formatDate(today);

  // --- Logic for Week View ---
  const weekDays = [];
  const currentDayOfWeek = today.getDay();
  const diffToSaturday = (currentDayOfWeek + 1) % 7;
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - diffToSaturday + i);
    const dateStr = formatDate(d);
    const row = (history || []).find((h) => h.date === dateStr);
    const isFuture = d > today;
    let doneCount = 0;
    if (row && Array.isArray(row.done)) {
      doneCount = linked.filter(id => row.done.includes(id)).length;
    }
    weekDays.push({ date: dateStr, done: doneCount, total: linked.length, isFuture, isToday: dateStr === todayStr });
  }

  // --- Logic for Month View ---
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const lead = (firstDay + 1) % 7;
  
  const monthCells = Array.from({ length: lead }, () => null);
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateStr = formatDate(d);
    const row = (history || []).find((h) => h.date === dateStr);
    const isFuture = d > today;
    let doneCount = 0;
    if (row && Array.isArray(row.done)) {
      doneCount = linked.filter(id => row.done.includes(id)).length;
    }
    monthCells.push({ day: i, dateStr, done: doneCount, total: linked.length, isFuture, isToday: dateStr === todayStr });
  }

  // --- Calculate Best Habit ---
  let bestHabit = null;
  let bestHabitPct = -1;
  if (linked.length > 0 && history) {
    const habitCounts = {};
    linked.forEach(id => habitCounts[id] = { done: 0, total: 0 });

    history.forEach(row => {
      linked.forEach(id => {
        if (row.all && row.all.includes(id)) {
          habitCounts[id].total++;
          if (row.done && row.done.includes(id)) habitCounts[id].done++;
        }
      });
    });

    linked.forEach(id => {
      const c = habitCounts[id];
      if (c.total > 0) {
        const pct = Math.round((c.done / c.total) * 100);
        if (pct > bestHabitPct) {
          bestHabitPct = pct;
          bestHabit = allHabits.find(h => h.id === id);
        }
      }
    });
  }

  return (
    <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
          <Activity size={12} /> نبض الالتزام
        </span>
        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
          <button 
            onClick={() => setViewMode("week")}
            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-colors ${viewMode === "week" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            أسبوع
          </button>
          <button 
            onClick={() => setViewMode("month")}
            className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-colors ${viewMode === "month" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            شهر
          </button>
        </div>
      </div>

      {viewMode === "week" ? (
        <div className="flex justify-between gap-1">
          {weekDays.map((day, i) => {
            const ratio = day.total > 0 ? day.done / day.total : 0;
            const isDone = ratio === 1;
            const isPartial = ratio > 0 && ratio < 1;
            
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <button 
                     onClick={() => setSelectedDay(day)}
                     className={`w-full aspect-square max-w-[28px] rounded-md border flex items-center justify-center transition-all hover:scale-110 ${day.isToday ? 'ring-1 ring-white/50 scale-110 z-10' : ''}`}
                     style={{
                       backgroundColor: isDone ? T.primary : isPartial ? `${T.primary}50` : day.isFuture ? 'transparent' : 'rgba(255,255,255,0.03)',
                       borderColor: day.isToday ? '#fff' : isDone ? T.primary : 'rgba(255,255,255,0.1)',
                     }}
                     title={`${day.date}: ${day.done}/${day.total}`}
                >
                  {isDone ? <Check size={14} className="text-black" strokeWidth={3} /> : 
                   isPartial ? <span className="text-[9px] font-bold text-white">{Math.round(ratio*100)}%</span> : 
                   <span className="text-[10px] font-bold text-white/30">{Number(day.date.slice(-2))}</span>}
                </button>
                <span className="text-[8px] font-bold text-white/40">{["سبت","أحد","اثن","ثلا","أرب","خمي","جمع"][i]}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["س","ح","ن","ث","ر","خ","ج"].map(d => <span key={d} className="text-[8px] font-bold text-white/30">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} />;
              const ratio = cell.total > 0 ? cell.done / cell.total : 0;
              const isDone = ratio === 1;
              const isPartial = ratio > 0 && ratio < 1;
              
              return (
                <button key={cell.dateStr} 
                     onClick={() => setSelectedDay(cell)}
                     className={`aspect-square rounded-[3px] border flex items-center justify-center transition-all hover:scale-110 hover:z-10 ${cell.isToday ? 'ring-1 ring-white scale-110 z-10' : ''}`}
                     style={{
                       backgroundColor: isDone ? T.primary : isPartial ? `${T.primary}50` : cell.isFuture ? 'transparent' : 'rgba(255,255,255,0.03)',
                       borderColor: cell.isToday ? '#fff' : isDone ? T.primary : 'rgba(255,255,255,0.05)',
                     }}
                     title={`${cell.dateStr}: ${cell.done}/${cell.total}`}
                >
                   {isDone ? <Check size={12} className="text-black" strokeWidth={3}/> : 
                    isPartial ? <span className="text-[8px] font-bold text-white">{Math.round(ratio*100)}</span> : 
                    <span className="text-[10px] font-bold text-white/30">{cell.day}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 👇 ملخص أكثر عادة التزمت بها 👇 */}
      {bestHabit && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
          <span className="text-white/50 font-bold flex items-center gap-1"><Star size={10} className="text-amber-400"/> أكثر عادة التزمت بها:</span>
          <span className="text-emerald-400 font-bold truncate max-w-[150px]" title={bestHabit.label}>{bestHabit.label} ({bestHabitPct}%)</span>
        </div>
      )}

      {/* 👇 نافذة التفاصيل (Modal) 👇 */}
      <DayDetailsModal day={selectedDay} onClose={() => setSelectedDay(null)} goal={goal} history={history} allHabits={allHabits} />
    </div>
  );
}

// 👇 مكون نافذة تفاصيل اليوم 👇
function DayDetailsModal({ day, onClose, goal, history, allHabits }) {
  if (!day) return null;
  const row = (history || []).find((h) => h.date === day.dateStr);
  const linked = goal.linkedHabits || [];
  const doneIds = row?.done || [];

  const habitDetails = linked.map(id => {
    const h = allHabits.find(x => x.id === id);
    return { id, label: h ? h.label : "عادة محذوفة", done: doneIds.includes(id) };
  });

  const doneCount = habitDetails.filter(h => h.done).length;
  const totalCount = habitDetails.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Modal open={!!day} onClose={onClose} title={`تفاصيل يوم ${day.dateStr}`}>
       <div className="space-y-4">
         <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
           <div>
             <p className="text-white/50 text-xs font-bold mb-1">معدل الالتزام بهدف "{goal.text}"</p>
             <p className="text-2xl font-black text-emerald-400">{pct}%</p>
           </div>
           <ProgressRing value={pct} size={50} stroke={5} />
         </div>

         <div>
           <p className="text-xs font-bold text-white/50 mb-2">العادات المرتبطة:</p>
           <div className="space-y-2">
             {habitDetails.map(h => (
               <div key={h.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${h.done ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                 {h.done ? <CheckCircle2 size={14} className="text-emerald-400"/> : <XCircle size={14} className="text-red-400"/>}
                 <span className={`text-[12px] font-bold ${h.done ? 'text-emerald-100' : 'text-red-100'}`}>{h.label}</span>
               </div>
             ))}
             {habitDetails.length === 0 && <p className="text-xs text-white/40">لا توجد عادات مرتبطة بهذا الهدف.</p>}
           </div>
         </div>
       </div>
    </Modal>
  );
}

function GoalCard({ goal, all, tasks = [], habits, history, parent, kids, commitMeta, onPatchGoal, onSendToToday, onToggle, onStep, onOpen, onDelete, onHover, onToggleMonthly }) {
  const [burst, fireBurst] = useBurst(700);
  const [quickNextAction, setQuickNextAction] = useState("");
  const p = pillarOf(goal.pillar);
  const pct = goalPct(goal, all, habits);
  const pace = goalPace(goal, all);
  const ripe = pct >= 100 && !goal.done;
  const Icon = p.icon;
  const hoverDelete = useHoverDelete(onDelete);

  const linkedTasks = useMemo(
    () => (tasks || []).filter((t) => t.linkedGoalId === goal.id),
    [tasks, goal.id],
  );
  const activeTodayTasks = useMemo(
    () => linkedTasks.filter((t) => !t.done && (t.today || t.scheduled)),
    [linkedTasks],
  );
  const doneTasksCount = useMemo(
    () => linkedTasks.filter((t) => t.done).length,
    [linkedTasks],
  );

  const priorityMeta = {
    critical: { label: 'أولوية قصوى', color: '#ef4444', bg: 'bg-red-500/5', border: 'border-red-500/30', hover: 'hover:border-red-500/50' },
    high: { label: 'أولوية عالية', color: '#f97316', bg: 'bg-orange-500/5', border: 'border-orange-500/30', hover: 'hover:border-orange-500/50' },
    medium: { label: 'أولوية متوسطة', color: '#eab308', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', hover: 'hover:border-yellow-500/40' },
    low: { label: 'أولوية منخفضة', color: '#10b981', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/40' },
  }[goal.priority || 'medium'];

  const edgeTint = !goal.done && pace.pace?.state === "behind" ? T.danger : !goal.done && pace.pace?.state === "ahead" ? T.primary : null;

  const handle = () => { if (!goal.done) fireBurst(); onToggle(); };

  const handleSaveQuickAction = () => {
    const clean = quickNextAction.trim();
    if (!clean || !onPatchGoal) return;
    onPatchGoal({ nextAction: clean });
    setQuickNextAction("");
  };

  return (
    <div
      {...hoverDelete}
      onMouseEnter={() => onHover && onHover(goal.id)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        goal.done ? "bg-white/[0.02] border-white/5 opacity-70" : `${priorityMeta.bg} ${priorityMeta.border} ${priorityMeta.hover}`
      } ${burst ? "ring-2 ring-emerald-500" : ""}`}
      style={{ 
        borderInlineStart: `3px solid ${priorityMeta.color}`, 
        boxShadow: edgeTint ? `0 0 22px -12px ${edgeTint}` : `0 0 22px -12px ${priorityMeta.color}` 
      }}
    >
      {ripe && <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <button onClick={handle} className={`mt-0.5 shrink-0 flex items-center justify-center h-5 w-5 rounded-md border transition-all ${goal.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}>
            {goal.done && <Check size={12} className="text-black" strokeWidth={3} />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ color: priorityMeta.color, backgroundColor: `${priorityMeta.color}20` }}>
                    {priorityMeta.label}
                  </span>
                  {goal.isMonthlyFocus && (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400">
                      <Star size={9} className="fill-amber-400" /> هدف الشهر
                    </span>
                  )}
                  {commitMeta?.confidence && (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-300">
                      ثقة {commitMeta.confidence}/10
                    </span>
                  )}
                </div>
                <h4 className={`text-[14px] font-bold leading-tight ${goal.done ? 'line-through text-white/40' : 'text-white/90'}`}>{goal.text}</h4>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleMonthly(); }} 
                  className={`p-1 rounded transition-colors ${goal.isMonthlyFocus ? 'text-amber-400' : 'text-white/20 hover:text-amber-400'}`}
                  title={goal.isMonthlyFocus ? "إزالة من أهداف الشهر" : "إضافة لأهداف الشهر"}
                >
                  <Star size={14} className={goal.isMonthlyFocus ? "fill-amber-400" : ""} />
                </button>
                <button onClick={onOpen} className="p-1 text-white/20 hover:text-white/80 transition-colors"><SquarePen size={14} /></button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? T.primary : p.tint, boxShadow: `0 0 10px ${pct >= 100 ? T.primary : p.tint}` }} />
              </div>
              <span className="text-[11px] font-bold tabular-nums text-white/60">{pct}%</span>
            </div>
          </div>
        </div>

        {/* 5️⃣ مرساة الدافع العميق (The Deep Why) على البطاقة */}
        {!goal.done && goal.why && (
          <div className="mb-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[11px] font-bold text-amber-200/90 leading-relaxed">
            🔥 <span className="text-amber-400">لماذا ألتزم؟</span> {goal.why}
          </div>
        )}

        {/* 2️⃣ محرك الفعل الفيزيائي التالي (Next Physical Action Engine) */}
        {!goal.done && (
          goal.nextAction ? (
            <div className="mb-4 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25">
              <div className="flex items-center gap-2 min-w-0">
                <Flag size={14} className="text-orange-400 shrink-0" />
                <span className="text-[12px] font-bold text-orange-200 leading-tight truncate">{goal.nextAction}</span>
              </div>
              {onSendToToday && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSendToToday(goal.nextAction); }}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[10.5px] font-extrabold text-emerald-300 hover:bg-emerald-500/30 transition-all"
                  title="إرسال هذه الخطوة فوراً إلى أهم مهام اليوم"
                >
                  <Zap size={11} /> نفّذها اليوم
                </button>
              )}
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-black/25 p-2">
              <input
                value={quickNextAction}
                onChange={(e) => setQuickNextAction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveQuickAction()}
                placeholder="⚡ حدد خطوة صغيرة (5 دقائق) لتحريك هذا الهدف..."
                className="flex-1 bg-transparent px-2 py-1 text-[11.5px] font-bold text-white placeholder-white/35 outline-none"
              />
              {quickNextAction.trim() && (
                <button
                  type="button"
                  onClick={handleSaveQuickAction}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10.5px] font-extrabold text-white hover:bg-emerald-500"
                >
                  حفظ
                </button>
              )}
            </div>
          )
        )}

        {!goal.done && <GoalHeatmap goal={goal} history={history} allHabits={habits} />}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/50">{p.label}</span>
          {goal.target > 0 && <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400 flex items-center gap-1">{goal.current} / {goal.target} {goal.unit}</span>}
          {goal.steps.length > 0 && <span className="px-2 py-1 rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-400 flex items-center gap-1"><ListChecks size={10} /> {goal.steps.filter(s => s.done).length} خطوات</span>}
          {linkedTasks.length > 0 && (
            <span
              className="px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 border transition-all"
              style={{
                borderColor: activeTodayTasks.length > 0 ? `${T.primary}60` : "rgba(255,255,255,0.08)",
                backgroundColor: activeTodayTasks.length > 0 ? `${T.primary}1A` : "rgba(255,255,255,0.04)",
                color: activeTodayTasks.length > 0 ? T.primaryLift : "rgba(255,255,255,0.65)",
              }}
              title={
                activeTodayTasks.length > 0
                  ? `هذا الهدف يتحرك اليوم! (${activeTodayTasks.length} مهام جارية اليوم)`
                  : `إجمالي المهام التنفيذية المرتبطة بهذا الهدف: ${linkedTasks.length}`
              }
            >
              <Target size={11} style={{ color: activeTodayTasks.length > 0 ? T.primary : T.muted }} />
              <span>
                {linkedTasks.length} {linkedTasks.length === 1 ? "مهمة" : "مهام"}
                {doneTasksCount > 0 ? ` (${doneTasksCount}✓)` : ""}
              </span>
              {activeTodayTasks.length > 0 && (
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-extrabold"
                  style={{ backgroundColor: `${T.primary}33`, color: T.primaryLift }}
                >
                  ⚡ جارية اليوم
                </span>
              )}
            </span>
          )}
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

function GoalDesk({ goal, isNew, all, tasks, habits, history, commitMeta, onUpdateCommitMeta, onSendToToday, onClose, onPatch, onAddTask, onToggleTask, onDelete }) {
  const [step, setStep] = useState("");
  const [obstacleDraft, setObstacleDraft] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [taskDraft, setTaskDraft] = useState("");
  const [linkTab, setLinkTab] = useState("tasks");
  
  const [activeTab, setActiveTab] = useState("overview");

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
  const momentum = calculateHabitMomentum(goal, history);

  const addStep = () => { const text = step.trim(); if (!text) return; onPatch({ steps: [...goal.steps, { id: uid(), text, done: false }] }); setStep(""); };
  const addObstacle = () => { const text = obstacleDraft.trim(); if (!text) return; onPatch({ obstacles: [...(goal.obstacles || []), text] }); setObstacleDraft(""); };
  const commitReview = () => {
    const note = reviewNote.trim(); if (!note) return;
    onPatch({ reviews: [...(goal.reviews || []), { id: uid(), date: new Date().toISOString().split("T")[0], note, progress: pct }] }); setReviewNote("");
  };
  const addLinkedTask = () => { const text = taskDraft.trim(); if (!text) return; onAddTask(text); setTaskDraft(""); };

  const label = "mb-1.5 block text-xs font-bold";
  const priorityColors = {
    critical: { label: 'أولوية قصوى', tint: '#ef4444' },
    high: { label: 'عالية', tint: '#f97316' },
    medium: { label: 'متوسطة', tint: '#eab308' },
    low: { label: 'منخفضة', tint: '#10b981' },
  };

  const TabBtn = ({ id, icon: Icon, label }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-all border-b-2 ${
          active ? "border-amber-500 text-amber-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]"
        }`}
      >
        <Icon size={16} />
        {label}
      </button>
    );
  };

  return (
    <Modal open={!!goal} onClose={onClose} title="" wide onDelete={goal ? onDelete : undefined}>
      <div className="-mt-6">
        
        <div className="relative overflow-hidden rounded-2xl border p-5 mb-6" style={{ borderColor: `${p.tint}30`, background: `linear-gradient(135deg, ${p.tint}15, rgba(0,0,0,0))` }}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg" style={{ backgroundColor: p.tint, color: '#000' }}>
                <p.icon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white leading-tight mb-1">{goal.text}</h2>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-black/30 text-white/70 border border-white/10">{p.label}</span>
                  <span className="px-2 py-0.5 rounded bg-black/30 text-white/70 border border-white/10">أفق {h.short}</span>
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: `${priorityColors[goal.priority || 'medium'].tint}20`, color: priorityColors[goal.priority || 'medium'].tint }}>
                    {priorityColors[goal.priority || 'medium'].label}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-white">{pct}%</span>
                <span className="text-[10px] font-bold text-white/50">إنجاز</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <span className="block text-2xl font-extrabold" style={{ color: momentum >= 70 ? '#10b981' : momentum >= 40 ? '#eab308' : '#ef4444' }}>
                  {momentum !== null ? `${momentum}%` : '-'}
                </span>
                <span className="text-[10px] font-bold text-white/50">زخم</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 border-b border-white/10 overflow-x-auto">
          {goal.isMonthlyFocus && (
            <TabBtn id="monthlyPlan" icon={Rocket} label="تركيز الشهر" />
          )}
          <TabBtn id="overview" icon={Target} label="نظرة عامة" />
          <TabBtn id="tasks" icon={CheckCircle2} label="المهام التنفيذية" />
          <TabBtn id="analytics" icon={PieChart} label="التحليل والالتزام" />
          <TabBtn id="settings" icon={Settings} label="الإعدادات" />
        </div>

        <div className="space-y-5 min-h-[40vh]">
          
          {activeTab === "monthlyPlan" && (
            <div className="animate-fade-in-up space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-transparent border border-indigo-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                  <Timer size={24} className="text-indigo-400 mb-2" />
                  <p className="text-[12px] font-bold text-indigo-200 mb-1">الوقت المتبقي من الشهر</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()}
                    </span>
                    <span className="text-sm font-bold text-indigo-400">يوم</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-black/20 border border-white/5 flex flex-col items-center justify-center text-center">
                  <p className="text-[12px] font-bold text-white/50 mb-2 flex items-center gap-1"><Activity size={14}/> مؤشر الصحة (Health)</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {Math.round(((linkedTasks.filter(t => t.done).length / (linkedTasks.length || 1)) * 30) + 
                                   ((goal.steps.filter(s => s.done).length / (goal.steps.length || 1)) * 30) + 
                                   (momentum || 0) * 0.4)}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">%</span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">يعتمد على المهام، الخطوات، والعادات</p>
                </div>

                <div className="p-5 rounded-2xl bg-black/20 border border-white/5 flex flex-col items-center justify-center text-center">
                  <p className="text-[12px] font-bold text-white/70 mb-2 flex items-center gap-1.5"><Zap size={14} className="text-amber-400"/> الزخم الحالي</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">{momentum !== null ? momentum : 0}</span>
                    <span className="text-sm font-bold text-amber-400">%</span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">التزامك بالعادات المرتبطة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <h4 className="text-[13px] font-bold text-white/80 mb-4 flex items-center gap-2"><CheckCircle2 size={14} className="text-sky-400" /> المهام المرتبطة (أنجزت {linkedTasks.filter(t => t.done).length} من {linkedTasks.length})</h4>
                  <div className="space-y-2 mb-4">
                    {linkedTasks.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/20 border border-white/5 text-[11.5px] cursor-pointer" onClick={() => onToggleTask(t.id)}>
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`h-3.5 w-3.5 rounded border flex shrink-0 items-center justify-center ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>{t.done && <Check size={10} className="text-black" />}</div>
                          <span className={t.done ? "line-through text-white/40" : "text-white/80 truncate"}>{t.text}</span>
                        </div>
                      </div>
                    ))}
                    {linkedTasks.length === 0 && <p className="text-[11px] text-white/40 text-center">لا توجد مهام. أضف من تبويب المهام التنفيذية.</p>}
                  </div>
                  <div className="flex gap-2">
                    <Field value={taskDraft} onChange={(e) => setTaskDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLinkedTask()} placeholder="أضف مهمة..." className="flex-1 text-[11px] bg-black/20 h-8" />
                    <Btn variant="default" size="sm" onClick={addLinkedTask} className="h-8 px-3 text-[11px]"><Plus size={12} /></Btn>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <h4 className="text-[13px] font-bold text-white/80 mb-4 flex items-center gap-2"><Flag size={14} className="text-amber-400" /> الخطوات (أنجزت {goal.steps.filter(s => s.done).length} من {goal.steps.length})</h4>
                  <div className="space-y-2 mb-4">
                    {goal.steps.slice(0, 4).map((s) => (
                      <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5 text-[11.5px]">
                        <Checkbox checked={s.done} onToggle={() => onPatch({ steps: goal.steps.map((x) => x.id === s.id ? { ...x, done: !x.done } : x) })} label={s.text} tint={T.primary} size="sm" />
                      </div>
                    ))}
                    {goal.steps.length === 0 && <p className="text-[11px] text-white/40 text-center">لا توجد خطوات استراتيجية.</p>}
                  </div>
                  <div className="flex gap-2">
                    <Field value={step} onChange={(e) => setStep(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStep()} placeholder="أضف خطوة..." className="flex-1 text-[11px] bg-black/20 h-8" />
                    <Btn variant="default" size="sm" onClick={addStep} className="h-8 px-3 text-[11px]"><Plus size={12} /></Btn>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-[13px] font-bold text-white/80 mb-2 flex items-center gap-2"><History size={14} className="text-sky-400" /> نبض الالتزام</h4>
                <GoalHeatmap goal={goal} history={history} allHabits={habits} />
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="animate-fade-in-up space-y-5">
              {/* 5️⃣ مرساة الدافع العميق وعقد الالتزام الشخصي */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/25">
                  <label htmlFor="los-gd-why" className={`${label} text-amber-400`}>
                    🔥 لماذا هذا الهدف خط أحمر بالنسبة لي؟ (The Deep Why)
                  </label>
                  <Field
                    as="textarea"
                    id="los-gd-why"
                    rows={3}
                    value={goal.why}
                    onChange={(e) => onPatch({ why: e.target.value.slice(0, 400) })}
                    placeholder="اكتب السبب العاطفي الحقيقي الذي يشعل حماسك حين تتعب..."
                    className="resize-none leading-relaxed bg-black/30 border-amber-500/20"
                  />
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="los-gd-next" className="text-xs font-bold text-emerald-400">
                      ⚡ الخطوة الفيزيائية القادمة (5-15 دقيقة)
                    </label>
                    {onSendToToday && goal.nextAction && (
                      <button
                        type="button"
                        onClick={() => onSendToToday(goal.nextAction)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10.5px] font-black text-black hover:bg-emerald-400 transition-all"
                      >
                        <Zap size={11} /> أرسل لشاشة اليوم
                      </button>
                    )}
                  </div>
                  <Field
                    as="textarea"
                    id="los-gd-next"
                    rows={3}
                    value={goal.nextAction}
                    onChange={(e) => onPatch({ nextAction: e.target.value })}
                    placeholder="مثال: قراءة 10 صفحات الآن أو الاتصال بـ..."
                    className="resize-none leading-relaxed bg-black/30 border-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-rose-500/[0.05] border border-rose-500/20">
                  <label className={`${label} text-rose-400`}>
                    ⚠️ ما هي كلفة التقاعس إذا لم أنجزه؟ (Cost of Inaction)
                  </label>
                  <Field
                    as="textarea"
                    rows={2}
                    value={commitMeta?.costOfFailure || ""}
                    onChange={(e) =>
                      onUpdateCommitMeta &&
                      onUpdateCommitMeta({ costOfFailure: e.target.value.slice(0, 300) })
                    }
                    placeholder="مثال: سيمضي هذا العام وأنا في نفس المكان دون تقدم حقيقي..."
                    className="resize-none leading-relaxed bg-black/30 border-rose-500/20 text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl bg-indigo-500/[0.05] border border-indigo-500/20">
                  <label className={`${label} text-indigo-300`}>
                    🧬 هويتي الجديدة بهذا الهدف (Identity Statement)
                  </label>
                  <Field
                    as="textarea"
                    rows={2}
                    value={commitMeta?.identityStatement || ""}
                    onChange={(e) =>
                      onUpdateCommitMeta &&
                      onUpdateCommitMeta({ identityStatement: e.target.value.slice(0, 300) })
                    }
                    placeholder="مثال: أنا شخص ينهي ما يبدأ ويبني إرثه يومياً بانضباط..."
                    className="resize-none leading-relaxed bg-black/30 border-indigo-500/20 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                <p className="text-[12.5px] font-bold mb-3" style={{ color: T.primary }}>الخطوات الاستراتيجية (Steps)</p>
                <div className="space-y-1 mb-3">
                  {goal.steps.map((s, i) => (
                    <div key={s.id} className="group flex items-center gap-1 rounded-lg border transition-all p-1" style={{ borderColor: "transparent", background: s.done ? `${T.primary}0F` : "transparent" }}>
                      <Checkbox checked={s.done} onToggle={() => onPatch({ steps: goal.steps.map((x) => x.id === s.id ? { ...x, done: !x.done } : x) })} label={s.text} tint={T.primary} size="sm" />
                      <button onClick={() => onPatch({ steps: goal.steps.filter((x) => x.id !== s.id) })} className="shrink-0 rounded p-1.5 text-white/25 opacity-40 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Field value={step} onChange={(e) => setStep(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStep()} placeholder="أضف خطوة استراتيجية..." className="flex-1 text-xs bg-black/20" />
                  <Btn variant="default" size="sm" onClick={addStep} className="shrink-0"><Plus size={13} /> أضف</Btn>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="animate-fade-in-up space-y-5">
              <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}>
                <p className="flex items-center gap-2 text-[12.5px] font-bold mb-4" style={{ color: T.primary }}><CheckCircle2 size={14} /> المهام اليومية المرتبطة بالهدف</p>
                
                <div className="space-y-2 mb-4">
                  {linkedTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-black/40 text-[12px] border border-white/5 hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onToggleTask(t.id)}>
                         <div className={`h-4 w-4 rounded border flex shrink-0 items-center justify-center ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/40'}`}>{t.done && <Check size={12} className="text-black" />}</div>
                         <span className={t.done ? "line-through text-white/40" : "text-white/90 font-bold"}>{t.text}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${t.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"}`}>{t.done ? "منجزة" : "قيد الانتظار"}</span>
                    </div>
                  ))}
                  {linkedTasks.length === 0 && (
                    <p className="text-[12px] text-white/40 text-center py-4 bg-black/20 rounded-xl">لا توجد مهام مرتبطة بعد. أضف مهمتك الأولى أدناه!</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Field value={taskDraft} onChange={(e) => setTaskDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLinkedTask()} placeholder="اكتب مهمة جديدة..." className="flex-1 text-sm bg-black/20" />
                  <Btn variant="default" size="sm" onClick={addLinkedTask} className="shrink-0"><Plus size={14} /> إضافة المهمة</Btn>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="animate-fade-in-up space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <h4 className="text-[13px] font-bold text-white/80 mb-3 flex items-center gap-2"><Activity size={14} className="text-sky-400" /> العادات المرتبطة (الأساس)</h4>
                  <div className="flex flex-wrap gap-2">
                    {habits.map((h) => {
                      const isLinked = (goal.linkedHabits || []).includes(h.id);
                      return (
                        <button key={h.id} type="button" onClick={() => { const linked = goal.linkedHabits || []; const next = isLinked ? linked.filter(id => id !== h.id) : [...linked, h.id]; onPatch({ linkedHabits: next }); }} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all text-right" style={{ borderColor: isLinked ? `${T.primary}80` : T.border, background: isLinked ? `${T.primary}1F` : "rgba(255,255,255,0.03)", color: isLinked ? T.primary : T.muted }}>
                          <div className={`h-3.5 w-3.5 rounded-sm border flex shrink-0 items-center justify-center ${isLinked ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>{isLinked && <Check size={10} className="text-black" />}</div>
                          <span className="truncate">{h.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <h4 className="text-[13px] font-bold text-white/80 mb-3 flex items-center gap-2"><History size={14} className="text-amber-400" /> خريطة الالتزام</h4>
                  <GoalHeatmap goal={goal} history={history} allHabits={habits} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-fade-in-up space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <span className={label} style={{ color: T.muted }}>الركيزة</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PILLARS.map((x) => {
                      const on = x.id === goal.pillar;
                      const XIcon = x.icon;
                      return <button key={x.id} type="button" onClick={() => onPatch({ pillar: x.id })} aria-pressed={on} className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all" style={{ borderColor: on ? `${x.tint}80` : T.border, background: on ? `${x.tint}1F` : "rgba(255,255,255,0.03)", color: on ? x.tint : T.muted }}><XIcon size={14} strokeWidth={2} />{x.label}</button>;
                    })}
                  </div>
                </div>
              </div>
              
               <div className="mt-4">
                  <label htmlFor="los-gd-target" className="mb-1 block text-[10px] font-bold" style={{ color: T.faint }}>القياس (خط النهاية)</label>
                  <div className="flex items-stretch overflow-hidden rounded-xl border" style={{ borderColor: T.border }}>
                    <Field id="los-gd-target" type="number" min="0" dir="ltr" value={goal.target || ""} onChange={(e) => { const target = Math.max(0, Math.round(+e.target.value) || 0); onPatch({ target, current: target > 0 ? Math.min(target, goal.current) : goal.current }); }} placeholder="0" className="flex-1 text-center tabular-nums bg-black/20" style={{ borderWidth: 0, borderRadius: 0 }} />
                    <div className="w-px shrink-0" style={{ background: T.border }} />
                    <Field id="los-gd-unit" maxLength={16} value={goal.unit} onChange={(e) => onPatch({ unit: e.target.value })} placeholder="كتاب" className="w-24 shrink-0 text-center bg-black/20" style={{ borderWidth: 0, borderRadius: 0 }} />
                  </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="los-gd-deadline" className={`${label} flex items-center gap-1.5`} style={{ color: T.muted }}>موعد نهائي <span style={{ color: T.faint }}>(اختياري)</span><DeadlineChip day={goalEnd(goal)} done={goal.done} /></label>
                <div className="flex items-center gap-2">
                  <DateField id="los-gd-deadline" value={goal.deadline} onChange={(v) => onPatch({ deadline: v })} />
                  {goal.deadline && <Btn variant="ghost" size="sm" onClick={() => onPatch({ deadline: "" })} style={{ borderColor: T.border }}><X size={13} /> امسح</Btn>}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                <Btn variant="danger" size="sm" onClick={() => { if (window.confirm(`حذف «${goal.text}»؟`)) onDelete(); }}><Trash2 size={13} /> حذف الهدف نهائياً</Btn>
                <Btn variant={goal.done ? "default" : "outline"} size="sm" onClick={() => onPatch({ done: !goal.done })}>
                  <Check size={13} strokeWidth={3} />{goal.done ? "مُحقَّق" : "تحديد كمنجز"}
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

const ARC_LABEL = "٢٠٢٧ — ٢٠٣٠";

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

/* ============================================================================
 * الميزة #5: المحاكي المستقبلي لأهداف 2030 (What-If Trajectory Simulator)
 * ============================================================================ */
function WhatIfSimulatorCard({ state, all }) {
  const [isOpen, setIsOpen] = useState(true);

  // استخراج المعدلات الحقيقية الحالية من بيانات المستخدم
  const baseline = useMemo(() => {
    const history = state.history || [];
    const recent14 = history.slice(-14);
    const avgDisc = recent14.length
      ? Math.round(
          recent14.reduce((sum, h) => sum + (Number(h.pct) || 0), 0) / recent14.length
        )
      : 75;

    // متوسط القراءة اليومي من سجل القراءة أو الكتب
    const readingLogs = Array.isArray(state.reading) ? state.reading : [];
    const totalLoggedPages = readingLogs.slice(-14).reduce((s, r) => s + (Number(r.pages) || 0), 0);
    const basePagesDay = Math.max(5, Math.round(totalLoggedPages / 14) || 12);

    // ساعات العمل العميق أسبوعياً من الجلسات
    const sessions = Array.isArray(state.sessions) ? state.sessions : [];
    const recentMins = sessions
      .slice(0, 30)
      .reduce((s, x) => s + (Number(x.minutes) || 0), 0);
    const baseDeepHoursWeek = Math.max(3, Math.min(35, Math.round(recentMins / 60) || 6));

    // الادخار الشهري التقريبي
    const incTotal = (state.income || [])
      .slice(0, 30)
      .reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const expTotal = (state.expenses || [])
      .slice(0, 30)
      .reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const baseMonthlySave = Math.max(300, Math.round(incTotal - expTotal) || 1000);

    return {
      avgDisc: Math.max(30, Math.min(100, avgDisc)),
      basePagesDay,
      baseDeepHoursWeek,
      baseMonthlySave,
    };
  }, [state.history, state.reading, state.sessions, state.income, state.expenses]);

  const [pagesPerDay, setPagesPerDay] = useState(() => baseline.basePagesDay);
  const [deepHoursWeek, setDeepHoursWeek] = useState(() => baseline.baseDeepHoursWeek);
  const [disciplineSim, setDisciplineSim] = useState(() => baseline.avgDisc);
  const [monthlySave, setMonthlySave] = useState(() => baseline.baseMonthlySave);

  // الأهداف الرقمية القابلة للمحاكاة
  const measurableGoals = useMemo(
    () => (all || []).filter((g) => !g.done && Number(g.target) > 0),
    [all]
  );
  const [selectedGoalId, setSelectedGoalId] = useState(
    () => measurableGoals[0]?.id || ""
  );

  // حسابات المحاكاة حتى نهاية 2030
  const projections = useMemo(() => {
    const daysTo2030 = Math.max(30, daysTo("2030-12-31") || 1500);
    const monthsTo2030 = Math.max(1, Math.round(daysTo2030 / 30.4));
    const weeksTo2030 = Math.max(1, Math.round(daysTo2030 / 7));

    // عامل التسارع بناءً على نسبة الانضباط المحاكاة مقارنة بالحالية
    const consistencyFactor = Math.max(0.4, disciplineSim / 85);

    // 1. الكتب المتوقع إنهاؤها (متوسط الكتاب 260 صفحة)
    const effectivePagesPerDay = Math.round(pagesPerDay * consistencyFactor);
    const booksPerYear = Math.round(((effectivePagesPerDay * 365) / 260) * 10) / 10;
    const totalBooksBy2030 = Math.round((effectivePagesPerDay * daysTo2030) / 260);

    // 2. ساعات الإتقان والعمل العميق حتى 2030
    const effectiveDeepWeek = Math.round(deepHoursWeek * consistencyFactor * 10) / 10;
    const totalDeepHours2030 = Math.round(effectiveDeepWeek * weeksTo2030);

    // 3. التراكم المالي والاستثماري حتى 2030
    const capitalByEndOfYear = Math.round(monthlySave * 12);
    const capitalBy2030 = Math.round(monthlySave * monthsTo2030);

    // 4. كم يوماً ستوفّر على أهدافك الحالية؟
    const speedMultiplier =
      ((pagesPerDay / Math.max(1, baseline.basePagesDay)) * 0.3 +
        (deepHoursWeek / Math.max(1, baseline.baseDeepHoursWeek)) * 0.4 +
        (disciplineSim / Math.max(1, baseline.avgDisc)) * 0.3);
    const savedDaysPerQuarter = Math.round((speedMultiplier - 1) * 90);

    return {
      daysTo2030,
      monthsTo2030,
      booksPerYear,
      totalBooksBy2030,
      totalDeepHours2030,
      capitalByEndOfYear,
      capitalBy2030,
      speedMultiplier: Math.round(speedMultiplier * 100) / 100,
      savedDaysPerQuarter,
    };
  }, [pagesPerDay, deepHoursWeek, disciplineSim, monthlySave, baseline]);

  const pickedGoal = useMemo(
    () =>
      measurableGoals.find((g) => g.id === selectedGoalId) ||
      measurableGoals[0] ||
      null,
    [measurableGoals, selectedGoalId]
  );

  const pickedGoalSim = useMemo(() => {
    if (!pickedGoal) return null;
    const rem = Math.max(0, (Number(pickedGoal.target) || 0) - (Number(pickedGoal.current) || 0));
    const endDay = goalEnd(pickedGoal);
    const leftDays = Math.max(1, daysTo(endDay) || 90);
    const simDays = Math.max(
      1,
      Math.round(leftDays / Math.max(0.35, projections.speedMultiplier))
    );
    const finishDate = new Date();
    finishDate.setDate(finishDate.getDate() + simDays);
    const finishStr = finishDate.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const requiredPerWeek = Math.round((rem / Math.max(1, leftDays / 7)) * 10) / 10;
    return {
      rem,
      leftDays,
      simDays,
      finishStr,
      requiredPerWeek,
      aheadDays: leftDays - simDays,
    };
  }, [pickedGoal, projections.speedMultiplier]);

  const applyPreset = (mode) => {
    if (mode === "current") {
      setPagesPerDay(baseline.basePagesDay);
      setDeepHoursWeek(baseline.baseDeepHoursWeek);
      setDisciplineSim(baseline.avgDisc);
      setMonthlySave(baseline.baseMonthlySave);
    } else if (mode === "balanced") {
      setPagesPerDay(20);
      setDeepHoursWeek(12);
      setDisciplineSim(85);
      setMonthlySave(Math.max(1500, baseline.baseMonthlySave + 500));
    } else if (mode === "beast") {
      setPagesPerDay(35);
      setDeepHoursWeek(20);
      setDisciplineSim(95);
      setMonthlySave(Math.max(3000, baseline.baseMonthlySave * 2));
    }
  };

  return (
    <Card className="p-6 sm:p-7 border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-emerald-500/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/35 bg-indigo-500/15 text-indigo-300">
            <Rocket size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[18px] font-extrabold text-white">
                المحاكي المستقبلي لأهداف 2030 (What-If Simulator)
              </h3>
              <Badge tint={T.primary}>سرعة المسار: {projections.speedMultiplier}x</Badge>
            </div>
            <p className="mt-0.5 text-[12px] text-white/50">
              حرّك المؤشرات لترى كيف تغيّر عاداتك اليومية موعد وصولك لأهداف ٢٠٢٧-٢٠٣٠
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => applyPreset("current")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/10 hover:text-white"
          >
            سرعتي الحالية
          </button>
          <button
            onClick={() => applyPreset("balanced")}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25"
          >
            توازن ذكي ⚖️
          </button>
          <button
            onClick={() => applyPreset("beast")}
            className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25"
          >
            وضع القصوى 🔥
          </button>
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-white/60 hover:text-white"
            title={isOpen ? "طي المحاكي" : "توسيع المحاكي"}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 space-y-6">
          {/* أشرطة التحريك التفاعلية الأربعة */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-[12px] font-bold">
                <span className="text-white/75">📖 القراءة اليومية</span>
                <span className="text-amber-300">{pagesPerDay} صفحة/يوم</span>
              </div>
              <input
                type="range"
                min="2"
                max="60"
                value={pagesPerDay}
                onChange={(e) => setPagesPerDay(Number(e.target.value))}
                className="mt-3 w-full accent-amber-400 cursor-pointer"
              />
              <p className="mt-1.5 text-[10.5px] text-white/45">
                تعادل <strong className="text-white/80">{projections.booksPerYear} كتاب</strong> سنوياً
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-[12px] font-bold">
                <span className="text-white/75">🧠 العمل العميق</span>
                <span className="text-sky-300">{deepHoursWeek} س/أسبوع</span>
              </div>
              <input
                type="range"
                min="2"
                max="35"
                value={deepHoursWeek}
                onChange={(e) => setDeepHoursWeek(Number(e.target.value))}
                className="mt-3 w-full accent-sky-400 cursor-pointer"
              />
              <p className="mt-1.5 text-[10.5px] text-white/45">
                تعادل <strong className="text-white/80">{Math.round((deepHoursWeek / 7) * 10) / 10} ساعة</strong> يومياً
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-[12px] font-bold">
                <span className="text-white/75">🔥 نسبة الانضباط</span>
                <span className="text-emerald-300">{disciplineSim}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={disciplineSim}
                onChange={(e) => setDisciplineSim(Number(e.target.value))}
                className="mt-3 w-full accent-emerald-400 cursor-pointer"
              />
              <p className="mt-1.5 text-[10.5px] text-white/45">
                متوسطك الفعلي الحالي: <strong className="text-white/80">{baseline.avgDisc}%</strong>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between text-[12px] font-bold">
                <span className="text-white/75">💰 الادخار والاستثمار</span>
                <span dir="ltr" className="text-indigo-300">
                  {monthlySave.toLocaleString("en-US")} SAR
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="10000"
                step="100"
                value={monthlySave}
                onChange={(e) => setMonthlySave(Number(e.target.value))}
                className="mt-3 w-full accent-indigo-400 cursor-pointer"
              />
              <p className="mt-1.5 text-[10.5px] text-white/45">
                تراكم سنوي:{" "}
                <strong dir="ltr" className="text-white/80">
                  {projections.capitalByEndOfYear.toLocaleString("en-US")} SAR
                </strong>
              </p>
            </div>
          </div>

          {/* نتائج المحاكاة الكبرى لعام 2030 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4 text-center">
              <p className="text-[11px] font-bold text-amber-200/70">حصيلة الكتب حتى 2030</p>
              <p className="mt-1 text-2xl font-black text-amber-300 tabular-nums">
                {projections.totalBooksBy2030} كتاب
              </p>
              <p className="mt-0.5 text-[10px] text-white/45">بمعدل 260 صفحة للكتاب</p>
            </div>

            <div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.07] p-4 text-center">
              <p className="text-[11px] font-bold text-sky-200/70">ساعات الإتقان حتى 2030</p>
              <p
                dir="ltr"
                className="mt-1 text-2xl font-black text-sky-300 tabular-nums"
              >
                {projections.totalDeepHours2030.toLocaleString("en-US")} h
              </p>
              <p className="mt-0.5 text-[10px] text-white/45">
                {projections.totalDeepHours2030 >= 2500
                  ? "تجاوزت عتبة الاحتراف العالمي 🌟"
                  : "نحو عتبة الـ 2,500 ساعة إتقان"}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.07] p-4 text-center">
              <p className="text-[11px] font-bold text-indigo-200/70">رأس المال التراكمي 2030</p>
              <p
                dir="ltr"
                className="mt-1 text-2xl font-black text-indigo-300 tabular-nums"
              >
                {projections.capitalBy2030.toLocaleString("en-US")}
              </p>
              <p className="mt-0.5 text-[10px] text-white/45">ريال سعودي (بدون العائد المركب)</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4 text-center">
              <p className="text-[11px] font-bold text-emerald-200/70">اختصار الوقت في كل ربع</p>
              <p className="mt-1 text-2xl font-black text-emerald-300 tabular-nums">
                {projections.savedDaysPerQuarter >= 0
                  ? `+${projections.savedDaysPerQuarter} يوم أبكر`
                  : `${projections.savedDaysPerQuarter} يوم تأخير`}
              </p>
              <p className="mt-0.5 text-[10px] text-white/45">مقارنة بوتيرتك الحالية</p>
            </div>
          </div>

          {/* محاكي هدف رقمي محدد */}
          {measurableGoals.length > 0 && pickedGoal && pickedGoalSim && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11.5px] font-bold text-white/50">
                    محاكاة هدف محدد:
                  </span>
                  <select
                    value={pickedGoal.id}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-[12px] font-extrabold text-white outline-none"
                  >
                    {measurableGoals.map((g) => (
                      <option key={g.id} value={g.id} style={{ background: "#111" }}>
                        {g.text} ({g.current}/{g.target} {g.unit || ""})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-[12px] text-white/65">
                  المتبقي:{" "}
                  <strong className="text-white">
                    {pickedGoalSim.rem} {pickedGoal.unit || "وحدة"}
                  </strong>{" "}
                  · المطلوب أسبوعياً:{" "}
                  <strong className="text-emerald-300">
                    {pickedGoalSim.requiredPerWeek} {pickedGoal.unit || "وحدة"}/أسبوع
                  </strong>
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-center">
                <p className="text-[10.5px] text-emerald-200/70">موعد الإنجاز المتوقع</p>
                <p className="mt-0.5 text-[14px] font-black text-emerald-300">
                  {pickedGoalSim.finishStr}
                </p>
                {pickedGoalSim.aheadDays > 0 && (
                  <p className="text-[10px] font-bold text-emerald-400">
                    أبكر بـ {pickedGoalSim.aheadDays} يوم من الموعد النهائي!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ============================================================================
 * 1️⃣ بؤرة «الهدف القائد الشمالي» (The North Star / WIG Spotlight Card)
 * يطبق قاعدة التركيز التنفيذي (4DX): هدف مركزي واحد يقود يومك ويرتبط بخطوة فيزيائية فورية
 * ============================================================================ */
function WigSpotlightCard({
  all,
  habits,
  history,
  commitStore,
  onSelectWig,
  onUpdateGoalMeta,
  onPatchGoal,
  onSendToToday,
  onOpenGoal,
  onOpenCalibration,
}) {
  const openGoals = useMemo(
    () => (all || []).filter((g) => !g.done),
    [all]
  );

  const wigGoal = useMemo(() => {
    if (!openGoals.length) return null;
    const savedId = commitStore?.activeWigId;
    if (savedId) {
      const found = openGoals.find((g) => g.id === savedId);
      if (found) return found;
    }
    return (
      openGoals.find((g) => g.isMonthlyFocus && g.priority === "critical") ||
      openGoals.find((g) => g.isMonthlyFocus) ||
      openGoals.find((g) => g.priority === "critical") ||
      openGoals[0]
    );
  }, [openGoals, commitStore]);

  const [editingContract, setEditingContract] = useState(false);
  const [actionDraft, setActionDraft] = useState("");
  const [whyDraft, setWhyDraft] = useState("");
  const [costDraft, setCostDraft] = useState("");

  useEffect(() => {
    if (wigGoal) {
      setActionDraft(wigGoal.nextAction || "");
      setWhyDraft(wigGoal.why || "");
      setCostDraft(commitStore?.[wigGoal.id]?.costOfFailure || "");
    }
  }, [wigGoal?.id, wigGoal?.nextAction, wigGoal?.why, commitStore]);

  if (!wigGoal) return null;

  const p = pillarOf(wigGoal.pillar);
  const pct = goalPct(wigGoal, all, habits);
  const momentum = calculateHabitMomentum(wigGoal, history);
  const endDay = goalEnd(wigGoal);
  const leftDays = daysTo(endDay);
  const meta = commitStore?.[wigGoal.id] || {};

  const handleSaveContract = () => {
    onPatchGoal(wigGoal.id, {
      why: whyDraft.trim(),
      nextAction: actionDraft.trim(),
    });
    onUpdateGoalMeta(wigGoal.id, {
      costOfFailure: costDraft.trim(),
    });
    setEditingContract(false);
  };

  return (
    <Card
      className="relative overflow-hidden p-6 sm:p-7 border-2 shadow-2xl"
      style={{
        borderColor: `${T.accent}55`,
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.11) 0%, rgba(16,185,129,0.06) 50%, rgba(10,14,24,0.95) 100%)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-400/20 text-amber-300 shadow-lg">
            <Target size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                🎯 بؤرة الهدف القائد الوحيد (The WIG Spotlight)
              </span>
              <Badge tint={T.primary}>قاعدة عدم التشتت</Badge>
              {meta.confidence && (
                <Badge tint={T.accent}>مؤشر الثقة: {meta.confidence}/10</Badge>
              )}
            </div>
            <p className="text-[11.5px] text-white/55 mt-0.5">
              ركز 80% من طاقتك اليومية على هذا الهدف القائد حتى يُحسم، قبل أن تتشتت في غيره
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={wigGoal.id}
            onChange={(e) => onSelectWig(e.target.value)}
            className="max-w-[230px] truncate rounded-xl border border-amber-400/30 bg-black/60 px-3 py-1.5 text-[11.5px] font-extrabold text-amber-200 outline-none"
            title="اختر الهدف القائد لهذه المرحلة"
          >
            {openGoals.map((g) => (
              <option key={g.id} value={g.id} style={{ background: "#111" }}>
                🎯 {g.text}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setEditingContract((v) => !v)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/80 hover:bg-white/10"
          >
            {editingContract ? "إغلاق المحرر" : "تعديل الدافع والخطوة ✍️"}
          </button>
        </div>
      </div>

      {/* تفاصيل الهدف القائد */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-lg px-2.5 py-1 text-[11px] font-extrabold"
              style={{ backgroundColor: `${p.tint}25`, color: p.tint }}
            >
              {p.label}
            </span>
            {leftDays !== null && (
              <span className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white/75">
                ⏳ متبقي {Math.max(0, leftDays)} {dayWord(Math.max(0, leftDays))}
              </span>
            )}
            {momentum !== null && (
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-extrabold text-emerald-300">
                ⚡ زخم العادات: {momentum}%
              </span>
            )}
          </div>

          <h3
            onClick={() => onOpenGoal(wigGoal.id)}
            className="cursor-pointer text-2xl sm:text-3xl font-black text-white leading-snug hover:text-amber-300 transition-colors"
          >
            «{wigGoal.text}»
          </h3>

          {/* شريط التقدم الكبير */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-white/70">نسبة الحسم والإنجاز</span>
              <span className="text-amber-300 tabular-nums">{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-black/50 p-0.5 border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, pct)}%`,
                  background: "linear-gradient(90deg, #f59e0b, #10b981)",
                }}
              />
            </div>
          </div>

          {/* مرساة الدافع العميق (Emotional Why) وكلفة الفشل */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-400/25 bg-black/35 p-3.5">
              <p className="text-[10.5px] font-extrabold text-amber-400 mb-1">
                🔥 لماذا هذا الهدف خط أحمر؟ (The Deep Why)
              </p>
              <p className="text-xs font-bold text-white/85 leading-relaxed">
                {wigGoal.why || "اضغط «تعديل الدافع والخطوة» لكتابة سببك الحقيقي الذي يمنعك من التراجع."}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/25 bg-black/35 p-3.5">
              <p className="text-[10.5px] font-extrabold text-rose-400 mb-1">
                ⚠️ كلفة التقاعس (Cost of Inaction)
              </p>
              <p className="text-xs font-bold text-white/85 leading-relaxed">
                {meta.costOfFailure || "ما الذي ستخسره إن مرّ هذا الشهر دون حسم هذا الهدف؟"}
              </p>
            </div>
          </div>
        </div>

        {/* محرك الفعل الفيزيائي التالي (Next Physical Action Engine) */}
        <div className="lg:col-span-5 rounded-3xl border border-emerald-400/35 bg-black/45 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
              <Zap size={15} /> الفعل الفيزيائي التالي (Next Action)
            </span>
            <span className="text-[10.5px] text-white/45">5 إلى 15 دقيقة</span>
          </div>

          <div className="space-y-2">
            <input
              value={actionDraft}
              onChange={(e) => setActionDraft(e.target.value)}
              onBlur={() => {
                if (actionDraft.trim() !== (wigGoal.nextAction || "")) {
                  onPatchGoal(wigGoal.id, { nextAction: actionDraft.trim() });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onPatchGoal(wigGoal.id, { nextAction: actionDraft.trim() });
                }
              }}
              placeholder="اكتب خطوة صغيرة محددة جداً تفعلها اليوم..."
              className="w-full rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-[13px] font-extrabold text-white placeholder-white/35 outline-none focus:border-emerald-400"
            />
          </div>

          <button
            type="button"
            onClick={() => onSendToToday(wigGoal, actionDraft)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-[13px] font-black text-black shadow-lg transition-transform hover:scale-[1.01] active:scale-95"
          >
            <Zap size={16} strokeWidth={3} />
            أرسل هذه الخطوة لشاشة «اليوم» الآن
          </button>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => onOpenGoal(wigGoal.id)}
              className="text-[11px] font-bold text-white/60 hover:text-white"
            >
              فتح غرفة عمليات الهدف ←
            </button>
            <button
              type="button"
              onClick={onOpenCalibration}
              className="text-[11px] font-extrabold text-amber-300 hover:text-amber-200"
            >
              ⏱️ معايرة الأسبوع (60ث)
            </button>
          </div>
        </div>
      </div>

      {/* نافذة التحرير السريع لعقد الالتزام */}
      {editingContract && (
        <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-white/15 bg-black/60 p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-amber-300">
              🔥 لماذا هذا الهدف خط أحمر بالنسبة لي؟
            </label>
            <input
              value={whyDraft}
              onChange={(e) => setWhyDraft(e.target.value)}
              placeholder="لأني أريد الوصول إلى..."
              className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-rose-300">
              ⚠️ ما هي كلفة التقاعس إن تكاسلت؟
            </label>
            <input
              value={costDraft}
              onChange={(e) => setCostDraft(e.target.value)}
              placeholder="سأخسر فرصة..."
              className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSaveContract}
              className="w-full rounded-xl bg-amber-400 py-2 text-xs font-black text-black hover:bg-amber-300"
            >
              حفظ عقد الالتزام ✓
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================================================================
 * 3️⃣ رادار إنقاذ الأهداف الراكدة وتفكيك المقاومة (Goal CPR & Friction Buster)
 * يتدخل بلطف عندما يتعثر هدف ليمنع شعور الذنب ويقدم 3 مخارج نفسية عملية
 * ============================================================================ */
function GoalCprBanner({
  all,
  scoped,
  habits,
  history,
  commitStore,
  onUpdateGoalMeta,
  onPatchGoal,
  onSendToToday,
  onOpenGoal,
  onToast,
}) {
  const [microStepText, setMicroStepText] = useState("");
  const [selectedStalledId, setSelectedStalledId] = useState(null);
  const [showPaused, setShowPaused] = useState(false);

  const todayIso = new Date().toISOString().slice(0, 10);

  const pausedGoals = useMemo(
    () =>
      (scoped || []).filter((g) => {
        const pausedUntil = commitStore?.[g.id]?.pausedUntil;
        return !g.done && pausedUntil && pausedUntil > todayIso;
      }),
    [scoped, commitStore, todayIso]
  );

  const stalledGoals = useMemo(() => {
    return (scoped || []).filter((g) => {
      if (g.done) return false;
      const pausedUntil = commitStore?.[g.id]?.pausedUntil;
      if (pausedUntil && pausedUntil > todayIso) return false;

      const pace = goalPace(g, all);
      const momentum = calculateHabitMomentum(g, history);
      const isBehind = pace.pace?.state === "behind";
      const lowMomentum = momentum !== null && momentum < 40;
      const missingNextAction = !g.nextAction || !g.nextAction.trim();

      return isBehind || lowMomentum || missingNextAction;
    });
  }, [scoped, all, history, commitStore, todayIso]);

  if (stalledGoals.length === 0 && pausedGoals.length === 0) return null;

  const targetGoal =
    stalledGoals.find((g) => g.id === selectedStalledId) || stalledGoals[0] || null;

  const handleMicroStepRescue = () => {
    if (!targetGoal) return;
    const stepText =
      microStepText.trim() ||
      `بدء 5 دقائق فقط في «${targetGoal.text.slice(0, 25)}» لكسر الحاجز`;
    onPatchGoal(targetGoal.id, { nextAction: stepText });
    onSendToToday(targetGoal, stepText);
    setMicroStepText("");
  };

  const handleDeferQuarter = () => {
    if (!targetGoal) return;
    const qOrder = ["q1", "q2", "q3", "q4"];
    const idx = qOrder.indexOf(targetGoal.quarter);
    const nextQ = idx >= 0 && idx < 3 ? qOrder[idx + 1] : "q1";
    const nextY = idx === 3 ? targetGoal.year + 1 : targetGoal.year;
    onPatchGoal(targetGoal.id, { quarter: nextQ, year: nextY });
    onToast?.("📅 تم ترحيل الهدف للربع القادم بسلام وبدون أي تأنيب ضمير!");
  };

  const handlePause14Days = () => {
    if (!targetGoal) return;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const untilIso = d.toISOString().slice(0, 10);
    onUpdateGoalMeta(targetGoal.id, { pausedUntil: untilIso });
    onToast?.("❄️ تم تجميد الهدف مؤقتاً لمدة 14 يوماً لتتفرغ لهدفك القائد!");
  };

  return (
    <Card className="p-5 sm:p-6 border-rose-500/25 bg-gradient-to-r from-rose-500/[0.07] via-amber-500/[0.04] to-transparent">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-500/35 bg-rose-500/15 text-rose-300">
            <Activity size={19} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-black text-white">
                عيادة إنعاش الأهداف وتفكيك المقاومة (Goal CPR ❤️‍🩹)
              </h3>
              {stalledGoals.length > 0 && (
                <Badge tint={T.danger}>{stalledGoals.length} بحاجة لإنعاش</Badge>
              )}
            </div>
            <p className="text-[11.5px] text-white/55 mt-0.5">
              لا تشعر بالذنب تجاه الأهداف المتأخرة — إما أن تصغّر خطوتها لـ 5 دقائق الآن، أو ترحّلها وتجمّدها بشرف!
            </p>
          </div>
        </div>

        {pausedGoals.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPaused((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/70 hover:bg-white/10"
          >
            ❄️ الأهداف المجمّدة مؤقتاً ({pausedGoals.length})
          </button>
        )}
      </div>

      {targetGoal && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/50">الهدف المختار للإنعاش:</span>
              <select
                value={targetGoal.id}
                onChange={(e) => setSelectedStalledId(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/60 px-3 py-1.5 text-xs font-extrabold text-white outline-none"
              >
                {stalledGoals.map((g) => (
                  <option key={g.id} value={g.id} style={{ background: "#111" }}>
                    {g.text}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => onOpenGoal(targetGoal.id)}
              className="text-[11px] font-bold text-amber-300 hover:underline"
            >
              فتح التفاصيل الكاملة ←
            </button>
          </div>

          {/* الخيارات النفسية الثلاثة لتفكيك المقاومة */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* الخيار 1: تفكيك لخطوة من 5 دقائق */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-3.5 space-y-2">
              <p className="text-xs font-black text-emerald-300">
                1. 🔨 صغّر الخطوة لـ 5 دقائق فقط
              </p>
              <input
                value={microStepText}
                onChange={(e) => setMicroStepText(e.target.value)}
                placeholder="مثال: فتح الملف وكتابة 3 أسطر..."
                className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11.5px] text-white outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={handleMicroStepRescue}
                className="w-full rounded-lg bg-emerald-500 py-1.5 text-[11px] font-black text-black hover:bg-emerald-400"
              >
                اعتمدها وأرسلها ليومي ⚡
              </button>
            </div>

            {/* الخيار 2: ترحيل للربع القادم بدون ذنب */}
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.07] p-3.5 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-xs font-black text-sky-300">
                  2. 📅 رحّله للربع القادم بسلام
                </p>
                <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                  إذا كان وقتك مزدحماً هذا الربع، انقله للربع التالي لتخفيف الضغط الذهني.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeferQuarter}
                className="w-full rounded-lg border border-sky-400/40 bg-sky-500/20 py-1.5 text-[11px] font-extrabold text-sky-200 hover:bg-sky-500/30"
              >
                ترحيل للربع القادم →
              </button>
            </div>

            {/* الخيار 3: تجميد مؤقت بشرف */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.07] p-3.5 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-xs font-black text-indigo-300">
                  3. ❄️ تجميد مؤقت بشرف (14 يوماً)
                </p>
                <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                  أخفِه من رادار القلق أسبوعين ريثما تنتهي من هدفك القائد الأهم.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePause14Days}
                className="w-full rounded-lg border border-indigo-400/40 bg-indigo-500/20 py-1.5 text-[11px] font-extrabold text-indigo-200 hover:bg-indigo-500/30"
              >
                تجميد 14 يوماً ❄️
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaused && pausedGoals.length > 0 && (
        <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/40 p-3.5">
          <p className="text-[11px] font-bold text-white/60">
            الأهداف المجمّدة مؤقتاً (اضغط «استئناف» لإعادتها للنشاط):
          </p>
          {pausedGoals.map((pg) => (
            <div
              key={pg.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs"
            >
              <span className="font-bold text-white/80">{pg.text}</span>
              <button
                type="button"
                onClick={() => {
                  onUpdateGoalMeta(pg.id, { pausedUntil: null });
                  onToast?.("🔥 تم تنشيط الهدف وإعادته للميدان!");
                }}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-extrabold text-emerald-300 hover:bg-emerald-500/30"
              >
                استئناف النشاط
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============================================================================
 * 4️⃣ طقس «معايرة الأهداف الأسبوعية» في 60 ثانية (Weekly 60s Goal Ritual Modal)
 * مستوحى من نظام OKRs في وادي السيليكون: مراجعة الثقة، الانتصار، والخطوة القادمة
 * ============================================================================ */
function WeeklyCalibrationModal({
  open,
  onClose,
  all,
  monthlyGoals,
  habits,
  commitStore,
  onUpdateGoalMeta,
  onPatchGoal,
  onSendToToday,
  onToast,
}) {
  const focusList = useMemo(() => {
    if (monthlyGoals && monthlyGoals.length > 0) return monthlyGoals;
    return (all || []).filter((g) => !g.done).slice(0, 5);
  }, [monthlyGoals, all]);

  const [idx, setIdx] = useState(0);
  const currentGoal = focusList[idx] || focusList[0] || null;

  const [confidence, setConfidence] = useState(8);
  const [winNote, setWinNote] = useState("");
  const [blockerText, setBlockerText] = useState("");
  const [nextStepText, setNextStepText] = useState("");

  useEffect(() => {
    if (currentGoal) {
      setConfidence(commitStore?.[currentGoal.id]?.confidence || 8);
      setWinNote("");
      setBlockerText("");
      setNextStepText(currentGoal.nextAction || "");
    }
  }, [currentGoal?.id, open, commitStore]);

  if (!open || !currentGoal) return null;

  const pct = goalPct(currentGoal, all, habits);

  const handleSaveAndNext = (alsoSendToday = false) => {
    const nextReviews = winNote.trim()
      ? [
          ...(currentGoal.reviews || []),
          {
            id: uid(),
            date: new Date().toISOString().slice(0, 10),
            note: `🏆 انتصار الأسبوع: ${winNote.trim()} (ثقة ${confidence}/10)`,
            progress: pct,
          },
        ]
      : currentGoal.reviews || [];

    const nextObstacles = blockerText.trim()
      ? [...(currentGoal.obstacles || []), blockerText.trim()]
      : currentGoal.obstacles || [];

    onPatchGoal(currentGoal.id, {
      nextAction: nextStepText.trim() || currentGoal.nextAction,
      reviews: nextReviews,
      obstacles: nextObstacles,
    });

    onUpdateGoalMeta(currentGoal.id, {
      confidence,
      lastCalibratedAt: new Date().toISOString().slice(0, 10),
    });

    if (alsoSendToday && nextStepText.trim()) {
      onSendToToday(currentGoal, nextStepText.trim());
    }

    if (idx < focusList.length - 1) {
      setIdx(idx + 1);
    } else {
      onToast?.("🎯 اكتملت معايرة أهداف الأسبوع بنجاح! أنت جاهز للانطلاق.");
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`⏱️ طقس معايرة الأهداف الأسبوعية (${idx + 1} من ${focusList.length})`}
      wide
    >
      <div className="space-y-5 py-2">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold text-amber-300">
              الهدف قيد المعايرة ({pct}% منجز)
            </span>
            <h4 className="text-lg font-black text-white mt-0.5">
              «{currentGoal.text}»
            </h4>
          </div>
          <div className="flex gap-1.5">
            {focusList.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-2.5 w-7 rounded-full transition-all ${
                  i === idx ? "bg-amber-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* السؤال 1: مؤشر الثقة */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between text-xs font-extrabold mb-2">
            <span className="text-white/85">
              1️⃣ ما مدى ثقتك في حسم هذا الهدف في موعده؟
            </span>
            <span className="rounded-lg bg-amber-400/20 px-2.5 py-1 text-amber-300 font-black">
              {confidence} / 10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* السؤال 2: انتصار الأسبوع */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
          <label className="block text-xs font-extrabold text-emerald-300">
            2️⃣ ما هو أهم تقدم أو انتصار حققته لهذا الهدف هذا الأسبوع؟
          </label>
          <input
            value={winNote}
            onChange={(e) => setWinNote(e.target.value)}
            placeholder="مثال: أنهيت الفصل الأول / التزمت بـ 4 أيام تمرين..."
            className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
          />
        </div>

        {/* السؤال 3: العقبة والخطوة القادمة */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2">
            <label className="block text-xs font-extrabold text-rose-300">
              3️⃣ هل هناك عقبة تعطلك؟ (اختياري)
            </label>
            <input
              value={blockerText}
              onChange={(e) => setBlockerText(e.target.value)}
              placeholder="مثال: ضيق الوقت بعد العصر..."
              className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-400"
            />
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.07] p-4 space-y-2">
            <label className="block text-xs font-extrabold text-emerald-300">
              4️⃣ ما هي خطوتك الفيزيائية القادمة هذا الأسبوع؟
            </label>
            <input
              value={nextStepText}
              onChange={(e) => setNextStepText(e.target.value)}
              placeholder="مثال: تخصيص 25 دقيقة صباح الغد لـ..."
              className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => handleSaveAndNext(true)}
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-black hover:bg-emerald-400 shadow-lg"
          >
            <Zap size={14} /> حفظ + إرسال الخطوة لشاشة «اليوم»
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndNext(false)}
            className="rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-white/20"
          >
            {idx < focusList.length - 1 ? "حفظ والهدف التالي ←" : "إنهاء المعايرة ✓"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
