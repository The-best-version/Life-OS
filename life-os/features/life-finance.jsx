import React, { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Wallet,
  Coins,
  Lightbulb,
  Scale,
  ArrowDownLeft,
  Rocket,
  Target,
  Zap,
  Check,
  Clock,
  Award,
  Layers,
} from "lucide-react";
import { T, Card, Btn, Field, Badge, Modal, useUndo } from "../components/life-shared.jsx";
import {
  uid,
  incomeShape,
  expenseShape,
  taskShape,
  MONEY_CAP,
  amountSum,
  hoursSum,
  sinceDays,
  netBalance,
} from "../state/life-state.mjs";

/* ==================================================================== *
 *  MODULE — flexible income, venture pipeline & commercial skill ROI
 * ==================================================================== */

/* `money` is deliberately NOT exported so it never collides with object keys
   named `money` in other files during tests/split.test.mjs. */
const money = (n) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(n || 0),
  );

// مراحل خط أنابيب المشاريع التجارية (Venture Pipeline Stages)
const VENTURE_STAGES = [
  { id: "idea", label: "١. الفكرة والتحقق", short: "الفكرة", pct: 20, tint: T.muted },
  { id: "offer", label: "٢. بناء العرض (MVP)", short: "بناء العرض", pct: 40, tint: T.sky },
  { id: "pricing", label: "٣. التسعير والهيكلة", short: "التسعير", pct: 60, tint: T.violet },
  { id: "marketing", label: "٤. التسويق والوصول", short: "التسويق", pct: 80, tint: T.cta },
  { id: "cashflow", label: "٥. الإطلاق والتدفق النقدي", short: "تدفق نقدي", pct: 100, tint: T.primary },
];

// شجرة المهارات التجارية لعام 2030
const COMMERCIAL_SKILLS = [
  { id: "marketing", label: "التسويق والاستحواذ", desc: "جذب الانتباه وبناء القنوات" },
  { id: "sales", label: "المبيعات والإغلاق", desc: "تحويل المهتمين إلى عملاء دافعين" },
  { id: "pricing", label: "التسعير وهندسة العروض", desc: "رفع القيمة المدركة وهامش الربح" },
  { id: "product", label: "بناء المنتج والخدمة", desc: "تنفيذ حلول سريعة عالية الجودة" },
  { id: "copywriting", label: "الكتابة الإقناعية", desc: "صياغة الرسائل والعروض البيعية" },
  { id: "automation", label: "الأتمتة والذكاء الاصطناعي", desc: "مضاعفة الإنتاجية وتقليل الوقت" },
];

const SKILL_XP_STORAGE_KEY = "los_commercial_skills_xp_v1";

