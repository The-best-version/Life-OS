// src/features/life-wrapped.jsx
// ============================================================================
// الميزة #7: الحصاد والمراجعة التنفيذية السينمائية الحية (Live Weekly & Yearly Wrapped)
// + الميزة #4 (الجديدة): تقرير «الطباعة الملكية» (Executive PDF / Print Studio)
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Check,
  Plus,
  Sparkles,
  Award,
  Calendar,
  Zap,
  FileText,
  Download,
  X,
} from "lucide-react";
import {
  streakRunFrom,
  bestRun,
  cleanDays,
  bleedSaved,
  sumPages,
  netBalance,
  amountSum,
  sinceDays,
  taskShape,
  dayKey,
} from "../state/life-state.mjs";

function computeExecutiveRankTitle(liveStats) {
  const xp =
    (liveStats.totalHabitsDone || 0) * 15 +
    (liveStats.completedTasksCount || 0) * 25 +
    Math.round((liveStats.deepWorkHours || 0) * 40) +
    (liveStats.currentStreak || 0) * 30 +
    (liveStats.totalPages || 0) * 2;

  if (xp >= 15000) return { title: "🌟 أسطورة السيادة الشاملة", level: 7, xp };
  if (xp >= 9000) return { title: "👑 رائد أثر 2030", level: 6, xp };
  if (xp >= 5000) return { title: "🏛️ معماري السيادة", level: 5, xp };
  if (xp >= 2500) return { title: "⚔️ قائد التنفيذ", level: 4, xp };
  if (xp >= 1200) return { title: "🧭 مهندس الأولويات", level: 3, xp };
  if (xp >= 400) return { title: "🔨 صانع العادات", level: 2, xp };
  return { title: "🌱 متدرب الانضباط", level: 1, xp };
}

/* ============================================================================
 * استوديو «الطباعة الملكية» (Executive PDF / Print Studio Modal)
 * ============================================================================ */
