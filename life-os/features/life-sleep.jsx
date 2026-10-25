// src/features/life-sleep.jsx
// ============================================================================
// 🌙 مختبر النوم الذكي (Sleep Architecture & Recovery Lab)
// حاسبة دورات النوم الـ 90 دقيقة + سجل النوم وعجز النوم + بروتوكول الغروب الرقمي
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Moon,
  Sun,
  Clock,
  Sparkles,
  Zap,
  BatteryCharging,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Coffee,
  Bed,
  Smile,
  Meh,
  Frown,
  Timer,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Volume2,
  Trash2,
} from "lucide-react";
import { Card, Badge, T } from "../components/life-shared.jsx";
import { dayKey, uid } from "../state/life-state.mjs";

const SLEEP_LOGS_KEY = "life_os_sleep_logs_v1";

// دورة النوم الكاملة = 90 دقيقة (1.5 ساعة)
// متوسط الوقت المستغرق للاستغراق في النوم = 15 دقيقة
const CYCLE_MINUTES = 90;
const FALL_ASLEEP_MINUTES = 15;

export function SleepLabModule({ state, setState }) {
  // وضع الحاسبة: "sleep_now" (نمت الآن متى أستيقظ؟) | "wake_at" (أريد الاستيقاظ في وقت محدد متى أنام؟)
  const [calcMode, setCalcMode] = useState("sleep_now");
  const [targetWakeTime, setTargetWakeTime] = useState("06:30");

  // سجلات النوم المحفوظة
  const [sleepLogs, setSleepLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(SLEEP_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SLEEP_LOGS_KEY, JSON.stringify(sleepLogs));
    } catch {}
  }, [sleepLogs]);

  // إدخال سجل نوم جديد يدوياً
  const [logDate, setLogDate] = useState(dayKey());
  const [bedTime, setBedTime] = useState("23:30");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepQuality, setSleepQuality] = useState(4); // 1 إلى 5
  const [sleepNotes, setSleepNotes] = useState("");
  const [saveNotice, setSaveNotice] = useState(false);

  // حساب الساعات بين وقت النوم والاستيقاظ
  const calculateDuration = (startStr, endStr) => {
    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    let startMin = startH * 60 + startM;
    let endMin = endH * 60 + endM;
    if (endMin <= startMin) {
      endMin += 24 * 60; // عبر منتصف الليل
    }
    const diffMin = endMin - startMin;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    const decimal = +(diffMin / 60).toFixed(1);
    const cycles = +(diffMin / 90).toFixed(1);
    return { hours, mins, decimal, cycles };
  };

  // أوقات الاستيقاظ المثالية إذا نمت الآن
  const wakeUpOptions = useMemo(() => {
    const now = new Date();
    const options = [];
    // من 3 دورات (4.5 ساعات) إلى 6 دورات (9 ساعات)
    for (let c = 3; c <= 6; c++) {
      const totalMin = c * CYCLE_MINUTES + FALL_ASLEEP_MINUTES;
      const wakeDate = new Date(now.getTime() + totalMin * 60000);
      const timeStr = wakeDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const hours = (c * 1.5).toFixed(1);
      options.push({
        cycles: c,
        time: timeStr,
        hours,
        tag: c === 5 ? "المثالي 🌟" : c === 6 ? "تعافٍ عميق 🔋" : c === 4 ? "طاقة جيدة ⚡" : "حد أدنى ⚠️",
        tint: c === 5 ? T.primary : c === 6 ? T.sky : c === 4 ? T.accent : T.warn,
      });
    }
    return options;
  }, []);

  // أوقات النوم المثالية إذا أردت الاستيقاظ في وقت محدد
  const bedtimeOptions = useMemo(() => {
    const [h, m] = targetWakeTime.split(":").map(Number);
    const wakeRef = new Date();
    wakeRef.setHours(h, m, 0, 0);

    const options = [];
    for (let c = 6; c >= 3; c--) {
      const totalMin = c * CYCLE_MINUTES + FALL_ASLEEP_MINUTES;
      const sleepDate = new Date(wakeRef.getTime() - totalMin * 60000);
      const timeStr = sleepDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const hours = (c * 1.5).toFixed(1);
      options.push({
        cycles: c,
        time: timeStr,
        hours,
        tag: c === 5 ? "المثالي 🌟" : c === 6 ? "تعافٍ عميق 🔋" : c === 4 ? "طاقة جيدة ⚡" : "حد أدنى ⚠️",
        tint: c === 5 ? T.primary : c === 6 ? T.sky : c === 4 ? T.accent : T.warn,
      });
    }
    return options;
  }, [targetWakeTime]);

  // حفظ سجل النوم
  const handleSaveSleep = (e) => {
    e.preventDefault();
    const dur = calculateDuration(bedTime, wakeTime);
    const newEntry = {
      id: uid(),
      date: logDate,
      bedTime,
      wakeTime,
      hours: dur.decimal,
      cycles: dur.cycles,
      quality: sleepQuality,
      notes: sleepNotes.trim(),
      loggedAt: new Date().toISOString(),
    };

    setSleepLogs((prev) => [newEntry, ...prev.filter((l) => l.date !== logDate)]);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  };

  // حذف سجل
  const handleDeleteLog = (id) => {
    setSleepLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // إحصائيات الأسبوع ودين النوم (Sleep Debt)
  const stats = useMemo(() => {
    if (sleepLogs.length === 0) {
      return { avgHours: 0, sleepDebt: 0, totalLogs: 0, qualityAvg: 0 };
    }
    const recent = sleepLogs.slice(0, 7);
    const sumHours = recent.reduce((acc, curr) => acc + Number(curr.hours || 0), 0);
    const avg = +(sumHours / recent.length).toFixed(1);

    // المعدل الصحي الموصى به = 7.5 إلى 8 ساعات يومياً (7.5 * عدد الأيام)
    const idealHours = recent.length * 7.5;
    const debt = +(idealHours - sumHours).toFixed(1);

    const sumQuality = recent.reduce((acc, curr) => acc + Number(curr.quality || 3), 0);
    const qAvg = +(sumQuality / recent.length).toFixed(1);

    return {
      avgHours: avg,
      sleepDebt: debt,
      totalLogs: sleepLogs.length,
      qualityAvg: qAvg,
    };
  }, [sleepLogs]);

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto font-sans" dir="rtl">
      {/* رأس الصفحة الفخم */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0c0d1c] via-[#090a14] to-[#04040a] p-6 sm:p-10 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
              <Moon size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  مختبر النوم والتعافي
                </h2>
                <Badge tint={T.sky}>Sleep Lab</Badge>
              </div>
              <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-md">
                النوم ليس إهداراً للوقت بل هو شرط التركيز وعصب الانضباط. اضبط دوراتك البيولوجية واستيقظ في قمة صفاء ذهنك.
              </p>
            </div>
          </div>

          {/* مؤشرات التعافي السريع */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-center">
              <span className="text-[10px] font-bold text-white/40 block mb-0.5">معدل نومك</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-black text-white font-mono">{stats.avgHours || "—"}</span>
                <span className="text-[10px] text-white/50">س/ليلة</span>
              </div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-center">
              <span className="text-[10px] font-bold text-white/40 block mb-0.5">دين النوم</span>
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className={`text-2xl font-black font-mono ${
                    stats.sleepDebt > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {stats.sleepDebt > 0 ? `-${stats.sleepDebt}` : "0"}
                </span>
                <span className="text-[10px] text-white/50">ساعات</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔄 القسم الأول: حاسبة دورات النوم الذكية (90-Minute Sleep Cycles) */}
      <Card className="p-6 sm:p-8 border border-white/10 bg-white/[0.02] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-400" />
              حاسبة دورات النوم (The 90-Minute Rule)
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              كل دورة نوم تستغرق 90 دقيقة. الاستيقاظ في نهاية الدورة يجعلك نشيطاً متيقظاً بدون خمول.
            </p>
          </div>

          {/* أزرار التبديل */}
          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              type="button"
              onClick={() => setCalcMode("sleep_now")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                calcMode === "sleep_now"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              إذا نمت الآن 😴
            </button>
            <button
              type="button"
              onClick={() => setCalcMode("wake_at")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                calcMode === "wake_at"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              }`}
            >
              أريد الاستيقاظ في وقت محدد ⏰
            </button>
          </div>
        </div>

        {calcMode === "sleep_now" ? (
          <div>
            <p className="text-xs font-bold text-indigo-300 mb-3 flex items-center gap-1.5">
              <Clock size={14} /> إذا دخلت فراشك الآن، اضبط منبهك على أحد هذه الأوقات:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {wakeUpOptions.map((opt) => (
                <div
                  key={opt.cycles}
                  className="p-4 rounded-2xl border transition-all flex flex-col justify-between"
                  style={{
                    borderColor: `${opt.tint}35`,
                    background: `${opt.tint}0A`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10.5px] font-black px-2 py-0.5 rounded-md border" style={{ borderColor: `${opt.tint}40`, color: opt.tint }}>
                      {opt.tag}
                    </span>
                    <span className="text-[11px] font-bold text-white/40">{opt.cycles} دورات</span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono tracking-tight my-1">
                    {opt.time}
                  </div>
                  <span className="text-[11px] text-white/50 font-bold">
                    إجمالي {opt.hours} ساعة نوم
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 max-w-xs">
              <label className="text-xs font-bold text-white/70 whitespace-nowrap">
                وقت الاستيقاظ المطلوب:
              </label>
              <input
                type="time"
                value={targetWakeTime}
                onChange={(e) => setTargetWakeTime(e.target.value)}
                className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-sm font-mono text-white outline-none focus:border-indigo-400"
              />
            </div>

            <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Bed size={14} /> للاستيقاظ بنشاط تام الساعة {targetWakeTime}، ادخل فراشك في أحد الأوقات:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {bedtimeOptions.map((opt) => (
                <div
                  key={opt.cycles}
                  className="p-4 rounded-2xl border transition-all flex flex-col justify-between"
                  style={{
                    borderColor: `${opt.tint}35`,
                    background: `${opt.tint}0A`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10.5px] font-black px-2 py-0.5 rounded-md border" style={{ borderColor: `${opt.tint}40`, color: opt.tint }}>
                      {opt.tag}
                    </span>
                    <span className="text-[11px] font-bold text-white/40">{opt.cycles} دورات</span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono tracking-tight my-1">
                    {opt.time}
                  </div>
                  <span className="text-[11px] text-white/50 font-bold">
                    إجمالي {opt.hours} ساعة نوم
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 🛌 القسم الثاني: تسجيل ومتابعة النوم (Sleep Logger & Debt) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* نموذج تسجيل الليلة الماضية */}
        <Card className="md:col-span-1 lg:col-span-1 p-6 border border-white/10 bg-white/[0.02] space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Bed size={16} className="text-sky-400" />
            تسجيل ليلة نوم
          </h3>

          <form onSubmit={handleSaveSleep} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-white/60 mb-1">التاريخ</label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-sky-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-white/60 mb-1">وقت النوم</label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/60 mb-1">الاستيقاظ</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/60 mb-1">
                جودة النوم ({sleepQuality} من 5)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSleepQuality(num)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sleepQuality === num
                        ? "bg-indigo-600 text-white border border-indigo-400"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {num === 5 ? "🌟" : num === 4 ? "✨" : num === 3 ? "☕" : num === 2 ? "🌧️" : "⚡"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/60 mb-1">ملاحظات (اختياري)</label>
              <input
                type="text"
                value={sleepNotes}
                onChange={(e) => setSleepNotes(e.target.value)}
                placeholder="قهوة متأخرة، استيقاظ للصلاة..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-sky-400"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-black text-white shadow-lg transition-all active:scale-95 mt-2"
            >
              <CheckCircle2 size={15} />
              حفظ السجل
            </button>

            {saveNotice && (
              <p className="text-[11px] font-bold text-emerald-400 text-center animate-pulse">
                ✓ تم حفظ بيانات النوم بنجاح!
              </p>
            )}
          </form>
        </Card>

        {/* سجل الليالي السابقة وتحليل دين النوم */}
        <Card className="md:col-span-1 lg:col-span-2 p-6 border border-white/10 bg-white/[0.02] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calendar size={16} className="text-indigo-400" />
                سجل الليالي الأخيرة ({sleepLogs.length})
              </h3>

              {stats.sleepDebt > 2 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                  <ShieldAlert size={14} /> تنبيه: لديك عجز {stats.sleepDebt} ساعة هذا الأسبوع
                </div>
              )}
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {sleepLogs.length === 0 ? (
                <div className="py-12 text-center text-white/40 text-xs">
                  لا توجد ليالي مسجلة حتى الآن. يمكنك التسجيل من النموذج أو إرسال «نمت ٧ ساعات» للبوت في تيليجرام.
                </div>
              ) : (
                sleepLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl border border-white/5 bg-black/30 flex items-center justify-between gap-3 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <Moon size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white font-mono">{log.date}</span>
                          <span className="text-[10px] text-white/40">
                            ({log.bedTime} ➔ {log.wakeTime})
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left font-mono">
                        <span className="text-base font-black text-emerald-400">{log.hours}h</span>
                        <span className="text-[10px] text-white/40 block">
                          {log.cycles} دورة
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 text-white/20 hover:text-rose-400 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* نصيحة الذكاء الاصطناعي للتعافي */}
          <div className="p-3.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3">
            <Sparkles size={16} className="text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-white/75">
              {stats.sleepDebt > 3
                ? "💡 توصية التعافي: عجز نومك مرتفع نسبياً. خذ قيلولة طاقة (Power Nap) لمدة 20 دقيقة بين الظهر والعصر دون أن تتجاوزها."
                : "💡 إيقاعك ممتاز ومستقر. حافظ على وقت استيقاظ موحد لتدريب ساعتك البيولوجية على إفراز هرمون الطاقة تلقائياً كل صباح."}
            </p>
          </div>
        </Card>
      </div>

      {/* 🕯️ القسم الثالث: بروتوكول الغروب الرقمي (Wind-Down Routine) */}
      <Card className="p-6 sm:p-7 border border-white/10 bg-white/[0.02] space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Sun size={17} className="text-amber-400" />
          بروتوكول الغروب الرقمي قبل النوم بـ 45 دقيقة
        </h3>
        <p className="text-xs text-white/50 leading-relaxed">
          تهيئة الدماغ تبدأ قبل وضع رأسك على الوسادة. تحضير هرمون الميلاتونين يحتاج بيئة مظلمة وذهناً غير مشحون بالأخبار.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl border border-white/5 bg-black/40 flex items-center gap-3">
            <span className="text-xl">📴</span>
            <div>
              <h4 className="text-xs font-black text-white">إيقاف الشاشات</h4>
              <p className="text-[10px] text-white/40">تفعيل وضع النوم بالجوال</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-white/5 bg-black/40 flex items-center gap-3">
            <span className="text-xl">🧊</span>
            <div>
              <h4 className="text-xs font-black text-white">تبريد الغرفة</h4>
              <p className="text-[10px] text-white/40">درجة حرارة 19-21 مئوية</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-white/5 bg-black/40 flex items-center gap-3">
            <span className="text-xl">📿</span>
            <div>
              <h4 className="text-xs font-black text-white">أذكار وتفريغ</h4>
              <p className="text-[10px] text-white/40">تفريغ الخواطر في الوارد</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-white/5 bg-black/40 flex items-center gap-3">
            <span className="text-xl">💧</span>
            <div>
              <h4 className="text-xs font-black text-white">رشفة ماء بارد</h4>
              <p className="text-[10px] text-white/40">تجنب الجفاف أثناء الليل</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