export function FinanceModule({ state, setState }) {
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState("");
  const [amount, setAmount] = useState("");
  const [spentLabel, setSpentLabel] = useState("");
  const [spentAmount, setSpentAmount] = useState("");
  const [venture, setVenture] = useState(null);
  const [stageFilter, setStageFilter] = useState("all");
  const [taskToast, setTaskToast] = useState("");

  // نقاط خبرة إضافية للمهارات التجارية محفوظة محلياً
  const [manualSkillXp, setManualSkillXp] = useState(() => {
    try {
      const raw = localStorage.getItem(SKILL_XP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const arm = useUndo();

  const income = state.income || [];
  const expenses = state.expenses || [];
  const ventures = state.ventures || [];

  const weekTotal = amountSum(sinceDays(income, 7));
  const monthTotal = amountSum(sinceDays(income, 30));
  const monthSpent = amountSum(sinceDays(expenses, 30));
  const monthHours = hoursSum(sinceDays(income, 30));
  const rate = monthHours ? monthTotal / monthHours : 0;
  const balance = netBalance(income, expenses);

  // إحصاءات المشاريع التجارية وعائد الساعة
  const ventureMetrics = useMemo(() => {
    const totalExpectedRev = ventures.reduce((s, v) => s + (Number(v.revenue) || 0), 0);
    const totalCost = ventures.reduce((s, v) => s + (Number(v.cost) || 0), 0);
    const totalActualRev = ventures.reduce((s, v) => s + (Number(v.actualRevenue) || 0), 0);
    const totalHours = ventures.reduce((s, v) => s + (Number(v.hoursInvested) || 0), 0);
    const launchedCount = ventures.filter((v) => v.stage === "cashflow").length;
    const ventureHourly = totalHours > 0 ? totalActualRev / totalHours : 0;
    return {
      totalExpectedRev,
      totalCost,
      totalActualRev,
      totalHours,
      launchedCount,
      ventureHourly,
    };
  }, [ventures]);

  // حساب مستويات المهارات التجارية من المشاريع + الساعات + التقدم اليدوي
  const skillLevels = useMemo(() => {
    return COMMERCIAL_SKILLS.map((sk) => {
      const linkedVentures = ventures.filter((v) =>
        Array.isArray(v.skills) ? v.skills.includes(sk.id) : false
      );
      const ventureHours = linkedVentures.reduce(
        (sum, v) => sum + (Number(v.hoursInvested) || 0),
        0
      );
      const launchedBonus = linkedVentures.filter((v) => v.stage === "cashflow").length * 25;
      const basePoints = linkedVentures.length * 15 + ventureHours * 4 + launchedBonus;
      const bonusPoints = Number(manualSkillXp[sk.id]) || 0;
      const totalXp = basePoints + bonusPoints;
      const level = Math.min(10, Math.floor(totalXp / 50) + 1);
      const progressInLevel = Math.min(100, Math.round(((totalXp % 50) / 50) * 100));
      return {
        ...sk,
        linkedCount: linkedVentures.length,
        ventureHours,
        totalXp,
        level,
        progressInLevel,
      };
    });
  }, [ventures, manualSkillXp]);

  const bumpSkillXp = (skillId, delta = 10) => {
    setManualSkillXp((prev) => {
      const next = {
        ...prev,
        [skillId]: Math.max(0, (Number(prev[skillId]) || 0) + delta),
      };
      try {
        localStorage.setItem(SKILL_XP_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const addIncome = () => {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const row = incomeShape({ label, hours, amount: amt });
    setState((s) => ({
      ...s,
      income: [row, ...(s.income || [])].slice(0, MONEY_CAP),
    }));
    setLabel("");
    setHours("");
    setAmount("");
  };

  const addExpense = () => {
    const amt = parseFloat(spentAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const row = expenseShape({ label: spentLabel, amount: amt });
    setState((s) => ({
      ...s,
      expenses: [row, ...(s.expenses || [])].slice(0, MONEY_CAP),
    }));
    setSpentLabel("");
    setSpentAmount("");
  };

  const removeIncome = (id) => {
    arm("حُذف سجلّ الدخل", { income });
    setState((s) => ({ ...s, income: s.income.filter((e) => e.id !== id) }));
  };

  const removeExpense = (id) => {
    arm("حُذف المصروف", { expenses });
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  };

  const removeVenture = (id) => {
    arm("حُذف المشروع", { ventures });
    setState((s) => ({ ...s, ventures: s.ventures.filter((v) => v.id !== id) }));
  };

  const saveVenture = () => {
    const name = (venture?.name || "").trim();
    if (!name) return;
    const cost = parseFloat(venture.cost) || 0;
    const revenue = parseFloat(venture.revenue) || 0;
    const actualRevenue = parseFloat(venture.actualRevenue) || 0;
    const hoursInvested = parseFloat(venture.hoursInvested) || 0;
    const stage = venture.stage || "idea";
    const nextStep = (venture.nextStep || "").trim();
    const skills = Array.isArray(venture.skills) ? venture.skills : [];

    const payload = {
      id: venture.id || uid(),
      name,
      cost,
      revenue,
      actualRevenue,
      hoursInvested,
      stage,
      nextStep,
      skills,
    };

    setState((s) => ({
      ...s,
      ventures: venture.id
        ? (s.ventures || []).map((v) => (v.id === venture.id ? { ...v, ...payload } : v))
        : [...(s.ventures || []), payload],
    }));
    setVenture(null);
  };

  // ترقية مرحلة المشروع بضغطة واحدة
  const advanceVentureStage = (v) => {
    const idx = VENTURE_STAGES.findIndex((st) => st.id === (v.stage || "idea"));
    const nextIdx = (idx + 1) % VENTURE_STAGES.length;
    const nextStage = VENTURE_STAGES[nextIdx].id;
    setState((s) => ({
      ...s,
      ventures: (s.ventures || []).map((row) =>
        row.id === v.id ? { ...row, stage: nextStage } : row
      ),
    }));
  };

  // زيادة ساعات الاستثمار في المشروع بضغطة واحدة
  const addVentureHour = (v, hrs = 1) => {
    setState((s) => ({
      ...s,
      ventures: (s.ventures || []).map((row) =>
        row.id === v.id
          ? { ...row, hoursInvested: Math.max(0, (Number(row.hoursInvested) || 0) + hrs) }
          : row
      ),
    }));
  };

  // إرسال الخطوة القادمة للمشروع مباشرة إلى مهام اليوم
  const pushNextStepToTasks = (v) => {
    const stepText = (v.nextStep || "").trim() || `العمل على مشروع: ${v.name}`;
    const fullText = `${v.name}: ${stepText}`;
    setState((s) => ({
      ...s,
      tasks: [
        taskShape({
          text: fullText,
          quadrant: "q2",
          top: true,
          done: false,
        }),
        ...(s.tasks || []),
      ],
    }));
    setTaskToast(`أُضيفت «${fullText}» إلى مهام اليوم! ⚡`);
    setTimeout(() => setTaskToast(""), 3500);
  };

  const filteredVentures = useMemo(() => {
    if (stageFilter === "all") return ventures;
    return ventures.filter((v) => (v.stage || "idea") === stageFilter);
  }, [ventures, stageFilter]);

  const stats = [
    { label: "دخل هذا الأسبوع", value: weekTotal, tint: T.primary, icon: Coins },
    { label: "دخل ٣٠ يومًا", value: monthTotal, tint: T.accent, icon: Wallet },
    { label: "مصروف ٣٠ يومًا", value: monthSpent, tint: T.ember, icon: ArrowDownLeft },
    { label: "معدّل الساعة", value: rate, tint: T.sky, icon: TrendingUp },
    {
      label: "الرصيد الصافي",
      value: balance,
      tint: balance < 0 ? T.danger : T.primary,
      icon: Scale,
    },
    {
      label: "عائد المشاريع المتوقّع",
      value: ventureMetrics.totalExpectedRev - ventureMetrics.totalCost,
      tint: T.ctaLift,
      icon: Rocket,
    },
  ];

  // كم ساعة عمل مرن تساوي مصاريف هذا الشهر؟
  const hoursToCoverMonthSpent = rate > 0 ? Math.round((monthSpent / rate) * 10) / 10 : 0;
  const savingsRatePct =
    monthTotal > 0
      ? Math.max(-100, Math.min(100, Math.round(((monthTotal - monthSpent) / monthTotal) * 100)))
      : 0;

  return (
    <div className="space-y-8">
      {taskToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-white shadow-2xl animate-in fade-in">
          <Check size={18} />
          <span className="text-[13px] font-bold">{taskToast}</span>
        </div>
      )}

      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="los-title text-2xl font-extrabold leading-tight sm:text-[27px]">
              الدخل والمشاريع التجارية
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/40">
              سجّل ساعاتك ودخلك المرن، وابنِ خط أنابيب مشاريعك التجارية ومهاراتك
              نحو الحرية المالية 2030. الأرقام بالريال.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tint={savingsRatePct >= 20 ? T.primary : T.accent}>
              معدل الادخار الشهري: {savingsRatePct}%
            </Badge>
            {hoursToCoverMonthSpent > 0 && (
              <Badge tint={T.sky}>
                مصاريف الشهر = {hoursToCoverMonthSpent} ساعة عمل
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${s.tint}45`,
                    background: `${s.tint}16`,
                    color: s.tint,
                  }}
                >
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <span className="text-[11.5px]" style={{ color: T.faint }}>
                  {s.label}
                </span>
              </div>
              <p
                className="mt-3 text-2xl font-extrabold tabular-nums"
                dir="ltr"
                style={{ color: s.tint }}
              >
                {money(s.value)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* ===================================================================
          الميزة #4 (الجزء الأول): لوحة خط أنابيب المشاريع التجارية (Venture Pipeline)
          =================================================================== */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Rocket size={19} style={{ color: T.ctaLift }} />
              <h3 className="text-[18px] font-extrabold" style={{ color: T.ctaLift }}>
                خط أنابيب المشاريع التجارية (Venture Pipeline)
              </h3>
            </div>
            <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
              تتبّع رحلة كل مشروع من الفكرة حتى أول تدفق نقدي، مع حساب الساعات المستثمرة وعائد الساعة والخطوة التنفيذية القادمة.
            </p>
          </div>
          <Btn
            variant="default"
            size="sm"
            onClick={() =>
              setVenture({
                name: "",
                cost: "",
                revenue: "",
                actualRevenue: "",
                hoursInvested: "",
                stage: "idea",
                nextStep: "",
                skills: ["marketing"],
              })
            }
          >
            <Plus size={14} strokeWidth={3} /> مشروع / فكرة جديدة
          </Btn>
        </div>

        {/* شريط مراحل Pipeline التفاعلي للفلترة */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setStageFilter("all")}
            className={`rounded-xl border px-3 py-1.5 text-[11.5px] font-extrabold transition-all ${
              stageFilter === "all"
                ? "border-white/30 bg-white/10 text-white"
                : "border-transparent bg-white/[0.03] text-white/45 hover:bg-white/5"
            }`}
          >
            الكل ({ventures.length})
          </button>
          {VENTURE_STAGES.map((st) => {
            const count = ventures.filter((v) => (v.stage || "idea") === st.id).length;
            const on = stageFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStageFilter(st.id)}
                className="rounded-xl border px-3 py-1.5 text-[11.5px] font-bold transition-all"
                style={{
                  borderColor: on ? `${st.tint}66` : "rgba(255,255,255,0.06)",
                  backgroundColor: on ? `${st.tint}22` : "rgba(255,255,255,0.02)",
                  color: on ? st.tint : T.muted,
                }}
              >
                {st.short} ({count})
              </button>
            );
          })}
        </div>

        {/* قائمة بطاقات المشاريع */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredVentures.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px] lg:col-span-2"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا مشاريع في هذه المرحلة بعد — اضغط «مشروع / فكرة جديدة» للبدء.
            </p>
          ) : (
            filteredVentures.map((v) => {
              const cost = Number(v.cost) || 0;
              const revenue = Number(v.revenue) || 0;
              const actualRev = Number(v.actualRevenue) || 0;
              const hrs = Number(v.hoursInvested) || 0;
              const profit = revenue - cost;
              const good = profit >= 0;
              const roiPct = cost > 0 ? Math.round((profit / cost) * 100) : null;
              const effectiveHourly =
                hrs > 0 ? Math.round((actualRev > 0 ? actualRev : Math.max(0, profit)) / hrs) : 0;
              const stMeta =
                VENTURE_STAGES.find((st) => st.id === (v.stage || "idea")) ||
                VENTURE_STAGES[0];
              const vSkills = Array.isArray(v.skills) ? v.skills : [];

              return (
                <div
                  key={v.id}
                  className="group flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all"
                  style={{
                    borderColor: good ? `${stMeta.tint}45` : `${T.danger}3D`,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                          style={{
                            borderColor: `${stMeta.tint}45`,
                            backgroundColor: `${stMeta.tint}18`,
                            color: stMeta.tint,
                          }}
                        >
                          <Lightbulb size={16} />
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate text-[15px] font-extrabold text-white">
                            {v.name}
                          </span>
                          <button
                            onClick={() => advanceVentureStage(v)}
                            title="اضغط لترقية المرحلة التالية"
                            className="mt-0.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: `${stMeta.tint}22`,
                              color: stMeta.tint,
                            }}
                          >
                            <Layers size={10} /> {stMeta.label} ↻
                          </button>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() =>
                            setVenture({
                              id: v.id,
                              name: v.name,
                              cost: String(v.cost ?? ""),
                              revenue: String(v.revenue ?? ""),
                              actualRevenue: String(v.actualRevenue ?? ""),
                              hoursInvested: String(v.hoursInvested ?? ""),
                              stage: v.stage || "idea",
                              nextStep: v.nextStep || "",
                              skills: Array.isArray(v.skills) ? v.skills : [],
                            })
                          }
                          aria-label={`تعديل ${v.name}`}
                          className="rounded-lg p-1.5 text-white/35 transition-all hover:bg-white/10 hover:text-white"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => removeVenture(v.id)}
                          aria-label={`حذف ${v.name}`}
                          className="rounded-lg p-1.5 text-white/35 transition-all hover:bg-red-500/15 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* شريط تقدم المراحل الخمس */}
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${stMeta.pct}%`,
                            backgroundColor: stMeta.tint,
                          }}
                        />
                      </div>
                    </div>

                    {/* شبكة الأرقام المالية وعائد الساعة */}
                    <div className="mt-3.5 grid grid-cols-4 gap-2 text-center">
                      <div
                        className="rounded-xl py-2 px-1"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <p className="text-[10px]" style={{ color: T.faint }}>
                          الكلفة
                        </p>
                        <p
                          dir="ltr"
                          className="mt-0.5 text-[13px] font-extrabold tabular-nums"
                          style={{ color: T.faint }}
                        >
                          {money(cost)}
                        </p>
                      </div>
                      <div
                        className="rounded-xl py-2 px-1"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <p className="text-[10px]" style={{ color: T.faint }}>
                          العائد المتوقّع
                        </p>
                        <p
                          dir="ltr"
                          className="mt-0.5 text-[13px] font-extrabold tabular-nums"
                          style={{ color: T.accent }}
                        >
                          {money(revenue)}
                        </p>
                      </div>
                      <div
                        className="rounded-xl py-2 px-1"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <p className="text-[10px]" style={{ color: T.faint }}>
                          صافي الربح
                        </p>
                        <p
                          dir="ltr"
                          className="mt-0.5 text-[13px] font-extrabold tabular-nums"
                          style={{ color: good ? T.primary : T.danger }}
                        >
                          {money(profit)}
                        </p>
                      </div>
                      <div
                        className="rounded-xl py-2 px-1"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <p className="text-[10px]" style={{ color: T.faint }}>
                          عائد الساعة
                        </p>
                        <p
                          dir="ltr"
                          className="mt-0.5 text-[13px] font-extrabold tabular-nums"
                          style={{ color: T.sky }}
                        >
                          {hrs > 0 ? `${money(effectiveHourly)}/h` : roiPct !== null ? `${roiPct}%` : "—"}
                        </p>
                      </div>
                    </div>

                    {/* أوسمة المهارات المرتبطة */}
                    {vSkills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {vSkills.map((skId) => {
                          const sk = COMMERCIAL_SKILLS.find((x) => x.id === skId);
                          if (!sk) return null;
                          return (
                            <span
                              key={skId}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-white/65"
                            >
                              #{sk.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* شريط التحكم السفلي: ساعات العمل + الخطوة القادمة */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-white/55">
                        <Clock size={12} style={{ color: T.sky }} />
                        <strong dir="ltr" className="tabular-nums text-white/85">
                          {hrs}h
                        </strong>{" "}
                        مستثمرة
                      </span>
                      <button
                        onClick={() => addVentureHour(v, 1)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10.5px] font-bold text-sky-300 transition-colors hover:bg-sky-500/20"
                        title="أضف ساعة عمل عميق على هذا المشروع"
                      >
                        +1 ساعة
                      </button>
                    </div>

                    <button
                      onClick={() => pushNextStepToTasks(v)}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 transition-colors hover:bg-amber-500/25"
                      title={
                        v.nextStep
                          ? `أضف لمهام اليوم: ${v.nextStep}`
                          : "أضف مهمة عمل على هذا المشروع اليوم"
                      }
                    >
                      <Zap size={11} />
                      <span className="max-w-[160px] truncate">
                        {v.nextStep ? `مهمة: ${v.nextStep}` : "أضف لمهام اليوم"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* ===================================================================
          الميزة #4 (الجزء الثاني): شجرة المهارات التجارية (Commercial Skill Tree)
          =================================================================== */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award size={18} style={{ color: T.accent }} />
              <h3 className="text-[17px] font-extrabold" style={{ color: T.accent }}>
                شجرة المهارات التجارية (إرثي 2030)
              </h3>
            </div>
            <p className="mt-1 text-[11.5px]" style={{ color: T.faint }}>
              المهارات الست التي تضاعف قيمة ساعتك السوقية — تنمو تلقائياً مع ساعات مشاريعك أو بتسجيل تطبيق عملي.
            </p>
          </div>
          <Badge tint={T.accent}>
            إجمالي الساعات التجارية: {ventureMetrics.totalHours + monthHours} ساعة
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skillLevels.map((sk) => (
            <div
              key={sk.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13.5px] font-extrabold text-white">
                    {sk.label}
                  </span>
                  <span
                    className="rounded-lg px-2 py-0.5 text-[11px] font-black tabular-nums"
                    style={{
                      backgroundColor: `${T.accent}22`,
                      color: T.accent,
                    }}
                  >
                    Lv.{sk.level}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/45">{sk.desc}</p>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] text-white/50">
                  <span>{sk.totalXp} XP</span>
                  <span>{sk.linkedCount} مشاريع مرتبطة</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sk.progressInLevel}%`,
                      backgroundColor: T.accent,
                    }}
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-end">
                  <button
                    onClick={() => bumpSkillXp(sk.id, 15)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10.5px] font-bold text-white/75 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    + تطبيق عملي (+15 XP)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ===================================================================
          سجل الدخل والمصاريف
          =================================================================== */}
      <Card className="p-6 sm:p-7">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          تسجيل دخل
        </h3>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="المصدر — مثال: توصيل / مشروع حر"
          />
          <Field
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            inputMode="decimal"
            placeholder="ساعات"
            className="sm:max-w-[130px]"
          />
          <Field
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIncome()}
            inputMode="decimal"
            placeholder="المبلغ"
            className="sm:max-w-[150px]"
          />
          <Btn variant="default" onClick={addIncome} className="shrink-0">
            <Plus size={15} strokeWidth={3} /> إضافة
          </Btn>
        </div>

        <div className="mt-5 space-y-2">
          {income.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا دخل مسجّل بعد
            </p>
          ) : (
            income.slice(0, 12).map((e) => (
              <div
                key={e.id}
                className="group flex items-center gap-3 rounded-xl border px-4 py-2.5"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px]">{e.label}</span>
                {e.hours > 0 && (
                  <span
                    className="shrink-0 text-[10.5px] tabular-nums"
                    dir="ltr"
                    style={{ color: T.faint }}
                  >
                    {e.hours}h
                  </span>
                )}
                <span
                  className="shrink-0 text-[13px] font-extrabold tabular-nums"
                  dir="ltr"
                  style={{ color: T.primary }}
                >
                  {money(e.amount)}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums" dir="ltr" style={{ color: T.faint }}>
                  {e.date.slice(5)}
                </span>
                <button
                  onClick={() => removeIncome(e.id)}
                  aria-label={`حذف ${e.label}`}
                  className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <h3 className="text-[17px] font-extrabold" style={{ color: T.ctaLift }}>
          تسجيل مصروف
        </h3>
        <p className="mt-1.5 text-[11.5px]" style={{ color: T.faint }}>
          أسرع طريق لهذا السطر هي لوحة الأوامر `Ctrl + K`: «ص ٣٥ غداء».
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Field
            value={spentLabel}
            onChange={(e) => setSpentLabel(e.target.value)}
            placeholder="على ماذا — مثال: غداء"
          />
          <Field
            value={spentAmount}
            onChange={(e) => setSpentAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addExpense()}
            inputMode="decimal"
            placeholder="المبلغ"
            className="sm:max-w-[150px]"
          />
          <Btn variant="default" onClick={addExpense} className="shrink-0">
            <Plus size={15} strokeWidth={3} /> إضافة
          </Btn>
        </div>

        <div className="mt-5 space-y-2">
          {expenses.length === 0 ? (
            <p
              className="rounded-xl border border-dashed py-8 text-center text-[11.5px]"
              style={{ borderColor: T.border, color: T.faint }}
            >
              لا مصروف مسجّل بعد
            </p>
          ) : (
            expenses.slice(0, 12).map((e) => (
              <div
                key={e.id}
                className="group flex items-center gap-3 rounded-xl border px-4 py-2.5"
                style={{ borderColor: T.border, background: "rgba(255,255,255,0.03)" }}
              >
                <span className="min-w-0 flex-1 truncate text-[13px]">{e.label}</span>
                <span
                  className="shrink-0 text-[13px] font-extrabold tabular-nums"
                  dir="ltr"
                  style={{ color: T.ember }}
                >
                  {money(e.amount)}
                </span>
                <span
                  className="shrink-0 text-[10px] tabular-nums"
                  dir="ltr"
                  style={{ color: T.faint }}
                >
                  {e.date.slice(5)}
                </span>
                <button
                  onClick={() => removeExpense(e.id)}
                  aria-label={`حذف ${e.label}`}
                  className="shrink-0 rounded p-1 text-white/25 opacity-40 transition-all hover:text-red-400 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* نافذة إضافة / تعديل مشروع تجاري */}
      <Modal
        open={!!venture}
        onClose={() => setVenture(null)}
        title={venture?.id ? "تعديل المشروع التجاري" : "مشروع / فكرة تجارية جديدة"}
        onDelete={
          venture?.id
            ? () => {
                removeVenture(venture.id);
                setVenture(null);
              }
            : undefined
        }
        footer={
          <>
            <Btn variant="default" className="flex-1" onClick={saveVenture}>
              حفظ المشروع
            </Btn>
            <Btn variant="outline" className="flex-1" onClick={() => setVenture(null)}>
              إلغاء
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="los-v-name" className="mb-1.5 block text-xs text-white/45">
              اسم المشروع أو الفكرة
            </label>
            <Field
              id="los-v-name"
              autoFocus
              value={venture?.name || ""}
              onChange={(e) => setVenture((s) => ({ ...s, name: e.target.value }))}
              placeholder="مثال: خدمة أتمتة للشركات الصغيرة / متجر رقمي"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/45">
              مرحلة المشروع الحالية
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {VENTURE_STAGES.map((st) => {
                const picked = (venture?.stage || "idea") === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setVenture((s) => ({ ...s, stage: st.id }))}
                    className="rounded-xl border px-2.5 py-2 text-[11px] font-bold transition-all"
                    style={{
                      borderColor: picked ? `${st.tint}80` : T.border,
                      backgroundColor: picked ? `${st.tint}20` : "rgba(255,255,255,0.02)",
                      color: picked ? st.tint : T.muted,
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="los-v-cost" className="mb-1.5 block text-xs text-white/45">
                الكلفة المتوقّعة (ر.س)
              </label>
              <Field
                id="los-v-cost"
                inputMode="decimal"
                value={venture?.cost || ""}
                onChange={(e) => setVenture((s) => ({ ...s, cost: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="los-v-rev" className="mb-1.5 block text-xs text-white/45">
                العائد المتوقّع (ر.س)
              </label>
              <Field
                id="los-v-rev"
                inputMode="decimal"
                value={venture?.revenue || ""}
                onChange={(e) => setVenture((s) => ({ ...s, revenue: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="los-v-act-rev" className="mb-1.5 block text-xs text-white/45">
                العائد الفعلي المحقق (ر.س)
              </label>
              <Field
                id="los-v-act-rev"
                inputMode="decimal"
                value={venture?.actualRevenue || ""}
                onChange={(e) => setVenture((s) => ({ ...s, actualRevenue: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="los-v-hrs" className="mb-1.5 block text-xs text-white/45">
                الساعات المستثمرة
              </label>
              <Field
                id="los-v-hrs"
                inputMode="decimal"
                value={venture?.hoursInvested || ""}
                onChange={(e) => setVenture((s) => ({ ...s, hoursInvested: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="los-v-next" className="mb-1.5 block text-xs text-white/45">
              الخطوة التنفيذية القادمة (تتحول لمهمة بضغطة زر)
            </label>
            <Field
              id="los-v-next"
              value={venture?.nextStep || ""}
              onChange={(e) => setVenture((s) => ({ ...s, nextStep: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && saveVenture()}
              placeholder="مثال: كتابة صفحة الهبوط والتواصل مع أول 5 عملاء"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/45">
              المهارات التجارية المرتبطة بالمشروع
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMERCIAL_SKILLS.map((sk) => {
                const currentSkills = Array.isArray(venture?.skills) ? venture.skills : [];
                const active = currentSkills.includes(sk.id);
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() =>
                      setVenture((s) => {
                        const list = Array.isArray(s?.skills) ? s.skills : [];
                        return {
                          ...s,
                          skills: active
                            ? list.filter((x) => x !== sk.id)
                            : [...list, sk.id],
                        };
                      })
                    }
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors"
                    style={{
                      borderColor: active ? `${T.accent}66` : T.border,
                      backgroundColor: active ? `${T.accent}1F` : "transparent",
                      color: active ? T.accent : T.faint,
                    }}
                  >
                    #{sk.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