function ExecutivePrintStudioModal({
  open,
  onClose,
  scope,
  liveStats,
  topTasks,
  currentYear,
}) {
  if (!open) return null;

  const isWeek = scope === "week";
  const rank = computeExecutiveRankTitle(liveStats);
  const reportDate = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrintExecutivePdf = () => {
    const printWin = window.open("", "_blank", "width=960,height=1100");
    if (!printWin) {
      window.print();
      return;
    }

    const prioritiesHtml =
      topTasks.length > 0
        ? topTasks
            .map(
              (t, i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:8px;background:#f8fafc;">
            <span style="font-weight:800;color:#0f172a;font-size:13px;">${i + 1}. ${t.text}</span>
            <span style="font-size:11px;font-weight:700;color:#047857;background:#d1fae5;padding:3px 10px;border-radius:999px;">${
              t.top ? "أولوية قصوى ⭐" : "مهمة معتمدة"
            }</span>
          </div>`
            )
            .join("")
        : `<p style="color:#64748b;font-size:12px;">جميع المهام المفتوحة مكتملة في هذه الفترة.</p>`;

    const docHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>التقرير التنفيذي الملكي — أثر 2030 (${dayKey()})</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; font-family: "Tajawal", "Cairo", "Segoe UI", Tahoma, sans-serif; }
    body {
      margin: 0;
      padding: 24px;
      background: #ffffff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 820px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      border-radius: 20px;
      padding: 28px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .brand {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
    }
    .sub {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
      font-weight: 700;
    }
    .seal {
      text-align: left;
      border: 1.5px solid #047857;
      background: #ecfdf5;
      color: #065f46;
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 800;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 22px;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 14px;
      background: #f8fafc;
    }
    .card-label {
      font-size: 11px;
      color: #475569;
      font-weight: 700;
    }
    .card-val {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      margin: 6px 0 2px;
    }
    .card-extra {
      font-size: 10.5px;
      color: #047857;
      font-weight: 700;
    }
    .bar-wrap {
      margin-bottom: 22px;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 16px;
    }
    .bar-row {
      margin-bottom: 10px;
    }
    .bar-head {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .bar-track {
      height: 10px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #059669, #0284c7);
      border-radius: 999px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed #94a3b8;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1 class="brand">أثر 2030 · التقرير التنفيذي الملكي</h1>
        <div class="sub">${
          isWeek ? "وثيقة حصاد الأسبوع ومراجعة الجمعة التنفيذية" : `وثيقة حصاد السنة التنفيذية ${currentYear}`
        } · ${reportDate}</div>
      </div>
      <div class="seal">
        <div>الرتبة: ${rank.title}</div>
        <div style="font-size:10.5px;margin-top:2px;">المستوى ${rank.level}/7 · ${rank.xp} XP</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-label">متوسط الانضباط العام</div>
        <div class="card-val">${liveStats.avgDiscipline}%</div>
        <div class="card-extra">خلال ${liveStats.daysLogged} يوم موثق</div>
      </div>
      <div class="card">
        <div class="card-label">السلسلة والعادات المنجزة</div>
        <div class="card-val">${liveStats.totalHabitsDone}</div>
        <div class="card-extra">السلسلة الحالية: ${liveStats.currentStreak} يوم 🔥</div>
      </div>
      <div class="card">
        <div class="card-label">ساعات العمل العميق</div>
        <div class="card-val">${liveStats.deepWorkHours} ساعة</div>
        <div class="card-extra">${liveStats.sessionCount} جلسة · ${liveStats.completedTasksCount} مهمة منجزة</div>
      </div>
      <div class="card">
        <div class="card-label">البناء المعرفي والقراءة</div>
        <div class="card-val">${liveStats.totalPages} صفحة</div>
        <div class="card-extra">الكتب المكتملة: ${liveStats.finishedBooks} كتب</div>
      </div>
      <div class="card">
        <div class="card-label">الحصن المالي وصافي الرصيد</div>
        <div class="card-val">${Math.round(liveStats.totalNet)} ر.س</div>
        <div class="card-extra">دخل: ${Math.round(liveStats.periodIncome)} · صرف: ${Math.round(liveStats.periodExpense)}</div>
      </div>
      <div class="card">
        <div class="card-label">السيادة وكاسر العادات</div>
        <div class="card-val">${liveStats.totalCleanDays + liveStats.urgesWon}</div>
        <div class="card-extra">${liveStats.totalCleanDays} يوم صافٍ · ${liveStats.urgesWon} انتصار</div>
      </div>
    </div>

    <div class="bar-wrap">
      <div style="font-size:13px;font-weight:900;margin-bottom:12px;">📊 مؤشرات التوازن الاستراتيجي</div>
      <div class="bar-row">
        <div class="bar-head"><span>الانضباط الروتيني والصلوات</span><span>${liveStats.avgDiscipline}%</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, liveStats.avgDiscipline)}%"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-head"><span>كفاءة العمل العميق وإغلاق المهام</span><span>${Math.min(100, liveStats.completedTasksCount * 12 + Math.round(liveStats.deepWorkHours * 10))}%</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, liveStats.completedTasksCount * 12 + Math.round(liveStats.deepWorkHours * 10))}%"></div></div>
      </div>
    </div>

    <div>
      <div style="font-size:13px;font-weight:900;margin-bottom:10px;">🎯 الأولويات التنفيذية المعتمدة للمرحلة القادمة</div>
      ${prioritiesHtml}
    </div>

    <div class="footer">
      <span>صدر رسمياً من نظام أثر 2030 — 2027 Life OS</span>
      <span>خاتم التوثيق التنفيذي · الانضباط حرية مؤجّلة</span>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(docHtml);
    printWin.document.close();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[96] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl overflow-y-auto"
    >
      <div className="my-auto w-full max-w-3xl rounded-3xl border border-amber-400/30 bg-[#0b101d] p-6 sm:p-8 text-white shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/15 text-amber-300">
              <FileText size={22} />
            </span>
            <div>
              <h3 className="text-lg font-black text-white">
                استوديو «الطباعة الملكية» (Executive PDF Studio)
              </h3>
              <p className="text-xs text-white/55">
                معاينة وثيقة مجلس الإدارة الشخصي — جاهزة للطباعة الورقية أو الحفظ كـ PDF فاخر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintExecutivePdf}
              className="flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-2.5 text-xs font-black text-black shadow-lg transition-transform hover:scale-105"
            >
              <Download size={15} /> طباعة / حفظ كـ PDF ملكي 🖨️
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* معاينة الوثيقة الملكية */}
        <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                وثيقة أداء رسمية · أثر 2030
              </span>
              <h4 className="text-xl font-black text-white mt-1">
                {isWeek
                  ? "تقرير حصاد الأسبوع ومراجعة الجمعة التنفيذية"
                  : `التقرير السنوي الشامل لعام ${currentYear}`}
              </h4>
              <p className="text-xs text-white/50 mt-0.5">{reportDate}</p>
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-right">
              <p className="text-xs font-black text-emerald-300">{rank.title}</p>
              <p className="text-[11px] text-white/60 mt-0.5">
                المستوى {rank.level}/7 · {rank.xp} XP
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <p className="text-[11px] text-white/50">متوسط الانضباط</p>
              <p className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                {liveStats.avgDiscipline}%
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <p className="text-[11px] text-white/50">العادات والصلوات</p>
              <p className="text-2xl font-black text-amber-300 mt-1 tabular-nums">
                {liveStats.totalHabitsDone}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <p className="text-[11px] text-white/50">العمل العميق</p>
              <p className="text-2xl font-black text-sky-300 mt-1 tabular-nums">
                {liveStats.deepWorkHours} س
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <p className="text-[11px] text-white/50">القراءة والمعرفة</p>
              <p className="text-2xl font-black text-white mt-1 tabular-nums">
                {liveStats.totalPages} ص
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <p className="text-[11px] text-white/50">صافي الرصيد المالي</p>
              <p className="text-2xl font-black text-emerald-300 mt-1 tabular-nums">
                {Math.round(liveStats.totalNet)} ر.س
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <p className="text-[11px] text-white/50">انتصارات السيادة</p>
              <p className="text-2xl font-black text-rose-300 mt-1 tabular-nums">
                {liveStats.totalCleanDays + liveStats.urgesWon}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LifeWrapped = ({ state = {}, setState }) => {
  const [scope, setScope] = useState("week"); // "week" (حصاد الأسبوع) | "year" (حصاد السنة)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newPriorityText, setNewPriorityText] = useState("");
  const [committedToast, setCommittedToast] = useState(false);
  const [printStudioOpen, setPrintStudioOpen] = useState(false);

  const currentHour = new Date().getHours();
  const isNight = currentHour >= 18 || currentHour < 5;
  const currentYear = new Date().getFullYear();

  // ==========================================================================
  // حساب الإحصاءات الحية 100% من state (للأسبوع الأخير أو للسنة كاملة)
  // ==========================================================================
  const liveStats = useMemo(() => {
    const history = Array.isArray(state.history) ? state.history : [];
    const habits = Array.isArray(state.habits) ? state.habits : [];
    const sessions = Array.isArray(state.sessions) ? state.sessions : [];
    const books = Array.isArray(state.books) ? state.books : [];
    const reads = Array.isArray(state.reading) ? state.reading : [];
    const badHabits = Array.isArray(state.badHabits) ? state.badHabits : [];
    const tasks = Array.isArray(state.tasks) ? state.tasks : [];
    const goals = Array.isArray(state.goals) ? state.goals : [];
    const income = Array.isArray(state.income) ? state.income : [];
    const expenses = Array.isArray(state.expenses) ? state.expenses : [];

    const isWeek = scope === "week";
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (isWeek ? 7 : 365));
    const cutoffIso = `${cutoffDate.getFullYear()}-${String(
      cutoffDate.getMonth() + 1
    ).padStart(2, "0")}-${String(cutoffDate.getDate()).padStart(2, "0")}`;

    const scopedHistory = history.filter((h) => h && h.date >= cutoffIso);

    // 1. سلسلة الالتزام ومتوسط الانضباط
    const streakObj = streakRunFrom(history);
    const currentStreak = streakObj?.days || 0;
    const avgDiscipline = scopedHistory.length
      ? Math.round(
          scopedHistory.reduce((s, h) => s + (Number(h.pct) || 0), 0) /
            scopedHistory.length
        )
      : habits.length
        ? Math.round(
            (habits.filter((h) => h.done).length / habits.length) * 100
          )
        : 0;

    // 2. إجمالي العادات والصلوات المنجزة
    const todayDoneCount = habits.filter((h) => h.done).length;
    const historyHabitCompletions = scopedHistory.reduce(
      (sum, h) => sum + (Array.isArray(h.done) ? h.done.length : 0),
      0
    );
    const totalHabitsDone = Math.max(
      todayDoneCount,
      historyHabitCompletions + todayDoneCount
    );

    // 3. ساعات العمل العميق
    const scopedSessions = sessions.filter(
      (s) => s && (s.date || "") >= cutoffIso
    );
    const totalFocusMins = scopedSessions.reduce(
      (sum, s) => sum + (Number(s.minutes) || 0),
      0
    );
    const deepWorkHours =
      Math.round((totalFocusMins / 60) * 10) / 10;
    const sessionCount = scopedSessions.length;

    // 4. الكتب والصفحات المقروءة
    const totalPages =
      sumPages(reads, isWeek ? 7 : 365) ||
      books.reduce((s, b) => s + (Number(b.current) || 0), 0);
    const finishedBooks = books.filter(
      (b) => b.status === "done" || (b.total > 0 && b.current >= b.total)
    ).length;
    const activeBook =
      books.find((b) => b.status === "reading") || books[0] || null;

    // 5. كاسر العادات والانتصارات على التشتت
    const totalCleanDays = badHabits.reduce((s, b) => s + cleanDays(b), 0);
    const bestCleanRun = badHabits.reduce(
      (max, b) => Math.max(max, bestRun(b)),
      0
    );
    const urgesWon = badHabits.reduce(
      (s, b) => s + (Array.isArray(b.urges) ? b.urges.length : 0),
      0
    );
    const totalSavedMoney = badHabits.reduce(
      (s, b) => s + (b.costType === "money" ? bleedSaved(b) : 0),
      0
    );

    // 6. المهام والأهداف والمالية
    const completedTasksCount = tasks.filter((t) => t.done).length;
    const completedGoalsCount = goals.filter((g) => g.done).length;
    const periodIncome = amountSum(sinceDays(income, isWeek ? 7 : 365));
    const periodExpense = amountSum(sinceDays(expenses, isWeek ? 7 : 365));
    const totalNet = netBalance(income, expenses);

    return {
      currentStreak,
      avgDiscipline,
      totalHabitsDone,
      deepWorkHours,
      totalFocusMins,
      sessionCount,
      totalPages,
      finishedBooks,
      activeBookTitle: activeBook?.title || null,
      totalCleanDays,
      bestCleanRun,
      urgesWon,
      totalSavedMoney,
      completedTasksCount,
      completedGoalsCount,
      periodIncome,
      periodExpense,
      totalNet,
      daysLogged: scopedHistory.length || 1,
    };
  }, [state, scope]);

  // ==========================================================================
  // الشرائح السينمائية (تتكيف مع حصاد الأسبوع أو حصاد السنة)
  // ==========================================================================
  const isWeek = scope === "week";

  const slides = [
    {
      id: "intro",
      icon: isWeek ? "🕌" : isNight ? "🌙" : "☀️",
      badge: isWeek ? "مراجعة الجمعة التنفيذية" : `حصاد سنة ${currentYear}`,
      title: isWeek
        ? "وقفة محاسبة وحصاد للأسبوع.."
        : isNight
          ? `سهرة ${currentYear} مع أثر..`
          : `رحلة ${currentYear} مع أثر..`,
      subtitle: isWeek
        ? `في آخر 7 أيام، سجّلت حضورك بمتوسط انضباط ${liveStats.avgDiscipline}% — تعال نراجع أرقامك الحقيقية قبل أن نرسم الأسبوع القادم.`
        : `نظرة سينمائية شاملة على كل ما بنيته وأنجزته في نظام حياتك (${liveStats.daysLogged} يوماً موثقاً).`,
      value: `${liveStats.avgDiscipline}%`,
      unit: "متوسط الانضباط العام",
      gradient: isNight
        ? "linear-gradient(135deg, #0f172a, #1e1b4b, #052e16)"
        : "linear-gradient(135deg, #065f46, #1e1b4b, #0f172a)",
    },
    {
      id: "habits",
      icon: "🔥",
      badge: "الاستمرارية والصلوات",
      title: "الالتزام لم يكن صدفة..",
      subtitle: `حافظت على سلسلة التزام نشطة وأنجزت ${liveStats.totalHabitsDone} عادة وفرضاً موثقاً في سجلّك!`,
      value: liveStats.currentStreak || liveStats.totalHabitsDone,
      unit:
        liveStats.currentStreak > 0
          ? "يوم في السلسلة الحالية (Streak)"
          : "عادة وفرض مُنجز",
      extra: `إجمالي العادات المؤشرة في هذه الفترة: ${liveStats.totalHabitsDone} إنجاز`,
      gradient: isNight
        ? "linear-gradient(135deg, #3b0764, #0f172a)"
        : "linear-gradient(135deg, #b45309, #7c2d12)",
    },
    {
      id: "focus",
      icon: "🧠",
      badge: "العمل العميق والإنتاج",
      title: "غصت في التركيز الخالص..",
      subtitle:
        liveStats.sessionCount > 0
          ? `أتممت ${liveStats.sessionCount} جلسة عمل عميق (${liveStats.totalFocusMins} دقيقة صافية) بعيداً عن المشتتات.`
          : `أنجزت ${liveStats.completedTasksCount} مهمة أساسية في مصفوفة أعمالك.`,
      value:
        liveStats.deepWorkHours > 0
          ? liveStats.deepWorkHours
          : liveStats.completedTasksCount,
      unit: liveStats.deepWorkHours > 0 ? "ساعة عمل عميق" : "مهمة مكتملة",
      extra: `الأهداف المحققة بالكامل في إرثي 2030: ${liveStats.completedGoalsCount} أهداف`,
      gradient: isNight
        ? "linear-gradient(135deg, #172554, #0f172a)"
        : "linear-gradient(135deg, #1d4ed8, #312e81)",
    },
    {
      id: "knowledge",
      icon: "📚",
      badge: "المعرفة والقراءة",
      title: "عقل يتوسع كل يوم..",
      subtitle: liveStats.activeBookTitle
        ? `تقرأ حالياً في «${liveStats.activeBookTitle}» وأتممت ${liveStats.finishedBooks} كتاباً في مكتبتك.`
        : `كل صفحة تقرؤها تبني وعيك لعام 2030.`,
      value: liveStats.totalPages,
      unit: "صفحة مقروءة",
      extra: `الكتب المنجزة: ${liveStats.finishedBooks} كتب`,
      gradient: isNight
        ? "linear-gradient(135deg, #022c22, #0f172a)"
        : "linear-gradient(135deg, #047857, #115e59)",
    },
    {
      id: "breaker_finance",
      icon: "🛡️",
      badge: "قوة الإرادة والحصن المالي",
      title: "انتصرت على التشتت وحفظت رصيدك!",
      subtitle: `تغلبت على ${liveStats.urgesWon} نزوة تشتت، وجمعت ${liveStats.totalCleanDays} يوم تعافٍ صافٍ في كاسر العادات.`,
      value: liveStats.totalCleanDays + liveStats.urgesWon,
      unit: "انتصار ويوم صافٍ",
      extra: `دخل الفترة: ${Math.round(
        liveStats.periodIncome
      )} ر.س · مصروف الفترة: ${Math.round(
        liveStats.periodExpense
      )} ر.س · صافي الرصيد: ${Math.round(liveStats.totalNet)} ر.س`,
      gradient: isNight
        ? "linear-gradient(135deg, #4c0519, #090d16)"
        : "linear-gradient(135deg, #9f1239, #450a0a)",
    },
    {
      id: "action",
      icon: "🚀",
      badge: "القرار التنفيذي القادم",
      title: isWeek ? "بوصلة الأسبوع القادم" : "خطوتك القادمة نحو 2030",
      subtitle:
        "المراجعة الحقيقية تنتهي بقرار. اختر أو أضف أهم أولوية للأيام القادمة لتتصدر شاشة «اليوم» الآن:",
      isActionSlide: true,
      gradient: "linear-gradient(135deg, #0f172a, #1e1b4b, #064e3b)",
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const current = slides[currentSlide] || slides[0];

  const topTasks = useMemo(
    () => (state.tasks || []).filter((t) => !t.done).slice(0, 5),
    [state.tasks]
  );

  const handleAddTopPriority = () => {
    const txt = newPriorityText.trim();
    if (!txt || !setState) return;
    setState((prev) => ({
      ...prev,
      tasks: [
        taskShape({ text: txt, quadrant: "q1", top: true, done: false }),
        ...(prev.tasks || []),
      ],
    }));
    setNewPriorityText("");
    setCommittedToast(true);
    setTimeout(() => setCommittedToast(false), 3000);
  };

  const handleToggleTop = (taskId) => {
    if (!setState) return;
    setState((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).map((t) =>
        t.id === taskId ? { ...t, top: !t.top } : t
      ),
    }));
  };

  return (
    <div
      className="w-full min-h-[82vh] rounded-[2.5rem] border border-white/15 flex flex-col items-center justify-between p-6 sm:p-10 text-white transition-all duration-700 relative overflow-hidden shadow-2xl"
      style={{ background: current.gradient }}
    >
      {/* تأثير النجوم الخلفية */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* الشريط العلوي: شريط تقدم الشرائح + التبديل بين حصاد الأسبوع وحصاد السنة + زر الطباعة الملكية */}
      <div className="w-full z-20 space-y-4">
        <div className="flex gap-2">
          {slides.map((sl, index) => (
            <button
              key={sl.id}
              onClick={() => setCurrentSlide(index)}
              aria-label={`شريحة ${index + 1}`}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                index <= currentSlide
                  ? "bg-white shadow-sm"
                  : "bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl border border-white/15 bg-black/35 p-1 backdrop-blur-md">
            <button
              onClick={() => {
                setScope("week");
                setCurrentSlide(0);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-extrabold transition-all ${
                scope === "week"
                  ? "bg-emerald-500 text-black shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Calendar size={13} />
              حصاد الأسبوع (مراجعة الجمعة)
            </button>
            <button
              onClick={() => {
                setScope("year");
                setCurrentSlide(0);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-extrabold transition-all ${
                scope === "year"
                  ? "bg-amber-400 text-black shadow-lg"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Award size={13} />
              حصاد السنة {currentYear}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPrintStudioOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/20 px-4 py-1.5 text-[11.5px] font-black text-amber-200 shadow-lg backdrop-blur-md transition-all hover:bg-amber-400/30 hover:scale-105"
            >
              <FileText size={13} />
              تقرير الطباعة الملكية (PDF) 🖨️
            </button>

            <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11.5px] font-bold text-white/90 backdrop-blur-md">
              {current.badge} · {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>
      </div>

      {/* محتوى الشريحة الوسطى */}
      <div
        key={`${scope}-${current.id}`}
        className="flex flex-col items-center text-center z-20 w-full max-w-2xl px-2 my-auto py-8"
        style={{ animation: "fadeInUp 0.5s ease-out forwards" }}
      >
        <div className="text-6xl mb-4 drop-shadow-xl">{current.icon}</div>

        <h2 className="text-3xl sm:text-4xl font-black mb-3 drop-shadow-lg leading-snug">
          {current.title}
        </h2>

        <p className="text-base sm:text-lg text-white/85 mb-8 max-w-xl mx-auto leading-relaxed">
          {current.subtitle}
        </p>

        {!current.isActionSlide ? (
          <>
            <div
              className="text-7xl sm:text-8xl font-black text-white drop-shadow-2xl my-2 tabular-nums"
              style={{
                animation: "scaleIn 0.45s ease-out 0.15s forwards",
                opacity: 0,
              }}
            >
              {current.value}
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-300 block mt-3">
                {current.unit}
              </span>
            </div>

            {current.extra && (
              <div className="mt-6 rounded-2xl border border-white/15 bg-black/30 px-5 py-2.5 text-[13px] font-bold text-white/85 backdrop-blur-md">
                {current.extra}
              </div>
            )}
          </>
        ) : (
          /* الشريحة التفاعلية لاختيار واعتماد أولويات الأسبوع القادم */
          <div className="w-full max-w-xl space-y-4 text-right">
            {committedToast && (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-[13px] font-extrabold text-black shadow-lg">
                <Check size={16} /> تمت إضافة الأولوية إلى أهم مهام اليوم!
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newPriorityText}
                onChange={(e) => setNewPriorityText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTopPriority()}
                placeholder="اكتب أولوية حاسمة للأسبوع القادم (مثال: إنهاء مشروع...)"
                className="flex-1 rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-[13.5px] font-bold text-white placeholder-white/40 outline-none focus:border-emerald-400"
              />
              <button
                onClick={handleAddTopPriority}
                className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-emerald-500 px-5 py-3 text-[13px] font-black text-black transition-transform hover:scale-105 active:scale-95"
              >
                <Plus size={16} strokeWidth={3} /> اعتماد
              </button>
            </div>

            {topTasks.length > 0 && (
              <div className="rounded-2xl border border-white/15 bg-black/35 p-4 space-y-2 backdrop-blur-md">
                <p className="text-[11.5px] font-extrabold text-white/60 mb-2">
                  مهامك المفتوحة حالياً (اضغط لتثبيتها في الثلاث الأهم ⭐):
                </p>
                {topTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleToggleTop(t.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-right transition-all ${
                      t.top
                        ? "border-emerald-400/50 bg-emerald-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    <span className="truncate text-[13px] font-bold">
                      {t.text}
                    </span>
                    <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10.5px] font-extrabold bg-black/30">
                      {t.top ? "مثبّتة في الثلاث الأهم ⭐" : "تثبيت للغد"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* أزرار التنقل السفلية */}
      <div className="w-full flex items-center justify-between gap-4 z-20 pt-4 border-t border-white/10">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-5 py-2.5 text-[13px] font-extrabold text-white transition-all hover:bg-white/15 disabled:opacity-30"
        >
          <ChevronRight size={16} /> السابق
        </button>

        {currentSlide === slides.length - 1 ? (
          <button
            onClick={() => setCurrentSlide(0)}
            className="flex items-center gap-2 rounded-full bg-white px-7 py-2.5 text-[13px] font-black text-black shadow-xl transition-transform hover:scale-105"
          >
            <RotateCcw size={15} /> إعادة العرض من البداية
          </button>
        ) : (
          <button
            onClick={nextSlide}
            className="flex items-center gap-2 rounded-full bg-white px-7 py-2.5 text-[13px] font-black text-black shadow-xl transition-transform hover:scale-105"
          >
            الشريحة التالية <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* نافذة استوديو الطباعة الملكية (Executive PDF / Print Studio) */}
      <ExecutivePrintStudioModal
        open={printStudioOpen}
        onClose={() => setPrintStudioOpen(false)}
        scope={scope}
        liveStats={liveStats}
        topTasks={topTasks}
        currentYear={currentYear}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LifeWrapped;
